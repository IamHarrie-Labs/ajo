use anchor_lang::prelude::*;
use crate::state::pool::MAX_MEMBERS;

#[account]
pub struct VotingRecord {
    pub pool: Pubkey,
    pub target_member: Pubkey,
    pub round: u32,
    pub voters: Vec<Pubkey>,
    pub vote_count: u32,
    pub threshold: u32,     // members.len() / 2 + 1 (simple majority)
    pub executed: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl VotingRecord {
    pub const LEN: usize = 8
        + 32                        // pool
        + 32                        // target_member
        + 4                         // round
        + (4 + MAX_MEMBERS * 32)    // voters vec
        + 4                         // vote_count
        + 4                         // threshold
        + 1                         // executed
        + 8                         // created_at
        + 1;                        // bump
}
