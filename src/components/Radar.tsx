'use client';

import { motion } from 'framer-motion';
import { User, Smartphone } from 'lucide-react';

const users = [
  { id: 1, x: -90, y: -70, name: 'Damilola', active: true },
  { id: 2, x: 100, y: -40, name: 'Ibrahim', active: false },
  { id: 3, x: -50, y: 80, name: 'Titi', active: false },
];

export default function NearbyRadar() {
  return (
    <div style={{ position: 'relative', width: '320px', height: '320px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Radar Background Circles */}
      {[120, 220, 320].map((size, i) => (
        <div 
          key={size}
          style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            border: '1px solid rgba(255,255,255,0.03)',
            borderRadius: '50%',
            zIndex: 0
          }}
        />
      ))}

      {/* Pulsing Radar Rings */}
      {[1, 2, 3].map((i) => (
        <motion.div 
          key={i} 
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 320, height: 320, opacity: 0 }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: i * 1.3
          }}
          style={{
            position: 'absolute',
            border: '1px solid var(--primary-glow)',
            borderRadius: '50%',
            zIndex: 0
          }}
        />
      ))}

      {/* Rotating Sweep Beam */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0deg, var(--primary-glow) 30deg, transparent 60deg)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Center User (You) */}
      <motion.div
        animate={{ 
          boxShadow: ['0 0 20px var(--primary-glow)', '0 0 40px var(--primary-glow)', '0 0 20px var(--primary-glow)']
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: 'relative',
          width: '70px',
          height: '70px',
          background: 'var(--primary)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          color: 'black'
        }}
      >
        <Smartphone size={24} />
        <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>YOU</span>
      </motion.div>

      {/* Nearby Users */}
      {users.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 + user.id * 0.3, type: "spring" }}
          style={{
            position: 'absolute',
            top: `calc(50% + ${user.y}px)`,
            left: `calc(50% + ${user.x}px)`,
            zIndex: 5
          }}
        >
          <div style={{ position: 'relative' }}>
            {user.active && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  position: 'absolute',
                  inset: -10,
                  background: 'var(--primary-glow)',
                  borderRadius: '50%',
                  zIndex: -1
                }}
              />
            )}
            <div style={{
              width: '44px',
              height: '44px',
              background: 'rgba(21, 21, 24, 0.8)',
              border: `1px solid ${user.active ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              color: user.active ? 'var(--primary)' : 'white'
            }}>
              <User size={20} />
            </div>
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>{user.name}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{user.active ? 'Active' : 'Away'}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

