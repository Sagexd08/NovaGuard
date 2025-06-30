# 🚀 Flash Audit Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code changes committed and pushed to GitHub
- [ ] Railway references removed from codebase
- [ ] Vercel configuration files in place
- [ ] API functions migrated to serverless format
- [ ] Environment variables updated for Vercel + Supabase

### 2. Supabase Setup
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] RLS policies configured
- [ ] API keys copied (URL, anon key, service role key)

### 3. Vercel Configuration
- [ ] Root vercel.json configured
- [ ] Frontend vercel.json simplified
- [ ] Package.json scripts updated for Vercel
- [ ] API functions structure verified

## 🔧 Deployment Steps

### Step 1: Supabase Database
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `flash-audit-db`
3. Run database migrations from `supabase/migrations/`
4. Copy project URL and API keys

### Step 2: Vercel Deployment
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure project:
   - **Framework**: Other
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`

### Step 3: Environment Variables
Add these to Vercel dashboard:

```bash
# Frontend Variables
VITE_API_BASE_URL=/api
VITE_APP_NAME=FlashAudit
VITE_APP_VERSION=2.0.0
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key

# Backend Variables
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
CLERK_SECRET_KEY=your-clerk-secret
OPENROUTER_API_KEY=your-openrouter-key
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

### Step 4: Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Test deployment

## 🧪 Post-Deployment Testing

### Verify Deployment
- [ ] Frontend loads at `https://your-app.vercel.app`
- [ ] API health check: `https://your-app.vercel.app/api/health`
- [ ] API status: `https://your-app.vercel.app/api/functions/v1/status`
- [ ] Database connection working
- [ ] Authentication flow working

### Test Core Features
- [ ] Contract upload and analysis
- [ ] Project creation and management
- [ ] AI-powered vulnerability detection
- [ ] Real-time collaboration features
- [ ] Export functionality

## 🔄 Continuous Deployment

### Automatic Deployments
- Vercel automatically deploys on git push
- Preview deployments for pull requests
- Production deployments from main branch

### Monitoring
- Check Vercel function logs
- Monitor Supabase usage
- Set up error tracking (optional)

## 🆘 Troubleshooting

### Common Issues
1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify package.json scripts
   - Ensure all dependencies installed

2. **API Errors**
   - Check function logs in Vercel
   - Verify environment variables
   - Test API endpoints individually

3. **Database Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Review database logs

### Getting Help
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- GitHub Issues: Create issue in repository

## 🎉 Success Metrics

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ API endpoints respond correctly
- ✅ Database operations work
- ✅ Authentication flows complete
- ✅ Core features functional

---

**Note**: This deployment strategy replaces the previous Railway setup and provides a more scalable, serverless architecture using Vercel + Supabase.
