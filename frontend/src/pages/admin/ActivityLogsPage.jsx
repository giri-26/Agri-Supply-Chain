import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { adminApi } from '../../api/endpoints';

export default function ActivityLogsPage() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.activityLogs({ page: 1, limit: 50 });
      setRows(data.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="System-wide audit trail" />
      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No activity recorded yet"
          columns={[
            { key: 'full_name', header: 'User', render: (r) => r.full_name || 'System' },
            { key: 'action', header: 'Action', render: (r) => <span className="capitalize">{r.action.replace(/_/g, ' ')}</span> },
            { key: 'entity_type', header: 'Entity', render: (r) => r.entity_type || '—' },
            { key: 'ip_address', header: 'IP', render: (r) => r.ip_address || '—' },
            { key: 'created_at', header: 'Time', render: (r) => new Date(r.created_at).toLocaleString() },
          ]}
        />
      </div>
    </div>
  );
}
