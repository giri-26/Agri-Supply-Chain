import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { notificationApi } from '../../api/endpoints';

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await notificationApi.list({ page: 1, limit: 50 });
      setRows(data.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Real-time updates across the supply chain" />

      <div className="glass-card p-2">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-neutral-400">
            <Bell size={32} />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {rows.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{n.title}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{n.message}</p>
                  <p className="mt-1 text-xs text-neutral-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100">
                    <CheckCheck size={12} /> Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
