'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, 
  Smartphone, CreditCard, Landmark, Bell, Mic,
  ChevronRight, Radio, User, Filter, Wifi,
  Settings, X, LogOut, Shield, CircleUserRound
} from 'lucide-react';
import Link from 'next/link';

import VoiceBankingModal from '@/components/VoiceBankingModal';
import { NearbyAirSend } from '@/components/NearbyAirSend';

export default function WalletDashboard() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const balance = 125430.50;

  useEffect(() => {
    // Security redirect
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('orbit_auth') !== 'true') {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  useEffect(() => {
    // Simulate fintech secure launch (like OPay)
    if (isLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  if (isAuthenticated === null) {
      // Prevent flashing of interior before auth status checks completely
      return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('orbit_auth');
    router.push('/login');
  };

  const quickActions = [
    { name: 'Transfer', icon: ArrowUpRight, color: 'var(--primary)' },
    { name: 'Request', icon: ArrowDownLeft, color: 'var(--accent)' },
    { name: 'Bills', icon: Smartphone, color: '#f59e0b' },
    { name: 'Cards', icon: CreditCard, color: '#ef4444' },
  ];

  const transactions = [
    { id: 1, type: 'Transfer', to: 'Damilola (AirSend)', amount: -5000, date: 'Today, 12:45 PM', category: 'P2P' },
    { id: 2, type: 'Deposit', to: 'GTBank Funding', amount: 50000, date: 'Yesterday, 09:30 AM', category: 'Funding' },
    { id: 3, type: 'Airtime', to: 'MTN - 0812345', amount: -2000, date: 'Yesterday, 06:20 PM', category: 'Utility' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'white',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* OPay-Style Splash Screen & Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'linear-gradient(135deg, var(--primary) 0%, #008f53 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            {/* Pulsing Geometric Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 1], 
                opacity: 1 
              }}
              transition={{ 
                duration: 1.2, 
                ease: 'easeOut',
                times: [0, 0.6, 1] 
              }}
              style={{
                width: '100px',
                height: '100px',
                background: 'white',
                borderRadius: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                marginBottom: '32px',
                position: 'relative'
              }}
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                style={{ position: 'absolute', inset: '-5px', borderRadius: '35px', border: '2px dashed rgba(255,255,255,0.4)' }}
              />
              <Shield size={50} color="#009e5d" strokeWidth={2.5} />
            </motion.div>
            
            <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4 }}
               style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Orbit</h1>
              <p style={{ fontSize: '13px', fontWeight: '700', opacity: 0.8, letterSpacing: '3px', textTransform: 'uppercase' }}>Secure Launch</p>
            </motion.div>

            {/* OPay style bottom loading bar/dots */}
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.8 }}
               style={{ position: 'absolute', bottom: '60px', display: 'flex', gap: '10px' }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6, ease: 'easeInOut' }}
                  style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white' }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
               onClick={() => setShowSettings(false)}
            />
            <motion.div 
               initial={{ x: '100%' }} 
               animate={{ x: 0 }} 
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               style={{ 
                 width: '85%', 
                 maxWidth: '340px', 
                 background: 'var(--bg)', 
                 borderLeft: '1px solid rgba(255,255,255,0.1)', 
                 padding: '32px 24px', 
                 position: 'relative', 
                 zIndex: 1, 
                 display: 'flex', 
                 flexDirection: 'column',
                 boxShadow: '-20px 0 50px rgba(0,0,0,0.5)'
               }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                 <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>Preferences</h2>
                 <button onClick={() => setShowSettings(false)} style={{ padding: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: 'white' }}>
                   <X size={20}/>
                 </button>
               </div>
               
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <CircleUserRound size={28} color="var(--primary)" />
                   <div>
                     <div style={{ fontSize: '15px', fontWeight: 'bold' }}>John Doe</div>
                     <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tier 3 Verified Account</div>
                   </div>
                 </div>

                 <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <Shield size={22} color="var(--text-muted)" />
                   <span style={{ fontSize: '15px', fontWeight: '600' }}>Security Center</span>
                 </div>
                 
                 <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <Settings size={22} color="var(--text-muted)" />
                   <span style={{ fontSize: '15px', fontWeight: '600' }}>App Settings</span>
                 </div>
               </div>

               <button 
                 onClick={handleLogout} 
                 style={{ 
                   marginTop: 'auto',
                   padding: '18px', 
                   background: 'rgba(239, 68, 68, 0.1)', 
                   color: '#ef4444', 
                   border: '1px solid rgba(239, 68, 68, 0.2)', 
                   borderRadius: '20px', 
                   fontWeight: '800', 
                   fontSize: '16px',
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   gap: '12px' 
                 }}
               >
                 <LogOut size={22} /> System Disconnect
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isLoading && isAuthenticated && (
      <div style={{ padding: '24px 24px 120px 24px', maxWidth: '500px', margin: '0 auto' }}>
        {/* Redesigned Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary) 0%, #009e5d 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'black', 
              fontWeight: '900',
              fontSize: '18px',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 20px rgba(0, 210, 123, 0.3)'
            }}>
              JD
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.5px' }}>Hello, John</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Personal Vault</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ padding: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Bell size={20} color="var(--text-muted)" />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              style={{ padding: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
            >
              <Settings size={20} color="var(--text-muted)" />
            </button>
          </div>
        </header>

        {/* 3D Glassmorphic Balance Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0, rotateX: 10 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          whileHover={{ scale: 1.02, rotateY: 3, rotateX: -3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            background: 'rgba(20, 20, 25, 0.6)',
            backdropFilter: 'blur(30px)',
            borderRadius: '32px',
            padding: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '40px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 2px 5px rgba(255, 255, 255, 0.05)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Internal Glowing Orb */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '-20%', right: '-10%', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(60px)', borderRadius: '50%', zIndex: 0 }}
          />

          <div style={{ position: 'relative', zIndex: 1, transform: 'translateZ(30px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }}></div>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)' }}>Available Funds</span>
              </div>
              <Wifi size={24} style={{ transform: 'rotate(90deg)', opacity: 0.4 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: '600', opacity: 0.8, marginRight: '6px', marginTop: '6px' }}>₦</span>
              <span style={{ fontSize: '54px', fontWeight: '900', letterSpacing: '-2px' }}>
                {showBalance ? balance.toLocaleString() : '••••••••'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', color: 'white', backdropFilter: 'blur(10px)' }}
              >
                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                {showBalance ? 'Hide' : 'Show'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                 <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ff3b30' }}></div>
                 <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ff9500', marginLeft: '-15px', mixBlendMode: 'screen' }}></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Quick Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', padding: '0 8px' }}>
          {quickActions.map((action, i) => (
            <motion.div 
              key={action.name} 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
            >
              <button style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: action.color,
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
              }}>
                <action.icon size={26} strokeWidth={2.5} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{action.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Orbit Core - AirSend */}
        <div onClick={() => setShowNearby(true)} style={{ cursor: 'pointer' }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
              borderRadius: '28px',
              padding: '24px 28px',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '48px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 15px 30px rgba(99, 102, 241, 0.1)'
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' }}>
                <Radio size={28} />
              </div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '-0.5px', marginBottom: '2px' }}>AirSend Nexus</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Offline P2P Gestures</div>
              </div>
            </div>
            <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ChevronRight size={24} color="var(--accent)" />
            </motion.div>
          </motion.div>
        </div>

        {/* Minimal Transactions */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', padding: '0 8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Recent</h3>
            <Link href="/finance" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer' }}>View Ledger</span>
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {transactions.map((tx, idx) => (
              <div key={tx.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px', 
                borderBottom: idx !== transactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '16px', 
                    background: tx.amount > 0 ? 'rgba(0, 210, 123, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: tx.amount > 0 ? 'var(--primary)' : 'white'
                  }}>
                    {tx.amount > 0 ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'white', marginBottom: '4px' }}>{tx.to}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{tx.category} • {tx.date}</div>
                  </div>
                </div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: tx.amount > 0 ? 'var(--primary)' : 'white', letterSpacing: '-0.5px' }}>
                  {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Floating Bottom Nav */}
      {!isLoading && isAuthenticated && (
      <div style={{ 
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '450px',
        height: '76px', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        background: 'rgba(20, 20, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '38px',
        zIndex: 100,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <Landmark size={24} />
        </div>
        <div style={{ color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <CreditCard size={24} />
        </div>
        
        {/* Gemini Voice AI Fab */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => setShowVoice(true)}
            style={{ 
              width: '68px', 
              height: '68px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, #009e5d 100%)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'black',
              marginTop: '-40px',
              boxShadow: '0 15px 30px rgba(0, 210, 123, 0.4)',
              border: '4px solid var(--bg)',
              cursor: 'pointer'
            }}
          >
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Mic size={30} strokeWidth={2.5} />
            </motion.div>
          </button>
        </div>

        <div style={{ color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <User size={24} />
        </div>
        <div style={{ color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <Filter size={24} />
        </div>
      </div>
      )}

      <VoiceBankingModal isOpen={showVoice} onClose={() => setShowVoice(false)} />
      <NearbyAirSend open={showNearby} onOpenChange={setShowNearby} currentBalance={balance} />
    </div>
  );
}
