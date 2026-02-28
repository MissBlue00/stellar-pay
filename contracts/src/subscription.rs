#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address};

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    pub fn subscribe(env: Env, subscriber: Address, plan_id: i128) {
        // TODO: Implement subscription logic
    }

    pub fn cancel(env: Env, subscriber: Address) {
        // TODO: Implement cancellation logic
    }
}
