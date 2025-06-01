
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pizza } from '@/types/database';
import { toast } from 'sonner';

export const usePizzas = (equipeId?: string, rodadaId?: string) => {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPizzas = async () => {
    try {
      setLoading(true);
      let query = supabase.from('pizzas').select('*');
      
      if (equipeId) {
        query = query.eq('equipe_id', equipeId);
      }
      
      if (rodadaId) {
        query = query.eq('rodada_id', rodadaId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPizzas((data || []) as Pizza[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pizzas');
    } finally {
      setLoading(false);
    }
  };

  const marcarPizzaPronta = async (equipeId: string, rodadaId: string) => {
    try {
      const { data, error } = await supabase
        .from('pizzas')
        .insert({
          equipe_id: equipeId,
          rodada_id: rodadaId,
          status: 'pronta'
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPizzas();
      
      // Mostrar notificação para a equipe
      toast.success('Pizza enviada para avaliação! Você pode continuar fazendo outras pizzas.', {
        duration: 4000,
      });
      
      return data as Pizza;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar pizza como pronta');
      throw err;
    }
  };

  const avaliarPizza = async (pizzaId: string, resultado: 'aprovada' | 'reprovada', justificativa?: string, avaliador?: string) => {
    try {
      const { error } = await supabase
        .from('pizzas')
        .update({
          status: 'avaliada',
          resultado,
          justificativa_reprovacao: justificativa,
          avaliado_por: avaliador,
          updated_at: new Date().toISOString()
        })
        .eq('id', pizzaId);

      if (error) throw error;
      await fetchPizzas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao avaliar pizza');
      throw err;
    }
  };

  // Escutar mudanças em tempo real para pizzas
  useEffect(() => {
    console.log('Configurando escuta em tempo real para pizzas', equipeId ? `da equipe ${equipeId}` : 'globais');
    
    const channel = supabase
      .channel(`pizzas-updates${equipeId ? `-${equipeId}` : ''}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pizzas',
          ...(equipeId && { filter: `equipe_id=eq.${equipeId}` })
        },
        (payload) => {
          console.log('Pizza atualizada:', payload);
          
          if (payload.eventType === 'INSERT') {
            const novaPizza = payload.new as Pizza;
            
            // Adicionar à lista local
            setPizzas(prev => [novaPizza, ...prev]);
            
            // Notificar sobre nova pizza apenas se não for da equipe atual
            if (!equipeId || novaPizza.equipe_id !== equipeId) {
              toast.info(`🍕 Nova pizza em produção!`, {
                duration: 2000,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const pizzaAtualizada = payload.new as Pizza;
            
            // Atualizar lista local
            setPizzas(prev => prev.map(pizza => 
              pizza.id === pizzaAtualizada.id ? pizzaAtualizada : pizza
            ));
            
            // Notificar sobre avaliações apenas para a equipe específica
            if (equipeId && pizzaAtualizada.equipe_id === equipeId && pizzaAtualizada.status === 'avaliada') {
              if (pizzaAtualizada.resultado === 'aprovada') {
                toast.success('🎉 Pizza aprovada! Parabéns pela qualidade!', {
                  duration: 5000,
                });
              } else if (pizzaAtualizada.resultado === 'reprovada') {
                toast.error(`❌ Pizza reprovada: ${pizzaAtualizada.justificativa_reprovacao || 'Sem justificativa'}`, {
                  duration: 6000,
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const pizzaRemovida = payload.old as Pizza;
            
            // Remover da lista local
            setPizzas(prev => prev.filter(pizza => pizza.id !== pizzaRemovida.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo escuta em tempo real para pizzas');
      supabase.removeChannel(channel);
    };
  }, [equipeId]);

  useEffect(() => {
    fetchPizzas();
  }, [equipeId, rodadaId]);

  return {
    pizzas,
    loading,
    error,
    marcarPizzaPronta,
    avaliarPizza,
    refetch: fetchPizzas
  };
};
