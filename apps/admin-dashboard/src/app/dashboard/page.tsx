'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Store, CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface Metrics {
  totalMerchants: number;
  totalPayments: number;
  totalVolume: number;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getMetrics()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</div>
    );
  }

  const cards = [
    { label: 'Total Merchants', value: metrics?.totalMerchants ?? 0, icon: Store },
    { label: 'Total Payments', value: metrics?.totalPayments ?? 0, icon: CreditCard },
    {
      label: 'Total Volume',
      value: `$${(metrics?.totalVolume ?? 0).toLocaleString()}`,
      icon: DollarSign,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Admin Overview
        </motion.h1>
        <p className="text-sm text-neutral-400">System-wide metrics at a glance</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <card.icon className="size-5 text-neutral-400 mb-4" />
            <div className="text-2xl font-medium mb-1">{card.value}</div>
            <div className="text-xs text-neutral-500">{card.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
