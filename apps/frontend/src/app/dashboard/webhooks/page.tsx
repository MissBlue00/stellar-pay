'use client';

import { motion } from "motion/react";
import { Plus, AlertCircle, Activity, Webhook } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";

const initialWebhooks = [
  {
    id: 'wh_1a2b3c',
    endpoint: 'https://api.acmecorp.com/webhooks',
    events: ['payment.completed', 'settlement.pending'],
    status: 'active',
    lastTriggered: '2m ago',
    hash: '0x7a8f9b...4e5d',
  },
  {
    id: 'wh_4d5e6f',
    endpoint: 'https://api.techstart.io/hooks',
    events: ['payment.failed', 'subscription.renewed'],
    status: 'active',
    lastTriggered: '15m ago',
    hash: '0x3c4d5e...7a8b',
  },
  {
    id: 'wh_7g8h9i',
    endpoint: 'https://hooks.buildco.dev/stellar',
    events: ['escrow.released'],
    status: 'inactive',
    lastTriggered: '2h ago',
    hash: '0x1a2b3c...5e6f',
  },
];

export default function WebhooksPage() {
  const [webhooks] = useState(initialWebhooks);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Webhooks
        </motion.h1>
        <p className="text-sm text-muted-foreground">
          Configure event notifications with on-chain proof
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Webhooks', value: webhooks.filter((w) => w.status === 'active').length.toString() },
          { label: 'Total Deliveries', value: webhooks.length > 0 ? '1,247' : '0' },
          { label: 'Success Rate', value: webhooks.length > 0 ? '99.8%' : '—' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-6 bg-card border-border rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-2xl font-medium mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground/70">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 font-medium cursor-pointer">
          <Plus className="size-4" />
          Add Webhook
        </button>
      </motion.div>

      <motion.div
        className="bg-card border-border rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-muted/20">
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Webhook ID</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Endpoint</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Events</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Last Triggered</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Proof Hash</th>
               </tr>
            </thead>
            <tbody>
              {webhooks.length === 0 ? (
                <EmptyState
                  icon={Webhook}
                  title="No webhooks configured"
                  description="Webhooks notify your server when events happen in your account. Add a webhook to start receiving event notifications."
                  action={{ label: 'Add Webhook', onClick: () => {} }}
                />
              ) : (
                webhooks.map((webhook, index) => (
                  <motion.tr
                    key={webhook.id}
                    className="border-border hover:bg-muted/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <td className="py-4 px-4 font-mono text-xs">{webhook.id}</td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">{webhook.endpoint}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <span
                            key={event}
                            className="px-2 py-1 bg-muted rounded text-xs whitespace-nowrap"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          webhook.status === 'active'
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-neutral-400/10 text-muted-foreground'
                        }`}
                      >
                        {webhook.status === 'active' ? (
                          <Activity className="size-3" />
                        ) : (
                          <AlertCircle className="size-3" />
                        )}
                        {webhook.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{webhook.lastTriggered}</td>
                    <td className="py-4 px-4">
                      <button className="font-mono text-xs text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
                        {webhook.hash}
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}