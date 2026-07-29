'use client';

import { motion } from "motion/react";
import { Coins, TrendingUp, Eye, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/app/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface AssetReserve {
  symbol: string;
  total_supply: string;
  treasury_balance: string;
  reserve_ratio: number;
}

interface TreasuryBalanceResponse {
  total_treasury_value: number;
  total_reserve_backing: number;
  active_assets: number;
  assets: AssetReserve[];
}

const assetNames: Record<string, string> = {
  USDC: 'Stellar USDC',
  ARS: 'Stellar ARS',
};

const burnHistory = [
  { date: '2026-03-03 14:32', asset: 'sUSDC', amount: '5,000.00', hash: '0x7a8f9b...4e5d6f' },
  { date: '2026-03-03 12:15', asset: 'sBTC', amount: '0.1234', hash: '0x3c4d5e...7a8b9c' },
  { date: '2026-03-03 09:42', asset: 'sETH', amount: '2.5000', hash: '0x1a2b3c...5e6f7g' },
  { date: '2026-03-02 18:20', asset: 'sUSDC', amount: '12,450.00', hash: '0x9h8g7f...5d4c3b' },
];

export default function TreasuryPage() {
  const [data, setData] = useState<TreasuryBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/treasury/balance`);
      if (!res.ok) throw new Error(`Failed to load treasury data (${res.status})`);
      const json: TreasuryBalanceResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const overviewStats = [
    { label: 'Total Treasury Value', value: data ? `$${data.total_treasury_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null, icon: Coins },
    { label: 'Reserve Backing', value: data ? `$${data.total_reserve_backing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null, icon: CheckCircle2 },
    { label: 'Liquidity Health', value: data ? (data.assets.every(a => a.reserve_ratio >= 100) ? 'Excellent' : 'Good') : null, icon: TrendingUp },
    { label: 'Active Assets', value: data ? String(data.active_assets) : null, icon: Coins },
  ];

  const avgReserveRatio = data && data.assets.length > 0
    ? data.assets.reduce((sum, a) => sum + a.reserve_ratio, 0) / data.assets.length
    : 0;

  const liquidityMetrics = data ? [
    { label: 'Overall Health', value: Math.min(Math.round(avgReserveRatio), 100), status: avgReserveRatio >= 100 ? 'Excellent' : 'Good' },
    { label: 'Reserve Coverage', value: Math.round(avgReserveRatio), status: avgReserveRatio >= 100 ? 'Strong' : 'Adequate' },
    { label: 'Redemption Capacity', value: Math.min(Math.round(avgReserveRatio * 0.85), 100), status: 'Good' },
  ] : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Treasury
        </motion.h1>
        <p className="text-sm text-neutral-400">Manage mirror assets, reserves, and redemptions</p>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center gap-3 text-red-400 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchBalance}
            className="ml-auto underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Treasury Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className="size-5" />
              </div>
            </div>
            <div className="text-2xl font-medium mb-1">
              {loading ? <Skeleton className="h-8 w-28 inline-block" /> : stat.value}
            </div>
            <div className="text-xs text-neutral-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Mirror Assets */}
      <motion.div
        className="mb-8 p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-medium mb-6">Mirror Assets</h2>

        <div className="space-y-4">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-lg">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Skeleton className="h-12 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-28 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-28 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          )) : data?.assets.map((asset, index) => (
            <motion.div
              key={asset.symbol}
              className="p-6 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/10 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center font-medium">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">s{asset.symbol}</div>
                      <div className="text-xs text-neutral-500">{assetNames[asset.symbol] ?? asset.symbol}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-1">Balance</div>
                  <div className="font-medium">{parseFloat(asset.treasury_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-1">Reserve Backing</div>
                  <div className="font-medium">{parseFloat(asset.total_supply).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="size-3" />
                    {asset.reserve_ratio}%
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-all text-sm font-medium cursor-pointer">
                    Redeem
                  </button>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer">
                    <Eye className="size-4" />
                    Proof of Reserves
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Burn History */}
        <motion.div
          className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-medium mb-6">Recent Burn History</h2>

          <div className="space-y-3">
            {burnHistory.map((burn, index) => (
              <motion.div
                key={index}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/10 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-white/5 rounded text-xs font-medium">
                    {burn.asset}
                  </span>
                  <span className="text-xs text-neutral-500">{burn.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{burn.amount}</div>
                  <button className="font-mono text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">
                    {burn.hash}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Liquidity Health */}
        <motion.div
          className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-medium mb-6">Liquidity Health Metrics</h2>

          <div className="space-y-6">
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-3 w-8 ml-auto" />
              </div>
            )) : liquidityMetrics.map((metric, index) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-400">{metric.label}</span>
                  <span className="text-sm font-medium text-green-400">{metric.status}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-green-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                  />
                </div>
                <div className="text-right text-xs text-neutral-500 mt-1">{metric.value}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
