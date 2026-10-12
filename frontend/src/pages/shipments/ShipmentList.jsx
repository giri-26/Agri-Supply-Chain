import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Truck, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import StatusPill from '../../components/StatusPill';
import { shipmentApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['pending', 'pickup', 'dispatched', 'in_transit', 'delivered', 'cancelled'];
const emptyForm = { productId: '', vehicleId: '', driverId: '', originType: 'warehouse', originId: '', destinationType: 'retailer', destinationId: '', estimatedArrival: '' };

export default function ShipmentList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', vehicleType: '', capacityKg: '' });
  const canManage = user.role === 'admin' || user.role === 'transporter';

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await shipmentApi.list({ search, status: statusFilter, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (canManage) {
      shipmentApi.listVehicles().then(({ data }) => setVehicles(data.data));
      shipmentApi.listDrivers().then(({ data }) => setDrivers(data.data));
    }
  }, [canManage]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await shipmentApi.create(form);
    setModalOpen(false);
    setForm(emptyForm);
    load();
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    await shipmentApi.createVehicle(vehicleForm);
    setVehicleModalOpen(false);
    setVehicleForm({ vehicleNumber: '', vehicleType: '', capacityKg: '' });
    shipmentApi.listVehicles().then(({ data }) => setVehicles(data.data));
  };

  const handleStatusChange = async (id, status) => {
    await shipmentApi.updateStatus(id, { status });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Shipments"
        subtitle="Assign vehicles/drivers and track deliveries"
        action={
          <div className="flex flex-wrap gap-3">
            <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search shipments..." />
            <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className={`${inputClass} w-auto`}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            {canManage && (
              <button onClick={() => setVehicleModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-brand-50">
                <Truck size={16} /> Vehicle
              </button>
            )}
            {canManage && (
              <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                <Plus size={16} /> New Shipment
              </button>
            )}
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No shipments yet"
          columns={[
            { key: 'tracking_id', header: 'Tracking ID' },
            { key: 'crop_name', header: 'Product' },
            { key: 'vehicle_number', header: 'Vehicle', render: (r) => r.vehicle_number || '—' },
            { key: 'driver_name', header: 'Driver', render: (r) => r.driver_name || '—' },
            {
              key: 'status',
              header: 'Status',
              render: (r) =>
                canManage ? (
                  <select value={r.status} onChange={(e) => handleStatusChange(r.id, e.target.value)} className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                ) : (
                  <StatusPill status={r.status} />
                ),
            },
            { key: 'estimated_arrival', header: 'ETA', render: (r) => (r.estimated_arrival ? new Date(r.estimated_arrival).toLocaleDateString() : '—') },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <button onClick={() => navigate(`/dashboard/shipments/${r.id}`)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <Eye size={16} />
                </button>
              ),
            },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Shipment">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Product ID">
            <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputClass} placeholder="Paste product ID" />
          </FormField>
          <FormField label="Vehicle">
            <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={inputClass}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>)}
            </select>
          </FormField>
          <FormField label="Driver">
            <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={inputClass}>
              <option value="">Select driver</option>
              {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Origin Type">
              <select value={form.originType} onChange={(e) => setForm({ ...form, originType: e.target.value })} className={inputClass}>
                <option value="warehouse">Warehouse</option>
                <option value="collection_center">Collection Center</option>
              </select>
            </FormField>
            <FormField label="Origin ID">
              <input required value={form.originId} onChange={(e) => setForm({ ...form, originId: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Destination Type">
              <select value={form.destinationType} onChange={(e) => setForm({ ...form, destinationType: e.target.value })} className={inputClass}>
                <option value="retailer">Retailer</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </FormField>
            <FormField label="Destination ID">
              <input required value={form.destinationId} onChange={(e) => setForm({ ...form, destinationId: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Estimated Arrival">
            <input type="datetime-local" value={form.estimatedArrival} onChange={(e) => setForm({ ...form, estimatedArrival: e.target.value })} className={inputClass} />
          </FormField>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Create Shipment</button>
        </form>
      </Modal>

      <Modal isOpen={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} title="Register Vehicle">
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <FormField label="Vehicle Number">
            <input required value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Vehicle Type">
            <input value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })} className={inputClass} placeholder="Mini Truck, Van, etc." />
          </FormField>
          <FormField label="Capacity (kg)">
            <input type="number" step="any" value={vehicleForm.capacityKg} onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: e.target.value })} className={inputClass} />
          </FormField>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Register Vehicle</button>
        </form>
      </Modal>
    </div>
  );
}
