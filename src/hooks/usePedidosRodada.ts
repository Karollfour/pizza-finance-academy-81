
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SaborPizza } from '@/types/database';
import { toast } from 'sonner';

export interface PedidoRodada {
  id: string;
  rodada_id: string;
  sabor_id: string;
  ordem: number;
  status: 'aguardando' | 'ativo' | 'concluido';
  sabor: SaborPizza;
  pizzas_entregues: number;
  equipes_que_entregaram: string[];
  criado_em: string;
  ativado_em?: string;
  concluido_em?: string;
}

export const usePedidosRodada = (rodadaId?: string) => {
  const [pedidos, setPedidos] = useState<PedidoRodada[]>([]);
  const [pedidoAtivo, setPedidoAtivo] = useState<PedidoRodada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const fetchPedidos = useCallback(async () => {
    if (!rodadaId) {
      setPedidos([]);
      setPedidoAtivo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pedidos_rodada')
        .select(`
          *,
          sabor:sabores_pizza(*)
        `)
        .eq('rodada_id', rodadaId)
        .order('ordem', { ascending: true });

      if (error) throw error;

      const pedidosFormatados = (data || []).map(pedido => ({
        ...pedido,
        sabor: pedido.sabor as SaborPizza,
        equipes_que_entregaram: pedido.equipes_que_entregaram || []
      })) as PedidoRodada[];

      setPedidos(pedidosFormatados);
      
      // Encontrar pedido ativo
      const ativo = pedidosFormatados.find(p => p.status === 'ativo');
      setPedidoAtivo(ativo || null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [rodadaId]);

  const gerarPedidosParaRodada = async (rodadaId: string, sabores: SaborPizza[], numeroEquipes: number) => {
    try {
      // Calcular quantos pedidos serão necessários (baseado no número de equipes)
      const pedidosPorSabor = Math.ceil(numeroEquipes / sabores.length);
      const totalPedidos = pedidosPorSabor * sabores.length;

      const pedidosParaInserir = [];
      let ordem = 1;

      // Criar pedidos alternando sabores
      for (let i = 0; i < totalPedidos; i++) {
        const saborIndex = i % sabores.length;
        pedidosParaInserir.push({
          rodada_id: rodadaId,
          sabor_id: sabores[saborIndex].id,
          ordem: ordem++,
          status: 'aguardando'
        });
      }

      const { error } = await supabase
        .from('pedidos_rodada')
        .insert(pedidosParaInserir);

      if (error) throw error;

      // Disparar evento global
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pedidos-gerados', {
          detail: {
            rodadaId,
            totalPedidos: pedidosParaInserir.length,
            timestamp: new Date().toISOString()
          }
        }));
      }

      toast.success(`🎯 ${pedidosParaInserir.length} pedidos gerados para a rodada!`, {
        duration: 3000,
      });

      await fetchPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar pedidos');
      throw err;
    }
  };

  const ativarProximoPedido = async () => {
    try {
      const proximoPedido = pedidos.find(p => p.status === 'aguardando');
      if (!proximoPedido) {
        toast.info('Todos os pedidos da rodada foram ativados!');
        return;
      }

      // Concluir pedido ativo atual se existir
      if (pedidoAtivo) {
        await supabase
          .from('pedidos_rodada')
          .update({
            status: 'concluido',
            concluido_em: new Date().toISOString()
          })
          .eq('id', pedidoAtivo.id);
      }

      // Ativar próximo pedido
      const { error } = await supabase
        .from('pedidos_rodada')
        .update({
          status: 'ativo',
          ativado_em: new Date().toISOString()
        })
        .eq('id', proximoPedido.id);

      if (error) throw error;

      // Disparar evento global
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pedido-ativado', {
          detail: {
            pedido: proximoPedido,
            timestamp: new Date().toISOString()
          }
        }));
      }

      toast.success(`🍕 Novo pedido ativo: ${proximoPedido.sabor.nome}!`, {
        duration: 4000,
      });

      await fetchPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar próximo pedido');
      throw err;
    }
  };

  const registrarEntregaPizza = async (pedidoId: string, equipeId: string) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) return;

      const novasEquipes = [...pedido.equipes_que_entregaram];
      if (!novasEquipes.includes(equipeId)) {
        novasEquipes.push(equipeId);
      }

      const { error } = await supabase
        .from('pedidos_rodada')
        .update({
          pizzas_entregues: pedido.pizzas_entregues + 1,
          equipes_que_entregaram: novasEquipes
        })
        .eq('id', pedidoId);

      if (error) throw error;

      // Disparar evento global
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pizza-entregue-pedido', {
          detail: {
            pedidoId,
            equipeId,
            totalEntregues: pedido.pizzas_entregues + 1,
            timestamp: new Date().toISOString()
          }
        }));
      }

      await fetchPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar entrega');
      throw err;
    }
  };

  const cleanupChannel = () => {
    if (channelRef.current && isSubscribedRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!rodadaId) return;

    cleanupChannel();

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `pedidos-rodada-${rodadaId}-${uniqueId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_rodada',
          filter: `rodada_id=eq.${rodadaId}`
        },
        () => {
          fetchPedidos();
        }
      );

    if (!isSubscribedRef.current) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });
      channelRef.current = channel;
    }

    return () => {
      cleanupChannel();
    };
  }, [rodadaId, fetchPedidos]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  return {
    pedidos,
    pedidoAtivo,
    loading,
    error,
    gerarPedidosParaRodada,
    ativarProximoPedido,
    registrarEntregaPizza,
    refetch: fetchPedidos
  };
};
