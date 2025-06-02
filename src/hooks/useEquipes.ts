
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';
import { toast } from 'sonner';

export interface EquipeExtended extends Equipe {
  cor_tema: string;
  emblema: string;
}

// Sistema local para cores e emblemas até serem adicionados ao banco
const equipesLocais = new Map<string, { cor_tema: string; emblema: string }>();

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<EquipeExtended[]>([]);
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
        .order('nome');

      if (error) throw error;
      
      // Adicionar cor_tema e emblema localmente
      const equipesComExtras = (data || []).map(equipe => {
        const extras = equipesLocais.get(equipe.id) || { 
          cor_tema: '#3b82f6', 
          emblema: '🍕' 
        };
        return {
          ...equipe,
          cor_tema: extras.cor_tema,
          emblema: extras.emblema
        };
      });
      
      setEquipes(equipesComExtras);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const criarEquipe = async (
    nome: string, 
    saldoInicial: number, 
    professorResponsavel: string,
    corTema?: string,
    emblema?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .insert({
          nome,
          saldo_inicial: saldoInicial,
          professor_responsavel: professorResponsavel,
          gasto_total: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Salvar cor_tema e emblema localmente
      equipesLocais.set(data.id, {
        cor_tema: corTema || '#3b82f6',
        emblema: emblema || '🍕'
      });
      
      await fetchEquipes();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
      throw err;
    }
  };

  const atualizarEquipe = async (equipeId: string, dados: Partial<EquipeExtended>) => {
    try {
      // Separar dados do banco dos locais
      const { cor_tema, emblema, ...dadosBanco } = dados;
      
      // Atualizar no banco apenas campos que existem
      if (Object.keys(dadosBanco).length > 0) {
        const { error } = await supabase
          .from('equipes')
          .update(dadosBanco)
          .eq('id', equipeId);

        if (error) throw error;
      }
      
      // Atualizar cor_tema e emblema localmente
      if (cor_tema || emblema) {
        const atual = equipesLocais.get(equipeId) || { cor_tema: '#3b82f6', emblema: '🍕' };
        equipesLocais.set(equipeId, {
          cor_tema: cor_tema || atual.cor_tema,
          emblema: emblema || atual.emblema
        });
      }
      
      await fetchEquipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar equipe');
      throw err;
    }
  };

  const removerEquipe = async (equipeId: string) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', equipeId);

      if (error) throw error;
      await fetchEquipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover equipe');
      throw err;
    }
  };

  const atualizarSaldo = async (equipeId: string, novoGastoTotal: number) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .update({ gasto_total: novoGastoTotal })
        .eq('id', equipeId);

      if (error) throw error;
      await fetchEquipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar saldo');
      throw err;
    }
  };

  useEffect(() => {
    fetchEquipes();

    // Cleanup any existing subscription
    if (channelRef.current && isSubscribedRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Create unique channel name with timestamp and random component
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `equipes-updates-${uniqueId}`;

    console.log('Configurando escuta em tempo real para equipes');
    
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
          
          if (payload.eventType === 'UPDATE') {
            const equipeAtualizada = payload.new as Equipe;
            
            // Atualizar lista local de equipes
            setEquipes(prev => prev.map(equipe => {
              if (equipe.id === equipeAtualizada.id) {
                const extras = equipesLocais.get(equipe.id) || { cor_tema: '#3b82f6', emblema: '🍕' };
                return {
                  ...equipeAtualizada,
                  cor_tema: extras.cor_tema,
                  emblema: extras.emblema
                };
              }
              return equipe;
            }));
            
            // Notificar sobre atualizações importantes
            if (payload.old?.gasto_total !== equipeAtualizada.gasto_total) {
              console.log(`Saldo da equipe ${equipeAtualizada.nome} atualizado para R$ ${equipeAtualizada.gasto_total}`);
            }
          } else if (payload.eventType === 'INSERT') {
            // Nova equipe criada
            const novaEquipe = payload.new as Equipe;
            toast.success(`Nova equipe "${novaEquipe.nome}" foi criada!`, {
              duration: 3000,
            });
            fetchEquipes();
          } else if (payload.eventType === 'DELETE') {
            // Equipe removida
            const equipeRemovida = payload.old as Equipe;
            toast.info(`Equipe "${equipeRemovida.nome}" foi removida`, {
              duration: 3000,
            });
            setEquipes(prev => prev.filter(equipe => equipe.id !== equipeRemovida.id));
          }
        }
      );

    // Subscribe only once
    if (!isSubscribedRef.current) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });
      channelRef.current = channel;
    }

    return () => {
      console.log('Removendo escuta em tempo real para equipes');
      if (channelRef.current && isSubscribedRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, []);

  return {
    equipes,
    loading,
    error,
    criarEquipe,
    atualizarEquipe,
    removerEquipe,
    atualizarSaldo,
    refetch: fetchEquipes
  };
};
