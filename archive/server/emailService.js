/**
 * Email Service for MI Practice Coach
 * 
 * Handles sending transactional emails for:
 * - Account signup confirmations
 * - Purchase confirmations
 * - Subscription updates
 * 
 * Uses Supabase's built-in email functions or can be extended to use
 * external services like Resend, SendGrid, etc.
 */

import { createClient } from '@supabase/supabase-js';

const isDevelopment = process.env.NODE_ENV !== 'production';

// In-memory store for dev emails
const devEmailInbox = [];
const MAX_DEV_EMAILS = 50;

/**
 * Get the list of intercepted dev emails
 */
export const getDevEmails = () => {
    return [...devEmailInbox].reverse(); // Newest first
};

/**
 * Clear the dev email inbox
 */
export const clearDevEmails = () => {
    devEmailInbox.length = 0;
    return true;
};

/**
 * Get Supabase client with service role key for email operations
 */
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('[emailService] Supabase credentials not configured for email sending');
        return null;
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

/**
 * Send email using Supabase Edge Function or direct SMTP
 * 
 * Note: Supabase doesn't have a direct email API, so we'll use their
 * database functions or recommend setting up an Edge Function.
 * For now, this provides a structure that can be extended.
 */
export const sendEmail = async (options) => {
    const { to, subject, html, text } = options;
    
    if (!to || !subject) {
        throw new Error('Email requires "to" and "subject" fields');
    }
    
    // In development, intercept and store if SKIP_SEND is true OR no provider is configured
    const noProviderConfigured = !process.env.RESEND_API_KEY && 
                                 !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) && 
                                 !process.env.SUPABASE_EDGE_FUNCTION_URL;
                                 
    if (isDevelopment && (process.env.EMAIL_SKIP_SEND === 'true' || noProviderConfigured)) {
        const emailData = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            to,
            subject,
            html,
            text,
            preview: html ? html.substring(0, 100) + '...' : text?.substring(0, 100) + '...'
        };
        
        devEmailInbox.push(emailData);
        
        // Keep inbox size manageable
        if (devEmailInbox.length > MAX_DEV_EMAILS) {
            devEmailInbox.shift();
        }
        
        console.log('[emailService] [DEV] Email intercepted and stored in dev inbox:', {
            to,
            subject,
            inboxSize: devEmailInbox.length
        });
        
        if (noProviderConfigured && process.env.EMAIL_SKIP_SEND !== 'true') {
            console.warn('[emailService] [DEV] NOTE: No email provider configured, so email was intercepted automatically.');
        }
        
        return { success: true, message: 'Email intercepted (dev mode)', id: emailData.id };
    }
    
    // Check if Resend is configured (recommended for production)
    if (process.env.RESEND_API_KEY) {
        return await sendEmailViaResend({ to, subject, html, text });
    }
    
    // Check if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return await sendEmailViaSMTP({ to, subject, html, text });
    }
    
    // Fallback: Use Supabase Edge Function if available
    if (process.env.SUPABASE_EDGE_FUNCTION_URL) {
        return await sendEmailViaEdgeFunction({ to, subject, html, text });
    }
    
    // If no email service configured, log warning
    console.warn('[emailService] No email service configured. Email not sent:', { to, subject });
    console.warn('[emailService] Configure one of: RESEND_API_KEY, SMTP settings, or SUPABASE_EDGE_FUNCTION_URL');
    
    return { success: false, message: 'No email service configured' };
};

/**
 * Send email via Resend API (recommended for production)
 */
const sendEmailViaResend = async ({ to, subject, html, text }) => {
    try {
        const resendApiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.EMAIL_FROM || 'MI Practice Coach <noreply@mipracticecoach.com>';
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [to],
                subject,
                html: html || text,
                text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
            }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Resend API error: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[emailService] Email sent via Resend:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('[emailService] Resend email failed:', error);
        throw error;
    }
};

/**
 * Send email via SMTP (using nodemailer if installed)
 */
const sendEmailViaSMTP = async ({ to, subject, html, text }) => {
    try {
        // Dynamic import to avoid requiring nodemailer if not used
        const nodemailer = await import('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        
        const fromEmail = process.env.EMAIL_FROM || 'MI Practice Coach <noreply@mipracticecoach.com>';
        
        const info = await transporter.sendMail({
            from: fromEmail,
            to,
            subject,
            html: html || text,
            text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
        });
        
        console.log('[emailService] Email sent via SMTP:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[emailService] SMTP email failed:', error);
        throw error;
    }
};

/**
 * Send email via Supabase Edge Function
 */
const sendEmailViaEdgeFunction = async ({ to, subject, html, text }) => {
    try {
        const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        const response = await fetch(`${edgeFunctionUrl}/send-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                subject,
                html,
                text,
            }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Edge Function error: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[emailService] Email sent via Edge Function');
        return { success: true, data };
    } catch (error) {
        console.error('[emailService] Edge Function email failed:', error);
        throw error;
    }
};

/**
 * Send purchase confirmation email
 */
export const sendPurchaseConfirmationEmail = async (userEmail, plan, subscriptionDetails) => {
    const planName = plan === 'monthly' ? 'Monthly' : 'Annual';
    const planPrice = plan === 'monthly' ? '$9.99/month' : '$99.99/year';
    
    const subject = `Welcome to MI Practice Coach Premium! 🎉`;
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Premium!</h1>
            <p>Your subscription is now active</p>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>Thank you for subscribing to MI Practice Coach Premium! Your ${planName} subscription is now active.</p>
            
            <div class="details">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Price:</strong> ${planPrice}</p>
                ${subscriptionDetails?.currentPeriodEnd ? `<p><strong>Next billing date:</strong> ${new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}</p>` : ''}
            </div>
            
            <h3>What's included in Premium:</h3>
            <ul>
                <li>✅ Unlimited practice sessions</li>
                <li>✅ Advanced AI feedback with empathy scores</li>
                <li>✅ Detailed coaching summaries</li>
                <li>✅ Scenario selection and filtering</li>
                <li>✅ Priority support</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Practicing Now</a>
            </p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Happy practicing!<br>The MI Practice Coach Team</p>
        </div>
        <div class="footer">
            <p>MI Practice Coach - Motivational Interviewing Training Platform</p>
            <p>You're receiving this email because you subscribed to our premium plan.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const text = `
Welcome to MI Practice Coach Premium!

Thank you for subscribing! Your ${planName} subscription is now active.

Subscription Details:
- Plan: ${planName}
- Price: ${planPrice}
${subscriptionDetails?.currentPeriodEnd ? `- Next billing date: ${new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}` : ''}

What's included in Premium:
- Unlimited practice sessions
- Advanced AI feedback with empathy scores
- Detailed coaching summaries
- Scenario selection and filtering
- Priority support

Start practicing: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

If you have any questions, feel free to reach out to our support team.

Happy practicing!
The MI Practice Coach Team
    `;
    
    try {
        return await sendEmail({ to: userEmail, subject, html, text });
    } catch (error) {
        console.error('[emailService] Failed to send purchase confirmation:', error);
        // Don't throw - email failure shouldn't break the webhook
        return { success: false, error: error.message };
    }
};

/**
 * Send account welcome email (after email confirmation)
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
    const subject = `Welcome to MI Practice Coach! 👋`;
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to MI Practice Coach!</h1>
        </div>
        <div class="content">
            <p>Hi${userName ? ` ${userName}` : ''},</p>
            <p>Thank you for joining MI Practice Coach! We're excited to help you improve your Motivational Interviewing skills.</p>
            
            <h3>Get Started:</h3>
            <ul>
                <li>Complete your first practice session (3 free sessions per month)</li>
                <li>Receive AI-powered feedback on your MI techniques</li>
                <li>Track your progress over time</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Your First Session</a>
            </p>
            
            <p>If you have any questions, our support team is here to help.</p>
            
            <p>Happy practicing!<br>The MI Practice Coach Team</p>
        </div>
        <div class="footer">
            <p>MI Practice Coach - Motivational Interviewing Training Platform</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const text = `
Welcome to MI Practice Coach!

Hi${userName ? ` ${userName}` : ''},

Thank you for joining! We're excited to help you improve your Motivational Interviewing skills.

Get Started:
- Complete your first practice session (3 free sessions per month)
- Receive AI-powered feedback on your MI techniques
- Track your progress over time

Start practicing: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

If you have any questions, our support team is here to help.

Happy practicing!
The MI Practice Coach Team
    `;
    
    try {
        return await sendEmail({ to: userEmail, subject, html, text });
    } catch (error) {
        console.error('[emailService] Failed to send welcome email:', error);
        return { success: false, error: error.message };
    }
};

export default {
    sendEmail,
    sendPurchaseConfirmationEmail,
    sendWelcomeEmail,
    getDevEmails,
    clearDevEmails
};
