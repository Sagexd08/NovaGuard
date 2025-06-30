// =============================================
// NOVAGUARD DATABASE TYPES
// TypeScript definitions for Supabase schema
// =============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================
// CORE TYPES
// =============================================

export type UserRole = 'free' | 'premium' | 'enterprise' | 'admin'
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type Chain = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'bsc' | 'avalanche' | 'fantom' | 'zksync' | 'sepolia' | 'mumbai' | 'goerli'
export type ContractType = 'general' | 'erc20' | 'erc721' | 'erc1155' | 'defi' | 'dao' | 'bridge' | 'oracle' | 'multisig'
export type Visibility = 'private' | 'public' | 'team'
export type AnalysisMode = 'quick' | 'comprehensive' | 'defi-focused' | 'security-only' | 'gas-optimization'
export type AuditStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type VulnerabilitySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'
export type RiskCategory = 'low' | 'medium' | 'high' | 'critical'
export type DeploymentStatus = 'pending' | 'deploying' | 'deployed' | 'failed' | 'verified'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed'
export type PaymentMethod = 'credits' | 'stripe' | 'crypto' | 'metamask' | 'upi'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type PaymentPurpose = 'credits' | 'deployment' | 'premium' | 'enterprise'
export type TransactionType = 'purchase' | 'usage' | 'refund' | 'bonus'
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type WorkspacePlan = 'free' | 'team' | 'enterprise'
export type MonitoringStatus = 'active' | 'paused' | 'stopped' | 'error'
export type AlertType = 'transaction' | 'event' | 'balance' | 'mev' | 'security' | 'gas'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type CollaborationEventType = 'join' | 'leave' | 'edit' | 'cursor' | 'comment'

// =============================================
// USER & AUTHENTICATION
// =============================================

export interface User {
  id: string
  clerk_user_id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  wallet_address?: string
  user_role: UserRole
  credits: number
  is_premium: boolean
  subscription_tier: SubscriptionTier
  subscription_expires_at?: string
  api_key?: string
  preferences: Json
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  wallet_address?: string
  ip_address?: string
  user_agent?: string
  expires_at: string
  created_at: string
}

// =============================================
// CONTRACTS & PROJECTS
// =============================================

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  repository_url?: string
  documentation_url?: string
  website_url?: string
  logo_url?: string
  tags: string[]
  visibility: Visibility
  settings: Json
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  project_id?: string
  contract_address?: string
  source_code: string
  compiled_bytecode?: string
  abi?: Json
  constructor_args?: Json
  chain: Chain
  network_id?: number
  name?: string
  description?: string
  contract_type: ContractType
  compiler_version?: string
  optimization_enabled: boolean
  optimization_runs: number
  deployed: boolean
  deployment_tx?: string
  deployment_block_number?: number
  deployment_gas_used?: number
  verified: boolean
  verification_status: VerificationStatus
  sourcify_verified: boolean
  etherscan_verified: boolean
  tags: string[]
  visibility: Visibility
  created_at: string
  updated_at: string
  project?: Project
}

// =============================================
// AUDIT SYSTEM
// =============================================

export interface AuditResult {
  id: string
  user_id: string
  contract_id?: string
  audit_id: string
  contract_address?: string
  chain: Chain
  source_type: 'solidity' | 'bytecode' | 'decompiled'
  analysis_mode: AnalysisMode
  agents_used: string[]
  status: AuditStatus

  // Analysis Results
  vulnerabilities: Json
  security_score?: number
  gas_optimization_score?: number
  code_quality_score?: number
  overall_score?: number
  risk_category?: RiskCategory
  confidence_score?: number

  // Detailed Analysis
  code_insights: Json
  gas_optimization_tips: Json
  anti_pattern_notices: Json
  dangerous_usage: Json
  recommendations: Json

  // Execution Metadata
  analysis_duration?: number
  tokens_used?: number
  model_used?: string
  agent_results: Json
  error_message?: string

  // Timestamps
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string

  // Relations
  contract?: Contract
  vulnerabilities_list?: Vulnerability[]
}

export interface Vulnerability {
  id: string
  audit_result_id: string
  name: string
  type: string
  severity: VulnerabilitySeverity
  confidence?: number
  description: string
  affected_lines?: string
  code_snippet?: string
  fix_suggestion?: string
  references?: string[]
  cwe_id?: string
  swc_id?: string
  created_at: string
}

export interface AuditLog {
  id: string
  audit_id: string
  user_id: string
  contract_code?: string
  contract_address?: string
  chain: Chain
  analysis_mode?: string
  agents_requested?: string[]
  status: string
  ip_address?: string
  user_agent?: string
  execution_time?: number
  tokens_consumed?: number
  credits_used: number
  error_details?: Json
  created_at: string
}

export interface LLMAnalysisLog {
  id: string
  user_id: string
  audit_result_id?: string
  model_used: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  analysis_result?: Json
  execution_time?: number
  cost_usd?: number
  created_at: string
}

// =============================================
// VECTOR DATABASE
// =============================================

export interface VectorDocument {
  id: string
  doc_type: 'solidity-docs' | 'openzeppelin' | 'audit-checklist' | 'vulnerability-db' | 'best-practices' | 'defi-patterns'
  title: string
  content: string
  embedding?: number[]
  metadata: Json
  source_url?: string
  version?: string
  tags: string[]
  indexed_at: string
  created_at: string
}

// =============================================
// DEPLOYMENT SYSTEM
// =============================================

export interface Deployment {
  id: string
  user_id: string
  contract_id?: string
  deployment_id: string

  // Deployment Details
  chain: Chain
  network_id: number
  contract_address?: string
  deployer_address: string
  transaction_hash?: string
  block_number?: number
  block_timestamp?: string

  // Gas & Cost Information
  gas_limit?: number
  gas_used?: number
  gas_price?: number
  deployment_cost_eth?: number
  deployment_cost_usd?: number

  // Deployment Configuration
  constructor_args?: Json
  compiler_version?: string
  optimization_enabled: boolean
  optimization_runs: number

  // Status & Verification
  status: DeploymentStatus
  verification_status: VerificationStatus
  verification_attempts: number

  // Payment Information
  paid: boolean
  payment_method?: PaymentMethod
  payment_tx_hash?: string
  payment_amount?: number
  payment_currency?: string

  // Metadata
  deployment_notes?: string
  tags: string[]
  created_at: string
  updated_at: string

  // Relations
  contract?: Contract
}

// =============================================
// COLLABORATION SYSTEM
// =============================================

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  plan: WorkspacePlan
  settings: Json
  invite_code?: string
  max_members: number
  created_at: string
  updated_at: string

  // Relations
  owner?: User
  members?: WorkspaceMember[]
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  permissions: Json
  invited_by?: string
  joined_at: string
  created_at: string

  // Relations
  workspace?: Workspace
  user?: User
  inviter?: User
}

export interface CollaborationSession {
  id: string
  contract_id?: string
  workspace_id?: string
  session_name?: string
  active_users: Json
  document_state?: Json
  cursor_positions: Json
  created_at: string
  updated_at: string

  // Relations
  contract?: Contract
  workspace?: Workspace
}

export interface CollaborationEvent {
  id: string
  session_id: string
  user_id: string
  event_type: CollaborationEventType
  event_data: Json
  timestamp: string

  // Relations
  session?: CollaborationSession
  user?: User
}

// =============================================
// MONITORING & ALERTING
// =============================================

export interface MonitoringSession {
  id: string
  user_id: string
  contract_address: string
  chain: Chain
  session_name?: string

  // Monitoring Configuration
  monitor_types: string[]
  alert_conditions: Json
  notification_channels: string[]

  // MEV Detection Settings
  mev_detection_enabled: boolean
  mev_threshold?: number

  // Status & Limits
  status: MonitoringStatus
  max_alerts_per_hour: number
  alerts_sent_today: number
  last_alert_at?: string
  last_check_at?: string

  created_at: string
  updated_at: string

  // Relations
  user?: User
  alerts?: MonitoringAlert[]
}

export interface MonitoringAlert {
  id: string
  monitoring_session_id: string
  user_id: string

  // Alert Details
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  description: string

  // Transaction/Event Data
  transaction_hash?: string
  block_number?: number
  event_data?: Json
  mev_data?: Json

  // Notification Status
  notification_sent: boolean
  notification_channels?: string[]
  notification_attempts: number

  created_at: string

  // Relations
  monitoring_session?: MonitoringSession
  user?: User
}

// =============================================
// SECURITY & AUDIT TRAILS
// =============================================

export interface TEEAuditLog {
  id: string
  log_id: string
  user_id: string
  audit_data: Json
  encrypted_data?: string
  hash: string
  version: string
  environment: string
  created_at: string

  // Relations
  user?: User
}

export interface APIAccessLog {
  id: string
  user_id?: string
  endpoint: string
  method: string
  ip_address?: string
  user_agent?: string
  request_size?: number
  response_status?: number
  response_time?: number
  api_key_used?: string
  rate_limit_hit: boolean
  created_at: string

  // Relations
  user?: User
}

export interface SecurityIncident {
  id: string
  incident_type: 'rate_limit' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach' | 'system_error'
  severity: AlertSeverity
  description: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  incident_data?: Json
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  resolved_at?: string
  created_at: string

  // Relations
  user?: User
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  version?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface AuditResponse {
  vulnerabilities: {
    name: string
    affectedLines: string
    description: string
    severity: VulnerabilitySeverity
    fixSuggestion: string
  }[]
  securityScore: number
  riskCategory: {
    label: RiskCategory
    justification: string
  }
  codeInsights: {
    gasOptimizationTips: string[]
    antiPatternNotices: string[]
    dangerousUsage: string[]
  }
}

// =============================================
// UTILITY TYPES
// =============================================

export type DatabaseTables = {
  users: User
  user_sessions: UserSession
  projects: Project
  contracts: Contract
  audit_results: AuditResult
  vulnerabilities: Vulnerability
  audit_logs: AuditLog
  llm_analysis_logs: LLMAnalysisLog
  vector_documents: VectorDocument
  deployments: Deployment
  payments: Payment
  credit_transactions: CreditTransaction
  workspaces: Workspace
  workspace_members: WorkspaceMember
  collaboration_sessions: CollaborationSession
  collaboration_events: CollaborationEvent
  monitoring_sessions: MonitoringSession
  monitoring_alerts: MonitoringAlert
  tee_audit_logs: TEEAuditLog
  api_access_logs: APIAccessLog
  security_incidents: SecurityIncident
}

export type Database = {
  public: {
    Tables: {
      [K in keyof DatabaseTables]: {
        Row: DatabaseTables[K]
        Insert: Omit<DatabaseTables[K], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<DatabaseTables[K], 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_by_clerk_id: {
        Args: { clerk_id: string }
        Returns: string
      }
      check_user_credits: {
        Args: { user_uuid: string; required_credits: number }
        Returns: boolean
      }
      deduct_user_credits: {
        Args: { user_uuid: string; credits_to_deduct: number; description?: string }
        Returns: boolean
      }
      add_user_credits: {
        Args: { user_uuid: string; credits_to_add: number; description?: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
  user_id: string
  payment_intent_id?: string

  // Payment Details
  amount: number
  currency: 'USD' | 'EUR' | 'ETH' | 'USDC'
  payment_method: PaymentMethod

  // Transaction Information
  transaction_hash?: string
  stripe_session_id?: string
  upi_transaction_id?: string

  // Payment Purpose
  purpose: PaymentPurpose
  credits_purchased?: number
  deployment_id?: string

  // Status
  status: PaymentStatus
  failure_reason?: string

  // Metadata
  metadata: Json
  created_at: string
  updated_at: string

  // Relations
  deployment?: Deployment
}

export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: TransactionType
  amount: number
  balance_after: number
  description?: string
  reference_id?: string
  reference_type?: 'audit' | 'deployment' | 'payment' | 'bonus'
  created_at: string
}
