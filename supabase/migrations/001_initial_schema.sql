-- =============================================
-- NOVAGUARD DATABASE SCHEMA
-- Comprehensive database schema for NovaGuard platform
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- Users table (extends Clerk authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    avatar_url TEXT,
    primary_wallet TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    auth_methods TEXT[] DEFAULT ARRAY['email'],
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    credits INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallets table
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    chain_id INTEGER,
    wallet_type TEXT DEFAULT 'external',
    is_primary BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address)
);

-- Credit transactions table
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AUDIT AND ANALYSIS TABLES
-- =============================================

-- Audit logs table
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    contract_code TEXT,
    contract_address TEXT,
    chain TEXT,
    analysis_type TEXT DEFAULT 'comprehensive',
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    results JSONB,
    metadata JSONB DEFAULT '{}',
    is_temporary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerability database
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id TEXT REFERENCES audit_logs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location JSONB, -- {line, column, function}
    recommendation TEXT,
    cwe_id TEXT,
    confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gas optimizations table
CREATE TABLE gas_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id TEXT REFERENCES audit_logs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location JSONB, -- {line, function}
    estimated_savings INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    code_example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DEPLOYMENT TABLES
-- =============================================

-- Deployments table
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    contract_name TEXT NOT NULL,
    contract_code TEXT NOT NULL,
    chain TEXT NOT NULL,
    contract_address TEXT,
    transaction_hash TEXT,
    constructor_args JSONB DEFAULT '[]',
    gas_used INTEGER,
    gas_price TEXT,
    deployment_cost TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'deployed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MONITORING TABLES
-- =============================================

-- Monitored contracts table
CREATE TABLE monitored_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    contract_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    name TEXT NOT NULL,
    abi JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    monitoring_rules JSONB DEFAULT '[]',
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contract_address, chain)
);

-- Contract alerts table
CREATE TABLE contract_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES monitored_contracts(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    transaction_hash TEXT,
    block_number BIGINT,
    gas_price TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract transactions table (for analytics)
CREATE TABLE contract_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES monitored_contracts(id) ON DELETE CASCADE,
    transaction_hash TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT,
    value TEXT DEFAULT '0',
    gas_used INTEGER,
    gas_price TEXT,
    function_name TEXT,
    function_args JSONB,
    status TEXT CHECK (status IN ('success', 'failed')),
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MEV alerts table
CREATE TABLE mev_alerts (
    id TEXT PRIMARY KEY,
    contract_id UUID REFERENCES monitored_contracts(id) ON DELETE CASCADE,
    attack_type TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence DECIMAL(3,2),
    description TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT,
    gas_price TEXT,
    mev_profit TEXT,
    victim_address TEXT,
    attacker_address TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- KNOWLEDGE BASE TABLES (RAG)
-- =============================================

-- Knowledge documents table
CREATE TABLE knowledge_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge chunks table (for better retrieval)
CREATE TABLE knowledge_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COLLABORATION TABLES
-- =============================================

-- Collaboration sessions table
CREATE TABLE collaboration_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    contract_code TEXT NOT NULL,
    contract_id UUID,
    created_by TEXT NOT NULL, -- Clerk user ID
    participants TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration comments table
CREATE TABLE collaboration_comments (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    line_number INTEGER,
    column_start INTEGER,
    column_end INTEGER,
    is_resolved BOOLEAN DEFAULT FALSE,
    parent_comment_id TEXT,
    reactions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration changes table (for version control)
CREATE TABLE collaboration_changes (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    user_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'delete', 'replace')),
    position JSONB NOT NULL, -- {line, column}
    content TEXT NOT NULL,
    previous_content TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Analytics history table
CREATE TABLE analytics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES monitored_contracts(id) ON DELETE CASCADE,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATION TABLES
-- =============================================

-- Notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    channels JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs table
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    type TEXT NOT NULL,
    channel TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENT TABLES
-- =============================================

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    package_id TEXT,
    credits_purchased INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);

-- Audit indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_vulnerabilities_audit_id ON vulnerabilities(audit_id);
CREATE INDEX idx_gas_optimizations_audit_id ON gas_optimizations(audit_id);

-- Monitoring indexes
CREATE INDEX idx_monitored_contracts_user_id ON monitored_contracts(user_id);
CREATE INDEX idx_monitored_contracts_address_chain ON monitored_contracts(contract_address, chain);
CREATE INDEX idx_contract_alerts_contract_id ON contract_alerts(contract_id);
CREATE INDEX idx_contract_alerts_timestamp ON contract_alerts(timestamp DESC);
CREATE INDEX idx_mev_alerts_contract_id ON mev_alerts(contract_id);
CREATE INDEX idx_mev_alerts_timestamp ON mev_alerts(timestamp DESC);

-- Knowledge base indexes
CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(type);
CREATE INDEX idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);

-- Collaboration indexes
CREATE INDEX idx_collaboration_sessions_created_by ON collaboration_sessions(created_by);
CREATE INDEX idx_collaboration_comments_session_id ON collaboration_comments(session_id);
CREATE INDEX idx_collaboration_changes_session_id ON collaboration_changes(session_id);

-- Full-text search indexes
CREATE INDEX idx_knowledge_documents_content_fts ON knowledge_documents USING gin(to_tsvector('english', content));
CREATE INDEX idx_audit_logs_results_gin ON audit_logs USING gin(results);

-- Vector similarity indexes (for RAG)
CREATE INDEX idx_knowledge_documents_embedding ON knowledge_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- =============================================
-- FUNCTIONS FOR VECTOR SIMILARITY SEARCH
-- =============================================

-- Function to match knowledge documents
CREATE OR REPLACE FUNCTION match_knowledge_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id text,
    title text,
    content text,
    type text,
    source text,
    url text,
    metadata jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        knowledge_documents.id,
        knowledge_documents.title,
        knowledge_documents.content,
        knowledge_documents.type,
        knowledge_documents.source,
        knowledge_documents.url,
        knowledge_documents.metadata,
        1 - (knowledge_documents.embedding <=> query_embedding) AS similarity
    FROM knowledge_documents
    WHERE 1 - (knowledge_documents.embedding <=> query_embedding) > match_threshold
    ORDER BY knowledge_documents.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Function to match knowledge chunks
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    id text,
    document_id text,
    content text,
    chunk_index int,
    metadata jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        knowledge_chunks.id,
        knowledge_chunks.document_id,
        knowledge_chunks.content,
        knowledge_chunks.chunk_index,
        knowledge_chunks.metadata,
        1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
    FROM knowledge_chunks
    WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY knowledge_chunks.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitored_contracts_updated_at BEFORE UPDATE ON monitored_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON collaboration_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_comments_updated_at BEFORE UPDATE ON collaboration_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added in a separate migration file for better organization
