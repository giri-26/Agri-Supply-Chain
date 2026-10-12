import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Search, Sprout, Warehouse, Truck, Store, CheckCircle2, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { trackingApi } from '../api/endpoints';

// Default Leaflet marker icons don't load correctly with bundlers unless
// re-pointed at the packaged image assets.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STAGE_ICONS = {
  farm: Sprout,
  collection_center: CheckCircle2,
  warehouse: Warehouse,
  transport: Truck,
  retailer: Store,
};

export default function CustomerTracking() {
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setError('');
    setResult(null);
    setIsLoading(true);
    try {
      const { data } = await trackingApi.track(trackingId.trim());
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No product found for this tracking ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const mapCenter = result?.farm?.lat && result?.farm?.lng ? [result.farm.lat, result.farm.lng] : [22.9734, 78.6569];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Track Your Product</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Enter a tracking ID or scan a product's QR code to see its full journey from farm to shelf.
          </p>
        </div>

        <form onSubmit={handleSearch} className="glass-card mb-6 flex gap-2 p-2">
          <input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="e.g. PRD-260712-4F9A2C"
            className="flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Track
          </button>
        </form>

        {error && (
          <div className="glass-card mb-6 p-4 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Product summary */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    {result.product.cropName} {result.product.variety && `— ${result.product.variety}`}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    From {result.farm.name} · Farmer: {result.farm.farmerName}
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 dark:bg-brand-900/40 px-3 py-1 text-xs font-medium capitalize text-brand-700 dark:text-brand-300">
                  {result.product.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-400">Harvest Date</p>
                  <p className="font-medium text-neutral-700 dark:text-neutral-200">
                    {result.product.harvestDate ? new Date(result.product.harvestDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Quantity</p>
                  <p className="font-medium text-neutral-700 dark:text-neutral-200">
                    {result.product.quantity} {result.product.unit}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Organic</p>
                  <p className="font-medium text-neutral-700 dark:text-neutral-200">
                    {result.product.isOrganic ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Soil Type</p>
                  <p className="font-medium text-neutral-700 dark:text-neutral-200">{result.farm.soilType || '—'}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card p-6">
              <h3 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">Journey Timeline</h3>
              {result.timeline.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No timeline events recorded yet — this product is still at the farm.
                </p>
              ) : (
                <ol className="relative space-y-6 border-l border-brand-200 dark:border-brand-800 pl-6">
                  {result.timeline.map((event, idx) => {
                    const Icon = STAGE_ICONS[event.stage] || CheckCircle2;
                    return (
                      <li key={idx} className="relative">
                        <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white">
                          <Icon size={14} />
                        </span>
                        <p className="text-sm font-medium capitalize text-neutral-800 dark:text-neutral-100">
                          {event.stage.replace('_', ' ')} — {event.status}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {event.location} · {new Date(event.occurred_at).toLocaleString()}
                        </p>
                        {event.notes && <p className="text-xs text-neutral-500">{event.notes}</p>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Map */}
            <div className="glass-card overflow-hidden p-2">
              <div className="h-80 overflow-hidden rounded-xl">
                <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {result.farm.lat && result.farm.lng && (
                    <Marker position={[result.farm.lat, result.farm.lng]}>
                      <Popup>Farm: {result.farm.name}</Popup>
                    </Marker>
                  )}
                  {result.shipments
                    .filter((s) => s.current_lat && s.current_lng)
                    .map((s, idx) => (
                      <Marker key={idx} position={[s.current_lat, s.current_lng]}>
                        <Popup>
                          Shipment {s.shipment_tracking_id} — {s.status}
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
