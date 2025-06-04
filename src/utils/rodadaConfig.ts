
import { supabase } from '@/integrations/supabase/client';

export interface RodadaConfig {
  numeroPizzasPlanejadas: number;
  tempoLimitePorPizza: number;
}

export const obterConfigRodada = async (rodadaId: string): Promise<RodadaConfig | null> => {
  try {
    console.log('Obtendo configuração da rodada:', rodadaId);
    
    // Primeiro, verificar se existe uma configuração específica para esta rodada
    const { data: configEspecifica, error: configError } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', `rodada_${rodadaId}_pizzas_planejadas`)
      .single();

    if (!configError && configEspecifica) {
      const numeroPizzas = parseInt(configEspecifica.valor);
      console.log(`Configuração específica encontrada para rodada ${rodadaId}: ${numeroPizzas} pizzas`);
      return {
        numeroPizzasPlanejadas: numeroPizzas,
        tempoLimitePorPizza: 0 // Será calculado baseado no tempo limite da rodada
      };
    }

    // Se não há configuração específica, usar configuração global padrão
    const { data: configGlobal, error: globalError } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pizzas_planejadas_padrao')
      .single();

    if (!globalError && configGlobal) {
      const numeroPizzas = parseInt(configGlobal.valor);
      console.log(`Usando configuração global padrão: ${numeroPizzas} pizzas`);
      return {
        numeroPizzasPlanejadas: numeroPizzas,
        tempoLimitePorPizza: 0
      };
    }

    // Fallback: tentar inferir baseado no histórico de sabores da rodada
    const { data: saboresRodada, error: saboresError } = await supabase
      .from('historico_sabores_rodada')
      .select('ordem')
      .eq('rodada_id', rodadaId)
      .order('ordem', { ascending: false })
      .limit(1);

    if (!saboresError && saboresRodada && saboresRodada.length > 0) {
      const numeroPizzas = saboresRodada[0].ordem;
      console.log(`Inferindo do histórico de sabores: ${numeroPizzas} pizzas`);
      return {
        numeroPizzasPlanejadas: numeroPizzas,
        tempoLimitePorPizza: 0
      };
    }

    console.log('Nenhuma configuração encontrada, usando padrão de 5 pizzas');
    return {
      numeroPizzasPlanejadas: 5, // Padrão se nada for encontrado
      tempoLimitePorPizza: 0
    };

  } catch (error) {
    console.error('Erro ao obter configuração da rodada:', error);
    return {
      numeroPizzasPlanejadas: 5, // Padrão em caso de erro
      tempoLimitePorPizza: 0
    };
  }
};

export const salvarConfigRodada = async (rodadaId: string, numeroPizzas: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('configuracoes')
      .upsert({
        chave: `rodada_${rodadaId}_pizzas_planejadas`,
        valor: numeroPizzas.toString(),
        descricao: `Número de pizzas planejadas para a rodada ${rodadaId}`
      }, {
        onConflict: 'chave'
      });

    if (error) throw error;
    console.log(`Configuração salva: ${numeroPizzas} pizzas para rodada ${rodadaId}`);
  } catch (error) {
    console.error('Erro ao salvar configuração da rodada:', error);
    throw error;
  }
};
