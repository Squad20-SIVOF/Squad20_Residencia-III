import { useEffect } from 'react';
import L, { type LatLngBoundsExpression, type LatLngExpression } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Trip } from '../../types';
import styles from './RouteMap.module.scss';
import { useTheme } from '@/hooks/useTheme';

const defaultMarkerIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function FitRoute({ positions }: { positions: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => { map.fitBounds(positions, { padding: [40, 40], maxZoom: 15 }); }, [map, positions]);
  return null;
}

interface RouteMapProps { trip: Trip; }
export function RouteMap({ trip }: RouteMapProps) {
  const { isDark } = useTheme();
  const positions: LatLngExpression[] = trip.path;
  return (
    <div className={styles.mapPanel}>
      <MapContainer key={trip.id} center={trip.start} zoom={13} scrollWheelZoom className={styles.map}>
       <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="&copy; OpenStreetMap contributors"
/>
        <FitRoute positions={positions as LatLngBoundsExpression} />
        <Polyline positions={positions} pathOptions={{ color: '#1769c9', weight: 5, opacity: .85 }} />
        <Marker position={trip.start} icon={defaultMarkerIcon}><Popup><strong>Origem</strong><br />{trip.from}</Popup></Marker>
        <Marker position={trip.end} icon={defaultMarkerIcon}><Popup><strong>Destino</strong><br />{trip.to}</Popup></Marker>
      </MapContainer>
      <div className={styles.mapLabel}>Rota #{trip.id} · atualizado {trip.updated}</div>
    </div>
  );
}
