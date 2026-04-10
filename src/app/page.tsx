'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, 
  Smartphone, CreditCard, Landmark, Scan, Bell,
  ChevronRight, Radio
} from 'lucide-react';
import Link from 'next/link';

export default function WalletDashboard() {
  const [showBalance, setShowBalance] = useState(true);
  const balance = 125430.50;

  const quickActions = [
    { name: 'Transfer', icon: ArrowUpRight, color: '#00d27b' },
    { name: 'Withdraw', icon: ArrowDownLeft, color: '#3b82f6' },
    { name: 'Top-up', icon: Plus, color: '#f59e0b' },
    { name: 'Bill Pay', icon: Smartphone, color: '#8b5cf6' },
  ];

  const transactions = [
    { id: 1, type: 'Transfer', to: 'Damilola (NearBy)', amount: -5000, date: 'Today, 12:45' },
    { id: 2, type: 'Deposit', to: 'Bank Transfer', amount: 50000, date: 'Yesterday, 09:30' },
    { id: 3, type: 'Airtime', to: '08123456789', amount: -2000, date: 'Yesterday, 18:20' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            JD
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Welcome back,</div>
            <div style={{ fontWeight: 'bold' }}>John Doe</div>
          </div>
        </div>
        <Bell size={24} color="var(--text-muted)" />
      </header>

      {/* Balance Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'var(--primary)',
          borderRadius: '24px',
          padding: '24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 10px 20px rgba(0, 210, 123, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
          <span style={{ fontSize: '14px' }}>Total Balance</span>
          <button onClick={() => setShowBalance(!showBalance)} style={{ color: 'white' }}>
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>
          {showBalance ? `₦${balance.toLocaleString()}` : '****'}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '12px' }}>Cashback: ₦420</span>
        </div>
        
        {/* Decor */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
      </motion.div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {quickActions.map((action) => (
          <div key={action.name} style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '1', 
              borderRadius: '16px', 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '8px',
              color: action.color,
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
            }}>
              <action.icon size={28} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{action.name}</span>
          </div>
        ))}
      </div>

      {/* Featured Feature: AirSend */}
      <Link href="/nearby" style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            borderRadius: '20px',
            padding: '20px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={32} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Nearby AirSend</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Gesture-based money throw</div>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight size={24} />
          </motion.div>
        </motion.div>
      </Link>

      {/* Transactions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Recent Transactions</h3>
          <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>See All</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transactions.map((tx) => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: tx.amount > 0 ? 'rgba(0, 210, 123, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: tx.amount > 0 ? 'var(--primary)' : '#ef4444'
                }}>
                  {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{tx.to}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.date}</div>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', color: tx.amount > 0 ? 'var(--primary)' : 'var(--text)' }}>
                {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
