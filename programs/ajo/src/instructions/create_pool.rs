use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use crate::state::pool::{Pool, PoolStatus, MAX_MEMBERS};
use crate::errors::AjoError;

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = Pool::LEN,
        seeds = [b"pool", creator.key().as_ref(), &pool_id.to_le_bytes()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = pool,
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreatePool>,
    pool_id: u64,
    members: Vec<Pubkey>,
    contribution_amount: u64,
    _duration_days: u32,
) -> Result<()> {
    require!(
        members.len() >= 2 && members.len() <= MAX_MEMBERS,
        AjoError::InvalidMemberCount
    );
    require!(contribution_amount > 0, AjoError::InvalidAmount);

    // Check for duplicate members (O(n²) is fine for n ≤ 10)
    for i in 0..members.len() {
        for j in (i + 1)..members.len() {
            require!(members[i] != members[j], AjoError::DuplicateMembers);
        }
    }

    // Pseudo-random rotation using pool_id + slot
    let clock = Clock::get()?;
    let mut rotation = members.clone();
    let seed = pool_id.wrapping_add(clock.slot);
    for i in (1..rotation.len()).rev() {
        let j = ((seed as usize).wrapping_add(i)) % (i + 1);
        rotation.swap(i, j);
    }

    let member_count = rotation.len();
    let pool = &mut ctx.accounts.pool;
    pool.pool_id = pool_id;
    pool.creator = ctx.accounts.creator.key();
    pool.members = rotation;
    pool.contribution_amount = contribution_amount;
    pool.current_round = 0;
    pool.current_recipient_idx = 0;
    pool.pool_vault = ctx.accounts.pool_vault.key();
    pool.created_at = clock.unix_timestamp;
    pool.status = PoolStatus::Active;
    pool.usdc_mint = ctx.accounts.usdc_mint.key();
    pool.contributions_this_round = vec![false; member_count];
    pool.defaulted_members = Vec::new();
    pool.slashed_amount = 0;
    pool.bump = ctx.bumps.pool;

    emit!(PoolCreated {
        pool: ctx.accounts.pool.key(),
        creator: ctx.accounts.creator.key(),
        member_count: member_count as u32,
        contribution_amount,
    });

    Ok(())
}

#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub creator: Pubkey,
    pub member_count: u32,
    pub contribution_amount: u64,
}
