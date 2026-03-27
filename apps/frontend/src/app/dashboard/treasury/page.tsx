'use client';

import { motion } from 'motion/react';
import { Coins, TrendingUp, Eye, CheckCircle2 } from 'lucide-react';

const mirrorAssets = [
  {
    symbol: 'sUSDC',
    name: 'Stellar USDC',
    balance: '1,245,382.45',
    usdValue: '1,245,382.45',
    reserves: '1,286,529.42',
    reserveRatio: '103.3%',
    redeemable: true,
    burnHistory: '342 burns',
  },
  {
    symbol: 'sBTC',
    name: 'Stellar Bitcoin',
    balance: '12.4583',
    usdValue: '625,847.92',
    reserves: '12.8731',
    reserveRatio: '103.3%',
    redeemable: true,
    burnHistory: '87 burns',
  },
  {
    symbol: 'sETH',
    name: 'Stellar Ethereum',
    balance: '145.2341',
    usdValue: '232,251.75',
    reserves: '150.1248',
    reserveRatio: '103.4%',
    redeemable: true,
    burnHistory: '156 burns',
  },
];

const burnHistory = [
  { date: '2026-03-03 14:32', asset: 'sUSDC', amount: '5,000.00', hash: '0x7a8f9b...4e5d6f' },
  { date: '2026-03-03 12:15', asset: 'sBTC', amount: '0.1234', hash: '0x3c4d5e...7a8b9c' },
  { date: '2026-03-03 09:42', asset: 'sETH', amount: '2.5000', hash: '0x1a2b3c...5e6f7g' },
  { date: '2026-03-02 18:20', asset: 'sUSDC', amount: '12,450.00', hash: '0x9h8g7f...5d4c3b' },
];

export default function TreasuryPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
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

      {/* Treasury Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Treasury Value', value: '$2,103,482.12', icon: Coins },
          { label: 'Reserve Backing', value: '$2,173,402.45', icon: CheckCircle2 },
          { label: 'Liquidity Health', value: 'Excellent', icon: TrendingUp },
          { label: 'Active Assets', value: '3', icon: Coins },
        ].map((stat, index) => (
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
            <div className="text-2xl font-medium mb-1">{stat.value}</div>
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
          {mirrorAssets.map((asset, index) => (
            <motion.div
              key={asset.symbol}
              className="p-6 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/10 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Asset Info */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center font-medium">
                      {asset.symbol.slice(1, 3)}
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-xs text-neutral-500">{asset.name}</div>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Balance</div>
                  <div className="font-medium">{asset.balance}</div>
                  <div className="text-xs text-neutral-400">${asset.usdValue}</div>
                </div>

                {/* Reserves */}
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Reserve Backing</div>
                  <div className="font-medium">{asset.reserves}</div>
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="size-3" />
                    {asset.reserveRatio}
                  </div>
                </div>

                {/* Actions */}
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
            {[
              { label: 'Overall Health', value: 95, status: 'Excellent' },
              { label: 'Reserve Coverage', value: 103, status: 'Strong' },
              { label: 'Redemption Capacity', value: 88, status: 'Good' },
            ].map((metric, index) => (
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
