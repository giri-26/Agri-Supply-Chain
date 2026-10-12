import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, ImagePlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import StatusPill from '../../components/StatusPill';
import { productApi, farmerApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['registered', 'collected', 'in_warehouse', 'in_transit', 'at_retailer', 'sold'];
const UNITS = ['kg', 'g', 'ton', 'lb', 'quintal', 'piece', 'dozen'];

const emptyForm = { farmId: '', categoryId: '', cropName: '', variety: '', harvestDate: '', expectedQuantity: '', unit: 'kg', isOrganic: false };

export default function ProductList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageProductId, setImageProductId] = useState(null);
  const [error, setError] = useState('');

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await productApi.list({ search, status: statusFilter, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    productApi.categories().then(({ data }) => setCategories(data.data));
    if (user?.role === 'farmer') {
      farmerApi.getMe().then(({ data }) => setFarms(data.data.farms || []));
    }
  }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      farmId: product.farm_id,
      categoryId: product.category_id || '',
      cropName: product.crop_name,
      variety: product.variety || '',
      harvestDate: product.harvest_date ? product.harvest_date.slice(0, 10) : '',
      expectedQuantity: product.expected_quantity || '',
      unit: product.unit,
      isOrganic: product.is_organic,
      actualQuantity: product.actual_quantity || '',
      status: product.status,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await productApi.update(editingId, form);
      } else {
        await productApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await productApi.remove(id);
    load();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    await productApi.uploadImages(imageProductId, formData);
    setImageProductId(null);
  };

  return (
    <div>
      <PageHeader
        title="Products / Crops"
        subtitle="Manage registered crops across the network"
        action={
          <div className="flex flex-wrap gap-3">
            <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search products..." />
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className={`${inputClass} w-auto`}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <button onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Plus size={16} /> Add Product
            </button>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No products registered yet"
          columns={[
            { key: 'crop_name', header: 'Crop', render: (r) => (
              <div>
                <p className="font-medium">{r.crop_name} {r.variety && <span className="text-neutral-400">({r.variety})</span>}</p>
                <p className="text-xs text-neutral-400">{r.tracking_id}</p>
              </div>
            ) },
            { key: 'farmer_name', header: 'Farmer' },
            { key: 'category_name', header: 'Category', render: (r) => r.category_name || '—' },
            { key: 'quantity', header: 'Quantity', render: (r) => `${r.actual_quantity || r.expected_quantity || 0} ${r.unit}` },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex gap-2">
                  <button onClick={() => setImageProductId(r.id)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <ImagePlus size={16} />
                  </button>
                  <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <Pencil size={16} />
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-300">{error}</div>}

          {!editingId && (
            <FormField label="Farm">
              <select required value={form.farmId} onChange={(e) => setForm({ ...form, farmId: e.target.value })} className={inputClass}>
                <option value="">Select a farm</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.farm_name}</option>
                ))}
              </select>
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Crop Name">
              <input required value={form.cropName} onChange={(e) => setForm({ ...form, cropName: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Variety">
              <input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} className={inputClass} />
            </FormField>
          </div>

          <FormField label="Category">
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Harvest Date">
              <input type="date" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Unit">
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Expected Quantity">
              <input type="number" step="any" value={form.expectedQuantity} onChange={(e) => setForm({ ...form, expectedQuantity: e.target.value })} className={inputClass} />
            </FormField>
            {editingId && (
              <FormField label="Actual Quantity">
                <input type="number" step="any" value={form.actualQuantity} onChange={(e) => setForm({ ...form, actualQuantity: e.target.value })} className={inputClass} />
              </FormField>
            )}
          </div>

          {editingId && (
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </FormField>
          )}

          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input type="checkbox" checked={form.isOrganic} onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })} />
            Organic
          </label>

          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            {editingId ? 'Save Changes' : 'Register Product'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!imageProductId} onClose={() => setImageProductId(null)} title="Upload Product Images">
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full text-sm" />
      </Modal>
    </div>
  );
}
