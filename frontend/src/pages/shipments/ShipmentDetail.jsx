import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import FormField, { inputClass } from '../../components/FormField';
import { shipmentApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import 'leaflet/dist/leaflet.css';

export default function ShipmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locForm, setLocForm] = useState({ gpsLat: '', gpsLng: '', note: '' });
  const canManage = user.role === 'admin' || user.role === 'transporter';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await shipmentApi.getOne(id);
      setShipment(data.data);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePushLocation = async (e) => {
    e.preventDefault();
    await shipmentApi.updateLocation(id, locForm);
    setLocForm({ gpsLat: '', gpsLng: '', note: '' });
    load();
  };

  if (isLoading || !shipment) return <div className="skeleton h-64 w-full" />;

  const route = shipment.route || [];
  const positions = route.map((r) => [Number(r.gps_lat), Number(r.gps_lng)]);
  const center = positions.length > 0 ? positions[positions.length - 1] : [20.5937, 78.9629];

  return (
    <div>
      <PageHeader
        title={shipment.tracking_id}
        subtitle={`${shipment.crop_name} · ${shipment.vehicle_number || 'No vehicle'} · Driver: ${shipment.driver_name || '—'}`}
        action={<StatusPill status={shipment.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card overflow-hidden p-2">
          <div className="h-96 overflow-hidden rounded-xl">
            <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {positions.length > 1 && <Polyline positions={positions} color="#16a34a" />}
              {route.map((r, idx) => (
                <Marker key={idx} position={[Number(r.gps_lat), Number(r.gps_lng)]}>
                  <Popup>{r.note || `Point ${idx + 1}`} · {new Date(r.recorded_at).toLocaleString()}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <p className="text-sm text-neutral-400">Estimated Arrival</p>
            <p className="font-medium text-neutral-800 dark:text-neutral-100">
              {shipment.estimated_arrival ? new Date(shipment.estimated_arrival).toLocaleString() : '—'}
            </p>
            {shipment.delay_reason && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Delay: {shipment.delay_reason}</p>
            )}
          </div>

          {canManage && (
            <div className="glass-card p-5">
              <h4 className="mb-3 flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-100">
                <Navigation size={16} /> Push Live Location
              </h4>
              <form onSubmit={handlePushLocation} className="space-y-3">
                <FormField label="Latitude">
                  <input required type="number" step="any" value={locForm.gpsLat} onChange={(e) => setLocForm({ ...locForm, gpsLat: e.target.value })} className={inputClass} />
                </FormField>
                <FormField label="Longitude">
                  <input required type="number" step="any" value={locForm.gpsLng} onChange={(e) => setLocForm({ ...locForm, gpsLng: e.target.value })} className={inputClass} />
                </FormField>
                <FormField label="Note">
                  <input value={locForm.note} onChange={(e) => setLocForm({ ...locForm, note: e.target.value })} className={inputClass} />
                </FormField>
                <button type="submit" className="w-full rounded-xl bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Update Location
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
