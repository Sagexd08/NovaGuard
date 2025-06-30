// =============================================
// NOVAGUARD LIVEBLOCKS CONFIGURATION
// Advanced real-time collaboration setup
// =============================================

import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { JsonObject } from '@liveblocks/client'

// Define the collaborative document structure
export type Presence = {
  cursor: {
    x: number
    y: number
  } | null
  selection: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  } | null
  user: {
    id: string
    name: string
    avatar: string
    color: string
  }
  isTyping: boolean
  currentFunction: string | null
  lastActivity: number
}

// Storage structure for persistent collaboration data
export type Storage = {
  // Contract code with operational transforms
  contractCode: string
  
  // Collaborative annotations and comments
  annotations: {
    [lineNumber: string]: {
      id: string
      userId: string
      content: string
      type: 'comment' | 'suggestion' | 'vulnerability' | 'optimization'
      severity?: 'low' | 'medium' | 'high' | 'critical'
      resolved: boolean
      createdAt: number
      updatedAt: number
      replies: Array<{
        id: string
        userId: string
        content: string
        createdAt: number
      }>
    }[]
  }
  
  // Shared audit results and findings
  auditResults: {
    vulnerabilities: Array<{
      id: string
      name: string
      severity: string
      description: string
      affectedLines: string
      foundBy: string
      status: 'active' | 'fixed' | 'acknowledged' | 'false_positive'
      createdAt: number
    }>
    gasOptimizations: Array<{
      id: string
      title: string
      description: string
      affectedLines: string
      gasSavings: number
      difficulty: 'easy' | 'medium' | 'hard'
      status: 'pending' | 'implemented' | 'rejected'
      createdAt: number
    }>
    overallScore: number
    lastAnalysis: number
  }
  
  // Collaborative workspace settings
  workspaceSettings: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: number
    tabSize: number
    wordWrap: boolean
    minimap: boolean
    lineNumbers: boolean
    autoSave: boolean
    collaborativeMode: 'open' | 'review' | 'readonly'
    allowedActions: string[]
  }
  
  // Version history and snapshots
  versionHistory: Array<{
    id: string
    version: number
    contractCode: string
    changes: string
    author: string
    timestamp: number
    message: string
    auditScore?: number
  }>
}

// User metadata structure
export type UserMeta = {
  id: string
  info: {
    name: string
    email: string
    avatar: string
    role: 'owner' | 'admin' | 'editor' | 'viewer'
    permissions: {
      canEdit: boolean
      canComment: boolean
      canRunAudit: boolean
      canDeploy: boolean
      canInvite: boolean
      canManageSettings: boolean
    }
    preferences: {
      color: string
      notifications: boolean
      autoSave: boolean
      showCursors: boolean
      showPresence: boolean
    }
  }
}

// Room events for real-time notifications
export type RoomEvent = 
  | {
      type: 'VULNERABILITY_FOUND'
      data: {
        vulnerability: {
          id: string
          name: string
          severity: string
          line: number
        }
        foundBy: string
        timestamp: number
      }
    }
  | {
      type: 'AUDIT_COMPLETED'
      data: {
        auditId: string
        score: number
        vulnerabilityCount: number
        completedBy: string
        timestamp: number
      }
    }
  | {
      type: 'CODE_SUGGESTION'
      data: {
        suggestionId: string
        line: number
        suggestion: string
        author: string
        timestamp: number
      }
    }
  | {
      type: 'DEPLOYMENT_STARTED'
      data: {
        deploymentId: string
        chain: string
        initiatedBy: string
        timestamp: number
      }
    }
  | {
      type: 'USER_JOINED'
      data: {
        userId: string
        userName: string
        timestamp: number
      }
    }
  | {
      type: 'USER_LEFT'
      data: {
        userId: string
        userName: string
        timestamp: number
      }
    }

// Thread metadata for comments and discussions
export type ThreadMetadata = {
  lineNumber: number
  type: 'comment' | 'suggestion' | 'vulnerability' | 'optimization'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'resolved' | 'acknowledged'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  assignedTo?: string
  dueDate?: number
  relatedVulnerability?: string
}

// Create Liveblocks client with advanced configuration
const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
  
  // Enhanced authentication for secure collaboration
  authEndpoint: async (room) => {
    const response = await fetch('/api/liveblocks/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ room }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with Liveblocks')
    }
    
    return await response.json()
  },
  
  // Advanced throttling for performance
  throttle: 100,
  
  // Lost connection handling
  lostConnectionTimeout: 30000,
  
  // Background sync for offline support
  backgroundKeepAliveTimeout: 60000,
})

// Create room context with type safety
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useStatus,
  useLostConnectionListener,
  useErrorListener,
  useThreads,
  useCreateThread,
  useEditThreadMetadata,
  useCreateComment,
  useEditComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client)

// Advanced collaboration utilities
export const CollaborationUtils = {
  // Generate unique colors for users
  generateUserColor: (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ]
    
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  },
  
  // Format user presence for display
  formatPresence: (presence: Presence) => ({
    ...presence,
    isActive: presence.lastActivity > Date.now() - 30000, // 30 seconds
    displayName: presence.user.name || 'Anonymous',
    initials: presence.user.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '??'
  }),
  
  // Calculate collaboration metrics
  getCollaborationMetrics: (others: readonly Presence[]) => ({
    activeUsers: others.filter(p => p.lastActivity > Date.now() - 30000).length,
    totalUsers: others.length,
    typingUsers: others.filter(p => p.isTyping).length,
    usersWithSelection: others.filter(p => p.selection !== null).length
  }),
  
  // Merge operational transforms for conflict resolution
  mergeOperations: (operations: any[]) => {
    // Advanced OT algorithm implementation
    // This would handle concurrent edits and resolve conflicts
    return operations.reduce((merged, op) => {
      // Simplified merge logic - in production this would be more sophisticated
      return { ...merged, ...op }
    }, {})
  },
  
  // Generate room ID for contracts
  generateRoomId: (contractId: string, workspaceId?: string) => {
    const base = workspaceId ? `${workspaceId}:${contractId}` : contractId
    return `novaguard:contract:${base}`
  },
  
  // Validate user permissions
  validatePermission: (userMeta: UserMeta, action: string): boolean => {
    const permissions = userMeta.info.permissions
    
    switch (action) {
      case 'edit':
        return permissions.canEdit
      case 'comment':
        return permissions.canComment
      case 'audit':
        return permissions.canRunAudit
      case 'deploy':
        return permissions.canDeploy
      case 'invite':
        return permissions.canInvite
      case 'settings':
        return permissions.canManageSettings
      default:
        return false
    }
  }
}

// Export client for direct access if needed
export { client }

// Room configuration presets
export const RoomPresets = {
  // Standard collaborative editing
  collaborative: {
    collaborativeMode: 'open' as const,
    allowedActions: ['edit', 'comment', 'audit'],
    autoSave: true,
    showPresence: true
  },
  
  // Code review mode
  review: {
    collaborativeMode: 'review' as const,
    allowedActions: ['comment', 'audit'],
    autoSave: false,
    showPresence: true
  },
  
  // Read-only presentation mode
  presentation: {
    collaborativeMode: 'readonly' as const,
    allowedActions: [],
    autoSave: false,
    showPresence: false
  },
  
  // Audit-focused mode
  audit: {
    collaborativeMode: 'open' as const,
    allowedActions: ['edit', 'comment', 'audit'],
    autoSave: true,
    showPresence: true
  }
}

// Type exports for components
export type {
  Presence,
  Storage,
  UserMeta,
  RoomEvent,
  ThreadMetadata
}
