
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';
import { toast } from 'sonner';

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const fetchEquipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setEquipes((data || []) as Equipe[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const criarEquipe = async (nome: string, saldoInicial: number, professorResponsavel: string) => {
    try {
      const cores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
      const emblemas = ['⚡', '🔥', '🌟', '🚀', '💎', '🎯'];
      
      const corTema = cores[Math.floor(Math.random() * cores.length)];
      const emblema = emblemas[Math.floor(Math.random() * emblemas.length)];

      const { data, error } = await supabase
        .from('equipes')
        .insert({
          nome,
          saldo_inicial: saldoInicial,
          professor_responsavel: professorResponsavel,
          cor_tema: corTema,
          emblema
        })
        .select()
        .single();

      if (error) throw error;
      
      const novaEquipe = data as Equipe;
      setEquipes(prev => [...prev, novaEquipe]);
      
      return novaEquipe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
      throw err;
    }
  };

  const atualizarEquipe = async (id: string, dados: Partial<Equipe>) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
      
      setEquipes(prev => prev.map(equipe => 
        equipe.id === id ? { ...equipe, ...dados } : equipe
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar equipe');
      throw err;
    }
  };

  const removerEquipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEquipes(prev => prev.filter(equipe => equipe.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover equipe');
      throw err;
    }
  };

  const cleanupChannel = () => {
    if (channelRef.current && isSubscribedRef.current) {
      console.log('Removendo canal de equipes');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  // Escutar mudanças em tempo real
  useEffect(() => {
    // Cleanup any existing subscription
    cleanupChannel();

    // Create unique channel name
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `equipes-realtime-${uniqueId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipes'
        },
        (payload) => {
          console.log('Equipe atualizada:', payload);
          
          if (payload.eventType === 'INSERT') {
            const novaEquipe = payload.new as Equipe;
            setEquipes(prev => [...prev, novaEquipe]);
          } else if (payload.eventType === 'UPDATE') {
            const equipeAtualizada = payload.new as Equipe;
            setEquipes(prev => prev.map(equipe => 
              equipe.id === equipeAtualizada.id ? equipeAtualizada : equipe
            ));
          } else if (payload.eventType === 'DELETE') {
            const equipeRemovida = payload.old as Equipe;
            setEquipes(prev => prev.filter(equipe => equipe.id !== equipeRemovida.id));
          }
        }
      );

    channelRef.current = channel;

    // Subscribe only once
    if (!isSubscribedRef.current) {
      channel.subscribe((status) => {
        console.log('Status da subscrição de equipes:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
        }
      });
    }

    return () => {
      cleanupChannel();
    };
  }, []);

  useEffect(() => {
    fetchEquipes();
  }, []);

  return {
    equipes,
    loading,
    error,
    criarEquipe,
    atualizarEquipe,
    removerEquipe,
    refetch: fetchEquipes
  };
};
