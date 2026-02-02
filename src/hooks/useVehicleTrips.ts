import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleTrip, VehicleTripPoint } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useVehicleTrips() {
  return useQuery({
    queryKey: ['vehicle-trips'],
    queryFn: async (): Promise<VehicleTrip[]> => {
      const { data, error } = await supabase
        .from('vehicle_trips')
        .select(`
          *,
          vehicle:vehicles(id, plate, model),
          user:users(id, name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as VehicleTrip[];
    },
  });
}

export function useTripsByVehicle(vehicleId: string | null) {
  return useQuery({
    queryKey: ['vehicle-trips', vehicleId],
    queryFn: async (): Promise<VehicleTrip[]> => {
      if (!vehicleId) return [];

      const { data, error } = await supabase
        .from('vehicle_trips')
        .select(`
          *,
          vehicle:vehicles(id, plate, model),
          user:users(id, name, role)
        `)
        .eq('vehicle_id', vehicleId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as VehicleTrip[];
    },
    enabled: !!vehicleId,
  });
}

export function useActiveTrip(vehicleId: string | null) {
  return useQuery({
    queryKey: ['active-trip', vehicleId],
    queryFn: async (): Promise<VehicleTrip | null> => {
      if (!vehicleId) return null;

      const { data, error } = await supabase
        .from('vehicle_trips')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'Em andamento')
        .maybeSingle();

      if (error) throw error;
      return data as unknown as VehicleTrip | null;
    },
    enabled: !!vehicleId,
  });
}

export function useTripPoints(tripId: string | null) {
  return useQuery({
    queryKey: ['trip-points', tripId],
    queryFn: async (): Promise<VehicleTripPoint[]> => {
      if (!tripId) return [];

      const { data, error } = await supabase
        .from('vehicle_trip_points')
        .select('*')
        .eq('trip_id', tripId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as VehicleTripPoint[];
    },
    enabled: !!tripId,
  });
}

export function useStartTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      vehicleId,
      userId,
      latitude,
      longitude,
    }: {
      vehicleId: string;
      userId: string;
      latitude: number;
      longitude: number;
    }) => {
      // Cria a viagem
      const { data: trip, error: tripError } = await supabase
        .from('vehicle_trips')
        .insert({
          vehicle_id: vehicleId,
          user_id: userId,
          status: 'Em andamento',
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Adiciona o ponto inicial
      const { error: pointError } = await supabase
        .from('vehicle_trip_points')
        .insert({
          trip_id: trip.id,
          latitude,
          longitude,
          is_stop: false,
        });

      if (pointError) throw pointError;

      // Atualiza o status do veículo
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          status: 'Em uso',
          current_user_id: userId,
        })
        .eq('id', vehicleId);

      if (vehicleError) throw vehicleError;

      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-trips'] });
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      toast({
        title: 'Viagem iniciada!',
        description: 'GPS ativado. Sua rota está sendo rastreada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao iniciar viagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEndTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      tripId,
      vehicleId,
      latitude,
      longitude,
    }: {
      tripId: string;
      vehicleId: string;
      latitude: number;
      longitude: number;
    }) => {
      // Adiciona o ponto final
      await supabase.from('vehicle_trip_points').insert({
        trip_id: tripId,
        latitude,
        longitude,
        is_stop: false,
      });

      // Finaliza a viagem
      const { error: tripError } = await supabase
        .from('vehicle_trips')
        .update({
          end_time: new Date().toISOString(),
          status: 'Finalizada',
        })
        .eq('id', tripId);

      if (tripError) throw tripError;

      // Libera o veículo
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          status: 'Disponível',
          current_user_id: null,
        })
        .eq('id', vehicleId);

      if (vehicleError) throw vehicleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-trips'] });
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      queryClient.invalidateQueries({ queryKey: ['trip-points'] });
      toast({
        title: 'Viagem finalizada!',
        description: 'Rota salva no histórico.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao finalizar viagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddTripPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      latitude,
      longitude,
      isStop = false,
      stopDurationSeconds = 0,
    }: {
      tripId: string;
      latitude: number;
      longitude: number;
      isStop?: boolean;
      stopDurationSeconds?: number;
    }) => {
      const { error } = await supabase.from('vehicle_trip_points').insert({
        trip_id: tripId,
        latitude,
        longitude,
        is_stop: isStop,
        stop_duration_seconds: stopDurationSeconds,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-points'] });
    },
  });
}
