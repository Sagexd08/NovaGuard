-- =============================================
-- NOVAGUARD ROW LEVEL SECURITY POLICIES
-- Security policies for data access control
-- =============================================

-- =============================================
-- USER MANAGEMENT POLICIES
-- =============================================

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- User wallets policies
CREATE POLICY "Users can view their own wallets" ON user_wallets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert their own wallets" ON user_wallets
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their own wallets" ON user_wallets
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their own wallets" ON user_wallets
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- =============================================
-- AUDIT AND ANALYSIS POLICIES
-- =============================================

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own audit logs" ON audit_logs
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own audit logs" ON audit_logs
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Vulnerabilities policies
CREATE POLICY "Users can view vulnerabilities from their audits" ON vulnerabilities
    FOR SELECT USING (
        audit_id IN (
            SELECT id FROM audit_logs WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "System can insert vulnerabilities" ON vulnerabilities
    FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- Gas optimizations policies
CREATE POLICY "Users can view gas optimizations from their audits" ON gas_optimizations
    FOR SELECT USING (
        audit_id IN (
            SELECT id FROM audit_logs WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "System can insert gas optimizations" ON gas_optimizations
    FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- =============================================
-- DEPLOYMENT POLICIES
-- =============================================

-- Deployments policies
CREATE POLICY "Users can view their own deployments" ON deployments
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own deployments" ON deployments
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own deployments" ON deployments
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- =============================================
-- MONITORING POLICIES
-- =============================================

-- Monitored contracts policies
CREATE POLICY "Users can view their own monitored contracts" ON monitored_contracts
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own monitored contracts" ON monitored_contracts
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own monitored contracts" ON monitored_contracts
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own monitored contracts" ON monitored_contracts
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Contract alerts policies
CREATE POLICY "Users can view alerts for their contracts" ON contract_alerts
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM monitored_contracts WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "System can insert contract alerts" ON contract_alerts
    FOR INSERT WITH CHECK (true); -- Controlled by monitoring system

CREATE POLICY "Users can update alerts for their contracts" ON contract_alerts
    FOR UPDATE USING (
        contract_id IN (
            SELECT id FROM monitored_contracts WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

-- Contract transactions policies
CREATE POLICY "Users can view transactions for their contracts" ON contract_transactions
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM monitored_contracts WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "System can insert contract transactions" ON contract_transactions
    FOR INSERT WITH CHECK (true); -- Controlled by monitoring system

-- MEV alerts policies
CREATE POLICY "Users can view MEV alerts for their contracts" ON mev_alerts
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM monitored_contracts WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "System can insert MEV alerts" ON mev_alerts
    FOR INSERT WITH CHECK (true); -- Controlled by MEV detection system

-- =============================================
-- KNOWLEDGE BASE POLICIES
-- =============================================

-- Knowledge documents policies (read-only for users)
CREATE POLICY "Anyone can view knowledge documents" ON knowledge_documents
    FOR SELECT USING (true);

-- Knowledge chunks policies (read-only for users)
CREATE POLICY "Anyone can view knowledge chunks" ON knowledge_chunks
    FOR SELECT USING (true);

-- =============================================
-- COLLABORATION POLICIES
-- =============================================

-- Collaboration sessions policies
CREATE POLICY "Users can view sessions they created or participate in" ON collaboration_sessions
    FOR SELECT USING (
        created_by = auth.jwt() ->> 'sub' OR 
        auth.jwt() ->> 'sub' = ANY(participants)
    );

CREATE POLICY "Users can insert their own collaboration sessions" ON collaboration_sessions
    FOR INSERT WITH CHECK (created_by = auth.jwt() ->> 'sub');

CREATE POLICY "Session creators and participants can update sessions" ON collaboration_sessions
    FOR UPDATE USING (
        created_by = auth.jwt() ->> 'sub' OR 
        auth.jwt() ->> 'sub' = ANY(participants)
    );

CREATE POLICY "Session creators can delete sessions" ON collaboration_sessions
    FOR DELETE USING (created_by = auth.jwt() ->> 'sub');

-- Collaboration comments policies
CREATE POLICY "Users can view comments in sessions they participate in" ON collaboration_comments
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE created_by = auth.jwt() ->> 'sub' OR 
                  auth.jwt() ->> 'sub' = ANY(participants)
        )
    );

CREATE POLICY "Users can insert comments in sessions they participate in" ON collaboration_comments
    FOR INSERT WITH CHECK (
        user_id = auth.jwt() ->> 'sub' AND
        session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE created_by = auth.jwt() ->> 'sub' OR 
                  auth.jwt() ->> 'sub' = ANY(participants)
        )
    );

CREATE POLICY "Users can update their own comments" ON collaboration_comments
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own comments" ON collaboration_comments
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Collaboration changes policies
CREATE POLICY "Users can view changes in sessions they participate in" ON collaboration_changes
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE created_by = auth.jwt() ->> 'sub' OR 
                  auth.jwt() ->> 'sub' = ANY(participants)
        )
    );

CREATE POLICY "Users can insert changes in sessions they participate in" ON collaboration_changes
    FOR INSERT WITH CHECK (
        user_id = auth.jwt() ->> 'sub' AND
        session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE created_by = auth.jwt() ->> 'sub' OR 
                  auth.jwt() ->> 'sub' = ANY(participants)
        )
    );

-- =============================================
-- ANALYTICS POLICIES
-- =============================================

-- Analytics history policies
CREATE POLICY "Users can view analytics for their contracts" ON analytics_history
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM monitored_contracts WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "System can insert analytics history" ON analytics_history
    FOR INSERT WITH CHECK (true); -- Controlled by analytics system

-- =============================================
-- NOTIFICATION POLICIES
-- =============================================

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Notification logs policies
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "System can insert notification logs" ON notification_logs
    FOR INSERT WITH CHECK (true); -- Controlled by notification system

-- =============================================
-- PAYMENT POLICIES
-- =============================================

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL USING (true); -- Controlled by payment system

-- Payment transactions policies
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "System can insert payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (true); -- Controlled by payment system

-- Credit transactions policies
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "System can insert credit transactions" ON credit_transactions
    FOR INSERT WITH CHECK (true); -- Controlled by credit system

-- =============================================
-- ADMIN POLICIES (for system operations)
-- =============================================

-- Create admin role for system operations
CREATE ROLE novaguard_admin;

-- Grant admin access to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO novaguard_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO novaguard_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO novaguard_admin;

-- Admin bypass policies for system operations
CREATE POLICY "Admin can access all users" ON users
    FOR ALL TO novaguard_admin USING (true);

CREATE POLICY "Admin can access all audit logs" ON audit_logs
    FOR ALL TO novaguard_admin USING (true);

CREATE POLICY "Admin can access all deployments" ON deployments
    FOR ALL TO novaguard_admin USING (true);

CREATE POLICY "Admin can access all monitored contracts" ON monitored_contracts
    FOR ALL TO novaguard_admin USING (true);

CREATE POLICY "Admin can access all collaboration sessions" ON collaboration_sessions
    FOR ALL TO novaguard_admin USING (true);

-- =============================================
-- SERVICE ROLE POLICIES
-- =============================================

-- Create service role for backend operations
CREATE ROLE novaguard_service;

-- Grant service role necessary permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO novaguard_service;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO novaguard_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO novaguard_service;

-- Service role bypass policies for backend operations
CREATE POLICY "Service can manage knowledge base" ON knowledge_documents
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage knowledge chunks" ON knowledge_chunks
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage vulnerabilities" ON vulnerabilities
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage gas optimizations" ON gas_optimizations
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage contract alerts" ON contract_alerts
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage MEV alerts" ON mev_alerts
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage analytics" ON analytics_history
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage notifications" ON notification_logs
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage payments" ON payment_transactions
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage subscriptions" ON subscriptions
    FOR ALL TO novaguard_service USING (true);

CREATE POLICY "Service can manage credit transactions" ON credit_transactions
    FOR ALL TO novaguard_service USING (true);

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns contract
CREATE OR REPLACE FUNCTION user_owns_contract(contract_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM monitored_contracts 
        WHERE id = contract_uuid AND user_id = auth.jwt() ->> 'sub'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user participates in session
CREATE OR REPLACE FUNCTION user_participates_in_session(session_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM collaboration_sessions 
        WHERE id = session_text AND (
            created_by = auth.jwt() ->> 'sub' OR 
            auth.jwt() ->> 'sub' = ANY(participants)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
