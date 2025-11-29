# Email Configuration Guide

This guide explains how to configure email sending for MI Practice Coach, including signup confirmations and purchase notifications.

## Email Requirements

The app sends emails for:
- ✅ **Account signup confirmation** (via Supabase Auth)
- ✅ **Purchase confirmation** (after Stripe checkout)
- ✅ **Password reset** (via Supabase Auth)

## Configuration Options

### Option 1: Resend API (Recommended - Best Deliverability)

**Pros**: High deliverability, easy setup, free tier available (3,000 emails/month)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=MI Practice Coach <noreply@yourdomain.com>
   ```
4. Verify your domain in Resend (optional but recommended)
5. Done! The app will automatically use Resend

### Option 2: Supabase SMTP (Built-in)

**Pros**: Integrated with Supabase, no additional service needed

1. Go to Supabase Dashboard → **Project Settings → Auth**
2. Scroll to **SMTP Settings**
3. Enable "Enable Custom SMTP"
4. Configure:
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: `587` (TLS) or `465` (SSL)
   - **SMTP User**: Your email address
   - **SMTP Password**: App-specific password
   - **Sender Email**: Email that will send messages
   - **Sender Name**: "MI Practice Coach"

**For Gmail**:
- Enable 2FA on your Google account
- Generate App Password: https://myaccount.google.com/apppasswords
- Use app password as SMTP Password

**For other providers**:
- Check your email provider's SMTP documentation
- Common providers: SendGrid, Mailgun, AWS SES, etc.

### Option 3: Custom SMTP (Nodemailer)

If you prefer to use your own SMTP server directly:

1. Install nodemailer:
   ```bash
   npm install nodemailer
   ```

2. Add to `.env.local`:
   ```env
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-password
   SMTP_SECURE=false
   EMAIL_FROM=MI Practice Coach <noreply@yourdomain.com>
   ```

### Option 4: Supabase Edge Function

For advanced use cases, you can create a Supabase Edge Function:

1. Create Edge Function at `supabase/functions/send-email/`
2. Add to `.env.local`:
   ```env
   SUPABASE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/send-email
   ```

## Environment Variables

Add these to your `.env.local` file:

```env
# Option 1: Resend (Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=MI Practice Coach <noreply@yourdomain.com>

# Option 2: SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_SECURE=false
EMAIL_FROM=MI Practice Coach <noreply@yourdomain.com>

# Option 3: Supabase Edge Function
SUPABASE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/send-email

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Development: Skip sending emails (logs instead)
EMAIL_SKIP_SEND=true
```

## Testing Email Configuration

### Test Signup Email

1. Create a new account in the app
2. Check your email inbox (and spam folder)
3. You should receive a confirmation email from Supabase

### Test Purchase Email

1. Complete a test purchase (use Stripe test mode)
2. Check your email inbox
3. You should receive a purchase confirmation email

### Development Mode

In development, you can skip sending emails by setting:
```env
EMAIL_SKIP_SEND=true
```

This will log emails to the console instead of sending them.

## Troubleshooting

### Emails Not Sending

1. **Check Supabase Auth Logs**:
   - Go to Supabase Dashboard → **Logs → Auth Logs**
   - Look for email sending errors

2. **Verify Configuration**:
   - Check `.env.local` has correct credentials
   - Restart the backend server after changing env vars
   - Verify SMTP credentials are correct

3. **Check Spam Folder**:
   - Emails might be going to spam
   - Add sender to contacts to improve deliverability

4. **Domain Verification**:
   - For production, verify your domain with your email provider
   - This improves deliverability and prevents spam filtering

5. **Rate Limits**:
   - Free email services have rate limits
   - Consider upgrading to a paid plan for production

### Common Errors

**"No email service configured"**
- Solution: Configure one of the email options above

**"SMTP authentication failed"**
- Solution: Check SMTP credentials, especially app passwords for Gmail

**"Email not sent" (but no error)**
- Solution: Check Supabase Auth settings → Email templates are enabled
- Verify SMTP is properly configured in Supabase dashboard

## Email Templates

The app uses HTML email templates for:
- Purchase confirmations (with subscription details)
- Welcome emails (after account confirmation)

Templates are defined in `server/emailService.js` and can be customized.

## Production Checklist

Before going to production:

- [ ] Configure production email service (Resend recommended)
- [ ] Verify your sending domain
- [ ] Set up SPF/DKIM records for your domain
- [ ] Test all email flows (signup, purchase, password reset)
- [ ] Monitor email delivery rates
- [ ] Set up email bounce handling
- [ ] Configure unsubscribe links (if required by law)

## Support

For email issues:
1. Check server logs: `npm run dev:server`
2. Check Supabase Auth logs in dashboard
3. Verify email service credentials
4. Test with a different email address

