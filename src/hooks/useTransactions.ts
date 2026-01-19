import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
import { toast } from 'sonner';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          equipment:equipment(*),
          user:users(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ equipmentQr, userQr }: { equipmentQr: string; userQr: string }) => {
      // Buscar equipamento
      const { data: equipment, error: eqError } = await supabase
        .from('equipment')
        .select('id, status')
        .eq('qr_code', equipmentQr)
        .single();
      
      if (eqError || !equipment) {
        throw new Error('Equipamento não encontrado');
      }
      
      if (equipment.status !== 'Disponível') {
        throw new Error('Equipamento não está disponível');
      }
      
      // Buscar usuário
      const { data: user, error: usrError } = await supabase
        .from('users')
        .select('id')
        .eq('qr_code', userQr)
        .single();
      
      if (usrError || !user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Registrar transação
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          equipment_id: equipment.id,
          user_id: user.id,
          type: 'retirada',
        });
      
      if (txError) throw txError;
      
      // Atualizar equipamento
      const { error: updateError } = await supabase
        .from('equipment')
        .update({
          status: 'Em uso',
          current_user_id: user.id,
        })
        .eq('id', equipment.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Retirada registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ equipmentQr, userQr }: { equipmentQr: string; userQr: string }) => {
      // Buscar equipamento
      const { data: equipment, error: eqError } = await supabase
        .from('equipment')
        .select('id, status, current_user_id')
        .eq('qr_code', equipmentQr)
        .single();
      
      if (eqError || !equipment) {
        throw new Error('Equipamento não encontrado');
      }
      
      if (equipment.status !== 'Em uso') {
        throw new Error('Equipamento não está em uso');
      }
      
      if (!equipment.current_user_id) {
        throw new Error('Equipamento não possui usuário associado');
      }
      
      // Buscar usuário que está devolvendo
      const { data: user, error: usrError } = await supabase
        .from('users')
        .select('id')
        .eq('qr_code', userQr)
        .single();
      
      if (usrError || !user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Validar que o usuário que está devolvendo é o mesmo que retirou
      if (user.id !== equipment.current_user_id) {
        throw new Error('O usuário que está devolvendo não é o responsável pelo equipamento');
      }
      
      // Registrar transação
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          equipment_id: equipment.id,
          user_id: user.id,
          type: 'devolucao',
        });
      
      if (txError) throw txError;
      
      // Atualizar equipamento
      const { error: updateError } = await supabase
        .from('equipment')
        .update({
          status: 'Disponível',
          current_user_id: null,
        })
        .eq('id', equipment.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Devolução registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
