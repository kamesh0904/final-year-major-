@echo off
echo ========================================
echo   Free AI Agents - Quick Setup
echo ========================================
echo.

echo Step 1: Installing APScheduler...
cd backend
pip install apscheduler
if %errorlevel% neq 0 (
    echo ERROR: Failed to install apscheduler
    pause
    exit /b 1
)
echo ✓ APScheduler installed successfully
echo.

echo Step 2: Testing Pattern Detection Agent...
python test_pattern_detection.py
if %errorlevel% neq 0 (
    echo WARNING: Test had issues. Check output above.
    echo.
)
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run database migration (see FREE_AI_AGENTS_STATUS.md)
echo 2. Start backend: python main.py
echo 3. Scheduler will run automatically!
echo.
echo Daily checks: 9:00 AM
echo Weekly summaries: Sunday 8:00 PM
echo.
pause
