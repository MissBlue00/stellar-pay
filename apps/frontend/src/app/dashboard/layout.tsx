'use client';

import { motion, AnimatePresence } from 'motion/react';
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
import { useEffect, useState, useCallback } from 'react';
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

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
        <Link
          href="/"
          onClick={onNavClick}
          className="font-medium text-lg hover:text-neutral-400 transition-colors cursor-pointer"
        >
          StellarPay Rails
        </Link>
        {onNavClick && (
          <button
            onClick={onNavClick}
            className="flex items-center justify-center w-10 h-10 hover:bg-white/5 rounded-lg transition-colors cursor-pointer lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavClick}
                className="block cursor-pointer"
              >
                <motion.div
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all min-h-11 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
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

      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="text-xs text-neutral-500">
          <div className="mb-1">
            API Status: <span className="text-green-400">Operational</span>
          </div>
          <div>
            Environment: <span className="text-yellow-400">Development</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/5 px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-medium">StellarPay Rails</span>
          <div className="w-10" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-black border-r border-white/5 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              aria-hidden="true"
            />
            <motion.aside
              className="lg:hidden fixed top-0 left-0 bottom-0 w-64 max-w-[85vw] bg-black border-r border-white/5 flex flex-col z-50"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <SidebarContent onNavClick={closeSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="min-h-screen">
          <ErrorBoundary name="Page">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
