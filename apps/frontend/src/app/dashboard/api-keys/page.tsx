'use client';

import { motion } from "motion/react";
import { Plus, Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";

const apiKeys = [
  { id: "sk_live_1a2b3c4d5e6f", name: "Production API Key", created: "2026-01-15", lastUsed: "2m ago", permissions: "Full Access" },
  { id: "sk_test_7g8h9i0j1k2l", name: "Test API Key", created: "2026-02-01", lastUsed: "1h ago", permissions: "Read Only" },
];

export default function ApiKeysPage() {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <motion.h1
          className="text-2xl sm:text-3xl font-medium mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          API Keys
        </motion.h1>
        <p className="text-sm text-muted-foreground">Manage authentication credentials for API access</p>
      </div>

      <motion.div
        className="mb-8 p-6 bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/20 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-3">
          <Eye className="size-5 text-yellow-400 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-400 mb-1">Keep your keys secure</div>
            <div className="text-sm text-muted-foreground">
              Never share your API keys in publicly accessible areas such as GitHub, client-side code, or logging systems.
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 font-medium cursor-pointer">
          <Plus className="size-4" />
          Generate New Key
        </button>
      </motion.div>

      <motion.div
        className="bg-card border-border rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-4 p-6">
          {apiKeys.map((key, index) => (
            <motion.div
              key={key.id}
              className="p-6 bg-muted/30 border-border rounded-lg hover:border-foreground/10 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-medium">{key.name}</div>
                    <span className="px-2 py-1 bg-muted rounded text-xs">{key.permissions}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="font-mono text-sm bg-background border-border rounded px-3 py-2 flex-1">
                      {visibleKeys.has(key.id) ? key.id : "sk_" + "•".repeat(20)}
                    </div>
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                      title={visibleKeys.has(key.id) ? "Hide" : "Show"}
                    >
                      {visibleKeys.has(key.id) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button
                      className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                      title="Copy"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground/70">Created:</span> {key.created}
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Last used:</span> {key.lastUsed}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-muted border-border rounded-lg hover:bg-accent transition-all text-sm cursor-pointer">
                    Rotate
                  </button>
                  <button className="p-2 hover:bg-red-400/10 rounded-lg transition-colors text-red-400 cursor-pointer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
