
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';

export interface EquipeExtended extends Equipe {
  // Campos extras que simulamos localmente
  cor_tema?: string;
  emblema?: string;
}

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<EquipeExtended[]>([]);
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
      
      // Adicionar campos simulados para cada equipe
      const equipesComExtras = (data || []).map(equipe => ({
        ...equipe,
        cor_tema: '#3b82f6', // cor padrão azul
        emblema: '🍕' // emblema padrão
      }));
      
      setEquipes(equipesComExtras);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const criarEquipe = async (
    nome: string, 
    saldoInicial: number, 
    professorResponsavel: string,
    corTema?: string,
    emblema?: string
  ) => {
    try {
      // Criar equipe apenas com campos que existem na tabela
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
      
      // Adicionar campos extras localmente
      const equipeComExtras = {
        ...data,
        cor_tema: corTema || '#3b82f6',
        emblema: emblema || '🍕'
      };
      
      await fetchEquipes();
      return equipeComExtras;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
      throw err;
    }
  };

  const atualizarEquipe = async (equipeId: string, dados: Partial<EquipeExtended>) => {
    try {
      // Filtrar apenas campos que existem na tabela
      const { cor_tema, emblema, ...dadosTabela } = dados;
      
      if (Object.keys(dadosTabela).length > 0) {
        const { error } = await supabase
          .from('equipes')
          .update(dadosTabela)
          .eq('id', equipeId);

        if (error) throw error;
      }
      
      await fetchEquipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar equipe');
      throw err;
    }
  };

  const removerEquipe = async (equipeId: string) => {
    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', equipeId);

      if (error) throw error;
      await fetchEquipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover equipe');
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
    atualizarEquipe,
    removerEquipe,
    atualizarSaldo,
    refetch: fetchEquipes
  };
};
