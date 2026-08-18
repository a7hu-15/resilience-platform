import nodemailer from 'nodemailer';

async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal Email test account for local / dev testing
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Sends a 6-digit OTP verification code email for Register, 2FA Login, or Password Reset.
 */
export async function sendOtpEmail(
  userEmail: string,
  otp: string,
  purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD'
): Promise<{ success: boolean; delivered: boolean; devCode?: string; note?: string }> {
  try {
    let subject = '🔒 Email Verification Code';
    let actionTitle = 'Email Verification Code';
    let actionDesc = 'Use the 6-digit verification code below to complete your registration on Resilience Cloud:';

    if (purpose === 'LOGIN') {
      subject = '🔑 Login 2FA Verification Code';
      actionTitle = 'Two-Factor Login Code';
      actionDesc = 'A login attempt was initiated for your Resilience Cloud account. Use the code below to complete sign-in:';
    } else if (purpose === 'RESET_PASSWORD') {
      subject = '🔄 Password Reset Code';
      actionTitle = 'Password Reset Code';
      actionDesc = 'You requested to reset your password. Use the 6-digit code below to set a new password:';
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #a855f7; margin-top: 0;">🛡️ Resilience Cloud</h2>
        <h3 style="color: #e2e8f0; font-size: 1.25rem;">${actionTitle}</h3>
        <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5;">${actionDesc}</p>
        
        <div style="background-color: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #38bdf8; font-family: monospace;">${otp}</span>
        </div>

        <p style="color: #64748b; font-size: 0.85rem;">This code is valid for 10 minutes. If you did not initiate this request, please ignore this email.</p>
      </div>
    `;

    // 1. Try Direct Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM || 'Resilience Cloud <onboarding@resend.dev>',
            to: [userEmail],
            subject,
            html: htmlContent
          })
        });

        if (res.ok) {
          console.log(`[Resend API] Successfully delivered ${purpose} OTP to ${userEmail}`);
          return { success: true, delivered: true };
        } else {
          const errorData = await res.json();
          console.warn(`[Resend API Warning] Resend restriction for ${userEmail}:`, errorData);
        }
      } catch (resendErr) {
        console.warn(`[Resend API Warning] Resend fetch failed:`, resendErr);
      }
    }

    // 2. Fallback to Standard Transporter if SMTP configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = await getTransporter();
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Resilience Cloud Security" <no-reply@resilience-platform.local>',
          to: userEmail,
          subject,
          text: `${actionTitle}: ${otp}. Valid for 10 minutes.`,
          html: htmlContent,
        });

        console.log(`[Email OTP] Sent ${purpose} code to ${userEmail}. Message ID: ${info.messageId}`);
        return { success: true, delivered: true };
      } catch (smtpErr) {
        console.error(`[Email OTP SMTP Error] Failed to send to ${userEmail}:`, smtpErr);
      }
    }

    // 3. Fallback when email provider cannot deliver
    console.warn(`[Email OTP] Delivery failed for ${userEmail} [${purpose}]. Please configure RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in Vercel environment variables.`);
    return { 
      success: false, 
      delivered: false,
      note: 'No active email provider available or provider rejected delivery.' 
    };

  } catch (error) {
    console.error(`[Email OTP] Error sending ${purpose} code to ${userEmail}`, error);
    return { success: false, delivered: false };
  }
}

/**
 * Sends a notification email when a test run completes.
 */
export async function sendCompletionEmail(userEmail: string, testRunId: string, masterScore: number) {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Resilience Cloud" <no-reply@resilience-platform.local>',
      to: userEmail,
      subject: `✅ Resilience Test Completed (Score: ${masterScore})`,
      text: `Your resilience test has completed. Your Master Score is ${masterScore}. View results at http://localhost:3000/results/${testRunId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #a855f7;">Resilience Test Completed</h2>
          <p>Your recent Docker image test run has finished successfully.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h1 style="margin: 0; color: #111;">Master Score: ${masterScore}/100</h1>
          </div>
          <p>
            <a href="http://localhost:3000/results/${testRunId}" style="display: inline-block; padding: 10px 20px; background: #a855f7; color: white; text-decoration: none; border-radius: 6px;">
              View Full Report
            </a>
          </p>
        </div>
      `,
    });

    console.log(`[Email] Notification sent to ${userEmail}. Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Ethereal Preview URL: ${previewUrl}`);
    }

    return true;
  } catch (error) {
    console.error(`[Email] Failed to send notification to ${userEmail}`, error);
    return false;
  }
}
