'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface AIShieldProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  recipient: { name: string; risky: boolean };
  amount: number;
}

export default function AIShield({ isOpen, onConfirm, onCancel, recipient, amount }: AIShieldProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '2rem',
              border: `1px solid ${recipient.risky ? 'var(--danger)' : 'var(--secondary)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={24} color="var(--primary)" />
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>AI Shield Protection</span>
              </div>
              <button onClick={onCancel} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {recipient.risky && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                padding: '12px', 
                borderRadius: '12px',
                display: 'flex',
                gap: '12px',
                marginBottom: '1.5rem'
              }}>
                <AlertTriangle color="var(--danger)" size={24} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--danger)', fontSize: '0.9rem' }}>Unusual Activity Detected</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    First time sending to this user. Verify the recipient identity before proceeding.
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Recipient</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0 12px' }}>{recipient.name}</div>
              
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>₦{amount.toLocaleString()}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="glass"
                onClick={onCancel}
                style={{ flex: 1, padding: '14px', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button 
                className="glass"
                onClick={onConfirm}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  fontWeight: '600', 
                  background: recipient.risky ? 'var(--danger)' : 'var(--secondary)',
                  border: 'none'
                }}
              >
                Send Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
