'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          className="p-6 bg-gradient-to-br from-red-500/[0.05] to-transparent border border-red-500/20 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center text-center py-8">
            <div className="p-3 bg-red-400/10 rounded-full mb-4">
              <AlertTriangle className="size-6 text-red-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {this.props.name ?? 'Section'} crashed
            </h3>
            <p className="text-sm text-neutral-400 mb-4 max-w-md">
              Something went wrong while rendering this section. The rest of the page should still be working.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono text-red-400 mb-4 max-w-md truncate">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
