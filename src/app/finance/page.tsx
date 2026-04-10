'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, TrendingDown, Clock, Download, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

const data = [
  { name: 'Mon', balance: 115000 },
  { name: 'Tue', balance: 121000 },
  { name: 'Wed', balance: 119000 },
  { name: 'Thu', balance: 132000 },
  { name: 'Fri', balance: 128000 },
  { name: 'Sat', balance: 140000 },
  { name: 'Sun', balance: 125430 },
];

const transactions = [
  { id: 1, title: 'AirSend to Damilola', category: 'P2P Transfer', date: 'Oct 24, 02:40 PM', amount: -5000, type: 'out' },
  { id: 2, title: 'Salary Deposit', category: 'Income', date: 'Oct 23, 09:00 AM', amount: 350000, type: 'in' },
  { id: 3, title: 'Netflix Subscription', category: 'Entertainment', date: 'Oct 22, 11:30 PM', amount: -4000, type: 'out' },
  { id: 4, title: 'Grocery Supermart', category: 'Shopping', date: 'Oct 21, 04:15 PM', amount: -15000, type: 'out' },
];

export default function FinancePage() {
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '6M'>('1W');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft size={20} />
          <span style={{ fontWeight: '600' }}>Back</span>
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Finance</h1>
        <button style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search size={20} />
        </button>
      </header>

      {/* Balance Overview */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Net Worth</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', margin: 0 }}>₦125,430</h2>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00d27b', background: 'rgba(0, 210, 123, 0.1)', padding: '4px 8px', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}>
            <TrendingUp size={14} /> +12.5%
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ 
        background: 'rgba(20, 20, 25, 0.6)', 
        borderRadius: '24px', 
        padding: '24px', 
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            {['1W', '1M', '6M'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t as any)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: timeframe === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: timeframe === t ? 'white' : 'rgba(255,255,255,0.4)',
                  fontWeight: '700',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '200px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d27b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00d27b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                itemStyle={{ color: '#00d27b', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#00d27b" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Action Bars */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        <div style={{ flex: 1, background: 'rgba(20, 20, 25, 0.6)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0, 210, 123, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d27b' }}>
            <Download size={20} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Income</p>
            <p style={{ fontSize: '20px', fontWeight: '800' }}>₦350,000</p>
          </div>
        </div>
        <div style={{ flex: 1, background: 'rgba(20, 20, 25, 0.6)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Expenses</p>
            <p style={{ fontSize: '20px', fontWeight: '800' }}>₦24,000</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Recent Activity</h3>
          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>See All</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.map((tx) => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: tx.type === 'in' ? 'rgba(0, 210, 123, 0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.type === 'in' ? '#00d27b' : 'white' }}>
                  {tx.type === 'in' ? <TrendingUp size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>{tx.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{tx.category} • {tx.date}</p>
                </div>
              </div>
              <span style={{ fontWeight: '800', fontSize: '15px', color: tx.type === 'in' ? '#00d27b' : 'white' }}>
                {tx.type === 'in' ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
