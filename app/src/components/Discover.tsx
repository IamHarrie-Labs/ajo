'use client';

import { useState } from 'react';
import Icon from './Icon';
import { fmt, POOLIT_DISCOVER } from '../lib/data';
import type { DiscoverPool } from '../lib/types';

interface DiscoverProps {
  onJoin: (pool: DiscoverPool) => void;
}

export default function Discover({ onJoin }: DiscoverProps) {
  const [q, setQ] = useState('');
  const [cycle, setCycle] = useState('all');
  const [size, setSize] = useState('all');

  const filtered = POOLIT_DISCOVER.filter(p => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (cycle !== 'all' && p.cycle !== cycle) return false;
    if (size === 'sm' && p.contribution >= 100) return false;
    if (size === 'md' && (p.contribution < 100 || p.contribution >= 500)) return false;
    if (size === 'lg' && p.contribution < 500) return false;
    return true;
  });

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Discover pools</div>
          <div className="page-sub">{filtered.length} open circles · Sorted by reputation</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 14 }}>
        <div className="row gap-10">
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
              <Icon name="search" size={14} />
            </div>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search pools by name…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="seg">
            <button className={cycle === 'all'     ? 'on' : ''} onClick={() => setCycle('all')}>All cycles</button>
            <button className={cycle === 'weekly'  ? 'on' : ''} onClick={() => setCycle('weekly')}>Weekly</button>
            <button className={cycle === 'monthly' ? 'on' : ''} onClick={() => setCycle('monthly')}>Monthly</button>
          </div>
          <div className="seg">
            <button className={size === 'all' ? 'on' : ''} onClick={() => setSize('all')}>Any size</button>
            <button className={size === 'sm'  ? 'on' : ''} onClick={() => setSize('sm')}>&lt;$100</button>
            <button className={size === 'md'  ? 'on' : ''} onClick={() => setSize('md')}>$100–500</button>
            <button className={size === 'lg'  ? 'on' : ''} onClick={() => setSize('lg')}>$500+</button>
          </div>
        </div>
      </div>

      <div className="grid-3">
        {filtered.map(p => (
          <DiscoverCard key={p.id} pool={p} onJoin={() => onJoin(p)} />
        ))}
      </div>

      {filtered.length === 0 && <div className="empty">No pools match your filters.</div>}
    </div>
  );
}

function DiscoverCard({ pool, onJoin }: { pool: DiscoverPool; onJoin: () => void }) {
  const pct = (pool.filled / pool.members) * 100;
  return (
    <div className="pool-card">
      <div className="pool-card-head">
        <div>
          <div className="pool-name">{pool.name}</div>
          <div className="pool-sub">{pool.cycle} · {pool.members} seats</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pool-amount">{fmt(pool.contribution, 0)}</div>
          <div className="pool-amount-sub">USDC / round</div>
        </div>
      </div>

      <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
        {pool.tags.map(t => <span key={t} className="pill">{t}</span>)}
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <span className="text-xs text-muted">{pool.filled}/{pool.members} joined</span>
          <span className="text-xs mono">avg rep <strong style={{ color: 'var(--ink)' }}>{pool.repAvg}</strong></span>
        </div>
        <div className="progress"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="pool-meta">
        <div className="pool-meta-item">
          <span>Pot</span>
          <span className="pool-meta-val">{fmt(pool.contribution * pool.members, 0)}</span>
        </div>
        <div className="pool-meta-item">
          <span>Collateral</span>
          <span className="pool-meta-val">{fmt(pool.contribution, 0)}</span>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', alignSelf: 'center' }} onClick={onJoin}>
          Join pool
        </button>
      </div>
    </div>
  );
}
