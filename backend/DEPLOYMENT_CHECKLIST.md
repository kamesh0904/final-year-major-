# Pre-Deployment Checklist

## Before Running ./deploy.sh backend

### ✅ Code Changes Complete
- [x] Rate limiting added (slowapi)
- [x] Caching infrastructure created (core/cache.py)
- [x] Dependencies updated (requirements.txt)
- [x] Health check enhanced
- [x] API docs enabled (/docs, /redoc)
- [x] Duplicate endpoints removed
- [x] main.py fixed and tested

### 📋 Required Steps

#### 1. Database Migrations
Run these SQL files in Supabase SQL Editor in order:

**First (Security - if not done yet):**
```
backend/migrations/fix_security_and_performance.sql
```

**Second (Performance - NEW):**
```
backend/migrations/add_performance_indexes.sql
```

**Verification:**
Check that indexes were created successfully.

---

#### 2. Environment Variables for Cloud Run

**CRITICAL:** Add these to Cloud Run before deploying:

```bash
# Existing variables (keep these)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
ENVIRONMENT=production
SECRET_KEY=your_secret_key

# NEW - Redis Cache (IMPORTANT!)
# If you haven't set up Upstash yet, you can skip these for now
# The app will work without caching, just slower and more expensive
UPSTASH_REDIS_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_TOKEN=your_token_here
```

**To add envir vars to Cloud Run:**
```bash
# Option 1: Via deploy.sh (add to the script)
# Option 2: Via gcloud CLI
gcloud run services update neuronest-backend \
  --region us-central1 \
  --set-env-vars UPSTASH_REDIS_URL=your_url,UPSTASH_REDIS_TOKEN=your_token

# Option 3: Via GCP Console
# Go to Cloud Run > neuronest-backend > Edit > Variables & Secrets
```

---

#### 3. Deploy Options

**Option A: Quick Deploy (Skip Redis for Now)**
Deploy without caching first, add Redis later:
1. Deploy without Redis env vars
2. App will work but cache will be disabled
3. Set up Upstash later and redeploy

**Option B: Full Deploy (With Redis)**
1. Set up Upstash Redis first (see UPSTASH_SETUP.md)
2. Add Redis env vars to Cloud Run
3. Deploy with full caching enabled

---

## Deployment Commands

### Using deploy.sh
```bash
# Make sure you're in project root
cd /c/Users/vivek/OneDrive/Desktop/NeuroNest_v2

# Set environment variables for deployment
export SUPABASE_URL="your_url"
export SUPABASE_SERVICE_ROLE_KEY="your_key"
export OPENAI_API_KEY="your_key"

# Deploy backend only
./deploy.sh backend
```

### Manual Deployment
```bash
cd backend

# Deploy to Cloud Run
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
  --set-env-vars ENVIRONMENT=production,SUPABASE_URL="$SUPABASE_URL",SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY",OPENAI_API_KEY="$OPENAI_API_KEY"
```

---

## Post-Deployment Verification

### 1. Check Health Endpoint
```bash
# Get your backend URL
curl https://neuronest-backend-xxx.run.app/health

# Expected output:
{
  "status": "healthy",
  "supabase_connected": true,
  "openai_configured": true,
  "redis_connected": true or false  # depending on setup
}
```

### 2. Check API Docs
Visit: `https://neuronest-backend-xxx.run.app/docs`
Should see Swagger UI interface

### 3. Test Rate Limiting
Send 11 chat requests in 1 minute - 11th should fail

### 4. Check Logs
```bash
gcloud run logs read neuronest-backend --region us-central1 --limit 50
```

Look for:
- "✅ Redis cache connected" (if configured)
- "✅ AI agents initialized successfully"
- "✅ Supabase connected successfully"

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'slowapi'"
**Cause:** Dependencies not installed during build
**Fix:** Cloud Run uses requirements.txt automatically, should work

### "redis_connected: false" in health check
**Cause:** Redis env vars not set or incorrect
**Fix:** Add UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to Cloud Run

### "500 Internal Server Error"
**Check logs:**
```bash
gcloud run logs read neuronest-backend --region us-central1 --limit 100
```

Common issues:
- Missing environment variables
- Database connection failure
- OpenAI API key invalid

---

## Recommended Deployment Order

1. ✅ **Test Locally First**
   ```bash
   cd backend
   python main.py
   # Visit http://localhost:8000/health
   ```

2. 📊 **Run Database Migrations**
   - Run add_performance_indexes.sql in Supabase

3. 🚀 **Deploy without Redis** (Quick)
   - Skip Redis env vars
   - Deploy and verify
   - App works, just no caching

4. 💾 **Add Redis Later** (Optional)
   - Set up Upstash (5 minutes)
   - Add env vars to Cloud Run
   - Redeploy

---

**Ready to deploy?** Choose Option A or B above and follow the steps!
