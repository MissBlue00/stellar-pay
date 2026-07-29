import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <td colSpan={99} className="py-16 text-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.03]">
            <Icon className="size-7 text-neutral-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-300">{title}</p>
            <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              {action.label}
            </button>
          )}
        </motion.div>
      </td>
    </motion.tr>
  );
}
