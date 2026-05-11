'use client';

import { useState } from 'react';
import Icon from './Icon';
import { fmt } from '../lib/data';
import { txCreatePool } from '../lib/anchor-client';
import { getWalletProvider } from '../lib/magicblock';
import type { CreateForm } from '../lib/types';

interface CreateProps {
  onCreated: (form: CreateForm, onchainPubkey?: string, vaultPubkey?: string) => void;
  walletFullAddr?: string;
}

export default function Create({ onCreated, walletFullAddr }: CreateProps) {
  const [step, setStep]       = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [deployErr, setDeployErr] = useState('');
  const [form, setForm] = useState<CreateForm>({
    name: '',
    description: '',
    contribution: 100,
    members: 8,
    cycle: 'monthly',
    collateral: 100,
    inviteOnly: true,
    privateContributions: false,
  });
  // One wallet address per line; creator is prepended automatically
  const [memberInput, setMemberInput] = useState('');

  const upd = <K extends keyof CreateForm>(k: K, v: CreateForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  return (
    <div className="content" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-head">
        <div>
          <div className="page-title">Create a pool</div>
          <div className="page-sub">Step {step} of 4 · Deploys an Anchor program instance on devnet</div>
        </div>
      </div>

      {/* step indicator */}
      <div className="steps" style={{ marginBottom: 28 }}>
        {[1, 2, 3, 4].map((n, i) => (
          <span key={n} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <div className={`step-dot ${step === n ? 'active' : step > n ? 'done' : ''}`}>
              {step > n ? <Icon name="check" size={11} /> : n}
            </div>
            {i < 3 && <div className={`step-line ${step > n ? 'done' : ''}`} />}
          </span>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <>
            <div className="card-header"><div className="card-title">Basics</div></div>
            <div className="col gap-16">
              <div className="field">
                <label className="field-label">Pool name</label>
                <input className="input" placeholder="e.g. Lagos Founders Circle" value={form.name} onChange={e => upd('name', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <textarea className="input" rows={3} placeholder="Who is this pool for?" value={form.description} onChange={e => upd('description', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Visibility</label>
                <div className="seg">
                  <button className={form.inviteOnly ? 'on' : ''} onClick={() => upd('inviteOnly', true)}>Invite-only</button>
                  <button className={!form.inviteOnly ? 'on' : ''} onClick={() => upd('inviteOnly', false)}>Public (Discover)</button>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="card-header"><div className="card-title">Money</div></div>
            <div className="col gap-16">
              <div className="field">
                <label className="field-label">Contribution per round (USDC)</label>
                <input className="input mono" type="number" value={form.contribution} onChange={e => upd('contribution', Number(e.target.value))} />
                <div className="field-hint">Each member contributes this amount each round.</div>
              </div>
              <div className="field">
                <label className="field-label">Members</label>
                <div className="row gap-8">
                  {[4, 6, 8, 10, 12].map(n => (
                    <button key={n} className={`btn ${form.members === n ? 'btn-primary' : ''}`} onClick={() => upd('members', n)}>{n}</button>
                  ))}
                </div>
                <div className="field-hint">Total rounds equals member count. Each round one member gets the pot.</div>
              </div>
              <div className="field">
                <label className="field-label">
                  Member wallets
                  <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8, fontSize: 12 }}>optional</span>
                </label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder={"Paste one Solana wallet per line.\nYou are added as the first member automatically.\nLeave blank to deploy now and invite members via link."}
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <div className="field-hint">
                  {memberInput.trim()
                    ? `${memberInput.trim().split('\n').filter(l => l.trim()).length + 1} members (you + ${memberInput.trim().split('\n').filter(l => l.trim()).length} others)`
                    : <span style={{ color: 'var(--muted)' }}>Skip this and share an invite link after deployment — members join from the link.</span>}
                </div>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 8 }}>
                <div className="kv"><span className="kv-k">Pot per round</span><span className="kv-v">{fmt(form.contribution * form.members, 0)} USDC</span></div>
                <div className="kv"><span className="kv-k">Total cycle volume</span><span className="kv-v">{fmt(form.contribution * form.members * form.members, 0)} USDC</span></div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="card-header"><div className="card-title">Rotation</div></div>
            <div className="col gap-16">
              <div className="field">
                <label className="field-label">Cycle frequency</label>
                <div className="seg">
                  <button className={form.cycle === 'weekly'    ? 'on' : ''} onClick={() => upd('cycle', 'weekly')}>Weekly</button>
                  <button className={form.cycle === 'biweekly'  ? 'on' : ''} onClick={() => upd('cycle', 'biweekly')}>Biweekly</button>
                  <button className={form.cycle === 'monthly'   ? 'on' : ''} onClick={() => upd('cycle', 'monthly')}>Monthly</button>
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 8, fontSize: 13 }}>
                <div className="row gap-10" style={{ marginBottom: 8 }}>
                  <Icon name="sparkle" size={14} />
                  <strong>Rotation order is randomized</strong>
                </div>
                <div className="text-muted text-sm">Order is set by an on-chain VRF call when the last member joins. Nobody — including you — can pre-pick a position.</div>
              </div>
              <div className="field">
                <label className="field-label">Private contributions</label>
                <div className="seg">
                  <button className={form.privateContributions ? 'on' : ''} onClick={() => upd('privateContributions', true)}>On (MagicBlock)</button>
                  <button className={!form.privateContributions ? 'on' : ''} onClick={() => upd('privateContributions', false)}>Off (public)</button>
                </div>
                {form.privateContributions
                  ? <div className="field-hint" style={{ color: 'var(--good)' }}>Amounts and participants are hidden on-chain using MagicBlock Intel TDX.</div>
                  : <div className="field-hint">All contributions and payouts are visible on Solana Explorer.</div>
                }
              </div>

              <div className="field">
                <label className="field-label">Slash threshold</label>
                <div className="seg">
                  <button className="on">Simple majority (&gt; 50%)</button>
                  <button>Supermajority (&gt; 66%)</button>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="card-header"><div className="card-title">Review &amp; deploy</div></div>
            <div className="col gap-12">
              <div className="kv"><span className="kv-k">Name</span><span className="kv-v">{form.name || '—'}</span></div>
              <div className="kv"><span className="kv-k">Visibility</span><span className="kv-v">{form.inviteOnly ? 'Invite-only' : 'Public'}</span></div>
              <div className="kv"><span className="kv-k">Members</span><span className="kv-v">{form.members}</span></div>
              <div className="kv"><span className="kv-k">Contribution</span><span className="kv-v">{fmt(form.contribution, 0)} USDC / round</span></div>
              <div className="kv"><span className="kv-k">Cycle</span><span className="kv-v">{form.cycle}</span></div>
              <div className="kv"><span className="kv-k">Pot per round</span><span className="kv-v">{fmt(form.contribution * form.members, 0)} USDC</span></div>
              <div className="kv"><span className="kv-k">Network fee (est.)</span><span className="kv-v">~0.0006 SOL</span></div>
              <div className="kv">
                <span className="kv-k">Contributions</span>
                <span className="kv-v" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {form.privateContributions
                    ? <><Icon name="shield" size={12} /> Private (MagicBlock)</>
                    : 'Public onchain'}
                </span>
              </div>
            </div>
            {form.privateContributions && (
              <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', padding: 12, borderRadius: 8, fontSize: 12, marginTop: 12, display: 'flex', gap: 8 }}>
                <Icon name="shield" size={14} />
                <span style={{ color: 'var(--good)' }}>Private contributions enabled. Amounts and participants are hidden on-chain via MagicBlock TEE.</span>
              </div>
            )}
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, fontSize: 12, marginTop: 12, display: 'flex', gap: 8 }}>
              <Icon name="lock" size={14} />
              <span className="text-muted">
                {memberInput.trim()
                  ? "You'll be prompted to sign once. Pool deploys with the wallets you listed."
                  : "You'll be prompted to sign once. Pool deploys in recruiting mode — share the invite link to bring in members."}
              </span>
            </div>
          </>
        )}

        {deployErr && (
          <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, display: 'flex', gap: 8 }}>
            <Icon name="alert" size={13} />
            <span>{deployErr}</span>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
          <button className="btn" onClick={back} disabled={step === 1 || deploying} style={{ opacity: (step === 1 || deploying) ? 0.5 : 1 }}>Back</button>
          {step < 4
            ? <button className="btn btn-primary" onClick={next} disabled={step === 1 && !form.name}>
                Continue <Icon name="arrow-right" size={13} />
              </button>
            : <button
                className="btn btn-primary"
                disabled={deploying}
                style={{ opacity: deploying ? 0.7 : 1 }}
                onClick={async () => {
                  setDeployErr('');
                  const otherMembers = memberInput.trim().split('\n').map(l => l.trim()).filter(Boolean);

                  // ── Real on-chain deploy ──────────────────────────────────
                  // Works with or without other members pre-listed.
                  // No members = solo deploy (recruiting mode); invite link
                  // lets people join after the fact.
                  if (walletFullAddr && getWalletProvider()) {
                    setDeploying(true);
                    try {
                      const allMembers = otherMembers.length > 0
                        ? [walletFullAddr, ...otherMembers]
                        : [walletFullAddr];
                      const cycleDays = form.cycle === 'weekly' ? 7 : form.cycle === 'biweekly' ? 14 : 30;
                      const result = await txCreatePool(walletFullAddr, allMembers, form.contribution, cycleDays);
                      onCreated(form, result.poolPubkey, result.vaultPubkey);
                    } catch (err: unknown) {
                      setDeployErr(err instanceof Error ? err.message : 'Deploy failed. Check your wallet and try again.');
                      setDeploying(false);
                    }
                    return;
                  }

                  // ── Demo path (no wallet connected) ──────────────────────
                  onCreated(form);
                }}
              >
                {deploying
                  ? <><div className="shimmer" style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block' }} /> Deploying…</>
                  : <><Icon name="check" size={13} /> Deploy pool</>}
              </button>}
        </div>
      </div>
    </div>
  );
}
