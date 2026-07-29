'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, Server, Globe, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface HealthData {
  status: string;
  version: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getHealth()
      .then(setHealth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  const uptimeFormatted = health
    ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
    : '—';

  return (
    <div>
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          System Health
        </motion.h1>
        <p className="text-sm text-neutral-400">API server status and diagnostics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-neutral-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : health ? (
        <div className="space-y-6">
          <motion.div
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              {isHealthy ? (
                <CheckCircle className="size-6 text-green-400" />
              ) : (
                <XCircle className="size-6 text-red-400" />
              )}
              <div>
                <div className="text-lg font-medium capitalize">{health.status}</div>
                <div className="text-xs text-neutral-500">Server Status</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                  <Server className="size-3" />
                  Version
                </div>
                <div className="text-sm font-mono">{health.version}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                  <Clock className="size-3" />
                  Uptime
                </div>
                <div className="text-sm font-mono">{uptimeFormatted}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                  <Globe className="size-3" />
                  Environment
                </div>
                <div className="text-sm font-mono">{health.environment}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                  <Activity className="size-3" />
                  Last Check
                </div>
                <div className="text-sm font-mono">
                  {new Date(health.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
