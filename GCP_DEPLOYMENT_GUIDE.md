# NeuroNest GCP Deployment Guide

This guide will help you deploy the NeuroNest application on Google Cloud Platform using Cloud Run for the backend and Firebase Hosting for the frontend.

## Architecture Overview

- **Frontend**: React/Vite app deployed on Firebase Hosting
- **Backend**: FastAPI Python app deployed on Cloud Run
- **Database**: Supabase (external)
- **Authentication**: Supabase Auth
- **AI Services**: OpenAI API

## Prerequisites

1. Google Cloud Platform account
2. Google Cloud CLI installed
3. Node.js and npm installed
4. Python 3.10+ installed
5. Supabase project set up
6. OpenAI API key

## Step 1: Setup GCP Project

```bash
# Install Google Cloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Login to GCP
gcloud auth login

# Create a new project (replace PROJECT_ID with your desired project ID)
gcloud projects create neuronest-app --name="NeuroNest"

# Set the project
gcloud config set project neuronest-app

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 2: Backend Deployment (Cloud Run)

### 2.1 Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 2.2 Create .dockerignore

Create `backend/.dockerignore`:

```
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
.DS_Store
test_*.py
```

### 2.3 Update Backend for Production

Create `backend/config.py`:

```python
import os
from typing import Optional

class Settings:
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://neuronest-app.web.app",  # Firebase Hosting URL
        "https://neuronest-app.firebaseapp.com"
    ]
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")

settings = Settings()
```

### 2.4 Deploy Backend to Cloud Run

```bash
# Navigate to backend directory
cd backend

# Build and deploy to Cloud Run
gcloud run deploy neuronest-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars ENVIRONMENT=production

# Set environment variables (replace with your actual values)
gcloud run services update neuronest-backend \
    --region us-central1 \
    --set-env-vars SUPABASE_URL=your-supabase-url \
    --set-env-vars SUPABASE_SERVICE_ROLE_KEY=your-supabase-key \
    --set-env-vars OPENAI_API_KEY=your-openai-key \
    --set-env-vars SECRET_KEY=your-secret-key
```

## Step 3: Frontend Deployment (Firebase Hosting)

### 3.1 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3.2 Initialize Firebase Project

```bash
# Navigate to project root
cd ..

# Initialize Firebase
firebase init

# Select:
# - Hosting: Configure files for Firebase Hosting
# - Use existing project or create new one
# - Public directory: dist
# - Single-page app: Yes
# - Automatic builds and deploys with GitHub: No (for now)
```

### 3.3 Create Firebase Configuration

Create `firebase.json`:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 3.4 Update Frontend Configuration

Update `frontend/src/api/neuroNestApi.ts`:

```typescript
// Use environment variable or fallback to local development
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

Create `frontend/.env.production`:

```
VITE_API_BASE_URL=https://neuronest-backend-[hash]-uc.a.run.app
```

### 3.5 Build and Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## Step 4: Environment Variables Setup

### 4.1 Backend Environment Variables

Set these in Cloud Run:

```bash
gcloud run services update neuronest-backend \
    --region us-central1 \
    --set-env-vars \
    ENVIRONMENT=production,\
    SUPABASE_URL=your-supabase-url,\
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key,\
    OPENAI_API_KEY=your-openai-api-key,\
    SECRET_KEY=your-secret-key-here
```

### 4.2 Frontend Environment Variables

Update `frontend/.env.production` with your actual Cloud Run URL:

```
VITE_API_BASE_URL=https://your-cloud-run-url
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 5: Domain Setup (Optional)

### 5.1 Custom Domain for Backend

```bash
# Map custom domain to Cloud Run
gcloud run domain-mappings create \
    --service neuronest-backend \
    --domain api.yourdomain.com \
    --region us-central1
```

### 5.2 Custom Domain for Frontend

```bash
# Add custom domain to Firebase Hosting
firebase hosting:channel:deploy production --only hosting
```

## Step 6: Monitoring and Logging

### 6.1 Enable Cloud Monitoring

```bash
# Enable monitoring API
gcloud services enable monitoring.googleapis.com

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=neuronest-backend" --limit 50
```

### 6.2 Set up Alerts

Create monitoring alerts for:
- High error rates
- High latency
- Memory usage
- CPU usage

## Step 7: Security Considerations

### 7.1 Update CORS Settings

Update `backend/main.py`:

```python
from config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7.2 Secure Environment Variables

Use Google Secret Manager for sensitive data:

```bash
# Create secrets
echo -n "your-openai-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-supabase-key" | gcloud secrets create supabase-service-key --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding openai-api-key \
    --member="serviceAccount:your-cloud-run-service-account" \
    --role="roles/secretmanager.secretAccessor"
```

## Step 8: CI/CD Setup (Optional)

### 8.1 GitHub Actions for Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Deploy to Cloud Run'
      run: |
        gcloud run deploy neuronest-backend \
          --source ./backend \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated
```

### 8.2 GitHub Actions for Frontend

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Firebase

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    
    - name: Build
      run: |
        cd frontend
        npm run build
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        projectId: neuronest-app
```

## Step 9: Testing Deployment

### 9.1 Health Checks

Test your deployed application:

```bash
# Test backend health
curl https://your-cloud-run-url/

# Test frontend
curl https://your-firebase-app.web.app/
```

### 9.2 Load Testing

Use Cloud Load Testing or Artillery.js to test performance:

```bash
npm install -g artillery
artillery quick --count 10 --num 5 https://your-cloud-run-url/
```

## Step 10: Maintenance

### 10.1 Regular Updates

```bash
# Update backend
gcloud run deploy neuronest-backend --source ./backend --region us-central1

# Update frontend
cd frontend && npm run build && firebase deploy
```

### 10.2 Monitoring

- Check Cloud Run metrics in GCP Console
- Monitor Firebase Hosting analytics
- Review application logs regularly

## Costs Estimation

**Monthly costs (approximate):**
- Cloud Run: $5-20 (depending on usage)
- Firebase Hosting: $0-5 (generous free tier)
- Cloud Build: $0-10 (first 120 builds/day free)
- Total: ~$5-35/month for moderate usage

## Troubleshooting

### Common Issues:

1. **CORS errors**: Update ALLOWED_ORIGINS in backend config
2. **Environment variables**: Ensure all required vars are set in Cloud Run
3. **Build failures**: Check Dockerfile and requirements.txt
4. **Database connection**: Verify Supabase credentials
5. **API timeouts**: Increase Cloud Run timeout settings

### Debug Commands:

```bash
# View Cloud Run logs
gcloud run services logs read neuronest-backend --region us-central1

# Check service status
gcloud run services describe neuronest-backend --region us-central1

# Test local build
docker build -t neuronest-backend ./backend
docker run -p 8080:8080 neuronest-backend
```

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domains
3. Implement CI/CD pipelines
4. Set up staging environment
5. Configure backup strategies
6. Implement security scanning

Your NeuroNest application should now be successfully deployed on GCP! 🚀