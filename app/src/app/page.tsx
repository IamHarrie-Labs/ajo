'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar, Topbar, BottomNav } from '../components/Shell';
import Landing from '../components/Landing';
import Dashboard from '../components/Dashboard';
import PoolDetail from '../components/PoolDetail';
import Discover from '../components/Discover';
import Create from '../components/Create';
import Profile from '../components/Profile';
import Icon from '../components/Icon';
import {
  ContributeModal,
  WithdrawModal,
  SlashVoteModal,
  JoinConfirmModal,
} from '../components/Modals';
import { POOLIT_POOLS, fmt } from '../lib/data';
import { fetchMyPools, fetchUsdcBalance, fetchPoolByPubkey } from '../lib/anchor-client';
import type { OnchainPool } from '../lib/anchor-client';
import type { Pool, DiscoverPool, RotationMember, ModalState, Wallet, CreateForm } from '../lib/types';

// ─── URL ↔ route helpers ───────────────────────────────────────────────────────

const ROUTE_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  discover:  '/discover',
  create:    '/create',
  profile:   '/profile',
};

function pathToRoute(pathname: string): string {
  if (pathname.startsWith('/pools/')) return `pool-${pathname.slice(8)}`;
  if (pathname.startsWith('/join/'))  return `join-${pathname.slice(6)}`;
  return Object.entries(ROUTE_TO_PATH).find(([, p]) => p === pathname)?.[0] ?? 'dashboard';
}

// ──────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme]   = useState<'safe' | 'bold'>('safe');
  const [authed, setAuthed] = useState(false);
  const [route, setRoute]   = useState('dashboard');
  const [modal, setModal]   = useState<ModalState>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; icon: string }[]>([]);
  const [pools, setPools]           = useState<Pool[]>(POOLIT_POOLS);
  const [wallet, setWallet]         = useState<Wallet>({ addr: '', balance: 0 });
  const [fetchingPools, setFetchingPools] = useState(false);
  // Pool ID parsed from /join/:id — triggers join modal after wallet connect
  const [invitePoolId, setInvitePoolId] = useState<string | null>(null);

  // ─── URL sync ──────────────────────────────────────────────────────────────

  // On first render (client-only), read the URL so a direct link to
  // /dashboard, /pools/abc123, or /join/abc123 lands on the right view.
  useEffect(() => {
    const path = window.location.pathname;
    const initial = pathToRoute(path);
    if (initial.startsWith('join-')) {
      // Store invite ID; show landing until wallet connects
      setInvitePoolId(initial.slice(5));
      setRoute('dashboard'); // will navigate there after auth
    } else if (initial !== 'dashboard') {
      setRoute(initial);
    }
  }, []);

  // Mirror route changes into the browser address bar.
  useEffect(() => {
    if (!authed) return;
    const path = route.startsWith('pool-')
      ? `/pools/${route.slice(5)}`
      : (ROUTE_TO_PATH[route] ?? '/dashboard');
    if (window.location.pathname !== path) {
      window.history.pushState({ route }, '', path);
    }
  }, [route, authed]);

  // Keep in sync with the browser Back / Forward buttons.
  useEffect(() => {
    const onPop = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const pushToast = (msg: string, icon = 'check') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // ─── Map on-chain pool data to UI Pool shape ─────────────────────────────
  const onchainToPool = useCallback((op: OnchainPool): Pool => ({
    id:                   op.pubkey.slice(-8),
    name:                 `Pool ${op.pubkey.slice(0, 6)}`,
    description:          '',
    contribution:         op.contributionAmount,
    members:              op.members.length,
    filled:               op.members.length,
    cycle:                'monthly',
    rounds:               op.members.length,
    currentRound:         op.currentRound,
    pot:                  op.contributionAmount * op.members.length,
    nextPayout:           new Date(Date.now() + 7 * 86_400_000).toISOString(),
    status:               op.status === 'Active' ? 'active' : op.status === 'Completed' ? 'completed' : 'active',
    youAreIn:             true,
    yourPaid:             op.contributionsThisRound[op.members.indexOf(wallet.fullAddr || '')] ?? false,
    contributedThisRound: op.contributionsThisRound.filter(Boolean).length,
    rotation:             op.members.map((addr, i) => ({
      idx: i, name: `${addr.slice(0, 4)}…${addr.slice(-4)}`,
      addr, paid: op.contributionsThisRound[i] ?? false,
      paidThisRound: op.contributionsThisRound[i] ?? false,
      late: op.defaultedMembers.includes(addr),
      isYou: addr === wallet.fullAddr,
      paidAt: '',
    })),
    vaultAddr:        op.poolVault,
    onchainPubkey:    op.pubkey,
    privateContributions: false,
  }), [wallet.fullAddr]);

  // ─── Auto-open join modal when arriving via invite link ─────────────────
  useEffect(() => {
    if (!wallet.fullAddr || !invitePoolId || !authed) return;
    let cancelled = false;
    fetchPoolByPubkey(invitePoolId, wallet.fullAddr).then(onchain => {
      if (cancelled || !onchain) return;
      const discoverPool: DiscoverPool = {
        id: onchain.pubkey,
        name: `Pool ${onchain.pubkey.slice(0, 6)}`,
        contribution: onchain.contributionAmount,
        members: onchain.members.length,
        filled: onchain.members.length,
        cycle: 'monthly',
        repAvg: 100,
        tags: ['invite'],
      };
      openJoin(discoverPool);
      setInvitePoolId(null); // clear so it only fires once
    }).catch(() => { /* pool not found or not on-chain */ });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.fullAddr, invitePoolId, authed]);

  // ─── Fetch real pools when a wallet is connected ─────────────────────────
  useEffect(() => {
    if (!wallet.fullAddr) return;
    let cancelled = false;
    setFetchingPools(true);
    fetchMyPools(wallet.fullAddr)
      .then(onchainPools => {
        if (cancelled) return;
        if (onchainPools.length === 0) { setFetchingPools(false); return; }
        const mapped = onchainPools.map(onchainToPool);
        // Keep mock pools (no onchainPubkey) alongside real ones
        setPools(prev => [
          ...mapped,
          ...prev.filter(p => !p.onchainPubkey),
        ]);
        setFetchingPools(false);
      })
      .catch(() => setFetchingPools(false)); // silently fall back to mock data
    return () => { cancelled = true; };
  }, [wallet.fullAddr, onchainToPool]);

  // ─── Devnet USDC faucet ───────────────────────────────────────────────────
  const handleGetUsdc = useCallback(async () => {
    if (!wallet.fullAddr) { pushToast('Connect a wallet first', 'alert'); return; }
    pushToast('Requesting test USDC…', 'send');
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: wallet.fullAddr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Faucet request failed');
      setWallet(w => ({ ...w, balance: w.balance + (data.amount ?? 100) }));
      pushToast(`+${data.amount ?? 100} USDC added to your wallet`);
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Faucet error', 'alert');
    }
  }, [wallet.fullAddr]);

  const handleConnect = (kind: 'phone' | 'wallet', address?: string) => {
    if (address) {
      setWallet(w => ({
        ...w,
        addr: `${address.slice(0, 4)}...${address.slice(-4)}`,
        fullAddr: address,
        balance: 0, // will be replaced by real balance below
      }));
      // Fetch real devnet USDC balance in the background
      fetchUsdcBalance(address).then(bal => {
        setWallet(w => ({ ...w, balance: bal }));
      }).catch(() => {/* leave at 0 */});
    }
    setAuthed(true);
    pushToast(kind === 'phone' ? 'Signed in via phone' : 'Wallet connected');
  };
  const handleLogout = () => {
    setAuthed(false);
    setRoute('dashboard');
    window.history.pushState({}, '', '/');
  };

  const handleSharePool = useCallback((pool: Pool) => {
    const id = pool.onchainPubkey || pool.id;
    const url = `${window.location.origin}/join/${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    pushToast('Invite link copied to clipboard', 'check');
  }, []);

  // ─── Modal openers ───────────────────────────────────────────────────────
  const openContribute = (pool: Pool) => setModal({ kind: 'contribute', pool });
  const openWithdraw   = (pool: Pool) => setModal({ kind: 'withdraw', pool });
  const openSlash      = (pool: Pool, member: RotationMember) => setModal({ kind: 'slash', pool, member });
  const openJoin       = (pool: DiscoverPool) => setModal({ kind: 'join', pool });

  // ─── Modal handlers ──────────────────────────────────────────────────────
  const onContributed = (pool: Pool, amount: number) => {
    setWallet(w => ({ ...w, balance: w.balance - amount }));
    setPools(prev => prev.map(p => p.id === pool.id ? {
      ...p,
      rotation: p.rotation.map(r => r.isYou ? { ...r, paidThisRound: true } : r),
      contributedThisRound: Math.min(p.members, p.contributedThisRound + 1),
    } : p));
    setModal(null);
    pushToast(`Sent ${fmt(amount, 0)} USDC to ${pool.name}`);
  };

  const onWithdrew = (pool: Pool) => {
    setWallet(w => ({ ...w, balance: w.balance + pool.pot }));
    setPools(prev => prev.map(p => p.id === pool.id ? { ...p, currentRound: p.currentRound + 1 } : p));
    setModal(null);
    pushToast(`+${fmt(pool.pot, 0)} USDC received`);
  };

  const onVoted = (pool: Pool, member: RotationMember, vote: string) => {
    setModal(null);
    pushToast(`Vote recorded: ${vote === 'slash' ? 'slash' : 'forgive'} ${member.name}`);
  };

  const onJoined = (pool: DiscoverPool) => {
    setModal(null);
    pushToast(`Joined ${pool.name}`);
    setRoute('dashboard');
  };

  const onCreated = (form: CreateForm, onchainPubkey?: string, vaultPubkey?: string) => {
    if (onchainPubkey) {
      // Add the freshly deployed pool to local state so the dashboard shows it
      const newPool: Pool = {
        id: onchainPubkey.slice(-8),
        name: form.name,
        description: form.description,
        contribution: form.contribution,
        members: form.members,
        filled: form.members,
        cycle: form.cycle,
        rounds: form.members,
        currentRound: 1,
        pot: form.contribution * form.members,
        nextPayout: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        status: 'active',
        youAreIn: true,
        yourPaid: false,
        contributedThisRound: 0,
        rotation: [],
        vaultAddr: vaultPubkey,
        onchainPubkey,
        privateContributions: form.privateContributions,
      };
      setPools(prev => [newPool, ...prev]);
      pushToast(`Pool "${form.name}" deployed onchain`);
    } else {
      pushToast(`Pool "${form.name}" deployed`);
    }
    setRoute('dashboard');
  };

  // ─── Not authed: show landing ────────────────────────────────────────────
  if (!authed) {
    return (
      <div className={`theme-${theme}`} style={{ width: '100%', height: '100%' }}>
        <Landing
          onConnect={handleConnect}
          theme={theme}
          onThemeToggle={v => setTheme(v as 'safe' | 'bold')}
          walletAddr={wallet.fullAddr}
          invitePoolId={invitePoolId}
        />
      </div>
    );
  }

  // ─── Build crumbs + body ─────────────────────────────────────────────────
  let crumbs: string[] = ['Circles'];
  let body: React.ReactNode = null;

  if (route === 'dashboard') {
    crumbs = ['Circles', 'Dashboard'];
    body = <Dashboard onNavigate={setRoute} onContribute={openContribute} wallet={wallet} pools={pools} onGetUsdc={handleGetUsdc} fetchingPools={fetchingPools} />;
  } else if (route === 'discover') {
    crumbs = ['Circles', 'Discover'];
    body = <Discover onJoin={openJoin} />;
  } else if (route === 'create') {
    crumbs = ['Circles', 'Create pool'];
    body = <Create onCreated={onCreated} walletFullAddr={wallet.fullAddr} />;
  } else if (route === 'profile') {
    crumbs = ['Circles', 'Reputation'];
    body = <Profile wallet={wallet} />;
  } else if (route.startsWith('pool-')) {
    const pid = route.replace('pool-', '');
    const pool = pools.find(p => p.id === pid);
    if (pool) {
      crumbs = ['Circles', 'Pools', pool.name];
      body = (
        <PoolDetail
          pool={pool}
          onContribute={openContribute}
          onWithdraw={openWithdraw}
          onSlashVote={openSlash}
          onShare={handleSharePool}
          onBack={() => setRoute('dashboard')}
        />
      );
    }
  }

  return (
    <div className={`theme-${theme}`} style={{ width: '100%', height: '100%' }}>
      <div className="app">
        <Sidebar route={route} onNavigate={setRoute} wallet={wallet} onLogout={handleLogout} />
        <BottomNav route={route} onNavigate={setRoute} />
        <div className="main">
          <Topbar
            crumbs={crumbs}
            actions={
              <>
                <button className="btn btn-sm" title="Search"><Icon name="search" size={13} /></button>
                <button
                  className="btn btn-sm"
                  onClick={() => setTheme(t => t === 'safe' ? 'bold' : 'safe')}
                  title={theme === 'safe' ? 'Switch to dark' : 'Switch to light'}
                  style={{ width: 32, height: 32, padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <Icon name={theme === 'safe' ? 'moon' : 'sun'} size={15} />
                </button>
              </>
            }
          />
          {body}
        </div>
      </div>

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <div className="toast-icon"><Icon name={t.icon} size={14} /></div>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.kind === 'contribute' && (
        <ContributeModal pool={modal.pool} wallet={wallet} onClose={() => setModal(null)} onDone={onContributed} />
      )}
      {modal?.kind === 'withdraw' && (
        <WithdrawModal pool={modal.pool} wallet={wallet} onClose={() => setModal(null)} onDone={onWithdrew} />
      )}
      {modal?.kind === 'slash' && (
        <SlashVoteModal pool={modal.pool} member={modal.member} wallet={wallet} onClose={() => setModal(null)} onVoted={onVoted} />
      )}
      {modal?.kind === 'join' && (
        <JoinConfirmModal pool={modal.pool as DiscoverPool} wallet={wallet} onClose={() => setModal(null)} onDone={onJoined} />
      )}
    </div>
  );
}
