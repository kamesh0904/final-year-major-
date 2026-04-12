@echo off
REM NeuroNest Security Fixes Installation Script (Windows)
REM Run this script to install all security-related dependencies

echo.
echo ============================================
echo   Installing NeuroNest Security Fixes
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "backend\requirements.txt" (
    echo ERROR: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend

REM Check if virtual environment exists
if not exist "venv" if not exist "..\venv" (
    echo No virtual environment found. Creating one...
    python -m venv ..\venv
    echo Virtual environment created
)

REM Activate virtual environment
if exist "..\venv\Scripts\activate.bat" (
    call ..\venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo.
echo Installing requirements...
pip install -r requirements.txt

if %ERRORLEVEL% EQU 0 (
    echo Backend dependencies installed successfully
) else (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

cd ..

REM Install frontend dependencies
if exist "frontend" (
    echo.
    echo Checking frontend dependencies...
    cd frontend
    
    if exist "package.json" (
        echo Installing frontend dependencies...
        call npm install
        
        if %ERRORLEVEL% EQU 0 (
            echo Frontend dependencies installed successfully
        ) else (
            echo ERROR: Failed to install frontend dependencies
        )
    )
    
    cd ..
)

REM Install mobile dependencies
if exist "mobile" (
    echo.
    echo Checking mobile dependencies...
    cd mobile
    
    if exist "package.json" (
        echo Installing mobile dependencies...
        call npm install
        
        if %ERRORLEVEL% EQU 0 (
            echo Mobile dependencies installed successfully
        ) else (
            echo ERROR: Failed to install mobile dependencies
        )
    )
    
    cd ..
)

echo.
echo ============================================
echo   Security fixes installation complete!
echo ============================================
echo.
echo Next Steps:
echo 1. Update your .env file with SECRET_KEY
echo 2. Run tests: cd backend ^&^& pytest
echo 3. Start backend: cd backend ^&^& python main.py
echo 4. Review BUGS_FIXED_SUMMARY.md for testing instructions
echo.
echo Your application is now more secure!
echo.
pause
