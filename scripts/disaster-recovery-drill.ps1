# Simulated disaster recovery drill (dry run - no production changes)
# Usage: powershell -File scripts/disaster-recovery-drill.ps1 [-ApiBaseUrl http://localhost:3000]

param(
    [string]$ApiBaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'

function Write-Phase {
    param([string]$Name)
    Write-Host ''
    Write-Host "=== $Name ===" -ForegroundColor Cyan
}

Write-Host 'Stellar Pay - simulated disaster recovery drill (dry run)' -ForegroundColor Green
Write-Host "Time (UTC): $([datetime]::UtcNow.ToString('o'))"

Write-Phase 'Phase 0 - Preconditions'
Write-Host '- Confirm incident commander and comms owner are assigned.'
Write-Host '- Open docs/disaster-recovery.md and the relevant runbook section.'

Write-Phase 'Phase 1 - Assess'
Write-Host '- Verify scope: region, database, Redis, or application-only.'
Write-Host '- Capture current error rates and last successful deploy from monitoring.'

Write-Phase 'Phase 2 - Stabilize (if applicable)'
Write-Host '- Optional: enable maintenance mode or reduce traffic per policy.'
Write-Host '- Ensure no destructive migrations run until recovery path is chosen.'

Write-Phase 'Phase 3 - Database recovery path (tabletop)'
Write-Host '- Choose: snapshot restore vs PITR vs cross-region replica promotion.'
Write-Host '- Document target recovery timestamp (UTC) if using PITR.'

Write-Phase 'Phase 4 - Validate target environment'
Write-Host '- After restore or promotion: run migrations if needed, then smoke tests.'

Write-Phase 'Phase 5 - Optional API health check'
try {
    $healthUrl = "$ApiBaseUrl/health"
    Write-Host "GET $healthUrl"
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "HTTP $($response.StatusCode) - health endpoint reachable." -ForegroundColor Green
} catch {
    Write-Host 'Health check skipped or failed (API may not be running locally).' -ForegroundColor Yellow
    Write-Host $_.Exception.Message
}

Write-Phase 'Phase 6 - Post-incident'
Write-Host '- Record timeline, root cause, and action items.'
Write-Host '- Update this drill date in your internal DR calendar.'

Write-Host ''
Write-Host 'Drill complete (simulation only - no infrastructure was modified).' -ForegroundColor Green
