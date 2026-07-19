"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import styles from '../../page.module.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: '400px' }}>
        <div className={styles.header}>
          <h1 className={`${styles.title} text-gradient`} style={{ fontSize: '2rem' }}>Register</h1>
        </div>
        <Card>
          <form className={styles.form} onSubmit={handleRegister}>
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
            <Button type="submit">Create Account</Button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/login" style={{ color: 'var(--text-secondary)' }}>
                Already have an account? Login
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
