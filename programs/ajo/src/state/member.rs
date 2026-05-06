use anchor_lang::prelude::*;

#[account]
pub struct MemberReputation {
    pub wallet: Pubkey,
    pub pools_joined: u32,
    pub pools_completed: u32,
    pub defaults: u32,
    pub total_contributed: u64,
    pub bump: u8,
}

impl MemberReputation {
    pub const LEN: usize = 8 + 32 + 4 + 4 + 4 + 8 + 1;

    pub fn reputation_score(&self) -> i32 {
        let completed = self.pools_completed as i32;
        let defaults = self.defaults as i32;
        (completed * 10) - (defaults * 25)
    }
}
