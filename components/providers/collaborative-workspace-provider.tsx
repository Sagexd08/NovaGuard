'use client'

// =============================================
// NOVAGUARD COLLABORATIVE WORKSPACE PROVIDER
// Real-time collaboration workspace management
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { RoomProvider, CollaborationUtils } from '@/lib/liveblocks/liveblocks.config'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import { Loader2, Users, Wifi, WifiOff } from 'lucide-react'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CollaborativeWorkspaceContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  activeUsers: number
  currentRoom: string | null
  joinRoom: (contractId: string, options?: JoinRoomOptions) => Promise<void>
  leaveRoom: () => void
  inviteUser: (email: string, role: 'viewer' | 'editor' | 'admin') => Promise<void>
  updateUserRole: (userId: string, role: 'viewer' | 'editor' | 'admin') => Promise<void>
  createSnapshot: (message: string) => Promise<void>
  restoreSnapshot: (snapshotId: string) => Promise<void>
}

interface JoinRoomOptions {
  mode?: 'edit' | 'review' | 'readonly'
  autoSave?: boolean
  showPresence?: boolean
}

const CollaborativeWorkspaceContext = createContext<CollaborativeWorkspaceContextType | null>(null)

export function useCollaborativeWorkspace() {
  const context = useContext(CollaborativeWorkspaceContext)
  if (!context) {
    throw new Error('useCollaborativeWorkspace must be used within a CollaborativeWorkspaceProvider')
  }
  return context
}

interface CollaborativeWorkspaceProviderProps {
  children: React.ReactNode
  contractId?: string
  workspaceId?: string
  initialMode?: 'edit' | 'review' | 'readonly'
  enableAutoSave?: boolean
  enablePresence?: boolean
  onUserJoin?: (user: any) => void
  onUserLeave?: (user: any) => void
  onConnectionChange?: (status: string) => void
}

export function CollaborativeWorkspaceProvider({
  children,
  contractId,
  workspaceId,
  initialMode = 'edit',
  enableAutoSave = true,
  enablePresence = true,
  onUserJoin,
  onUserLeave,
  onConnectionChange
}: CollaborativeWorkspaceProviderProps) {
  
  const { user, isLoaded } = useUser()
  
  // State
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  const [activeUsers, setActiveUsers] = useState(0)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  
  // Generate room ID
  const generateRoomId = useCallback((contractId: string) => {
    return CollaborationUtils.generateRoomId(contractId, workspaceId)
  }, [workspaceId])
  
  // Join a collaboration room
  const joinRoom = useCallback(async (contractId: string, options: JoinRoomOptions = {}) => {
    if (!user) {
      throw new Error('User must be authenticated to join room')
    }
    
    try {
      setConnectionStatus('connecting')
      setRoomError(null)
      
      const roomId = generateRoomId(contractId)
      
      // Check if room exists, create if it doesn't
      const roomExists = await checkRoomExists(roomId)
      if (!roomExists) {
        await createRoom(contractId, user.id, {
          name: `Contract ${contractId}`,
          description: `Collaborative editing session for contract ${contractId}`,
          settings: {
            mode: options.mode || initialMode,
            autoSave: options.autoSave ?? enableAutoSave,
            showPresence: options.showPresence ?? enablePresence
          }
        })
      }
      
      setCurrentRoom(roomId)
      setConnectionStatus('connected')
      setIsConnected(true)
      
      // Notify about successful connection
      toast.success('Connected to collaborative workspace')
      onConnectionChange?.('connected')
      
    } catch (error) {
      console.error('Failed to join room:', error)
      setConnectionStatus('disconnected')
      setIsConnected(false)
      setRoomError(error instanceof Error ? error.message : 'Failed to join room')
      
      toast.error('Failed to connect to collaborative workspace')
      onConnectionChange?.('disconnected')
    }
  }, [user, generateRoomId, initialMode, enableAutoSave, enablePresence, onConnectionChange])
  
  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      setCurrentRoom(null)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      setActiveUsers(0)
      
      toast.success('Left collaborative workspace')
      onConnectionChange?.('disconnected')
    }
  }, [currentRoom, onConnectionChange])
  
  // Invite a user to the workspace
  const inviteUser = useCallback(async (email: string, role: 'viewer' | 'editor' | 'admin') => {
    if (!currentRoom || !user) {
      throw new Error('Must be in a room to invite users')
    }
    
    try {
      // Send invitation via API
      const response = await fetch('/api/collaboration/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentRoom,
          email,
          role,
          invitedBy: user.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send invitation')
      }
      
      toast.success(`Invitation sent to ${email}`)
      
    } catch (error) {
      console.error('Failed to invite user:', error)
      toast.error('Failed to send invitation')
      throw error
    }
  }, [currentRoom, user])
  
  // Update user role in the workspace
  const updateUserRole = useCallback(async (userId: string, role: 'viewer' | 'editor' | 'admin') => {
    if (!currentRoom || !user) {
      throw new Error('Must be in a room to update user roles')
    }
    
    try {
      const response = await fetch('/api/collaboration/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentRoom,
          userId,
          role,
          updatedBy: user.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user role')
      }
      
      toast.success('User role updated successfully')
      
    } catch (error) {
      console.error('Failed to update user role:', error)
      toast.error('Failed to update user role')
      throw error
    }
  }, [currentRoom, user])
  
  // Create a snapshot of the current state
  const createSnapshot = useCallback(async (message: string) => {
    if (!currentRoom || !user) {
      throw new Error('Must be in a room to create snapshots')
    }
    
    try {
      const response = await fetch('/api/collaboration/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentRoom,
          message,
          createdBy: user.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create snapshot')
      }
      
      const { snapshotId } = await response.json()
      toast.success('Snapshot created successfully')
      
      return snapshotId
      
    } catch (error) {
      console.error('Failed to create snapshot:', error)
      toast.error('Failed to create snapshot')
      throw error
    }
  }, [currentRoom, user])
  
  // Restore from a snapshot
  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    if (!currentRoom || !user) {
      throw new Error('Must be in a room to restore snapshots')
    }
    
    try {
      const response = await fetch('/api/collaboration/restore-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentRoom,
          snapshotId,
          restoredBy: user.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to restore snapshot')
      }
      
      toast.success('Snapshot restored successfully')
      
    } catch (error) {
      console.error('Failed to restore snapshot:', error)
      toast.error('Failed to restore snapshot')
      throw error
    }
  }, [currentRoom, user])
  
  // Auto-join room if contractId is provided
  useEffect(() => {
    if (isLoaded && user && contractId && !currentRoom) {
      joinRoom(contractId, {
        mode: initialMode,
        autoSave: enableAutoSave,
        showPresence: enablePresence
      }).catch(console.error)
    }
  }, [isLoaded, user, contractId, currentRoom, joinRoom, initialMode, enableAutoSave, enablePresence])
  
  // Context value
  const contextValue: CollaborativeWorkspaceContextType = {
    isConnected,
    connectionStatus,
    activeUsers,
    currentRoom,
    joinRoom,
    leaveRoom,
    inviteUser,
    updateUserRole,
    createSnapshot,
    restoreSnapshot
  }
  
  // Show loading state while user is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading workspace...</span>
        </div>
      </div>
    )
  }
  
  // Show error state if room connection failed
  if (roomError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <WifiOff className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">Connection Failed</h3>
            <p className="text-muted-foreground">{roomError}</p>
          </div>
          <button
            onClick={() => contractId && joinRoom(contractId)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }
  
  // Render with or without room provider based on connection status
  if (currentRoom && isConnected) {
    return (
      <CollaborativeWorkspaceContext.Provider value={contextValue}>
        <RoomProvider
          id={currentRoom}
          initialPresence={{
            cursor: null,
            selection: null,
            user: {
              id: user?.id || 'anonymous',
              name: user?.fullName || user?.firstName || 'Anonymous',
              avatar: user?.imageUrl || '',
              color: CollaborationUtils.generateUserColor(user?.id || 'anonymous')
            },
            isTyping: false,
            currentFunction: null,
            lastActivity: Date.now()
          }}
          initialStorage={{
            contractCode: '',
            annotations: {},
            auditResults: {
              vulnerabilities: [],
              gasOptimizations: [],
              overallScore: 0,
              lastAnalysis: 0
            },
            workspaceSettings: {
              theme: 'dark',
              fontSize: 14,
              tabSize: 2,
              wordWrap: true,
              minimap: true,
              lineNumbers: true,
              autoSave: enableAutoSave,
              collaborativeMode: initialMode,
              allowedActions: ['edit', 'comment', 'audit']
            },
            versionHistory: []
          }}
        >
          <div className="relative">
            {/* Connection Status Indicator */}
            <div className="absolute top-2 right-2 z-50">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-md px-2 py-1 text-xs">
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Connected</span>
                  </>
                ) : connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
                    <span className="text-yellow-600">Connecting...</span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                    <span className="text-orange-600">Reconnecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Disconnected</span>
                  </>
                )}
                
                {activeUsers > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{activeUsers + 1}</span>
                  </>
                )}
              </div>
            </div>
            
            {children}
          </div>
        </RoomProvider>
      </CollaborativeWorkspaceContext.Provider>
    )
  }
  
  // Render without room provider when not connected
  return (
    <CollaborativeWorkspaceContext.Provider value={contextValue}>
      {children}
    </CollaborativeWorkspaceContext.Provider>
  )
}

// Utility functions
async function checkRoomExists(roomId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/liveblocks/rooms/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId })
    })
    
    return response.ok
  } catch {
    return false
  }
}

async function createRoom(contractId: string, userId: string, options: any): Promise<void> {
  const response = await fetch('/api/liveblocks/rooms/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contractId,
      userId,
      ...options
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to create room')
  }
}

export default CollaborativeWorkspaceProvider
