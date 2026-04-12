#!/bin/bash

# NeuroNest Security Fixes Installation Script
# Run this script to install all security-related dependencies

echo "🔒 Installing NeuroNest Security Fixes..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d "../venv" ]; then
    echo "⚠️  No virtual environment found. Creating one..."
    python -m venv ../venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
if [ -d "../venv" ]; then
    source ../venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install/upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Error installing backend dependencies"
    exit 1
fi

cd ..

# Install frontend dependencies (if needed)
if [ -d "frontend" ]; then
    echo ""
    echo "📦 Checking frontend dependencies..."
    cd frontend
    
    if [ -f "package.json" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
        
        if [ $? -eq 0 ]; then
            echo "✅ Frontend dependencies installed successfully"
        else
            echo "❌ Error installing frontend dependencies"
        fi
    fi
    
    cd ..
fi

# Install mobile dependencies (if needed)
if [ -d "mobile" ]; then
    echo ""
    echo "📦 Checking mobile dependencies..."
    cd mobile
    
    if [ -f "package.json" ]; then
        echo "📦 Installing mobile dependencies..."
        npm install
        
        if [ $? -eq 0 ]; then
            echo "✅ Mobile dependencies installed successfully"
        else
            echo "❌ Error installing mobile dependencies"
        fi
    fi
    
    cd ..
fi

echo ""
echo "=========================================="
echo "✅ Security fixes installation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your .env file with SECRET_KEY"
echo "2. Run tests: cd backend && pytest"
echo "3. Start backend: cd backend && python main.py"
echo "4. Review BUGS_FIXED_SUMMARY.md for testing instructions"
echo ""
echo "🔒 Your application is now more secure!"
