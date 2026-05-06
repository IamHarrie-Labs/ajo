use anchor_lang::prelude::*;

pub const MAX_MEMBERS: usize = 10;

#[account]
pub struct Pool {
    pub pool_id: u64,
    pub creator: Pubkey,
    pub members: Vec<Pubkey>,           // rotation order (randomized at creation)
    pub contribution_amount: u64,       // USDC base units (6 decimals)
    pub current_round: u32,
    pub current_recipient_idx: u32,
    pub pool_vault: Pubkey,
    pub created_at: i64,
    pub status: PoolStatus,
    pub usdc_mint: Pubkey,
    pub contributions_this_round: Vec<bool>,
    pub defaulted_members: Vec<Pubkey>, // members flagged via vote
    pub slashed_amount: u64,            // total slashed from defaulters
    pub bump: u8,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub enum PoolStatus {
    Active,
    Completed,
    Defaulted,
}

impl Pool {
    // 8 discriminator + fields
    pub const LEN: usize = 8
        + 8                             // pool_id
        + 32                            // creator
        + (4 + MAX_MEMBERS * 32)        // members vec
        + 8                             // contribution_amount
        + 4                             // current_round
        + 4                             // current_recipient_idx
        + 32                            // pool_vault
        + 8                             // created_at
        + 1                             // status enum
        + 32                            // usdc_mint
        + (4 + MAX_MEMBERS * 1)         // contributions_this_round vec
        + (4 + MAX_MEMBERS * 32)        // defaulted_members vec
        + 8                             // slashed_amount
        + 1;                            // bump
}
