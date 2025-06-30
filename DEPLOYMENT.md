# NovaGuard Deployment Guide

This guide covers deploying NovaGuard to various web platforms without Docker.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL database
- Redis instance
- API keys for AI services (optional)

### Environment Variables

Create `.env` files in both frontend and backend directories:

#### Backend `.env`
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

#### Frontend `.env.local`
```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com
NEXT_PUBLIC_APP_NAME=NovaGuard
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🌐 Platform-Specific Deployments

### 1. Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variables in Vercel dashboard
5. Deploy

#### Backend on Railway
1. Connect your GitHub repository to Railway
2. Select the `backend` folder as root directory
3. Set start command: `npm start`
4. Add environment variables in Railway dashboard
5. Add PostgreSQL and Redis services
6. Deploy

### 2. Netlify (Frontend) + Heroku (Backend)

#### Frontend on Netlify
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

#### Backend on Heroku
1. Create new Heroku app
2. Add PostgreSQL and Redis add-ons
3. Set environment variables
4. Connect GitHub repository
5. Enable automatic deploys

### 3. AWS (Full Stack)

#### Frontend on AWS Amplify
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

#### Backend on AWS Elastic Beanstalk
1. Create new application
2. Upload source code
3. Configure environment variables
4. Add RDS (PostgreSQL) and ElastiCache (Redis)
5. Deploy

### 4. Google Cloud Platform

#### Frontend on Firebase Hosting
1. Install Firebase CLI
2. Initialize project: `firebase init hosting`
3. Build project: `npm run build`
4. Deploy: `firebase deploy`

#### Backend on Cloud Run
1. Build container image
2. Push to Container Registry
3. Deploy to Cloud Run
4. Add Cloud SQL (PostgreSQL) and Memorystore (Redis)

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

#### Backend `.env`
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://novaguard:novaguard_password@localhost:5432/novaguard
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-development-secret
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

#### Frontend `.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_NAME=NovaGuard
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 5. Start Development Servers

#### Backend
```bash
cd backend
npm run dev
```

#### Frontend
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📊 Database Setup

### PostgreSQL Schema
The application will automatically create necessary tables on first run. For manual setup:

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
