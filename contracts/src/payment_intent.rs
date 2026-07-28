#![no_std]
extern crate alloc;

use alloc::format;
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map, Symbol};

#[contract]
pub struct PaymentIntentContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentIntent {
    pub id: Symbol,
    pub amount: i128,
    pub asset: Symbol,
    pub sender: Address,
    pub recipient: Address,
    pub expiration: u64,
}

#[contractimpl]
impl PaymentIntentContract {
    pub fn create_intent(env: Env, from: Address, to: Address, amount: i128) -> Symbol {
        from.require_auth();

        assert!(amount > 0, "amount must be positive");

        let storage = env.storage().instance();
        let counter_key = symbol_short!("next_id");
        let next_id: u64 = storage.get(&counter_key).unwrap_or(0u64);
        let intent_id = Symbol::new(&env, &format!("intent_{}", next_id));

        let intent = PaymentIntent {
            id: intent_id.clone(),
            amount,
            asset: Symbol::new(&env, "XLM"),
            sender: from.clone(),
            recipient: to.clone(),
            expiration: env.ledger().timestamp() + 86400,
        };

        let intents_key = symbol_short!("intents");
        let mut intents: Map<Symbol, PaymentIntent> =
            storage.get(&intents_key).unwrap_or_else(|| Map::new(&env));
        intents.set(intent_id.clone(), intent);
        storage.set(&intents_key, &intents);
        storage.set(&counter_key, &(next_id + 1));

        env.events().publish(
            (symbol_short!("payment_intent"), intent_id.clone()),
            (from, to, amount),
        );

        intent_id
    }

    pub fn capture_payment(env: Env, intent_id: Symbol) {
        // TODO: Implement payment capture logic
        let _ = (env, intent_id);
    }
}
