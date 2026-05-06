use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4");

#[program]
pub mod ajo {
    use super::*;

    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: u64,
        members: Vec<Pubkey>,
        contribution_amount: u64,
        duration_days: u32,
    ) -> Result<()> {
        instructions::create_pool::handler(ctx, pool_id, members, contribution_amount, duration_days)
    }

    pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
        instructions::contribute::handler(ctx)
    }

    pub fn execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
        instructions::execute_payout::handler(ctx)
    }

    pub fn vote_slash(ctx: Context<VoteSlash>, target_member: Pubkey) -> Result<()> {
        instructions::vote_slash::handler(ctx, target_member)
    }

    pub fn claim_slashed_funds(ctx: Context<ClaimSlashedFunds>) -> Result<()> {
        instructions::claim_slashed_funds::handler(ctx)
    }
}
