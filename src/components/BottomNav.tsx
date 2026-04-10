'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, PieChart, User, Radio } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Rewards', icon: Gift, path: '/rewards' },
    { name: 'AirSend', icon: Radio, path: '/nearby' },
    { name: 'Finance', icon: PieChart, path: '/finance' },
    { name: 'Me', icon: User, path: '/me' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0 20px',
      zIndex: 1000
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link 
            key={item.name} 
            href={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              gap: '4px'
            }}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '12px', fontWeight: isActive ? '600' : '400' }}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
