# Quick Email Setup for OTP

## For IMMEDIATE Testing (Gmail)

1. **Go to Google Account**: https://myaccount.google.com/apppasswords
2. **Sign in** to your Gmail account
3. **Create app password**:
   - Select app: "Mail"
   - Select device: "Other" → Type "NeuroNest Backend"
   - Click "Generate"
4. **Copy the 16-character password** (it will look like: `xxxx xxxx xxxx xxxx`)

5. **Add to Cloud Run Environment Variables**:
   - Go to https://console.cloud.google.com/run
   - Click `neuronest-backend` service
   - Click "EDIT & DEPLOY NEW REVISION"
   - Under "Variables & Secrets" tab:
     - Add variable: `SMTP_EMAIL` = `your-gmail@gmail.com`
     - Add variable: `SMTP_PASSWORD` = `xxxx-xxxx-xxxx-xxxx` (no spaces!)
     - Add variable: `SMTP_SERVER` = `smtp.gmail.com`
     - Add variable: `SMTP_PORT` = `587`
   - Click "DEPLOY"

6. **Test**: Click "Send OTP" → Check your email!

## Current Status (Without SMTP Setup)

- ✅ OTP generated and stored in database
- ✅ OTP displayed on screen
- ❌ Email NOT sent (because SMTP not configured)

## After Setup

- ✅ OTP generated and stored in database
- ✅ OTP sent via email
- ✅ OTP also displayed on screen (dev mode)

---

**NOTE**: Email setup is OPTIONAL for now. The OTP still works because it's displayed on screen!
