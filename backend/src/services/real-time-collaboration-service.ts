import { EventEmitter } from 'events'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { Logger } from 'winston'
import { Redis } from 'ioredis'
import { v4 as uuidv4 } from 'uuid'

// Collaboration interfaces
export interface CollaborationSession {
  id: string
  projectId: string
  name: string
  description?: string
  ownerId: string
  participants: Participant[]
  documents: CollaborativeDocument[]
  settings: SessionSettings
  status: 'active' | 'paused' | 'ended'
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
}

export interface Participant {
  id: string
  userId: string
  username: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'guest'
  permissions: Permission[]
  cursor?: CursorPosition
  selection?: TextSelection
  status: 'online' | 'away' | 'offline'
  joinedAt: Date
  lastSeen: Date
}

export type Permission = 
  | 'read'
  | 'write'
  | 'comment'
  | 'suggest'
  | 'review'
  | 'admin'
  | 'deploy'
  | 'debug'

export interface SessionSettings {
  maxParticipants: number
  allowGuests: boolean
  requireApproval: boolean
  enableVoiceChat: boolean
  enableVideoChat: boolean
  enableScreenShare: boolean
  autoSave: boolean
  saveInterval: number
  conflictResolution: 'last-write-wins' | 'operational-transform' | 'manual'
  visibility: 'public' | 'private' | 'organization'
}

export interface CollaborativeDocument {
  id: string
  sessionId: string
  name: string
  type: 'contract' | 'test' | 'script' | 'config' | 'documentation'
  language: string
  content: string
  version: number
  operations: Operation[]
  cursors: Map<string, CursorPosition>
  selections: Map<string, TextSelection>
  comments: Comment[]
  suggestions: Suggestion[]
  locks: DocumentLock[]
  metadata: DocumentMetadata
  createdAt: Date
  updatedAt: Date
}

export interface Operation {
  id: string
  type: 'insert' | 'delete' | 'replace' | 'format'
  userId: string
  position: number
  length?: number
  content?: string
  timestamp: Date
  applied: boolean
  reverted: boolean
}

export interface CursorPosition {
  userId: string
  line: number
  column: number
  timestamp: Date
}

export interface TextSelection {
  userId: string
  start: { line: number; column: number }
  end: { line: number; column: number }
  timestamp: Date
}

export interface Comment {
  id: string
  userId: string
  username: string
  content: string
  position: { line: number; column: number }
  resolved: boolean
  replies: CommentReply[]
  createdAt: Date
  updatedAt: Date
}

export interface CommentReply {
  id: string
  userId: string
  username: string
  content: string
  createdAt: Date
}

export interface Suggestion {
  id: string
  userId: string
  username: string
  type: 'change' | 'addition' | 'deletion'
  description: string
  originalText: string
  suggestedText: string
  position: { line: number; column: number }
  status: 'pending' | 'accepted' | 'rejected'
  votes: SuggestionVote[]
  createdAt: Date
  updatedAt: Date
}

export interface SuggestionVote {
  userId: string
  vote: 'approve' | 'reject'
  comment?: string
  timestamp: Date
}

export interface DocumentLock {
  id: string
  userId: string
  type: 'line' | 'block' | 'function' | 'file'
  startLine: number
  endLine: number
  reason: string
  expiresAt: Date
  createdAt: Date
}

export interface DocumentMetadata {
  blockchain: string
  framework: string
  dependencies: string[]
  tags: string[]
  lastCompiled?: Date
  lastDeployed?: Date
  gasEstimate?: number
  securityScore?: number
}

export interface CollaborationEvent {
  type: string
  sessionId: string
  userId: string
  data: any
  timestamp: Date
}

export class RealTimeCollaborationService extends EventEmitter {
  private io: SocketIOServer
  private redis: Redis
  private logger: Logger
  private sessions: Map<string, CollaborationSession> = new Map()
  private userSessions: Map<string, Set<string>> = new Map()
  private socketSessions: Map<string, string> = new Map()

  constructor(io: SocketIOServer, redis: Redis, logger: Logger) {
    super()
    this.io = io
    this.redis = redis
    this.logger = logger

    this.setupSocketHandlers()
    this.setupRedisSubscriptions()
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info(`User connected: ${socket.id}`)

      // Authentication
      socket.on('authenticate', async (data: { token: string; userId: string }) => {
        try {
          // Verify token and get user info
          const user = await this.authenticateUser(data.token, data.userId)
          socket.data.user = user
          socket.emit('authenticated', { success: true, user })
        } catch (error) {
          socket.emit('authenticated', { success: false, error: error.message })
          socket.disconnect()
        }
      })

      // Join session
      socket.on('join-session', async (data: { sessionId: string }) => {
        try {
          await this.handleJoinSession(socket, data.sessionId)
        } catch (error) {
          socket.emit('error', { type: 'join-session', error: error.message })
        }
      })

      // Leave session
      socket.on('leave-session', async (data: { sessionId: string }) => {
        try {
          await this.handleLeaveSession(socket, data.sessionId)
        } catch (error) {
          socket.emit('error', { type: 'leave-session', error: error.message })
        }
      })

      // Document operations
      socket.on('document-operation', async (data: {
        sessionId: string
        documentId: string
        operation: Operation
      }) => {
        try {
          await this.handleDocumentOperation(socket, data)
        } catch (error) {
          socket.emit('error', { type: 'document-operation', error: error.message })
        }
      })

      // Cursor movement
      socket.on('cursor-move', async (data: {
        sessionId: string
        documentId: string
        position: CursorPosition
      }) => {
        try {
          await this.handleCursorMove(socket, data)
        } catch (error) {
          socket.emit('error', { type: 'cursor-move', error: error.message })
        }
      })

      // Text selection
      socket.on('text-select', async (data: {
        sessionId: string
        documentId: string
        selection: TextSelection
      }) => {
        try {
          await this.handleTextSelection(socket, data)
        } catch (error) {
          socket.emit('error', { type: 'text-select', error: error.message })
        }
      })

      // Comments
      socket.on('add-comment', async (data: {
        sessionId: string
        documentId: string
        comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
      }) => {
        try {
          await this.handleAddComment(socket, data)
        } catch (error) {
          socket.emit('error', { type: 'add-comment', error: error.message })
        }
      })

      // Suggestions
      socket.on('add-suggestion', async (data: {
        sessionId: string
        documentId: string
        suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'updatedAt' | 'votes'>
      }) => {
        try {
          await this.handleAddSuggestion(socket, data)
        } catch (error) {
          socket.emit('error', { type: 'add-suggestion', error: error.message })
        }
      })

      // Voice/Video chat
      socket.on('voice-offer', (data: { sessionId: string; offer: any }) => {
        this.handleVoiceOffer(socket, data)
      })

      socket.on('voice-answer', (data: { sessionId: string; answer: any }) => {
        this.handleVoiceAnswer(socket, data)
      })

      socket.on('ice-candidate', (data: { sessionId: string; candidate: any }) => {
        this.handleIceCandidate(socket, data)
      })

      // Disconnect
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket)
      })
    })
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to collaboration events from other instances
    this.redis.subscribe('collaboration:events')
    this.redis.on('message', (channel: string, message: string) => {
      if (channel === 'collaboration:events') {
        const event: CollaborationEvent = JSON.parse(message)
        this.handleRedisEvent(event)
      }
    })
  }

  private async handleJoinSession(socket: Socket, sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const user = socket.data.user
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check permissions
    if (!this.canJoinSession(user, session)) {
      throw new Error('Permission denied')
    }

    // Add participant
    const participant: Participant = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      role: this.getUserRole(user, session),
      permissions: this.getUserPermissions(user, session),
      status: 'online',
      joinedAt: new Date(),
      lastSeen: new Date(),
    }

    session.participants.push(participant)
    session.lastActivity = new Date()

    // Join socket room
    socket.join(sessionId)
    this.socketSessions.set(socket.id, sessionId)

    // Update user sessions
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set())
    }
    this.userSessions.get(user.id)!.add(sessionId)

    // Store updated session
    await this.storeSession(session)

    // Notify other participants
    socket.to(sessionId).emit('participant-joined', participant)

    // Send session data to new participant
    socket.emit('session-joined', {
      session,
      participant,
      documents: session.documents,
    })

    this.logger.info(`User ${user.username} joined session ${sessionId}`)
  }

  private async handleLeaveSession(socket: Socket, sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    const user = socket.data.user
    if (!user) return

    // Remove participant
    session.participants = session.participants.filter(p => p.userId !== user.id)
    session.lastActivity = new Date()

    // Leave socket room
    socket.leave(sessionId)
    this.socketSessions.delete(socket.id)

    // Update user sessions
    const userSessionSet = this.userSessions.get(user.id)
    if (userSessionSet) {
      userSessionSet.delete(sessionId)
      if (userSessionSet.size === 0) {
        this.userSessions.delete(user.id)
      }
    }

    // Store updated session
    await this.storeSession(session)

    // Notify other participants
    socket.to(sessionId).emit('participant-left', { userId: user.id })

    this.logger.info(`User ${user.username} left session ${sessionId}`)
  }

  private async handleDocumentOperation(socket: Socket, data: {
    sessionId: string
    documentId: string
    operation: Operation
  }): Promise<void> {
    const session = await this.getSession(data.sessionId)
    if (!session) throw new Error('Session not found')

    const document = session.documents.find(d => d.id === data.documentId)
    if (!document) throw new Error('Document not found')

    const user = socket.data.user
    if (!this.hasPermission(user, session, 'write')) {
      throw new Error('Write permission required')
    }

    // Apply operation using operational transform
    const transformedOperation = await this.applyOperationalTransform(document, data.operation)
    
    // Update document
    document.operations.push(transformedOperation)
    document.content = this.applyOperation(document.content, transformedOperation)
    document.version++
    document.updatedAt = new Date()

    // Store updated session
    await this.storeSession(session)

    // Broadcast to other participants
    socket.to(data.sessionId).emit('document-updated', {
      documentId: data.documentId,
      operation: transformedOperation,
      version: document.version,
    })

    // Publish to Redis for other instances
    await this.publishEvent({
      type: 'document-operation',
      sessionId: data.sessionId,
      userId: user.id,
      data: {
        documentId: data.documentId,
        operation: transformedOperation,
        version: document.version,
      },
      timestamp: new Date(),
    })
  }

  private async handleCursorMove(socket: Socket, data: {
    sessionId: string
    documentId: string
    position: CursorPosition
  }): Promise<void> {
    const session = await this.getSession(data.sessionId)
    if (!session) return

    const document = session.documents.find(d => d.id === data.documentId)
    if (!document) return

    const user = socket.data.user
    data.position.userId = user.id
    data.position.timestamp = new Date()

    // Update cursor position
    document.cursors.set(user.id, data.position)

    // Broadcast to other participants
    socket.to(data.sessionId).emit('cursor-moved', {
      documentId: data.documentId,
      position: data.position,
    })
  }

  private async handleTextSelection(socket: Socket, data: {
    sessionId: string
    documentId: string
    selection: TextSelection
  }): Promise<void> {
    const session = await this.getSession(data.sessionId)
    if (!session) return

    const document = session.documents.find(d => d.id === data.documentId)
    if (!document) return

    const user = socket.data.user
    data.selection.userId = user.id
    data.selection.timestamp = new Date()

    // Update selection
    document.selections.set(user.id, data.selection)

    // Broadcast to other participants
    socket.to(data.sessionId).emit('text-selected', {
      documentId: data.documentId,
      selection: data.selection,
    })
  }

  private async handleAddComment(socket: Socket, data: {
    sessionId: string
    documentId: string
    comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
  }): Promise<void> {
    const session = await this.getSession(data.sessionId)
    if (!session) throw new Error('Session not found')

    const document = session.documents.find(d => d.id === data.documentId)
    if (!document) throw new Error('Document not found')

    const user = socket.data.user
    if (!this.hasPermission(user, session, 'comment')) {
      throw new Error('Comment permission required')
    }

    const comment: Comment = {
      ...data.comment,
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      resolved: false,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    document.comments.push(comment)
    await this.storeSession(session)

    // Broadcast to all participants
    this.io.to(data.sessionId).emit('comment-added', {
      documentId: data.documentId,
      comment,
    })
  }

  private async handleAddSuggestion(socket: Socket, data: {
    sessionId: string
    documentId: string
    suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'updatedAt' | 'votes'>
  }): Promise<void> {
    const session = await this.getSession(data.sessionId)
    if (!session) throw new Error('Session not found')

    const document = session.documents.find(d => d.id === data.documentId)
    if (!document) throw new Error('Document not found')

    const user = socket.data.user
    if (!this.hasPermission(user, session, 'suggest')) {
      throw new Error('Suggest permission required')
    }

    const suggestion: Suggestion = {
      ...data.suggestion,
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      status: 'pending',
      votes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    document.suggestions.push(suggestion)
    await this.storeSession(session)

    // Broadcast to all participants
    this.io.to(data.sessionId).emit('suggestion-added', {
      documentId: data.documentId,
      suggestion,
    })
  }

  private handleVoiceOffer(socket: Socket, data: { sessionId: string; offer: any }): void {
    socket.to(data.sessionId).emit('voice-offer', {
      from: socket.id,
      offer: data.offer,
    })
  }

  private handleVoiceAnswer(socket: Socket, data: { sessionId: string; answer: any }): void {
    socket.to(data.sessionId).emit('voice-answer', {
      from: socket.id,
      answer: data.answer,
    })
  }

  private handleIceCandidate(socket: Socket, data: { sessionId: string; candidate: any }): void {
    socket.to(data.sessionId).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    })
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    const sessionId = this.socketSessions.get(socket.id)
    if (sessionId) {
      await this.handleLeaveSession(socket, sessionId)
    }
    this.logger.info(`User disconnected: ${socket.id}`)
  }

  private handleRedisEvent(event: CollaborationEvent): void {
    // Handle events from other instances
    this.io.to(event.sessionId).emit(event.type, event.data)
  }

  private async applyOperationalTransform(
    document: CollaborativeDocument,
    operation: Operation
  ): Promise<Operation> {
    // Simplified operational transform
    // In production, use a proper OT library like ShareJS or Yjs
    
    const recentOps = document.operations
      .filter(op => op.timestamp > new Date(Date.now() - 5000)) // Last 5 seconds
      .filter(op => op.userId !== operation.userId)

    let transformedOp = { ...operation }

    for (const recentOp of recentOps) {
      if (recentOp.position <= transformedOp.position) {
        if (recentOp.type === 'insert') {
          transformedOp.position += recentOp.content?.length || 0
        } else if (recentOp.type === 'delete') {
          transformedOp.position -= recentOp.length || 0
        }
      }
    }

    return transformedOp
  }

  private applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position)
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0))
      
      case 'replace':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position + (operation.length || 0))
      
      default:
        return content
    }
  }

  private async authenticateUser(token: string, userId: string): Promise<any> {
    // Implement JWT token verification
    // Return user object with id, username, avatar, etc.
    return {
      id: userId,
      username: `user_${userId}`,
      avatar: null,
    }
  }

  private canJoinSession(user: any, session: CollaborationSession): boolean {
    // Check if user can join session based on settings and permissions
    if (session.settings.visibility === 'private') {
      return session.participants.some(p => p.userId === user.id) || 
             session.ownerId === user.id
    }
    return true
  }

  private getUserRole(user: any, session: CollaborationSession): Participant['role'] {
    if (session.ownerId === user.id) return 'owner'
    // Check existing participant role or default to viewer
    const existingParticipant = session.participants.find(p => p.userId === user.id)
    return existingParticipant?.role || 'viewer'
  }

  private getUserPermissions(user: any, session: CollaborationSession): Permission[] {
    const role = this.getUserRole(user, session)
    
    switch (role) {
      case 'owner':
        return ['read', 'write', 'comment', 'suggest', 'review', 'admin', 'deploy', 'debug']
      case 'editor':
        return ['read', 'write', 'comment', 'suggest', 'review']
      case 'viewer':
        return ['read', 'comment']
      case 'guest':
        return ['read']
      default:
        return ['read']
    }
  }

  private hasPermission(user: any, session: CollaborationSession, permission: Permission): boolean {
    const participant = session.participants.find(p => p.userId === user.id)
    return participant?.permissions.includes(permission) || false
  }

  private async getSession(sessionId: string): Promise<CollaborationSession | null> {
    // Try memory cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!
    }

    // Try Redis cache
    const cached = await this.redis.get(`session:${sessionId}`)
    if (cached) {
      const session = JSON.parse(cached)
      this.sessions.set(sessionId, session)
      return session
    }

    return null
  }

  private async storeSession(session: CollaborationSession): Promise<void> {
    // Update memory cache
    this.sessions.set(session.id, session)
    
    // Update Redis cache
    await this.redis.setex(
      `session:${session.id}`,
      86400, // 24 hours
      JSON.stringify(session)
    )
  }

  private async publishEvent(event: CollaborationEvent): Promise<void> {
    await this.redis.publish('collaboration:events', JSON.stringify(event))
  }

  // Public API methods
  async createSession(
    projectId: string,
    ownerId: string,
    name: string,
    settings?: Partial<SessionSettings>
  ): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: uuidv4(),
      projectId,
      name,
      ownerId,
      participants: [],
      documents: [],
      settings: {
        maxParticipants: 10,
        allowGuests: false,
        requireApproval: false,
        enableVoiceChat: true,
        enableVideoChat: true,
        enableScreenShare: true,
        autoSave: true,
        saveInterval: 30000,
        conflictResolution: 'operational-transform',
        visibility: 'private',
        ...settings,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
    }

    await this.storeSession(session)
    return session
  }

  async addDocument(
    sessionId: string,
    name: string,
    type: CollaborativeDocument['type'],
    language: string,
    content: string = ''
  ): Promise<CollaborativeDocument> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error('Session not found')

    const document: CollaborativeDocument = {
      id: uuidv4(),
      sessionId,
      name,
      type,
      language,
      content,
      version: 1,
      operations: [],
      cursors: new Map(),
      selections: new Map(),
      comments: [],
      suggestions: [],
      locks: [],
      metadata: {
        blockchain: 'ethereum',
        framework: 'hardhat',
        dependencies: [],
        tags: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    session.documents.push(document)
    await this.storeSession(session)

    // Notify participants
    this.io.to(sessionId).emit('document-added', document)

    return document
  }

  async getSessionsByUser(userId: string): Promise<CollaborationSession[]> {
    const sessionIds = this.userSessions.get(userId) || new Set()
    const sessions: CollaborationSession[] = []

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId)
      if (session) {
        sessions.push(session)
      }
    }

    return sessions
  }

  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    session.status = 'ended'
    session.updatedAt = new Date()

    await this.storeSession(session)

    // Notify all participants
    this.io.to(sessionId).emit('session-ended', { sessionId })

    // Disconnect all sockets
    this.io.in(sessionId).disconnectSockets()
  }
}
