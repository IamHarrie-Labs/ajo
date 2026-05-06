use anchor_lang::prelude::*;
use crate::state::pool::{Pool, PoolStatus};
use crate::state::member::MemberReputation;
use crate::state::voting::VotingRecord;
use crate::errors::AjoError;

#[derive(Accounts)]
#[instruction(target_member: Pubkey)]
pub struct VoteSlash<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        constraint = pool.status == PoolStatus::Active @ AjoError::PoolNotActive,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init_if_needed,
        payer = voter,
        space = VotingRecord::LEN,
        seeds = [b"vote", pool.key().as_ref(), target_member.as_ref(), &pool.current_round.to_le_bytes()],
        bump,
    )]
    pub voting_record: Account<'info, VotingRecord>,

    #[account(
        init_if_needed,
        payer = voter,
        space = MemberReputation::LEN,
        seeds = [b"member", target_member.as_ref()],
        bump,
    )]
    pub target_reputation: Account<'info, MemberReputation>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<VoteSlash>, target_member: Pubkey) -> Result<()> {
    let voter_key = ctx.accounts.voter.key();
    let current_round = ctx.accounts.pool.current_round;
    let pool_key = ctx.accounts.pool.key();

    // ── Validate ──
    require!(ctx.accounts.pool.members.contains(&voter_key), AjoError::NotAMember);
    require!(ctx.accounts.pool.members.contains(&target_member), AjoError::NotAMember);

    let target_idx = ctx.accounts.pool.members
        .iter()
        .position(|&m| m == target_member)
        .unwrap();
    let threshold = (ctx.accounts.pool.members.len() / 2 + 1) as u32;

    // ── Initialize voting record if new ──
    {
        let record = &mut ctx.accounts.voting_record;
        if record.pool == Pubkey::default() {
            record.pool = pool_key;
            record.target_member = target_member;
            record.round = current_round;
            record.voters = Vec::new();
            record.vote_count = 0;
            record.threshold = threshold;
            record.executed = false;
            record.created_at = Clock::get()?.unix_timestamp;
            record.bump = ctx.bumps.voting_record;
        }

        require!(!record.executed, AjoError::VoteAlreadyExecuted);
        require!(!record.voters.contains(&voter_key), AjoError::AlreadyVoted);

        record.voters.push(voter_key);
        record.vote_count += 1;
    }

    let vote_count = ctx.accounts.voting_record.vote_count;
    let threshold_reached = vote_count >= threshold;

    emit!(VoteCast {
        pool: pool_key,
        voter: voter_key,
        target: target_member,
        round: current_round,
        current_votes: vote_count,
        threshold,
    });

    // ── Execute slash if threshold reached ──
    if threshold_reached && !ctx.accounts.voting_record.executed {
        ctx.accounts.voting_record.executed = true;

        // Mark as defaulted and allow round to advance
        let pool = &mut ctx.accounts.pool;
        if !pool.defaulted_members.contains(&target_member) {
            pool.defaulted_members.push(target_member);
            pool.slashed_amount = pool.slashed_amount.saturating_add(pool.contribution_amount);
        }
        pool.contributions_this_round[target_idx] = true;

        // Update target reputation
        let rep = &mut ctx.accounts.target_reputation;
        if rep.wallet == Pubkey::default() {
            rep.wallet = target_member;
            rep.bump = ctx.bumps.target_reputation;
        }
        rep.defaults += 1;

        emit!(MemberSlashed {
            pool: pool_key,
            target: target_member,
            round: current_round,
            vote_count,
        });
    }

    Ok(())
}

#[event]
pub struct VoteCast {
    pub pool: Pubkey,
    pub voter: Pubkey,
    pub target: Pubkey,
    pub round: u32,
    pub current_votes: u32,
    pub threshold: u32,
}

#[event]
pub struct MemberSlashed {
    pub pool: Pubkey,
    pub target: Pubkey,
    pub round: u32,
    pub vote_count: u32,
}
