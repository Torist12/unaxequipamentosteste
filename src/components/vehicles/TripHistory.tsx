import { useState, useMemo } from 'react';
import { VehicleTrip, Vehicle } from '@/types/database';
import { useVehicleTrips, useTripPoints } from '@/hooks/useVehicleTrips';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TripMap } from './TripMap';
import { ExportDropdown } from '@/components/ExportDropdown';
import { generateTripPdfReport, generateTripExcelReport } from '@/lib/vehicleReport';
import {
  History,
  Car,
  MapPin,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TripHistory() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const { data: trips = [], isLoading: loadingTrips } = useVehicleTrips();
  const { data: vehicles = [] } = useVehicles();
  const { data: selectedTripPoints = [] } = useTripPoints(selectedTripId);

  // Filtra viagens
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (selectedVehicleId !== 'all' && trip.vehicle_id !== selectedVehicleId) {
        return false;
      }
      if (dateFilter) {
        const tripDate = format(new Date(trip.start_time), 'yyyy-MM-dd');
        if (tripDate !== dateFilter) {
          return false;
        }
      }
      return true;
    });
  }, [trips, selectedVehicleId, dateFilter]);

  // Calcula duração da viagem
  const calculateDuration = (trip: VehicleTrip): string => {
    if (!trip.end_time) return 'Em andamento';

    const minutes = differenceInMinutes(
      new Date(trip.end_time),
      new Date(trip.start_time)
    );

    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Toggle expansão
  const toggleExpand = (tripId: string) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      setSelectedTripId(null);
    } else {
      setExpandedTripId(tripId);
      setSelectedTripId(tripId);
    }
  };

  // Limpa filtros
  const clearFilters = () => {
    setSelectedVehicleId('all');
    setDateFilter('');
  };

  if (loadingTrips) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Exportação */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Viagens
            </CardTitle>
            <ExportDropdown
              onExportPDF={() => generateTripPdfReport(filteredTrips)}
              onExportExcel={() => generateTripExcelReport(filteredTrips)}
              disabled={filteredTrips.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="gap-2"
                disabled={selectedVehicleId === 'all' && !dateFilter}
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de viagens */}
      {filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma viagem encontrada</h3>
            <p className="text-muted-foreground">
              {trips.length === 0
                ? 'Ainda não há viagens registradas.'
                : 'Nenhuma viagem corresponde aos filtros selecionados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              className={expandedTripId === trip.id ? 'border-primary' : ''}
            >
              <CardContent className="p-0">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(trip.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {(trip.vehicle as any)?.plate || 'Veículo'} -{' '}
                          {(trip.vehicle as any)?.model || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(trip.user as any)?.name || 'Usuário'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(trip.start_time), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {calculateDuration(trip)}
                        </p>
                      </div>
                      <StatusBadge status={trip.status} />
                      {expandedTripId === trip.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Info mobile */}
                  <div className="md:hidden mt-2 text-sm text-muted-foreground">
                    {format(new Date(trip.start_time), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}{' '}
                    • {calculateDuration(trip)}
                  </div>
                </div>

                {/* Mapa expandido */}
                {expandedTripId === trip.id && (
                  <div className="border-t p-4">
                    <TripMap
                      points={selectedTripPoints}
                      height="300px"
                      showControls={true}
                    />

                    {selectedTripPoints.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <MapPin className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Pontos</p>
                          <p className="font-medium">{selectedTripPoints.length}</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Duração</p>
                          <p className="font-medium">{calculateDuration(trip)}</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="h-5 w-5 mx-auto mb-1 rounded-full bg-destructive" />
                          <p className="text-sm text-muted-foreground">Paradas</p>
                          <p className="font-medium">
                            {selectedTripPoints.filter((p) => p.is_stop).length}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Tempo Parado</p>
                          <p className="font-medium">
                            {Math.round(
                              selectedTripPoints
                                .filter((p) => p.is_stop)
                                .reduce((acc, p) => acc + p.stop_duration_seconds, 0) / 60
                            )}
                            min
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
