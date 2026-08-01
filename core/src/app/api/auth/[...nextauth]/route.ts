import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "../../../../db/prisma";
import { verifyOtpToken } from "../../../../modules/auth/otp";

export const dynamic = 'force-dynamic';

export async function authorizeUser(credentials?: Record<string, string>) {
  if (!credentials?.email || !credentials?.password || !credentials?.otp) {
    return null;
  }

  const normalizedEmail = credentials.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  const otpCheck = await verifyOtpToken(normalizedEmail, credentials.otp, 'LOGIN');
  if (!otpCheck.success) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        return authorizeUser(credentials);
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "resilience-dev-secret-key-12345"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
