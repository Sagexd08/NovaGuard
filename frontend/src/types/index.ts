// Core types for NovaGuard application

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  credits: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  contractCode: string
  language: 'solidity' | 'vyper'
  userId: string
  isPublic: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  lastAnalysis?: AnalysisResult
}

export interface AnalysisResult {
  id: string
  projectId: string
  contractName: string
  securityScore: number
  gasScore: number
  overallScore: number
  vulnerabilities: Vulnerability[]
  gasOptimizations: GasOptimization[]
  recommendations: Recommendation[]
  summary: string
  metadata: AnalysisMetadata
  createdAt: string
}

export interface Vulnerability {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  line?: number
  column?: number
  function?: string
  recommendation: string
  cweId?: string
  confidence: number
  impact: string
  likelihood: string
}

export interface GasOptimization {
  id: string
  type: string
  title: string
  description: string
  line?: number
  function?: string
  estimatedSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  codeExample?: string
  implementation: string
}

export interface Recommendation {
  id: string
  category: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  implementation?: string
  resources?: string[]
}

export interface AnalysisMetadata {
  analysisTime: number
  linesOfCode: number
  complexity: number
  timestamp: string
  version: string
  engine: string
}

export interface Network {
  id: string
  name: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  gasPrice: string
  estimatedCost: string
  deploymentTime: string
  icon: string
  isTestnet: boolean
}

export interface Deployment {
  id: string
  projectId: string
  networkId: string
  contractAddress: string
  transactionHash: string
  gasUsed: number
  gasPrice: string
  deploymentCost: string
  status: 'pending' | 'success' | 'failed'
  error?: string
  createdAt: string
  verificationStatus: 'pending' | 'verified' | 'failed'
}

export interface ContractMonitoring {
  id: string
  deploymentId: string
  isActive: boolean
  alerts: Alert[]
  metrics: ContractMetrics
  lastChecked: string
}

export interface Alert {
  id: string
  type: 'security' | 'performance' | 'financial'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  timestamp: string
  isRead: boolean
  actionRequired: boolean
}

export interface ContractMetrics {
  transactionCount: number
  gasUsage: {
    total: number
    average: number
    trend: 'up' | 'down' | 'stable'
  }
  balance: string
  lastActivity: string
  uniqueUsers: number
}

export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  members: TeamMember[]
  projects: string[]
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: string
}

export interface TeamMember {
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: Permission[]
  joinedAt: string
}

export interface Permission {
  resource: 'projects' | 'deployments' | 'analytics' | 'settings'
  actions: ('read' | 'write' | 'delete' | 'admin')[]
}

export interface CollaborationSession {
  id: string
  projectId: string
  participants: SessionParticipant[]
  isActive: boolean
  createdAt: string
  lastActivity: string
}

export interface SessionParticipant {
  userId: string
  name: string
  avatar?: string
  cursor?: {
    line: number
    column: number
  }
  isTyping: boolean
  lastSeen: string
}

export interface Comment {
  id: string
  projectId: string
  userId: string
  content: string
  line?: number
  isResolved: boolean
  replies: CommentReply[]
  createdAt: string
  updatedAt: string
}

export interface CommentReply {
  id: string
  userId: string
  content: string
  createdAt: string
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}

export interface AnalysisConfig {
  enabledChecks: string[]
  severity: ('critical' | 'high' | 'medium' | 'low' | 'info')[]
  gasOptimization: boolean
  customRules: CustomRule[]
  timeout: number
}

export interface CustomRule {
  id: string
  name: string
  description: string
  pattern: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  isEnabled: boolean
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  credits: {
    total: number
    used: number
    resetDate: string
  }
}

export interface Usage {
  userId: string
  period: string
  analyses: number
  deployments: number
  collaborationMinutes: number
  storageUsed: number
  apiCalls: number
}

export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

// Event types for real-time updates
export interface WebSocketEvent {
  type: string
  payload: any
  timestamp: string
}

export interface ProjectUpdateEvent extends WebSocketEvent {
  type: 'project:update'
  payload: {
    projectId: string
    changes: Partial<Project>
  }
}

export interface AnalysisCompleteEvent extends WebSocketEvent {
  type: 'analysis:complete'
  payload: {
    projectId: string
    result: AnalysisResult
  }
}

export interface CollaborationEvent extends WebSocketEvent {
  type: 'collaboration:cursor' | 'collaboration:edit' | 'collaboration:comment'
  payload: {
    sessionId: string
    userId: string
    data: any
  }
}

// Form types
export interface CreateProjectForm {
  name: string
  description?: string
  language: 'solidity' | 'vyper'
  isPublic: boolean
  tags: string[]
}

export interface DeploymentForm {
  networkId: string
  gasLimit: string
  gasPrice?: string
  constructorArgs?: string
  verifyContract: boolean
}

export interface TeamInviteForm {
  email: string
  role: 'admin' | 'member' | 'viewer'
  message?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ValidationError extends AppError {
  field: string
  value: any
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
