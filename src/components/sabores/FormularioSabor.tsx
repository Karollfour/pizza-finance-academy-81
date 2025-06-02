
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sabor } from '@/hooks/useSabores';
import { Plus, ImagePlus } from 'lucide-react';

interface FormularioSaborProps {
  saborEditando: Sabor | null;
  onSubmit: (formData: {
    nome: string;
    descricao: string;
    ingredientes: string[];
    imagem: File | null;
  }) => Promise<void>;
  produtos: Array<{ id: string; nome: string }>;
  modalAberto: boolean;
  setModalAberto: (aberto: boolean) => void;
  resetForm: () => void;
}

export const FormularioSabor = ({
  saborEditando,
  onSubmit,
  produtos,
  modalAberto,
  setModalAberto,
  resetForm
}: FormularioSaborProps) => {
  const [formData, setFormData] = useState({
    nome: saborEditando?.nome || '',
    descricao: saborEditando?.descricao || '',
    ingredientes: saborEditando?.ingredientes || [],
    imagem: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
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
  );
};
