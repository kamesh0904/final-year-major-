# 📱 Connect Your Phone NOW - Step by Step

## ✅ What We Just Did

1. ✅ Installed all dependencies (1191 packages)
2. ✅ Created `.env` file with your Supabase credentials
3. ✅ Ready to start the development server

## 🚀 Next Steps (Do This Now!)

### Step 1: Install Expo Go on Your Phone

**Android Phone:**
1. Open Google Play Store
2. Search for "Expo Go"
3. Install it
4. Open the app

**iPhone:**
1. Open App Store
2. Search for "Expo Go"
3. Install it
4. Keep it ready

### Step 2: Make Sure Phone & Laptop on Same WiFi

**IMPORTANT:** Both devices MUST be on the same WiFi network!

- Check your laptop WiFi: Look at WiFi icon
- Check your phone WiFi: Settings → WiFi
- They should show the SAME network name

### Step 3: Start the Mobile App Server

**Option A: Double-click the batch file**
```
Navigate to: mobile/start_mobile.bat
Double-click it
```

**Option B: Use command line**
```bash
cd mobile
npx expo start
```

### Step 4: You'll See This Screen

```
Starting Metro Bundler
› Metro waiting on exp://192.168.X.X:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

### Step 5: Scan the QR Code

**Android:**
1. Open Expo Go app on your phone
2. Tap "Scan QR Code" button
3. Point camera at the QR code on your laptop screen
4. Wait 10-30 seconds
5. App will load! 🎉

**iPhone:**
1. Open Camera app (NOT Expo Go)
2. Point at QR code
3. Tap the notification that appears
4. Opens in Expo Go
5. App will load! 🎉

## 🎉 What You Should See

1. **First:** Loading screen with "NeuroNest" logo
2. **Then:** Login screen with purple theme
3. **Try:** Login with your existing account
4. **Success:** You're in the app!

## 🐛 If Something Goes Wrong

### "Unable to connect to Metro"

**Fix 1: Use Tunnel Mode**
```bash
cd mobile
npx expo start --tunnel
```
This works even if WiFi is different!

**Fix 2: Check Firewall**
- Windows Firewall might be blocking
- Allow Node.js through firewall

### "Network request failed" when logging in

**Update backend URL:**
1. Open `mobile/.env`
2. Change this line:
```env
EXPO_PUBLIC_API_URL=https://your-actual-backend-url.run.app
```

**If backend is local:**
```env
# Find your computer's IP address
# Windows: Run 'ipconfig' in command prompt
# Look for IPv4 Address (e.g., 192.168.1.5)

EXPO_PUBLIC_API_URL=http://192.168.1.5:8000
```

### QR Code Not Scanning

**Manual entry:**
1. In Expo Go, tap "Enter URL manually"
2. Type the URL shown (e.g., `exp://192.168.1.5:8081`)
3. Press Go

### Port 8081 Already in Use

**Just say Yes (Y)** when asked to use port 8082

## 📱 Testing Checklist

Once app loads on your phone:

- [ ] See login screen
- [ ] Can type email and password
- [ ] Login button works
- [ ] After login, see home screen
- [ ] Bottom tabs visible (Home, Games, Chat, Profile)
- [ ] Can navigate between tabs
- [ ] Games screen shows 10 games
- [ ] Chat screen loads
- [ ] Profile screen shows your info

## 💡 Pro Tips

**Shake your phone** to open developer menu:
- Reload app
- Debug remotely
- Enable Fast Refresh
- Show performance monitor

**Pull down** on any screen to refresh data

**Changes auto-reload** - Edit code and see changes instantly!

## 🎯 What to Test

### 1. Authentication
- Login with existing account
- Try wrong password (should show error)
- Logout and login again

### 2. Navigation
- Tap each bottom tab
- All screens should load

### 3. Games
- Scroll through games list
- Tap on a game card
- Should show game details

### 4. Chat
- Type a message
- Send it
- Wait for AI response

### 5. Profile
- View your high scores
- Check reports section
- Try generating a report

## 🚀 You're Ready!

Your mobile app is now running on your phone! You can:
- Use it like a real app
- Test all features
- Show it to others
- Make changes and see them instantly

## 📞 Quick Commands

**Start server:**
```bash
cd mobile
npx expo start
```

**Start with tunnel (if WiFi issues):**
```bash
cd mobile
npx expo start --tunnel
```

**Clear cache and restart:**
```bash
cd mobile
npx expo start -c
```

**Stop server:**
Press `Ctrl + C` in the terminal

---

## 🎉 SUCCESS!

Once you see the login screen on your phone, you've successfully:
- ✅ Set up React Native development environment
- ✅ Connected your phone to the development server
- ✅ Loaded the NeuroNest mobile app
- ✅ Ready to test all features!

**Now go ahead and test the app!** 📱🚀
