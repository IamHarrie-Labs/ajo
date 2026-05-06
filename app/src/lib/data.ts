// Circles — mock data and helpers
import type { Pool, DiscoverPool, ActivityItem, Reputation } from './types';

export const POOLIT_POOLS: Pool[] = [
  {
    id: 'pool-001',
    name: 'Lagos Founders Circle',
    description: 'Monthly savings pool for early-stage founders in Lagos.',
    contribution: 100,
    members: 8,
    filled: 8,
    cycle: 'monthly',
    rounds: 8,
    currentRound: 3,
    pot: 800,
    nextPayout: '2026-05-12',
    status: 'active',
    youAreIn: true,
    yourPosition: 5,
    yourPaid: false,
    contributedThisRound: 6,
    vaultAddr: 'DP9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4',
    privateContributions: false,
    rotation: [
      { idx: 1, name: 'Ade.sol',  addr: '7xKX...4hQp', paid: true,  paidThisRound: true,  late: false, isYou: false, paidAt: 'Round 1' },
      { idx: 2, name: 'Chiamaka', addr: '9bNm...2fLj', paid: true,  paidThisRound: true,  late: false, isYou: false, paidAt: 'Round 2' },
      { idx: 3, name: 'Tunde',    addr: 'Bs8q...vN3w', paid: true,  paidThisRound: true,  late: false, isYou: false, paidAt: 'Round 3 (this)' },
      { idx: 4, name: 'Ifeoma',   addr: 'Cz1y...mP9k', paid: true,  paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
      { idx: 5, name: 'You',      addr: '5dEr...8wXy', paid: true,  paidThisRound: false, late: false, isYou: true,  paidAt: '—' },
      { idx: 6, name: 'Kwame',    addr: 'Aj4t...qR1z', paid: true,  paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
      { idx: 7, name: 'Zainab',   addr: 'Ds7p...uV5n', paid: true,  paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
      { idx: 8, name: 'Femi',     addr: 'Eh2x...kL6m', paid: false, paidThisRound: false, late: true,  isYou: false, paidAt: '—' },
    ],
  },
  {
    id: 'pool-002',
    name: 'Crypto Sisters Weekly',
    description: 'Women-led savings circle. Weekly contributions, 6 members.',
    contribution: 50,
    members: 6,
    filled: 6,
    cycle: 'weekly',
    rounds: 6,
    currentRound: 4,
    pot: 300,
    nextPayout: '2026-05-08',
    status: 'active',
    youAreIn: true,
    yourPosition: 2,
    yourPaid: true,
    contributedThisRound: 6,
    vaultAddr: 'EQ3x7WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xVault',
    privateContributions: true,
    rotation: [
      { idx: 1, name: 'Amara',  addr: '3kPq...wM4r', paid: true, paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
      { idx: 2, name: 'You',    addr: '5dEr...8wXy', paid: true, paidThisRound: true,  late: false, isYou: true,  paidAt: 'Round 2 (received)' },
      { idx: 3, name: 'Folake', addr: '7nVc...bH8j', paid: true, paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
      { idx: 4, name: 'Sade',   addr: '9wRt...kN2x', paid: true, paidThisRound: true,  late: false, isYou: false, paidAt: 'Round 4 (this)' },
      { idx: 5, name: 'Ngozi',  addr: 'BfHy...pQ7s', paid: true, paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
      { idx: 6, name: 'Aisha',  addr: 'Ck3w...vJ9d', paid: true, paidThisRound: true,  late: false, isYou: false, paidAt: '—' },
    ],
  },
  {
    id: 'pool-003',
    name: 'Devs Quarterly Stack',
    description: 'Quarterly larger pool — 12 members, $500 each.',
    contribution: 500,
    members: 12,
    filled: 9,
    cycle: 'monthly',
    rounds: 12,
    currentRound: 0,
    pot: 6000,
    nextPayout: '2026-05-25',
    status: 'recruiting',
    youAreIn: false,
    yourPaid: false,
    contributedThisRound: 0,
    vaultAddr: 'FR8y9WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xVault',
    privateContributions: false,
    rotation: [],
  },
];

export const POOLIT_DISCOVER: DiscoverPool[] = [
  { id: 'd-001', name: 'Accra Builders Pool',   contribution: 200,  members: 10, filled: 7,  cycle: 'monthly', repAvg: 92, tags: ['Builders', 'Africa'] },
  { id: 'd-002', name: 'Solana Stackers',        contribution: 250,  members: 8,  filled: 5,  cycle: 'monthly', repAvg: 88, tags: ['Solana', 'Web3'] },
  { id: 'd-003', name: 'Weekly Hustlers',        contribution: 25,   members: 12, filled: 11, cycle: 'weekly',  repAvg: 76, tags: ['Starter'] },
  { id: 'd-004', name: 'Founders Vault Q2',      contribution: 1000, members: 6,  filled: 4,  cycle: 'monthly', repAvg: 95, tags: ['Founders', 'High stake'] },
  { id: 'd-005', name: 'Coastal Savers',         contribution: 75,   members: 10, filled: 9,  cycle: 'monthly', repAvg: 81, tags: ['Africa'] },
  { id: 'd-006', name: 'NGN Diaspora Circle',    contribution: 150,  members: 8,  filled: 6,  cycle: 'monthly', repAvg: 89, tags: ['Diaspora'] },
];

export const POOLIT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', kind: 'received', text: 'Round 2 payout received',    pool: 'Crypto Sisters Weekly', amount: '+300.00 USDC', time: '2h ago',  addr: 'CS pool' },
  { id: 'a2', kind: 'paid',     text: 'Contribution sent',           pool: 'Lagos Founders Circle', amount: '-100.00 USDC', time: '1d ago',  addr: 'LF pool' },
  { id: 'a3', kind: 'paid',     text: 'Contribution sent',           pool: 'Crypto Sisters Weekly', amount: '-50.00 USDC',  time: '3d ago',  addr: 'CS pool' },
  { id: 'a4', kind: 'flagged',  text: 'Member flagged: Femi (late)', pool: 'Lagos Founders Circle', amount: '',             time: '4d ago',  addr: 'LF pool' },
  { id: 'a5', kind: 'joined',   text: 'Joined pool',                  pool: 'Lagos Founders Circle', amount: '',             time: '6w ago',  addr: 'LF pool' },
];

export const POOLIT_REPUTATION: Reputation = {
  score: 94,
  completed: 7,
  active: 2,
  defaults: 0,
  totalContributed: 2150,
  totalReceived: 1900,
  joinedDate: 'Mar 2025',
  badges: [
    { name: 'On time × 7', desc: 'Paid every round on time' },
    { name: 'Circle host',  desc: 'Created 2 circles, both completed' },
    { name: 'Voter',        desc: 'Participated in 3 slash votes' },
  ],
  history: [
    { pool: 'Hackerhouse Q1',        role: 'Member', rounds: '6/6', status: 'Completed' },
    { pool: 'Devs Mini',             role: 'Host',   rounds: '8/8', status: 'Completed' },
    { pool: 'Lagos Founders Circle', role: 'Member', rounds: '3/8', status: 'Active' },
    { pool: 'Crypto Sisters Weekly', role: 'Member', rounds: '4/6', status: 'Active' },
  ],
};

// Helpers
export function fmt(n: number, d = 2): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function shortAddr(a: string): string {
  if (!a) return '';
  return a.length > 12 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a;
}
