'use client';

import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Volume (30d)',
    value: '$12,847,392.45',
    change: '+18.2%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    label: 'Settlement Balance',
    value: '$2,103,482.12',
    change: '+5.4%',
    trend: 'up',
    icon: Activity,
  },
  {
    label: 'Pending Settlements',
    value: '47',
    change: '-12.3%',
    trend: 'down',
    icon: Clock,
  },
  {
    label: 'Reserve Ratio',
    value: '127.3%',
    change: '+2.1%',
    trend: 'up',
    icon: CheckCircle2,
  },
];

const assets = [
  { symbol: 'sUSDC', balance: '1,245,382.45', usd: '1,245,382.45', change: '+2.3%' },
  { symbol: 'sBTC', balance: '12.4583', usd: '625,847.92', change: '+5.1%' },
  { symbol: 'sETH', balance: '145.2341', usd: '232,251.75', change: '-1.2%' },
];

const transactions = [
  {
    id: 'pay_9k2j3n4k5j6h',
    type: 'Payment',
    asset: 'sUSDC',
    amount: '+12,450.00',
    status: 'completed',
    time: '2m ago',
    hash: '0x7a8f9b2c...4e5d6f1a',
  },
  {
    id: 'pay_8h1j2k3l4m5n',
    type: 'Redemption',
    asset: 'sBTC',
    amount: '-0.2341',
    status: 'completed',
    time: '5m ago',
    hash: '0x3c4d5e6f...7a8b9c0d',
  },
  {
    id: 'pay_7g8h9i0j1k2l',
    type: 'Payment',
    asset: 'sETH',
    amount: '+5.4321',
    status: 'pending',
    time: '8m ago',
    hash: '0x1a2b3c4d...5e6f7g8h',
  },
  {
    id: 'pay_6f7g8h9i0j1k',
    type: 'Settlement',
    asset: 'sUSDC',
    amount: '-8,230.50',
    status: 'completed',
    time: '12m ago',
    hash: '0x9h8g7f6e...5d4c3b2a',
  },
  {
    id: 'pay_5e6f7g8h9i0j',
    type: 'Payment',
    asset: 'sBTC',
    amount: '+0.1234',
    status: 'completed',
    time: '15m ago',
    hash: '0x2b3c4d5e...6f7g8h9i',
  },
];

export default function OverviewPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Overview
        </motion.h1>
        <p className="text-sm text-neutral-400">Real-time metrics and settlement status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className="size-5 text-white" />
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {stat.change}
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-medium mb-1">{stat.value}</div>
              <div className="text-xs text-neutral-500">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Asset Balances */}
        <motion.div
          className="lg:col-span-2 p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Settlement Balance by Asset</h2>
            <button className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
              View all <ArrowUpRight className="size-3" />
            </button>
          </div>

          <div className="space-y-4">
            {assets.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/10 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center font-medium text-sm">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-neutral-500">{asset.balance}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${asset.usd}</div>
                    <div
                      className={`text-sm ${asset.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {asset.change}
                    </div>
                  </div>
                </div>

                {/* Mini bar chart */}
                <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-white/30 to-white/10"
                    initial={{ width: 0 }}
                    animate={{ width: `${[85, 72, 64][index % 3]}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reserve Ratio Gauge */}
        <motion.div
          className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-medium mb-6">Reserve Health</h2>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 440' }}
                  animate={{ strokeDasharray: '350 440' }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-medium">127.3%</div>
                <div className="text-xs text-neutral-500">Ratio</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Target</span>
              <span className="font-medium">120%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Minimum</span>
              <span className="font-medium">100%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Status</span>
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Healthy
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Real-time Transaction Feed */}
      <motion.div
        className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Real-time Transaction Feed</h2>
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
          </div>
          <button className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
            View all <ArrowUpRight className="size-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">ID</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Asset</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Time</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <td className="py-3 px-4 font-mono text-xs text-neutral-400">{tx.id}</td>
                  <td className="py-3 px-4">{tx.type}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs font-medium">
                      {tx.asset}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 font-medium ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {tx.amount}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        tx.status === 'completed'
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-yellow-400/10 text-yellow-400'
                      }`}
                    >
                      {tx.status === 'completed' ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <AlertCircle className="size-3" />
                      )}
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{tx.time}</td>
                  <td className="py-3 px-4">
                    <button className="font-mono text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">
                      {tx.hash}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
