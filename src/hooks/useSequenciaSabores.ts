
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSabores } from '@/hooks/useSabores';

export const useSequenciaSabores = () => {
  const { sabores } = useSabores();
  const [loading, setLoading] = useState(false);

  const gerarSequenciaAleatoria = (numeroPizzas: number) => {
    if (sabores.length === 0) return [];
    
    const saboresDisponiveis = sabores.filter(s => s.disponivel);
    if (saboresDisponiveis.length === 0) return [];
    
    const sequencia: string[] = [];
    
    for (let i = 0; i < numeroPizzas; i++) {
      // Usar Math.random() com timestamp para garantir mais aleatoriedade
      const seed = Math.random() * Date.now();
      const indiceAleatorio = Math.floor(seed % saboresDisponiveis.length);
      const saborAleatorio = saboresDisponiveis[indiceAleatorio];
      sequencia.push(saborAleatorio.id);
    }
    
    console.log(`Sequência gerada para ${numeroPizzas} pizzas:`, sequencia);
    return sequencia;
  };

  const criarSequenciaParaRodada = async (rodadaId: string, numeroPizzas: number) => {
    if (!rodadaId || numeroPizzas <= 0) {
      throw new Error('Dados inválidos para criar sequência');
    }

    try {
      setLoading(true);
      
      // Limpar sequência anterior se existir
      const { error: deleteError } = await supabase
        .from('historico_sabores_rodada')
        .delete()
        .eq('rodada_id', rodadaId);

      if (deleteError) {
        console.error('Erro ao limpar sequência anterior:', deleteError);
      }
      
      // Gerar nova sequência aleatória
      const sequencia = gerarSequenciaAleatoria(numeroPizzas);
      
      if (sequencia.length === 0) {
        throw new Error('Não foi possível gerar sequência - sabores indisponíveis');
      }
      
      // Inserir todos os sabores da sequência no banco
      const historicoItems = sequencia.map((saborId, index) => ({
        rodada_id: rodadaId,
        sabor_id: saborId,
        ordem: index + 1,
        definido_por: 'Sistema Automático',
        definido_em: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('historico_sabores_rodada')
        .insert(historicoItems)
        .select();

      if (error) throw error;

      console.log(`Sequência de ${numeroPizzas} sabores criada com sucesso para rodada ${rodadaId}:`, data);
      
      return data;
      
    } catch (error) {
      console.error('Erro ao criar sequência de sabores:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    criarSequenciaParaRodada,
    gerarSequenciaAleatoria,
    loading
  };
};
