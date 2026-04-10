'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, Fingerprint } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('orbit_auth', 'true');
    router.push('/');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 24px', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'white'
    }}>
      <header style={{ marginBottom: '48px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          background: 'var(--primary)', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          <div style={{ width: '24px', height: '24px', border: '4px solid white', borderRadius: '50%' }}></div>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Orbit</h1>
        <p style={{ color: 'var(--text-muted)' }}>Experience the future of money.</p>
      </header>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="email" 
            placeholder="Email Address"
            className="glass"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 18px 18px 52px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="password" 
            placeholder="Password"
            className="glass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 18px 18px 52px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>Forgot Password?</span>
        </div>

        <button 
          type="submit"
          className="glow-primary"
          style={{
            width: '100%',
            padding: '18px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px'
          }}
        >
          Login
          <ChevronRight size={20} />
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '32px 0', color: 'var(--text-muted)' }}>
        Or continue with
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'center' }}>
          <Fingerprint size={24} color="var(--primary)" />
        </button>
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Don&apos;t have an account? </span>
        <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sign Up</Link>
      </div>
    </div>
  );
}
