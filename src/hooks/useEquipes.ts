
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEquipes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const criarEquipe = async (nome: string, saldoInicial: number, professorResponsavel: string) => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .insert({
          nome,
          saldo_inicial: saldoInicial,
          professor_responsavel: professorResponsavel
        })
        .select()
        .single();

      if (error) throw error;
      await fetchEquipes();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
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
  }, []);

  return {
    equipes,
    loading,
    error,
    criarEquipe,
    atualizarSaldo,
    refetch: fetchEquipes
  };
};
