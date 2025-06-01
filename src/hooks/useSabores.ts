
import { useState, useEffect } from 'react';
import { SaborPizza } from '@/types/database';

export interface Sabor extends SaborPizza {
  ingredientes: string[];
  imagem: string | null;
}

export const useSabores = () => {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSabores = async () => {
    try {
      setLoading(true);
      // Por enquanto usar sistema local até a tabela ser criada no banco
      inicializarSaboresDefault();
    } catch (err) {
      console.error('Erro ao carregar sabores:', err);
      inicializarSaboresDefault();
    } finally {
      setLoading(false);
    }
  };

  const uploadImagem = async (file: File): Promise<string | null> => {
    try {
      // Simular upload por enquanto - retornar URL de exemplo
      return URL.createObjectURL(file);
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

      setSabores(prev => prev.map(sabor => 
        sabor.id === id ? { ...sabor, ...dadosAtualizados } : sabor
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sabor');
      throw err;
    }
  };

  const removerSabor = async (id: string) => {
    try {
      setSabores(prev => prev.filter(sabor => sabor.id !== id));
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
