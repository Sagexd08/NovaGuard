const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Enhanced logging
const log = {
  info: (msg) => console.log(`\x1b[36m[${new Date().toISOString()}] ℹ️  ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m[${new Date().toISOString()}] ✅ ${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m[${new Date().toISOString()}] ⚠️  ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m[${new Date().toISOString()}] ❌ ${msg}\x1b[0m`),
  api: (msg) => console.log(`\x1b[35m[${new Date().toISOString()}] 🔌 ${msg}\x1b[0m`)
};

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced middleware stack
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Enhanced request logging
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms', {
  stream: {
    write: (message) => log.api(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    services: {
      api: 'healthy',
      database: 'checking...',
      external_apis: 'checking...'
    }
  };

  // Simulate service checks
  setTimeout(() => {
    healthCheck.services.database = 'healthy';
    healthCheck.services.external_apis = 'healthy';
  }, 100);

  res.status(200).json(healthCheck);
});

// Enhanced API routes
app.use('/api', require('./index'));

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Flash Audit API',
    version: '2.0.0',
    description: 'Enhanced API for smart contract auditing and analysis',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      },
      status: {
        method: 'GET', 
        path: '/functions/v1/status',
        description: 'Service status check'
      },
      audit: {
        method: 'POST',
        path: '/functions/v1/audit',
        description: 'Audit smart contract for vulnerabilities',
        body: {
          contractAddress: 'string (optional)',
          contractCode: 'string (optional)',
          chain: 'string (default: ethereum)',
          name: 'string (optional)',
          description: 'string (optional)'
        }
      },
      projects: {
        method: 'GET|POST',
        path: '/functions/v1/projects',
        description: 'Manage audit projects'
      },
      compile: {
        method: 'POST',
        path: '/functions/v1/compile',
        description: 'Compile smart contract',
        body: {
          contractCode: 'string (required)',
          contractName: 'string (optional)'
        }
      },
      templates: {
        method: 'GET',
        path: '/functions/v1/templates',
        description: 'Get contract templates'
      }
    },
    examples: {
      audit: {
        url: `http://localhost:${PORT}/api/functions/v1/audit`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          contractCode: 'pragma solidity ^0.8.0; contract Example { uint256 public value; }',
          name: 'Example Contract',
          chain: 'ethereum'
        }
      }
    }
  };

  res.json(apiDocs);
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  log.error(`Request ${req.id} failed: ${err.message}`);
  log.error(`Stack: ${err.stack}`);

  const errorResponse = {
    error: true,
    message: err.message,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  log.warning(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /api/docs',
      'GET /api/functions/v1/status',
      'POST /api/functions/v1/audit',
      'GET|POST /api/functions/v1/projects',
      'POST /api/functions/v1/compile',
      'GET /api/functions/v1/templates'
    ]
  });
});

// Enhanced server startup
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  log.success('🚀 Enhanced Flash Audit API Server Started!');
  console.log('='.repeat(60));
  console.log(`🔌 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🔍 Status: http://localhost:${PORT}/api/functions/v1/status`);
  console.log('='.repeat(60));
  console.log('🛡️  Security Features:');
  console.log('  • Helmet security headers');
  console.log('  • Rate limiting');
  console.log('  • CORS protection');
  console.log('  • Request compression');
  console.log('  • Request ID tracing');
  console.log('='.repeat(60));
  console.log('📝 Logging:');
  console.log('  • Enhanced request logging');
  console.log('  • Error tracking with stack traces');
  console.log('  • Performance monitoring');
  console.log('='.repeat(60));
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`Process ID: ${process.pid}`);
  log.info(`Node.js version: ${process.version}`);
  console.log('='.repeat(60) + '\n');
});

// Enhanced graceful shutdown
const gracefulShutdown = (signal) => {
  log.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      log.error(`Error during server shutdown: ${err.message}`);
      process.exit(1);
    }
    
    log.success('Server closed successfully');
    log.info('Cleaning up resources...');
    
    // Add any cleanup logic here (database connections, etc.)
    
    setTimeout(() => {
      log.success('Graceful shutdown completed');
      process.exit(0);
    }, 1000);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log.error(`Uncaught Exception: ${err.message}`);
  log.error(`Stack: ${err.stack}`);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
