# NovaGuard Deployment Guide

## Overview

This guide covers the complete deployment process for NovaGuard, including environment setup, CI/CD pipeline configuration, and production deployment.

## Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase CLI
- Supabase CLI
- Docker (optional)
- GitHub account with repository access

## Environment Setup

### 1. Local Development

```bash
# Clone repository
git clone https://github.com/your-org/novaguard.git
cd novaguard

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

### 2. Environment Variables

Create `.env.local` with the following variables:

```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Blockchain
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## Database Setup

### 1. Supabase Setup

```bash
# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Run migrations
supabase db push

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

### 2. Database Migrations

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

## Firebase Setup

### 1. Initialize Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore
# - Storage
```

### 2. Configure Firebase Functions

```bash
cd functions
npm install
npm run build
cd ..

# Deploy functions
firebase deploy --only functions
```

## CI/CD Pipeline

### 1. GitHub Secrets

Configure the following secrets in your GitHub repository:

```
# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SUPABASE_ACCESS_TOKEN

# Clerk
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY

# Firebase
FIREBASE_TOKEN
FIREBASE_PROJECT_ID

# Blockchain
WALLETCONNECT_PROJECT_ID
ALCHEMY_API_KEY

# OpenAI
OPENAI_API_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Monitoring
DATADOG_API_KEY
DATADOG_APP_KEY
SENTRY_AUTH_TOKEN

# Notifications
SLACK_WEBHOOK
DISCORD_WEBHOOK

# Security
SNYK_TOKEN

# AWS (for backups)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

### 2. Workflow Configuration

The CI/CD pipeline includes:

- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Testing**: Unit tests, integration tests, E2E tests
- **Security**: Vulnerability scanning, dependency audits
- **Build**: Next.js build, Firebase Functions build
- **Deploy**: Firebase Hosting, Functions deployment
- **Monitoring**: Performance tests, health checks
- **Backup**: Database backups to S3

### 3. Branch Strategy

- `main`: Production branch
- `develop`: Development branch
- `feature/*`: Feature branches
- `hotfix/*`: Hotfix branches

## Production Deployment

### 1. Manual Deployment

```bash
# Build application
pnpm build

# Deploy to Firebase
firebase deploy --only hosting:production

# Deploy functions
firebase deploy --only functions

# Run database migrations
supabase db push --db-url $PRODUCTION_DB_URL
```

### 2. Automated Deployment

Deployments are triggered automatically on:
- Push to `main` branch
- Manual workflow dispatch
- Scheduled deployments (optional)

### 3. Rollback Procedure

```bash
# List previous versions
firebase hosting:versions:list

# Rollback to previous version
firebase hosting:versions:clone SOURCE_VERSION --target production

# Or rollback functions
firebase functions:config:clone --from SOURCE_PROJECT
```

## Monitoring & Observability

### 1. Application Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Datadog**: Infrastructure and application metrics
- **Lighthouse CI**: Performance monitoring
- **Uptime monitoring**: Health check endpoints

### 2. Database Monitoring

- **Supabase Dashboard**: Query performance, connections
- **Custom metrics**: API response times, error rates
- **Backup verification**: Automated backup testing

### 3. Security Monitoring

- **Snyk**: Dependency vulnerability scanning
- **Trivy**: Container security scanning
- **GitHub Security**: Code scanning and secret detection

## Backup & Recovery

### 1. Database Backups

```bash
# Manual backup
supabase db dump --db-url $DATABASE_URL > backup.sql

# Automated backups (configured in CI/CD)
# - Daily backups to S3
# - Retention: 30 days
# - Cross-region replication
```

### 2. Code Backups

- Git repository with multiple remotes
- Automated code archival
- Docker image registry backups

### 3. Recovery Procedures

```bash
# Database recovery
supabase db reset --db-url $DATABASE_URL
psql $DATABASE_URL < backup.sql

# Application recovery
firebase hosting:versions:clone BACKUP_VERSION --target production
```

## Performance Optimization

### 1. Frontend Optimization

- Next.js static generation
- Image optimization
- Code splitting
- CDN configuration

### 2. Backend Optimization

- Firebase Functions optimization
- Database query optimization
- Caching strategies
- Rate limiting

### 3. Monitoring Performance

- Core Web Vitals tracking
- API response time monitoring
- Database query performance
- User experience metrics

## Security Considerations

### 1. Authentication & Authorization

- Clerk authentication integration
- Row Level Security (RLS) in Supabase
- API key management
- JWT token validation

### 2. Data Protection

- Encryption at rest and in transit
- PII data handling
- GDPR compliance
- Audit logging

### 3. Infrastructure Security

- Firebase security rules
- HTTPS enforcement
- CORS configuration
- Rate limiting

## Troubleshooting

### 1. Common Issues

**Build Failures:**
```bash
# Clear cache
pnpm store prune
rm -rf .next node_modules
pnpm install

# Check environment variables
pnpm run env:check
```

**Database Connection Issues:**
```bash
# Test connection
supabase db ping --db-url $DATABASE_URL

# Check migrations
supabase migration list
```

**Deployment Failures:**
```bash
# Check Firebase status
firebase projects:list

# Verify authentication
firebase login --reauth
```

### 2. Debugging

- Enable debug logging in production
- Use Firebase Functions logs
- Monitor Sentry for errors
- Check Supabase logs

### 3. Support Contacts

- **Infrastructure**: DevOps team
- **Database**: Database team
- **Security**: Security team
- **Application**: Development team

## Maintenance

### 1. Regular Tasks

- Dependency updates
- Security patches
- Performance optimization
- Backup verification

### 2. Scheduled Maintenance

- Database maintenance windows
- Infrastructure updates
- Security audits
- Performance reviews

### 3. Documentation Updates

- Keep deployment guide current
- Update runbooks
- Maintain troubleshooting guides
- Document new procedures

## Scaling Considerations

### 1. Horizontal Scaling

- Firebase Functions auto-scaling
- Supabase connection pooling
- CDN optimization
- Load balancing

### 2. Vertical Scaling

- Database instance sizing
- Function memory allocation
- Storage optimization
- Network optimization

### 3. Cost Optimization

- Resource usage monitoring
- Cost allocation tracking
- Optimization recommendations
- Budget alerts

---

For additional support or questions, please contact the DevOps team or refer to the internal documentation portal.
