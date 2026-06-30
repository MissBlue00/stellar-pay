# Stellar Pay Operations Runbook

This runbook covers common production operations for the Stellar Pay API and
worker stack. Replace namespace, deployment, registry, and database identifiers
with the values used by the target environment before running commands.

## Quick Reference

| Item | Default |
| --- | --- |
| Kubernetes namespace | `stellar-pay` |
| API deployment | `deployment/stellarpay-api` |
| API container | `api` |
| Health endpoint | `GET /health` |
| Production health URL | `https://api.stellarpay.io/health` |
| Image registry | `ghcr.io/<owner>/<repo>` |

## Safety Checklist

Before changing production:

1. Confirm the active incident or change ticket.
2. Identify the operator, reviewer, and incident commander when applicable.
3. Capture current state:

```bash
kubectl get deploy,rs,pods,svc,ingress -n stellar-pay
kubectl get events -n stellar-pay --sort-by=.lastTimestamp | tail -50
curl -fsS https://api.stellarpay.io/health
```

4. Confirm the last known-good image tag or Git SHA.
5. Avoid destructive database operations until backups are verified.

## Restarting Services

### Restart API Pods

Use a rolling restart when configuration, secrets, or transient pod state needs
to be refreshed without changing the image.

```bash
kubectl rollout restart deployment/stellarpay-api -n stellar-pay
kubectl rollout status deployment/stellarpay-api -n stellar-pay --timeout=5m
curl -fsS https://api.stellarpay.io/health
```

### Restart a Single Pod

Delete an unhealthy pod and let the Deployment recreate it.

```bash
kubectl get pods -n stellar-pay -l app=stellarpay-api
kubectl delete pod <pod-name> -n stellar-pay
kubectl rollout status deployment/stellarpay-api -n stellar-pay --timeout=5m
```

## Scaling

### Manual Scale

Increase replicas during traffic spikes or reduce them after the event.

```bash
kubectl scale deployment/stellarpay-api --replicas=5 -n stellar-pay
kubectl rollout status deployment/stellarpay-api -n stellar-pay --timeout=5m
kubectl get pods -n stellar-pay -l app=stellarpay-api
```

### Autoscaling

If HorizontalPodAutoscaler is enabled, inspect or update its settings instead
of repeatedly changing the Deployment replica count by hand.

```bash
kubectl get hpa -n stellar-pay
kubectl describe hpa stellarpay-api -n stellar-pay
kubectl top pods -n stellar-pay
```

## Rollback

### Roll Back the Kubernetes Deployment

Use this when a recently deployed image causes API errors or failed health
checks.

```bash
kubectl rollout history deployment/stellarpay-api -n stellar-pay
kubectl rollout undo deployment/stellarpay-api -n stellar-pay
kubectl rollout status deployment/stellarpay-api -n stellar-pay --timeout=5m
curl -fsS https://api.stellarpay.io/health
```

To roll back to a specific revision:

```bash
kubectl rollout undo deployment/stellarpay-api -n stellar-pay --to-revision=<revision>
```

### Blue-Green Rollback

The repository includes a `Blue-Green Deployment` GitHub Actions workflow with a
manual rollback path. Trigger the workflow with `rollback=true` when the
previous environment is known to be healthy.

After rollback:

```bash
curl -fsS https://api.stellarpay.io/health
kubectl logs -n stellar-pay -l app=stellarpay-api --tail=200
```

## Database Backup and Restore

### Logical Backup

Use a logical dump before risky migrations or scheduled maintenance.

```bash
export BACKUP_FILE="stellar-pay-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE"
```

Store the backup in encrypted object storage with retention matching the
environment policy.

### Logical Restore

Restore into a new database first. Do not overwrite the current production
writer until validation is complete.

```bash
createdb "$RESTORE_DATABASE_URL"
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists "$BACKUP_FILE"
```

Validate before cutover:

```bash
psql "$RESTORE_DATABASE_URL" -c "select now();"
psql "$RESTORE_DATABASE_URL" -c "select count(*) from merchants;"
```

### Point-in-Time Recovery

For managed PostgreSQL, restore to a new instance at the selected UTC recovery
timestamp, then update `DATABASE_URL` only after validation. See
`docs/disaster-recovery.md` for detailed PITR and cross-region failover
procedures.

## Redis Backup and Restore

Redis may contain cache, rate-limit, session, or queue state depending on the
deployment. Confirm the production Redis role before flushing or replacing it.

Common checks:

```bash
redis-cli -u "$REDIS_URL" ping
redis-cli -u "$REDIS_URL" info memory
redis-cli -u "$REDIS_URL" dbsize
```

If Redis is cache-only and unavailable, restore service by failing over to a
replica or starting a fresh instance, then monitor cache misses and login
behavior.

## Log Inspection

### Kubernetes Logs

```bash
kubectl logs -n stellar-pay -l app=stellarpay-api --tail=200
kubectl logs -n stellar-pay -l app=stellarpay-api --since=30m
kubectl logs -n stellar-pay -l app=stellarpay-api -f
```

### Deployment and Pod Events

```bash
kubectl describe deployment/stellarpay-api -n stellar-pay
kubectl describe pod <pod-name> -n stellar-pay
kubectl get events -n stellar-pay --sort-by=.lastTimestamp | tail -100
```

### Local or Docker Compose Logs

```bash
docker compose logs -f api
docker compose logs --tail=200 api
```

## Incident Response Checklist

### 1. Triage

- Assign incident commander, operations owner, and communications owner.
- Record start time, affected environment, symptoms, and customer impact.
- Check health:

```bash
curl -i https://api.stellarpay.io/health
kubectl get pods -n stellar-pay -l app=stellarpay-api
kubectl top pods -n stellar-pay
```

### 2. Stabilize

- Roll back the last bad deploy if the incident started after a release.
- Scale API replicas if CPU or memory saturation is visible.
- Pause destructive migrations or batch jobs until the failure mode is known.
- Preserve logs and metrics before restarting components.

### 3. Diagnose

- Compare failing and healthy pods.
- Check database and Redis connectivity from the cluster.
- Review recent configuration, secret, and image changes.
- Confirm Stellar Horizon or RPC availability before retrying settlement flows.

### 4. Recover

- Apply the smallest safe recovery action: restart, scale, rollback, restore, or
  failover.
- Run health checks and at least one application smoke test.
- Watch error rate, latency, queue depth, and webhook delivery after recovery.

### 5. Communicate and Close

- Post status updates at the agreed incident cadence.
- Document customer impact, root cause, timeline, and action items.
- Link follow-up issues for code, infrastructure, or process fixes.

## Related Documents

- `docs/deployment.md` for environment variables, Docker, Kubernetes, and
  production deployment examples.
- `docs/disaster-recovery.md` for backup strategy, PITR, cross-region failover,
  and disaster recovery drills.
- `apps/api/docs/api.md` for API endpoint behavior and health response payloads.
