import { useEffect, useState, useCallback } from 'react';
import { Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import StatusPill from '../../components/StatusPill';
import { inventoryApi } from '../../api/endpoints';

const TABS = [
  { key: 'available', label: 'Available Stock' },
  { key: 'in', label: 'Incoming Stock' },
  { key: 'out', label: 'Outgoing Stock' },
];

export default function InventoryPage() {
  const [tab, setTab] = useState('available');
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '', gpsLat: '', gpsLng: '' });
  const [batchForm, setBatchForm] = useState({ productId: '', warehouseId: '', quantity: '', expiryDate: '' });

  const limit = 10;

  const loadWarehouses = useCallback(async () => {
    const { data } = await inventoryApi.listWarehouses();
    setWarehouses(data.data);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tab === 'available') {
        const { data } = await inventoryApi.listInventory({ warehouseId, search, page, limit });
        setRows(data.data);
        setTotal(data.total);
      } else {
        const { data } = await inventoryApi.listMovements({ warehouseId, movementType: tab, search, page, limit });
        setRows(data.data);
        setTotal(data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tab, warehouseId, search, page]);

  useEffect(() => { loadWarehouses(); }, [loadWarehouses]);
  useEffect(() => { load(); }, [load]);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    await inventoryApi.createWarehouse(warehouseForm);
    setWarehouseModalOpen(false);
    setWarehouseForm({ name: '', address: '', gpsLat: '', gpsLng: '' });
    loadWarehouses();
  };

  const handleReceiveBatch = async (e) => {
    e.preventDefault();
    await inventoryApi.receiveBatch(batchForm);
    setBatchModalOpen(false);
    setBatchForm({ productId: '', warehouseId: '', quantity: '', expiryDate: '' });
    load();
  };

  const availableColumns = [
    { key: 'crop_name', header: 'Product' },
    { key: 'batch_number', header: 'Batch' },
    { key: 'warehouse_name', header: 'Warehouse' },
    { key: 'quantity', header: 'Quantity', render: (r) => `${r.quantity} ${r.unit}` },
    { key: 'expiry_date', header: 'Expiry', render: (r) => (r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : '—') },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
  ];

  const movementColumns = [
    { key: 'crop_name', header: 'Product' },
    { key: 'warehouse_name', header: 'Warehouse' },
    { key: 'quantity', header: 'Quantity', render: (r) => Number(r.quantity).toFixed(2) },
    { key: 'reference_type', header: 'Reference', render: (r) => r.reference_type?.replace('_', ' ') || '—' },
    { key: 'created_at', header: 'Date', render: (r) => new Date(r.created_at).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track available, incoming, and outgoing stock across warehouses"
        action={
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setWarehouseModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-brand-50">
              <WarehouseIcon size={16} /> New Warehouse
            </button>
            <button onClick={() => setBatchModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Plus size={16} /> Receive Stock
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? 'bg-white dark:bg-neutral-700 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-neutral-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <select value={warehouseId} onChange={(e) => { setPage(1); setWarehouseId(e.target.value); }} className={`${inputClass} w-auto`}>
            <option value="">All warehouses</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search..." />
        </div>
      </div>

      <div className="glass-card">
        <DataTable isLoading={isLoading} rows={rows} columns={tab === 'available' ? availableColumns : movementColumns} emptyMessage="No records found" />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={warehouseModalOpen} onClose={() => setWarehouseModalOpen(false)} title="New Warehouse">
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <FormField label="Name">
            <input required value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Address">
            <input value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitude">
              <input type="number" step="any" value={warehouseForm.gpsLat} onChange={(e) => setWarehouseForm({ ...warehouseForm, gpsLat: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Longitude">
              <input type="number" step="any" value={warehouseForm.gpsLng} onChange={(e) => setWarehouseForm({ ...warehouseForm, gpsLng: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Create Warehouse</button>
        </form>
      </Modal>

      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Receive Stock (Incoming Batch)">
        <form onSubmit={handleReceiveBatch} className="space-y-4">
          <FormField label="Product ID">
            <input required value={batchForm.productId} onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })} className={inputClass} placeholder="Paste product ID from Products page" />
          </FormField>
          <FormField label="Warehouse">
            <select required value={batchForm.warehouseId} onChange={(e) => setBatchForm({ ...batchForm, warehouseId: e.target.value })} className={inputClass}>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantity">
              <input required type="number" step="any" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Expiry Date">
              <input type="date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Receive Into Warehouse</button>
        </form>
      </Modal>
    </div>
  );
}
