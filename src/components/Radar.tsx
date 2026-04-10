'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const users = [
  { id: 1, x: -80, y: -60, name: 'Damilola' },
  { id: 2, x: 90, y: -30, name: 'Ibrahim' },
  { id: 3, x: -40, y: 70, name: 'Titi' },
];

export default function NearbyRadar() {
  return (
    <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
      {/* Radar Circles */}
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="radar-circle" 
          style={{ animationDelay: `${i * 1.3}s` }} 
        />
      ))}

      {/* Center User */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          background: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          boxShadow: '0 0 20px var(--primary-glow)'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>You</span>
      </motion.div>

      {/* Nearby Users */}
      {users.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: user.id * 0.5 }}
          style={{
            position: 'absolute',
            top: `calc(50% + ${user.y}px)`,
            left: `calc(50% + ${user.x}px)`,
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
            backdropFilter: 'blur(4px)'
          }}>
            <User size={20} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
