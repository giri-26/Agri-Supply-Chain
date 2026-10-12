const COLOR_MAP = {
  // generic
  active: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  inactive: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  // products
  registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  collected: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  in_warehouse: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  in_transit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  at_retailer: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  sold: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  // orders / shipments
  placed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pending: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  pickup: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  dispatched: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  delivered: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  accepted: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  fulfilled: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  // stock
  in_stock: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  low_stock: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  out_of_stock: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function StatusPill({ status }) {
  const key = (status || '').toLowerCase();
  const classes = COLOR_MAP[key] || 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${classes}`}>
      {key.replace(/_/g, ' ')}
    </span>
  );
}
