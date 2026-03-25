# Disaster recovery — Stellar Pay payment gateway

This document defines backup and restore procedures, operational runbooks for common failures, database point-in-time recovery (PITR), and cross-region replication patterns for the payment gateway. It is written for operators and incident commanders. Replace placeholder values (regions, ARNs, contact lists) with your production configuration.

## 1. Objectives and scope

| Objective | Typical target (set per environment) |
|-----------|--------------------------------------|
| **RPO** (Recovery Point Objective) | Minutes for transactional data if PITR is enabled; align with business and regulatory requirements. |
| **RTO** (Recovery Time Objective) | Time to restore service in a secondary region or from backup; document per tier (API vs database). |

**In scope:** PostgreSQL (application state), Redis (ephemeral/session/rate-limit state), API and worker compute, secrets, webhook delivery state, treasury and Stellar-related configuration.

**Out of scope (by design):** The Stellar public ledger is the canonical source for on-chain settlement. Recovery focuses on **your** databases, caches, and application tier. On-chain history is verified via Horizon and Soroban RPC.

## 2. Backup procedures

### 2.1 PostgreSQL (primary system of record)

Use one or more of the following, depending on hosting:

| Method | When to use | Notes |
|--------|-------------|--------|
| **Automated snapshots** | Managed Postgres (RDS, Cloud SQL, Azure Database, etc.) | Enable retention policy; encrypt at rest; tag snapshots by environment. |
| **Logical dumps** (`pg_dump`) | Portable exports, smaller environments, schema migrations | Schedule off-peak; store encrypted objects in object storage with versioning. |
| **Physical base backup + WAL** | Self-managed Postgres, strict RPO | Use `pg_basebackup` plus continuous archiving (WAL) to object storage for PITR (see section 4). |

**Minimum practice:**

1. **Daily** full or incremental snapshot (managed) or logical dump to immutable storage.
2. **Retain** backups per compliance (e.g. 7–35 days online, longer in cold storage).
3. **Test restores** at least quarterly to a non-production cluster.
4. **Protect** backup credentials; separate from production DB credentials.

**Connection string:** Application uses `DATABASE_URL` (see `apps/api/.env.example`). Document the actual endpoint and database name in your internal runbook inventory (not in this repo).

### 2.2 Redis

Redis often holds **non-authoritative** data (sessions, throttles, caches). Treat as rebuildable unless you store payment-critical queues only in Redis.

| Method | Notes |
|--------|--------|
| **RDB snapshots / AOF** | Enable per Redis vendor guidance; replicate to a standby for faster failover. |
| **Cross-AZ replica** | Reduces blast radius of AZ failure. |

If Redis loss is acceptable at RPO=0 for cache only, document **cold start**: empty cache, users may need to re-authenticate; replay idempotent webhooks from your DB if applicable.

### 2.3 Secrets and configuration

| Asset | Backup approach |
|-------|-----------------|
| JWT signing keys (`JWT_SECRET`) | Store in KMS/Secrets Manager; rotation procedure in section 5. |
| Treasury and Stellar config | Version-controlled infra-as-code where safe; never commit private keys. |
| Webhook signing secrets | Same as above; rotate if compromise suspected. |

### 2.4 Application artifacts

- **Container images:** Immutable tags in a registry; reproducible builds from CI.
- **Infrastructure:** Terraform/Pulumi/Kubernetes manifests in Git with reviewed changes.

## 3. Restore procedures

### 3.1 Restore PostgreSQL from snapshot (managed)

1. Create a **new** DB instance from snapshot or PITR restore (section 4) in the target subnet/security group.
2. Run **migrations** if the restored instance is behind the expected schema (use your migration tool against the new endpoint).
3. Update **`DATABASE_URL`** (or equivalent secret) for the API and workers.
4. **Scale down** old writers if promoting a new primary to avoid split-brain (only one writer).
5. Run **smoke tests**: health checks, read/write probe, payment intent creation in staging first.

### 3.2 Restore from logical dump

1. Provision empty Postgres with correct version and extensions.
2. `pg_restore` or `psql` import from encrypted dump.
3. Verify row counts, checksums, or application-level reconciliation reports.
4. Point application to new URL; migrate traffic (blue/green or DNS).

### 3.3 Restore Redis

1. Restore from RDB/AOF if you rely on persistence; otherwise **empty** Redis and let the application repopulate cache.
2. Invalidate any stale rate-limit keys if IP or user identity semantics changed during failover.

### 3.4 Restore API tier

1. Deploy the same **image tag** that passed last successful production deploy (or current known-good).
2. Confirm **environment variables** and secrets match the restored database and Redis endpoints.
3. Gradually shift traffic behind load balancer; watch error rates and latency (see monitoring stack under `monitoring/` if deployed).

## 4. Database point-in-time recovery (PITR)

PITR lets you recover to a **specific timestamp** before a bad migration, accidental delete, or corruption discovery.

### 4.1 Managed PostgreSQL (recommended pattern)

Examples (concepts apply across clouds):

- **AWS RDS / Aurora PostgreSQL:** Enable **automated backups** and set **backup retention**; use **Restore to point in time** or **latest restorable time** from the console/CLI. Create a **new** instance from that restore; validate; then cut over `DATABASE_URL`.
- **Google Cloud SQL:** Enable **point-in-time recovery** with transaction logs; restore to an instance at a chosen timestamp.
- **Azure Database for PostgreSQL:** Use **point-in-time restore** to a new server.

**Operational steps:**

1. Record the **target recovery time (UTC)** agreed with stakeholders (before the incident).
2. Restore to a **new** instance name to avoid overwriting the current primary until validated.
3. Run **application and data validation** (queries, reconciliation with Stellar for recent intents if applicable).
4. If valid, **promote** by updating connection strings and deprovisioning the bad instance only after retention policy allows.

### 4.2 Self-hosted PostgreSQL

1. **Continuous archiving:** Archive WAL segments to durable storage (S3-compatible bucket, etc.).
2. **Base backup:** Periodic `pg_basebackup` (or equivalent) stored alongside WAL path.
3. **Recovery:** Use `recovery_target_time` in `recovery.signal` / `postgresql.auto.conf` (version-dependent) to recover to a timestamp; start Postgres and verify.

Document your exact `postgresql.conf` and recovery steps in internal infrastructure docs; keep this file as the **gateway-level** procedure reference.

### 4.3 Retention and compliance

- Align backup retention with **PCI**, **SOC2**, and local regulations if you process cardholder or sensitive data.
- Encrypt backups **in transit and at rest**.

## 5. Cross-region replication and failover

Cross-region setup reduces risk of a full regional outage affecting both API and database.

### 5.1 Patterns

| Pattern | Description |
|---------|-------------|
| **Read replica in secondary region** | Managed Postgres cross-region read replica; **promote** replica to standalone primary on regional failure (manual or automated per vendor). |
| **Active-passive stack** | Secondary region has warm or cold API tier; DNS or global load balancer points to primary; failover updates DNS/weights to secondary after DB promotion. |
| **Multi-region writes** | Complex; usually avoided for payment state unless you have strong conflict resolution; prefer single primary per shard. |

### 5.2 Configuration checklist (secondary region)

1. **Networking:** VPC peering or private connectivity between regions if required; security groups allow only gateway subnets.
2. **Database:** Create cross-region **read replica** from primary; monitor replication lag (alert if lag exceeds SLO).
3. **Secrets:** Replicate or reference same KMS/Secrets Manager **multi-region keys** where supported, or maintain secondary secrets with rotation procedures.
4. **Application:** Same container image; different `DATABASE_URL` (after promotion), `REDIS_URL`, and possibly Stellar Horizon URL if using region-specific endpoints (usually global).
5. **DNS / traffic:** Health checks on primary; runbook to lower TTL before planned failover; update global load balancer or DNS to secondary.

### 5.3 Failover order (high level)

1. **Confirm** primary region is unrecoverable or meets declared disaster criteria.
2. **Stop** writes to old primary if still partially reachable (avoid split-brain).
3. **Promote** cross-region replica to **writable** primary (vendor-specific steps).
4. **Point** application secrets to new writer endpoint.
5. **Raise** API/worker capacity in secondary region.
6. **Validate** end-to-end payment flow and webhook delivery.
7. **Communicate** status to customers per your incident comms plan.

## 6. Runbooks — common failure scenarios

Use these as checklists during incidents. Assign roles: **IC** (Incident Commander), **Ops**, **Comms**.

### 6.1 API unavailable (5xx or timeout)

| Step | Action |
|------|--------|
| 1 | Check load balancer health, recent deploys, and container restarts. |
| 2 | Verify **database** and **Redis** connectivity from API pods. |
| 3 | Scale replicas horizontally if CPU/memory bound. |
| 4 | Roll back to last known-good image if a bad deploy is suspected. |
| 5 | If region-wide, initiate **section 5.3** failover after DB promotion path is clear. |

### 6.2 Primary database unavailable

| Step | Action |
|------|--------|
| 1 | Confirm outage with cloud provider status and DB metrics (connections, storage, CPU). |
| 2 | If **Multi-AZ** failover is automatic, wait for completion and verify `DATABASE_URL` still points to the writer endpoint. |
| 3 | If unrecoverable, restore from **latest snapshot** or **PITR** (section 3–4) to a new instance; update secrets; validate. |
| 4 | If **cross-region replica** exists, evaluate **promote** (section 5.3). |

### 6.3 Suspected data corruption or bad migration

| Step | Action |
|------|--------|
| 1 | **Freeze** destructive migrations and optional write traffic (maintenance page) if needed. |
| 2 | Identify **last known good time** from monitoring and application logs. |
| 3 | Execute **PITR** to a new instance (section 4); validate data; cut over. |
| 4 | Root-cause analysis; add migration safeguards (expand/contract patterns, backups before DDL). |

### 6.4 Redis unavailable

| Step | Action |
|------|--------|
| 1 | Fail over to replica or restart nodes per Redis operator runbook. |
| 2 | If data loss is acceptable, **empty** Redis and restore service; expect cache miss and possible auth/session effects. |
| 3 | Monitor **rate limits** and **session** behavior; communicate if users must sign in again. |

### 6.5 Stellar network or Horizon degraded

| Step | Action |
|------|--------|
| 1 | Confirm status via public Stellar/Horizon channels. |
| 2 | Switch to **backup Horizon/RPC endpoints** if configured (env vars such as `STELLAR_HORIZON_URL`). |
| 3 | **Queue** or **retry** submissions with idempotency keys; do not double-submit without reconciliation. |
| 4 | Comms: delayed settlement vs platform hard down. |

### 6.6 Treasury or signing key compromise

| Step | Action |
|------|--------|
| 1 | **Rotate** keys in HSM/KMS; revoke old keys per Stellar key rotation procedures. |
| 2 | Update **`TREASURY_WALLET_ADDRESS`** and signing paths only after new keys are funded and tested on testnet first. |
| 3 | Audit **recent on-chain** activity for unauthorized transactions. |
| 4 | Law enforcement / legal per policy if customer funds at risk. |

### 6.7 Webhook delivery backlog or duplicate delivery

| Step | Action |
|------|--------|
| 1 | Inspect **outbox** or job queue in Postgres (if implemented); scale workers. |
| 2 | Use **idempotency keys** so replays are safe. |
| 3 | Alert merchants if prolonged delay per SLA. |

## 7. Testing and simulation

### 7.1 Schedule

- **Quarterly:** Tabletop walkthrough of one runbook (sections 6.x).
- **Annually:** Full restore from backup to a staging environment, or PITR drill to a disposable instance.
- **After major changes:** Re-validate backup coverage when database or region topology changes.

### 7.2 Simulated disaster recovery (automated checklist)

The repository includes a **dry-run** script that walks through a simulated DR timeline and optional local health checks:

- **Windows:** `powershell -File scripts/disaster-recovery-drill.ps1` (or `pwsh` if installed)
- **Linux/macOS:** `bash scripts/disaster-recovery-drill.sh`

These scripts do **not** delete data or failover production systems; they print phases and verification prompts for operators.

## 8. Contacts and references

- **Internal:** Replace with on-call rotation, escalation matrix, and vendor support numbers.
- **External:** Stellar network status and Horizon endpoints as published by the Stellar Development Foundation.
- **Related repo paths:** `apps/api/.env.example` (environment variables), `monitoring/` (observability during and after recovery).

---

*Review this document at least annually and after any production topology change.*
