# Email Configuration for OTP Sending

## Setup Instructions

### Using Gmail SMTP (Development/Testing)

1. **Create App Password** (if using Gmail):
   - Go to https://myaccount.google.com/apppasswords
   - Sign in to your Google account
   - Create a new app password for "Mail"
   - Copy the 16-character password

2. **Add to backend/.env**:
   ```env
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   ```

3. **For Production**, use these in Cloud Run environment variables

### Using SendGrid (Production Recommended)

1. **Sign up** at https://sendgrid.com
2. **Create API Key** in Settings → API Keys
3. **Add to .env**:
   ```env
   SENDGRID_API_KEY=your-api-key
   SMTP_EMAIL=noreply@yourdomain.com
   ```

### Other SMTP Services

- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.us-east-1.amazonaws.com:587  
- **Outlook**: smtp-mail.outlook.com:587

## How It Works

1. User clicks "Send OTP"
2. Backend generates 6-digit code
3. Stores in `diary_password_reset_otps` table (expires in 10 minutes)
4. Sends formatted HTML email with OTP
5. If email fails, OTP still returned in API response for dev mode

## Email Template

The OTP email includes:
- Beautiful gradient header
- Large, centered OTP code
- 10-minute expiration notice
- NeuroNest branding

## Fallback Behavior

- If SMTP not configured: OTP shown in API response
- In development: OTP always returned in response
- In production with SMTP: Only sent via email

## Testing

1. Set up Gmail app password (easiest for testing)
2. Add to .env
3. Test forgot password flow
4. Check your email inbox!
