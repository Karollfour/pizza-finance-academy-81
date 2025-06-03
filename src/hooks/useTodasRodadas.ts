
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Rodada } from '@/types/database';

export const useTodasRodadas = () => {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRodadas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rodadas')
        .select('*')
        .order('numero', { ascending: true });

      if (error) throw error;

      setRodadas((data || []) as Rodada[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar rodadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRodadas();
  }, []);

  return {
    rodadas,
    loading,
    error,
    refetch: fetchRodadas
  };
};
