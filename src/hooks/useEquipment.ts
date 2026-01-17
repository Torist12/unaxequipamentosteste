import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/database';
import { toast } from 'sonner';

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          category:categories(*),
          current_user:users(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Equipment[];
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category_id: string | null;
      patrimony_number: string;
      status: string;
    }) => {
      // Check for duplicate patrimony number
      const { data: existing, error: checkError } = await supabase
        .from('equipment')
        .select('id')
        .eq('patrimony_number', data.patrimony_number)
        .maybeSingle();
      
      if (checkError) throw checkError;
      if (existing) throw new Error('Já existe um equipamento com este número de patrimônio');
      
      const qr_code = `EQ-${data.patrimony_number}`;
      
      const { data: result, error } = await supabase
        .from('equipment')
        .insert({ ...data, qr_code })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Equipment> & { id: string }) => {
      // If updating patrimony_number, check for duplicates and update qr_code
      if (data.patrimony_number) {
        const { data: existing, error: checkError } = await supabase
          .from('equipment')
          .select('id')
          .eq('patrimony_number', data.patrimony_number)
          .neq('id', id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        if (existing) throw new Error('Já existe um equipamento com este número de patrimônio');
        
        // Update qr_code to match new patrimony
        data.qr_code = `EQ-${data.patrimony_number}`;
      }
      
      const { error } = await supabase
        .from('equipment')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento excluído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}
