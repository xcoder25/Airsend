import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase safely for build-time / SSR
const app =
  typeof window !== 'undefined' || process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    ? getApps().length === 0
      ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ? initializeApp(firebaseConfig)
        : null
      : getApp()
    : null;

export const auth = app ? getAuth(app) : (null as any);
export const db   = app ? getFirestore(app) : (null as any);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ────────────────────────────────────────────────────────────
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, signInWithPopup };

// ── useUser ─────────────────────────────────────────────────────────────────
export function useUser() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

// ── useFirestore ─────────────────────────────────────────────────────────────
export function useFirestore() {
  return db;
}

// ── useMemoFirebase ───────────────────────────────────────────────────────────
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}

// ── useWallet ─────────────────────────────────────────────────────────────────
// Real-time wallet balance from Firestore wallets/{uid}
export function useWallet(uid: string | undefined) {
  const [balance, setBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) { setWalletLoading(false); return; }
    const ref = doc(db, 'wallets', uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data()?.balance ?? 0);
      }
      setWalletLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return { balance, walletLoading };
}

// ── createWalletIfMissing ─────────────────────────────────────────────────────
// Call once after sign-up / first sign-in to seed the wallet document.
export async function createWalletIfMissing(uid: string, displayName: string) {
  if (!db) return;
  const ref = doc(db, 'wallets', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      displayName,
      balance: 0,
      createdAt: serverTimestamp(),
    });
  }
}
