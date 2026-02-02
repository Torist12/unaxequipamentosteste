import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          current_user:users!vehicles_current_user_id_fkey(id, name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Vehicle[];
    },
  });
}

export function useAvailableVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'Disponível')
        .order('plate', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Vehicle[];
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (vehicle: { plate: string; model: string }) => {
      // Normaliza a placa para maiúsculas
      const normalizedPlate = vehicle.plate.toUpperCase().replace('-', '');
      const formattedPlate = normalizedPlate.length === 7 
        ? `${normalizedPlate.slice(0, 3)}-${normalizedPlate.slice(3)}`
        : vehicle.plate.toUpperCase();

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate: formattedPlate,
          model: vehicle.model,
          status: 'Disponível',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Esta placa já está cadastrada');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Veículo cadastrado!',
        description: 'Veículo adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Vehicle> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Veículo atualizado!',
        description: 'Alterações salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verifica se o veículo está em uso
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('status')
        .eq('id', id)
        .single();

      if (vehicle?.status === 'Em uso') {
        throw new Error('Não é possível excluir um veículo em uso');
      }

      // Exclui viagens associadas (CASCADE já cuida disso, mas por segurança)
      const { error } = await supabase.from('vehicles').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Veículo excluído!',
        description: 'Veículo removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
