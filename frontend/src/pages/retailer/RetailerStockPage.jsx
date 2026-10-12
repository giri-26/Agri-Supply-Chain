import { useEffect, useState, useCallback } from 'react';
import { PackageCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { retailerApi } from '../../api/endpoints';

export default function RetailerStockPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ shipmentId: '', productId: '', quantity: '' });

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await retailerApi.stock({ search, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleReceive = async (e) => {
    e.preventDefault();
    await retailerApi.receive(form);
    setModalOpen(false);
    setForm({ shipmentId: '', productId: '', quantity: '' });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Stock on Hand"
        subtitle="Received inventory at your store"
        action={
          <div className="flex gap-3">
            <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search stock..." />
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <PackageCheck size={16} /> Receive Shipment
            </button>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No stock received yet"
          columns={[
            { key: 'crop_name', header: 'Product' },
            { key: 'quantity', header: 'Quantity', render: (r) => `${r.quantity} ${r.unit}` },
            { key: 'received_at', header: 'Received', render: (r) => new Date(r.received_at).toLocaleString() },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Receive Shipment">
        <form onSubmit={handleReceive} className="space-y-4">
          <FormField label="Shipment ID">
            <input required value={form.shipmentId} onChange={(e) => setForm({ ...form, shipmentId: e.target.value })} className={inputClass} placeholder="Paste shipment ID from Shipments page" />
          </FormField>
          <FormField label="Product ID">
            <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputClass} placeholder="Paste product ID" />
          </FormField>
          <FormField label="Quantity Verified">
            <input required type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
          </FormField>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Confirm Receipt</button>
        </form>
      </Modal>
    </div>
  );
}
