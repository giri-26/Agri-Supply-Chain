import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export default function StatCard({ label, value, icon = 'TrendingUp', accent = 'brand' }) {
  const Icon = Icons[icon] || Icons.Circle;

  const accentClasses = {
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card flex items-center justify-between p-5"
    >
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{value}</p>
      </div>
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${accentClasses[accent]}`}>
        <Icon size={20} />
      </div>
    </motion.div>
  );
}
