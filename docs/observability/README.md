# CloudWatch Observability

This setup standardizes structured JSON logs for the API and workspace services, then aggregates them in Amazon CloudWatch.

## What Ships In This Repo

- JSON loggers in every package under `packages/*/src/logger.ts`
- API request correlation IDs via `x-correlation-id`
- CloudWatch dashboard definition in `cloudwatch-dashboard.json`
- CloudWatch metric filters in `cloudwatch-metric-filters.json`
- CloudWatch alarms in `cloudwatch-alarms.json`
- Deployment helper in `scripts/observability/deploy-cloudwatch.ps1`

## Logging Contract

Every emitted log line is JSON and includes these fields when available:

- `timestamp`
- `level`
- `service`
- `message`
- `correlationId`
- `event`
- `route`
- `statusCode`
- `durationMs`
- `error`

Forward stdout/stderr from each runtime into the same CloudWatch log group, for example `/stellar-pay/production`. This repo assumes a shared log group and service-level differentiation through the `service` field.

## Deploy

Run from the repo root with AWS credentials that can manage CloudWatch resources:

```powershell
./scripts/observability/deploy-cloudwatch.ps1 -Region us-east-1 -LogGroup /stellar-pay/production -DashboardName stellar-pay-observability -AlarmTopicArn arn:aws:sns:us-east-1:123456789012:stellar-pay-alerts
```

The script creates the log group if needed, applies the retention policy, provisions metric filters, uploads the dashboard, and configures the alarms.

## Log Viewer Queries

Recent correlated requests:

```text
fields @timestamp, service, level, correlationId, route, statusCode, durationMs, message
| sort @timestamp desc
| limit 50
```

Errors for a specific request trace:

```text
fields @timestamp, service, level, correlationId, message, error.message
| filter correlationId = "<correlation-id>"
| sort @timestamp asc
```

Slow requests over 2 seconds:

```text
fields @timestamp, route, durationMs, correlationId, statusCode
| filter event = "http_request_completed" and durationMs >= 2000
| sort @timestamp desc
```
