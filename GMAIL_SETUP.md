# Gmail SMTP Setup for Admin 2FA

## Overview
This guide helps you set up Gmail SMTP for the admin two-factor authentication system.

## Prerequisites
- Gmail account: `ket1boggood@gmail.com`
- Google Account with 2-Step Verification enabled

## Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the setup process to enable 2-Step Verification

## Step 2: Generate App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Scroll down and click **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter name: **Meal Attendance System**
7. Click **Generate**
8. Copy the 16-character app password (format: `xxxx xxxx xxxx xxxx`)

## Step 3: Configure Environment Variables
1. Create `.env` file in the `backend` folder (copy from `.env.example`)
2. Update the following variables:
```env
GMAIL_USER=ket1boggood@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password-here
```

**Important:** Use the App Password, NOT your regular Gmail password!

## Step 4: Test the Setup
1. Start the backend server: `npm run dev`
2. Look for this message in the console:
   - ✅ `Email service configured and ready for admin 2FA`
   - ⚠️ If you see a warning, check your credentials

## Admin Login Flow
1. **Username:** `username`
2. **Password:** `jidfFDhgg45HVf@%$jkvh657465j,Ahyhj`
3. **Email Verification:** 6-digit code sent to `ket1boggood@gmail.com`
4. **Code Expiry:** 5 minutes
5. **Resend Limit:** 60 seconds between requests
6. **Max Attempts:** 3 per session

## Security Features
- ✅ OTP expires after 5 minutes
- ✅ Rate limiting on resend requests
- ✅ Maximum 3 verification attempts
- ✅ Professional email template
- ✅ Masked email display for privacy
- ✅ Real-time countdown timers
- ✅ Automatic cleanup of expired codes

## Troubleshooting

### "Email service not configured" Error
- Check that `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env`
- Ensure you're using an App Password, not regular password
- Verify 2-Step Verification is enabled on your Google Account

### "Authentication failed" Error
- Double-check the App Password (16 characters, no spaces)
- Make sure the Gmail account has 2-Step Verification enabled
- Try generating a new App Password

### "Network error" or "SMTP timeout"
- Check internet connection
- Verify Gmail SMTP is not blocked by firewall
- Try restarting the server

## Email Template Preview
The verification email includes:
- 🔐 Professional header with gradient design
- 📧 Clear 6-digit verification code
- ⏰ Expiration time (5 minutes)
- 🔒 Security warning if unauthorized
- 🎨 Modern, responsive design

## API Endpoints
- `POST /api/admin/send-otp` - Send verification code
- `POST /api/admin/verify-otp` - Verify code and login
- `POST /api/admin/resend-otp` - Resend verification code

## Support
If you encounter issues:
1. Check server console for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a different Gmail account if needed
4. Ensure the receiving email account can receive emails
