import { useEffect, useState, useCallback } from 'react';
import { Check, X, Power } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { inputClass } from '../../components/FormField';
import { adminApi } from '../../api/endpoints';

const ROLES = ['admin', 'farmer', 'collection_center', 'warehouse_manager', 'transporter', 'retailer', 'buyer', 'customer'];

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.listUsers({ search, role, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => { await adminApi.approveUser(id); load(); };
  const reject = async (id) => { await adminApi.rejectUser(id); load(); };
  const toggleActive = async (id, isActive) => { await adminApi.setUserActive(id, !isActive); load(); };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Approve registrations and manage accounts"
        action={
          <div className="flex flex-wrap gap-3">
            <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search users..." />
            <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} className={`${inputClass} w-auto`}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
        }
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No users found"
          columns={[
            { key: 'full_name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', render: (r) => <span className="capitalize">{r.role.replace('_', ' ')}</span> },
            {
              key: 'is_approved',
              header: 'Approval',
              render: (r) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.is_approved ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                  {r.is_approved ? 'Approved' : 'Pending'}
                </span>
              ),
            },
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
                  {!r.is_approved && (
                    <>
                      <button onClick={() => approve(r.id)} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30" title="Approve">
                        <Check size={16} />
                      </button>
                      <button onClick={() => reject(r.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" title="Reject">
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <button onClick={() => toggleActive(r.id, r.is_active)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" title={r.is_active ? 'Deactivate' : 'Activate'}>
                    <Power size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
