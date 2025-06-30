# Flash Audit Deployment Guide

This guide covers deploying Flash Audit using the **Vercel + Supabase** stack (recommended) and alternative deployment options.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL database
- Redis instance
- API keys for AI services (optional)

### Environment Variables

Create `.env` files in both frontend and backend directories:

#### Vercel Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
CLERK_SECRET_KEY=your-clerk-secret-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# AI Services (Optional)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
```

#### Frontend `.env` (for local development)
```bash
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_APP_NAME=NovaGuard
VITE_APP_VERSION=1.0.0
```

## 🌐 Platform-Specific Deployments

### 1. Vercel + Supabase (Recommended)

#### Full-Stack Deployment on Vercel
1. Connect your GitHub repository to Vercel
2. Set root directory to project root (not frontend)
3. Set build command: `npm run build`
4. Set output directory: `frontend/dist`
5. Add environment variables in Vercel dashboard
6. Deploy

#### Database on Supabase
1. Create a new Supabase project
2. Set up database schema using provided migrations
3. Configure authentication and RLS policies
4. Add Supabase credentials to Vercel environment variables

### 2. Alternative: Firebase + Supabase

#### Frontend on Firebase Hosting
1. Install Firebase CLI
2. Initialize project: `firebase init hosting`
3. Build project: `npm run build`
4. Deploy: `firebase deploy`

#### Backend as Firebase Functions
1. Set up Firebase Functions
2. Deploy API endpoints as cloud functions
3. Use Supabase for database and authentication

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/novaguard.git
cd novaguard
git checkout experiment
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Setup Database

#### PostgreSQL
```sql
CREATE DATABASE novaguard;
CREATE USER novaguard WITH PASSWORD 'novaguard_password';
GRANT ALL PRIVILEGES ON DATABASE novaguard TO novaguard;
```

#### Redis
Start Redis server:
```bash
redis-server
```

### 4. Environment Configuration

Create `.env` files as described above with local values:

#### API `.env` (for local development)
```bash
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLERK_SECRET_KEY=your-clerk-secret-key
OPENROUTER_API_KEY=your-openrouter-api-key
JWT_SECRET=local-development-secret
```

#### Frontend `.env`
```bash
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_APP_NAME=NovaGuard
VITE_APP_VERSION=1.0.0
```

### 5. Start Development Server

#### Full-Stack Development
```bash
# Install dependencies
npm install

# Start development server (frontend + API)
npm run dev
```

Visit `http://localhost:5174` to access the application.
API endpoints are available at `http://localhost:5174/api`

## 📊 Database Setup

### Supabase Database
The application uses Supabase for database and authentication. Set up your database schema using the provided migrations in the `supabase/migrations` folder.

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Configuration

### 1. JWT Secret
Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. CORS Configuration
Update CORS_ORIGIN to match your frontend domain in production.

### 3. Rate Limiting
The application includes built-in rate limiting. Adjust limits in the API controller as needed.

### 4. Environment Variables
Never commit `.env` files to version control. Use platform-specific environment variable management.

## 📈 Monitoring and Logging

### 1. Application Logs
Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Console output in development

### 2. Health Checks
Health check endpoint: `GET /health`

### 3. Metrics
The application exposes metrics for:
- Analysis queue status
- AI agent performance
- Collaboration session activity
- System resource usage

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy NovaGuard

on:
  push:
    branches: [experiment]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run build
      - run: cd backend && npm test
      # Deploy to your platform

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      # Deploy to your platform
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Ensure database exists and user has permissions
   - Verify network connectivity

2. **Redis Connection Error**
   - Check REDIS_URL format
   - Ensure Redis server is running
   - Verify network connectivity

3. **CORS Errors**
   - Check CORS_ORIGIN matches frontend domain
   - Ensure protocol (http/https) matches

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried columns
   - Use connection pooling
   - Enable query optimization

2. **Redis**
   - Configure appropriate memory limits
   - Use Redis clustering for high availability
   - Implement proper cache invalidation

3. **Application**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement proper caching strategies

## 📞 Support

For deployment issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Create an issue on GitHub
4. Contact the development team

## 🔄 Updates

To update the application:
1. Pull latest changes from the experiment branch
2. Install new dependencies: `npm install`
3. Run database migrations if any
4. Restart the application
5. Verify deployment health
