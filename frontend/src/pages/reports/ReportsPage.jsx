import { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { inputClass } from '../../components/FormField';
import { reportApi } from '../../api/endpoints';
import api from '../../api/axiosClient';

const REPORTS = [
  { key: 'sales', label: 'Sales' },
  { key: 'farmers', label: 'Farmers' },
  { key: 'products', label: 'Products' },
  { key: 'shipments', label: 'Shipments' },
  { key: 'inventory', label: 'Inventory' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiFn = reportApi[reportType];
      const { data } = await apiFn(reportType === 'sales' ? { period } : {});
      setRows(data.data);
    } finally {
      setIsLoading(false);
    }
  }, [reportType, period]);

  useEffect(() => { load(); }, [load]);

  const columns =
    rows.length > 0
      ? Object.keys(rows[0]).map((key) => ({ key, header: key.replace(/_/g, ' ') }))
      : [];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = { format: 'excel', ...(reportType === 'sales' ? { period } : {}) };
      const response = await api.get(`/reports/${reportType}`, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Daily, weekly, monthly, and entity-level reports"
        action={
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-brand-50 disabled:opacity-60"
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setReportType(r.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${reportType === r.key ? 'bg-white dark:bg-neutral-700 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-neutral-500'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {reportType === 'sales' && (
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        )}
      </div>

      <div className="glass-card">
        <DataTable isLoading={isLoading} rows={rows} columns={columns} emptyMessage="No data for this report yet" />
      </div>
    </div>
  );
}
