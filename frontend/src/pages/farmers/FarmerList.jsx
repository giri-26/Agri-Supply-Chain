import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { farmerApi } from '../../api/endpoints';

export default function FarmerList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await farmerApi.list({ search, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await farmerApi.create(form);
      setSuccessMsg(`${data.message} Temporary password: ${data.data.tempPassword}`);
      setForm({ fullName: '', email: '', phone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create farmer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this farmer? This cannot be undone.')) return;
    await farmerApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Farmers"
        subtitle="Manage registered farmers"
        action={
          <div className="flex gap-3">
            <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search farmers..." />
            <button
              onClick={() => { setIsModalOpen(true); setSuccessMsg(''); setError(''); }}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} /> Add Farmer
            </button>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No farmers registered yet"
          columns={[
            { key: 'full_name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
            {
              key: 'is_active',
              header: 'Status',
              render: (r) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.is_active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-neutral-200 text-neutral-600'}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/dashboard/farmers/${r.id}`)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Farmer">
        {successMsg ? (
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-4 text-sm text-brand-700 dark:text-brand-300">{successMsg}</div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-300">{error}</div>}
            <FormField label="Full Name">
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </FormField>
            <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              Create Farmer
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
