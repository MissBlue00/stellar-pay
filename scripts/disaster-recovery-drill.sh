#!/usr/bin/env bash
# Simulated disaster recovery drill (dry run — no production changes)
# Usage: bash scripts/disaster-recovery-drill.sh [API_BASE_URL]
# Example: bash scripts/disaster-recovery-drill.sh http://localhost:3000

set -euo pipefail

API_BASE_URL="${1:-http://localhost:3000}"

phase() {
  echo ""
  echo "=== $1 ==="
}

echo "Stellar Pay — simulated disaster recovery drill (dry run)"
echo "Time (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

phase "Phase 0 — Preconditions"
echo "- Confirm incident commander and comms owner are assigned."
echo "- Open docs/disaster-recovery.md and the relevant runbook section."

phase "Phase 1 — Assess"
echo "- Verify scope: region, database, Redis, or application-only."
echo "- Capture current error rates and last successful deploy from monitoring."

phase "Phase 2 — Stabilize (if applicable)"
echo "- Optional: enable maintenance mode or reduce traffic per policy."
echo "- Ensure no destructive migrations run until recovery path is chosen."

phase "Phase 3 — Database recovery path (tabletop)"
echo "- Choose: snapshot restore vs PITR vs cross-region replica promotion."
echo "- Document target recovery timestamp (UTC) if using PITR."

phase "Phase 4 — Validate target environment"
echo "- After restore or promotion: run migrations if needed, then smoke tests."

phase "Phase 5 — Optional API health check"
HEALTH_URL="${API_BASE_URL%/}/health"
echo "GET ${HEALTH_URL}"
if command -v curl >/dev/null 2>&1; then
  if curl -sfS --max-time 10 "${HEALTH_URL}" >/dev/null; then
    echo "HTTP OK — health endpoint reachable."
  else
    echo "Health check failed or API not running (expected in many dev setups)." >&2
  fi
else
  echo "curl not found; skipping HTTP check."
fi

phase "Phase 6 — Post-incident"
echo "- Record timeline, root cause, and action items."
echo "- Update this drill date in your internal DR calendar."

echo ""
echo "Drill complete (simulation only — no infrastructure was modified)."
