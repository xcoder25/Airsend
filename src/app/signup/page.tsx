'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ChevronRight, Phone, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  createWalletIfMissing,
} from '@/firebase';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const clearError = () => setError('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all required fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createWalletIfMissing(cred.user.uid, name);
      router.push('/');
    } catch (err: any) {
      const map: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/weak-password':        'Password is too weak. Use at least 6 characters.',
      };
      setError(map[err.code] || 'Sign up failed. Please try again.');
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
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h1>
        <p style={{ color: 'var(--text-muted)' }}>Start your journey with Orbit today.</p>
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

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            placeholder="Full Name"
            className="glass"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError(); }}
            required
            style={{ width: '100%', padding: '18px 18px 18px 52px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input
            type="email"
            placeholder="Email Address"
            className="glass"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            required
            style={{ width: '100%', padding: '18px 18px 18px 52px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input
            type="tel"
            placeholder="Phone Number (optional)"
            className="glass"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: '100%', padding: '18px 18px 18px 52px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input
            type="password"
            placeholder="Create Password (min 6 chars)"
            className="glass"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            required
            style={{ width: '100%', padding: '18px 18px 18px 52px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
          />
        </div>

        <div style={{ padding: '8px 0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderRadius: '4px', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            By signing up, you agree to our <span style={{ color: 'var(--primary)' }}>Terms of Service</span> and <span style={{ color: 'var(--primary)' }}>Privacy Policy</span>.
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
            marginTop: '12px', cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading
            ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            : <>Create Account <ChevronRight size={20} /></>}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '28px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        Or
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
        <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login</Link>
      </div>
    </div>
  );
}
