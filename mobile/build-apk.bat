@echo off
REM NeuroNest Mobile APK Build Script for Windows
REM This script builds an APK file for Android

echo ========================================
echo   NeuroNest Mobile APK Builder
echo ========================================
echo.

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] EAS CLI is not installed!
    echo.
    echo Installing EAS CLI globally...
    call npm install -g eas-cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install EAS CLI
        exit /b 1
    )
)

echo [INFO] EAS CLI is installed
echo.

REM Check if logged in to Expo
echo [INFO] Checking Expo login status...
call eas whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Not logged in to Expo
    echo.
    echo Please login to your Expo account:
    call eas login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed
        exit /b 1
    )
)

echo [INFO] Logged in to Expo
echo.

REM Navigate to mobile directory
cd /d "%~dp0"

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        exit /b 1
    )
)

echo.
echo ========================================
echo   Building APK (Preview Build)
echo ========================================
echo.
echo This will create an APK file that you can:
echo - Install directly on Android devices
echo - Share with testers
echo - Test before Play Store submission
echo.
echo Build profile: preview
echo Build type: APK
echo.

REM Build the APK
echo [INFO] Starting build process...
echo [INFO] This may take 10-20 minutes...
echo.

call eas build --platform android --profile preview --local

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Your APK has been built successfully!
    echo.
    echo To download the APK:
    echo 1. Check the build URL shown above
    echo 2. Or run: eas build:list
    echo 3. Download the APK from the Expo dashboard
    echo.
    echo To install on your Android device:
    echo 1. Transfer the APK to your phone
    echo 2. Enable "Install from Unknown Sources"
    echo 3. Tap the APK file to install
    echo.
) else (
    echo.
    echo ========================================
    echo   BUILD FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common issues:
    echo - Network connection problems
    echo - Expo account not configured
    echo - Missing dependencies
    echo.
    echo Try running: npm install
    echo Then run this script again.
    echo.
)

pause
