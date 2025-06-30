import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { Logger } from 'winston'
import { Redis } from 'ioredis'
import { EventEmitter } from 'events'
import jwt from 'jsonwebtoken'

// WebSocket interfaces
export interface WebSocketUser {
  id: string
  email: string
  username: string
  avatar?: string
  permissions: string[]
  projects: string[]
  organizations: string[]
}

export interface WebSocketSession {
  id: string
  userId: string
  socketId: string
  projectId?: string
  sessionId?: string
  joinedAt: Date
  lastActivity: Date
  metadata: Record<string, any>
}

export interface WebSocketEvent {
  type: string
  namespace: string
  room?: string
  data: any
  userId?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface RealTimeNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  userId?: string
  projectId?: string
  sessionId?: string
  data?: any
  persistent: boolean
  expiresAt?: Date
  createdAt: Date
}

export interface AnalysisProgress {
  analysisId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  stage: string
  message: string
  findings?: number
  estimatedTimeRemaining?: number
  timestamp: Date
}

export interface CollaborationUpdate {
  sessionId: string
  documentId: string
  type: 'cursor' | 'selection' | 'edit' | 'comment' | 'suggestion'
  userId: string
  username: string
  data: any
  timestamp: Date
}

export interface SystemAlert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  service: string
  title: string
  message: string
  affectedUsers?: string[]
  data?: any
  resolved: boolean
  createdAt: Date
  resolvedAt?: Date
}

export class WebSocketService extends EventEmitter {
  private io: SocketIOServer
  private redis: Redis
  private logger: Logger
  private sessions: Map<string, WebSocketSession> = new Map()
  private userSockets: Map<string, Set<string>> = new Map()
  private socketUsers: Map<string, string> = new Map()
  private jwtSecret: string

  constructor(
    server: HTTPServer,
    redis: Redis,
    logger: Logger,
    jwtSecret: string,
    options: {
      cors?: any
      transports?: string[]
      pingTimeout?: number
      pingInterval?: number
    } = {}
  ) {
    super()
    this.redis = redis
    this.logger = logger
    this.jwtSecret = jwtSecret

    // Initialize Socket.IO server
    this.io = new SocketIOServer(server, {
      cors: options.cors || {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: options.transports || ['websocket', 'polling'],
      pingTimeout: options.pingTimeout || 60000,
      pingInterval: options.pingInterval || 25000,
    })

    this.setupMiddleware()
    this.setupEventHandlers()
    this.setupRedisSubscriptions()
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const decoded = jwt.verify(token, this.jwtSecret) as any
        const user = await this.getUserById(decoded.userId)
        
        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.user = user
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })

    // Rate limiting middleware
    this.io.use((socket, next) => {
      // Implement rate limiting logic
      next()
    })
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket)

      // Project events
      socket.on('join-project', (data) => this.handleJoinProject(socket, data))
      socket.on('leave-project', (data) => this.handleLeaveProject(socket, data))

      // Collaboration events
      socket.on('join-collaboration', (data) => this.handleJoinCollaboration(socket, data))
      socket.on('leave-collaboration', (data) => this.handleLeaveCollaboration(socket, data))
      socket.on('collaboration-update', (data) => this.handleCollaborationUpdate(socket, data))

      // Analysis events
      socket.on('subscribe-analysis', (data) => this.handleSubscribeAnalysis(socket, data))
      socket.on('unsubscribe-analysis', (data) => this.handleUnsubscribeAnalysis(socket, data))

      // Notification events
      socket.on('mark-notification-read', (data) => this.handleMarkNotificationRead(socket, data))
      socket.on('subscribe-notifications', () => this.handleSubscribeNotifications(socket))

      // System events
      socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }))
      socket.on('heartbeat', () => this.handleHeartbeat(socket))

      // Disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket))
    })
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to Redis channels for cross-instance communication
    const channels = [
      'websocket:notifications',
      'websocket:analysis-progress',
      'websocket:collaboration-updates',
      'websocket:system-alerts'
    ]

    channels.forEach(channel => {
      this.redis.subscribe(channel)
    })

    this.redis.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message)
        this.handleRedisMessage(channel, data)
      } catch (error) {
        this.logger.error('Failed to parse Redis message', { channel, message, error })
      }
    })
  }

  private handleConnection(socket: Socket): void {
    const user = socket.data.user as WebSocketUser
    
    this.logger.info(`User connected: ${user.username} (${socket.id})`)

    // Create session
    const session: WebSocketSession = {
      id: this.generateId(),
      userId: user.id,
      socketId: socket.id,
      joinedAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      }
    }

    this.sessions.set(socket.id, session)
    this.socketUsers.set(socket.id, user.id)

    // Track user sockets
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set())
    }
    this.userSockets.get(user.id)!.add(socket.id)

    // Send initial data
    socket.emit('connected', {
      sessionId: session.id,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      timestamp: new Date().toISOString()
    })

    // Send pending notifications
    this.sendPendingNotifications(socket, user.id)

    this.emit('user:connected', { user, socket, session })
  }

  private handleJoinProject(socket: Socket, data: { projectId: string }): void {
    const session = this.sessions.get(socket.id)
    if (!session) return

    const user = socket.data.user as WebSocketUser
    
    // Check if user has access to project
    if (!user.projects.includes(data.projectId)) {
      socket.emit('error', { type: 'join-project', message: 'Access denied' })
      return
    }

    session.projectId = data.projectId
    session.lastActivity = new Date()

    socket.join(`project:${data.projectId}`)
    socket.emit('project-joined', { projectId: data.projectId })

    // Notify other project members
    socket.to(`project:${data.projectId}`).emit('user-joined-project', {
      userId: user.id,
      username: user.username,
      projectId: data.projectId
    })

    this.logger.info(`User ${user.username} joined project ${data.projectId}`)
  }

  private handleLeaveProject(socket: Socket, data: { projectId: string }): void {
    const session = this.sessions.get(socket.id)
    if (!session) return

    const user = socket.data.user as WebSocketUser

    socket.leave(`project:${data.projectId}`)
    socket.emit('project-left', { projectId: data.projectId })

    // Notify other project members
    socket.to(`project:${data.projectId}`).emit('user-left-project', {
      userId: user.id,
      username: user.username,
      projectId: data.projectId
    })

    if (session.projectId === data.projectId) {
      session.projectId = undefined
    }

    this.logger.info(`User ${user.username} left project ${data.projectId}`)
  }

  private handleJoinCollaboration(socket: Socket, data: { sessionId: string }): void {
    const session = this.sessions.get(socket.id)
    if (!session) return

    const user = socket.data.user as WebSocketUser

    session.sessionId = data.sessionId
    session.lastActivity = new Date()

    socket.join(`collaboration:${data.sessionId}`)
    socket.emit('collaboration-joined', { sessionId: data.sessionId })

    // Notify other collaborators
    socket.to(`collaboration:${data.sessionId}`).emit('user-joined-collaboration', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      sessionId: data.sessionId
    })

    this.logger.info(`User ${user.username} joined collaboration ${data.sessionId}`)
  }

  private handleLeaveCollaboration(socket: Socket, data: { sessionId: string }): void {
    const session = this.sessions.get(socket.id)
    if (!session) return

    const user = socket.data.user as WebSocketUser

    socket.leave(`collaboration:${data.sessionId}`)
    socket.emit('collaboration-left', { sessionId: data.sessionId })

    // Notify other collaborators
    socket.to(`collaboration:${data.sessionId}`).emit('user-left-collaboration', {
      userId: user.id,
      username: user.username,
      sessionId: data.sessionId
    })

    if (session.sessionId === data.sessionId) {
      session.sessionId = undefined
    }

    this.logger.info(`User ${user.username} left collaboration ${data.sessionId}`)
  }

  private handleCollaborationUpdate(socket: Socket, data: CollaborationUpdate): void {
    const user = socket.data.user as WebSocketUser
    
    // Validate and enrich the update
    const update: CollaborationUpdate = {
      ...data,
      userId: user.id,
      username: user.username,
      timestamp: new Date()
    }

    // Broadcast to collaboration room
    socket.to(`collaboration:${data.sessionId}`).emit('collaboration-update', update)

    // Publish to Redis for cross-instance communication
    this.publishToRedis('websocket:collaboration-updates', update)

    this.emit('collaboration:update', update)
  }

  private handleSubscribeAnalysis(socket: Socket, data: { analysisId: string }): void {
    socket.join(`analysis:${data.analysisId}`)
    socket.emit('analysis-subscribed', { analysisId: data.analysisId })
  }

  private handleUnsubscribeAnalysis(socket: Socket, data: { analysisId: string }): void {
    socket.leave(`analysis:${data.analysisId}`)
    socket.emit('analysis-unsubscribed', { analysisId: data.analysisId })
  }

  private handleMarkNotificationRead(socket: Socket, data: { notificationId: string }): void {
    const user = socket.data.user as WebSocketUser
    
    // Mark notification as read in database
    this.markNotificationAsRead(data.notificationId, user.id)
    
    socket.emit('notification-marked-read', { notificationId: data.notificationId })
  }

  private handleSubscribeNotifications(socket: Socket): void {
    const user = socket.data.user as WebSocketUser
    socket.join(`notifications:${user.id}`)
    socket.emit('notifications-subscribed')
  }

  private handleHeartbeat(socket: Socket): void {
    const session = this.sessions.get(socket.id)
    if (session) {
      session.lastActivity = new Date()
    }
    socket.emit('heartbeat-ack', { timestamp: Date.now() })
  }

  private handleDisconnect(socket: Socket): void {
    const session = this.sessions.get(socket.id)
    if (!session) return

    const user = socket.data.user as WebSocketUser

    // Clean up session
    this.sessions.delete(socket.id)
    this.socketUsers.delete(socket.id)

    // Clean up user sockets
    const userSocketSet = this.userSockets.get(session.userId)
    if (userSocketSet) {
      userSocketSet.delete(socket.id)
      if (userSocketSet.size === 0) {
        this.userSockets.delete(session.userId)
      }
    }

    // Notify rooms about disconnection
    if (session.projectId) {
      socket.to(`project:${session.projectId}`).emit('user-disconnected', {
        userId: user.id,
        username: user.username,
        projectId: session.projectId
      })
    }

    if (session.sessionId) {
      socket.to(`collaboration:${session.sessionId}`).emit('user-disconnected', {
        userId: user.id,
        username: user.username,
        sessionId: session.sessionId
      })
    }

    this.logger.info(`User disconnected: ${user.username} (${socket.id})`)
    this.emit('user:disconnected', { user, socket, session })
  }

  private handleRedisMessage(channel: string, data: any): void {
    switch (channel) {
      case 'websocket:notifications':
        this.handleNotificationMessage(data)
        break
      case 'websocket:analysis-progress':
        this.handleAnalysisProgressMessage(data)
        break
      case 'websocket:collaboration-updates':
        this.handleCollaborationMessage(data)
        break
      case 'websocket:system-alerts':
        this.handleSystemAlertMessage(data)
        break
    }
  }

  private handleNotificationMessage(notification: RealTimeNotification): void {
    if (notification.userId) {
      // Send to specific user
      this.io.to(`notifications:${notification.userId}`).emit('notification', notification)
    } else if (notification.projectId) {
      // Send to project members
      this.io.to(`project:${notification.projectId}`).emit('notification', notification)
    } else {
      // Broadcast to all users
      this.io.emit('notification', notification)
    }
  }

  private handleAnalysisProgressMessage(progress: AnalysisProgress): void {
    this.io.to(`analysis:${progress.analysisId}`).emit('analysis-progress', progress)
  }

  private handleCollaborationMessage(update: CollaborationUpdate): void {
    this.io.to(`collaboration:${update.sessionId}`).emit('collaboration-update', update)
  }

  private handleSystemAlertMessage(alert: SystemAlert): void {
    if (alert.affectedUsers && alert.affectedUsers.length > 0) {
      // Send to specific users
      alert.affectedUsers.forEach(userId => {
        this.io.to(`notifications:${userId}`).emit('system-alert', alert)
      })
    } else {
      // Broadcast to all users
      this.io.emit('system-alert', alert)
    }
  }

  // Public API methods
  async sendNotification(notification: RealTimeNotification): Promise<void> {
    await this.publishToRedis('websocket:notifications', notification)
  }

  async sendAnalysisProgress(progress: AnalysisProgress): Promise<void> {
    await this.publishToRedis('websocket:analysis-progress', progress)
  }

  async sendSystemAlert(alert: SystemAlert): Promise<void> {
    await this.publishToRedis('websocket:system-alerts', alert)
  }

  async broadcastToProject(projectId: string, event: string, data: any): Promise<void> {
    this.io.to(`project:${projectId}`).emit(event, data)
  }

  async broadcastToCollaboration(sessionId: string, event: string, data: any): Promise<void> {
    this.io.to(`collaboration:${sessionId}`).emit(event, data)
  }

  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    const userSockets = this.userSockets.get(userId)
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data)
      })
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys())
  }

  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId)
  }

  getActiveSessionsCount(): number {
    return this.sessions.size
  }

  // Private utility methods
  private async publishToRedis(channel: string, data: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(data))
  }

  private async sendPendingNotifications(socket: Socket, userId: string): Promise<void> {
    // Fetch and send pending notifications for the user
    const notifications = await this.getPendingNotifications(userId)
    notifications.forEach(notification => {
      socket.emit('notification', notification)
    })
  }

  private async getUserById(userId: string): Promise<WebSocketUser | null> {
    // Implement user lookup logic
    // This would typically query your user database
    return {
      id: userId,
      email: 'user@example.com',
      username: `user_${userId}`,
      permissions: ['read', 'write'],
      projects: [],
      organizations: []
    }
  }

  private async getPendingNotifications(userId: string): Promise<RealTimeNotification[]> {
    // Implement notification lookup logic
    return []
  }

  private async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    // Implement notification read status update
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async shutdown(): Promise<void> {
    this.io.close()
    await this.redis.disconnect()
  }
}
