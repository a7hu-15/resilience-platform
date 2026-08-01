"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import styles from '../../page.module.css';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'RESET_PASSWORD' })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage(data.message || 'Password reset code sent to your email.');
        setStep(2);
      } else {
        setError(data.error || 'Failed to send reset code.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network error occurred. Please check your connection.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, purpose: 'RESET_PASSWORD', newPassword })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network error occurred. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: '420px' }}>
        <div className={styles.header}>
          <h1 className={`${styles.title} text-gradient`} style={{ fontSize: '2rem' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '0.5rem 0' }}>
            {step === 1 ? 'Enter your email address to receive a 6-digit OTP code' : 'Enter the 6-digit code and your new password'}
          </p>
        </div>
        <Card>
          {step === 1 ? (
            <form className={styles.form} onSubmit={handleSendResetOtp}>
              {error && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
              {message && <p style={{ color: '#10b981', textAlign: 'center', fontSize: '0.9rem' }}>{message}</p>}
              <Input 
                type="email" 
                placeholder="Enter Registered Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Password Reset Code'}
              </Button>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link href="/login" style={{ color: 'var(--text-secondary)' }}>
                  ← Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleResetPassword}>
              {error && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
              {message && <p style={{ color: '#10b981', textAlign: 'center', fontSize: '0.9rem' }}>{message}</p>}
              
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                Reset code sent to <strong style={{ color: '#38bdf8' }}>{email}</strong>
              </div>

              <Input 
                type="text" 
                placeholder="Enter 6-Digit Reset Code" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px' }}
              />

              <Input 
                type="password" 
                placeholder="Enter New Password (min 6 characters)" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? 'Updating Password...' : 'Verify Code & Set New Password'}
              </Button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  ← Change Email
                </button>
                <button 
                  type="button" 
                  onClick={handleSendResetOtp} 
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
