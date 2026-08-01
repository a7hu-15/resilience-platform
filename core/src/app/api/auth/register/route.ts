import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../../db/prisma';
import { validateEmailDomain, verifyOtpToken } from '../../../../modules/auth/otp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, otp } = await request.json();

    if (!email || !password || !otp) {
      return NextResponse.json({ error: 'Missing email, password, or verification OTP.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Strict RFC Syntax & DNS MX Domain Verification
    const domainCheck = await validateEmailDomain(normalizedEmail);
    if (!domainCheck.valid) {
      return NextResponse.json({ error: domainCheck.reason || 'Invalid email address.' }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 400 });
    }

    // 3. Verify OTP Token for Registration
    const otpVerification = await verifyOtpToken(normalizedEmail, otp, 'REGISTER');
    if (!otpVerification.success) {
      return NextResponse.json({ error: otpVerification.message || 'Invalid or expired 6-digit OTP code.' }, { status: 400 });
    }

    // 4. Hash password and create user account
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        emailVerified: true
      }
    });

    return NextResponse.json({
      message: 'Account registered successfully! You can now log in.',
      userId: user.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Register API Error]', error);
    return NextResponse.json({ error: 'Registration failed.', details: error.message }, { status: 500 });
  }
}
