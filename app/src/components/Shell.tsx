'use client';

import Icon from './Icon';
import Logo from './Logo';
import { fmt } from '../lib/data';
import { POOLIT_POOLS } from '../lib/data';
import type { Wallet } from '../lib/types';

interface SidebarProps {
  route: string;
  onNavigate: (r: string) => void;
  wallet: Wallet;
  onLogout: () => void;
}

export function Sidebar({ route, onNavigate, wallet, onLogout }: SidebarProps) {
  const items = [
    { key: 'dashboard',  label: 'Dashboard',   icon: 'home' },
    { key: 'discover',   label: 'Discover',    icon: 'compass' },
    { key: 'create',     label: 'Create pool', icon: 'plus' },
    { key: 'profile',    label: 'Reputation',  icon: 'shield' },
  ];

  const myPools = POOLIT_POOLS.filter(p => p.youAreIn);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" style={{ display: 'grid', placeItems: 'center' }}>
          <Logo size={18} />
        </div>
        <div className="brand-name">Circles</div>
        <div className="brand-net">devnet</div>
      </div>

      <div className="nav-section">Main</div>
      {items.map(it => (
        <button
          key={it.key}
          className={`nav-item ${route.startsWith(it.key) ? 'active' : ''}`}
          onClick={() => onNavigate(it.key)}
        >
          <span className="nav-icon"><Icon name={it.icon} size={15} /></span>
          {it.label}
        </button>
      ))}

      <div className="nav-section">Recent</div>
      {myPools.slice(0, 2).map(p => (
        <button
          key={p.id}
          className={`nav-item ${route === `pool-${p.id}` ? 'active' : ''}`}
          onClick={() => onNavigate(`pool-${p.id}`)}
          title={p.name}
        >
          <span className="nav-icon"><Icon name="pools" size={15} /></span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
        </button>
      ))}

      <div className="sidebar-footer">
        <div className="wallet-chip">
          <div className="wallet-avatar" />
          <div className="wallet-info">
            <div className="wallet-addr">{wallet.addr}</div>
            <div className="wallet-bal">{fmt(wallet.balance)} USDC</div>
          </div>
          <button
            className="btn-ghost"
            onClick={onLogout}
            style={{ width: 26, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center' }}
            title="Disconnect"
          >
            <Icon name="logout" size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

interface TopbarProps {
  crumbs: string[];
  actions?: React.ReactNode;
}

export function Topbar({ crumbs, actions }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span className="sep"><Icon name="chevron-right" size={12} /></span>}
            <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
          </span>
        ))}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </div>
  );
}
