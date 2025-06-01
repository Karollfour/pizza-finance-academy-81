
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRodadaCounter = () => {
  const [proximoNumero, setProximoNumero] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProximoNumero = async () => {
    try {
      setLoading(true);
      
      // Buscar o contador atual da tabela contadores_jogo
      const { data, error } = await supabase
        .from('contadores_jogo')
        .select('valor')
        .eq('chave', 'proximo_numero_rodada')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Se não existe contador, inicializar com 1
      if (!data) {
        const { data: insertData, error: insertError } = await supabase
          .from('contadores_jogo')
          .insert({ chave: 'proximo_numero_rodada', valor: 1 })
          .select('valor')
          .single();
        
        if (insertError) throw insertError;
        setProximoNumero(insertData.valor);
      } else {
        setProximoNumero(data.valor);
      }
    } catch (err) {
      console.error('Erro ao buscar próximo número da rodada:', err);
      setProximoNumero(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProximoNumero();
  }, []);

  return {
    proximoNumero,
    loading,
    refetch: fetchProximoNumero
  };
};
