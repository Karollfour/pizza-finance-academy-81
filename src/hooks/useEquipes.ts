
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';
import { toast } from 'sonner';

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEquipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mapear os dados para incluir propriedades opcionais
      const equipesComPropriedades = (data || []).map(equipe => ({
        ...equipe,
        cor_tema: equipe.cor_tema || '#3B82F6',
        emblema: equipe.emblema || '🏆',
        ordem: equipe.ordem || 0
      }));

      setEquipes(equipesComPropriedades);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      setError('Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const criarEquipe = async (novaEquipe: Omit<Equipe, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .insert([novaEquipe])
        .select()
        .single();

      if (error) throw error;

      await fetchEquipes();
      toast.success('Equipe criada com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      toast.error('Erro ao criar equipe');
      throw error;
    }
  };

  const atualizarEquipe = async (id: string, dadosAtualizados: Partial<Equipe>) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .update(dadosAtualizados)
        .eq('id', id);

      if (error) throw error;

      await fetchEquipes();
      toast.success('Equipe atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      toast.error('Erro ao atualizar equipe');
      throw error;
    }
  };

  const removerEquipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEquipes();
      toast.success('Equipe removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover equipe:', error);
      toast.error('Erro ao remover equipe');
      throw error;
    }
  };

  useEffect(() => {
    fetchEquipes();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('equipes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'equipes' },
        (payload) => {
          console.log('Mudança detectada nas equipes:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Notificar ganho se ganho_total aumentou
            const oldGanho = payload.old?.ganho_total || 0;
            const newGanho = payload.new?.ganho_total || 0;
            
            if (newGanho > oldGanho) {
              const equipeNome = payload.new.nome;
              const ganhoAdicionado = newGanho - oldGanho;
              toast.success(`🎉 ${equipeNome} ganhou R$ ${ganhoAdicionado.toFixed(2)}!`, {
                duration: 4000,
                position: 'top-center'
              });
            }
          }
          
          fetchEquipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = fetchEquipes;

  return {
    equipes,
    loading,
    error,
    refetch,
    criarEquipe,
    atualizarEquipe,
    removerEquipe
  };
};
