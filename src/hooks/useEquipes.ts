
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipe } from '@/types/database';

export interface EquipeExtended extends Equipe {
  cor_tema: string;
  emblema: string;
}

// Sistema local para cores e emblemas até serem adicionados ao banco
const equipesLocais = new Map<string, { cor_tema: string; emblema: string }>();

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
      
      // Adicionar cor_tema e emblema localmente
      const equipesComExtras = (data || []).map(equipe => {
        const extras = equipesLocais.get(equipe.id) || { 
          cor_tema: '#3b82f6', 
          emblema: '🍕' 
        };
        return {
          ...equipe,
          cor_tema: extras.cor_tema,
          emblema: extras.emblema
        };
      });
      
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
      const { data, error } = await supabase
        .from('equipes')
        .insert({
          nome,
          saldo_inicial: saldoInicial,
          professor_responsavel: professorResponsavel,
          gasto_total: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Salvar cor_tema e emblema localmente
      equipesLocais.set(data.id, {
        cor_tema: corTema || '#3b82f6',
        emblema: emblema || '🍕'
      });
      
      await fetchEquipes();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
      throw err;
    }
  };

  const atualizarEquipe = async (equipeId: string, dados: Partial<EquipeExtended>) => {
    try {
      // Separar dados do banco dos locais
      const { cor_tema, emblema, ...dadosBanco } = dados;
      
      // Atualizar no banco apenas campos que existem
      if (Object.keys(dadosBanco).length > 0) {
        const { error } = await supabase
          .from('equipes')
          .update(dadosBanco)
          .eq('id', equipeId);

        if (error) throw error;
      }
      
      // Atualizar cor_tema e emblema localmente
      if (cor_tema || emblema) {
        const atual = equipesLocais.get(equipeId) || { cor_tema: '#3b82f6', emblema: '🍕' };
        equipesLocais.set(equipeId, {
          cor_tema: cor_tema || atual.cor_tema,
          emblema: emblema || atual.emblema
        });
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
