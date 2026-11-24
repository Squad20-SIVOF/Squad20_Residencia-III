import { useEffect } from 'react';
import L, { type LatLngBoundsExpression, type LatLngExpression } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import type { Trip } from '@/pages/trips/types';
import styles from './RouteMap.module.scss';

const routeMarker = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitRoute({ positions }: { positions: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(positions, { padding: [36, 36], maxZoom: 16 });
  }, [map, positions]);

  return null;
}

export function RouteMap({ trip }: { trip: Trip }) {
  const positions: LatLngExpression[] = trip.path;

  return (
    <section className={styles.mapSection} aria-label={`Mapa da rota ${trip.id}`}>
      <div className={styles.map}>
        <MapContainer
          key={trip.id}
          center={trip.start}
          zoom={13}
          scrollWheelZoom
          className={styles.leafletMap}
        >
          <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="&copy; OpenStreetMap contributors"
/>
          <FitRoute positions={positions as LatLngBoundsExpression} />
          <Polyline
            positions={positions}
            pathOptions={{ color: '#1769c9', weight: 5, opacity: .85  }}
          />
          <Marker position={trip.start} icon={routeMarker}>
            <Popup><strong>Origem:</strong> {trip.from}</Popup>
          </Marker>
          <Marker position={trip.end} icon={routeMarker}>
            <Popup><strong>Destino:</strong> {trip.to}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className={styles.mapLabel}>
        Rota #{trip.id} · Atualizado {trip.updated}
      </div>
    </section>
  );
}

export function RouteSummaryBar({ trip }: { trip: Trip }) {
  return (
    <div className={styles.summary}>
      <span><small>Origem</small>{trip.from}</span>
      <span><small>Destino</small>{trip.to}</span>
      <strong><Navigation size={14} aria-hidden="true" />{trip.distance}</strong>
    </div>
  );
}
