export default function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none';
