# Test NeuroNest Mobile App on Your Phone

## 🚀 Quick Steps to Test on Your Connected Phone

### Step 1: Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### Step 2: Navigate to Mobile Folder

```bash
cd mobile
```

### Step 3: Install Dependencies

```bash
npm install
```

This will take 2-3 minutes to download all packages.

### Step 4: Update Backend URL

Open `mobile/.env` and update the API URL to your deployed backend:

```env
EXPO_PUBLIC_SUPABASE_URL=https://azwgugwqbmpdnkbaqhgo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=https://your-backend-url.run.app
```

**Get your backend URL from:**
- Google Cloud Console → Cloud Run → Your service URL
- Or use `http://localhost:8000` if testing locally

### Step 5: Start Expo Development Server

```bash
npm start
```

This will:
1. Start Metro bundler
2. Open Expo DevTools in your browser
3. Show a QR code

### Step 6: Install Expo Go on Your Phone

**Android:**
- Open Play Store
- Search "Expo Go"
- Install the app
- Or direct link: https://play.google.com/store/apps/details?id=host.exp.exponent

**iOS:**
- Open App Store
- Search "Expo Go"
- Install the app
- Or direct link: https://apps.apple.com/app/expo-go/id982107779

### Step 7: Connect Your Phone

**Make sure:**
- ✅ Phone and laptop are on the SAME WiFi network
- ✅ Expo Go app is installed
- ✅ USB debugging is enabled (Android)

### Step 8: Scan QR Code

**Android:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Point camera at QR code in terminal/browser
4. App will load on your phone!

**iOS:**
1. Open Camera app (not Expo Go)
2. Point at QR code
3. Tap notification to open in Expo Go
4. App will load on your phone!

### Step 9: Test the App

Once loaded, you should see:
1. **Login Screen** - Try logging in with your account
2. **Home Screen** - See your dashboard
3. **Games** - Browse all 10 games
4. **Chat** - Test AI chatbot
5. **Profile** - View your profile

## 🐛 Troubleshooting

### "Unable to connect to Metro"

**Solution 1: Use Tunnel Mode**
```bash
npm start -- --tunnel
```

**Solution 2: Check WiFi**
- Ensure phone and laptop on same network
- Disable VPN if active

**Solution 3: Restart**
```bash
# Stop server (Ctrl+C)
npm start -c
```

### "Network request failed"

**Check backend URL:**
1. Open `mobile/.env`
2. Verify `EXPO_PUBLIC_API_URL` is correct
3. Test URL in browser - should show API docs

**If using local backend:**
```env
# Don't use localhost on phone!
# Use your computer's IP address:
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000
```

**Find your IP:**
```bash
# Windows
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
```

### "Module not found"

```bash
cd mobile
rm -rf node_modules
npm install
npm start -c
```

### Phone not detecting QR code

**Try manual connection:**
1. In Expo Go, tap "Enter URL manually"
2. Type the URL shown in terminal (e.g., `exp://192.168.1.5:8081`)

## 📱 Alternative: USB Debugging (Android)

If WiFi doesn't work, use USB:

```bash
# Enable USB debugging on phone
# Connect via USB
adb reverse tcp:8081 tcp:8081
npm start
```

## ✅ Success Checklist

- [ ] Expo CLI installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Phone and laptop on same WiFi
- [ ] Expo Go installed on phone
- [ ] Development server running (`npm start`)
- [ ] QR code scanned
- [ ] App loaded on phone
- [ ] Can login/signup
- [ ] Can navigate between screens

## 🎉 What to Test

### Authentication
- [ ] Login with existing account
- [ ] Signup new account
- [ ] Logout and login again

### Home Screen
- [ ] See gentle goal
- [ ] See streak count
- [ ] Quick actions work

### Games
- [ ] All 10 games visible
- [ ] Can tap to view game details
- [ ] Games load properly

### Chat
- [ ] Can send messages
- [ ] AI responds
- [ ] Chat history loads

### Profile
- [ ] View high scores
- [ ] Generate daily report
- [ ] Generate weekly report
- [ ] View diary

## 💡 Tips

**Hot Reload:**
- Shake phone to open dev menu
- Changes to code reload automatically

**Debugging:**
- Shake phone → "Debug Remote JS"
- Opens Chrome DevTools

**Refresh:**
- Shake phone → "Reload"
- Or pull down on screen

## 📞 Need Help?

If you see errors:
1. Check terminal for error messages
2. Check Expo Go app for error details
3. Try restarting: `npm start -c`
4. Check `.env` file configuration

## 🚀 Next Steps

Once working on your phone:
1. Test all features thoroughly
2. Try on different screens (games, chat, profile)
3. Check if data syncs with backend
4. Test login/logout flow
5. Verify reports generate correctly

---

**You're ready!** Run `npm start` in the mobile folder and scan the QR code! 📱
