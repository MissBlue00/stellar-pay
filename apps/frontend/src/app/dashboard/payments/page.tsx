'use client';

import { motion } from 'motion/react';
import {
  Search,
  Filter,
  Download,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Inbox,
  CreditCard,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/app/components/ui/pagination';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Payment {
  id: string;
  paymentId: string;
  paymentReference: string;
  amount: number;
  currency: string;
  reference?: string;
  status: 'pending' | 'detected' | 'confirmed' | 'failed';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface PaymentsResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (pageNum: number, search?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(pageNum), limit: String(limit) });
        if (search) params.set('search', search);
        const res = await fetch(`${API_BASE_URL}/payments?${params}`);
        if (!res.ok) throw new Error(`Failed to load payments (${res.status})`);
        const json: PaymentsResponse = await res.json();
        setPayments(json.data);
        setTotal(json.total);
        setPage(json.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchPayments(page, searchQuery);
  }, [page, fetchPayments, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Payments
        </motion.h1>
        <p className="text-sm text-muted-foreground">Track and manage all payment transactions</p>
      </div>

      {/* Filters */}
      <motion.div
        className="mb-6 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search by ID, reference, or currency..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted border-border rounded-lg text-sm focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <button className="px-4 py-3 bg-muted border-border rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Filter className="size-4" />
          <span className="text-sm">Filters</span>
        </button>
        <button className="px-4 py-3 bg-muted border-border rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Download className="size-4" />
          <span className="text-sm">Export</span>
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Payments', value: total },
          { label: 'Confirmed', value: payments.filter((p) => p.status === 'confirmed').length },
          { label: 'Pending', value: payments.filter((p) => p.status === 'pending').length },
          { label: 'Failed', value: payments.filter((p) => p.status === 'failed').length },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="p-4 bg-card border-border rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-2xl font-medium mb-1">
              {loading ? (
                <Skeleton className="h-8 w-16 inline-block" />
              ) : (
                stat.value.toLocaleString()
              )}
            </div>
            <div className="text-xs text-muted-foreground/70">{stat.label}</div>
          </motion.div>
        ))}
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
            onClick={() => fetchPayments(page, searchQuery)}
            className="ml-auto underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Payments Table */}
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
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium whitespace-nowrap">
                  Payment ID
                </th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium whitespace-nowrap">
                  Date & Time
                </th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Asset</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Reference</th>
                <th className="text-left py-4 px-4 text-muted-foreground/70 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-border">
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-6 w-14" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={searchQuery ? Search : CreditCard}
                  title={searchQuery ? 'No results found' : 'No payments yet'}
                  description={
                    searchQuery
                      ? 'Try adjusting your search or filters to find what you\'re looking for.'
                      : 'Payments will appear here once customers complete a transaction. Your first payment can be initiated from the checkout page.'
                  }
                  action={
                    searchQuery
                      ? undefined
                      : { label: 'View Checkout', onClick: () => window.location.href = '/checkout' }
                  }
                />
              ) : (
                payments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    className="border-border hover:bg-muted/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <td className="py-4 px-4">
                      <div className="font-mono text-xs">{payment.paymentReference}</div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                        {payment.currency}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium">{payment.amount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
                          payment.status === 'confirmed'
                            ? 'bg-green-400/10 text-green-400'
                            : payment.status === 'pending'
                              ? 'bg-yellow-400/10 text-yellow-400'
                              : payment.status === 'detected'
                                ? 'bg-blue-400/10 text-blue-400'
                                : 'bg-red-400/10 text-red-400'
                        }`}
                      >
                        {payment.status === 'confirmed' ? (
                          <CheckCircle2 className="size-3" />
                        ) : payment.status === 'pending' || payment.status === 'detected' ? (
                          <Clock className="size-3" />
                        ) : (
                          <AlertCircle className="size-3" />
                        )}
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      {payment.reference ?? '—'}
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                        <ArrowUpRight className="size-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border py-4 px-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <span className="flex size-9 items justify-center text-muted-foreground/70">
                          ...
                        </span>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </motion.div>
    </div>
  );
}
