# 📱 NeuroNest Mobile Testing Guide

## ✅ Mobile App Started Successfully!

Your Expo development server is now running.

---

## 🎯 How to Test on Your Phone

### Option 1: Test with Expo Go (Recommended - 2 Minutes)

#### Step 1: Install Expo Go
Download the **Expo Go** app on your phone:
- **iPhone**: https://apps.apple.com/app/expo-go/id982107779
- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent

#### Step 2: Connect
1. Look at your terminal/command prompt
2. You should see a **QR code** 
3. **iPhone users**: Open Camera app → Point at QR code → Tap notification
4. **Android users**: Open Expo Go app → Tap "Scan QR Code" → Scan

#### Step 3: Start Testing!
The app will load on your phone in 30-60 seconds. You'll see the NeuroNest landing page!

---

### Option 2: Test in Browser (Quick Preview)

1. Press `w` in the terminal where Expo is running
2. The app will open in your browser
3. This gives you a quick preview (some features may not work fully in web mode)

---

## 📊 Current Configuration

Your mobile app is configured with:
- **Backend URL**: `https://neuronest-backend-173555414031.us-central1.run.app`
- **Supabase**: Connected to your production database
- **Status**: ✅ Ready to test

---

## 🧪 What to Test

### 1. Authentication
- [ ] Landing page appears
- [ ] Can navigate to Login
- [ ] Can navigate to Signup  
- [ ] Can log in with existing account
- [ ] Can create new account

### 2. Main Features
- [ ] Home screen loads
- [ ] Games screen shows all 10 games
- [ ] Can play Emotion Match game
- [ ] Chat with AI companion works
- [ ] Profile screen shows user data
- [ ] Diary feature works
- [ ] Reports can be generated

### 3. Navigation
- [ ] Bottom tabs switch screens
- [ ] Back navigation works
- [ ] All screens load properly

---

## 🎮 Test the Features

### Test Authentication
1. Open app on phone
2. Tap "Login"
3. Enter your credentials
4. Should navigate to Home screen

### Test Games
1. Go to "Games" tab
2. Scroll through game list
3. Tap "Emotion Match"
4. Play a round
5. Complete post-game questionnaire

### Test Chat
1. Go to "Chat" tab
2. Send a message to AI companion
3. Wait for response
4. Verify it connects to your deployed backend

### Test Profile
1. Go to "Profile" tab
2. Check if your user data loads
3. View high scores
4. Check recent activity

---

## 🐛 Common Issues & Fixes

### "Network request failed"
**Problem**: Can't connect to backend  
**Fix**: 
- Make sure your phone is connected to internet
- Check backend URL in `.env` file
- Verify backend is running on Cloud Run

### "Unable to verify app"
**Problem**: Expo Go shows error  
**Fix**:
- Restart Expo server (`Ctrl+C`, then `npm start`)
- Clear cache: `npm start -- --clear`

### App crashes on startup
**Problem**: Code error  
**Fix**:
- Check terminal for error messages
- Look for red error screen on phone with details

### Can't scan QR code
**Problem**: QR code not showing  
**Fix**:
- Make sure Expo dev server started successfully
- Try pressing `r` to restart
- Check if port 8081 is available

---

## 💡 Development Tips

### Hot Reload
Any changes you make to the code will automatically reload on your phone!

### Open Dev Menu
- **iPhone**: Shake your device
- **Android**: Shake your device or press `Ctrl+M`

### Reload App
- Shake device → Tap "Reload"
- Or press `r` in terminal

### View Logs
All console.log statements appear in your terminal where Expo is running.

---

## 📱 Testing Checklist

Complete this checklist while testing:

### UI/UX
- [ ] App looks good on your phone
- [ ] Colors and fonts render correctly
- [ ] Buttons are easy to tap
- [ ] Scrolling is smooth
- [ ] Animations work

### Functionality
- [ ] Can create account
- [ ] Can log in
- [ ] Can play games
- [ ] Can chat with AI
- [ ] Can write diary entries
- [ ] Can view reports

### Performance
- [ ] App loads quickly
- [ ] Navigation is fast
- [ ] No lag when typing
- [ ] Games run smoothly

### Integration
- [ ] Backend API calls work
- [ ] Data persists between sessions
- [ ] Authentication stays active
- [ ] All features match web app

---

## 🚀 Next Steps After Testing

### If Everything Works:
1. Test on different screens (games, chat, profile)
2. Try creating an account and logging in
3. Play a game and check if data saves
4. Chat with the AI companion

### If You Find Issues:
1. Note what doesn't work
2. Check the error messages in terminal
3. Take screenshots if needed
4. We can fix issues together

### Ready to Build Production App:
1. Test thoroughly for a few days
2. Gather feedback from friends
3. Build production APK/IPA
4. Submit to app stores

---

## 📞 Quick Commands

While Expo is running, press these keys:

- `r` - Reload app
- `m` - Toggle menu
- `d` - Open developer menu
- `j` - Open debugger
- `w` - Open in web browser
- `Ctrl+C` - Stop Expo server

---

## ✅ Testing Status

**Backend**: ✅ Deployed and running  
**Mobile App**: ✅ Development server started  
**Configuration**: ✅ Connected to production backend  
**Ready to Test**: ✅ YES!

---

**Current Time**: The app is running NOW! Scan the QR code to start testing.

**Next**: Once you've tested on your phone, let me know what works and what doesn't, and we can make improvements!
