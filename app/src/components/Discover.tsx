'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';
import { fmt } from '../lib/data';
import { fetchAllPools } from '../lib/anchor-client';
import type { DiscoverPool } from '../lib/types';

interface DiscoverProps {
  onJoin: (pool: DiscoverPool) => void;
  /** Current wallet address — used to exclude pools the user is already in */
  walletAddr?: string;
}

export default function Discover({ onJoin, walletAddr }: DiscoverProps) {
  const [q, setQ]         = useState('');
  const [cycle, setCycle] = useState('all');
  const [size, setSize]   = useState('all');

  const [pools, setPools]       = useState<DiscoverPool[]>([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchErr(false);
    fetchAllPools(walletAddr)
      .then(data => { if (!cancelled) { setPools(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setFetchErr(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [walletAddr]);

  const filtered = pools.filter(p => {
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
          <div className="page-sub">
            {loading ? 'Fetching on-chain pools…' : `${filtered.length} open circles · Sorted by contribution`}
          </div>
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
              placeholder="Search by pool address…"
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

      {/* Loading shimmer */}
      {loading && (
        <div className="grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="pool-card" style={{ gap: 14 }}>
              <div className="shimmer" style={{ height: 16, borderRadius: 6, width: '60%' }} />
              <div className="shimmer" style={{ height: 12, borderRadius: 6, width: '40%' }} />
              <div className="shimmer" style={{ height: 8, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && fetchErr && (
        <div className="empty">
          Could not reach the Solana devnet. Check your connection and try again.
        </div>
      )}

      {/* Results */}
      {!loading && !fetchErr && filtered.length > 0 && (
        <div className="grid-3">
          {filtered.map(p => (
            <DiscoverCard key={p.id} pool={p} onJoin={() => onJoin(p)} />
          ))}
        </div>
      )}

      {/* Empty — no pools on devnet */}
      {!loading && !fetchErr && pools.length === 0 && (
        <div style={{
          padding: '56px 24px',
          textAlign: 'center',
          border: '1px dashed var(--line-strong)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
            <Icon name="compass" size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No open pools on devnet</div>
            <div className="text-sm text-muted" style={{ maxWidth: 340, margin: '0 auto' }}>
              No one has deployed a pool yet. Create the first one — it will show up here for others to join.
            </div>
          </div>
        </div>
      )}

      {/* Empty — filters match nothing */}
      {!loading && !fetchErr && pools.length > 0 && filtered.length === 0 && (
        <div className="empty">No pools match your filters.</div>
      )}
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
        <span className="pill" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.2)' }}>
          Verified onchain
        </span>
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <span className="text-xs text-muted">{pool.filled}/{pool.members} members</span>
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
