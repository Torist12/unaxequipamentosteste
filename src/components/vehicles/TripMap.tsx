import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { VehicleTripPoint } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ícone para paradas
const stopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone para posição atual
const currentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface TripMapProps {
  points: VehicleTripPoint[];
  currentPosition?: { lat: number; lng: number } | null;
  height?: string;
  showControls?: boolean;
}

// Componente para ajustar o mapa aos pontos
function MapBoundsAdjuster({ points, currentPosition }: { 
  points: VehicleTripPoint[]; 
  currentPosition?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const allPoints: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
    
    if (currentPosition) {
      allPoints.push([currentPosition.lat, currentPosition.lng]);
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, currentPosition, map]);

  return null;
}

export function TripMap({ 
  points, 
  currentPosition, 
  height = '400px',
  showControls = true 
}: TripMapProps) {
  // Centro padrão (São Paulo) caso não haja pontos
  const defaultCenter: [number, number] = [-23.5505, -46.6333];

  const center = useMemo(() => {
    if (currentPosition) {
      return [currentPosition.lat, currentPosition.lng] as [number, number];
    }
    if (points.length > 0) {
      return [points[0].latitude, points[0].longitude] as [number, number];
    }
    return defaultCenter;
  }, [points, currentPosition]);

  // Linha da rota
  const routePositions = useMemo(() => {
    const positions: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
    if (currentPosition) {
      positions.push([currentPosition.lat, currentPosition.lng]);
    }
    return positions;
  }, [points, currentPosition]);

  // Paradas
  const stops = useMemo(() => {
    return points.filter((p) => p.is_stop);
  }, [points]);

  // Formata duração da parada
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  if (points.length === 0 && !currentPosition) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma rota disponível</h3>
          <p className="text-muted-foreground">
            Os pontos GPS aparecerão aqui durante a viagem.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsAdjuster points={points} currentPosition={currentPosition} />

        {/* Linha da rota */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="hsl(var(--primary))"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Marcador de início */}
        {points.length > 0 && (
          <Marker position={[points[0].latitude, points[0].longitude]}>
            <Popup>
              <div className="text-center">
                <Navigation className="h-4 w-4 inline mr-1" />
                <strong>Início</strong>
                <br />
                <small className="text-muted-foreground">
                  {new Date(points[0].recorded_at).toLocaleTimeString('pt-BR')}
                </small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de paradas */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
          >
            <Popup>
              <div className="text-center">
                <Clock className="h-4 w-4 inline mr-1" />
                <strong>Parada</strong>
                <br />
                <span className="font-medium">
                  {formatDuration(stop.stop_duration_seconds)}
                </span>
                <br />
                <small className="text-muted-foreground">
                  {new Date(stop.recorded_at).toLocaleTimeString('pt-BR')}
                </small>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Posição atual */}
        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={currentIcon}
          >
            <Popup>
              <div className="text-center">
                <Navigation className="h-4 w-4 inline mr-1 text-green-600" />
                <strong>Posição Atual</strong>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {showControls && points.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>{points.length} pontos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>{stops.length} paradas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
