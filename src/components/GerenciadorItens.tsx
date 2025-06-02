
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useProdutos } from '@/hooks/useProdutos';
import { toast } from 'sonner';

const GerenciadorItens = () => {
  const { produtos, criarProduto, atualizarProduto } = useProdutos();
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    unidade: '',
    valorUnitario: 0,
    durabilidade: 1,
    descricao: ''
  });
  const [editandoProduto, setEditandoProduto] = useState<string | null>(null);

  const handleCriarProduto = async () => {
    if (!novoProduto.nome || !novoProduto.unidade || novoProduto.valorUnitario <= 0) {
      toast.error('Nome, unidade e valor são obrigatórios!');
      return;
    }

    try {
      await criarProduto(
        novoProduto.nome,
        novoProduto.unidade,
        novoProduto.valorUnitario,
        novoProduto.durabilidade,
        novoProduto.descricao
      );
      
      setNovoProduto({
        nome: '',
        unidade: '',
        valorUnitario: 0,
        durabilidade: 1,
        descricao: ''
      });
      
      toast.success('Produto criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar produto');
    }
  };

  const handleAtualizarProduto = async (produtoId: string, dados: any) => {
    try {
      await atualizarProduto(produtoId, dados);
      toast.success('Produto atualizado com sucesso!');
      setEditandoProduto(null);
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const toggleDisponibilidade = async (produtoId: string, disponivel: boolean) => {
    try {
      await atualizarProduto(produtoId, { disponivel: !disponivel });
      toast.success(`Produto ${!disponivel ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar disponibilidade');
    }
  };

  return (
    <div className="space-y-6">
      {/* Criar Novo Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">➕ Criar Novo Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nome do produto"
              value={novoProduto.nome}
              onChange={(e) => setNovoProduto(prev => ({ ...prev, nome: e.target.value }))}
            />
            <Input
              placeholder="Unidade (ex: kg, unidade, litro)"
              value={novoProduto.unidade}
              onChange={(e) => setNovoProduto(prev => ({ ...prev, unidade: e.target.value }))}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor unitário"
              value={novoProduto.valorUnitario}
              onChange={(e) => setNovoProduto(prev => ({ ...prev, valorUnitario: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="Durabilidade (rodadas)"
              value={novoProduto.durabilidade}
              onChange={(e) => setNovoProduto(prev => ({ ...prev, durabilidade: Number(e.target.value) }))}
            />
          </div>
          <Textarea
            placeholder="Descrição do produto (opcional)"
            value={novoProduto.descricao}
            onChange={(e) => setNovoProduto(prev => ({ ...prev, descricao: e.target.value }))}
          />
          <Button onClick={handleCriarProduto} className="w-full">
            Criar Produto
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">📦 Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📦</div>
                <p>Nenhum produto cadastrado</p>
              </div>
            ) : (
              produtos.map((produto) => (
                <Card key={produto.id} className={`${produto.disponivel ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{produto.nome}</h3>
                      <Badge variant={produto.disponivel ? 'default' : 'secondary'}>
                        {produto.disponivel ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p><strong>Unidade:</strong> {produto.unidade}</p>
                      <p><strong>Valor:</strong> R$ {produto.valor_unitario.toFixed(2)}</p>
                      <p><strong>Durabilidade:</strong> {produto.durabilidade} rodadas</p>
                      {produto.descricao && (
                        <p><strong>Descrição:</strong> {produto.descricao}</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditandoProduto(editandoProduto === produto.id ? null : produto.id)}
                      >
                        {editandoProduto === produto.id ? 'Cancelar' : 'Editar'}
                      </Button>
                      <Button
                        variant={produto.disponivel ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleDisponibilidade(produto.id, produto.disponivel)}
                      >
                        {produto.disponivel ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>

                    {editandoProduto === produto.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <Input
                          placeholder="Novo valor unitário"
                          type="number"
                          step="0.01"
                          defaultValue={produto.valor_unitario}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              handleAtualizarProduto(produto.id, { valor_unitario: Number(input.value) });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            handleAtualizarProduto(produto.id, { valor_unitario: Number(input.value) });
                          }}
                        >
                          Atualizar Preço
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciadorItens;
