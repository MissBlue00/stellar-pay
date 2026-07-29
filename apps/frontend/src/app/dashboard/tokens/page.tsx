'use client';

import { motion } from "motion/react";
import { Plus, ToggleLeft, ToggleRight, Settings, Coins } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";

const initialTokens = [
  { symbol: "USDC", enabled: true, autoConvert: true, minAmount: "10.00", maxAmount: "100,000.00" },
  { symbol: "BTC", enabled: true, autoConvert: false, minAmount: "0.001", maxAmount: "10.00" },
  { symbol: "ETH", enabled: true, autoConvert: true, minAmount: "0.01", maxAmount: "100.00" },
  { symbol: "USDT", enabled: false, autoConvert: false, minAmount: "10.00", maxAmount: "50,000.00" },
];

export default function TokenWhitelistPage() {
  const [tokens] = useState(initialTokens);
  const tokenRows = tokens.length === 0 ? (
    <EmptyState
      icon={Coins}
      title="No tokens configured"
      description="Token whitelist controls which assets are accepted for payments. Add a token to start accepting it."
      action={{ label: 'Add Token', onClick: () => {} }}
    />
  ) : tokens.map((token, index) => (
    <motion.tr
      key={token.symbol}
      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center font-medium text-xs">
            {token.symbol.slice(0, 2)}
          </div>
          <span className="font-medium">{token.symbol}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <button className="flex items-center gap-2 cursor-pointer">
          {token.enabled ? (
            <ToggleRight className="size-6 text-green-400" />
          ) : (
            <ToggleLeft className="size-6 text-neutral-500" />
          )}
          <span className={token.enabled ? "text-green-400" : "text-neutral-500"}>
            {token.enabled ? "Enabled" : "Disabled"}
          </span>
        </button>
      </td>
      <td className="py-4 px-4">
        <button className="flex items-center gap-2 cursor-pointer">
          {token.autoConvert ? (
            <ToggleRight className="size-6 text-green-400" />
          ) : (
            <ToggleLeft className="size-6 text-neutral-500" />
          )}
        </button>
      </td>
      <td className="py-4 px-4 font-mono text-neutral-400">{token.minAmount}</td>
      <td className="py-4 px-4 font-mono text-neutral-400">{token.maxAmount}</td>
      <td className="py-4 px-4">
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
          <Settings className="size-4" />
        </button>
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
          Token Whitelist
        </motion.h1>
        <p className="text-sm text-neutral-400">Configure accepted tokens and conversion rules</p>
      </div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="px-4 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-all flex items-center gap-2 font-medium cursor-pointer">
          <Plus className="size-4" />
          Add Token
        </button>
      </motion.div>

      <motion.div
        className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Token</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Auto-Convert</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Min Amount</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Max Amount</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokenRows}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
