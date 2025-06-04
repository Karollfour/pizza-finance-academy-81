import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';
import { toast } from 'sonner';

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEquipes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipes();

    const channel = supabase
      .channel('equipes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipes' },
        (payload) => {
          console.log('Equipe atualizada:', payload);
          fetchEquipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Escutar mudanças de ganhos via eventos customizados
  useEffect(() => {
    const handlePizzaAvaliada = (event: CustomEvent) => {
      const { equipeId, resultado } = event.detail;
      
      if (resultado === 'aprovada') {
        // Atualizar ganho da equipe localmente
        setEquipes(prev => prev.map(equipe => 
          equipe.id === equipeId 
            ? { ...equipe, ganho_total: (equipe.ganho_total || 0) + 10 }
            : equipe
        ));
        
        // Mostrar notificação de ganho
        const equipe = equipes.find(e => e.id === equipeId);
        if (equipe) {
          toast.success(`💰 ${equipe.nome} ganhou R$ 10,00!`, {
            duration: 3000,
          });
        }
      }
    };

    window.addEventListener('pizza-avaliada', handlePizzaAvaliada as EventListener);

    return () => {
      window.removeEventListener('pizza-avaliada', handlePizzaAvaliada as EventListener);
    };
  }, [equipes]);

  return {
    equipes,
    loading,
    error,
    refetch: fetchEquipes
  };
};
