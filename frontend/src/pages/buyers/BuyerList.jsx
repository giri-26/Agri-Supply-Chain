import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { buyerApi } from '../../api/endpoints';

export default function BuyerList() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const limit = 10;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await buyerApi.list({ search, page, limit });
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="Buyers"
        subtitle="Registered buyer businesses"
        action={<SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search buyers..." />}
      />

      <div className="glass-card">
        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyMessage="No buyers registered yet"
          columns={[
            { key: 'business_name', header: 'Business' },
            { key: 'full_name', header: 'Contact' },
            { key: 'email', header: 'Email' },
            { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
            { key: 'address', header: 'Address', render: (r) => r.address || '—' },
          ]}
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
