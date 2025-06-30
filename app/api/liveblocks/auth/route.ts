// =============================================
// NOVAGUARD LIVEBLOCKS AUTHENTICATION API
// Secure authentication for real-time collaboration
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { Liveblocks } from '@liveblocks/node'
import { createClient } from '@supabase/supabase-js'

// Initialize Liveblocks with secret key
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// User permission levels
type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'

interface UserPermissions {
  canEdit: boolean
  canComment: boolean
  canRunAudit: boolean
  canDeploy: boolean
  canInvite: boolean
  canManageSettings: boolean
}

// Get user permissions based on role
function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'owner':
      return {
        canEdit: true,
        canComment: true,
        canRunAudit: true,
        canDeploy: true,
        canInvite: true,
        canManageSettings: true
      }
    case 'admin':
      return {
        canEdit: true,
        canComment: true,
        canRunAudit: true,
        canDeploy: true,
        canInvite: true,
        canManageSettings: false
      }
    case 'editor':
      return {
        canEdit: true,
        canComment: true,
        canRunAudit: true,
        canDeploy: false,
        canInvite: false,
        canManageSettings: false
      }
    case 'viewer':
      return {
        canEdit: false,
        canComment: true,
        canRunAudit: false,
        canDeploy: false,
        canInvite: false,
        canManageSettings: false
      }
    default:
      return {
        canEdit: false,
        canComment: false,
        canRunAudit: false,
        canDeploy: false,
        canInvite: false,
        canManageSettings: false
      }
  }
}

// Generate user color based on user ID
function generateUserColor(userId: string): string {
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
}

// Check if user has access to room
async function checkRoomAccess(userId: string, roomId: string): Promise<{ hasAccess: boolean; role: UserRole }> {
  try {
    // Extract contract ID from room ID (format: novaguard:contract:contractId)
    const contractId = roomId.split(':').pop()

    if (!contractId) {
      return { hasAccess: false, role: 'viewer' }
    }

    // Check if user owns the contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('user_id, visibility, project_id')
      .eq('id', contractId)
      .single()

    if (!contract) {
      return { hasAccess: false, role: 'viewer' }
    }

    // If user owns the contract, they're the owner
    if (contract.user_id === userId) {
      return { hasAccess: true, role: 'owner' }
    }

    // Check if contract is public
    if (contract.visibility === 'public') {
      return { hasAccess: true, role: 'viewer' }
    }

    // Check workspace membership if contract belongs to a project
    if (contract.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id, visibility')
        .eq('id', contract.project_id)
        .single()

      if (project) {
        // Check if user is project owner
        if (project.user_id === userId) {
          return { hasAccess: true, role: 'admin' }
        }

        // Check if project is public
        if (project.visibility === 'public') {
          return { hasAccess: true, role: 'viewer' }
        }

        // Check workspace membership
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('user_id', userId)
          .eq('workspace_id', project.user_id) // Assuming workspace_id maps to project owner
          .single()

        if (membership) {
          return { hasAccess: true, role: membership.role as UserRole }
        }
      }
    }

    // Check if user has been explicitly granted access
    const { data: access } = await supabase
      .from('contract_access')
      .select('role')
      .eq('contract_id', contractId)
      .eq('user_id', userId)
      .single()

    if (access) {
      return { hasAccess: true, role: access.role as UserRole }
    }

    // Default: no access
    return { hasAccess: false, role: 'viewer' }

  } catch (error) {
    console.error('Error checking room access:', error)
    return { hasAccess: false, role: 'viewer' }
  }
}

// Get user information from Clerk and Supabase
async function getUserInfo(userId: string) {
  try {
    // Get user from Supabase
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      throw new Error('User not found in database')
    }

    return {
      id: userId,
      name: user.full_name || user.username || 'Anonymous',
      email: user.email,
      avatar: user.avatar_url || '',
      role: user.user_role || 'free',
      preferences: user.preferences || {}
    }
  } catch (error) {
    console.error('Error getting user info:', error)
    return {
      id: userId,
      name: 'Anonymous',
      email: '',
      avatar: '',
      role: 'free',
      preferences: {}
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Clerk
    const { userId } = auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the room ID from the request
    const { room } = await request.json()

    if (!room) {
      return new NextResponse('Room ID is required', { status: 400 })
    }

    // Validate room ID format
    if (!room.startsWith('novaguard:contract:')) {
      return new NextResponse('Invalid room ID format', { status: 400 })
    }

    // Check if user has access to this room
    const { hasAccess, role } = await checkRoomAccess(userId, room)

    if (!hasAccess) {
      return new NextResponse('Access denied to this room', { status: 403 })
    }

    // Get user information
    const userInfo = await getUserInfo(userId)

    // Get user permissions based on role
    const permissions = getUserPermissions(role)

    // Generate user color
    const userColor = generateUserColor(userId)

    // Create the session with Liveblocks
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        role: role,
        permissions: permissions,
        preferences: {
          color: userColor,
          notifications: userInfo.preferences.notifications ?? true,
          autoSave: userInfo.preferences.autoSave ?? true,
          showCursors: userInfo.preferences.showCursors ?? true,
          showPresence: userInfo.preferences.showPresence ?? true
        }
      }
    })

    // Grant access to the specific room
    session.allow(room, session.FULL_ACCESS)

    // Log the collaboration session
    try {
      await supabase
        .from('collaboration_sessions')
        .upsert({
          contract_id: room.split(':').pop(),
          user_id: userId,
          session_name: `${userInfo.name} - ${new Date().toISOString()}`,
          active_users: [userId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log collaboration session:', logError)
      // Don't fail the authentication if logging fails
    }

    // Authorize the session and return the result
    const { status, body } = await session.authorize()

    return new NextResponse(body, { status })

// Additional utility functions for room management

// Create a new collaboration room
export async function createRoom(contractId: string, userId: string, options: {
  name?: string
  description?: string
  settings?: any
} = {}) {
  try {
    const roomId = `novaguard:contract:${contractId}`

    // Initialize room storage with default values
    const initialStorage = {
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
        autoSave: true,
        collaborativeMode: 'open',
        allowedActions: ['edit', 'comment', 'audit']
      },
      versionHistory: []
    }

    // Create room in Liveblocks
    await liveblocks.createRoom(roomId, {
      defaultAccesses: [],
      usersAccesses: {
        [userId]: ['room:write']
      },
      metadata: {
        contractId,
        createdBy: userId,
        name: options.name || `Contract ${contractId}`,
        description: options.description || '',
        createdAt: new Date().toISOString()
      }
    })

    // Initialize storage
    await liveblocks.initializeStorageDocument(roomId, initialStorage)

    return { success: true, roomId }
  } catch (error) {
    console.error('Error creating room:', error)
    return { success: false, error: error.message }
  }
}

// Delete a collaboration room
export async function deleteRoom(roomId: string, userId: string) {
  try {
    // Check if user has permission to delete
    const { hasAccess, role } = await checkRoomAccess(userId, roomId)

    if (!hasAccess || (role !== 'owner' && role !== 'admin')) {
      throw new Error('Insufficient permissions to delete room')
    }

    // Delete room from Liveblocks
    await liveblocks.deleteRoom(roomId)

    return { success: true }
  } catch (error) {
    console.error('Error deleting room:', error)
    return { success: false, error: error.message }
  }
}
  } catch (error) {
    console.error('Liveblocks authentication error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Rate limiting for authentication requests
const authAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userAttempts = authAttempts.get(userId)

  if (!userAttempts) {
    authAttempts.set(userId, { count: 1, lastAttempt: now })
    return true
  }

  // Reset counter if more than 1 minute has passed
  if (now - userAttempts.lastAttempt > 60000) {
    authAttempts.set(userId, { count: 1, lastAttempt: now })
    return true
  }

  // Allow up to 10 attempts per minute
  if (userAttempts.count >= 10) {
    return false
  }

  userAttempts.count++
  userAttempts.lastAttempt = now
  authAttempts.set(userId, userAttempts)

  return true
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [userId, attempts] of authAttempts.entries()) {
    if (now - attempts.lastAttempt > 300000) { // 5 minutes
      authAttempts.delete(userId)
    }
  }
}, 300000) // Run every 5 minutes
