#!/bin/bash

# NeuroNest Mobile APK Build Script
# This script builds an APK file for Android

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "  NeuroNest Mobile APK Builder"
echo -e "========================================${NC}"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}[ERROR] EAS CLI is not installed!${NC}"
    echo ""
    echo "Installing EAS CLI globally..."
    npm install -g eas-cli
fi

echo -e "${GREEN}[INFO] EAS CLI is installed${NC}"
echo ""

# Check if logged in to Expo
echo -e "${BLUE}[INFO] Checking Expo login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}[WARN] Not logged in to Expo${NC}"
    echo ""
    echo "Please login to your Expo account:"
    eas login
fi

echo -e "${GREEN}[INFO] Logged in to Expo${NC}"
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INFO] Installing dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${BLUE}========================================"
echo "  Building APK (Preview Build)"
echo -e "========================================${NC}"
echo ""
echo "This will create an APK file that you can:"
echo "- Install directly on Android devices"
echo "- Share with testers"
echo "- Test before Play Store submission"
echo ""
echo "Build profile: preview"
echo "Build type: APK"
echo ""

# Build the APK
echo -e "${BLUE}[INFO] Starting build process...${NC}"
echo -e "${YELLOW}[INFO] This may take 10-20 minutes...${NC}"
echo ""

if eas build --platform android --profile preview; then
    echo ""
    echo -e "${GREEN}========================================"
    echo "  BUILD SUCCESSFUL!"
    echo -e "========================================${NC}"
    echo ""
    echo "Your APK has been built successfully!"
    echo ""
    echo "To download the APK:"
    echo "1. Check the build URL shown above"
    echo "2. Or run: eas build:list"
    echo "3. Download the APK from the Expo dashboard"
    echo ""
    echo "To install on your Android device:"
    echo "1. Transfer the APK to your phone"
    echo "2. Enable 'Install from Unknown Sources'"
    echo "3. Tap the APK file to install"
    echo ""
else
    echo ""
    echo -e "${RED}========================================"
    echo "  BUILD FAILED!"
    echo -e "========================================${NC}"
    echo ""
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "- Network connection problems"
    echo "- Expo account not configured"
    echo "- Missing dependencies"
    echo ""
    echo "Try running: npm install"
    echo "Then run this script again."
    echo ""
    exit 1
fi
