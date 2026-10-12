import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StatCard from '../../components/StatCard';
import { adminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setIsLoading(false);
      return;
    }
    adminApi
      .dashboardStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          Welcome, {user?.fullName}
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Your role-specific dashboard widgets for <span className="capitalize">{user?.role?.replace('_', ' ')}</span> will
          appear here as each module is built out.
        </p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">System-wide overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Farmers" value={stats?.totalFarmers ?? 0} icon="Sprout" accent="brand" />
        <StatCard label="Total Products" value={stats?.totalProducts ?? 0} icon="Package" accent="blue" />
        <StatCard label="Today's Shipments" value={stats?.todaysShipments ?? 0} icon="Truck" accent="amber" />
        <StatCard label="Low Stock Alerts" value={stats?.lowStockAlerts ?? 0} icon="AlertTriangle" accent="red" />
        <StatCard label="Orders Today" value={stats?.ordersToday ?? 0} icon="ShoppingCart" accent="brand" />
        <StatCard label="Unread Alerts" value={stats?.unreadAlerts ?? 0} icon="Bell" accent="amber" />
      </div>
    </div>
  );
}
