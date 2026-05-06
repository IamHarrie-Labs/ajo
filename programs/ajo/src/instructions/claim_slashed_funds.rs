use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::pool::{Pool, PoolStatus};
use crate::errors::AjoError;

// Separate account to track per-pool per-member claims to prevent double claiming
#[account]
pub struct ClaimRecord {
    pub pool: Pubkey,
    pub claimant: Pubkey,
    pub claimed: bool,
    pub bump: u8,
}

impl ClaimRecord {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1;
}

#[derive(Accounts)]
pub struct ClaimSlashedFunds<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    #[account(
        mut,
        constraint = pool.status == PoolStatus::Completed || pool.slashed_amount > 0 @ AjoError::NoSlashedFunds,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        address = pool.pool_vault,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = pool.usdc_mint,
        token::authority = claimant,
    )]
    pub claimant_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = claimant,
        space = ClaimRecord::LEN,
        seeds = [b"claim", pool.key().as_ref(), claimant.key().as_ref()],
        bump,
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<ClaimSlashedFunds>) -> Result<()> {
    let pool = &ctx.accounts.pool;
    let claimant_key = ctx.accounts.claimant.key();

    // Claimant must be a non-defaulted member
    require!(pool.members.contains(&claimant_key), AjoError::NotAMember);
    require!(
        !pool.defaulted_members.contains(&claimant_key),
        AjoError::NoSlashedFunds
    );
    require!(pool.slashed_amount > 0, AjoError::NoSlashedFunds);

    // Calculate share: slashed_amount divided equally among non-defaulted members
    let eligible_count = pool
        .members
        .iter()
        .filter(|m| !pool.defaulted_members.contains(m))
        .count() as u64;
    let share = pool.slashed_amount / eligible_count;
    require!(share > 0, AjoError::NoSlashedFunds);

    // Transfer share to claimant
    let pool_id_bytes = pool.pool_id.to_le_bytes();
    let creator = pool.creator;
    let bump = pool.bump;
    let seeds = &[
        b"pool".as_ref(),
        creator.as_ref(),
        &pool_id_bytes,
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.pool_vault.to_account_info(),
        to: ctx.accounts.claimant_token_account.to_account_info(),
        authority: ctx.accounts.pool.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, share)?;

    // Record claim (init ensures this can only be called once per claimant per pool)
    let record = &mut ctx.accounts.claim_record;
    record.pool = ctx.accounts.pool.key();
    record.claimant = claimant_key;
    record.claimed = true;
    record.bump = ctx.bumps.claim_record;

    emit!(SlashedFundsClaimed {
        pool: ctx.accounts.pool.key(),
        claimant: claimant_key,
        amount: share,
    });

    Ok(())
}

#[event]
pub struct SlashedFundsClaimed {
    pub pool: Pubkey,
    pub claimant: Pubkey,
    pub amount: u64,
}
