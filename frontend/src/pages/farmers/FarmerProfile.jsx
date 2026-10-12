import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { farmerApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

export default function FarmerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', idProof: '', bankDetails: '' });
  const [farmForm, setFarmForm] = useState({ farmName: '', address: '', gpsLat: '', gpsLng: '', soilType: '', sizeAcres: '', isOrganic: false });
  const [editingFarmId, setEditingFarmId] = useState(null);

  const isSelf = !id;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = isSelf ? await farmerApi.getMe() : await farmerApi.getOne(id);
      setFarmer(data.data);
      setEditForm({ fullName: data.data.full_name, phone: data.data.phone || '', idProof: data.data.id_proof || '', bankDetails: data.data.bank_details || '' });
    } finally {
      setIsLoading(false);
    }
  }, [id, isSelf]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await farmerApi.update(farmer.id, editForm);
    setEditOpen(false);
    load();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    await farmerApi.uploadPhoto(farmer.id, formData);
    load();
  };

  const openFarmModal = (farm) => {
    if (farm) {
      setEditingFarmId(farm.id);
      setFarmForm({
        farmName: farm.farm_name,
        address: farm.address || '',
        gpsLat: farm.gps_lat || '',
        gpsLng: farm.gps_lng || '',
        soilType: farm.soil_type || '',
        sizeAcres: farm.size_acres || '',
        isOrganic: farm.is_organic,
      });
    } else {
      setEditingFarmId(null);
      setFarmForm({ farmName: '', address: '', gpsLat: '', gpsLng: '', soilType: '', sizeAcres: '', isOrganic: false });
    }
    setFarmModalOpen(true);
  };

  const handleFarmSubmit = async (e) => {
    e.preventDefault();
    if (editingFarmId) {
      await farmerApi.updateFarm(editingFarmId, farmForm);
    } else {
      await farmerApi.addFarm(farmer.id, farmForm);
    }
    setFarmModalOpen(false);
    load();
  };

  const handleFarmDelete = async (farmId) => {
    if (!window.confirm('Delete this farm?')) return;
    await farmerApi.removeFarm(farmId);
    load();
  };

  if (isLoading || !farmer) {
    return <div className="skeleton h-40 w-full" />;
  }

  return (
    <div>
      <PageHeader title={isSelf ? 'My Farmer Profile' : farmer.full_name} subtitle={farmer.email} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            <img
              src={farmer.profile_photo ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '')}${farmer.profile_photo}` : 'https://api.dicebear.com/7.x/initials/svg?seed=' + farmer.full_name}
              alt={farmer.full_name}
              className="h-24 w-24 rounded-full object-cover border-2 border-brand-200"
            />
            <label className="absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-brand-600 text-white shadow">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{farmer.full_name}</h3>
          <p className="text-sm text-neutral-500">{farmer.phone || 'No phone on file'}</p>
          <button
            onClick={() => setEditOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-brand-50"
          >
            <Pencil size={14} /> Edit Profile
          </button>
        </motion.div>

        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Farms</h3>
              <button
                onClick={() => openFarmModal(null)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                <Plus size={14} /> Add Farm
              </button>
            </div>

            {farmer.farms?.length === 0 ? (
              <p className="text-sm text-neutral-500">No farms registered yet.</p>
            ) : (
              <div className="space-y-3">
                {farmer.farms?.map((farm) => (
                  <div key={farm.id} className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{farm.farm_name}</p>
                      <p className="text-xs text-neutral-500">
                        {farm.address} · {farm.size_acres ? `${farm.size_acres} acres` : ''} {farm.is_organic ? '· Organic' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openFarmModal(farm)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleFarmDelete(farm.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Farmer Profile">
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormField label="Full Name">
            <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Phone">
            <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="ID Proof">
            <input value={editForm.idProof} onChange={(e) => setEditForm({ ...editForm, idProof: e.target.value })} className={inputClass} placeholder="Aadhaar / ID number" />
          </FormField>
          <FormField label="Bank Details">
            <input value={editForm.bankDetails} onChange={(e) => setEditForm({ ...editForm, bankDetails: e.target.value })} className={inputClass} placeholder="Account number / IFSC" />
          </FormField>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            Save Changes
          </button>
        </form>
      </Modal>

      <Modal isOpen={farmModalOpen} onClose={() => setFarmModalOpen(false)} title={editingFarmId ? 'Edit Farm' : 'Add Farm'}>
        <form onSubmit={handleFarmSubmit} className="space-y-4">
          <FormField label="Farm Name">
            <input required value={farmForm.farmName} onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Address">
            <input value={farmForm.address} onChange={(e) => setFarmForm({ ...farmForm, address: e.target.value })} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitude">
              <input type="number" step="any" value={farmForm.gpsLat} onChange={(e) => setFarmForm({ ...farmForm, gpsLat: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Longitude">
              <input type="number" step="any" value={farmForm.gpsLng} onChange={(e) => setFarmForm({ ...farmForm, gpsLng: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Soil Type">
              <input value={farmForm.soilType} onChange={(e) => setFarmForm({ ...farmForm, soilType: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Size (acres)">
              <input type="number" step="any" value={farmForm.sizeAcres} onChange={(e) => setFarmForm({ ...farmForm, sizeAcres: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input type="checkbox" checked={farmForm.isOrganic} onChange={(e) => setFarmForm({ ...farmForm, isOrganic: e.target.checked })} />
            Organic farm
          </label>
          <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            {editingFarmId ? 'Save Farm' : 'Add Farm'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
