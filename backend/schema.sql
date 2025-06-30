-- =============================================
-- NOVAGUARD DATABASE SCHEMA
-- Advanced Web3 Smart Contract Auditing Platform
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Enhanced users table for NovaGuard
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk authentication ID
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    user_role TEXT DEFAULT 'free' CHECK (user_role IN ('free', 'premium', 'enterprise', 'admin')),
    credits INTEGER DEFAULT 10, -- Free audit credits
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    api_key TEXT UNIQUE,
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    wallet_address TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CONTRACTS & PROJECTS
-- =============================================

-- Enhanced contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID, -- Will reference projects table
    contract_address TEXT,
    source_code TEXT NOT NULL,
    compiled_bytecode TEXT,
    abi JSONB,
    constructor_args JSONB,
    chain TEXT DEFAULT 'ethereum' CHECK (chain IN ('ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche', 'fantom', 'zksync', 'sepolia', 'mumbai', 'goerli')),
    network_id INTEGER,
    name TEXT,
    description TEXT,
    contract_type TEXT DEFAULT 'general' CHECK (contract_type IN ('general', 'erc20', 'erc721', 'erc1155', 'defi', 'dao', 'bridge', 'oracle', 'multisig')),
    compiler_version TEXT,
    optimization_enabled BOOLEAN DEFAULT FALSE,
    optimization_runs INTEGER DEFAULT 200,
    deployed BOOLEAN DEFAULT FALSE,
    deployment_tx TEXT,
    deployment_block_number BIGINT,
    deployment_gas_used BIGINT,
    verified BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
    sourcify_verified BOOLEAN DEFAULT FALSE,
    etherscan_verified BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects for organizing contracts
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    website_url TEXT,
    logo_url TEXT,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for contracts.project_id
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_project_id
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- =============================================
-- AUDIT SYSTEM
-- =============================================

-- Enhanced audit results table
CREATE TABLE IF NOT EXISTS audit_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    audit_id TEXT UNIQUE NOT NULL, -- Human-readable audit ID
    contract_address TEXT,
    chain TEXT DEFAULT 'ethereum',
    source_type TEXT DEFAULT 'solidity' CHECK (source_type IN ('solidity', 'bytecode', 'decompiled')),
    analysis_mode TEXT DEFAULT 'comprehensive' CHECK (analysis_mode IN ('quick', 'comprehensive', 'defi-focused', 'security-only', 'gas-optimization')),
    agents_used TEXT[] DEFAULT '{"security", "quality", "economics"}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Analysis Results
    vulnerabilities JSONB DEFAULT '[]',
    security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
    gas_optimization_score INTEGER CHECK (gas_optimization_score >= 0 AND gas_optimization_score <= 100),
    code_quality_score INTEGER CHECK (code_quality_score >= 0 AND code_quality_score <= 100),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_category TEXT CHECK (risk_category IN ('low', 'medium', 'high', 'critical')),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Detailed Analysis
    code_insights JSONB DEFAULT '{}',
    gas_optimization_tips JSONB DEFAULT '[]',
    anti_pattern_notices JSONB DEFAULT '[]',
    dangerous_usage JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    -- Execution Metadata
    analysis_duration INTEGER, -- in milliseconds
    tokens_used INTEGER,
    model_used TEXT,
    agent_results JSONB DEFAULT '{}',
    error_message TEXT,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual vulnerabilities table for detailed tracking
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_result_id UUID REFERENCES audit_results(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'reentrancy', 'overflow', 'access-control'
    severity TEXT NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT NOT NULL,
    affected_lines TEXT, -- e.g., "42-47"
    code_snippet TEXT,
    fix_suggestion TEXT,
    references TEXT[], -- External references/links
    cwe_id TEXT, -- Common Weakness Enumeration ID
    swc_id TEXT, -- Smart Contract Weakness Classification ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs for tracking all audit activities
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_code TEXT, -- First 1000 chars for logging
    contract_address TEXT,
    chain TEXT DEFAULT 'ethereum',
    analysis_mode TEXT,
    agents_requested TEXT[],
    status TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    execution_time INTEGER, -- in milliseconds
    tokens_consumed INTEGER,
    credits_used INTEGER DEFAULT 1,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM analysis logs for tracking AI model usage
CREATE TABLE IF NOT EXISTS llm_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    audit_result_id UUID REFERENCES audit_results(id) ON DELETE CASCADE,
    model_used TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    analysis_result JSONB,
    execution_time INTEGER, -- in milliseconds
    cost_usd DECIMAL(10, 6), -- Cost in USD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VECTOR DATABASE FOR RAG
-- =============================================

-- Vector documents for RAG-based knowledge system
CREATE TABLE IF NOT EXISTS vector_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type TEXT NOT NULL CHECK (doc_type IN ('solidity-docs', 'openzeppelin', 'audit-checklist', 'vulnerability-db', 'best-practices', 'defi-patterns')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    source_url TEXT,
    version TEXT,
    tags TEXT[] DEFAULT '{}',
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector search index for performance
CREATE INDEX IF NOT EXISTS idx_vector_documents_embedding ON vector_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_vector_documents_doc_type ON vector_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_vector_documents_tags ON vector_documents USING GIN(tags);

-- =============================================
-- DEPLOYMENT SYSTEM
-- =============================================

-- Contract deployments tracking
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    deployment_id TEXT UNIQUE NOT NULL, -- Human-readable deployment ID

    -- Deployment Details
    chain TEXT NOT NULL,
    network_id INTEGER NOT NULL,
    contract_address TEXT,
    deployer_address TEXT NOT NULL,
    transaction_hash TEXT,
    block_number BIGINT,
    block_timestamp TIMESTAMP WITH TIME ZONE,

    -- Gas & Cost Information
    gas_limit BIGINT,
    gas_used BIGINT,
    gas_price BIGINT, -- in wei
    deployment_cost_eth DECIMAL(20, 18),
    deployment_cost_usd DECIMAL(10, 2),

    -- Deployment Configuration
    constructor_args JSONB,
    compiler_version TEXT,
    optimization_enabled BOOLEAN DEFAULT FALSE,
    optimization_runs INTEGER DEFAULT 200,

    -- Status & Verification
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'deployed', 'failed', 'verified')),
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
    verification_attempts INTEGER DEFAULT 0,

    -- Payment Information
    paid BOOLEAN DEFAULT FALSE,
    payment_method TEXT CHECK (payment_method IN ('credits', 'stripe', 'crypto', 'metamask')),
    payment_tx_hash TEXT,
    payment_amount DECIMAL(10, 2),
    payment_currency TEXT,

    -- Metadata
    deployment_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENT SYSTEM
-- =============================================

-- Payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_intent_id TEXT UNIQUE, -- Stripe payment intent ID

    -- Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'ETH', 'USDC')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'metamask', 'upi', 'crypto')),

    -- Transaction Information
    transaction_hash TEXT, -- For crypto payments
    stripe_session_id TEXT, -- For Stripe payments
    upi_transaction_id TEXT, -- For UPI payments

    -- Payment Purpose
    purpose TEXT NOT NULL CHECK (purpose IN ('credits', 'deployment', 'premium', 'enterprise')),
    credits_purchased INTEGER,
    deployment_id UUID REFERENCES deployments(id),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    failure_reason TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credit transactions for tracking credit usage
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference audit_results, deployments, etc.
    reference_type TEXT CHECK (reference_type IN ('audit', 'deployment', 'payment', 'bonus')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COLLABORATION SYSTEM
-- =============================================

-- Team workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'team', 'enterprise')),
    settings JSONB DEFAULT '{}',
    invite_code TEXT UNIQUE,
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Real-time collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    session_name TEXT,
    active_users JSONB DEFAULT '[]', -- Array of user IDs currently editing
    document_state JSONB, -- Y.js or Liveblocks document state
    cursor_positions JSONB DEFAULT '{}', -- User cursor positions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration events for real-time sync
CREATE TABLE IF NOT EXISTS collaboration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('join', 'leave', 'edit', 'cursor', 'comment')),
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =============================================
-- MONITORING & ALERTING SYSTEM
-- =============================================

-- Contract monitoring sessions
CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    session_name TEXT,

    -- Monitoring Configuration
    monitor_types TEXT[] DEFAULT '{"transactions", "events", "balance"}', -- What to monitor
    alert_conditions JSONB DEFAULT '{}', -- Conditions that trigger alerts
    notification_channels TEXT[] DEFAULT '{"email"}', -- email, discord, telegram, webhook

    -- MEV Detection Settings
    mev_detection_enabled BOOLEAN DEFAULT FALSE,
    mev_threshold DECIMAL(10, 6), -- MEV value threshold in ETH

    -- Status & Limits
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'error')),
    max_alerts_per_hour INTEGER DEFAULT 10,
    alerts_sent_today INTEGER DEFAULT 0,
    last_alert_at TIMESTAMP WITH TIME ZONE,
    last_check_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring alerts
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_session_id UUID REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Alert Details
    alert_type TEXT NOT NULL CHECK (alert_type IN ('transaction', 'event', 'balance', 'mev', 'security', 'gas')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Transaction/Event Data
    transaction_hash TEXT,
    block_number BIGINT,
    event_data JSONB,
    mev_data JSONB,

    -- Notification Status
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels TEXT[],
    notification_attempts INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SECURITY & AUDIT TRAILS
-- =============================================

-- TEE (Trusted Execution Environment) audit logs for security
CREATE TABLE IF NOT EXISTS tee_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    audit_data JSONB NOT NULL,
    encrypted_data TEXT, -- Encrypted sensitive data
    hash TEXT NOT NULL, -- Integrity hash
    version TEXT DEFAULT '2.0.0',
    environment TEXT DEFAULT 'production',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API access logs for security monitoring
CREATE TABLE IF NOT EXISTS api_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER,
    response_status INTEGER,
    response_time INTEGER, -- in milliseconds
    api_key_used TEXT,
    rate_limit_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents tracking
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type TEXT NOT NULL CHECK (incident_type IN ('rate_limit', 'suspicious_activity', 'unauthorized_access', 'data_breach', 'system_error')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    incident_data JSONB,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_chain ON contracts(chain);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_address ON contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_contracts_deployed ON contracts(deployed);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- Audit results table indexes
CREATE INDEX IF NOT EXISTS idx_audit_results_user_id ON audit_results(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_contract_id ON audit_results(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_audit_id ON audit_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_status ON audit_results(status);
CREATE INDEX IF NOT EXISTS idx_audit_results_created_at ON audit_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_results_security_score ON audit_results(security_score);

-- Vulnerabilities table indexes
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_audit_result_id ON vulnerabilities(audit_result_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_type ON vulnerabilities(type);

-- Deployments table indexes
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_contract_id ON deployments(contract_id);
CREATE INDEX IF NOT EXISTS idx_deployments_chain ON deployments(chain);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_purpose ON payments(purpose);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Monitoring sessions indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_user_id ON monitoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_contract_address ON monitoring_sessions(contract_address);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_status ON monitoring_sessions(status);

-- Monitoring alerts indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_user_id ON monitoring_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_session_id ON monitoring_alerts(monitoring_session_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at DESC);
-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Contracts policies
CREATE POLICY "Users can view their own contracts" ON contracts
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own contracts" ON contracts
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own contracts" ON contracts
    FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own contracts" ON contracts
    FOR DELETE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Audit results policies
CREATE POLICY "Users can view their own audit results" ON audit_results
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own audit results" ON audit_results
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own audit results" ON audit_results
    FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Vulnerabilities policies (inherit from audit_results)
CREATE POLICY "Users can view vulnerabilities from their audits" ON vulnerabilities
    FOR SELECT USING (
        auth.uid()::text = (
            SELECT u.clerk_user_id
            FROM users u
            JOIN audit_results ar ON u.id = ar.user_id
            WHERE ar.id = audit_result_id
        )
    );

-- Deployments policies
CREATE POLICY "Users can view their own deployments" ON deployments
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own deployments" ON deployments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own deployments" ON deployments
    FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Credit transactions policies
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Workspace policies
CREATE POLICY "Users can view workspaces they belong to" ON workspaces
    FOR SELECT USING (
        auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = owner_id)
        OR EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN users u ON wm.user_id = u.id
            WHERE wm.workspace_id = workspaces.id
            AND u.clerk_user_id = auth.uid()::text
        )
    );

-- Monitoring sessions policies
CREATE POLICY "Users can view their own monitoring sessions" ON monitoring_sessions
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own monitoring sessions" ON monitoring_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own monitoring sessions" ON monitoring_sessions
    FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Monitoring alerts policies
CREATE POLICY "Users can view their own monitoring alerts" ON monitoring_alerts
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_results_updated_at
    BEFORE UPDATE ON audit_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at
    BEFORE UPDATE ON deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at
    BEFORE UPDATE ON collaboration_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_sessions_updated_at
    BEFORE UPDATE ON monitoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get user by Clerk ID
CREATE OR REPLACE FUNCTION get_user_by_clerk_id(clerk_id TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM users WHERE clerk_user_id = clerk_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION check_user_credits(user_uuid UUID, required_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT credits >= required_credits FROM users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits from user
CREATE OR REPLACE FUNCTION deduct_user_credits(user_uuid UUID, credits_to_deduct INTEGER, description TEXT DEFAULT 'Credit usage')
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits FROM users WHERE id = user_uuid;

    -- Check if user has sufficient credits
    IF current_credits < credits_to_deduct THEN
        RETURN FALSE;
    END IF;

    -- Calculate new balance
    new_balance := current_credits - credits_to_deduct;

    -- Update user credits
    UPDATE users SET credits = new_balance WHERE id = user_uuid;

    -- Log the transaction
    INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description)
    VALUES (user_uuid, 'usage', -credits_to_deduct, new_balance, description);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user
CREATE OR REPLACE FUNCTION add_user_credits(user_uuid UUID, credits_to_add INTEGER, description TEXT DEFAULT 'Credit purchase')
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits FROM users WHERE id = user_uuid;

    -- Calculate new balance
    new_balance := current_credits + credits_to_add;

    -- Update user credits
    UPDATE users SET credits = new_balance WHERE id = user_uuid;

    -- Log the transaction
    INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description)
    VALUES (user_uuid, 'purchase', credits_to_add, new_balance, description);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;