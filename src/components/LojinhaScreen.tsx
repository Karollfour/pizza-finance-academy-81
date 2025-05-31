
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useEquipes } from '@/hooks/useEquipes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCompras } from '@/hooks/useCompras';
import { useRodadas } from '@/hooks/useRodadas';
import { toast } from 'sonner';
import DashboardLojinha from './DashboardLojinha';
import ComprasPorEquipe from './ComprasPorEquipe';
import { Trash2, Edit, Upload, Image } from 'lucide-react';

const LojinhaScreen = () => {
  const { equipes, criarEquipe, loading: loadingEquipes } = useEquipes();
  const { produtos, criarProduto, atualizarProduto, loading: loadingProdutos } = useProdutos();
  const { registrarCompra } = useCompras();
  const { rodadaAtual } = useRodadas();

  const [novaEquipe, setNovaEquipe] = useState({ nome: '', saldo: 100, professor: '' });
  const [novoProduto, setNovoProduto] = useState({ 
    nome: '', 
    unidade: '', 
    valor: 0, 
    durabilidade: 1, 
    descricao: '',
    imagem: null as File | null
  });
  const [produtoEditando, setProdutoEditando] = useState<string | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState({ 
    nome: '', 
    unidade: '', 
    valor: 0, 
    durabilidade: 1, 
    descricao: '',
    imagem: null as File | null
  });

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
    if (!novoProduto.nome || !novoProduto.unidade || novoProduto.valor <= 0 || novoProduto.durabilidade <= 0) {
      toast.error('Preencha todos os campos obrigatórios do produto');
      return;
    }

    try {
      await criarProduto(
        novoProduto.nome, 
        novoProduto.unidade, 
        novoProduto.valor,
        novoProduto.durabilidade,
        novoProduto.descricao || null,
        null // Por enquanto sem upload de imagem
      );
      setNovoProduto({ nome: '', unidade: '', valor: 0, durabilidade: 1, descricao: '', imagem: null });
      toast.success('Produto criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar produto');
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
      valor: produto.valor_unitario,
      durabilidade: produto.durabilidade || 1,
      descricao: produto.descricao || '',
      imagem: null
    });
  };

  const salvarEdicaoProduto = async () => {
    if (!produtoEditando) return;

    try {
      await atualizarProduto(produtoEditando, {
        nome: dadosEdicao.nome,
        unidade: dadosEdicao.unidade,
        valor_unitario: dadosEdicao.valor,
        durabilidade: dadosEdicao.durabilidade,
        descricao: dadosEdicao.descricao || null
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEditing) {
        setDadosEdicao({ ...dadosEdicao, imagem: file });
      } else {
        setNovoProduto({ ...novoProduto, imagem: file });
      }
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
            <TabsTrigger value="itens">📦 Gerenciar Itens</TabsTrigger>
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
            </div>
          </TabsContent>

          <TabsContent value="itens" className="space-y-6">
            {/* Gerenciar Itens para Compra */}
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">📦 Gerenciar Itens para Compra</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="nomeProduto">Nome do Produto *</Label>
                    <Input
                      id="nomeProduto"
                      value={novoProduto.nome}
                      onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                      placeholder="Ex: Massa de Pizza"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unidadeProduto">Unidade *</Label>
                    <Input
                      id="unidadeProduto"
                      value={novoProduto.unidade}
                      onChange={(e) => setNovoProduto({ ...novoProduto, unidade: e.target.value })}
                      placeholder="Ex: folha, unidade, pacote"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valorProduto">Preço (R$) *</Label>
                    <Input
                      id="valorProduto"
                      type="number"
                      step="0.01"
                      value={novoProduto.valor}
                      onChange={(e) => setNovoProduto({ ...novoProduto, valor: Number(e.target.value) })}
                      placeholder="5.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="durabilidadeProduto">Durabilidade (pizzas) *</Label>
                    <Input
                      id="durabilidadeProduto"
                      type="number"
                      min="1"
                      value={novoProduto.durabilidade}
                      onChange={(e) => setNovoProduto({ ...novoProduto, durabilidade: Number(e.target.value) })}
                      placeholder="Quantas pizzas o item aguenta"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imagemProduto">Imagem do Produto</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="imagemProduto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('imagemProduto')?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {novoProduto.imagem ? novoProduto.imagem.name : 'Escolher Imagem'}
                      </Button>
                    </div>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="descricaoProduto">Descrição (opcional)</Label>
                    <Textarea
                      id="descricaoProduto"
                      value={novoProduto.descricao}
                      onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                      placeholder="Descrição do produto para ajudar os jogadores"
                      rows={2}
                    />
                  </div>
                </div>
                <Button onClick={handleCriarProduto} className="w-full bg-orange-500 hover:bg-orange-600">
                  Adicionar Produto
                </Button>

                <div className="mt-8 space-y-3">
                  <h3 className="font-semibold text-orange-600">Produtos Disponíveis:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {produtos.map((produto) => (
                      <div key={produto.id} className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                        {produtoEditando === produto.id ? (
                          <div className="space-y-3">
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
                              placeholder="Preço"
                            />
                            <Input
                              type="number"
                              min="1"
                              value={dadosEdicao.durabilidade}
                              onChange={(e) => setDadosEdicao({ ...dadosEdicao, durabilidade: Number(e.target.value) })}
                              placeholder="Durabilidade"
                            />
                            <Textarea
                              value={dadosEdicao.descricao}
                              onChange={(e) => setDadosEdicao({ ...dadosEdicao, descricao: e.target.value })}
                              placeholder="Descrição"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                                className="hidden"
                                id={`edit-image-${produto.id}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`edit-image-${produto.id}`)?.click()}
                              >
                                <Image className="w-4 h-4" />
                              </Button>
                            </div>
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
                          <div className="h-full flex flex-col">
                            {/* Imagem do produto */}
                            <div className="mb-3 flex justify-center">
                              {produto.imagem ? (
                                <img 
                                  src={produto.imagem} 
                                  alt={produto.nome}
                                  className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                                  <span className="text-2xl">📦</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Informações do produto */}
                            <div className="flex-1 text-center">
                              <div className="font-medium text-lg mb-1">{produto.nome}</div>
                              <div className="text-sm text-gray-600 mb-1">{produto.unidade}</div>
                              <div className="text-sm text-green-600 font-semibold mb-1">
                                R$ {produto.valor_unitario.toFixed(2)}
                              </div>
                              <div className="text-xs text-blue-600 mb-2">
                                Durabilidade: {produto.durabilidade || 1} pizzas
                              </div>
                              {produto.descricao && (
                                <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                                  {produto.descricao}
                                </div>
                              )}
                            </div>
                            
                            {/* Botões de ação */}
                            <div className="flex gap-1 justify-center">
                              <Button
                                onClick={() => iniciarEdicaoProduto(produto)}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => removerProduto(produto.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 flex-1"
                              >
                                <Trash2 className="h-3 w-3" />
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
