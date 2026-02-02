import { useState } from 'react';
import { Vehicle } from '@/types/database';
import { useDeleteVehicle, useUpdateVehicle } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pencil, Trash2, Check, X, Car } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

const VEHICLE_STATUSES = ['Disponível', 'Em uso', 'Manutenção'] as const;

export function VehicleList({ vehicles, isLoading }: VehicleListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});

  const deleteVehicle = useDeleteVehicle();
  const updateVehicle = useUpdateVehicle();

  const startEditing = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setEditData({
      plate: vehicle.plate,
      model: vehicle.model,
      status: vehicle.status,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = async () => {
    if (!editingId) return;

    try {
      await updateVehicle.mutateAsync({
        id: editingId,
        ...editData,
      });
      setEditingId(null);
      setEditData({});
    } catch (error) {
      // Toast já é exibido no hook
    }
  };

  if (isLoading) {
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

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum veículo cadastrado</h3>
          <p className="text-muted-foreground">
            Clique em "Novo Veículo" para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Placa</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usuário Atual</TableHead>
            <TableHead>Cadastrado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-mono font-medium">
                {editingId === vehicle.id ? (
                  <Input
                    value={editData.plate || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, plate: e.target.value.toUpperCase() })
                    }
                    className="w-28 uppercase"
                  />
                ) : (
                  vehicle.plate
                )}
              </TableCell>
              <TableCell>
                {editingId === vehicle.id ? (
                  <Input
                    value={editData.model || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, model: e.target.value })
                    }
                    className="w-40"
                  />
                ) : (
                  vehicle.model
                )}
              </TableCell>
              <TableCell>
                {editingId === vehicle.id ? (
                  <Select
                    value={editData.status}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        status: value as Vehicle['status'],
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={vehicle.status} />
                )}
              </TableCell>
              <TableCell>
                {vehicle.current_user?.name || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(vehicle.created_at), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right">
                {editingId === vehicle.id ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={saveEditing}
                      disabled={updateVehicle.isPending}
                    >
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={cancelEditing}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(vehicle)}
                      disabled={vehicle.status === 'Em uso'}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={vehicle.status === 'Em uso'}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O veículo <strong>{vehicle.plate}</strong> e todo seu
                            histórico de viagens serão removidos. Esta ação não
                            pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteVehicle.mutate(vehicle.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
