
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEquipes } from '@/hooks/useEquipes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCompras } from '@/hooks/useCompras';
import { useRodadas } from '@/hooks/useRodadas';
import { toast } from 'sonner';
import DashboardLojinha from './DashboardLojinha';
import ComprasPorEquipe from './ComprasPorEquipe';
import { Trash2, Edit } from 'lucide-react';

const LojinhaScreen = () => {
  const { equipes, criarEquipe, loading: loadingEquipes } = useEquipes();
  const { produtos, criarProduto, atualizarProduto, loading: loadingProdutos } = useProdutos();
  const { registrarCompra } = useCompras();
  const { rodadaAtual } = useRodadas();

  const [novaEquipe, setNovaEquipe] = useState({ nome: '', saldo: 100, professor: '' });
  const [novoProduto, setNovoProduto] = useState({ nome: '', unidade: '', valor: 0 });
  const [compraAtual, setCompraAtual] = useState({ equipeId: '', produtoId: '', quantidade: 1 });
  const [produtoEditando, setProdutoEditando] = useState<string | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState({ nome: '', unidade: '', valor: 0 });

  const handleCriarEquipe = async () => {
    if (!novaEquipe.nome || !novaEquipe.professor) {
      toast.error('Preencha todos os campos da equipe');
      return;
    }

    try {
      await criarEquipe(novaEquipe.nome, novaEquipe.saldo, novaEquipe.professor);
      setNovaEquipe({ nome: '', saldo: 100, professor: '' });
      toast.success('Equipe criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar equipe');
    }
  };

  const handleCriarProduto = async () => {
    if (!novoProduto.nome || !novoProduto.unidade || novoProduto.valor <= 0) {
      toast.error('Preencha todos os campos do produto');
      return;
    }

    try {
      await criarProduto(novoProduto.nome, novoProduto.unidade, novoProduto.valor);
      setNovoProduto({ nome: '', unidade: '', valor: 0 });
      toast.success('Produto criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar produto');
    }
  };

  const handleRegistrarCompra = async () => {
    if (!compraAtual.equipeId || !compraAtual.produtoId || compraAtual.quantidade <= 0) {
      toast.error('Preencha todos os campos da compra');
      return;
    }

    const produto = produtos.find(p => p.id === compraAtual.produtoId);
    if (!produto) return;

    const valorTotal = produto.valor_unitario * compraAtual.quantidade;

    try {
      await registrarCompra(
        compraAtual.equipeId,
        compraAtual.produtoId,
        rodadaAtual?.id || null,
        compraAtual.quantidade,
        valorTotal,
        'material'
      );
      setCompraAtual({ equipeId: '', produtoId: '', quantidade: 1 });
      toast.success('Compra registrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar compra');
    }
  };

  const handleRegistrarViagem = async (equipeId: string) => {
    try {
      await registrarCompra(
        equipeId,
        null,
        rodadaAtual?.id || null,
        1,
        5.00,
        'viagem',
        'Viagem à loja'
      );
      toast.success('Viagem registrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar viagem');
    }
  };

  const iniciarEdicaoProduto = (produto: any) => {
    setProdutoEditando(produto.id);
    setDadosEdicao({
      nome: produto.nome,
      unidade: produto.unidade,
      valor: produto.valor_unitario
    });
  };

  const salvarEdicaoProduto = async () => {
    if (!produtoEditando) return;

    try {
      await atualizarProduto(produtoEditando, {
        nome: dadosEdicao.nome,
        unidade: dadosEdicao.unidade,
        valor_unitario: dadosEdicao.valor
      });
      setProdutoEditando(null);
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const removerProduto = async (produtoId: string) => {
    try {
      await atualizarProduto(produtoId, { disponivel: false });
      toast.success('Produto removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  if (loadingEquipes || loadingProdutos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
        <div className="text-2xl text-orange-600">Carregando lojinha...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">🏪 Lojinha da Pizzaria</h1>
          <p className="text-orange-700">Gerencie equipes, produtos e vendas</p>
          {rodadaAtual && (
            <div className="mt-4 p-3 bg-white/70 rounded-lg">
              <span className="text-lg font-semibold text-orange-800">
                Rodada {rodadaAtual.numero} - Status: {rodadaAtual.status}
              </span>
            </div>
          )}
        </div>

        <Tabs defaultValue="gestao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gestao">👥 Gestão</TabsTrigger>
            <TabsTrigger value="compras">🛒 Compras</TabsTrigger>
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="historico">📋 Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="gestao" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gestão de Equipes */}
              <Card className="shadow-lg border-2 border-orange-200">
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-orange-600">👥 Gestão de Equipes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="nomeEquipe">Nome da Equipe</Label>
                      <Input
                        id="nomeEquipe"
                        value={novaEquipe.nome}
                        onChange={(e) => setNovaEquipe({ ...novaEquipe, nome: e.target.value })}
                        placeholder="Ex: Equipe Alpha"
                      />
                    </div>
                    <div>
                      <Label htmlFor="professorEquipe">Professor Responsável</Label>
                      <Input
                        id="professorEquipe"
                        value={novaEquipe.professor}
                        onChange={(e) => setNovaEquipe({ ...novaEquipe, professor: e.target.value })}
                        placeholder="Ex: Prof. Silva"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saldoEquipe">Saldo Inicial</Label>
                      <Input
                        id="saldoEquipe"
                        type="number"
                        value={novaEquipe.saldo}
                        onChange={(e) => setNovaEquipe({ ...novaEquipe, saldo: Number(e.target.value) })}
                      />
                    </div>
                    <Button onClick={handleCriarEquipe} className="w-full bg-orange-500 hover:bg-orange-600">
                      Criar Equipe
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-orange-600">Equipes Cadastradas:</h3>
                    {equipes.map((equipe) => (
                      <div key={equipe.id} className="p-3 bg-white rounded-lg border border-orange-200 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{equipe.nome}</div>
                          <div className="text-sm text-gray-600">{equipe.professor_responsavel}</div>
                          <div className="text-sm text-orange-600">
                            Gasto: R$ {equipe.gasto_total.toFixed(2)} | Saldo: R$ {(equipe.saldo_inicial - equipe.gasto_total).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRegistrarViagem(equipe.id)}
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                          🚗 Viagem (R$ 5,00)
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gestão de Produtos */}
              <Card className="shadow-lg border-2 border-orange-200">
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-orange-600">🛒 Gestão de Produtos</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="nomeProduto">Nome do Produto</Label>
                      <Input
                        id="nomeProduto"
                        value={novoProduto.nome}
                        onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                        placeholder="Ex: Farinha"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unidadeProduto">Unidade</Label>
                      <Input
                        id="unidadeProduto"
                        value={novoProduto.unidade}
                        onChange={(e) => setNovoProduto({ ...novoProduto, unidade: e.target.value })}
                        placeholder="Ex: kg, lata, pacote"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valorProduto">Valor Unitário</Label>
                      <Input
                        id="valorProduto"
                        type="number"
                        step="0.01"
                        value={novoProduto.valor}
                        onChange={(e) => setNovoProduto({ ...novoProduto, valor: Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                    <Button onClick={handleCriarProduto} className="w-full bg-orange-500 hover:bg-orange-600">
                      Criar Produto
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-orange-600">Produtos Disponíveis:</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {produtos.map((produto) => (
                        <div key={produto.id} className="p-3 bg-white rounded-lg border border-orange-200">
                          {produtoEditando === produto.id ? (
                            <div className="space-y-2">
                              <Input
                                value={dadosEdicao.nome}
                                onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value })}
                                placeholder="Nome"
                              />
                              <Input
                                value={dadosEdicao.unidade}
                                onChange={(e) => setDadosEdicao({ ...dadosEdicao, unidade: e.target.value })}
                                placeholder="Unidade"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                value={dadosEdicao.valor}
                                onChange={(e) => setDadosEdicao({ ...dadosEdicao, valor: Number(e.target.value) })}
                                placeholder="Valor"
                              />
                              <div className="flex gap-2">
                                <Button onClick={salvarEdicaoProduto} size="sm" className="bg-green-500 hover:bg-green-600">
                                  Salvar
                                </Button>
                                <Button onClick={() => setProdutoEditando(null)} size="sm" variant="outline">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{produto.nome}</div>
                                <div className="text-sm text-gray-600">{produto.unidade}</div>
                                <div className="text-sm text-green-600 font-semibold">R$ {produto.valor_unitario.toFixed(2)}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => iniciarEdicaoProduto(produto)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => removerProduto(produto.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compras" className="space-y-6">
            {/* Registrar Compras */}
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">💰 Registrar Compras</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="equipeCompra">Equipe</Label>
                    <select
                      id="equipeCompra"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={compraAtual.equipeId}
                      onChange={(e) => setCompraAtual({ ...compraAtual, equipeId: e.target.value })}
                    >
                      <option value="">Selecione a equipe</option>
                      {equipes.map((equipe) => (
                        <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="produtoCompra">Produto</Label>
                    <select
                      id="produtoCompra"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={compraAtual.produtoId}
                      onChange={(e) => setCompraAtual({ ...compraAtual, produtoId: e.target.value })}
                    >
                      <option value="">Selecione o produto</option>
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>{produto.nome} - R$ {produto.valor_unitario.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quantidadeCompra">Quantidade</Label>
                    <Input
                      id="quantidadeCompra"
                      type="number"
                      min="1"
                      value={compraAtual.quantidade}
                      onChange={(e) => setCompraAtual({ ...compraAtual, quantidade: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleRegistrarCompra} className="w-full bg-green-500 hover:bg-green-600">
                      Registrar Compra
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardLojinha />
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <ComprasPorEquipe />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LojinhaScreen;
