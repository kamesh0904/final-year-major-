# NeuroNest Mobile App - Complete Setup Guide

This guide will help you set up, develop, and deploy the NeuroNest mobile application for iOS and Android.

## 📱 Overview

The mobile app is built with:
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe development
- **Supabase** - Authentication and database
- **Same Backend** - Uses your existing GCP backend

## 🎯 What You Get

✅ **Exact same features as web app**:
- User authentication (login/signup)
- 10 therapeutic games
- AI chatbot companion
- Daily & weekly reports
- Profile with high scores
- Personal diary
- Gentle goal tracking
- Post-game questionnaires

✅ **Native mobile experience**:
- Smooth animations
- Touch gestures
- Push notifications (ready to add)
- Offline support (ready to add)
- Native performance

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Prerequisites

```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org

# Install Expo CLI globally
npm install -g expo-cli

# Verify installation
expo --version
```

### Step 2: Setup Project

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install
```

### Step 3: Configure Environment

Create `mobile/.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=https://your-backend-url.run.app
```

**Get these values from:**
- Supabase: Project Settings → API
- Backend URL: Your GCP Cloud Run URL

### Step 4: Start Development

```bash
# Start Expo dev server
npm start
```

This opens Expo DevTools in your browser with a QR code.

### Step 5: Test on Your Phone

**Option A: Use Expo Go (Easiest)**

1. Install **Expo Go** app:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Scan QR code from Expo DevTools:
   - iOS: Use Camera app
   - Android: Use Expo Go app

3. App loads on your phone instantly! 🎉

**Option B: Use Simulator/Emulator**

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   ├── supabase.ts      # Supabase configuration
│   │   └── api.ts           # API client with auth
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state
│   ├── navigation/
│   │   └── MainNavigator.tsx # Bottom tab navigation
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── SignupScreen.tsx
│       ├── HomeScreen.tsx
│       ├── GamesScreen.tsx
│       ├── ChatScreen.tsx
│       ├── ProfileScreen.tsx
│       └── QuestionnaireScreen.tsx
├── App.tsx                   # Root component
├── app.json                  # Expo configuration
├── package.json              # Dependencies
└── .env                      # Environment variables
```

## 🎨 Customization

### Change App Name

Edit `mobile/app.json`:

```json
{
  "expo": {
    "name": "NeuroNest",  // Change this
    "slug": "neuronest-mobile"
  }
}
```

### Change App Icon

1. Create 1024x1024 PNG image
2. Replace `mobile/assets/icon.png`
3. Run: `expo prebuild --clean`

### Change Splash Screen

1. Create 1242x2436 PNG image
2. Replace `mobile/assets/splash.png`

### Change Colors

Edit styles in each screen file. Main color: `#8B5CF6` (purple)

## 🏗️ Building for Production

### Prerequisites

1. **Create Expo Account**:
   ```bash
   expo register
   expo login
   ```

2. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

3. **Configure EAS**:
   ```bash
   cd mobile
   eas build:configure
   ```

### Build Android APK

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

**Download APK**: Check your Expo dashboard or email for download link.

### Build iOS App

```bash
# Build for App Store
eas build --platform ios --profile production
```

**Requirements**:
- Apple Developer Account ($99/year)
- Mac computer (for local builds)

## 📱 Publishing to App Stores

### Google Play Store

#### 1. Prepare Assets

- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: At least 2 (phone + tablet)
- **Privacy Policy**: URL to your policy
- **App Description**: 80-4000 characters

#### 2. Create Play Console Account

- Go to: https://play.google.com/console
- Pay $25 one-time fee
- Complete account setup

#### 3. Create App Listing

1. Click "Create app"
2. Fill in app details
3. Upload assets
4. Set content rating
5. Set pricing (Free)

#### 4. Upload Build

```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

#### 5. Submit for Review

- Complete all required sections
- Click "Send for review"
- Wait 1-3 days for approval

### Apple App Store

#### 1. Prepare Assets

- **App Icon**: 1024x1024 PNG
- **Screenshots**: Various sizes for different devices
- **Privacy Policy**: URL to your policy
- **App Description**: Up to 4000 characters

#### 2. Create App Store Connect Account

- Go to: https://appstoreconnect.apple.com
- Need Apple Developer Program ($99/year)
- Complete account setup

#### 3. Create App Record

1. Click "My Apps" → "+"
2. Fill in app information
3. Upload screenshots
4. Set pricing (Free)

#### 4. Upload Build

```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

#### 5. Submit for Review

- Complete all required sections
- Click "Submit for Review"
- Wait 1-7 days for approval

## 🔧 Development Tips

### Hot Reload

Changes to code automatically reload in Expo Go. Shake device to open dev menu.

### Debugging

```bash
# Open React Native Debugger
# In Expo Go: Shake device → "Debug Remote JS"
```

### Clear Cache

```bash
expo start -c
```

### Update Dependencies

```bash
npm update
expo upgrade
```

## 🐛 Troubleshooting

### "Unable to resolve module"

```bash
rm -rf node_modules
npm install
expo start -c
```

### "Network request failed"

- Check backend URL in `.env`
- Ensure backend is running
- Check phone is on same network (for local dev)

### iOS Build Fails

- Ensure you have Apple Developer account
- Check bundle identifier is unique
- Verify certificates in App Store Connect

### Android Build Fails

- Check package name is unique
- Verify keystore configuration
- Check EAS build logs

## 📊 Analytics & Monitoring

### Add Analytics (Optional)

```bash
expo install expo-firebase-analytics
```

### Add Crash Reporting (Optional)

```bash
expo install expo-firebase-crashlytics
```

## 🔐 Security Best Practices

✅ **Implemented**:
- Secure token storage (AsyncStorage)
- HTTPS only API calls
- Environment variables for secrets
- Auth token in headers

✅ **Recommended**:
- Enable 2FA for app store accounts
- Use Expo's secure storage for sensitive data
- Implement certificate pinning
- Add biometric authentication

## 📈 Performance Optimization

✅ **Already Optimized**:
- Lazy loading screens
- Memoized components
- Optimized images
- Efficient re-renders

✅ **Can Add**:
- Image caching
- Offline data persistence
- Background sync
- Push notifications

## 🚀 Deployment Checklist

### Before Building

- [ ] Update version in `app.json`
- [ ] Test all features on iOS and Android
- [ ] Update environment variables
- [ ] Test with production backend
- [ ] Update app icons and splash screens
- [ ] Prepare app store assets
- [ ] Write privacy policy
- [ ] Test on multiple devices

### App Store Submission

- [ ] Create app store listings
- [ ] Upload screenshots
- [ ] Write descriptions
- [ ] Set pricing and availability
- [ ] Configure age ratings
- [ ] Add privacy policy URL
- [ ] Submit for review

### After Approval

- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Plan updates
- [ ] Monitor analytics

## 📞 Support Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Supabase Docs**: https://supabase.com/docs
- **Play Console Help**: https://support.google.com/googleplay
- **App Store Connect Help**: https://developer.apple.com/support

## 💡 Next Steps

1. **Test Locally**: Run on your phone with Expo Go
2. **Customize**: Change colors, icons, branding
3. **Build**: Create production builds
4. **Test Builds**: Install APK/IPA on devices
5. **Submit**: Upload to app stores
6. **Launch**: Promote your app!

## 🎉 Success!

You now have a fully functional mobile app that mirrors your web application. Users can download it from app stores and use all features natively on their phones.

**Estimated Timeline**:
- Setup & Testing: 1-2 hours
- Customization: 2-4 hours
- Building: 30 minutes
- App Store Submission: 1-2 hours
- Review & Approval: 1-7 days

**Total**: Ready to launch in about 1 week! 🚀

---

Need help? Check the troubleshooting section or reach out to the Expo community.
