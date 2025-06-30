'use client'

// =============================================
// NOVAGUARD COLLABORATION EDITOR
// Real-time collaborative code editor
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Save, 
  History, 
  Eye, 
  EyeOff,
  Send,
  MoreHorizontal,
  CheckCircle,
  Circle,
  UserPlus,
  Settings,
  Download,
  Copy
} from 'lucide-react'
import CollaborationService, { 
  type CollaborationSession, 
  type CollaborationComment, 
  type CollaborationCursor,
  type CollaborationEvent 
} from '@/lib/collaboration/collaboration-service'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface CollaborationEditorProps {
  sessionId?: string
  initialCode?: string
  onCodeChange?: (code: string) => void
  className?: string
}

export function CollaborationEditor({ 
  sessionId, 
  initialCode = '', 
  onCodeChange,
  className 
}: CollaborationEditorProps) {
  const { user } = useUser()
  const [collaborationService] = useState(() => new CollaborationService())
  
  // State
  const [session, setSession] = useState<CollaborationSession | null>(null)
  const [code, setCode] = useState(initialCode)
  const [comments, setComments] = useState<CollaborationComment[]>([])
  const [activeCursors, setActiveCursors] = useState<Map<string, CollaborationCursor>>(new Map())
  const [participants, setParticipants] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize collaboration session
  useEffect(() => {
    if (user && sessionId) {
      initializeSession()
    }

    return () => {
      collaborationService.cleanup()
    }
  }, [user, sessionId])

  // Set up event listeners
  useEffect(() => {
    if (session) {
      setupEventListeners()
    }
  }, [session])

  const initializeSession = async () => {
    if (!user || !sessionId) return

    try {
      const sessionData = await collaborationService.joinSession(
        sessionId,
        user.id,
        user.fullName || user.firstName || 'Anonymous'
      )

      setSession(sessionData)
      setCode(sessionData.contractCode)
      setParticipants(sessionData.participants)
      setIsConnected(true)

      // Load existing comments
      const existingComments = await collaborationService.getComments(sessionId)
      setComments(existingComments)

      toast.success('Connected to collaboration session')
    } catch (error) {
      console.error('Failed to initialize session:', error)
      toast.error('Failed to connect to collaboration session')
    }
  }

  const setupEventListeners = () => {
    collaborationService.onUserJoined((event: CollaborationEvent) => {
      setParticipants(prev => {
        if (!prev.includes(event.userId)) {
          return [...prev, event.userId]
        }
        return prev
      })
      toast.success(`${event.userName} joined the session`)
    })

    collaborationService.onUserLeft((event: CollaborationEvent) => {
      setParticipants(prev => prev.filter(id => id !== event.userId))
      setActiveCursors(prev => {
        const newCursors = new Map(prev)
        newCursors.delete(event.userId)
        return newCursors
      })
      toast.info(`${event.userName} left the session`)
    })

    collaborationService.onCodeChanged((event: CollaborationEvent) => {
      if (event.userId !== user?.id) {
        applyCodeChange(event.data)
      }
    })

    collaborationService.onCommentAdded((event: CollaborationEvent) => {
      setComments(prev => [...prev, event.data])
      toast.info(`New comment from ${event.userName}`)
    })

    collaborationService.onCursorMoved((event: CollaborationEvent) => {
      if (event.userId !== user?.id) {
        setActiveCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.set(event.userId, event.data)
          return newCursors
        })
      }
    })
  }

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    if (!session || !user) return

    setCode(newCode)
    onCodeChange?.(newCode)

    // Broadcast code change (simplified - in production, use operational transforms)
    collaborationService.updateCode(
      session.id,
      user.id,
      user.fullName || user.firstName || 'Anonymous',
      {
        operation: 'replace',
        position: { line: 0, column: 0 },
        content: newCode,
        previousContent: code
      }
    )
  }, [session, user, code, onCodeChange])

  // Apply incoming code changes
  const applyCodeChange = (change: any) => {
    // In a production app, you'd use operational transforms here
    // For now, we'll just replace the entire content
    setCode(change.content)
    onCodeChange?.(change.content)
  }

  // Handle cursor movement
  const handleCursorMove = useCallback(() => {
    if (!session || !user || !editorRef.current) return

    // Clear existing timeout
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current)
    }

    // Debounce cursor updates
    cursorUpdateTimeoutRef.current = setTimeout(() => {
      const textarea = editorRef.current!
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = code.substring(0, cursorPosition)
      const lines = textBeforeCursor.split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length

      const cursor: CollaborationCursor = {
        userId: user.id,
        userName: user.fullName || user.firstName || 'Anonymous',
        userColor: getUserColor(user.id),
        position: { line, column },
        lastSeen: new Date()
      }

      collaborationService.updateCursor(session.id, cursor)
    }, 100)
  }, [session, user, code])

  // Handle line selection for comments
  const handleLineClick = (lineNumber: number) => {
    setSelectedLine(lineNumber)
    setIsAddingComment(true)
  }

  // Add comment
  const addComment = async () => {
    if (!session || !user || !newComment.trim() || selectedLine === null) return

    try {
      await collaborationService.addComment(
        session.id,
        user.id,
        user.fullName || user.firstName || 'Anonymous',
        newComment.trim(),
        { lineNumber: selectedLine }
      )

      setNewComment('')
      setIsAddingComment(false)
      setSelectedLine(null)
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  // Get user color for cursor
  const getUserColor = (userId: string): string => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ]
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  // Get line comments
  const getLineComments = (lineNumber: number) => {
    return comments.filter(comment => comment.lineNumber === lineNumber && !comment.isResolved)
  }

  // Render code with line numbers and comments
  const renderCodeEditor = () => {
    const lines = code.split('\n')

    return (
      <div className="relative">
        <div className="flex">
          {/* Line numbers */}
          <div className="flex flex-col bg-gray-50 border-r border-gray-200 px-3 py-2 text-sm text-gray-500 font-mono">
            {lines.map((_, index) => {
              const lineNumber = index + 1
              const lineComments = getLineComments(lineNumber)
              
              return (
                <div
                  key={lineNumber}
                  className={cn(
                    "flex items-center justify-between cursor-pointer hover:bg-gray-100 px-1 rounded",
                    selectedLine === lineNumber && "bg-blue-100"
                  )}
                  onClick={() => handleLineClick(lineNumber)}
                >
                  <span>{lineNumber}</span>
                  {lineComments.length > 0 && (
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Code editor */}
          <div className="flex-1 relative">
            <Textarea
              ref={editorRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onSelect={handleCursorMove}
              onKeyUp={handleCursorMove}
              className="font-mono text-sm border-0 resize-none focus:ring-0 min-h-96"
              placeholder="Enter your Solidity code here..."
              style={{ 
                lineHeight: '1.5',
                whiteSpace: 'pre',
                overflowWrap: 'normal'
              }}
            />

            {/* Active cursors */}
            {Array.from(activeCursors.values()).map(cursor => (
              <div
                key={cursor.userId}
                className="absolute pointer-events-none"
                style={{
                  top: `${(cursor.position.line - 1) * 24}px`,
                  left: `${cursor.position.column * 8}px`,
                  borderLeft: `2px solid ${cursor.userColor}`,
                  height: '24px'
                }}
              >
                <div
                  className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded"
                  style={{ backgroundColor: cursor.userColor }}
                >
                  {cursor.userName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add comment form */}
        {isAddingComment && selectedLine !== null && (
          <div className="absolute top-0 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Add Comment (Line {selectedLine})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingComment(false)
                  setSelectedLine(null)
                  setNewComment('')
                }}
              >
                ×
              </Button>
            </div>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              className="mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={addComment} size="sm">
                <Send className="h-4 w-4 mr-1" />
                Add Comment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingComment(false)
                  setSelectedLine(null)
                  setNewComment('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Connecting to collaboration session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">{session.title}</h3>
            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}
          </div>
          
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Participants */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">{participants.length}</span>
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((participantId, index) => (
                <Avatar key={participantId} className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {participantId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs">+{participants.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Comments
          </Button>

          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>

          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Code Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Smart Contract Code</span>
                <Badge variant="outline">{code.split('\n').length} lines</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderCodeEditor()}
            </CardContent>
          </Card>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {comment.userName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{comment.userName}</span>
                            {comment.lineNumber && (
                              <Badge variant="outline" className="text-xs">
                                Line {comment.lineNumber}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            {comment.isResolved ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {comment.createdAt.toLocaleString()}
                        </p>
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet</p>
                        <p className="text-xs">Click on a line number to add a comment</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollaborationEditor
