use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::pool::{Pool, PoolStatus};
use crate::state::member::MemberReputation;
use crate::errors::AjoError;

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
        mut,
        constraint = pool.status == PoolStatus::Active @ AjoError::PoolNotActive,
    )]
    pub pool: Account<'info, Pool>,

    // Member's USDC token account (source)
    #[account(
        mut,
        token::mint = pool.usdc_mint,
        token::authority = member,
    )]
    pub member_token_account: Account<'info, TokenAccount>,

    // Pool vault (destination)
    #[account(
        mut,
        address = pool.pool_vault,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    // Member's reputation account (init if first interaction)
    #[account(
        init_if_needed,
        payer = member,
        space = MemberReputation::LEN,
        seeds = [b"member", member.key().as_ref()],
        bump,
    )]
    pub member_reputation: Account<'info, MemberReputation>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Contribute>) -> Result<()> {
    let pool_key = ctx.accounts.pool.key();
    let pool = &mut ctx.accounts.pool;
    let member_key = ctx.accounts.member.key();

    // Find member index in pool
    let member_idx = pool
        .members
        .iter()
        .position(|&m| m == member_key)
        .ok_or(AjoError::NotAMember)? as u32;

    require!(
        !pool.contributions_this_round[member_idx as usize],
        AjoError::AlreadyContributed
    );

    // Transfer USDC from member to pool vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.member_token_account.to_account_info(),
        to: ctx.accounts.pool_vault.to_account_info(),
        authority: ctx.accounts.member.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
    token::transfer(cpi_ctx, pool.contribution_amount)?;

    // Mark as contributed
    pool.contributions_this_round[member_idx as usize] = true;

    // Update reputation
    let rep = &mut ctx.accounts.member_reputation;
    if rep.wallet == Pubkey::default() {
        rep.wallet = member_key;
        rep.bump = ctx.bumps.member_reputation;
    }
    rep.total_contributed = rep.total_contributed.saturating_add(pool.contribution_amount);

    emit!(MemberContributed {
        pool: pool_key,
        member: member_key,
        round: pool.current_round,
        amount: pool.contribution_amount,
    });

    Ok(())
}

#[event]
pub struct MemberContributed {
    pub pool: Pubkey,
    pub member: Pubkey,
    pub round: u32,
    pub amount: u64,
}
