import { useEffect, useState, useCallback } from 'react';
import { Plus, Check, X, Ban, History } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import StatusPill from '../../components/StatusPill';
import { orderApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { retailerId: '', productId: '', quantity: '', totalAmount: '', customerName: '', notes: '' };

export default function OrderList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const limit = 10;
  const canManage = user.role === 'admin' || user.role === 'retailer';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await orderApi.list({ status: statusFilter, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await orderApi.create(form);
    setModalOpen(false);
    setForm(emptyForm);
    load();
  };

  const act = async (fn, id) => {
    await fn(id);
    load();
  };

  const viewHistory = async (id) => {
    const { data } = await orderApi.history(id);
    setHistory(data.data);
    setHistoryOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Create, accept, reject, and track orders"
        action={
          <div className="flex flex-wrap gap-3">
            <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className={`${inputClass} w-auto`}>
              <option value="">All statuses</option>
              {['placed', 'accepted', 'rejected', 'cancelled', 'fulfilled'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Plus size={16} /> New Order
            </button>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No orders yet"
          columns={[
            { key: 'crop_name', header: 'Product' },
            { key: 'store_name', header: 'Retailer' },
            { key: 'customer_name', header: 'Customer', render: (r) => r.customer_name || r.buyer_business_name || '—' },
            { key: 'quantity', header: 'Qty', render: (r) => `${r.quantity} ${r.unit}` },
            { key: 'total_amount', header: 'Amount', render: (r) => (r.total_amount ? `₹${r.total_amount}` : '—') },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex gap-1.5">
                  {canManage && r.status === 'placed' && (
                    <>
                      <button onClick={() => act(orderApi.accept, r.id)} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30" title="Accept">
                        <Check size={16} />
                      </button>
                      <button onClick={() => act(orderApi.reject, r.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" title="Reject">
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {['placed', 'accepted'].includes(r.status) && (
                    <button onClick={() => act(orderApi.cancel, r.id)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Cancel">
                      <Ban size={16} />
                    </button>
                  )}
                  {canManage && r.status === 'accepted' && (
                    <button onClick={() => act(orderApi.fulfill, r.id)} className="rounded-lg px-2 py-1 text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" title="Mark fulfilled">
                      Fulfill
                    </button>
                  )}
                  <button onClick={() => viewHistory(r.id)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="History">
                    <History size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Retailer ID">
            <input required value={form.retailerId} onChange={(e) => setForm({ ...form, retailerId: e.target.value })} className={inputClass} placeholder="Paste retailer ID" />
          </FormField>
          <FormField label="Product ID">
            <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputClass} placeholder="Paste product ID" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantity">
              <input required type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Total Amount">
              <input type="number" step="any" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Customer Name (for walk-in sales)">
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={2} />
          </FormField>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Place Order</button>
        </form>
      </Modal>

      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Order Status History">
        <ol className="relative space-y-4 border-l border-brand-200 dark:border-brand-800 pl-5">
          {history.map((h) => (
            <li key={h.id}>
              <p className="text-sm font-medium capitalize text-neutral-800 dark:text-neutral-100">{h.status}</p>
              <p className="text-xs text-neutral-500">
                {new Date(h.changed_at).toLocaleString()} {h.changed_by_name && `· by ${h.changed_by_name}`}
              </p>
              {h.notes && <p className="text-xs text-neutral-500">{h.notes}</p>}
            </li>
          ))}
        </ol>
      </Modal>
    </div>
  );
}
