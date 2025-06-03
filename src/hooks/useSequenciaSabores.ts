
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSabores } from '@/hooks/useSabores';

export const useSequenciaSabores = () => {
  const { sabores, loading: loadingSabores } = useSabores();
  const [loading, setLoading] = useState(false);

  const gerarSequenciaAleatoria = (numeroPizzas: number) => {
    if (sabores.length === 0) {
      console.log('Nenhum sabor disponível para gerar sequência');
      return [];
    }
    
    const saboresDisponiveis = sabores.filter(s => s.disponivel);
    if (saboresDisponiveis.length === 0) {
      console.log('Nenhum sabor disponível filtrado');
      return [];
    }
    
    console.log('Sabores disponíveis para sequência:', saboresDisponiveis);
    
    const sequencia: string[] = [];
    
    for (let i = 0; i < numeroPizzas; i++) {
      // Gerar índice aleatório para escolher sabor
      const indiceAleatorio = Math.floor(Math.random() * saboresDisponiveis.length);
      const saborEscolhido = saboresDisponiveis[indiceAleatorio];
      sequencia.push(saborEscolhido.id);
    }
    
    console.log(`Sequência aleatória gerada para ${numeroPizzas} pizzas:`, sequencia);
    return sequencia;
  };

  const criarSequenciaParaRodada = async (rodadaId: string, numeroPizzas: number) => {
    if (!rodadaId || numeroPizzas <= 0) {
      throw new Error('Dados inválidos para criar sequência');
    }

    // Aguardar sabores carregarem se ainda estão loading
    if (loadingSabores) {
      console.log('Aguardando sabores carregarem...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      setLoading(true);
      console.log(`Iniciando criação de sequência para rodada ${rodadaId} com ${numeroPizzas} pizzas`);
      
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
      
      console.log('Sequência a ser inserida:', sequencia);
      
      // Inserir todos os sabores da sequência no banco
      const historicoItems = sequencia.map((saborId, index) => ({
        rodada_id: rodadaId,
        sabor_id: saborId,
        ordem: index + 1,
        definido_por: 'Sistema Automático',
        definido_em: new Date().toISOString()
      }));

      console.log('Items do histórico a serem inseridos:', historicoItems);

      const { data, error } = await supabase
        .from('historico_sabores_rodada')
        .insert(historicoItems)
        .select();

      if (error) {
        console.error('Erro ao inserir sequência:', error);
        throw error;
      }

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
    loading: loading || loadingSabores
  };
};
