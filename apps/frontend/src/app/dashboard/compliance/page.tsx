'use client';

import { motion } from "motion/react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Upload } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Compliance
        </motion.h1>
        <p className="text-sm text-muted-foreground">KYC/AML status and regulatory requirements</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: "KYC Status", value: "Verified", icon: CheckCircle2, color: "green" },
          { label: "AML Screening", value: "Passed", icon: ShieldCheck, color: "green" },
          { label: "Compliance Level", value: "Tier 3", icon: CheckCircle2, color: "green" },
          { label: "Last Review", value: "2026-03-01", icon: CheckCircle2, color: "green" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-6 bg-card border-border rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 bg-${stat.color}-400/10 rounded-lg`}>
                <stat.icon className={`size-5 text-${stat.color}-400`} />
              </div>
              <div className="text-xs text-muted-foreground/70">{stat.label}</div>
            </div>
            <div className="text-2xl font-medium">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          className="p-6 bg-card border-border rounded-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-medium mb-6">Required Documents</h2>
          <div className="space-y-4">
            {[
              { name: "Business License", status: "verified", date: "2026-01-15" },
              { name: "Proof of Address", status: "verified", date: "2026-01-15" },
              { name: "Tax ID Certificate", status: "verified", date: "2026-01-20" },
              { name: "Banking Information", status: "pending", date: "—" },
            ].map((doc, index) => (
              <motion.div
                key={doc.name}
                className="p-4 bg-muted/30 border-border rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium mb-1">{doc.name}</div>
                    <div className="text-xs text-muted-foreground/70">Uploaded: {doc.date}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      doc.status === "verified" ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
                    }`}
                  >
                    {doc.status === "verified" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                    {doc.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <button className="mt-6 w-full px-4 py-3 bg-muted border-border rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
            <Upload className="size-4" />
            Upload Document
          </button>
        </motion.div>

        <motion.div
          className="p-6 bg-card border-border rounded-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-medium mb-6">Transaction Monitoring</h2>
          <div className="space-y-6">
            {[
              { label: "Total Monitored", value: "1,247" },
              { label: "Flagged for Review", value: "0" },
              { label: "Risk Score", value: "Low" },
            ].map((metric) => (
              <div key={metric.label} className="pb-4 border-b border-border last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <span className="text-lg font-medium">{metric.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-green-400/10 border border-green-400/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-400 mt-0.5" />
              <div>
                <div className="font-medium text-green-400 mb-1">Fully Compliant</div>
                <div className="text-xs text-muted-foreground">All regulatory requirements met. Next review scheduled for April 1, 2026.</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
