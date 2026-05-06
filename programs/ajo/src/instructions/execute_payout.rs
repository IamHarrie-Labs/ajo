use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::pool::{Pool, PoolStatus};
use crate::state::member::MemberReputation;
use crate::errors::AjoError;

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    // Anyone can call this — program verifies correctness
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        constraint = pool.status == PoolStatus::Active @ AjoError::PoolNotActive,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        address = pool.pool_vault,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    // Must be the current recipient's token account (verified below)
    #[account(
        mut,
        token::mint = pool.usdc_mint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = caller,
        space = MemberReputation::LEN,
        seeds = [b"member", pool.members[pool.current_recipient_idx as usize].as_ref()],
        bump,
    )]
    pub recipient_reputation: Account<'info, MemberReputation>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<ExecutePayout>) -> Result<()> {
    // ── Read all needed values before any mutable borrows ──
    let all_contributed = ctx.accounts.pool.members.iter().enumerate().all(|(i, member)| {
        ctx.accounts.pool.defaulted_members.contains(member)
            || ctx.accounts.pool.contributions_this_round[i]
    });
    require!(all_contributed, AjoError::NotAllContributed);

    let expected_recipient = ctx.accounts.pool.members[ctx.accounts.pool.current_recipient_idx as usize];
    require!(
        ctx.accounts.recipient_token_account.owner == expected_recipient,
        AjoError::RecipientMismatch
    );

    let active_members = ctx.accounts.pool.members
        .iter()
        .filter(|m| !ctx.accounts.pool.defaulted_members.contains(m))
        .count() as u64;
    let payout_amount = ctx.accounts.pool.contribution_amount * active_members;
    let member_count = ctx.accounts.pool.members.len();
    let current_round = ctx.accounts.pool.current_round;

    let pool_id_bytes = ctx.accounts.pool.pool_id.to_le_bytes();
    let creator = ctx.accounts.pool.creator;
    let bump = ctx.accounts.pool.bump;

    // ── CPI: transfer from vault to recipient ──
    let seeds = &[b"pool".as_ref(), creator.as_ref(), &pool_id_bytes, &[bump]];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.pool_vault.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.pool.to_account_info(),
    };
    token::transfer(
        CpiContext::new_with_signer(ctx.accounts.token_program.key(), cpi_accounts, signer_seeds),
        payout_amount,
    )?;

    // ── Update recipient reputation ──
    let rep = &mut ctx.accounts.recipient_reputation;
    if rep.wallet == Pubkey::default() {
        rep.wallet = expected_recipient;
        rep.bump = ctx.bumps.recipient_reputation;
    }
    rep.pools_joined = rep.pools_joined.saturating_add(1);

    // ── Advance pool state ──
    let pool = &mut ctx.accounts.pool;
    pool.current_recipient_idx = (pool.current_recipient_idx + 1) % member_count as u32;
    pool.current_round = current_round + 1;
    pool.contributions_this_round = vec![false; member_count];

    if pool.current_round as usize >= member_count {
        pool.status = PoolStatus::Completed;
        rep.pools_completed += 1;
    }

    emit!(PayoutExecuted {
        pool: ctx.accounts.pool.key(),
        recipient: expected_recipient,
        round: current_round,
        amount: payout_amount,
    });

    Ok(())
}

#[event]
pub struct PayoutExecuted {
    pub pool: Pubkey,
    pub recipient: Pubkey,
    pub round: u32,
    pub amount: u64,
}
