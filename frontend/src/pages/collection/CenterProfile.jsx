import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, X, Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { collectionApi } from '../../api/endpoints';

export default function CenterProfile() {
  const { id } = useParams();
  const [center, setCenter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [farmerId, setFarmerId] = useState('');
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await collectionApi.getOne(id);
      setCenter(data.data);
      setForm({
        centerName: data.data.center_name,
        address: data.data.address || '',
        capacityKg: data.data.capacity_kg || '',
        contactPhone: data.data.contact_phone || '',
        contactEmail: data.data.contact_email || '',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await collectionApi.update(id, form);
    setEditOpen(false);
    load();
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!farmerId) return;
    await collectionApi.assignFarmer(id, farmerId);
    setFarmerId('');
    setAssignOpen(false);
    load();
  };

  const handleUnassign = async (fid) => {
    await collectionApi.unassignFarmer(id, fid);
    load();
  };

  if (isLoading || !center) return <div className="skeleton h-40 w-full" />;

  return (
    <div>
      <PageHeader
        title={center.center_name}
        subtitle={center.address}
        action={
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-brand-50">
            <Pencil size={14} /> Edit
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-sm text-neutral-400">Capacity</p>
          <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{center.capacity_kg ? `${center.capacity_kg} kg` : '—'}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-neutral-400">Contact Phone</p>
          <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{center.contact_phone || '—'}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-neutral-400">Contact Email</p>
          <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{center.contact_email || '—'}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Assigned Farmers</h3>
          <button onClick={() => setAssignOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
            <Plus size={14} /> Assign Farmer
          </button>
        </div>

        {center.assignedFarmers?.length === 0 ? (
          <p className="text-sm text-neutral-500">No farmers assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {center.assignedFarmers?.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-100">{f.full_name}</p>
                  <p className="text-xs text-neutral-500">{f.email}</p>
                </div>
                <button onClick={() => handleUnassign(f.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Collection Center">
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormField label="Center Name">
            <input value={form.centerName} onChange={(e) => setForm({ ...form, centerName: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Address">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Capacity (kg)">
            <input type="number" step="any" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Phone">
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Contact Email">
              <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Farmer">
        <form onSubmit={handleAssign} className="space-y-4">
          <FormField label="Farmer ID">
            <input required value={farmerId} onChange={(e) => setFarmerId(e.target.value)} className={inputClass} placeholder="Paste farmer ID from Farmers page" />
          </FormField>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Assign</button>
        </form>
      </Modal>
    </div>
  );
}
