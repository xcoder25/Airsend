'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createWalletIfMissing,
} from '@/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const clearError = () => setError('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await createWalletIfMissing(cred.user.uid, cred.user.displayName || 'Orbit User');
      router.push('/');
    } catch (err: any) {
      const map: Record<string, string> = {
        'auth/user-not-found':    'No account found with this email.',
        'auth/wrong-password':    'Incorrect password. Try again.',
        'auth/invalid-email':     'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/invalid-credential':'Invalid email or password.',
      };
      setError(map[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await createWalletIfMissing(cred.user.uid, cred.user.displayName || 'Orbit User');
      router.push('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
          width: '50px', height: '50px',
          background: 'var(--primary)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          <div style={{ width: '24px', height: '24px', border: '4px solid white', borderRadius: '50%' }} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-muted)' }}>Sign in to your Orbit account.</p>
      </header>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#f87171'
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input
            type="email"
            placeholder="Email Address"
            className="glass"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            required
            style={{
              width: '100%', padding: '18px 18px 18px 52px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none'
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
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            required
            style={{
              width: '100%', padding: '18px 18px 18px 52px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Forgot Password?
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="glow-primary"
          style={{
            width: '100%', padding: '18px',
            background: loading ? 'rgba(0,210,123,0.5)' : 'var(--primary)',
            color: 'white', border: 'none', borderRadius: '16px',
            fontSize: '18px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '12px', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <>Login <ChevronRight size={20} /></>}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '32px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        Or continue with
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      <button
        onClick={handleGoogle}
        disabled={loading}
        style={{
          width: '100%', padding: '16px', borderRadius: '16px',
          border: '1px solid var(--border)', background: 'var(--surface)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
          color: 'white', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        <Chrome size={22} color="#4285F4" />
        Continue with Google
      </button>

      <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px', paddingTop: '32px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Don&apos;t have an account? </span>
        <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sign Up</Link>
      </div>
    </div>
  );
}
