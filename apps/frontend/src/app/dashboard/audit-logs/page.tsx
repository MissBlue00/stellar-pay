'use client';

import { motion } from 'motion/react';
import { Activity, BellRing, Cloud, Search, ShieldAlert, Waypoints } from 'lucide-react';

const summaryCards = [
  {
    label: 'Events / 24h',
    value: '15,247',
    detail: 'CloudWatch log group /stellar-pay/production',
  },
  {
    label: 'Correlated Requests',
    value: '98.3%',
    detail: 'Matched by x-correlation-id across services',
  },
  { label: 'Active Alerts', value: '2', detail: 'Error spike and high latency alarms provisioned' },
  {
    label: 'Slow Requests',
    value: '17',
    detail: 'Requests above the 2s threshold in the last hour',
  },
];

const serviceRollup = [
  { service: 'stellar-pay-api', volume: '8,913', status: 'Healthy' },
  { service: '@stellar-pay/payments-engine', volume: '2,784', status: 'Healthy' },
  { service: '@stellar-pay/compliance-engine', volume: '1,966', status: 'Investigate' },
  { service: '@stellar-pay/subscriptions', volume: '1,584', status: 'Healthy' },
];

const alerts = [
  {
    name: 'stellar-pay-error-spike',
    state: 'Armed',
    threshold: '>= 5 errors / 5 min',
    action: 'SNS notification',
  },
  {
    name: 'stellar-pay-high-latency',
    state: 'Armed',
    threshold: '>= 3 slow requests / 5 min',
    action: 'SNS notification',
  },
];

const logs = [
  {
    timestamp: '2026-03-24 18:21:43',
    service: 'stellar-pay-api',
    level: 'info',
    correlationId: 'req_8b0d2f80d761',
    route: 'GET /treasury/reserves',
    message: 'HTTP request completed',
    latency: '184ms',
  },
  {
    timestamp: '2026-03-24 18:21:43',
    service: '@stellar-pay/payments-engine',
    level: 'info',
    correlationId: 'req_8b0d2f80d761',
    route: 'reserve-calculation',
    message: 'Computed asset reserve snapshot',
    latency: '141ms',
  },
  {
    timestamp: '2026-03-24 18:20:02',
    service: 'stellar-pay-api',
    level: 'warn',
    correlationId: 'req_61d5eb9c0f25',
    route: 'GET /treasury/reserves',
    message: 'Treasury wallet address missing, using placeholder',
    latency: '-',
  },
  {
    timestamp: '2026-03-24 18:18:27',
    service: '@stellar-pay/compliance-engine',
    level: 'error',
    correlationId: 'req_d0a77d1cb4aa',
    route: 'transaction-screening',
    message: 'HTTP request failed',
    latency: '2.8s',
  },
  {
    timestamp: '2026-03-24 18:15:04',
    service: '@stellar-pay/subscriptions',
    level: 'info',
    correlationId: 'req_7f90da2814d8',
    route: 'subscription-renewal',
    message: 'JSON payload forwarded to CloudWatch',
    latency: '96ms',
  },
];

const queries = [
  {
    label: 'Recent correlated requests',
    snippet:
      'fields @timestamp, service, level, correlationId, route, statusCode, durationMs, message | sort @timestamp desc | limit 50',
  },
  {
    label: 'Trace a single request',
    snippet:
      'fields @timestamp, service, level, correlationId, message, error.message | filter correlationId = "<correlation-id>" | sort @timestamp asc',
  },
  {
    label: 'Slow requests',
    snippet:
      'fields @timestamp, route, durationMs, correlationId, statusCode | filter event = "http_request_completed" and durationMs >= 2000 | sort @timestamp desc',
  },
];

export default function AuditLogsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <motion.h1
            className="text-2xl font-medium sm:text-3xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Aggregated Log Viewer
          </motion.h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Structured JSON logs, request correlation IDs, CloudWatch dashboards, and alert
            thresholds in one place.
          </p>
        </div>

        <motion.div
          className="flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Cloud className="size-4" />
          CloudWatch integration ready
        </motion.div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">{card.label}</div>
            <div className="mt-3 text-3xl font-medium">{card.value}</div>
            <div className="mt-2 text-sm text-neutral-400">{card.detail}</div>
          </motion.div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <motion.div
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
            <Waypoints className="size-4" />
            Service Rollup
          </div>

          <div className="space-y-3">
            {serviceRollup.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-black/20 px-4 py-3"
              >
                <div>
                  <div className="font-mono text-xs text-neutral-200">{service.service}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {service.volume} events in the last 24h
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    service.status === 'Healthy'
                      ? 'bg-emerald-400/10 text-emerald-300'
                      : 'bg-amber-400/10 text-amber-300'
                  }`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
            <BellRing className="size-4" />
            Alert Policies
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.name} className="rounded-xl border border-white/6 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xs text-neutral-200">{alert.name}</div>
                  <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
                    {alert.state}
                  </span>
                </div>
                <div className="mt-3 text-sm text-neutral-400">{alert.threshold}</div>
                <div className="mt-1 text-xs text-neutral-500">{alert.action}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
          <Search className="size-4" />
          Logs Insights Queries
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {queries.map((query) => (
            <div key={query.label} className="rounded-xl border border-white/6 bg-black/20 p-4">
              <div className="mb-3 text-sm text-neutral-200">{query.label}</div>
              <code className="block text-xs leading-6 text-neutral-400">{query.snippet}</code>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-neutral-200">
            <Activity className="size-4" />
            Recent Aggregated Events
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldAlert className="size-4" />
            Correlation IDs retained in every request path
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] text-left text-xs uppercase tracking-[0.2em] text-neutral-500">
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Level</th>
                <th className="px-5 py-4">Correlation ID</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Message</th>
                <th className="px-5 py-4">Latency</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <motion.tr
                  key={`${log.timestamp}-${log.correlationId}`}
                  className="border-t border-white/6 text-neutral-300"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                >
                  <td className="px-5 py-4 whitespace-nowrap text-neutral-500">{log.timestamp}</td>
                  <td className="px-5 py-4 font-mono text-xs">{log.service}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        log.level === 'error'
                          ? 'bg-rose-400/10 text-rose-300'
                          : log.level === 'warn'
                            ? 'bg-amber-400/10 text-amber-300'
                            : 'bg-emerald-400/10 text-emerald-300'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-sky-300">{log.correlationId}</td>
                  <td className="px-5 py-4 text-neutral-400">{log.route}</td>
                  <td className="px-5 py-4 text-neutral-200">{log.message}</td>
                  <td className="px-5 py-4 text-neutral-400">{log.latency}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
