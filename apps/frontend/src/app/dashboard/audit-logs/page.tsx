'use client';

import { motion } from "motion/react";
import { Filter, Download, Activity, ScrollText } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";

const initialAuditLogs = [
  { timestamp: "2026-03-03 14:32:15", action: "API Key Created", actor: "admin@acmecorp.com", ip: "192.168.1.100", details: "Created sk_live_***", status: "success" },
  { timestamp: "2026-03-03 14:28:42", action: "Payment Initiated", actor: "api-service", ip: "10.0.1.50", details: "pay_9k2j3n4k5j6h", status: "success" },
  { timestamp: "2026-03-03 14:24:08", action: "Webhook Updated", actor: "admin@acmecorp.com", ip: "192.168.1.100", details: "wh_1a2b3c", status: "success" },
  { timestamp: "2026-03-03 14:15:22", action: "Login Attempt", actor: "admin@acmecorp.com", ip: "192.168.1.100", details: "2FA verified", status: "success" },
  { timestamp: "2026-03-03 13:58:45", action: "Treasury Redemption", actor: "api-service", ip: "10.0.1.50", details: "5,000.00 sUSDC", status: "success" },
  { timestamp: "2026-03-03 13:42:18", action: "Login Attempt", actor: "unknown@suspicious.com", ip: "185.220.101.52", details: "Failed authentication", status: "failed" },
  { timestamp: "2026-03-03 12:15:30", action: "Compliance Document Uploaded", actor: "admin@acmecorp.com", ip: "192.168.1.100", details: "Banking Information", status: "success" },
  { timestamp: "2026-03-03 11:32:45", action: "Escrow Created", actor: "api-service", ip: "10.0.1.50", details: "esc_1a2b3c", status: "success" },
];

export default function AuditLogsPage() {
  const [auditLogs] = useState(initialAuditLogs);
  const logRows = auditLogs.length === 0 ? (
    <EmptyState
      icon={ScrollText}
      title="No audit logs yet"
      description="Audit logs track every action taken in your dashboard. They will appear here once activity is recorded."
    />
  ) : auditLogs.map((log, index) => (
    <motion.tr
      key={index}
      className="border-border hover:bg-muted/20 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.03 }}
    >
      <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
      <td className="py-4 px-4 font-medium">{log.action}</td>
      <td className="py-4 px-4 font-mono text-xs text-muted-foreground">{log.actor}</td>
      <td className="py-4 px-4 font-mono text-xs text-muted-foreground">{log.ip}</td>
      <td className="py-4 px-4 text-muted-foreground text-xs">{log.details}</td>
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
            log.status === "success" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
          }`}
        >
          <Activity className="size-3" />
          {log.status}
        </span>
      </td>
    </motion.tr>
  ));
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Audit Logs
        </motion.h1>
        <p className="text-sm text-muted-foreground">Complete activity history with tamper-proof logging</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Events", value: "15,247" },
          { label: "Today", value: "342" },
          { label: "Failed Actions", value: "1" },
          { label: "Security Alerts", value: "0" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-4 bg-card border-border rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-2xl font-medium mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground/70">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mb-6 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{
              opacity: [1, 0.3, 1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <span className="text-sm text-muted-foreground">Live monitoring active</span>
        </div>
        <div className="flex-1" />
        <button className="px-4 py-3 bg-muted border-border rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2 text-sm cursor-pointer">
          <Filter className="size-4" />
          Filter
        </button>
        <button className="px-4 py-3 bg-muted border-border rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2 text-sm cursor-pointer">
          <Download className="size-4" />
          Export
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
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium whitespace-nowrap">Timestamp</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Action</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Actor</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">IP Address</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Details</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logRows}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
