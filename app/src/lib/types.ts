// Circles — TypeScript types

export interface RotationMember {
  idx: number;
  name: string;
  addr: string;
  paid: boolean;
  paidThisRound: boolean;
  late: boolean;
  isYou: boolean;
  paidAt: string;
}

export interface Pool {
  id: string;
  name: string;
  description: string;
  contribution: number;
  members: number;
  filled: number;
  cycle: string;
  rounds: number;
  currentRound: number;
  pot: number;
  nextPayout: string;
  status: 'active' | 'recruiting' | 'completed';
  youAreIn: boolean;
  yourPosition?: number;
  yourPaid: boolean;
  contributedThisRound: number;
  rotation: RotationMember[];
  /** Pool vault PDA on devnet (used for on-chain transfers) */
  vaultAddr?: string;
  /** Real on-chain Pool account pubkey — set after txCreatePool succeeds */
  onchainPubkey?: string;
  /** When true, contributions are routed through MagicBlock Private Payments */
  privateContributions?: boolean;
}

export interface DiscoverPool {
  id: string;
  name: string;
  contribution: number;
  members: number;
  filled: number;
  cycle: string;
  repAvg: number;
  tags: string[];
}

export interface ActivityItem {
  id: string;
  kind: 'received' | 'paid' | 'flagged' | 'joined';
  text: string;
  pool: string;
  amount: string;
  time: string;
  addr: string;
}

export interface Badge {
  name: string;
  desc: string;
}

export interface PoolHistoryItem {
  pool: string;
  role: string;
  rounds: string;
  status: string;
}

export interface Reputation {
  score: number;
  completed: number;
  active: number;
  defaults: number;
  totalContributed: number;
  totalReceived: number;
  joinedDate: string;
  badges: Badge[];
  history: PoolHistoryItem[];
}

export interface Wallet {
  addr: string;
  /** Full base58 public key — available after a real wallet connection */
  fullAddr?: string;
  balance: number;
}

export type ModalState =
  | { kind: 'contribute'; pool: Pool }
  | { kind: 'withdraw'; pool: Pool }
  | { kind: 'slash'; pool: Pool; member: RotationMember }
  | { kind: 'join'; pool: DiscoverPool | Pool }
  | null;

export interface CreateForm {
  name: string;
  description: string;
  contribution: number;
  members: number;
  cycle: string;
  collateral: number;
  inviteOnly: boolean;
  /** Route contributions through MagicBlock Private Payments */
  privateContributions: boolean;
}
