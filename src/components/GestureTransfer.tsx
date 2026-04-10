'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { User, Coins, Sparkles } from 'lucide-react';

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
  const opacity = useTransform(y, [0, -300], [1, 0.5]);
  
  const handleDragEnd = (event: any, info: any) => {
    // If thrown upwards with enough velocity or distance
    if (info.offset.y < -120 || info.velocity.y < -400) {
      // Haptic feedback super feature
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setIsThrown(true);
      // Faster completion for snappier feel
      setTimeout(onComplete, 600);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '550px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '20px 0'
    }}>
      {/* Target Zone (Recipient) */}
      <motion.div
        animate={{ 
          scale: isThrown ? [1, 1.3, 1] : [1, 1.05, 1],
          boxShadow: isThrown ? '0 0 60px var(--primary)' : '0 0 20px rgba(255,255,255,0.05)'
        }}
        transition={{ 
          scale: { repeat: isThrown ? 0 : Infinity, duration: 2 },
          boxShadow: { duration: 0.3 }
        }}
        style={{
          width: '100px',
          height: '100px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--primary)',
          zIndex: 5,
          position: 'relative'
        }}
      >
        <motion.div
          animate={isThrown ? { y: [-10, 0], opacity: [0, 1] } : {}}
          style={{ position: 'absolute', top: -30, fontSize: '24px' }}
        >
          {isThrown ? '💸' : ''}
        </motion.div>
        <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
          <User size={32} />
        </div>
        <span style={{ fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>{recipient.name}</span>
      </motion.div>

      {/* Throw Instruction */}
      {!isThrown && (
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', top: '45%', color: 'var(--text-muted)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>Throw ₦{amount.toLocaleString()}</div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            ↑
          </motion.div>
        </motion.div>
      )}

      {/* The Money Bill (Draggable) */}
      <div style={{ position: 'relative', width: '260px', height: '140px', marginBottom: '40px' }}>
        <AnimatePresence>
          {!isThrown && (
            <motion.div
              drag
              dragConstraints={{ left: -50, right: 50, bottom: 50, top: -400 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              style={{
                x,
                y,
                rotate,
                opacity,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #00d27b 0%, #00a862 100%)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.1)',
                cursor: 'grab',
                zIndex: 10,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              whileTap={{ scale: 1.02, cursor: 'grabbing', boxShadow: '0 20px 45px rgba(0,0,0,0.5)' }}
            >
              <div style={{ position: 'absolute', top: 12, left: 16, fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.6, letterSpacing: '1px' }}>ORBIT AIRSEND</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'black', letterSpacing: '-1px' }}>₦{amount.toLocaleString()}</div>
              
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                opacity: 0.15, 
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
                backgroundSize: '15px 15px' 
              }}></div>
              
              <motion.div 
                animate={{ x: [-100, 300] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '40px',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  transform: 'skewX(-20deg)'
                }}
              />
            </motion.div>
          )}

          {isThrown && (
            <motion.div
              initial={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
              animate={{ 
                y: -400, 
                scale: [1, 0.4, 0.1], 
                opacity: [1, 1, 0], 
                rotate: [0, 360, 720],
                filter: 'blur(2px)'
              }}
              transition={{ duration: 0.5, ease: "circIn" }}
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #00d27b 0%, #00a862 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 15
              }}
            >
              <Coins size={48} color="black" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Your Avatar at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '-90px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: 0.7
        }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--surface-secondary)', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
            <User size={20} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>You</span>
        </div>
      </div>
    </div>
  );
}

