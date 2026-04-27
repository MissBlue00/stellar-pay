'use client';

import { motion } from 'motion/react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

const subscriptions = [
  {
    id: 'sub_1a2b3c4d',
    customer: 'Acme Corp',
    plan: 'Enterprise',
    amount: '999.00',
    interval: 'Monthly',
    status: 'active',
    nextBilling: '2026-04-03',
  },
  {
    id: 'sub_5e6f7g8h',
    customer: 'TechStart Inc',
    plan: 'Pro',
    amount: '299.00',
    interval: 'Monthly',
    status: 'active',
    nextBilling: '2026-04-15',
  },
  {
    id: 'sub_9i0j1k2l',
    customer: 'BuildCo',
    plan: 'Starter',
    amount: '99.00',
    interval: 'Monthly',
    status: 'past_due',
    nextBilling: '2026-03-01',
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Subscriptions
        </motion.h1>
        <p className="text-sm text-neutral-400">Manage recurring payment subscriptions</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Subscriptions', value: '2' },
          { label: 'Monthly Recurring Revenue', value: '$1,298.00' },
          { label: 'Past Due', value: '1' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-2xl font-medium mb-1">{stat.value}</div>
            <div className="text-xs text-neutral-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button className="px-4 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-all flex items-center gap-2 font-medium cursor-pointer">
          <Plus className="size-4" />
          Create Subscription
        </button>
      </motion.div>

      <motion.div
        className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">
                  Subscription ID
                </th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Customer</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Plan</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Interval</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-neutral-500 font-medium">Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub, index) => (
                <motion.tr
                  key={sub.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <td className="py-4 px-4 font-mono text-xs">{sub.id}</td>
                  <td className="py-4 px-4">{sub.customer}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs">{sub.plan}</span>
                  </td>
                  <td className="py-4 px-4 font-medium">${sub.amount}</td>
                  <td className="py-4 px-4 text-neutral-400">{sub.interval}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        sub.status === 'active'
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-red-400/10 text-red-400'
                      }`}
                    >
                      {sub.status === 'active' ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <AlertCircle className="size-3" />
                      )}
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-neutral-400">{sub.nextBilling}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
