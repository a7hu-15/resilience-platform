import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../../db/prisma';
import { validateEmailDomain, createOtpToken } from '../../../../modules/auth/otp';
import { sendOtpEmail } from '../../../../modules/notifications/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, purpose } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Missing email or purpose parameter.' }, { status: 400 });
    }

    if (!['REGISTER', 'LOGIN', 'RESET_PASSWORD'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid OTP purpose specified.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Strict RFC Syntax, Disposable Domain Blocklist & DNS MX Verification
    const domainCheck = await validateEmailDomain(normalizedEmail);
    if (!domainCheck.valid) {
      return NextResponse.json({ error: domainCheck.reason || 'Invalid email address.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // 2. Purpose-specific validation rules
    if (purpose === 'REGISTER') {
      if (user) {
        return NextResponse.json({ error: 'An account with this email address already exists. Please log in.' }, { status: 400 });
      }
    } else if (purpose === 'LOGIN') {
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: 'Password is required to request login OTP.' }, { status: 400 });
      }
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
      }
    } else if (purpose === 'RESET_PASSWORD') {
      if (!user) {
        return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
      }
    }

    // 3. Generate & Dispatch OTP
    const otp = await createOtpToken(normalizedEmail, purpose as any, user?.id);
    const emailResult = await sendOtpEmail(normalizedEmail, otp, purpose as any);

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: 'Failed to deliver verification email to this address. Please ensure the email is active and typed correctly.' 
      }, { status: 400 });
    }

    let message = `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your email inbox (and spam folder).`;

    return NextResponse.json({
      success: true,
      message,
      delivered: emailResult.delivered
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Send OTP API Error]', error);
    return NextResponse.json({ error: 'Failed to process OTP request.', details: error.message }, { status: 500 });
  }
}
