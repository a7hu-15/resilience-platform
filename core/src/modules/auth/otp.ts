import { promises as dnsPromises } from 'dns';
import { randomInt } from 'crypto';
import net from 'net';
import prisma from '../../db/prisma';

// Known list of temporary, disposable, or fake email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'yopmail.com', 'trashmail.com', 'dispostable.com', 'getnada.com',
  'sharklasers.com', 'throwawaymail.com', 'temp-mail.org', 'fakemail.net',
  'generator.email', 'maildrop.cc', 'inboxalias.com', 'mohmal.com',
  'crazymailing.com', 'tmailor.com', 'tempmail.net', 'mailnesia.com',
  'dropmail.me', 'disposablemail.com', 'tempinbox.com', 'emailondeck.com',
  'asdf.com', 'test.com', 'fake.com', 'example.com', 'invalid.com', 'dummy.com'
]);

/**
 * Ultra-Fast Google DNS-over-HTTPS Domain & MX Verification API.
 * Uses Google's official DNS-over-HTTPS API (Port 443) which runs reliably in all Serverless environments.
 */
export async function verifyDomainDnsOverHttps(domain: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      // Status 3 = NXDOMAIN (Domain does not exist in global DNS)
      if (data.Status === 3) {
        return { valid: false, reason: `The email domain '@${domain}' does not exist.` };
      }
      // Status 0 = Success. Verify MX records are present
      if (data.Status === 0) {
        const hasMx = data.Answer && data.Answer.some((record: any) => record.type === 15);
        if (!hasMx) {
          return { valid: false, reason: `The domain '@${domain}' has no active mail servers (MX records).` };
        }
      }
    }
  } catch (err) {
    // Fallback to local Node DNS lookup if Google DoH is unreachable
  }
  return { valid: true };
}

/**
 * Perform direct SMTP socket RCPT TO handshake to verify if a mailbox actually exists on the target mail server.
 */
export async function verifyMailboxExistsSmtp(email: string, mxHost: string): Promise<{ exists: boolean; reason?: string }> {
  return new Promise((resolve) => {
    let hasResolved = false;
    let socket: net.Socket;

    const cleanup = () => {
      if (!hasResolved) {
        hasResolved = true;
        try {
          socket?.destroy();
        } catch {}
      }
    };

    try {
      socket = net.createConnection(25, mxHost);
    } catch {
      return resolve({ exists: true });
    }

    socket.setTimeout(4000, () => {
      cleanup();
      resolve({ exists: true });
    });

    socket.on('error', () => {
      cleanup();
      resolve({ exists: true });
    });

    let step = 0;

    socket.on('data', (data) => {
      const response = data.toString();
      const code = parseInt(response.substring(0, 3), 10);

      if (step === 0) {
        if (code === 220) {
          socket.write(`EHLO resilience-platform.org\r\n`);
          step = 1;
        } else {
          cleanup();
          resolve({ exists: true });
        }
      } else if (step === 1) {
        socket.write(`MAIL FROM:<verify@resilience-platform.org>\r\n`);
        step = 2;
      } else if (step === 2) {
        socket.write(`RCPT TO:<${email}>\r\n`);
        step = 3;
      } else if (step === 3) {
        socket.write(`QUIT\r\n`);
        cleanup();
        if (code === 250 || code === 251) {
          resolve({ exists: true });
        } else if (code === 550 || code === 551 || code === 552 || code === 553 || code === 501) {
          const domain = email.split('@')[1];
          resolve({ 
            exists: false, 
            reason: `The email account '${email}' does not exist on @${domain}'s mail server (550 Mailbox Unknown).` 
          });
        } else {
          resolve({ exists: true });
        }
      }
    });
  });
}

/**
 * Validates RFC syntax, blocks disposable email domains, queries Google DoH, and performs MX lookup.
 */
export async function validateEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format syntax. Please enter a valid email address.' };
  }

  const parts = email.split('@');
  const localPart = parts[0]?.toLowerCase();
  const domain = parts[1]?.toLowerCase();

  if (!localPart || !domain) {
    return { valid: false, reason: 'Invalid email address.' };
  }

  // 1. Block disposable / temporary fake email services
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { 
      valid: false, 
      reason: `The domain '@${domain}' is a disposable or temporary email provider. Please register with a permanent email address (e.g. Gmail, Outlook, Yahoo, Work/School email).` 
    };
  }

  // 2. Google DNS-over-HTTPS API Domain Verification (Port 443)
  const dohCheck = await verifyDomainDnsOverHttps(domain);
  if (!dohCheck.valid) {
    return { valid: false, reason: dohCheck.reason || `The domain '@${domain}' does not exist.` };
  }

  // 3. Local Node DNS MX record lookup
  let mxRecords;
  try {
    mxRecords = await dnsPromises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `The email domain '@${domain}' does not have active mail servers (MX records).` };
    }
  } catch (error) {
    return { valid: false, reason: `The email domain '@${domain}' does not exist or has no active mail server.` };
  }

  // 4. Live SMTP mailbox ping verification (if port 25 is unblocked)
  mxRecords.sort((a, b) => a.priority - b.priority);
  const mxPing = await verifyMailboxExistsSmtp(email, mxRecords[0].exchange);
  if (!mxPing.exists) {
    return { valid: false, reason: mxPing.reason || `The email address '${email}' does not exist on the target mail server.` };
  }

  return { valid: true };
}

/**
 * Generates and stores a 6-digit OTP token valid for 10 minutes.
 */
export async function createOtpToken(
  email: string,
  purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD',
  userId?: string
): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();

  // Delete any existing OTPs for this email and purpose
  await prisma.otpToken.deleteMany({
    where: { email: normalizedEmail, purpose }
  });

  // Generate 6-digit numeric OTP
  const otp = randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  await prisma.otpToken.create({
    data: {
      email: normalizedEmail,
      otp,
      purpose,
      expiresAt,
      userId
    }
  });

  return otp;
}

/**
 * Verifies if a given OTP token is valid and unexpired.
 */
export async function verifyOtpToken(
  email: string,
  otp: string,
  purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD'
): Promise<{ success: boolean; message?: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  const tokenRecord = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      otp: otp.trim(),
      purpose,
      expiresAt: { gte: new Date() }
    }
  });

  if (!tokenRecord) {
    return { success: false, message: 'Invalid or expired 6-digit OTP code.' };
  }

  // Delete used OTP token so it cannot be re-used
  await prisma.otpToken.delete({
    where: { id: tokenRecord.id }
  });

  return { success: true };
}
