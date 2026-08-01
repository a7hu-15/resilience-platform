import { promises as dnsPromises } from 'dns';
import { randomInt } from 'crypto';
import prisma from '../../db/prisma';

/**
 * Validates RFC syntax and verifies the email domain has valid DNS MX records.
 */
export async function validateEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format syntax.' };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Invalid email domain.' };
  }

  try {
    const mxRecords = await dnsPromises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `The email domain '@${domain}' does not have active mail servers (MX records).` };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: `The email domain '@${domain}' does not exist or has no active mail server.` };
  }
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
