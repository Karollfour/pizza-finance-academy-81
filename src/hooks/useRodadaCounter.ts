
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRodadaCounter = () => {
  const [proximoNumero, setProximoNumero] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProximoNumero = async () => {
    try {
      setLoading(true);
      
      // Buscar o maior número de rodada existente
      const { data, error } = await supabase
        .from('rodadas')
        .select('numero')
        .order('numero', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Se não há rodadas, começar do 0, senão incrementar 1
      const ultimaRodada = data && data.length > 0 ? data[0].numero : -1;
      setProximoNumero(ultimaRodada + 1);
    } catch (err) {
      console.error('Erro ao buscar próximo número da rodada:', err);
      setProximoNumero(0);
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
