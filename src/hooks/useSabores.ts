
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SaborPizza } from '@/types/database';

export interface Sabor extends SaborPizza {
  ingredientes?: string[]; // IDs dos produtos usados como ingredientes
  imagem?: string;
}

export const useSabores = () => {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSabores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sabores_pizza')
        .select('*')
        .order('nome');

      if (error) throw error;
      setSabores(data || []);
    } catch (err) {
      console.error('Erro ao carregar sabores:', err);
      // Se a tabela não existir, usar sabores locais
      inicializarSaboresDefault();
    } finally {
      setLoading(false);
    }
  };

  const uploadImagem = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `sabores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('imagens')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      return null;
    }
  };

  const criarSabor = async (
    nome: string, 
    descricao?: string, 
    ingredientes?: string[], 
    imagemFile?: File
  ) => {
    try {
      let imagemUrl = null;
      if (imagemFile) {
        imagemUrl = await uploadImagem(imagemFile);
      }

      // Tentar criar no banco primeiro
      try {
        const { data, error } = await supabase
          .from('sabores_pizza')
          .insert({
            nome,
            descricao,
            disponivel: true,
            ingredientes: ingredientes || [],
            imagem: imagemUrl
          })
          .select()
          .single();

        if (error) throw error;
        await fetchSabores();
        return data;
      } catch (dbError) {
        // Se falhar, usar sistema local
        const novoSabor: Sabor = {
          id: Date.now().toString(),
          nome,
          descricao: descricao || null,
          disponivel: true,
          created_at: new Date().toISOString(),
          ingredientes: ingredientes || [],
          imagem: imagemUrl
        };
        
        setSabores(prev => [...prev, novoSabor]);
        return novoSabor;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sabor');
      throw err;
    }
  };

  const atualizarSabor = async (
    id: string, 
    dados: Partial<Sabor>, 
    imagemFile?: File
  ) => {
    try {
      let imagemUrl = dados.imagem;
      if (imagemFile) {
        imagemUrl = await uploadImagem(imagemFile);
      }

      const dadosAtualizados = {
        ...dados,
        imagem: imagemUrl
      };

      // Tentar atualizar no banco primeiro
      try {
        const { error } = await supabase
          .from('sabores_pizza')
          .update(dadosAtualizados)
          .eq('id', id);

        if (error) throw error;
        await fetchSabores();
      } catch (dbError) {
        // Se falhar, usar sistema local
        setSabores(prev => prev.map(sabor => 
          sabor.id === id ? { ...sabor, ...dadosAtualizados } : sabor
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sabor');
      throw err;
    }
  };

  const removerSabor = async (id: string) => {
    try {
      // Tentar remover do banco primeiro
      try {
        const { error } = await supabase
          .from('sabores_pizza')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchSabores();
      } catch (dbError) {
        // Se falhar, usar sistema local
        setSabores(prev => prev.filter(sabor => sabor.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover sabor');
      throw err;
    }
  };

  const inicializarSaboresDefault = () => {
    const saboresDefault: Sabor[] = [
      { 
        id: '1',
        nome: 'Pepperoni', 
        descricao: 'Pizza de pepperoni com queijo mussarela',
        disponivel: true,
        created_at: new Date().toISOString(),
        ingredientes: [],
        imagem: null
      },
      { 
        id: '2',
        nome: 'Mussarela', 
        descricao: 'Pizza de queijo mussarela',
        disponivel: true,
        created_at: new Date().toISOString(),
        ingredientes: [],
        imagem: null
      },
      { 
        id: '3',
        nome: 'Portuguesa', 
        descricao: 'Pizza portuguesa com presunto, ovos, cebola e azeitonas',
        disponivel: true,
        created_at: new Date().toISOString(),
        ingredientes: [],
        imagem: null
      }
    ];

    setSabores(saboresDefault);
  };

  useEffect(() => {
    fetchSabores();
  }, []);

  return {
    sabores,
    loading,
    error,
    criarSabor,
    atualizarSabor,
    removerSabor,
    refetch: fetchSabores
  };
};
