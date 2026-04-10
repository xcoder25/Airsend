'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar as RadarIcon, 
  ShieldCheck, 
  ArrowDownCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ChevronLeft,
  Smartphone,
  Send,
  User,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

// Sub-components
import NearbyRadar from '@/components/Radar';
import AIShield from '@/components/AIShield';
import GestureTransfer from '@/components/GestureTransfer';

function FloatingMoney() {
  const [bills, setBills] = useState<{ id: number; x: number; y: number; rotate: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const newBills = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotate: Math.random() * 360,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * -20
    }));
    setBills(newBills);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.3, overflow: 'hidden' }}>
      {bills.map((bill) => (
        <motion.div
          key={bill.id}
          initial={{ y: '110vh', x: `${bill.x}vw`, rotate: bill.rotate }}
          animate={{ 
            y: '-10vh', 
            rotate: bill.rotate + 360,
            x: [`${bill.x}vw`, `${bill.x + 10}vw`, `${bill.x - 10}vw`, `${bill.x}vw`]
          }}
          transition={{ 
            y: { duration: bill.duration, repeat: Infinity, ease: "linear", delay: bill.delay },
            rotate: { duration: bill.duration * 0.8, repeat: Infinity, ease: "linear" },
            x: { duration: bill.duration * 0.5, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ position: 'absolute', fontSize: '24px' }}
        >
          💸
        </motion.div>
      ))}
    </div>
  );
}

export default function AirSendDemo() {
  const [role, setRole] = useState<'sender' | 'recipient'>('sender');
  const [stage, setStage] = useState<'init' | 'scan' | 'request' | 'transfer' | 'waiting' | 'success'>('init');
  const [amount, setAmount] = useState(5000);
  const [recipient, setRecipient] = useState({ name: 'Damilola', risky: true });
  const [showShield, setShowShield] = useState(false);
  
  // To track connection state easily in the UI
  const [isLiveSync, setIsLiveSync] = useState(false);

  // Trigger confetti on success
  useEffect(() => {
    if (stage === 'success') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d27b', '#6366f1', '#ffffff']
      });
    }
  }, [stage]);

  // Real-time synchronization engine via polling API
  useEffect(() => {
    if (stage === 'init') return;
    
    // Set initial server state to 'idle' when starting demo properly
    if (stage === 'scan' && role === 'sender') {
      fetch('/api/airsend', { method: 'POST', body: JSON.stringify({ stage: 'idle' }) });
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/airsend');
        if (!res.ok) return;
        const data = await res.json();
        setIsLiveSync(true);

        // State Machine Sync based on Role
        if (role === 'sender') {
          if (data.stage === 'requested' && stage === 'scan') {
            setStage('request');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }
          if (data.stage === 'idle' && stage === 'success') {
            setStage('scan');
          }
        }
        
        if (role === 'recipient') {
          if (data.stage === 'success' && stage !== 'success') {
            setStage('success');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 400]);
          }
          if (data.stage === 'idle' && stage === 'success') {
            setStage('scan');
          }
        }
      } catch (err) {
        setIsLiveSync(false);
      }
    }, 1000); // 1-second polling is highly robust for cross-device hackathon syncs without socket complexity
    
    return () => clearInterval(interval);
  }, [role, stage]);

  const setServerState = async (newState: string) => {
    try {
      await fetch('/api/airsend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newState, amount }),
      });
    } catch(e) {
      console.warn('Realtime Push Failed. Continuing locally only.');
    }
  };

  const syncRequestFunds = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50]);
    setStage('waiting');
    await setServerState('requested');
  };

  const handleTransferComplete = async () => {
    setShowShield(true);
    await setServerState('transferring');
  };

  const finalizeTransfer = async () => {
    setShowShield(false);
    setStage('success');
    await setServerState('success');
  };

  const resetDemo = async () => {
    setStage('init'); 
    setRole('sender');
    await setServerState('idle');
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
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '20px'
    }}>
      <FloatingMoney />
      
      {/* Header / Nav */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'white',
          background: 'rgba(255,255,255,0.05)',
          padding: '8px 16px',
          borderRadius: '16px',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)'
        }}>
          <ChevronLeft size={20} />
          <span>Exit</span>
        </Link>

        {stage !== 'success' && stage !== 'init' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Live Indicator Super Feature */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: isLiveSync ? 'var(--primary)' : 'var(--text-muted)' }}>
              <Activity size={14} className={isLiveSync ? "glow-primary" : ""} style={{ animation: isLiveSync ? 'pulse 2s infinite' : 'none' }} />
              LIVE
            </div>
            
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              padding: '4px',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)'
            }}>
              <button 
                onClick={() => { setRole('sender'); setStage('scan'); setServerState('idle'); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: role === 'sender' ? 'var(--primary)' : 'transparent',
                  color: role === 'sender' ? 'black' : 'white',
                  transition: 'all 0.3s'
                }}
              >
                Sender
              </button>
              <button 
                onClick={() => { setRole('recipient'); setStage('scan'); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: role === 'recipient' ? 'var(--primary)' : 'transparent',
                  color: role === 'recipient' ? 'black' : 'white',
                  transition: 'all 0.3s'
                }}
              >
                Recipient
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'init' && (
          <motion.div
            key="init"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="glass"
            style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}
          >
            <div style={{ width: '80px', height: '80px', background: 'var(--primary-glow)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'var(--primary)', boxShadow: '0 0 30px var(--primary-glow)' }}>
              <Send size={40} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '-1px' }}>Nearby AirSend</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.5' }}>
              Experience the future of cross-device P2P transfers with gesture-based speed and real-time AI security.
            </p>
            <button 
              className="glass"
              onClick={() => {
                setStage('scan');
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
              }}
              style={{ 
                width: '100%', 
                padding: '18px', 
                fontSize: '1.1rem', 
                fontWeight: '800',
                background: 'var(--primary)',
                color: 'black',
                border: 'none',
                boxShadow: '0 10px 20px var(--primary-glow)'
              }}
            >
              Initialize Engine
            </button>
          </motion.div>
        )}

        {stage === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', width: '100%' }}
          >
            <NearbyRadar />
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                {role === 'sender' ? 'Scanning for Peers...' : 'Visible to Peers'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', opacity: 0.8 }}>
                {role === 'sender' ? 'Wait for Damilola to request funds seamlessly.' : 'You are visible to nearby Orbit users.'}
              </p>
            </div>

            <motion.div 
              style={{ marginTop: '3rem', display: 'flex', gap: '16px', justifyContent: 'center' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {role === 'sender' ? (
                <div style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                  Awaiting request via local network sync...
                </div>
              ) : (
                <button 
                  className="glass"
                  onClick={syncRequestFunds}
                  style={{ padding: '14px 40px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 10px 20px var(--primary-glow)' }}
                >
                  Request ₦5,000
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {stage === 'waiting' && role === 'recipient' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass"
            style={{ padding: '3rem', textAlign: 'center', width: '90%', maxWidth: '400px', border: '1px solid var(--primary-glow)' }}
          >
            <div className="radar-circle" style={{ width: '100px', height: '100px', position: 'relative', margin: '0 auto 2rem' }}>
               <Smartphone size={48} color="var(--primary)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Request Broadcasted</h2>
            <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>Real-time synchronization established. Waiting for John Doe to throw the transfer...</p>
            
          </motion.div>
        )}

        {stage === 'request' && role === 'sender' && (
          <motion.div
            key="request"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass"
            style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--primary-glow)', boxShadow: '0 20px 40px var(--primary-glow)' }}
          >
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               style={{ width: '64px', height: '64px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'black' }}
            >
              <ArrowDownCircle size={32} />
            </motion.div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>Incoming Match</h2>
            <div style={{ fontSize: '2.8rem', fontWeight: '900', margin: '1.5rem 0', color: 'var(--primary)', letterSpacing: '-1.5px' }}>
              ₦{amount.toLocaleString()}
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
              <strong>{recipient.name}</strong> requested funds. Continue to authorize the gesture engine.
            </p>
            <button 
              className="glass"
              onClick={() => {
                setStage('transfer');
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
              }}
              style={{ 
                width: '100%', 
                padding: '18px', 
                fontWeight: '800', 
                fontSize: '1.1rem',
                background: 'var(--primary)',
                color: 'black',
                border: 'none',
                boxShadow: '0 5px 15px var(--primary-glow)'
              }}
            >
              Ready Engine
            </button>
          </motion.div>
        )}

        {stage === 'transfer' && (
          <div key="transfer" style={{ width: '100%', maxWidth: '500px' }}>
            <GestureTransfer 
              recipient={recipient} 
              amount={amount} 
              onComplete={handleTransferComplete} 
            />
          </div>
        )}

        {stage === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ 
              width: '120px', 
              height: '120px', 
              background: 'var(--primary)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 2.5rem', 
              boxShadow: '0 0 50px var(--primary-glow)',
              color: 'black'
            }}>
              <CheckCircle2 size={64} />
            </div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1px' }}>Successful</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
              {role === 'sender' 
                ? `₦${amount.toLocaleString()} sent to ${recipient.name}`
                : `₦${amount.toLocaleString()} received structurally`
              }
            </p>
            <button 
              className="glass"
              onClick={resetDemo}
              style={{ marginTop: '4rem', padding: '16px 40px', fontWeight: '800', border: '1px solid var(--border)' }}
            >
              Finish Session
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
