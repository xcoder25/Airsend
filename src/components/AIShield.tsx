'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, X, ShieldAlert, Lock, Info } from 'lucide-react';

interface AIShieldProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  recipient: { name: string; risky: boolean };
  amount: number;
}

export default function AIShield({ isOpen, onConfirm, onCancel, recipient, amount }: AIShieldProps) {
  useEffect(() => {
    if (isOpen) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (recipient.risky) {
          navigator.vibrate([200, 100, 400]); // Danger haptic pattern
        } else {
          navigator.vibrate([100]); // Soft secure haptic
        }
      }
    }
  }, [isOpen, recipient.risky]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '2.5rem',
              border: `1px solid ${recipient.risky ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 210, 123, 0.3)'}`,
              boxShadow: recipient.risky 
                ? '0 20px 50px rgba(239, 68, 68, 0.15)' 
                : '0 20px 50px rgba(0, 210, 123, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated Scanner Line */}
            <motion.div
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: recipient.risky ? 'var(--danger)' : 'var(--primary)',
                opacity: 0.2,
                zIndex: 0
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: recipient.risky ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 210, 123, 0.1)', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {recipient.risky ? <ShieldAlert size={22} color="#ef4444" /> : <ShieldCheck size={22} color="var(--primary)" />}
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>AI Shield</div>
              </div>
              <button onClick={onCancel} style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            {recipient.risky ? (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.05)', 
                border: '1px solid rgba(239, 68, 68, 0.1)', 
                padding: '16px', 
                borderRadius: '16px',
                display: 'flex',
                gap: '14px',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 1
              }}>
                <AlertTriangle color="#ef4444" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.95rem' }}>Security Warning</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                    This is your <strong>first time</strong> sending to {recipient.name}. Orbit AI recommends verifying the user before completing this gesture.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(0, 210, 123, 0.05)', 
                border: '1px solid rgba(0, 210, 123, 0.1)', 
                padding: '16px', 
                borderRadius: '16px',
                display: 'flex',
                gap: '14px',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 1
              }}>
                <Lock color="var(--primary)" size={20} style={{ flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.95rem' }}>Encrypted Transfer</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Secure gesture-based link established with {recipient.name}.
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Confirm Transfer</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{recipient.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Verified Orbit User</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px' }}>₦{amount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
              <button 
                onClick={onCancel}
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  fontWeight: '700', 
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'white'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                style={{ 
                  flex: 1.5, 
                  padding: '16px', 
                  fontWeight: '800', 
                  borderRadius: '14px',
                  background: recipient.risky ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'var(--primary)',
                  color: recipient.risky ? 'white' : 'black',
                  border: 'none',
                  boxShadow: recipient.risky ? '0 10px 20px rgba(239, 68, 68, 0.2)' : '0 10px 20px var(--primary-glow)'
                }}
              >
                Complete ₦{amount.toLocaleString()}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

