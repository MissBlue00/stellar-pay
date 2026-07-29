'use client';

import { motion } from "motion/react";
import { Plus, Lock, Clock, CheckCircle2 } from "lucide-react";

const escrows = [
  { id: "esc_1a2b3c", parties: "Acme Corp ↔ BuildCo", amount: "50,000.00", asset: "sUSDC", status: "active", condition: "Milestone completion", releaseDate: "2026-03-15" },
  { id: "esc_4d5e6f", parties: "TechStart ↔ DevShop", amount: "25,000.00", asset: "sUSDC", status: "pending", condition: "Approval pending", releaseDate: "2026-03-20" },
  { id: "esc_7g8h9i", parties: "FinCo ↔ Supplier", amount: "0.5", asset: "sBTC", status: "released", condition: "Time lock expired", releaseDate: "2026-03-01" },
];

export default function EscrowPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Escrow
        </motion.h1>
        <p className="text-sm text-muted-foreground">Manage escrow accounts and conditional releases</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Escrows", value: "1" },
          { label: "Total Locked Value", value: "$50,000.00" },
          { label: "Pending Release", value: "1" },
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

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 font-medium cursor-pointer">
          <Plus className="size-4" />
          Create Escrow
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
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Escrow ID</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Parties</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Asset</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Condition</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Release Date</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((escrow, index) => (
                <motion.tr
                  key={escrow.id}
                  className="border-border hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <td className="py-4 px-4 font-mono text-xs">{escrow.id}</td>
                  <td className="py-4 px-4">{escrow.parties}</td>
                  <td className="py-4 px-4 font-medium">{escrow.amount}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-muted rounded text-xs">{escrow.asset}</span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground text-xs">{escrow.condition}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        escrow.status === "active"
                          ? "bg-blue-400/10 text-blue-400"
                          : escrow.status === "pending"
                          ? "bg-yellow-400/10 text-yellow-400"
                          : "bg-green-400/10 text-green-400"
                      }`}
                    >
                      {escrow.status === "active" ? (
                        <Lock className="size-3" />
                      ) : escrow.status === "pending" ? (
                        <Clock className="size-3" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      {escrow.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{escrow.releaseDate}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
