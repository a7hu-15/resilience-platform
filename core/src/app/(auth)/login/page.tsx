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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    });

    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: '400px' }}>
        <div className={styles.header}>
          <h1 className={`${styles.title} text-gradient`} style={{ fontSize: '2rem' }}>Login</h1>
        </div>
        <Card>
          <form className={styles.form} onSubmit={handleLogin}>
            {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}
            <Input 
              type="email" 
              placeholder="Email" 
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
            <Button type="submit">Sign In</Button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/register" style={{ color: 'var(--text-secondary)' }}>
                Don't have an account? Register
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
