import nodemailer from 'nodemailer';

/**
 * Sends a notification email when a test run completes.
 * Uses Ethereal Email for local testing. In production, this would use SendGrid/Resend.
 */
export async function sendCompletionEmail(userEmail: string, testRunId: string, masterScore: number) {
  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Resilience Platform" <no-reply@resilience-platform.local>',
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
    console.log(`[Email] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send notification to ${userEmail}`, error);
    return false;
  }
}
