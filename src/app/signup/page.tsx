'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ChevronRight, Phone } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
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
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h1>
        <p style={{ color: 'var(--text-muted)' }}>Start your journey with Orbit today.</p>
      </header>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            placeholder="Full Name"
            className="glass"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="tel" 
            placeholder="Phone Number"
            className="glass"
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
            placeholder="Create Password"
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

        <div style={{ padding: '8px 0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderRadius: '4px', flexShrink: 0 }}></div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                By signing up, you agree to our <span style={{ color: 'var(--primary)' }}>Terms of Service</span> and <span style={{ color: 'var(--primary)' }}>Privacy Policy</span>.
            </span>
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
          Create Account
          <ChevronRight size={20} />
        </button>
      </form>

      <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login</Link>
      </div>
    </div>
  );
}
