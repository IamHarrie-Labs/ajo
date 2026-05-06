use anchor_lang::prelude::*;

#[error_code]
pub enum AjoError {
    #[msg("Pool must have between 2 and 10 members")]
    InvalidMemberCount,
    #[msg("Contribution amount must be greater than zero")]
    InvalidAmount,
    #[msg("Caller is not a member of this pool")]
    NotAMember,
    #[msg("Member has already contributed this round")]
    AlreadyContributed,
    #[msg("Not all members have contributed yet")]
    NotAllContributed,
    #[msg("Pool is not active")]
    PoolNotActive,
    #[msg("Pool is already complete")]
    PoolComplete,
    #[msg("Duplicate members not allowed")]
    DuplicateMembers,
    #[msg("Already voted in this round")]
    AlreadyVoted,
    #[msg("Voting already executed")]
    VoteAlreadyExecuted,
    #[msg("Slashing threshold not reached")]
    ThresholdNotMet,
    #[msg("No slashed funds to claim")]
    NoSlashedFunds,
    #[msg("Funds already claimed")]
    AlreadyClaimed,
    #[msg("Wrong round for this vote")]
    WrongRound,
    #[msg("Recipient mismatch")]
    RecipientMismatch,
}
