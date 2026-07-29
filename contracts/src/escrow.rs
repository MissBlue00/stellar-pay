#![no_std]
extern crate alloc;

use alloc::format;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token::TokenClient, Address, Env, Map,
    Symbol,
};

#[contract]
pub struct EscrowContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    FUNDED,
    RELEASED,
    REFUNDED,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: Symbol,
    pub depositor: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: i128,
    pub released: i128,
    pub milestone_count: u32,
    pub milestones_released: u32,
    pub expiration: u64,
    pub status: EscrowStatus,
}

#[contractimpl]
impl EscrowContract {
    pub fn deposit(
        env: Env,
        from: Address,
        to: Address,
        token: Address,
        amount: i128,
        milestone_count: u32,
        expiration: u64,
    ) -> Symbol {
        from.require_auth();

        assert!(amount > 0, "amount must be positive");
        assert!(milestone_count > 0, "milestone_count must be positive");
        assert!(
            expiration > env.ledger().timestamp(),
            "expiration must be in the future"
        );

        let storage = env.storage().instance();
        let counter_key = symbol_short!("next_id");
        let next_id: u64 = storage.get(&counter_key).unwrap_or(0u64);
        let escrow_id = Symbol::new(&env, &format!("escrow_{}", next_id));

        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        let escrow = Escrow {
            id: escrow_id.clone(),
            depositor: from.clone(),
            recipient: to.clone(),
            token,
            amount,
            released: 0,
            milestone_count,
            milestones_released: 0,
            expiration,
            status: EscrowStatus::FUNDED,
        };

        let escrows_key = symbol_short!("escrows");
        let mut escrows: Map<Symbol, Escrow> =
            storage.get(&escrows_key).unwrap_or_else(|| Map::new(&env));
        escrows.set(escrow_id.clone(), escrow);
        storage.set(&escrows_key, &escrows);
        storage.set(&counter_key, &(next_id + 1));

        env.events().publish(
            (symbol_short!("deposit"), escrow_id.clone()),
            (from, to, amount, milestone_count, expiration),
        );

        escrow_id
    }

    pub fn release(env: Env, escrow_id: Symbol) {
        let storage = env.storage().instance();
        let escrows_key = symbol_short!("escrows");
        let mut escrows: Map<Symbol, Escrow> = storage
            .get(&escrows_key)
            .unwrap_or_else(|| Map::new(&env));

        let mut escrow = escrows.get(escrow_id.clone()).expect("escrow not found");

        assert_eq!(escrow.status, EscrowStatus::FUNDED, "escrow is not funded");
        assert!(
            escrow.milestones_released < escrow.milestone_count,
            "all milestones already released"
        );

        let amount_per_milestone = escrow.amount / escrow.milestone_count as i128;
        let release_amount = if escrow.milestones_released + 1 == escrow.milestone_count {
            escrow.amount - escrow.released
        } else {
            amount_per_milestone
        };

        let token_client = TokenClient::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.recipient,
            &release_amount,
        );

        escrow.released += release_amount;
        escrow.milestones_released += 1;

        if escrow.milestones_released == escrow.milestone_count {
            escrow.status = EscrowStatus::RELEASED;
        }

        let recipient = escrow.recipient.clone();
        let milestones_released = escrow.milestones_released;
        escrows.set(escrow_id.clone(), escrow);
        storage.set(&escrows_key, &escrows);

        env.events().publish(
            (symbol_short!("release"), escrow_id.clone()),
            (recipient, release_amount, milestones_released),
        );
    }

    pub fn refund(env: Env, escrow_id: Symbol) {
        let storage = env.storage().instance();
        let escrows_key = symbol_short!("escrows");
        let mut escrows: Map<Symbol, Escrow> = storage
            .get(&escrows_key)
            .unwrap_or_else(|| Map::new(&env));

        let mut escrow = escrows.get(escrow_id.clone()).expect("escrow not found");

        assert_eq!(escrow.status, EscrowStatus::FUNDED, "escrow is not refundable");
        assert!(
            env.ledger().timestamp() > escrow.expiration,
            "escrow has not expired yet"
        );

        let remaining = escrow.amount - escrow.released;
        assert!(remaining > 0, "no funds remaining to refund");

        let token_client = TokenClient::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.depositor,
            &remaining,
        );

        let depositor = escrow.depositor.clone();
        escrow.status = EscrowStatus::REFUNDED;
        escrows.set(escrow_id.clone(), escrow);
        storage.set(&escrows_key, &escrows);

        env.events().publish(
            (symbol_short!("refund"), escrow_id.clone()),
            (depositor, remaining),
        );
    }
}
