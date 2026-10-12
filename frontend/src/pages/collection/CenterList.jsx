import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { collectionApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { centerName: '', address: '', gpsLat: '', gpsLng: '', capacityKg: '', contactPhone: '', contactEmail: '' };

export default function CenterList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await collectionApi.list({ search, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await collectionApi.create(form);
    setModalOpen(false);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id) => {
    if (user.role !== 'admin') return;
    if (!window.confirm('Delete this collection center?')) return;
    await collectionApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Collection Centers"
        subtitle="Manage collection center locations and capacity"
        action={
          <div className="flex gap-3">
            <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search centers..." />
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Plus size={16} /> New Center
            </button>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No collection centers yet"
          columns={[
            { key: 'center_name', header: 'Name' },
            { key: 'address', header: 'Address', render: (r) => r.address || '—' },
            { key: 'capacity_kg', header: 'Capacity', render: (r) => (r.capacity_kg ? `${r.capacity_kg} kg` : '—') },
            { key: 'contact_phone', header: 'Contact', render: (r) => r.contact_phone || '—' },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/dashboard/collection-centers/${r.id}`)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <Eye size={16} />
                  </button>
                  {user.role === 'admin' && (
                    <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Collection Center">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Center Name">
            <input required value={form.centerName} onChange={(e) => setForm({ ...form, centerName: e.target.value })} className={inputClass} />
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
          <FormField label="Capacity (kg)">
            <input type="number" step="any" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Phone">
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Contact Email">
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Create Center</button>
        </form>
      </Modal>
    </div>
  );
}
