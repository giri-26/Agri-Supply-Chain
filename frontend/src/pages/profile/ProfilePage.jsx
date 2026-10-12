import { useState } from 'react';
import { Camera } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FormField, { inputClass } from '../../components/FormField';
import { profileApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const { data } = await profileApi.update(form);
    setProfileMsg(data.message);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await profileApi.uploadPhoto(formData);
    setPhotoPreview(data.data.profile_photo);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');
    try {
      const { data } = await profileApi.changePassword(passwordForm);
      setPasswordMsg(data.message);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account details" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-16 w-16">
              <img
                src={photoPreview ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '')}${photoPreview}` : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName}`}
                alt={user?.fullName}
                className="h-16 w-16 rounded-full object-cover border-2 border-brand-200"
              />
              <label className="absolute bottom-0 right-0 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-brand-600 text-white">
                <Camera size={12} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-100">{user?.fullName}</p>
              <p className="text-sm text-neutral-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          {profileMsg && <div className="mb-4 rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3 text-sm text-brand-700 dark:text-brand-300">{profileMsg}</div>}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <FormField label="Full Name">
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </FormField>
            <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Save Changes</button>
          </form>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">Change Password</h3>
          {passwordMsg && <div className="mb-4 rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3 text-sm text-brand-700 dark:text-brand-300">{passwordMsg}</div>}
          {passwordError && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-300">{passwordError}</div>}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormField label="Current Password">
              <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="New Password">
              <input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className={inputClass} placeholder="Min 8 chars, upper/lower/number/symbol" />
            </FormField>
            <button type="submit" className="w-full rounded-xl bg-neutral-800 dark:bg-neutral-700 py-2.5 text-sm font-medium text-white hover:bg-neutral-900">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
