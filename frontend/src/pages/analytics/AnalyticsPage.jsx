import { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { analyticsApi } from '../../api/endpoints';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [ordersSeries, setOrdersSeries] = useState([]);
  const [shipmentBreakdown, setShipmentBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.ordersChart({ days: 14 }),
      analyticsApi.shipmentsChart(),
    ])
      .then(([ov, orders, shipments]) => {
        setOverview(ov.data.data);
        setOrdersSeries(orders.data.data);
        setShipmentBreakdown(shipments.data.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
    );
  }

  const lineData = {
    labels: ordersSeries.map((d) => new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: ordersSeries.map((d) => d.revenue),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.15)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Orders',
        data: ordersSeries.map((d) => d.orders),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.1)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: shipmentBreakdown.map((s) => s.status),
    datasets: [
      {
        data: shipmentBreakdown.map((s) => s.count),
        backgroundColor: ['#16a34a', '#f59e0b', '#f97316', '#3b82f6', '#ef4444', '#a855f7'],
      },
    ],
  };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, activity, and network health" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Revenue" value={`₹${overview.revenue.toLocaleString()}`} icon="TrendingUp" accent="brand" />
        <StatCard label="Total Farmers" value={overview.totalFarmers} icon="Sprout" accent="brand" />
        <StatCard label="Total Products" value={overview.totalProducts} icon="Package" accent="blue" />
        <StatCard label="Active Shipments" value={overview.activeShipments} icon="Truck" accent="amber" />
        <StatCard label="Pending Orders" value={overview.pendingOrders} icon="ShoppingCart" accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">Orders & Revenue (last 14 days)</h3>
          {ordersSeries.length === 0 ? (
            <p className="text-sm text-neutral-500">No order activity yet.</p>
          ) : (
            <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">Shipment Status</h3>
          {shipmentBreakdown.length === 0 ? (
            <p className="text-sm text-neutral-500">No shipments yet.</p>
          ) : (
            <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
          )}
        </div>
      </div>
    </div>
  );
}
