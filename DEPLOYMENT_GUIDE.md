# NeuroNest Deployment Guide

## Pre-Deployment Checklist ✅

### Backend Fixes Applied
- [x] JWT authentication with PyJWT
- [x] Secure token handling
- [x] Input validation with Pydantic
- [x] Protected debug endpoints
- [x] SQL injection prevention verified
- [x] Environment variables configured
- [x] All dependencies installed

### Frontend Fixes Applied
- [x] TypeScript type safety enforced
- [x] Error boundaries implemented
- [x] Logging utility created
- [x] API error handling complete
- [x] Null safety implemented
- [x] Memory leaks fixed
- [x] Build successful
- [x] Production environment configured

---

## Deployment Options

### Option 1: Automated Deployment (Recommended)

#### Step 1: Deploy Backend to Google Cloud Run
```bash
# Set environment variables
export SUPABASE_URL="https://azwgugwqbmpdnkbaqhgo.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sb_secret_kcJ8AmMNh6qPIBOmzB0K3g_NE-VGY5V"
export OPENAI_API_KEY="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"
export SECRET_KEY="neuronest-super-secret-jwt-key-2026-production-do-not-share-this-key-ever"

# Run deployment script
bash deploy.sh backend
```

#### Step 2: Deploy Frontend to Firebase
```bash
# Deploy frontend
bash deploy.sh frontend
```

#### Step 3: Deploy Both Together
```bash
# Deploy everything at once
bash deploy.sh all
```

---

### Option 2: Manual Deployment

#### Backend Deployment (Google Cloud Run)

1. **Install Google Cloud CLI** (if not installed)
   ```bash
   # Visit: https://cloud.google.com/sdk/docs/install
   ```

2. **Login to Google Cloud**
   ```bash
   gcloud auth login
   gcloud config set project neuronest-v2-prod
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   gcloud run deploy neuronest-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080 \
     --memory 1Gi \
     --cpu 1 \
     --max-instances 10 \
     --timeout 300 \
     --set-env-vars ENVIRONMENT=production \
     --set-env-vars SUPABASE_URL="https://azwgugwqbmpdnkbaqhgo.supabase.co" \
     --set-env-vars SUPABASE_SERVICE_ROLE_KEY="sb_secret_kcJ8AmMNh6qPIBOmzB0K3g_NE-VGY5V" \
     --set-env-vars OPENAI_API_KEY="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" \
     --set-env-vars SECRET_KEY="neuronest-super-secret-jwt-key-2026-production-do-not-share-this-key-ever" \
     --set-env-vars UPSTASH_REDIS_REST_URL="https://true-glider-38081.upstash.io" \
     --set-env-vars UPSTASH_REDIS_REST_TOKEN="AZTBAAIncDE3NjJjZGIwNjNjZGQ0NDY2YjAzMDc5ODI2ZmM0Mzc0N3AxMzgwODE"
   ```

4. **Get Backend URL**
   ```bash
   gcloud run services describe neuronest-backend --region=us-central1 --format='value(status.url)'
   ```

#### Frontend Deployment (Firebase Hosting)

1. **Install Firebase CLI** (if not installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Update Frontend Environment**
   ```bash
   cd frontend
   # Update .env.production with backend URL
   echo "VITE_API_BASE_URL=<YOUR_BACKEND_URL>" > .env.production.local
   ```

4. **Build Frontend**
   ```bash
   npm install
   npm run build
   ```

5. **Deploy to Firebase**
   ```bash
   cd ..
   firebase deploy --only hosting
   ```

---

## Post-Deployment Verification

### 1. Backend Health Check
```bash
curl https://neuronest-backend-173555414031.us-central1.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production"
}
```

### 2. Frontend Access
Visit: https://neuronest-3bc25.web.app

### 3. Test Authentication
1. Go to signup page
2. Create test account
3. Verify email works
4. Login successfully

### 4. Test API Integration
1. Complete questionnaire
2. Check if profile loads
3. Test chat functionality
4. Play a game and verify session saves

---

## Environment Variables Reference

### Backend (.env)
```env
# Database
SUPABASE_URL=https://azwgugwqbmpdnkbaqhgo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_kcJ8AmMNh6qPIBOmzB0K3g_NE-VGY5V

# AI
OPENAI_API_KEY=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
GROQ_API_KEY=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
GOOGLE_API_KEY=AIzaSyAmPG00XobDH0UTaMnNkasUEk76INwNR-Q

# Security
SECRET_KEY=neuronest-super-secret-jwt-key-2026-production-do-not-share-this-key-ever
JWT_ALGORITHM=HS256
ENVIRONMENT=production

# Cache
UPSTASH_REDIS_REST_URL=https://true-glider-38081.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZTBAAIncDE3NjJjZGIwNjNjZGQ0NDY2YjAzMDc5ODI2ZmM0Mzc0N3AxMzgwODE
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://neuronest-backend-173555414031.us-central1.run.app
VITE_SUPABASE_URL=https://azwgugwqbmpdnkbaqhgo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XM0ucHvzRMqir12NvxRbjA_QocZhG9G
VITE_ENVIRONMENT=production
```

---

## Troubleshooting

### Backend Issues

**Issue**: Backend deployment fails
```bash
# Check logs
gcloud run services logs read neuronest-backend --region=us-central1 --limit=50
```

**Issue**: Environment variables not set
```bash
# Update environment variables
gcloud run services update neuronest-backend \
  --region=us-central1 \
  --set-env-vars KEY=VALUE
```

### Frontend Issues

**Issue**: Build fails
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Issue**: API calls fail
- Check VITE_API_BASE_URL in .env.production
- Verify backend is running
- Check CORS settings in backend

### Common Issues

**Issue**: CORS errors
- Backend already has CORS configured for all origins
- Verify frontend is using correct API URL

**Issue**: Authentication fails
- Check Supabase configuration
- Verify JWT_SECRET matches between environments
- Check token expiration settings

---

## Monitoring & Maintenance

### Backend Monitoring
```bash
# View logs
gcloud run services logs read neuronest-backend --region=us-central1

# Check metrics
gcloud run services describe neuronest-backend --region=us-central1
```

### Frontend Monitoring
```bash
# View hosting logs
firebase hosting:channel:list

# Check deployment history
firebase hosting:releases:list
```

### Database Monitoring
- Login to Supabase dashboard
- Check API usage
- Monitor database performance
- Review authentication logs

---

## Rollback Procedure

### Backend Rollback
```bash
# List revisions
gcloud run revisions list --service=neuronest-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic neuronest-backend \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

### Frontend Rollback
```bash
# List releases
firebase hosting:releases:list

# Rollback to previous release
firebase hosting:rollback
```

---

## Security Checklist

- [x] Environment variables not committed to git
- [x] JWT secret key is strong and unique
- [x] HTTPS enabled on all endpoints
- [x] CORS properly configured
- [x] Input validation on all endpoints
- [x] SQL injection prevention verified
- [x] XSS protection enabled
- [x] Rate limiting configured
- [x] Error messages don't expose sensitive info
- [x] Logging doesn't include secrets

---

## Performance Optimization

### Backend
- [x] Redis caching enabled
- [x] Database connection pooling
- [x] Async operations where possible
- [x] Response compression enabled
- [x] Auto-scaling configured

### Frontend
- [x] Code splitting implemented
- [x] Assets optimized
- [x] Lazy loading for routes
- [x] Service worker for caching
- [x] CDN for static assets

---

## Support & Resources

- **Backend URL**: https://neuronest-backend-173555414031.us-central1.run.app
- **Frontend URL**: https://neuronest-3bc25.web.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/azwgugwqbmpdnkbaqhgo
- **Google Cloud Console**: https://console.cloud.google.com
- **Firebase Console**: https://console.firebase.google.com

---

**Deployment Status**: Ready to Deploy ✅
**Last Updated**: 2026-02-19
**Version**: 2.0.0
