"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import styles from '../../page.module.css';

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCredentialsCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, purpose: 'LOGIN' })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage(data.message || 'Login 2FA code sent to your email.');
        setStep(2);
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network error occurred. Please check your connection.');
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      otp
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid 2FA verification code.');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: '420px' }}>
        <div className={styles.header}>
          <h1 className={`${styles.title} text-gradient`} style={{ fontSize: '2rem' }}>Sign In</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '0.5rem 0' }}>
            {step === 1 ? 'Step 1: Enter your registered credentials' : 'Step 2: Enter the 6-digit login 2FA code'}
          </p>
        </div>
        <Card>
          {step === 1 ? (
            <form className={styles.form} onSubmit={handleCredentialsCheck}>
              {error && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
              {message && <p style={{ color: '#10b981', textAlign: 'center', fontSize: '0.9rem' }}>{message}</p>}
              <Input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div style={{ textAlign: 'right', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>
                <Link href="/forgot-password" style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Verifying Credentials...' : 'Continue to 2FA Step'}
              </Button>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link href="/register" style={{ color: 'var(--text-secondary)' }}>
                  Don't have an account? Register
                </Link>
              </div>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleVerifyLogin}>
              {error && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
              {message && <p style={{ color: '#10b981', textAlign: 'center', fontSize: '0.9rem' }}>{message}</p>}
              
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                2FA login code sent to <strong style={{ color: '#38bdf8' }}>{email}</strong>
              </div>

              <Input 
                type="text" 
                placeholder="Enter 6-Digit Code" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px' }}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Authenticating...' : 'Verify Code & Sign In'}
              </Button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  ← Back to Login
                </button>
                <button 
                  type="button" 
                  onClick={handleCredentialsCheck} 
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
