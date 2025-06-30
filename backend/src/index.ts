import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Redis } from 'ioredis'
import winston from 'winston'
import dotenv from 'dotenv'

// Import services
import { AdvancedAnalysisService } from './services/advanced-analysis-service'
import { AIAgentService } from './services/ai-agent-service'
import { RealTimeCollaborationService } from './services/real-time-collaboration-service'
import { WebSocketService } from './services/websocket-service'

// Import API controllers
import { AdvancedAPIController } from './api/advanced-api-controller'

// Load environment variables
dotenv.config()

// Configuration
const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://novaguard:novaguard_password@localhost:5432/novaguard',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  logLevel: process.env.LOG_LEVEL || 'info'
}

// Logger setup
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'novaguard-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

// Add console transport for development
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

async function startServer() {
  try {
    logger.info('Starting NovaGuard Backend Server...')

    // Initialize Redis
    const redis = new Redis(config.redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    })

    redis.on('connect', () => {
      logger.info('Connected to Redis')
    })

    redis.on('error', (err) => {
      logger.error('Redis connection error:', err)
    })

    // Initialize Express app
    const app = express()
    const server = createServer(app)

    // Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    })

    // Middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }))

    app.use(cors({
      origin: config.corsOrigin,
      credentials: true
    }))

    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Request logging
    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      next()
    })

    // Initialize services
    logger.info('Initializing services...')

    const analysisService = new AdvancedAnalysisService(redis, logger)
    const aiService = new AIAgentService(redis, logger, {
      openaiApiKey: config.openaiApiKey,
      anthropicApiKey: config.anthropicApiKey,
      googleApiKey: config.googleApiKey
    })
    const collaborationService = new RealTimeCollaborationService(io, redis, logger)
    const websocketService = new WebSocketService(server, redis, logger, config.jwtSecret)

    // Initialize API controller
    const apiController = new AdvancedAPIController(
      analysisService,
      aiService,
      collaborationService,
      redis,
      logger
    )

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv,
        services: {
          redis: redis.status,
          analysis: 'healthy',
          ai: 'healthy',
          collaboration: 'healthy'
        }
      })
    })

    // API routes
    app.use('/api/v1', createAPIRoutes(apiController))

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', err)
      res.status(500).json({
        success: false,
        error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          version: '1.0.0'
        }
      })
    })

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          version: '1.0.0'
        }
      })
    })

    // Start server
    server.listen(config.port, () => {
      logger.info(`NovaGuard Backend Server running on port ${config.port}`)
      logger.info(`Environment: ${config.nodeEnv}`)
      logger.info(`CORS Origin: ${config.corsOrigin}`)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...')
      
      await analysisService.shutdown()
      await websocketService.shutdown()
      await redis.disconnect()
      
      server.close(() => {
        logger.info('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...')
      
      await analysisService.shutdown()
      await websocketService.shutdown()
      await redis.disconnect()
      
      server.close(() => {
        logger.info('Server closed')
        process.exit(0)
      })
    })

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

function createAPIRoutes(controller: AdvancedAPIController): express.Router {
  const router = express.Router()

  // Rate limiting
  const generalLimit = controller.createRateLimit(15 * 60 * 1000, 100) // 100 requests per 15 minutes
  const analysisLimit = controller.createRateLimit(60 * 60 * 1000, 10) // 10 analysis requests per hour
  const aiLimit = controller.createRateLimit(60 * 60 * 1000, 50) // 50 AI requests per hour

  // Apply general rate limiting
  router.use(generalLimit)

  // Analysis endpoints
  router.post('/analysis', analysisLimit, controller.authenticate, controller.submitAnalysis)
  router.get('/analysis/:analysisId', controller.authenticate, controller.getAnalysisResult)
  router.get('/analysis/:analysisId/status', controller.authenticate, controller.getAnalysisStatus)
  router.delete('/analysis/:analysisId', controller.authenticate, controller.cancelAnalysis)

  // AI endpoints
  router.post('/ai/request', aiLimit, controller.authenticate, controller.submitAIRequest)
  router.get('/ai/agents', controller.authenticate, controller.getAIAgents)
  router.get('/ai/agents/:agentId/metrics', controller.authenticate, controller.getAIAgentMetrics)

  // Collaboration endpoints
  router.post('/collaboration/sessions', controller.authenticate, controller.createCollaborationSession)
  router.get('/collaboration/sessions', controller.authenticate, controller.getUserSessions)
  router.post('/collaboration/sessions/:sessionId/documents', controller.authenticate, controller.addDocumentToSession)

  // System endpoints
  router.get('/system/health', controller.getSystemHealth)

  return router
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
