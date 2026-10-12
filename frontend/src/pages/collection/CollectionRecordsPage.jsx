import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import StatusPill from '../../components/StatusPill';
import { collectionApi } from '../../api/endpoints';

export default function CollectionRecordsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', collectionCenterId: '', decision: 'accepted', qualityNotes: '', verifiedWeight: '', rejectionReason: '' });

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await collectionApi.listRecords({ page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openModal = (decision) => {
    setForm({ productId: '', collectionCenterId: '', decision, qualityNotes: '', verifiedWeight: '', rejectionReason: '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await collectionApi.createRecord(form);
    setModalOpen(false);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Collection Records"
        subtitle="Scan and verify incoming product deliveries"
        action={
          <div className="flex gap-3">
            <button onClick={() => openModal('accepted')} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <CheckCircle2 size={16} /> Accept Delivery
            </button>
            <button onClick={() => openModal('rejected')} className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
              <XCircle size={16} /> Reject Delivery
            </button>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No collection records yet"
          columns={[
            { key: 'crop_name', header: 'Product' },
            { key: 'tracking_id', header: 'Tracking ID' },
            { key: 'decision', header: 'Decision', render: (r) => <StatusPill status={r.decision} /> },
            { key: 'verified_weight', header: 'Verified Weight', render: (r) => (r.verified_weight ? `${r.verified_weight} kg` : '—') },
            { key: 'received_at', header: 'Date', render: (r) => new Date(r.received_at).toLocaleString() },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.decision === 'accepted' ? 'Accept Delivery' : 'Reject Delivery'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Product ID">
            <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputClass} placeholder="Paste product ID from Products page" />
          </FormField>
          <FormField label="Collection Center ID">
            <input required value={form.collectionCenterId} onChange={(e) => setForm({ ...form, collectionCenterId: e.target.value })} className={inputClass} placeholder="Paste center ID from Collection Centers page" />
          </FormField>
          {form.decision === 'accepted' ? (
            <>
              <FormField label="Verified Weight (kg)">
                <input type="number" step="any" value={form.verifiedWeight} onChange={(e) => setForm({ ...form, verifiedWeight: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Quality Notes">
                <textarea value={form.qualityNotes} onChange={(e) => setForm({ ...form, qualityNotes: e.target.value })} className={inputClass} rows={3} />
              </FormField>
            </>
          ) : (
            <FormField label="Rejection Reason">
              <textarea value={form.rejectionReason} onChange={(e) => setForm({ ...form, rejectionReason: e.target.value })} className={inputClass} rows={3} />
            </FormField>
          )}
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Submit</button>
        </form>
      </Modal>
    </div>
  );
}
