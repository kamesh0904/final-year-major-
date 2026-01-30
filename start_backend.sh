#!/bin/bash

echo "Starting NeuroNest Backend Server..."
echo

cd backend

echo "Checking Python installation..."
python3 --version
if [ $? -ne 0 ]; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

echo
echo "Installing/updating dependencies..."
pip3 install -r requirements.txt

echo
echo "Starting FastAPI server..."
echo "Backend will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo

python3 main.py