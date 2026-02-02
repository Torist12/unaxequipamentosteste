import { useState, useEffect, useCallback, useRef } from 'react';
import { Vehicle, User, VehicleTripPoint } from '@/types/database';
import { useAvailableVehicles } from '@/hooks/useVehicles';
import { useUsers } from '@/hooks/useUsers';
import {
  useStartTrip,
  useEndTrip,
  useAddTripPoint,
  useActiveTrip,
  useTripPoints,
} from '@/hooks/useVehicleTrips';
import { useWatchPosition, calculateDistance } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TripMap } from './TripMap';
import {
  Car,
  Navigation,
  Play,
  Square,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Constantes para detecção de paradas
const STOP_DISTANCE_THRESHOLD = 10; // metros
const STOP_TIME_THRESHOLD = 120; // segundos (2 minutos)

export function TripTracker() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [tripDuration, setTripDuration] = useState(0);
  const [currentTrip, setCurrentTrip] = useState<{
    id: string;
    vehicleId: string;
  } | null>(null);

  // Para detecção de paradas
  const lastPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(
    null
  );
  const stationaryTimeRef = useRef(0);

  const { data: vehicles = [], isLoading: loadingVehicles } = useAvailableVehicles();
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: activeTrip } = useActiveTrip(selectedVehicleId);
  const { data: tripPoints = [] } = useTripPoints(currentTrip?.id || null);

  const startTrip = useStartTrip();
  const endTrip = useEndTrip();
  const addTripPoint = useAddTripPoint();

  // Callback para processar posição
  const handlePositionChange = useCallback(
    (lat: number, lng: number) => {
      if (!currentTrip) return;

      const now = Date.now();
      let isStop = false;
      let stopDuration = 0;

      // Verifica se está parado
      if (lastPositionRef.current) {
        const distance = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng
        );

        if (distance < STOP_DISTANCE_THRESHOLD) {
          const elapsedSeconds = (now - lastPositionRef.current.time) / 1000;
          stationaryTimeRef.current += elapsedSeconds;

          if (stationaryTimeRef.current >= STOP_TIME_THRESHOLD) {
            isStop = true;
            stopDuration = Math.round(stationaryTimeRef.current);
          }
        } else {
          stationaryTimeRef.current = 0;
        }
      }

      lastPositionRef.current = { lat, lng, time: now };

      // Salva o ponto
      addTripPoint.mutate({
        tripId: currentTrip.id,
        latitude: lat,
        longitude: lng,
        isStop,
        stopDurationSeconds: stopDuration,
      });
    },
    [currentTrip, addTripPoint]
  );

  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    isWatching,
    startWatching,
    stopWatching,
  } = useWatchPosition(handlePositionChange, 30000);

  // Timer de duração
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentTrip) {
      interval = setInterval(() => {
        setTripDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTrip]);

  // Formata duração
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // Inicia viagem
  const handleStartTrip = async () => {
    if (!selectedVehicleId || !selectedUserId || latitude === null || longitude === null) {
      return;
    }

    try {
      const trip = await startTrip.mutateAsync({
        vehicleId: selectedVehicleId,
        userId: selectedUserId,
        latitude,
        longitude,
      });

      setCurrentTrip({ id: trip.id, vehicleId: selectedVehicleId });
      setTripDuration(0);
      lastPositionRef.current = { lat: latitude, lng: longitude, time: Date.now() };
      stationaryTimeRef.current = 0;
      startWatching();
    } catch (error) {
      // Toast já exibido no hook
    }
  };

  // Finaliza viagem
  const handleEndTrip = async () => {
    if (!currentTrip || latitude === null || longitude === null) return;

    try {
      await endTrip.mutateAsync({
        tripId: currentTrip.id,
        vehicleId: currentTrip.vehicleId,
        latitude,
        longitude,
      });

      stopWatching();
      setCurrentTrip(null);
      setSelectedVehicleId('');
      setTripDuration(0);
      lastPositionRef.current = null;
      stationaryTimeRef.current = 0;
    } catch (error) {
      // Toast já exibido no hook
    }
  };

  // Conta paradas
  const stopsCount = tripPoints.filter((p) => p.is_stop).length;

  return (
    <div className="space-y-6">
      {/* Seleção de veículo e usuário */}
      {!currentTrip && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Iniciar Viagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Veículo</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={setSelectedVehicleId}
                  disabled={loadingVehicles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {vehicles.length === 0 && !loadingVehicles && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum veículo disponível
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {geoError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{geoError}</AlertDescription>
              </Alert>
            )}

            {geoLoading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Obtendo localização GPS...</AlertDescription>
              </Alert>
            )}

            {latitude !== null && longitude !== null && (
              <Alert>
                <Navigation className="h-4 w-4 text-success" />
                <AlertDescription>
                  GPS ativo: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleStartTrip}
              disabled={
                !selectedVehicleId ||
                !selectedUserId ||
                latitude === null ||
                startTrip.isPending
              }
              className="w-full gap-2"
              size="lg"
            >
              {startTrip.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Iniciar Viagem
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Viagem em andamento */}
      {currentTrip && (
        <>
          <Card className="border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Viagem em Andamento
                </span>
                <span className="text-2xl font-mono">
                  {formatDuration(tripDuration)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium">{formatDuration(tripDuration)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Pontos</p>
                  <p className="font-medium">{tripPoints.length}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Navigation className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-sm text-muted-foreground">Paradas</p>
                  <p className="font-medium">{stopsCount}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div
                    className={`h-5 w-5 mx-auto mb-1 rounded-full ${
                      isWatching ? 'bg-success animate-pulse' : 'bg-muted-foreground'
                    }`}
                  />
                  <p className="text-sm text-muted-foreground">GPS</p>
                  <p className="font-medium">{isWatching ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>

              <Button
                onClick={handleEndTrip}
                variant="destructive"
                disabled={endTrip.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {endTrip.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Finalizar Viagem
              </Button>
            </CardContent>
          </Card>

          {/* Mapa com posição atual */}
          <TripMap
            points={tripPoints}
            currentPosition={
              latitude !== null && longitude !== null
                ? { lat: latitude, lng: longitude }
                : null
            }
            height="400px"
          />
        </>
      )}
    </div>
  );
}
