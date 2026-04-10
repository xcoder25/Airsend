'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, ShieldCheck, ArrowDownCircle, CheckCircle2, AlertTriangle, Users, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

// Sub-components
import NearbyRadar from '@/components/Radar';
import AIShield from '@/components/AIShield';
import GestureTransfer from '@/components/GestureTransfer';

export default function AirSendDemo() {
  const [stage, setStage] = useState<'scan' | 'request' | 'transfer' | 'success'>('scan');
  const [amount, setAmount] = useState(5000);
  const [recipient, setRecipient] = useState({ name: 'Damilola', risky: true });
  const [showShield, setShowShield] = useState(false);

  // Local theme override for the premium feel
  const theme = {
    primary: '#7c3aed',
    primaryGlow: 'rgba(124, 58, 237, 0.3)',
    secondary: '#10b981',
    text: '#ffffff',
    bg: '#050505'
  };

  const startDemo = () => {
    setStage('request');
  };

  const handleRequestReceived = () => {
    setStage('transfer');
  };

  const handleTransferComplete = () => {
    setShowShield(true);
  };

  const finalizeTransfer = () => {
    setShowShield(false);
    setStage('success');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#10b981', '#ffffff']
    });
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative', 
      overflow: 'hidden',
      background: theme.bg,
      color: theme.text
    }}>
      
      {/* Back Button */}
      <Link href="/" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 100,
        color: 'white',
        background: 'rgba(255,255,255,0.1)',
        padding: '8px 12px',
        borderRadius: '12px',
        backdropFilter: 'blur(4px)'
      }}>
        <ChevronLeft size={20} />
        <span>Back</span>
      </Link>
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${theme.primaryGlow} 0%, transparent 70%)`, opacity: 0.5, zIndex: -1 }}></div>
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, var(--secondary-glow) 0%, transparent 70%)', opacity: 0.5, zIndex: -1 }}></div>

      <AnimatePresence mode="wait">
        {stage === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            <NearbyRadar />
            <h1 style={{ marginTop: '2rem', fontSize: '1.5rem', fontWeight: '600' }}>Nearby AirSend</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>Scanning for nearby users...</p>
            <button 
              className="glass"
              onClick={startDemo}
              style={{ 
                padding: '12px 24px', 
                fontSize: '1rem', 
                border: `1px solid ${theme.primary}`,
                background: 'rgba(255,255,255,0.05)',
                color: 'white'
              }}
            >
              Simulate Interaction
            </button>
          </motion.div>
        )}

        {stage === 'request' && (
          <motion.div
            key="request"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass"
            style={{ padding: '2rem', width: '90%', maxWidth: '400px', textAlign: 'center' }}
          >
            <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ArrowDownCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Damilola requests funds</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0', color: 'var(--primary)' }}>
              ₦{amount.toLocaleString()}
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Accepting this request will initiate the gesture transfer.</p>
            <button 
              className="glass"
              onClick={handleRequestReceived}
              style={{ width: '100%', padding: '16px', fontWeight: 'bold', background: 'var(--primary)' }}
            >
              Authorize Gesture
            </button>
          </motion.div>
        )}

        {stage === 'transfer' && (
          <GestureTransfer 
            recipient={recipient} 
            amount={amount} 
            onComplete={handleTransferComplete} 
          />
        )}

        {stage === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ width: '100px', height: '100px', background: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 0 40px var(--secondary-glow)' }}>
              <CheckCircle2 size={48} />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Transfer Sent!</h1>
            <p style={{ color: 'var(--text-muted)' }}>₦{amount.toLocaleString()} sent to {recipient.name}</p>
            <button 
              className="glass"
              onClick={() => setStage('scan')}
              style={{ marginTop: '3rem', padding: '12px 32px' }}
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AIShield 
        isOpen={showShield} 
        onConfirm={finalizeTransfer} 
        onCancel={() => setShowShield(false)} 
        recipient={recipient}
        amount={amount}
      />
    </main>
  );
}
