# NeuroNest Mobile - APK Build Guide

## Quick Start - Build APK

### Option 1: Using Build Script (Easiest)

**Windows:**
```bash
cd mobile
build-apk.bat
```

**Mac/Linux:**
```bash
cd mobile
chmod +x build-apk.sh
./build-apk.sh
```

### Option 2: Manual Build

```bash
cd mobile

# 1. Install EAS CLI (if not installed)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build APK
eas build --platform android --profile preview
```

---

## Build Options

### Preview Build (APK) - For Testing
```bash
eas build --platform android --profile preview
```
- Creates an APK file
- Can be installed directly on devices
- Good for testing and sharing with testers
- Build time: ~10-20 minutes

### Production Build (AAB) - For Play Store
```bash
eas build --platform android --profile production
```
- Creates an AAB (Android App Bundle)
- Required for Google Play Store submission
- Optimized for distribution
- Build time: ~15-25 minutes

### Local Build (Faster, but requires Android SDK)
```bash
eas build --platform android --profile preview --local
```
- Builds on your machine
- Faster if you have Android SDK installed
- Requires more setup

---

## Prerequisites

### Required Tools
1. **Node.js** (18+) - Already installed ✓
2. **EAS CLI** - Will be installed by script
3. **Expo Account** - Free account at expo.dev

### Expo Account Setup
1. Go to https://expo.dev
2. Sign up for a free account
3. Verify your email
4. Run `eas login` and enter credentials

---

## Step-by-Step Build Process

### Step 1: Prepare Environment
```bash
cd mobile
npm install
```

### Step 2: Login to Expo
```bash
eas login
```
Enter your Expo credentials.

### Step 3: Start Build
```bash
eas build --platform android --profile preview
```

### Step 4: Wait for Build
- Build happens on Expo's servers
- Takes 10-20 minutes
- You'll see progress in terminal
- You can close terminal and check later

### Step 5: Download APK
Once build completes:
1. Click the build URL shown in terminal
2. Or visit: https://expo.dev/accounts/[your-username]/projects/neuronest-mobile/builds
3. Download the APK file

### Step 6: Install on Android Device
1. Transfer APK to your phone (via USB, email, or cloud)
2. On your phone, go to Settings > Security
3. Enable "Install from Unknown Sources"
4. Open the APK file
5. Tap "Install"

---

## Build Profiles Explained

### Preview Profile (eas.json)
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- Creates APK for direct installation
- Includes all environment variables
- Good for testing

### Production Profile
```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```
- Creates AAB for Play Store
- Optimized and signed
- Ready for store submission

---

## Checking Build Status

### List All Builds
```bash
eas build:list
```

### Check Specific Build
```bash
eas build:view [BUILD_ID]
```

### View in Dashboard
Visit: https://expo.dev/accounts/[your-username]/projects/neuronest-mobile/builds

---

## Troubleshooting

### Error: "Not logged in"
```bash
eas login
```

### Error: "Project not configured"
```bash
eas build:configure
```

### Error: "Build failed"
Check the build logs:
```bash
eas build:list
# Click on the failed build URL
```

### Error: "Network timeout"
- Check your internet connection
- Try again later
- Expo servers might be busy

### Error: "Invalid credentials"
- Make sure .env file exists
- Check environment variables in eas.json
- Verify Supabase and API URLs are correct

---

## Build Time Estimates

| Build Type | Time | Output |
|------------|------|--------|
| Preview (Cloud) | 10-20 min | APK |
| Production (Cloud) | 15-25 min | AAB |
| Local Build | 5-10 min | APK/AAB |

---

## After Building

### Testing the APK
1. Install on multiple Android devices
2. Test all features:
   - Login/Signup
   - Games
   - Chat
   - Profile
   - Reports
   - Diary
3. Check for crashes or bugs
4. Test on different Android versions

### Sharing with Testers
1. Upload APK to Google Drive or Dropbox
2. Share link with testers
3. Provide installation instructions
4. Collect feedback

### Preparing for Play Store
1. Build production AAB:
   ```bash
   eas build --platform android --profile production
   ```
2. Create Play Store listing
3. Prepare screenshots and descriptions
4. Submit for review

---

## Environment Variables

The APK includes these environment variables (from eas.json):

```
EXPO_PUBLIC_SUPABASE_URL=https://azwgugwqbmpdnkbaqhgo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[your-key]
EXPO_PUBLIC_API_URL=https://neuronest-backend-173555414031.us-central1.run.app
```

These are baked into the APK during build.

---

## Build Commands Reference

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Build locally (faster)
eas build --platform android --profile preview --local

# List all builds
eas build:list

# Cancel a build
eas build:cancel

# View build details
eas build:view [BUILD_ID]

# Configure build settings
eas build:configure

# Check Expo account
eas whoami

# Login to Expo
eas login

# Logout from Expo
eas logout
```

---

## Cost

- **Expo Free Plan**: 30 builds/month
- **Expo Production Plan**: Unlimited builds ($29/month)

For this project, the free plan should be sufficient.

---

## Next Steps After APK

1. **Test thoroughly** on real devices
2. **Fix any bugs** found during testing
3. **Gather feedback** from users
4. **Build production AAB** when ready
5. **Submit to Play Store** for distribution

---

## Support

- **Expo Docs**: https://docs.expo.dev/build/introduction/
- **EAS Build**: https://docs.expo.dev/build/setup/
- **Troubleshooting**: https://docs.expo.dev/build-reference/troubleshooting/

---

## Quick Commands

```bash
# Everything in one go
cd mobile && npm install && eas login && eas build --platform android --profile preview

# Check build status
eas build:list

# Download latest build
# Visit the URL from build:list output
```

---

**Ready to build?** Run `build-apk.bat` (Windows) or `./build-apk.sh` (Mac/Linux) to get started!
