@echo off
echo ========================================
echo Starting NeuroNest Mobile App
echo ========================================
echo.
echo Make sure:
echo 1. Your phone is connected to the SAME WiFi as this computer
echo 2. Expo Go app is installed on your phone
echo 3. Backend is running (or deployed to GCP)
echo.
echo ========================================
echo.
cd /d "%~dp0"
call npx expo start
