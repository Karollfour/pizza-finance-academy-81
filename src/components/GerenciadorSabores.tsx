
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSabores, Sabor } from '@/hooks/useSabores';
import { useProdutos } from '@/hooks/useProdutos';
import { toast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, ImagePlus } from 'lucide-react';

const GerenciadorSabores = () => {
  const { sabores, criarSabor, atualizarSabor, removerSabor } = useSabores();
  const { produtos } = useProdutos();
  const [modalAberto, setModalAberto] = useState(false);
  const [saborEditando, setSaborEditando] = useState<Sabor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ingredientes: [] as string[],
    imagem: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (saborEditando) {
        await atualizarSabor(
          saborEditando.id,
          {
            nome: formData.nome,
            descricao: formData.descricao,
            ingredientes: formData.ingredientes
          },
          formData.imagem || undefined
        );
        toast({
          title: "Sabor atualizado com sucesso!",
          description: `O sabor ${formData.nome} foi atualizado.`
        });
      } else {
        await criarSabor(
          formData.nome,
          formData.descricao,
          formData.ingredientes,
          formData.imagem || undefined
        );
        toast({
          title: "Sabor criado com sucesso!",
          description: `O sabor ${formData.nome} foi adicionado.`
        });
      }
      
      resetForm();
      setModalAberto(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o sabor.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      ingredientes: [],
      imagem: null
    });
    setSaborEditando(null);
  };

  const handleEdit = (sabor: Sabor) => {
    setSaborEditando(sabor);
    setFormData({
      nome: sabor.nome,
      descricao: sabor.descricao || '',
      ingredientes: sabor.ingredientes || [],
      imagem: null
    });
    setModalAberto(true);
  };

  const handleDelete = async (sabor: Sabor) => {
    if (confirm(`Tem certeza que deseja excluir o sabor "${sabor.nome}"?`)) {
      try {
        await removerSabor(sabor.id);
        toast({
          title: "Sabor removido",
          description: `O sabor ${sabor.nome} foi removido com sucesso.`
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover o sabor.",
          variant: "destructive"
        });
      }
    }
  };

  const adicionarIngrediente = (produtoId: string) => {
    if (!formData.ingredientes.includes(produtoId)) {
      setFormData(prev => ({
        ...prev,
        ingredientes: [...prev.ingredientes, produtoId]
      }));
    }
  };

  const removerIngrediente = (produtoId: string) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter(id => id !== produtoId)
    }));
  };

  const getProdutoNome = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.nome || 'Produto não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Sabores</h2>
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Sabor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {saborEditando ? 'Editar Sabor' : 'Novo Sabor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Imagem</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      imagem: e.target.files?.[0] || null 
                    }))}
                  />
                  <ImagePlus className="w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ingredientes</label>
                <Select onValueChange={adicionarIngrediente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(produto => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.ingredientes.map(ingredienteId => (
                    <Badge 
                      key={ingredienteId} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removerIngrediente(ingredienteId)}
                    >
                      {getProdutoNome(ingredienteId)} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  {saborEditando ? 'Atualizar' : 'Criar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sabores.map((sabor) => (
          <Card key={sabor.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{sabor.nome}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(sabor)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(sabor)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sabor.imagem && (
                <img 
                  src={sabor.imagem} 
                  alt={sabor.nome}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              
              {sabor.descricao && (
                <p className="text-sm text-gray-600 mb-3">{sabor.descricao}</p>
              )}
              
              {sabor.ingredientes && sabor.ingredientes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Ingredientes:</p>
                  <div className="flex flex-wrap gap-1">
                    {sabor.ingredientes.map(ingredienteId => (
                      <Badge key={ingredienteId} variant="outline" className="text-xs">
                        {getProdutoNome(ingredienteId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GerenciadorSabores;
