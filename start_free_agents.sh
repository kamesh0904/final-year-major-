#!/bin/bash

# Start Free AI Agents - Quick Setup Script
# This script sets up and tests the free AI agents

echo "🤖 NeuroNest Free AI Agents Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
cd backend
pip install apscheduler
echo "✅ Dependencies installed"
echo ""

# Step 2: Check database connection
echo "🔍 Step 2: Checking database connection..."
python -c "from database import supabase; print('✅ Database connected')" 2>/dev/null || echo "⚠️  Database connection issue - check your .env file"
echo ""

# Step 3: Run test
echo "🧪 Step 3: Testing Pattern Detection Agent..."
echo ""
python test_pattern_detection.py
echo ""

# Step 4: Instructions
echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Run the database migration:"
echo "   - Go to Supabase SQL Editor"
echo "   - Run: backend/migrations/add_wellness_checkins.sql"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   python main.py"
echo ""
echo "3. The scheduler will automatically:"
echo "   - Check patterns daily at 9 AM"
echo "   - Send weekly summaries on Sunday at 8 PM"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:8000/api/wellness/analyze-patterns/USER_ID"
echo ""
echo "💡 See FREE_AI_AGENTS_IMPLEMENTATION.md for full documentation"
echo ""
