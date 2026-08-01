import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../../db/prisma';
import { verifyOtpToken } from '../../../../modules/auth/otp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, otp, purpose, newPassword } = await request.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json({ error: 'Missing required parameters (email, otp, purpose).' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify OTP token
    const otpVerification = await verifyOtpToken(normalizedEmail, otp, purpose);
    if (!otpVerification.success) {
      return NextResponse.json({ error: otpVerification.message || 'Invalid or expired OTP code.' }, { status: 400 });
    }

    // 2. If RESET_PASSWORD, update user password
    if (purpose === 'RESET_PASSWORD') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash }
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.'
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Verify OTP API Error]', error);
    return NextResponse.json({ error: 'Failed to verify OTP code.', details: error.message }, { status: 500 });
  }
}
