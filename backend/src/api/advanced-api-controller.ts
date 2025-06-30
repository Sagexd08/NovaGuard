import { Request, Response, NextFunction } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { Logger } from 'winston'
import { Redis } from 'ioredis'
import rateLimit from 'express-rate-limit'
import { AdvancedAnalysisService, AnalysisRequest } from '../services/advanced-analysis-service'
import { AIAgentService, AgentRequest } from '../services/ai-agent-service'
import { RealTimeCollaborationService } from '../services/real-time-collaboration-service'

// Advanced API interfaces
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: {
    timestamp: string
    requestId: string
    version: string
    rateLimit?: {
      limit: number
      remaining: number
      reset: Date
    }
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface AnalysisRequestBody {
  sourceCode: string
  sourceType: 'solidity' | 'move' | 'rust' | 'go' | 'bytecode'
  blockchain: string
  analysisType: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
  options?: {
    enableStaticAnalysis?: boolean
    enableDynamicAnalysis?: boolean
    enableFormalVerification?: boolean
    enableGasOptimization?: boolean
    enableComplianceCheck?: boolean
    enableThreatModeling?: boolean
    customRules?: string[]
    excludePatterns?: string[]
    maxExecutionTime?: number
    confidenceThreshold?: number
    reportFormat?: 'json' | 'pdf' | 'html' | 'markdown'
  }
}

export interface AIRequestBody {
  agentId: string
  type: string
  input: {
    sourceCode?: string
    contractAddress?: string
    blockchain?: string
    language?: string
    framework?: string
    query?: string
    files?: Array<{
      name: string
      content: string
      type: string
      path: string
    }>
    metadata?: Record<string, any>
  }
  context?: {
    projectId?: string
    sessionId?: string
    previousRequests?: string[]
    userPreferences?: Record<string, any>
    environmentInfo?: Record<string, any>
  }
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  timeout?: number
}

export class AdvancedAPIController {
  private analysisService: AdvancedAnalysisService
  private aiService: AIAgentService
  private collaborationService: RealTimeCollaborationService
  private redis: Redis
  private logger: Logger

  constructor(
    analysisService: AdvancedAnalysisService,
    aiService: AIAgentService,
    collaborationService: RealTimeCollaborationService,
    redis: Redis,
    logger: Logger
  ) {
    this.analysisService = analysisService
    this.aiService = aiService
    this.collaborationService = collaborationService
    this.redis = redis
    this.logger = logger
  }

  // Rate limiting middleware
  createRateLimit = (windowMs: number, max: number) => {
    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        error: 'Too many requests, please try again later',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '',
          version: '1.0.0'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  }

  // Validation middleware
  validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return this.sendError(res, 'Validation failed', 400, {
        validationErrors: errors.array()
      })
    }
    next()
  }

  // Authentication middleware
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return this.sendError(res, 'Authentication required', 401)
      }

      // Verify JWT token
      const user = await this.verifyToken(token)
      req.user = user
      next()
    } catch (error) {
      return this.sendError(res, 'Invalid authentication token', 401)
    }
  }

  // Authorization middleware
  authorize = (permissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = req.user
      if (!user) {
        return this.sendError(res, 'Authentication required', 401)
      }

      const hasPermission = permissions.some(permission => 
        user.permissions?.includes(permission)
      )

      if (!hasPermission) {
        return this.sendError(res, 'Insufficient permissions', 403)
      }

      next()
    }
  }

  // Analysis endpoints
  submitAnalysis = [
    body('sourceCode').notEmpty().withMessage('Source code is required'),
    body('sourceType').isIn(['solidity', 'move', 'rust', 'go', 'bytecode']).withMessage('Invalid source type'),
    body('blockchain').notEmpty().withMessage('Blockchain is required'),
    body('analysisType').isArray().withMessage('Analysis type must be an array'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const requestBody: AnalysisRequestBody = req.body
        const user = req.user

        const analysisRequest: AnalysisRequest = {
          id: this.generateId(),
          userId: user.id,
          projectId: req.body.projectId || 'default',
          sourceCode: requestBody.sourceCode,
          sourceType: requestBody.sourceType,
          blockchain: requestBody.blockchain,
          analysisType: requestBody.analysisType,
          priority: requestBody.priority || 'medium',
          options: {
            enableStaticAnalysis: true,
            enableDynamicAnalysis: false,
            enableFormalVerification: false,
            enableGasOptimization: true,
            enableComplianceCheck: false,
            enableThreatModeling: false,
            customRules: [],
            excludePatterns: [],
            maxExecutionTime: 300000, // 5 minutes
            confidenceThreshold: 0.8,
            reportFormat: 'json',
            ...requestBody.options
          },
          metadata: {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            timestamp: new Date().toISOString()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const jobId = await this.analysisService.submitAnalysis(analysisRequest)

        this.sendSuccess(res, {
          analysisId: analysisRequest.id,
          jobId,
          status: 'submitted',
          estimatedTime: '2-5 minutes'
        }, 'Analysis submitted successfully', 202)

      } catch (error) {
        this.logger.error('Failed to submit analysis', error)
        this.sendError(res, 'Failed to submit analysis', 500)
      }
    }
  ]

  getAnalysisResult = [
    param('analysisId').isUUID().withMessage('Invalid analysis ID'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { analysisId } = req.params
        const result = await this.analysisService.getAnalysisResult(analysisId)

        if (!result) {
          return this.sendError(res, 'Analysis not found', 404)
        }

        this.sendSuccess(res, result, 'Analysis result retrieved successfully')

      } catch (error) {
        this.logger.error('Failed to get analysis result', error)
        this.sendError(res, 'Failed to get analysis result', 500)
      }
    }
  ]

  getAnalysisStatus = [
    param('analysisId').isUUID().withMessage('Invalid analysis ID'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { analysisId } = req.params
        const result = await this.analysisService.getAnalysisResult(analysisId)

        if (!result) {
          return this.sendError(res, 'Analysis not found', 404)
        }

        this.sendSuccess(res, {
          id: result.id,
          status: result.status,
          progress: result.progress,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          executionTime: result.executionTime
        }, 'Analysis status retrieved successfully')

      } catch (error) {
        this.logger.error('Failed to get analysis status', error)
        this.sendError(res, 'Failed to get analysis status', 500)
      }
    }
  ]

  cancelAnalysis = [
    param('analysisId').isUUID().withMessage('Invalid analysis ID'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { analysisId } = req.params
        const cancelled = await this.analysisService.cancelAnalysis(analysisId)

        if (!cancelled) {
          return this.sendError(res, 'Analysis not found or cannot be cancelled', 404)
        }

        this.sendSuccess(res, { cancelled: true }, 'Analysis cancelled successfully')

      } catch (error) {
        this.logger.error('Failed to cancel analysis', error)
        this.sendError(res, 'Failed to cancel analysis', 500)
      }
    }
  ]

  // AI Agent endpoints
  submitAIRequest = [
    body('agentId').notEmpty().withMessage('Agent ID is required'),
    body('type').notEmpty().withMessage('Request type is required'),
    body('input').isObject().withMessage('Input must be an object'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const requestBody: AIRequestBody = req.body
        const user = req.user

        const agentRequest: AgentRequest = {
          id: this.generateId(),
          agentId: requestBody.agentId,
          userId: user.id,
          type: requestBody.type as any,
          input: requestBody.input,
          context: {
            projectId: requestBody.context?.projectId,
            sessionId: requestBody.context?.sessionId,
            previousRequests: requestBody.context?.previousRequests || [],
            userPreferences: requestBody.context?.userPreferences || {},
            environmentInfo: {
              userAgent: req.headers['user-agent'],
              ip: req.ip,
              ...requestBody.context?.environmentInfo
            }
          },
          priority: requestBody.priority || 'medium',
          timeout: requestBody.timeout || 30000,
          createdAt: new Date()
        }

        const response = await this.aiService.processRequest(agentRequest)

        this.sendSuccess(res, response, 'AI request processed successfully')

      } catch (error) {
        this.logger.error('Failed to process AI request', error)
        this.sendError(res, 'Failed to process AI request', 500)
      }
    }
  ]

  getAIAgents = async (req: Request, res: Response) => {
    try {
      const agents = await this.aiService.listAgents()
      this.sendSuccess(res, agents, 'AI agents retrieved successfully')
    } catch (error) {
      this.logger.error('Failed to get AI agents', error)
      this.sendError(res, 'Failed to get AI agents', 500)
    }
  }

  getAIAgentMetrics = [
    param('agentId').notEmpty().withMessage('Agent ID is required'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { agentId } = req.params
        const metrics = await this.aiService.getAgentMetrics(agentId)

        if (!metrics) {
          return this.sendError(res, 'Agent not found', 404)
        }

        this.sendSuccess(res, metrics, 'Agent metrics retrieved successfully')

      } catch (error) {
        this.logger.error('Failed to get agent metrics', error)
        this.sendError(res, 'Failed to get agent metrics', 500)
      }
    }
  ]

  // Collaboration endpoints
  createCollaborationSession = [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('name').notEmpty().withMessage('Session name is required'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { projectId, name, description, settings } = req.body
        const user = req.user

        const session = await this.collaborationService.createSession(
          projectId,
          user.id,
          name,
          settings
        )

        this.sendSuccess(res, session, 'Collaboration session created successfully', 201)

      } catch (error) {
        this.logger.error('Failed to create collaboration session', error)
        this.sendError(res, 'Failed to create collaboration session', 500)
      }
    }
  ]

  getUserSessions = async (req: Request, res: Response) => {
    try {
      const user = req.user
      const sessions = await this.collaborationService.getSessionsByUser(user.id)
      this.sendSuccess(res, sessions, 'User sessions retrieved successfully')
    } catch (error) {
      this.logger.error('Failed to get user sessions', error)
      this.sendError(res, 'Failed to get user sessions', 500)
    }
  }

  addDocumentToSession = [
    param('sessionId').isUUID().withMessage('Invalid session ID'),
    body('name').notEmpty().withMessage('Document name is required'),
    body('type').isIn(['contract', 'test', 'script', 'config', 'documentation']).withMessage('Invalid document type'),
    body('language').notEmpty().withMessage('Language is required'),
    this.validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params
        const { name, type, language, content } = req.body

        const document = await this.collaborationService.addDocument(
          sessionId,
          name,
          type,
          language,
          content || ''
        )

        this.sendSuccess(res, document, 'Document added to session successfully', 201)

      } catch (error) {
        this.logger.error('Failed to add document to session', error)
        this.sendError(res, 'Failed to add document to session', 500)
      }
    }
  ]

  // System endpoints
  getSystemHealth = async (req: Request, res: Response) => {
    try {
      const queueStatus = await this.analysisService.getQueueStatus()
      const redisStatus = await this.checkRedisHealth()
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          analysis: {
            status: 'healthy',
            queue: queueStatus
          },
          ai: {
            status: 'healthy'
          },
          collaboration: {
            status: 'healthy'
          },
          redis: {
            status: redisStatus ? 'healthy' : 'unhealthy'
          }
        },
        version: '1.0.0'
      }

      this.sendSuccess(res, health, 'System health retrieved successfully')

    } catch (error) {
      this.logger.error('Failed to get system health', error)
      this.sendError(res, 'Failed to get system health', 500)
    }
  }

  // Utility methods
  private sendSuccess<T>(
    res: Response, 
    data: T, 
    message: string = 'Success', 
    statusCode: number = 200
  ): void {
    const response: APIResponse<T> = {
      success: true,
      data,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.generateId(),
        version: '1.0.0'
      }
    }

    res.status(statusCode).json(response)
  }

  private sendError(
    res: Response, 
    error: string, 
    statusCode: number = 500, 
    additionalData?: any
  ): void {
    const response: APIResponse = {
      success: false,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.generateId(),
        version: '1.0.0'
      },
      ...additionalData
    }

    res.status(statusCode).json(response)
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async verifyToken(token: string): Promise<any> {
    // Implement JWT verification
    // Return user object with id, permissions, etc.
    return {
      id: 'user-123',
      email: 'user@example.com',
      permissions: ['read', 'write', 'admin']
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }
}
