// =============================================
// NOVAGUARD COLLABORATION SERVICE
// Real-time collaborative editing and code review
// =============================================

import { createClient } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CollaborationSession {
  id: string
  title: string
  description?: string
  contractCode: string
  contractId?: string
  createdBy: string
  participants: string[]
  isActive: boolean
  permissions: {
    canEdit: string[]
    canComment: string[]
    canView: string[]
  }
  settings: {
    allowAnonymous: boolean
    maxParticipants: number
    autoSave: boolean
    versionControl: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface CollaborationComment {
  id: string
  sessionId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  lineNumber?: number
  columnStart?: number
  columnEnd?: number
  isResolved: boolean
  parentCommentId?: string
  reactions: {
    emoji: string
    users: string[]
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface CollaborationCursor {
  userId: string
  userName: string
  userColor: string
  position: {
    line: number
    column: number
  }
  selection?: {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
  }
  lastSeen: Date
}

export interface CodeChange {
  id: string
  sessionId: string
  userId: string
  userName: string
  operation: 'insert' | 'delete' | 'replace'
  position: {
    line: number
    column: number
  }
  content: string
  previousContent?: string
  timestamp: Date
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'code_changed' | 'comment_added' | 'cursor_moved'
  sessionId: string
  userId: string
  userName: string
  data: any
  timestamp: Date
}

export class CollaborationService {
  private channel: RealtimeChannel | null = null
  private currentSession: CollaborationSession | null = null
  private eventHandlers: Map<string, Function[]> = new Map()

  // Create a new collaboration session
  async createSession(
    title: string,
    contractCode: string,
    options: {
      description?: string
      contractId?: string
      allowAnonymous?: boolean
      maxParticipants?: number
    } = {}
  ): Promise<CollaborationSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session: CollaborationSession = {
        id: sessionId,
        title,
        description: options.description,
        contractCode,
        contractId: options.contractId,
        createdBy: 'current-user', // This should come from auth context
        participants: ['current-user'],
        isActive: true,
        permissions: {
          canEdit: ['current-user'],
          canComment: ['current-user'],
          canView: ['current-user']
        },
        settings: {
          allowAnonymous: options.allowAnonymous || false,
          maxParticipants: options.maxParticipants || 10,
          autoSave: true,
          versionControl: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          id: session.id,
          title: session.title,
          description: session.description,
          contract_code: session.contractCode,
          contract_id: session.contractId,
          created_by: session.createdBy,
          participants: session.participants,
          is_active: session.isActive,
          permissions: session.permissions,
          settings: session.settings,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Collaboration session created: ${sessionId}`)
      return session

    } catch (error) {
      console.error('❌ Failed to create collaboration session:', error)
      throw error
    }
  }

  // Join an existing collaboration session
  async joinSession(sessionId: string, userId: string, userName: string): Promise<CollaborationSession> {
    try {
      // Get session details
      const { data: sessionData, error: fetchError } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (fetchError) throw fetchError

      const session: CollaborationSession = {
        id: sessionData.id,
        title: sessionData.title,
        description: sessionData.description,
        contractCode: sessionData.contract_code,
        contractId: sessionData.contract_id,
        createdBy: sessionData.created_by,
        participants: sessionData.participants || [],
        isActive: sessionData.is_active,
        permissions: sessionData.permissions || { canEdit: [], canComment: [], canView: [] },
        settings: sessionData.settings || {},
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at)
      }

      // Add user to participants if not already present
      if (!session.participants.includes(userId)) {
        session.participants.push(userId)
        
        // Update permissions for new user
        session.permissions.canView.push(userId)
        session.permissions.canComment.push(userId)
        
        // Add edit permission if session allows
        if (session.settings.allowAnonymous || session.participants.length <= 5) {
          session.permissions.canEdit.push(userId)
        }

        // Update session in database
        const { error: updateError } = await supabase
          .from('collaboration_sessions')
          .update({
            participants: session.participants,
            permissions: session.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)

        if (updateError) throw updateError
      }

      // Set up real-time channel
      await this.setupRealtimeChannel(sessionId)
      this.currentSession = session

      // Broadcast user joined event
      await this.broadcastEvent({
        type: 'user_joined',
        sessionId,
        userId,
        userName,
        data: { userName },
        timestamp: new Date()
      })

      console.log(`✅ User ${userName} joined session: ${sessionId}`)
      return session

    } catch (error) {
      console.error('❌ Failed to join collaboration session:', error)
      throw error
    }
  }

  // Leave a collaboration session
  async leaveSession(sessionId: string, userId: string, userName: string): Promise<void> {
    try {
      if (this.currentSession && this.currentSession.id === sessionId) {
        // Broadcast user left event
        await this.broadcastEvent({
          type: 'user_left',
          sessionId,
          userId,
          userName,
          data: { userName },
          timestamp: new Date()
        })

        // Remove user from participants
        const updatedParticipants = this.currentSession.participants.filter(id => id !== userId)
        
        await supabase
          .from('collaboration_sessions')
          .update({
            participants: updatedParticipants,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)

        // Clean up real-time channel
        if (this.channel) {
          await this.channel.unsubscribe()
          this.channel = null
        }

        this.currentSession = null
        console.log(`✅ User ${userName} left session: ${sessionId}`)
      }
    } catch (error) {
      console.error('❌ Failed to leave collaboration session:', error)
      throw error
    }
  }

  // Update contract code in real-time
  async updateCode(
    sessionId: string,
    userId: string,
    userName: string,
    change: Omit<CodeChange, 'id' | 'sessionId' | 'userId' | 'userName' | 'timestamp'>
  ): Promise<void> {
    try {
      const codeChange: CodeChange = {
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId,
        userName,
        ...change,
        timestamp: new Date()
      }

      // Store code change
      await supabase
        .from('collaboration_changes')
        .insert({
          id: codeChange.id,
          session_id: codeChange.sessionId,
          user_id: codeChange.userId,
          user_name: codeChange.userName,
          operation: codeChange.operation,
          position: codeChange.position,
          content: codeChange.content,
          previous_content: codeChange.previousContent,
          timestamp: codeChange.timestamp.toISOString()
        })

      // Broadcast code change event
      await this.broadcastEvent({
        type: 'code_changed',
        sessionId,
        userId,
        userName,
        data: codeChange,
        timestamp: new Date()
      })

      console.log(`✅ Code change applied by ${userName} in session: ${sessionId}`)

    } catch (error) {
      console.error('❌ Failed to update code:', error)
      throw error
    }
  }

  // Add a comment to the code
  async addComment(
    sessionId: string,
    userId: string,
    userName: string,
    content: string,
    options: {
      lineNumber?: number
      columnStart?: number
      columnEnd?: number
      parentCommentId?: string
    } = {}
  ): Promise<CollaborationComment> {
    try {
      const comment: CollaborationComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId,
        userName,
        content,
        lineNumber: options.lineNumber,
        columnStart: options.columnStart,
        columnEnd: options.columnEnd,
        isResolved: false,
        parentCommentId: options.parentCommentId,
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Store comment
      const { data, error } = await supabase
        .from('collaboration_comments')
        .insert({
          id: comment.id,
          session_id: comment.sessionId,
          user_id: comment.userId,
          user_name: comment.userName,
          content: comment.content,
          line_number: comment.lineNumber,
          column_start: comment.columnStart,
          column_end: comment.columnEnd,
          is_resolved: comment.isResolved,
          parent_comment_id: comment.parentCommentId,
          reactions: comment.reactions,
          created_at: comment.createdAt.toISOString(),
          updated_at: comment.updatedAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Broadcast comment added event
      await this.broadcastEvent({
        type: 'comment_added',
        sessionId,
        userId,
        userName,
        data: comment,
        timestamp: new Date()
      })

      console.log(`✅ Comment added by ${userName} in session: ${sessionId}`)
      return comment

    } catch (error) {
      console.error('❌ Failed to add comment:', error)
      throw error
    }
  }

  // Update cursor position
  async updateCursor(
    sessionId: string,
    cursor: CollaborationCursor
  ): Promise<void> {
    try {
      // Broadcast cursor movement (don't store in database for performance)
      await this.broadcastEvent({
        type: 'cursor_moved',
        sessionId,
        userId: cursor.userId,
        userName: cursor.userName,
        data: cursor,
        timestamp: new Date()
      })

    } catch (error) {
      console.error('❌ Failed to update cursor:', error)
    }
  }

  // Get session comments
  async getComments(sessionId: string): Promise<CollaborationComment[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_comments')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        sessionId: item.session_id,
        userId: item.user_id,
        userName: item.user_name,
        userAvatar: item.user_avatar,
        content: item.content,
        lineNumber: item.line_number,
        columnStart: item.column_start,
        columnEnd: item.column_end,
        isResolved: item.is_resolved,
        parentCommentId: item.parent_comment_id,
        reactions: item.reactions || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))

    } catch (error) {
      console.error('❌ Failed to get comments:', error)
      return []
    }
  }

  // Get session change history
  async getChangeHistory(sessionId: string): Promise<CodeChange[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_changes')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        sessionId: item.session_id,
        userId: item.user_id,
        userName: item.user_name,
        operation: item.operation,
        position: item.position,
        content: item.content,
        previousContent: item.previous_content,
        timestamp: new Date(item.timestamp)
      }))

    } catch (error) {
      console.error('❌ Failed to get change history:', error)
      return []
    }
  }

  // Set up real-time channel for collaboration
  private async setupRealtimeChannel(sessionId: string): Promise<void> {
    try {
      this.channel = supabase.channel(`collaboration:${sessionId}`)

      this.channel
        .on('broadcast', { event: 'collaboration_event' }, (payload) => {
          this.handleRealtimeEvent(payload.payload as CollaborationEvent)
        })
        .subscribe()

      console.log(`✅ Real-time channel set up for session: ${sessionId}`)

    } catch (error) {
      console.error('❌ Failed to set up real-time channel:', error)
      throw error
    }
  }

  // Broadcast event to all session participants
  private async broadcastEvent(event: CollaborationEvent): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'collaboration_event',
          payload: event
        })
      }
    } catch (error) {
      console.error('❌ Failed to broadcast event:', error)
    }
  }

  // Handle incoming real-time events
  private handleRealtimeEvent(event: CollaborationEvent): void {
    const handlers = this.eventHandlers.get(event.type) || []
    handlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error(`❌ Error in event handler for ${event.type}:`, error)
      }
    })
  }

  // Event subscription methods
  onUserJoined(handler: (event: CollaborationEvent) => void): void {
    this.addEventListener('user_joined', handler)
  }

  onUserLeft(handler: (event: CollaborationEvent) => void): void {
    this.addEventListener('user_left', handler)
  }

  onCodeChanged(handler: (event: CollaborationEvent) => void): void {
    this.addEventListener('code_changed', handler)
  }

  onCommentAdded(handler: (event: CollaborationEvent) => void): void {
    this.addEventListener('comment_added', handler)
  }

  onCursorMoved(handler: (event: CollaborationEvent) => void): void {
    this.addEventListener('cursor_moved', handler)
  }

  private addEventListener(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe()
      this.channel = null
    }
    this.eventHandlers.clear()
    this.currentSession = null
  }
}

export default CollaborationService
