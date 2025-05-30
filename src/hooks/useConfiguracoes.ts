
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Configuracao } from '@/types/database';

export const useConfiguracoes = () => {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguracoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*');

      if (error) throw error;
      setConfiguracoes((data || []) as Configuracao[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const getConfiguracao = (chave: string): string | null => {
    const config = configuracoes.find(c => c.chave === chave);
    return config ? config.valor : null;
  };

  const atualizarConfiguracao = async (chave: string, valor: string) => {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor, updated_at: new Date().toISOString() })
        .eq('chave', chave);

      if (error) throw error;
      await fetchConfiguracoes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
      throw err;
    }
  };

  useEffect(() => {
    fetchConfiguracoes();
  }, []);

  return {
    configuracoes,
    loading,
    error,
    getConfiguracao,
    atualizarConfiguracao,
    refetch: fetchConfiguracoes
  };
};
