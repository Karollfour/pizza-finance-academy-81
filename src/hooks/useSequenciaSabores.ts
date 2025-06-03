
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSabores } from '@/hooks/useSabores';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';

export const useSequenciaSabores = () => {
  const { sabores } = useSabores();
  const [loading, setLoading] = useState(false);

  const gerarSequenciaAleatoria = (numeroPizzas: number) => {
    if (sabores.length === 0) return [];
    
    const saboresDisponiveis = sabores.filter(s => s.disponivel);
    const sequencia: string[] = [];
    
    for (let i = 0; i < numeroPizzas; i++) {
      const saborAleatorio = saboresDisponiveis[Math.floor(Math.random() * saboresDisponiveis.length)];
      sequencia.push(saborAleatorio.id);
    }
    
    return sequencia;
  };

  const criarSequenciaParaRodada = async (rodadaId: string, numeroPizzas: number) => {
    if (!rodadaId || numeroPizzas <= 0) return;

    try {
      setLoading(true);
      
      // Gerar sequência aleatória
      const sequencia = gerarSequenciaAleatoria(numeroPizzas);
      
      // Inserir todos os sabores da sequência no banco
      const historicoItems = sequencia.map((saborId, index) => ({
        rodada_id: rodadaId,
        sabor_id: saborId,
        ordem: index + 1,
        definido_por: 'Sistema Automático'
      }));

      const { error } = await supabase
        .from('historico_sabores_rodada')
        .insert(historicoItems);

      if (error) throw error;

      console.log(`Sequência de ${numeroPizzas} sabores criada para rodada ${rodadaId}`);
      
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
