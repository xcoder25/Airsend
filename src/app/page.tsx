'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, 
  Smartphone, CreditCard, Landmark, Scan, Bell, Mic,
  ChevronRight, Radio, Search, User, Filter, Wifi
} from 'lucide-react';
import Link from 'next/link';

import VoiceBankingModal from '@/components/VoiceBankingModal';

export default function WalletDashboard() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const balance = 125430.50;

  useEffect(() => {
    // Security redirect: Ensure user is logged in
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('orbit_auth') !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  const quickActions = [
    { name: 'Send', icon: ArrowUpRight, color: 'var(--primary)' },
    { name: 'Request', icon: ArrowDownLeft, color: 'var(--accent)' },
    { name: 'Top-up', icon: Plus, color: '#f59e0b' },
    { name: 'Bills', icon: Smartphone, color: '#ef4444' },
  ];

  const transactions = [
    { id: 1, type: 'Transfer', to: 'Damilola (AirSend)', amount: -5000, date: 'Today, 12:45' },
    { id: 2, type: 'Deposit', to: 'Bank Transfer', amount: 50000, date: 'Yesterday, 09:30' },
    { id: 3, type: 'Airtime', to: 'MTN - 0812345', amount: -2000, date: 'Yesterday, 18:20' },
  ];

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '500px', 
      margin: '0 auto', 
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'white',
      paddingBottom: '100px',
      position: 'relative'
    }}>
      
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '14px', 
            background: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'black', 
            fontWeight: '900',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            JD
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Good Afternoon,</div>
            <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>John Doe</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              localStorage.removeItem('orbit_auth');
              router.push('/login');
            }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              fontSize: '12px', 
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
             Sign Out
          </button>
          <button className="glass" style={{ padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <Search size={20} color="var(--text-muted)" />
          </button>
          <button className="glass" style={{ padding: '10px', borderRadius: '12px', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Bell size={20} color="var(--text-muted)" />
            <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', border: '2px solid var(--bg)' }}></div>
          </button>
        </div>
      </header>

      {/* Premium Balance Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0, rotateX: 10 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        whileHover={{ scale: 1.02, rotateY: 2, rotateX: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.9) 0%, rgba(10, 10, 12, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '32px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          transformStyle: 'preserve-3d'
        }}
      >
        <motion.div 
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(0, 210, 123, 0.1), transparent)',
            backgroundSize: '200% 200%',
            zIndex: 0,
            opacity: 0.8
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, transform: 'translateZ(20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Orbit Virtual</span>
              </div>
              <Wifi size={24} style={{ transform: 'rotate(90deg)', marginTop: '12px', opacity: 0.5 }} />
            </div>
            
            <button onClick={() => setShowBalance(!showBalance)} style={{ color: 'white', opacity: 0.5, padding: '4px', background: 'transparent', border: 'none' }}>
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '16px', opacity: 0.6, fontWeight: '500' }}>Balance</span>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '600', marginTop: '4px', opacity: 0.8, marginRight: '4px' }}>₦</span>
              <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {showBalance ? balance.toLocaleString() : '••••••••'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ background: 'var(--primary)', color: 'black', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 5px 15px var(--primary-glow)' }}>
                <Plus size={16} strokeWidth={3} /> Top Up
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.8 }}></div>
               <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#6366f1', marginLeft: '-15px', opacity: 0.8, mixBlendMode: 'screen' }}></div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }} />
      </motion.div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {quickActions.map((action) => (
          <div key={action.name} style={{ textAlign: 'center' }}>
            <motion.div 
              whileHover={{ y: -4 }}
              className="glass"
              style={{ 
                width: '100%', 
                aspectRatio: '1', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '10px',
                color: 'white',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <action.icon size={26} color={action.color} />
            </motion.div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{action.name}</span>
          </div>
        ))}
      </div>

      {/* Featured Feature: AirSend */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Quick Transfers</h3>
      </div>
      
      <Link href="/nearby" style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>
              <Radio size={28} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '17px' }}>Nearby AirSend</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Gesture-based money transfer</div>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronRight size={24} color="var(--text-muted)" />
            </motion.div>
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            style={{ position: 'absolute', top: '50%', left: '20px', width: '100px', height: '100px', background: 'var(--accent)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}
          />
        </motion.div>
      </Link>

      {/* Transactions List */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Recent Activity</h3>
          <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '700' }}>History</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {transactions.map((tx) => (
            <div key={tx.id} className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: tx.amount > 0 ? 'rgba(0, 210, 123, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: tx.amount > 0 ? 'var(--primary)' : 'white'
                }}>
                  {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{tx.to}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{tx.date}</div>
                </div>
              </div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: tx.amount > 0 ? 'var(--primary)' : 'white', letterSpacing: '-0.5px' }}>
                {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Nav Mockup w/ Voice Banking Fab */}
      <div style={{ 
        height: '80px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        background: 'rgba(21, 21, 24, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingBottom: '10px'
      }}>
        <div style={{ color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Landmark size={24} />
          <span style={{ fontSize: '10px', fontWeight: '700' }}>Home</span>
        </div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <CreditCard size={24} />
          <span style={{ fontSize: '10px', fontWeight: '700' }}>Cards</span>
        </div>
        
        {/* Cortex AI Voice Banking Button */}
        <button 
          onClick={() => setShowVoice(true)}
          style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--primary)', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'black',
            marginTop: '-40px',
            boxShadow: '0 10px 30px var(--primary-glow)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Mic size={32} strokeWidth={2.5} />
          </motion.div>
        </button>

        <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <User size={24} />
          <span style={{ fontSize: '10px', fontWeight: '700' }}>Profile</span>
        </div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Filter size={24} />
          <span style={{ fontSize: '10px', fontWeight: '700' }}>More</span>
        </div>
      </div>

      <VoiceBankingModal isOpen={showVoice} onClose={() => setShowVoice(false)} />
    </div>
  );
}
