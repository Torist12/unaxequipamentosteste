import { MainLayout } from '@/components/layout/MainLayout';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { VehicleList } from '@/components/vehicles/VehicleList';
import { TripTracker } from '@/components/vehicles/TripTracker';
import { TripHistory } from '@/components/vehicles/TripHistory';
import { ExportDropdown } from '@/components/ExportDropdown';
import {
  generateVehiclePdfReport,
  generateVehicleExcelReport,
} from '@/lib/vehicleReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, ClipboardList, Navigation, History } from 'lucide-react';

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading } = useVehicles();

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Car className="h-8 w-8 text-primary" />
              Veículos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a frota de veículos e rastreie viagens
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="register" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Cadastro</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Uso de Veículos</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Cadastro */}
          <TabsContent value="register" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''} cadastrado
                  {vehicles.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ExportDropdown
                  onExportPDF={() => generateVehiclePdfReport(vehicles)}
                  onExportExcel={() => generateVehicleExcelReport(vehicles)}
                  disabled={vehicles.length === 0}
                />
                <VehicleForm />
              </div>
            </div>

            <VehicleList vehicles={vehicles} isLoading={isLoading} />
          </TabsContent>

          {/* Aba Uso de Veículos */}
          <TabsContent value="tracking">
            <TripTracker />
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="history">
            <TripHistory />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
