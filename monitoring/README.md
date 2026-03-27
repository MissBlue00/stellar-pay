# Monitoring (Prometheus + Grafana + Alertmanager)

## What this stack does

- **API**: scrapes `GET /metrics` on the NestJS service (`prom-client` histograms and counters).
- **Web apps**: scrapes synthetic uptime/latency via the **blackbox exporter** (HTTP probes).
- **Dashboards**: Grafana imports `grafana/dashboards/stellar-pay-overview.json` automatically.
- **Alerts**: Prometheus evaluates rules in `prometheus/alerts/` and sends notifications to Alertmanager.

## Ports (defaults in `prometheus/prometheus.yml`)

| Service        | Host port | Notes |
|----------------|-----------|--------|
| API            | 3000      | `METRICS` at `/metrics` |
| Frontend       | 3001      | set `PORT=3001` for `next dev` / `next start` |
| Admin dashboard | 3002     | set `PORT=3002` |
| Prometheus     | 9090      | |
| Alertmanager   | 9093      | |
| Blackbox       | 9115      | optional; used internally by Prometheus relabel |
| Grafana        | 3003      | map container 3000 → host 3003 |

Adjust targets in `prometheus/prometheus.yml` if your local ports differ.

## Run the monitoring stack

From the repository root (requires Docker):

```bash
docker compose -f monitoring/docker-compose.yml up -d
```

Then open **Grafana**: `http://localhost:3003` (default login `admin` / `admin`).

- **Metrics**: open the **Stellar Pay — Overview** dashboard (throughput, 5xx ratio, p95 latency, blackbox probes).
- **Alerts in Grafana**: the dashboard includes a **Firing alert rules** table (Prometheus `ALERTS` metric). You can also open the pre-provisioned **Alertmanager** datasource under **Connections → Data sources**, or use Alertmanager’s UI at `http://localhost:9093`.

## Run the application services locally

Examples:

```bash
# API (default PORT 3000)
pnpm --filter api start:dev

# Frontend on 3001 (POSIX)
cd apps/frontend && PORT=3001 pnpm dev

# Admin on 3002 (POSIX)
cd apps/admin-dashboard && PORT=3002 pnpm dev
```

PowerShell:

```powershell
pnpm --filter api start:dev
cd apps/frontend; $env:PORT = 3001; pnpm dev
cd apps/admin-dashboard; $env:PORT = 3002; pnpm dev
```

## Test that Prometheus sees data

- Prometheus targets: `http://localhost:9090/targets`
- API metrics: `http://localhost:3000/metrics`
