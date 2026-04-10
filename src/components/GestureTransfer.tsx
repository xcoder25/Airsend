'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { User, Coins } from 'lucide-react';

interface GestureTransferProps {
  recipient: { name: string };
  amount: number;
  onComplete: () => void;
}

export default function GestureTransfer({ recipient, amount, onComplete }: GestureTransferProps) {
  const [isThrown, setIsThrown] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotate based on drag direction
  const rotate = useTransform(x, [-100, 100], [-30, 30]);
  
  const handleDragEnd = (event: any, info: any) => {
    // If thrown upwards with enough velocity
    if (info.offset.y < -150 || info.velocity.y < -500) {
      setIsThrown(true);
      setTimeout(onComplete, 800);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '600px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '40px 0'
    }}>
      {/* Recipient Avatar (The Target) */}
      <motion.div
        animate={{ 
          scale: isThrown ? [1, 1.2, 1] : 1,
          boxShadow: isThrown ? '0 0 50px var(--primary)' : '0 0 20px rgba(255,255,255,0.1)'
        }}
        style={{
          width: '80px',
          height: '80px',
          background: 'var(--surface)',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--primary)',
          zIndex: 5
        }}
      >
        <User size={32} color="var(--primary)" />
        <span style={{ fontSize: '10px', marginTop: '4px' }}>{recipient.name}</span>
      </motion.div>

      {/* Throw Instruction */}
      {!isThrown && (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', top: '40%', color: 'var(--text-muted)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Throw ₦{amount.toLocaleString()} to {recipient.name}</div>
          <div style={{ opacity: 0.5, fontSize: '1.5rem' }}>↑</div>
        </motion.div>
      )}

      {/* The Money Bill (Draggable) */}
      <div style={{ position: 'relative', width: '240px', height: '120px' }}>
        <AnimatePresence>
          {!isThrown && (
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, bottom: 0, top: -400 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{
                x,
                y,
                rotate,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                cursor: 'grab',
                zIndex: 10,
                position: 'relative',
                overflow: 'hidden'
              }}
              whileTap={{ scale: 1.05, cursor: 'grabbing' }}
            >
              <div style={{ position: 'absolute', top: 10, left: 15, fontSize: '0.8rem', opacity: 0.8 }}>AirSend</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₦{amount.toLocaleString()}</div>
              
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                opacity: 0.1, 
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
              }}></div>
            </motion.div>
          )}

          {isThrown && (
            <motion.div
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={{ y: -450, scale: 0.2, opacity: 0, rotate: 720 }}
              transition={{ duration: 0.6, ease: "circIn" }}
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                left: 0,
                top: 0
              }}
            >
              <Coins size={40} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Your Avatar at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{ width: '50px', height: '50px', background: 'var(--surface)', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>
            <User size={24} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>You</span>
        </div>
      </div>
    </div>
  );
}
