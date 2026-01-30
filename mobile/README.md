# NeuroNest Mobile App

React Native mobile application for NeuroNest mental health platform, built with Expo.

## 🚀 Features

- **Cross-Platform**: Runs on both iOS and Android
- **Authentication**: Secure login/signup with Supabase
- **Therapeutic Games**: 10 interactive games for mental wellness
- **AI Chatbot**: Real-time chat with AI companion
- **Reports**: Daily and weekly insights with PDF export
- **Profile Management**: Track progress and high scores
- **Personal Diary**: Private journaling
- **Gentle Goals**: Daily goal tracking with streaks

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Studio
- Expo Go app on your phone (for testing)

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Create a `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_backend_url
```

### 3. Start Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### 4. Run on Device/Simulator

**Option A: Physical Device**
1. Install Expo Go app from App Store or Play Store
2. Scan the QR code from Expo DevTools

**Option B: iOS Simulator (Mac only)**
```bash
npm run ios
```

**Option C: Android Emulator**
```bash
npm run android
```

## 📱 Building for Production

### Setup EAS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

### Build for Android

```bash
npm run build:android
```

This creates an APK or AAB file for Google Play Store.

### Build for iOS

```bash
npm run build:ios
```

This creates an IPA file for Apple App Store.

## 📦 Publishing to App Stores

### Google Play Store

1. Build production APK/AAB:
```bash
eas build --platform android --profile production
```

2. Submit to Play Store:
```bash
npm run submit:android
```

3. Follow the prompts to upload to Google Play Console

### Apple App Store

1. Build production IPA:
```bash
eas build --platform ios --profile production
```

2. Submit to App Store:
```bash
npm run submit:ios
```

3. Follow the prompts to upload to App Store Connect

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── config/          # Configuration files
│   │   ├── supabase.ts  # Supabase client
│   │   └── api.ts       # API client
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── navigation/      # Navigation setup
│   │   └── MainNavigator.tsx
│   └── screens/         # App screens
│       ├── LoginScreen.tsx
│       ├── SignupScreen.tsx
│       ├── HomeScreen.tsx
│       ├── GamesScreen.tsx
│       ├── ChatScreen.tsx
│       ├── ProfileScreen.tsx
│       └── QuestionnaireScreen.tsx
├── assets/              # Images, fonts, etc.
├── App.tsx             # Root component
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

## 🎨 Customization

### App Icon & Splash Screen

1. Replace `assets/icon.png` (1024x1024)
2. Replace `assets/splash.png` (1242x2436)
3. Replace `assets/adaptive-icon.png` (1024x1024, Android)

### App Name & Bundle ID

Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "ios": {
      "bundleIdentifier": "com.yourcompany.app"
    },
    "android": {
      "package": "com.yourcompany.app"
    }
  }
}
```

## 🔧 Troubleshooting

### Metro Bundler Issues
```bash
expo start -c
```

### iOS Build Issues
```bash
cd ios
pod install
cd ..
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
```

### Clear Cache
```bash
expo start -c
rm -rf node_modules
npm install
```

## 📚 Key Dependencies

- **expo**: ~50.0.0 - Expo framework
- **react-native**: 0.73.0 - React Native core
- **@react-navigation**: Navigation library
- **@supabase/supabase-js**: Supabase client
- **axios**: HTTP client
- **expo-linear-gradient**: Gradient components
- **react-native-gesture-handler**: Gesture handling
- **react-native-reanimated**: Animations

## 🔐 Security

- All API calls include authentication tokens
- Sensitive data stored in secure storage
- Environment variables for configuration
- HTTPS only for API communication

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test on Multiple Devices
Use Expo's device farm or BrowserStack for comprehensive testing.

## 📄 App Store Requirements

### iOS App Store
- Apple Developer Account ($99/year)
- App Store Connect access
- Privacy policy URL
- App screenshots (various sizes)
- App description and keywords

### Google Play Store
- Google Play Developer Account ($25 one-time)
- Play Console access
- Privacy policy URL
- Feature graphic (1024x500)
- App screenshots (various sizes)
- App description and keywords

## 🚀 Deployment Checklist

- [ ] Update version in `app.json`
- [ ] Test on iOS and Android
- [ ] Update app icons and splash screens
- [ ] Configure environment variables
- [ ] Build production versions
- [ ] Test production builds
- [ ] Prepare app store listings
- [ ] Submit for review

## 📞 Support

For issues or questions:
- Check Expo documentation: https://docs.expo.dev
- React Native docs: https://reactnative.dev
- GitHub Issues: [Your repo URL]

## 📝 License

This project is part of an academic final year project.

---

**Note**: Make sure your backend API is deployed and accessible before building the mobile app for production.
