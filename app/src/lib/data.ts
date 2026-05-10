// Circles — shared helpers
// All mock pool / activity / reputation data has been removed.
// Real data is fetched on-chain — see src/lib/anchor-client.ts.

import type { Pool, DiscoverPool, ActivityItem, Reputation } from './types';

// Keep type re-exports so old imports don't break at the type level
export type { Pool, DiscoverPool, ActivityItem, Reputation };

export function fmt(n: number, d = 2): string {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function shortAddr(a: string): string {
  if (!a) return '';
  return a.length > 12 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a;
}
