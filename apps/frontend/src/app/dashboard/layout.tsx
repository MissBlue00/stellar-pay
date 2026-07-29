'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Vault,
  Coins,
  RefreshCw,
  Lock,
  Webhook,
  ShieldCheck,
  Key,
  FileText,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeToggle } from '@/app/components/theme-toggle';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Treasury', href: '/dashboard/treasury', icon: Vault },
  { name: 'Token Whitelist', href: '/dashboard/tokens', icon: Coins },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: RefreshCw },
  { name: 'Escrow', href: '/dashboard/escrow', icon: Lock },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
  { name: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">StellarPay Rails</div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300`}
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <Link
            href="/"
            className="font-medium text-lg hover:text-muted-foreground transition-colors cursor-pointer"
          >
            StellarPay Rails
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="block cursor-pointer"
                >
                  <motion.div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="size-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {isActive && (
                      <motion.div layoutId="activeIndicator" className="ml-auto">
                        <ChevronRight className="size-4" />
                      </motion.div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground/70">
            <div className="mb-1">
              API Status: <span className="text-green-400">Operational</span>
            </div>
            <div>
              Environment: <span className="text-yellow-400">Development</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="min-h-screen">
          <ErrorBoundary name="Page">
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
