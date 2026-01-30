# OAuth Setup Guide for NeuroNest

This guide will help you set up Google and Microsoft OAuth authentication for your NeuroNest application.

## Prerequisites

- Supabase project set up and running
- Access to Google Cloud Console
- Access to Microsoft Azure Portal (or Azure AD)

## 1. Supabase Configuration

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**

### Step 2: Configure Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set your **Site URL** to: `http://localhost:5173` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** and **Google Identity API**

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: NeuroNest
   - **User support email**: your email
   - **Developer contact information**: your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set **Name**: NeuroNest Web Client
5. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
6. Add **Authorized redirect URIs**:
   - `https://azwgugwqbmpdnkbaqhgo.supabase.co/auth/v1/callback`
   - Replace `azwgugwqbmpdnkbaqhgo` with your Supabase project reference

### Step 4: Configure in Supabase
1. Copy the **Client ID** and **Client Secret**
2. In Supabase Dashboard → **Authentication** → **Providers**
3. Enable **Google** provider
4. Paste the **Client ID** and **Client Secret**
5. Save the configuration

## 3. Microsoft OAuth Setup

### Step 1: Register Application in Azure
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: NeuroNest
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web → `https://azwgugwqbmpdnkbaqhgo.supabase.co/auth/v1/callback`

### Step 2: Configure Authentication
1. In your app registration, go to **Authentication**
2. Add additional redirect URIs if needed
3. Under **Implicit grant and hybrid flows**, enable:
   - **Access tokens**
   - **ID tokens**

### Step 3: Create Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: "NeuroNest Supabase Integration"
4. Choose expiration (24 months recommended)
5. Copy the **Value** (this is your client secret)

### Step 4: Configure API Permissions
1. Go to **API permissions**
2. Ensure these permissions are granted:
   - **Microsoft Graph** → **User.Read** (should be there by default)
   - **OpenId permissions** → **email**, **openid**, **profile**

### Step 5: Configure in Supabase
1. Copy the **Application (client) ID** and **Client Secret**
2. In Supabase Dashboard → **Authentication** → **Providers**
3. Enable **Azure** provider
4. Paste the **Client ID** and **Client Secret**
5. Save the configuration

## 4. Testing the Integration

### Development Testing
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173/login`
3. Click on **Google** or **Microsoft** buttons
4. Complete the OAuth flow
5. Verify you're redirected to `/auth/callback` and then to the appropriate page

### Common Issues and Solutions

#### Issue: "redirect_uri_mismatch" error
**Solution**: Ensure the redirect URI in your OAuth provider matches exactly with your Supabase callback URL.

#### Issue: OAuth popup blocked
**Solution**: Ensure popups are allowed for your domain, or the OAuth flow will open in the same window.

#### Issue: "Invalid client" error
**Solution**: Double-check your Client ID and Client Secret in both the provider and Supabase.

#### Issue: User profile not created
**Solution**: Check the AuthCallback component logs and ensure the profile creation logic is working.

## 5. Production Deployment

### Update URLs for Production
1. **Supabase**: Update Site URL and Redirect URLs to your production domain
2. **Google**: Add production domain to Authorized JavaScript origins and redirect URIs
3. **Microsoft**: Add production redirect URI to your app registration

### Environment Variables (Optional)
You can store OAuth credentials as environment variables:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
```

## 6. Security Considerations

1. **Never expose client secrets** in frontend code (Supabase handles this)
2. **Use HTTPS** in production for all OAuth flows
3. **Regularly rotate** client secrets
4. **Monitor** OAuth usage in your provider dashboards
5. **Implement proper error handling** for failed OAuth attempts

## 7. User Experience Enhancements

The current implementation includes:
- ✅ Beautiful OAuth buttons with provider logos
- ✅ Loading states during authentication
- ✅ Proper error handling and user feedback
- ✅ Automatic profile creation for new users
- ✅ Smart redirection based on user state
- ✅ Consistent with the calming design system

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all URLs match exactly
3. Ensure OAuth providers are properly configured
4. Check Supabase logs in the dashboard
5. Test with different browsers/incognito mode

The OAuth integration is now ready and will provide a seamless authentication experience for your NeuroNest users!