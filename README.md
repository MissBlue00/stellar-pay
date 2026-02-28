# StellarPay Rails

**StellarPay Rails exists to make real-world payments on Stellar easy to build, easy to integrate, and easy to trust.**

---

## The Manifesto

### Purpose

We are building payment infrastructure, not a demo, not a wallet, and not a single application. Our goal is to provide a dependable foundation that developers, businesses, and institutions can confidently build on for years.

### The Problem We Are Solving

Building production-grade payment systems on blockchain today is unnecessarily hard. Teams are forced to re-implement:

- Payment abstractions & transaction reconciliation
- Anchor integrations & compliance workflows
- Subscription logic & escrow
- Admin tooling & audit trails

StellarPay Rails exists to eliminate that friction.

### Our Vision

We are building an **easy-to-use, easy-to-integrate payment gateway for Stellar** with:

- Secure, dynamic **on-chain and off-chain callback compatibility**
- Clear separation between **payment logic, compliance, and presentation**
- First-class support for **real-world financial workflows**
- Infrastructure that scales from MVPs to regulated production systems

---

## Core Principles

1. **Infrastructure Over Applications**: We build **rails**, not trains. Designed to be embedded, not to replace.
2. **Simplicity Is a Feature**: Interfaces must be easy to understand, integrate, and hard to misuse.
3. **Explicit Over Implicit**: Payments are too important for magic. Explicit states, clear transitions.
4. **Hybrid Model**: On-chain for value transfer and settlement; off-chain for coordination and retries.
5. **Secure by Default**: No private keys stored by default. Isolated sensitive operations. Signed webhooks.
6. **Compliance as a First-Class Concern**: Modular, configurable, and never ignored.
7. **Developer Experience (DX)**: Clear APIs, stable SDKs, strong typing, and high-quality docs.

---

## Tech Stack & Engineering Standards

To ensure "infrastructure-grade" reliability, we use industry-standard tooling and strict enforcement.

### The Core Stack

- **Smart Contracts**: [Soroban SDK](https://soroban.stellar.org/) (Rust). For secure, on-chain payment logic.
- **Monorepo**: [pnpm](https://pnpm.io/) + [Turborepo](https://turbo.build/) for fast, cached builds and modular scaling.
- **Backend API**: [NestJS](https://nestjs.com/) (Node.js 20+ / TypeScript). Chosen for its opinionated, enterprise-grade architecture.
- **Frontend Dashboard**: [Next.js 15](https://nextjs.org/) (App Router) + [Tailwind CSS]. For a modern, high-performance admin interface.
- **Package Bundling**: [tsup](https://tsup.egoist.dev/) for high-performance TS library bundling (ESM + CJS).

### Strict Enforcement (CI/CD)

No code reaches `main` unless it passes our automated quality gates:

- **Type Safety**: Strict TypeScript across all apps and packages.
- **Linting & Formatting**: [ESLint 10+](https://eslint.org/) (Flat Config) + [Prettier].
- **Pre-commit Hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged] enforce quality before every commit.
- **Automated CI**: GitHub Actions runs a full `Install -> Lint -> Typecheck -> Build -> Test` pipeline on every PR.

---

## Project Structure

```text
stellar-pay/
├── apps/
│   ├── api/                 # NestJS Backend API
│   └── admin-dashboard/     # Next.js Frontend
├── contracts/               # Soroban Smart Contracts (Rust)
│   ├── src/
│   │   ├── escrow.rs        # Escrow & Conditional payments
│   │   ├── subscription.rs  # Recurring payment logic
│   │   └── payment_intent.rs # On-chain payment state management
│   └── Cargo.toml
├── packages/
│   ├── payments-engine/     # Core logic & Stellar transaction abstraction
│   ├── anchor-service/      # SEP-24 & Asset handling
│   ├── compliance-engine/   # KYC & Transaction Monitoring hooks
│   ├── subscriptions/       # Recurring payments logic
│   ├── escrow/              # Conditional payment primitives
│   └── sdk-js/              # Official TypeScript SDK
├── docs/                    # Architecture, security, and roadmap
└── .github/                 # CI/CD workflows & Issue/PR templates
```

---

## Roadmap

- **Phase 1**: Core Payments Engine + NestJS API Scaffolding.
- **Phase 2**: Stellar Transaction Abstraction & SDK (v1).
- **Phase 3**: Anchor Integration (SEP-24) & Compliance Hooks.
- **Phase 4**: Admin Dashboard & Event/Webhook Streaming.

---

## Contributing

We believe critical financial infrastructure should be inspectable and community-driven. See [CONTRIBUTING.md](CONTRIBUTING.md) for our standards, labeling system, and how to get started.

## License

StellarPay Rails is open-source software licensed under the [Apache 2.0 License](LICENSE).
