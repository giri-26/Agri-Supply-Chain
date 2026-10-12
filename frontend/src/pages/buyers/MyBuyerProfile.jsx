import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusPill from '../../components/StatusPill';
import FormField, { inputClass } from '../../components/FormField';
import { buyerApi } from '../../api/endpoints';

export default function MyBuyerProfile() {
  const [buyer, setBuyer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ businessName: '', address: '', gpsLat: '', gpsLng: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await buyerApi.getMe();
      setBuyer(data.data);
      const [history, active] = await Promise.all([buyerApi.purchaseHistory(), buyerApi.activeOrders()]);
      setPurchaseHistory(history.data.data);
      setActiveOrders(active.data.data);
    } catch {
      setBuyer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await buyerApi.register(form);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register buyer profile');
    }
  };

  if (isLoading) return <div className="skeleton h-40 w-full" />;

  if (!buyer) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="Complete Your Buyer Profile" subtitle="Register your business to start placing orders" />
        <div className="glass-card p-6">
          {error && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-300">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <FormField label="Business Name">
              <input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Address">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude">
                <input type="number" step="any" value={form.gpsLat} onChange={(e) => setForm({ ...form, gpsLat: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Longitude">
                <input type="number" step="any" value={form.gpsLng} onChange={(e) => setForm({ ...form, gpsLng: e.target.value })} className={inputClass} />
              </FormField>
            </div>
            <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Register</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={buyer.business_name} subtitle={buyer.address} />

      <div className="glass-card mb-6 p-6">
        <h3 className="mb-3 font-semibold text-neutral-800 dark:text-neutral-100">Active Orders</h3>
        <DataTable
          rows={activeOrders}
          emptyMessage="No active orders"
          columns={[
            { key: 'crop_name', header: 'Product' },
            { key: 'quantity', header: 'Qty', render: (r) => `${r.quantity} ${r.unit}` },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-3 font-semibold text-neutral-800 dark:text-neutral-100">Purchase History</h3>
        <DataTable
          rows={purchaseHistory}
          emptyMessage="No past purchases"
          columns={[
            { key: 'crop_name', header: 'Product' },
            { key: 'quantity', header: 'Qty', render: (r) => `${r.quantity} ${r.unit}` },
            { key: 'total_amount', header: 'Amount', render: (r) => (r.total_amount ? `₹${r.total_amount}` : '—') },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            { key: 'order_date', header: 'Date', render: (r) => new Date(r.order_date).toLocaleDateString() },
          ]}
        />
      </div>
    </div>
  );
}
