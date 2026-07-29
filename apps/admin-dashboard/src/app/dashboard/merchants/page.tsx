'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface Merchant {
  id: string;
  email: string;
  name: string | null;
  kycStatus: string;
  createdAt: string;
  paymentCount: number;
}

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchants = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listMerchants(q || undefined);
      setMerchants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants(search);
  }, [fetchMerchants]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMerchants(search);
  };

  return (
    <div>
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Merchants
        </motion.h1>
        <p className="text-sm text-neutral-400">Manage all registered merchants</p>
      </div>

      <motion.form
        onSubmit={handleSearch}
        className="mb-6 flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/20"
        >
          Search
        </button>
      </motion.form>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-neutral-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : merchants.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-sm text-neutral-500">
          {search ? 'No merchants match your search.' : 'No merchants registered yet.'}
        </div>
      ) : (
        <motion.div
          className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left py-4 px-4 text-neutral-500 font-medium">Email</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-medium">Name</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-medium">KYC Status</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-medium">Payments</th>
                  <th className="text-left py-4 px-4 text-neutral-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                  >
                    <td className="py-4 px-4">{m.email}</td>
                    <td className="py-4 px-4 text-neutral-400">{m.name ?? '—'}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          m.kycStatus === 'APPROVED'
                            ? 'bg-green-400/10 text-green-400'
                            : m.kycStatus === 'REJECTED'
                              ? 'bg-red-400/10 text-red-400'
                              : 'bg-yellow-400/10 text-yellow-400'
                        }`}
                      >
                        {m.kycStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-neutral-400">{m.paymentCount}</td>
                    <td className="py-4 px-4 text-neutral-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
