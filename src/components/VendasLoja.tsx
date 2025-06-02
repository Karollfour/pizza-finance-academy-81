
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCompras } from '@/hooks/useCompras';
import { useEquipes } from '@/hooks/useEquipes';
import { useProdutos } from '@/hooks/useProdutos';
import { useOptimizedRodadas } from '@/hooks/useOptimizedRodadas';
import { toast } from 'sonner';

const VendasLoja = () => {
  const { compras, registrarCompra } = useCompras();
  const { equipes } = useEquipes();
  const { produtos } = useProdutos();
  const { rodadaAtual } = useOptimizedRodadas();
  
  const [novaVenda, setNovaVenda] = useState({
    equipeId: '',
    produtoId: '',
    quantidade: 1,
    tipo: 'material' as 'material' | 'viagem',
    descricao: ''
  });

  const handleRegistrarVenda = async () => {
    if (!novaVenda.equipeId) {
      toast.error('Selecione uma equipe!');
      return;
    }

    if (novaVenda.tipo === 'material' && !novaVenda.produtoId) {
      toast.error('Selecione um produto para venda de material!');
      return;
    }

    try {
      const produto = produtos.find(p => p.id === novaVenda.produtoId);
      const valorTotal = novaVenda.tipo === 'viagem' 
        ? 10 // Valor fixo para viagem
        : produto 
          ? produto.valor_unitario * novaVenda.quantidade
          : 0;

      await registrarCompra(
        novaVenda.equipeId,
        novaVenda.tipo === 'material' ? novaVenda.produtoId : null,
        rodadaAtual?.id || null,
        novaVenda.quantidade,
        valorTotal,
        novaVenda.tipo,
        novaVenda.descricao
      );

      setNovaVenda({
        equipeId: '',
        produtoId: '',
        quantidade: 1,
        tipo: 'material',
        descricao: ''
      });

      toast.success('Venda registrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar venda');
    }
  };

  const getProdutoNome = (produtoId: string | null) => {
    if (!produtoId) return 'Viagem';
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto não encontrado';
  };

  const getEquipeNome = (equipeId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    return equipe ? equipe.nome : 'Equipe não encontrada';
  };

  const vendas5Recentes = compras
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const totalVendasHoje = compras
    .filter(c => {
      const hoje = new Date().toDateString();
      const dataCompra = new Date(c.created_at).toDateString();
      return hoje === dataCompra;
    })
    .reduce((sum, c) => sum + c.valor_total, 0);

  return (
    <div className="space-y-6">
      {/* Registrar Nova Venda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">💰 Registrar Nova Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Equipe</label>
              <Select value={novaVenda.equipeId} onValueChange={(value) => setNovaVenda(prev => ({ ...prev, equipeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome} - R$ {(equipe.saldo_inicial - equipe.gasto_total).toFixed(2)} disponível
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Venda</label>
              <Select value={novaVenda.tipo} onValueChange={(value: 'material' | 'viagem') => setNovaVenda(prev => ({ ...prev, tipo: value, produtoId: value === 'viagem' ? '' : prev.produtoId }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">🛒 Material</SelectItem>
                  <SelectItem value="viagem">🚗 Viagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {novaVenda.tipo === 'material' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Produto</label>
                  <Select value={novaVenda.produtoId} onValueChange={(value) => setNovaVenda(prev => ({ ...prev, produtoId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.filter(p => p.disponivel).map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} - R$ {produto.valor_unitario.toFixed(2)} por {produto.unidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={novaVenda.quantidade}
                    onChange={(e) => setNovaVenda(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
              <Input
                placeholder="Detalhes da venda..."
                value={novaVenda.descricao}
                onChange={(e) => setNovaVenda(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </div>

          {novaVenda.tipo === 'material' && novaVenda.produtoId && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Total:</strong> R$ {
                  (() => {
                    const produto = produtos.find(p => p.id === novaVenda.produtoId);
                    return produto ? (produto.valor_unitario * novaVenda.quantidade).toFixed(2) : '0.00';
                  })()
                }
              </p>
            </div>
          )}

          {novaVenda.tipo === 'viagem' && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>Total:</strong> R$ 10.00 (valor fixo para viagem)
              </p>
            </div>
          )}

          <Button onClick={handleRegistrarVenda} className="w-full">
            Registrar Venda
          </Button>
        </CardContent>
      </Card>

      {/* Resumo de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {totalVendasHoje.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Vendas Hoje</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {compras.length}
            </div>
            <div className="text-sm text-gray-600">Total de Vendas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              R$ {compras.reduce((sum, c) => sum + c.valor_total, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Faturamento Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">🕒 Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vendas5Recentes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">💰</div>
                <p>Nenhuma venda registrada</p>
              </div>
            ) : (
              vendas5Recentes.map((venda) => (
                <div key={venda.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{getEquipeNome(venda.equipe_id)}</div>
                      <div className="text-sm text-gray-600">
                        {getProdutoNome(venda.produto_id)} • {new Date(venda.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={venda.tipo === 'material' ? 'default' : 'secondary'}>
                        {venda.tipo === 'material' ? '🛒' : '🚗'}
                      </Badge>
                      <div className="text-green-600 font-semibold">
                        R$ {venda.valor_total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendasLoja;
