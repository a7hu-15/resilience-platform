import { validateEmailDomain, createOtpToken, verifyOtpToken } from '../src/modules/auth/otp';
import prisma from '../src/db/prisma';

// Mock prisma.otpToken
jest.mock('../src/db/prisma', () => ({
  __esModule: true,
  default: {
    otpToken: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'token-1', ...data })),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.otp === '123456' && where.email === 'test@gmail.com') {
          return Promise.resolve({ id: 'token-1', email: 'test@gmail.com', otp: '123456', purpose: where.purpose });
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockResolvedValue({ id: 'token-1' }),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  }
}));

describe('Auth OTP & Email Domain Verification Engine', () => {
  it('should validate RFC syntax and pass for valid domains with MX records', async () => {
    const res = await validateEmailDomain('ashuchaudhary1006@gmail.com');
    expect(res.valid).toBe(true);
  });

  it('should reject invalid email syntax format', async () => {
    const res = await validateEmailDomain('invalid-email-format');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Invalid email format syntax');
  });

  it('should reject disposable/temporary fake email domains', async () => {
    const res = await validateEmailDomain('user@mailinator.com');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('disposable or temporary email provider');
  });

  it('should reject non-existent domains without mail server MX records', async () => {
    const res = await validateEmailDomain('user@non-existent-fake-domain-xyz999.com');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('does not exist or has no active mail server');
  });

  it('should generate a 6-digit OTP code and store token record', async () => {
    const otp = await createOtpToken('test@gmail.com', 'REGISTER');
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    expect(prisma.otpToken.create).toHaveBeenCalled();
  });

  it('should successfully verify a valid 6-digit OTP code', async () => {
    const result = await verifyOtpToken('test@gmail.com', '123456', 'REGISTER');
    expect(result.success).toBe(true);
    expect(prisma.otpToken.delete).toHaveBeenCalled();
  });

  it('should reject an incorrect 6-digit OTP code', async () => {
    const result = await verifyOtpToken('test@gmail.com', '999999', 'REGISTER');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid or expired');
  });
});
