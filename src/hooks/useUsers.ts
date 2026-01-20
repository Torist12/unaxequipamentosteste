import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database';
import { toast } from 'sonner';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          department:departments(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data as User[];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      department_id: string | null;
      role: string;
      qr_code?: string;
    }) => {
      const providedQr = (data.qr_code || '').trim().toUpperCase();

      let qr_code = providedQr;

      // If provided, validate uniqueness to avoid duplicates
      if (qr_code) {
        const { data: existing, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('qr_code', qr_code)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existing) throw new Error('Já existe um usuário com este ID');
      } else {
        // Default: generate a reasonably unique ID
        qr_code = `USR-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`.toUpperCase();
      }

      const { qr_code: _ignore, ...insertData } = data;

      const { data: result, error } = await supabase
        .from('users')
        .insert({ ...insertData, qr_code })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if user has active equipment
      const { data: activeEquipment, error: checkError } = await supabase
        .from('equipment')
        .select('id, name')
        .eq('current_user_id', id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (activeEquipment && activeEquipment.length > 0) {
        throw new Error(`Usuário possui equipamento ativo: "${activeEquipment[0].name}". Registre a devolução primeiro.`);
      }
      
      // Delete related transactions first (historical records)
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', id);
      
      if (txError) throw txError;
      
      // Now delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}
