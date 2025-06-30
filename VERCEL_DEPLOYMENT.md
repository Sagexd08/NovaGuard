# 🚀 Flash Audit Vercel + Supabase Deployment Guide

This is the **primary deployment guide** for Flash Audit using Vercel for full-stack hosting and Supabase for the database. This replaces the previous Railway deployment.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)
- Node.js 18+ installed locally

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New project"
5. Fill in project details:
   - **Name**: `flash-audit-db`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 1.2 Setup Database Schema
1. Wait for project to be ready (2-3 minutes)
2. Go to "SQL Editor" in the sidebar
3. Run the following SQL to create the schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  blockchain VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  source_code TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  blockchain VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Collaboration sessions table
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI requests table
CREATE TABLE ai_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  agent_id VARCHAR(100) NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  input_data JSONB NOT NULL,
  response_data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_project_id ON analysis_results(project_id);
CREATE INDEX idx_collaboration_sessions_project_id ON collaboration_sessions(project_id);
CREATE INDEX idx_ai_requests_user_id ON ai_requests(user_id);
```

### 1.3 Get Supabase Credentials
1. Go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)
   - **Service role key** (starts with `eyJ`) - Keep this secret!

## 🚀 Step 2: Deploy to Vercel

### 2.1 Prepare Repository
1. Make sure your code is pushed to GitHub
2. Ensure all changes are committed

### 2.2 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`

### 2.3 Environment Variables
Add the following environment variables in Vercel:

#### Environment Variables for Vercel
```bash
# Frontend Variables (VITE_ prefix for client-side)
VITE_API_BASE_URL=/api
VITE_APP_NAME=FlashAudit
VITE_APP_VERSION=2.0.0
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# Backend Variables (for API routes)
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLERK_SECRET_KEY=your-clerk-secret-key
OPENROUTER_API_KEY=your-openrouter-api-key
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### 2.4 Deploy
1. Click "Deploy"
2. Wait for deployment to complete (5-10 minutes)
3. Your app will be available at `https://your-project-name.vercel.app`

## 🔧 Step 3: Configure API Routes

Since we're using Vercel for both frontend and backend, we need to set up API routes properly.

### 3.1 Create API Directory Structure
```
api/
├── auth/
│   ├── login.js
│   └── register.js
├── analysis/
│   ├── submit.js
│   └── [id].js
├── ai/
│   ├── request.js
│   └── agents.js
└── health.js
```

### 3.2 Example API Route (`api/health.js`)
```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  })
}
```

## 🔐 Step 4: Security Configuration

### 4.1 Environment Variables Security
- Never commit `.env` files to Git
- Use Vercel's environment variable management
- Keep service role keys secret

### 4.2 Supabase Security
1. Go to Supabase "Authentication" → "Settings"
2. Configure allowed domains:
   - Add your Vercel domain: `https://your-project-name.vercel.app`
   - Add localhost for development: `http://localhost:3000`

### 4.3 CORS Configuration
Ensure your API routes handle CORS properly:

```javascript
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  // Your API logic here
}
```

## 🧪 Step 5: Testing Deployment

### 5.1 Health Check
1. Visit `https://your-project-name.vercel.app/api/health`
2. Should return a JSON response with status "healthy"

### 5.2 Frontend Check
1. Visit `https://your-project-name.vercel.app`
2. Verify the application loads correctly
3. Test basic functionality

### 5.3 Database Connection
1. Test user registration/login
2. Verify data is being stored in Supabase
3. Check Supabase dashboard for data

## 🔄 Step 6: Continuous Deployment

### 6.1 Automatic Deployments
- Vercel automatically deploys when you push to the connected branch
- Each commit triggers a new deployment
- Preview deployments for pull requests

### 6.2 Branch Protection
1. Set up branch protection rules on GitHub
2. Require pull request reviews
3. Enable status checks

## 📊 Step 7: Monitoring & Analytics

### 7.1 Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance and usage
3. Set up alerts for errors

### 7.2 Supabase Monitoring
1. Monitor database performance in Supabase dashboard
2. Set up database alerts
3. Review query performance

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Redeploy after adding variables

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review Supabase logs

4. **API Route Issues**
   - Check function logs in Vercel
   - Verify API route structure
   - Test endpoints individually

### Getting Help
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- GitHub Issues: Create an issue in the repository

## 🎉 Success!

Your NovaGuard application should now be live at:
- **Frontend**: `https://your-project-name.vercel.app`
- **API**: `https://your-project-name.vercel.app/api`
- **Database**: Supabase dashboard

Remember to:
- Monitor performance and usage
- Keep dependencies updated
- Backup your database regularly
- Review security settings periodically
