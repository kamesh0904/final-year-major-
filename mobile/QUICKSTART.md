# NeuroNest Mobile - Quick Start (5 Minutes)

Get your mobile app running in 5 minutes!

## Step 1: Install Expo CLI (1 minute)

```bash
npm install -g expo-cli
```

## Step 2: Install Dependencies (2 minutes)

```bash
cd mobile
npm install
```

## Step 3: Configure Environment (1 minute)

Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_API_URL=https://your-backend.run.app
```

**Get these from:**
- Supabase URL & Key: Supabase Dashboard → Settings → API
- Backend URL: Your GCP Cloud Run service URL

## Step 4: Start Development Server (30 seconds)

```bash
npm start
```

## Step 5: Test on Your Phone (30 seconds)

### Option A: Use Your Phone (Recommended)

1. **Install Expo Go**:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scan QR Code**:
   - iOS: Open Camera app → Point at QR code
   - Android: Open Expo Go → Tap "Scan QR Code"

3. **Done!** App loads on your phone 🎉

### Option B: Use Simulator

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android
```

## 🎉 Success!

Your mobile app is now running! You can:
- Login with your existing account
- Play all 10 games
- Chat with AI companion
- View reports
- Track goals

## 📱 Next Steps

### Test Features
- Create account or login
- Complete questionnaire
- Play games for 5 minutes
- Check post-game questionnaire
- View daily/weekly reports
- Chat with AI companion

### Customize
- Change app name in `app.json`
- Update colors in screen files
- Add your app icon

### Build for Production
See [README.md](README.md) for building APK/IPA files.

## 🐛 Troubleshooting

### "Unable to connect to backend"
- Check `.env` file has correct backend URL
- Ensure backend is deployed and running
- Try accessing backend URL in browser

### "Module not found"
```bash
rm -rf node_modules
npm install
expo start -c
```

### QR Code not working
- Ensure phone and computer on same WiFi
- Try tunnel mode: `expo start --tunnel`

## 📞 Need Help?

- Check [MOBILE_APP_SETUP_GUIDE.md](MOBILE_APP_SETUP_GUIDE.md) for detailed guide
- Expo docs: https://docs.expo.dev
- React Native docs: https://reactnative.dev

---

**That's it!** You now have a fully functional mobile app running on your phone. 🚀
