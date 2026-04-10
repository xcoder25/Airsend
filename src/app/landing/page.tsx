'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Mic, Radio, Fingerprint, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: <Radio size={32} color="#00d27b" />,
      title: "Offline P2P Gestures",
      description: "Transfer money to nearby friends without typing details. AirSend utilizes physical ML device cameras so you simply open your palm to initiate a transfer."
    },
    {
      icon: <Mic size={32} color="#00d27b" />,
      title: "Voice Banking AI",
      description: "Hands-free operations powered directly by Google Gemini AI. Ask your dashboard to check balances, request funds, or show insights."
    },
    {
      icon: <Fingerprint size={32} color="#00d27b" />,
      title: "Biometric AI Shield",
      description: "Proprietary security models that verify your device context seamlessly for 100% fraud-proof interactions and real-time ledger validations."
    },
    {
      icon: <ShieldCheck size={32} color="#00d27b" />,
      title: "Unrivaled Fintech UI",
      description: "Premium glassmorphic interfaces designed to look as responsive, fluid, and immersive as cutting-edge engine design."
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowX: 'hidden'
    }}>
      {/* Navbar Segment */}
      <nav style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'linear-gradient(135deg, #00d27b 0%, #009e5d 100%)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
             <span style={{ fontWeight: '900', color: 'black', fontSize: '18px' }}>O</span>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>AirSend Orbit</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/finance" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '10px 24px', fontWeight: '600', cursor: 'pointer' }}>Analytics</button>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer' }}>Enter Hub</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ padding: '100px 24px', textAlign: 'center', position: 'relative' }}>
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }} 
           transition={{ repeat: Infinity, duration: 5 }} 
           style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: '#00d27b', filter: 'blur(200px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} 
         />
         
         <div style={{ position: 'relative', zIndex: 1 }}>
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
             <span style={{ 
               color: '#00d27b', 
               background: 'rgba(0, 210, 123, 0.1)', 
               padding: '8px 16px', 
               borderRadius: '20px', 
               fontSize: '14px', 
               fontWeight: 'bold', 
               letterSpacing: '2px', 
               textTransform: 'uppercase',
               border: '1px solid rgba(0, 210, 123, 0.2)'
             }}>
               The Next-Gen Standard
             </span>
           </motion.div>
           
           <motion.h1 
             initial={{ y: 30, opacity: 0 }} 
             animate={{ y: 0, opacity: 1 }} 
             transition={{ delay: 0.1 }} 
             style={{ fontSize: '72px', fontWeight: '900', letterSpacing: '-4px', lineHeight: '1.05', margin: '32px auto 24px', maxWidth: '800px' }}
           >
             Welcome to Orbit. <br /> Pay via <span style={{ color: '#00d27b' }}>Gestures</span>
           </motion.h1>

           <motion.p 
             initial={{ y: 30, opacity: 0 }} 
             animate={{ y: 0, opacity: 1 }} 
             transition={{ delay: 0.2 }} 
             style={{ color: 'rgba(255,255,255,0.6)', fontSize: '20px', maxWidth: '650px', margin: '0 auto 48px', lineHeight: '1.6' }}
           >
             AirSend is the most powerful peer-to-peer wallet. Marrying Gemini intelligence with MediaPipe machine vision, ensuring you can manage wealth by simply speaking or throwing a physical palm gesture.
           </motion.p>

           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }} 
             transition={{ delay: 0.3 }} 
             style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}
           >
             <Link href="/" style={{ textDecoration: 'none' }}>
               <button style={{ 
                 background: 'linear-gradient(135deg, #00d27b 0%, #009e5d 100%)', 
                 color: 'black', 
                 border: 'none', 
                 padding: '20px 48px', 
                 borderRadius: '32px', 
                 fontSize: '18px', 
                 fontWeight: '800', 
                 display: 'flex', 
                 gap: '12px', 
                 alignItems: 'center', 
                 boxShadow: '0 10px 30px rgba(0, 210, 123, 0.4)',
                 cursor: 'pointer'
               }}>
                 Launch App Protocol <ChevronRight size={22} />
               </button>
             </Link>
           </motion.div>
         </div>
      </div>

      {/* Feature Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {features.map((feature, i) => (
            <motion.div 
              key={feature.title}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.15 }}
              style={{
                background: 'rgba(20, 20, 25, 0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '40px 32px',
                borderRadius: '32px',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div style={{ 
                marginBottom: '24px', 
                background: 'rgba(0, 210, 123, 0.1)', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: '20px',
                border: '1px solid rgba(0, 210, 123, 0.2)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.5px' }}>{feature.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', fontSize: '15px' }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
