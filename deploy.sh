#!/bin/bash

# NeuroNest GCP Deployment Script
# This script helps deploy the NeuroNest application to Google Cloud Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="neuronest-app"
BACKEND_SERVICE="neuronest-backend"
REGION="us-central1"

echo -e "${BLUE}🚀 NeuroNest GCP Deployment Script${NC}"
echo "=================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️ Not logged in to Google Cloud. Please login first.${NC}"
    gcloud auth login
fi

# Set project
echo -e "${BLUE}📋 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Function to deploy backend
deploy_backend() {
    echo -e "${BLUE}🔧 Deploying Backend to Cloud Run...${NC}"
    
    cd backend
    
    # Check if required environment variables are set
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        echo "Please set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
        echo ""
        echo "Example:"
        echo "export SUPABASE_URL='your-supabase-url'"
        echo "export SUPABASE_SERVICE_ROLE_KEY='your-supabase-key'"
        echo "export OPENAI_API_KEY='your-openai-key'"
        exit 1
    fi
    
    # Deploy to Cloud Run
    gcloud run deploy $BACKEND_SERVICE \
        --source . \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --timeout 300 \
        --set-env-vars ENVIRONMENT=production \
        --set-env-vars SUPABASE_URL="$SUPABASE_URL" \
        --set-env-vars SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
        --set-env-vars OPENAI_API_KEY="$OPENAI_API_KEY" \
        --set-env-vars SECRET_KEY="${SECRET_KEY:-neuronest-secret-key-change-me}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo -e "${GREEN}🌐 Backend URL: $SERVICE_URL${NC}"
    
    # Test the deployment
    echo -e "${BLUE}🧪 Testing backend deployment...${NC}"
    if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend health check failed, but deployment completed.${NC}"
    fi
    
    cd ..
    
    # Save backend URL for frontend
    echo "VITE_API_BASE_URL=$SERVICE_URL" > frontend/.env.production.local
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${BLUE}🎨 Deploying Frontend to Firebase Hosting...${NC}"
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo -e "${YELLOW}⚠️ Firebase CLI not found. Installing...${NC}"
        npm install -g firebase-tools
    fi
    
    # Check if user is logged in to Firebase
    if ! firebase projects:list &> /dev/null; then
        echo -e "${YELLOW}⚠️ Not logged in to Firebase. Please login first.${NC}"
        firebase login
    fi
    
    cd frontend
    
    # Install dependencies
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
    
    # Create production environment file if it doesn't exist
    if [ ! -f .env.production.local ]; then
        echo -e "${YELLOW}⚠️ No .env.production.local found. Creating template...${NC}"
        echo "VITE_API_BASE_URL=https://your-backend-url" > .env.production.local
        echo "VITE_SUPABASE_URL=your-supabase-url" >> .env.production.local
        echo "VITE_SUPABASE_ANON_KEY=your-supabase-anon-key" >> .env.production.local
        echo "VITE_ENVIRONMENT=production" >> .env.production.local
        echo -e "${RED}❌ Please update .env.production.local with your actual values and run again.${NC}"
        exit 1
    fi
    
    # Build the application
    echo -e "${BLUE}🔨 Building frontend application...${NC}"
    npm run build
    
    # Deploy to Firebase
    echo -e "${BLUE}🚀 Deploying to Firebase Hosting...${NC}"
    firebase deploy --only hosting
    
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "${GREEN}🌐 Frontend URL: https://$PROJECT_ID.web.app${NC}"
    
    cd ..
}

# Function to setup GCP project
setup_project() {
    echo -e "${BLUE}🏗️ Setting up GCP project...${NC}"
    
    # Create project if it doesn't exist
    if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
        echo -e "${BLUE}📋 Creating project $PROJECT_ID...${NC}"
        gcloud projects create $PROJECT_ID --name="NeuroNest"
    fi
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    echo -e "${BLUE}🔌 Enabling required APIs...${NC}"
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    echo -e "${GREEN}✅ Project setup complete!${NC}"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     Setup GCP project and enable APIs"
    echo "  backend   Deploy backend to Cloud Run"
    echo "  frontend  Deploy frontend to Firebase Hosting"
    echo "  all       Deploy both backend and frontend"
    echo "  help      Show this help message"
    echo ""
    echo "Environment Variables (required for backend deployment):"
    echo "  SUPABASE_URL              Your Supabase project URL"
    echo "  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key"
    echo "  OPENAI_API_KEY            Your OpenAI API key"
    echo "  SECRET_KEY                Secret key for the application (optional)"
}

# Main script logic
case "${1:-all}" in
    "setup")
        setup_project
        ;;
    "backend")
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "all")
        deploy_backend
        deploy_frontend
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Your NeuroNest app is now live on Google Cloud Platform!${NC}"