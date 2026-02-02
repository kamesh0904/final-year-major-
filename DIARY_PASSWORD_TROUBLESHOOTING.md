# Diary Password Verification Troubleshooting

## Issue
User reports "incorrect diary password" error even with correct password.

## Diagnosis Steps

### 1. Check if Diary Password is Set

The most common issue is that **no diary password has been created yet**.

**How to verify:**
1. Go to https://neuronest-v2-prod.web.app
2. Login to your account
3. Go to Profile page
4. Check if you see a "Create Diary Password" section

**If you see "Create Diary Password":**
- You need to set a password FIRST before you can access the diary
- Click the section, enter a password, and save it
- Then try accessing the diary with that password

### 2. Check Browser Console for Errors

1. Press `F12` to open Developer Tools
2. Go to the **Console** tab
3. Try accessing the diary again
4. Look for errors like:
   - `Failed to fetch` - Network/CORS issue
   - `404 Not Found` - API endpoint missing
   - `500 Internal Server Error` - Backend error

### 3. Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Try accessing the diary
3. Look for the `verify-diary-password` request
4. Check:
   - Status code (should be 200)
   - Response body (should show `{valid: true}` or `{valid: false}`)

## Common Solutions

### Solution 1: Create Diary Password First
If you haven't set a diary password yet:
1. Profile → Create Diary Password
2. Set a password
3. Try accessing diary

### Solution 2: Clear Browser Cache
Sometimes the frontend caches old API URLs:
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear site data in browser settings

### Solution 3: Check API URL
The frontend should be calling:
```
https://neuronest-backend-dctu47ojbq-uc.a.run.app/verify-diary-password
```

Check in Network tab if the correct URL is being called.

## Backend Verification

The verify-diary-password endpoint is deployed and should work. It:
1. Checks if user has a diary_password_hash in profiles table
2. Compares provided password with stored hash using bcrypt
3. Returns `{valid: true}` if match, `{valid: false}` if not

## Next Steps

Please check:
1. ✅ Have you created a diary password in your profile?
2. ✅ Are you entering the EXACT same password you set?
3. ✅ Any errors in browser console (F12)?

Share the console errors or network response and I can help fix it!
