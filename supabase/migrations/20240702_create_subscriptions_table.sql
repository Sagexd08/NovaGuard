-- Create subscriptions table for managing user subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    amount INTEGER NOT NULL, -- Amount in smallest currency unit (paise for INR)
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_subscription_id VARCHAR(100), -- For recurring subscriptions
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    trial_end_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_payment_id ON subscriptions(razorpay_payment_id);

-- Add subscription-related columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_plan') THEN
        ALTER TABLE users ADD COLUMN current_plan VARCHAR(50) DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan_status') THEN
        ALTER TABLE users ADD COLUMN plan_status VARCHAR(20) DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive', 'cancelled', 'expired', 'trial'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id') THEN
        ALTER TABLE users ADD COLUMN subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_end_date') THEN
        ALTER TABLE users ADD COLUMN trial_end_date TIMESTAMPTZ;
    END IF;
END $$;

-- Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'payment_success', 'payment_failed', 'subscription_created', etc.
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    amount INTEGER,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for payment logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_subscription_id ON payment_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to check subscription validity
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
BEGIN
    SELECT * INTO subscription_record
    FROM subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND end_date > NOW()
    ORDER BY end_date DESC
    LIMIT 1;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's current subscription
CREATE OR REPLACE FUNCTION get_current_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_id VARCHAR(50),
    plan_name VARCHAR(100),
    status VARCHAR(20),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_id,
        s.plan_name,
        s.status,
        s.start_date,
        s.end_date,
        EXTRACT(DAY FROM (s.end_date - NOW()))::INTEGER as days_remaining
    FROM subscriptions s
    WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND s.end_date > NOW()
    ORDER BY s.end_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert default pricing plans (for reference)
CREATE TABLE IF NOT EXISTS pricing_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Price in smallest currency unit
    currency VARCHAR(3) DEFAULT 'INR',
    interval_type VARCHAR(20) DEFAULT 'month', -- 'month', 'year'
    interval_count INTEGER DEFAULT 1,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO pricing_plans (id, name, description, price, features) VALUES
('free', 'Free', 'Basic features for getting started', 0, '["Up to 3 smart contract audits per month", "Basic vulnerability detection", "Community support"]'),
('basic', 'Basic', 'Perfect for individual developers and small projects', 99900, '["Up to 10 smart contract audits per month", "Basic vulnerability detection", "Standard security reports", "Email support", "Access to audit history", "Basic collaboration tools"]'),
('pro', 'Professional', 'Ideal for growing teams and medium-sized projects', 299900, '["Up to 50 smart contract audits per month", "Advanced AI-powered vulnerability detection", "Detailed security reports with recommendations", "Priority email & chat support", "Real-time collaboration features", "Custom audit templates", "Integration with popular IDEs", "Advanced analytics dashboard"]'),
('enterprise', 'Enterprise', 'For large organizations with complex security needs', 999900, '["Unlimited smart contract audits", "Enterprise-grade AI security analysis", "White-label audit reports", "24/7 dedicated support", "Advanced team management", "Custom integrations & APIs", "On-premise deployment options", "Compliance reporting (SOC2, ISO27001)", "Custom security policies", "Dedicated account manager"]')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Create trigger for pricing_plans updated_at
CREATE TRIGGER update_pricing_plans_updated_at 
    BEFORE UPDATE ON pricing_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own payment logs
CREATE POLICY "Users can view own payment logs" ON payment_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view pricing plans
CREATE POLICY "Anyone can view pricing plans" ON pricing_plans
    FOR SELECT USING (true);

-- Service role can do everything (for API operations)
CREATE POLICY "Service role full access subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payment_logs" ON payment_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access pricing_plans" ON pricing_plans
    FOR ALL USING (auth.role() = 'service_role');
