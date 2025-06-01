import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEquipes } from '@/hooks/useEquipes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCompras } from '@/hooks/useCompras';
import { useRodadas } from '@/hooks/useRodadas';
import { useSabores } from '@/hooks/useSabores';
import { toast } from 'sonner';
import DashboardLojinha from './DashboardLojinha';
import ComprasPorEquipe from './ComprasPorEquipe';
import { Trash2, Edit, Upload, Image, ShoppingCart, Plus } from 'lucide-react';

const LojinhaScreen = () => {
  const {
    equipes,
    criarEquipe,
    atualizarEquipe,
    removerEquipe,
    loading: loadingEquipes
  } = useEquipes();
  const {
    produtos,
    criarProduto,
    atualizarProduto,
    loading: loadingProdutos
  } = useProdutos();
  const {
    sabores,
    criarSabor,
    atualizarSabor,
    loading: loadingSabores
  } = useSabores();
  const {
    registrarCompra
  } = useCompras();
  const {
    rodadaAtual
  } = useRodadas();

  // Estados para equipes
  const [novaEquipe, setNovaEquipe] = useState({
    nome: '',
    saldo: 100,
    professor: '',
    cor: '#f97316',
    emblema: '🍕'
  });
  const [equipeEditando, setEquipeEditando] = useState<string | null>(null);
  const [dadosEdicaoEquipe, setDadosEdicaoEquipe] = useState({
    nome: '',
    saldo: 0,
    professor: '',
    cor: '#f97316',
    emblema: '🍕'
  });

  // Estados para produtos
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

  // Estados para sabores
  const [novoSabor, setNovoSabor] = useState({
    nome: '',
    descricao: ''
  });
  const [saborEditando, setSaborEditando] = useState<string | null>(null);
  const [dadosEdicaoSabor, setDadosEdicaoSabor] = useState({
    nome: '',
    descricao: ''
  });

  // Estados para Gestão de Vendas
  const [vendaAtual, setVendaAtual] = useState({
    equipeId: '',
    produtoId: '',
    quantidade: 1,
    tipo: 'material' as 'material' | 'viagem'
  });

  const coresDisponiveis = ['#f97316', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'];
  const emblemasDisponiveis = ['🍕', '🏆', '⚡', '🔥', '🎯', '💎', '🚀', '⭐', '🎪', '🎨'];

  const handleCriarEquipe = async () => {
    if (!novaEquipe.nome || !novaEquipe.professor) {
      toast.error('Preencha todos os campos da equipe');
      return;
    }
    try {
      await criarEquipe(novaEquipe.nome, novaEquipe.saldo, novaEquipe.professor, novaEquipe.cor, novaEquipe.emblema);
      setNovaEquipe({
        nome: '',
        saldo: 100,
        professor: '',
        cor: '#f97316',
        emblema: '🍕'
      });
      toast.success('Equipe criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar equipe');
    }
  };

  const iniciarEdicaoEquipe = (equipe: any) => {
    setEquipeEditando(equipe.id);
    setDadosEdicaoEquipe({
      nome: equipe.nome,
      saldo: equipe.saldo_inicial,
      professor: equipe.professor_responsavel || '',
      cor: equipe.cor_tema || '#f97316',
      emblema: equipe.emblema || '🍕'
    });
  };

  const salvarEdicaoEquipe = async () => {
    if (!equipeEditando) return;
    try {
      await atualizarEquipe(equipeEditando, {
        nome: dadosEdicaoEquipe.nome,
        saldo_inicial: dadosEdicaoEquipe.saldo,
        professor_responsavel: dadosEdicaoEquipe.professor,
        cor_tema: dadosEdicaoEquipe.cor,
        emblema: dadosEdicaoEquipe.emblema
      });
      setEquipeEditando(null);
      toast.success('Equipe atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar equipe');
    }
  };

  const handleRemoverEquipe = async (equipeId: string) => {
    try {
      await removerEquipe(equipeId);
      toast.success('Equipe removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover equipe');
    }
  };

  const handleCriarProduto = async () => {
    if (!novoProduto.nome || !novoProduto.unidade || novoProduto.valor <= 0 || novoProduto.durabilidade <= 0) {
      toast.error('Preencha todos os campos obrigatórios do produto');
      return;
    }
    try {
      await criarProduto(novoProduto.nome, novoProduto.unidade, novoProduto.valor, novoProduto.durabilidade, novoProduto.descricao || null, novoProduto.imagem || undefined);
      setNovoProduto({
        nome: '',
        unidade: '',
        valor: 0,
        durabilidade: 1,
        descricao: '',
        imagem: null
      });
      toast.success('Produto criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar produto');
    }
  };

  const handleRegistrarViagem = async (equipeId: string) => {
    try {
      await registrarCompra(equipeId, null, rodadaAtual?.id || null, 1, 5.00, 'viagem', 'Viagem à loja');
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
      }, dadosEdicao.imagem || undefined);
      setProdutoEditando(null);
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const removerProduto = async (produtoId: string) => {
    try {
      await atualizarProduto(produtoId, {
        disponivel: false
      });
      toast.success('Produto removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  const handleCriarSabor = async () => {
    if (!novoSabor.nome) {
      toast.error('Digite o nome do sabor');
      return;
    }
    try {
      await criarSabor(novoSabor.nome, novoSabor.descricao);
      setNovoSabor({
        nome: '',
        descricao: ''
      });
      toast.success('Sabor criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar sabor');
    }
  };

  const iniciarEdicaoSabor = (sabor: any) => {
    setSaborEditando(sabor.id);
    setDadosEdicaoSabor({
      nome: sabor.nome,
      descricao: sabor.descricao || ''
    });
  };

  const salvarEdicaoSabor = async () => {
    if (!saborEditando) return;
    try {
      await atualizarSabor(saborEditando, {
        nome: dadosEdicaoSabor.nome,
        descricao: dadosEdicaoSabor.descricao || null
      });
      setSaborEditando(null);
      toast.success('Sabor atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar sabor');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB');
        return;
      }
      if (isEditing) {
        setDadosEdicao({
          ...dadosEdicao,
          imagem: file
        });
      } else {
        setNovoProduto({
          ...novoProduto,
          imagem: file
        });
      }
    }
  };

  // Nova função para registrar venda manual
  const handleRegistrarVenda = async () => {
    if (!vendaAtual.equipeId) {
      toast.error('Selecione uma equipe');
      return;
    }

    if (vendaAtual.tipo === 'material' && !vendaAtual.produtoId) {
      toast.error('Selecione um produto');
      return;
    }

    if (vendaAtual.quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    try {
      let valorTotal = 0;
      let descricao = '';

      if (vendaAtual.tipo === 'viagem') {
        valorTotal = 5.00;
        descricao = 'Viagem à loja';
      } else {
        const produto = produtos.find(p => p.id === vendaAtual.produtoId);
        if (!produto) {
          toast.error('Produto não encontrado');
          return;
        }
        valorTotal = produto.valor_unitario * vendaAtual.quantidade;
        descricao = `${vendaAtual.quantidade} ${produto.unidade} de ${produto.nome}`;
      }

      await registrarCompra(
        vendaAtual.equipeId,
        vendaAtual.tipo === 'material' ? vendaAtual.produtoId : null,
        rodadaAtual?.id || null,
        vendaAtual.quantidade,
        valorTotal,
        vendaAtual.tipo,
        descricao
      );

      // Resetar formulário
      setVendaAtual({
        equipeId: '',
        produtoId: '',
        quantidade: 1,
        tipo: 'material'
      });

      toast.success('Venda registrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar venda');
    }
  };

  if (loadingEquipes || loadingProdutos || loadingSabores) {
    return <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
        <div className="text-2xl text-orange-600">Carregando lojinha...</div>
      </div>;
  }

  return <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">🛍️ Loja </h1>
          <p className="text-orange-700">Gerencie equipes, produtos, sabores e vendas</p>
          {rodadaAtual && <div className="mt-4 p-3 bg-white/70 rounded-lg">
              <span className="text-lg font-semibold text-orange-800">
                Rodada {rodadaAtual.numero} - Status: {rodadaAtual.status}
              </span>
            </div>}
        </div>

        <Tabs defaultValue="gestao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="gestao">👥 Gestão</TabsTrigger>
            <TabsTrigger value="itens">📦 Gerenciar Itens</TabsTrigger>
            <TabsTrigger value="sabores">🍕 Sabores</TabsTrigger>
            <TabsTrigger value="vendas">💰 Gestão de Vendas</TabsTrigger>
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="historico">📋 Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="gestao" className="space-y-6">
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">👥 Gestão de Equipes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nomeEquipe">Nome da Equipe</Label>
                      <Input id="nomeEquipe" value={novaEquipe.nome} onChange={e => setNovaEquipe({
                      ...novaEquipe,
                      nome: e.target.value
                    })} placeholder="Ex: Equipe Alpha" />
                    </div>
                    <div>
                      <Label htmlFor="professorEquipe">Professor Responsável</Label>
                      <Input id="professorEquipe" value={novaEquipe.professor} onChange={e => setNovaEquipe({
                      ...novaEquipe,
                      professor: e.target.value
                    })} placeholder="Ex: Prof. Silva" />
                    </div>
                    <div>
                      <Label htmlFor="saldoEquipe">Saldo Inicial</Label>
                      <Input id="saldoEquipe" type="number" value={novaEquipe.saldo} onChange={e => setNovaEquipe({
                      ...novaEquipe,
                      saldo: Number(e.target.value)
                    })} />
                    </div>
                    <div>
                      <Label>Cor do Tema</Label>
                      <div className="flex gap-2 mt-2">
                        {coresDisponiveis.map(cor => <button key={cor} onClick={() => setNovaEquipe({
                        ...novaEquipe,
                        cor
                      })} className={`w-8 h-8 rounded-full border-2 ${novaEquipe.cor === cor ? 'border-gray-800' : 'border-gray-300'}`} style={{
                        backgroundColor: cor
                      }} />)}
                      </div>
                    </div>
                    <div>
                      <Label>Emblema da Equipe</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {emblemasDisponiveis.map(emblema => <button key={emblema} onClick={() => setNovaEquipe({
                        ...novaEquipe,
                        emblema
                      })} className={`w-10 h-10 text-xl rounded-lg border-2 ${novaEquipe.emblema === emblema ? 'border-gray-800 bg-gray-100' : 'border-gray-300'}`}>
                            {emblema}
                          </button>)}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCriarEquipe} className="w-full bg-orange-500 hover:bg-orange-600">
                    Criar Equipe
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-600">Equipes Cadastradas:</h3>
                  {equipes.map(equipe => <div key={equipe.id} className="p-4 bg-white rounded-lg border border-orange-200">
                      {equipeEditando === equipe.id ? <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input value={dadosEdicaoEquipe.nome} onChange={e => setDadosEdicaoEquipe({
                        ...dadosEdicaoEquipe,
                        nome: e.target.value
                      })} placeholder="Nome da equipe" />
                            <Input value={dadosEdicaoEquipe.professor} onChange={e => setDadosEdicaoEquipe({
                        ...dadosEdicaoEquipe,
                        professor: e.target.value
                      })} placeholder="Professor responsável" />
                            <Input type="number" value={dadosEdicaoEquipe.saldo} onChange={e => setDadosEdicaoEquipe({
                        ...dadosEdicaoEquipe,
                        saldo: Number(e.target.value)
                      })} placeholder="Saldo inicial" />
                          </div>
                          <div>
                            <Label>Cor do Tema</Label>
                            <div className="flex gap-2 mt-2">
                              {coresDisponiveis.map(cor => <button key={cor} onClick={() => setDadosEdicaoEquipe({
                          ...dadosEdicaoEquipe,
                          cor
                        })} className={`w-8 h-8 rounded-full border-2 ${dadosEdicaoEquipe.cor === cor ? 'border-gray-800' : 'border-gray-300'}`} style={{
                          backgroundColor: cor
                        }} />)}
                            </div>
                          </div>
                          <div>
                            <Label>Emblema</Label>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {emblemasDisponiveis.map(emblema => <button key={emblema} onClick={() => setDadosEdicaoEquipe({
                          ...dadosEdicaoEquipe,
                          emblema
                        })} className={`w-10 h-10 text-xl rounded-lg border-2 ${dadosEdicaoEquipe.emblema === emblema ? 'border-gray-800 bg-gray-100' : 'border-gray-300'}`}>
                                  {emblema}
                                </button>)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={salvarEdicaoEquipe} size="sm" className="bg-green-500 hover:bg-green-600">
                              Salvar
                            </Button>
                            <Button onClick={() => setEquipeEditando(null)} size="sm" variant="outline">
                              Cancelar
                            </Button>
                          </div>
                        </div> : <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold" style={{
                        backgroundColor: equipe.cor_tema || '#f97316'
                      }}>
                              {equipe.emblema || '🍕'}
                            </div>
                            <div>
                              <div className="font-medium text-lg">{equipe.nome}</div>
                              <div className="text-sm text-gray-600">{equipe.professor_responsavel}</div>
                              <div className="text-sm text-orange-600">
                                Gasto: R$ {equipe.gasto_total.toFixed(2)} | Saldo: R$ {(equipe.saldo_inicial - equipe.gasto_total).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleRegistrarViagem(equipe.id)} size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                              🚗 Viagem (R$ 5,00)
                            </Button>
                            <Button onClick={() => iniciarEdicaoEquipe(equipe)} size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-red-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-red-600">Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a equipe "{equipe.nome}"? 
                                    Esta ação é irreversível e todos os dados da equipe serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoverEquipe(equipe.id)} className="bg-red-600 hover:bg-red-700">
                                    Excluir Equipe
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>}
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itens" className="space-y-6">
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">📦 Gerenciar Itens para Compra</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="nomeProduto">Nome do Produto *</Label>
                    <Input id="nomeProduto" value={novoProduto.nome} onChange={e => setNovoProduto({
                    ...novoProduto,
                    nome: e.target.value
                  })} placeholder="Ex: Massa de Pizza" />
                  </div>
                  <div>
                    <Label htmlFor="unidadeProduto">Unidade *</Label>
                    <Input id="unidadeProduto" value={novoProduto.unidade} onChange={e => setNovoProduto({
                    ...novoProduto,
                    unidade: e.target.value
                  })} placeholder="Ex: folha, unidade, pacote" />
                  </div>
                  <div>
                    <Label htmlFor="valorProduto">Preço (R$) *</Label>
                    <Input id="valorProduto" type="number" step="0.01" value={novoProduto.valor} onChange={e => setNovoProduto({
                    ...novoProduto,
                    valor: Number(e.target.value)
                  })} placeholder="5.00" />
                  </div>
                  <div>
                    <Label htmlFor="durabilidadeProduto">Durabilidade (pizzas) *</Label>
                    <Input id="durabilidadeProduto" type="number" min="1" value={novoProduto.durabilidade} onChange={e => setNovoProduto({
                    ...novoProduto,
                    durabilidade: Number(e.target.value)
                  })} placeholder="Quantas pizzas o item aguenta" />
                  </div>
                  <div>
                    <Label htmlFor="imagemProduto">Imagem do Produto *</Label>
                    <div className="flex items-center gap-2">
                      <Input id="imagemProduto" type="file" accept="image/*" onChange={e => handleImageUpload(e)} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('imagemProduto')?.click()} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        {novoProduto.imagem ? novoProduto.imagem.name : 'Escolher Imagem'}
                      </Button>
                    </div>
                    {novoProduto.imagem && <div className="mt-2 text-sm text-green-600">
                        ✓ Imagem selecionada: {novoProduto.imagem.name}
                      </div>}
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="descricaoProduto">Descrição (opcional)</Label>
                    <Textarea id="descricaoProduto" value={novoProduto.descricao} onChange={e => setNovoProduto({
                    ...novoProduto,
                    descricao: e.target.value
                  })} placeholder="Descrição do produto para ajudar os jogadores" rows={2} />
                  </div>
                </div>
                <Button onClick={handleCriarProduto} className="w-full bg-orange-500 hover:bg-orange-600">
                  Adicionar Produto
                </Button>

                <div className="mt-8 space-y-3">
                  <h3 className="font-semibold text-orange-600">Produtos Disponíveis:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {produtos.map(produto => <div key={produto.id} className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                        {produtoEditando === produto.id ? <div className="space-y-3">
                            <Input value={dadosEdicao.nome} onChange={e => setDadosEdicao({
                        ...dadosEdicao,
                        nome: e.target.value
                      })} placeholder="Nome" />
                            <Input value={dadosEdicao.unidade} onChange={e => setDadosEdicao({
                        ...dadosEdicao,
                        unidade: e.target.value
                      })} placeholder="Unidade" />
                            <Input type="number" step="0.01" value={dadosEdicao.valor} onChange={e => setDadosEdicao({
                        ...dadosEdicao,
                        valor: Number(e.target.value)
                      })} placeholder="Preço" />
                            <Input type="number" min="1" value={dadosEdicao.durabilidade} onChange={e => setDadosEdicao({
                        ...dadosEdicao,
                        durabilidade: Number(e.target.value)
                      })} placeholder="Durabilidade" />
                            <Textarea value={dadosEdicao.descricao} onChange={e => setDadosEdicao({
                        ...dadosEdicao,
                        descricao: e.target.value
                      })} placeholder="Descrição" rows={2} />
                            <div className="flex items-center gap-2">
                              <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" id={`edit-image-${produto.id}`} />
                              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`edit-image-${produto.id}`)?.click()}>
                                <Image className="w-4 h-4" />
                              </Button>
                              {dadosEdicao.imagem && <span className="text-xs text-green-600">Nova imagem selecionada</span>}
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={salvarEdicaoProduto} size="sm" className="bg-green-500 hover:bg-green-600">
                                Salvar
                              </Button>
                              <Button onClick={() => setProdutoEditando(null)} size="sm" variant="outline">
                                Cancelar
                              </Button>
                            </div>
                          </div> : <div className="h-full flex flex-col">
                            <div className="mb-3 flex justify-center">
                              {produto.imagem ? <img src={produto.imagem} alt={produto.nome} className="w-16 h-16 object-cover rounded-lg border shadow-sm" onError={e => {
                          console.log('Erro ao carregar imagem:', produto.imagem);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }} /> : <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                                  <span className="text-2xl">📦</span>
                                </div>}
                            </div>
                            
                            <div className="flex-1 text-center">
                              <div className="font-medium text-lg mb-1">{produto.nome}</div>
                              <div className="text-sm text-gray-600 mb-1">{produto.unidade}</div>
                              <div className="text-sm text-green-600 font-semibold mb-1">
                                R$ {produto.valor_unitario.toFixed(2)}
                              </div>
                              <div className="text-xs text-blue-600 mb-2">
                                Durabilidade: {produto.durabilidade || 1} pizzas
                              </div>
                              {produto.descricao && <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                                  {produto.descricao}
                                </div>}
                            </div>
                            
                            <div className="flex gap-1 justify-center">
                              <Button onClick={() => iniciarEdicaoProduto(produto)} size="sm" variant="outline" className="flex-1">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 flex-1">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-red-200">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">⚠️ Ação Irreversível</AlertDialogTitle>
                                    <AlertDialogDescription className="text-red-700">
                                      <strong>Tem certeza que deseja excluir o produto "{produto.nome}"?</strong>
                                      <br />
                                      <br />
                                      Esta ação é <strong>irreversível</strong> e o produto será removido permanentemente do sistema.
                                      As equipes não poderão mais comprar este item.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removerProduto(produto.id)} className="bg-red-600 hover:bg-red-700">
                                      Excluir Produto
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>}
                      </div>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sabores" className="space-y-6">
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">🍕 Gerenciar Sabores de Pizza</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="nomeSabor">Nome do Sabor *</Label>
                    <Input id="nomeSabor" value={novoSabor.nome} onChange={e => setNovoSabor({
                    ...novoSabor,
                    nome: e.target.value
                  })} placeholder="Ex: Margherita" />
                  </div>
                  <div>
                    <Label htmlFor="descricaoSabor">Descrição (opcional)</Label>
                    <Input id="descricaoSabor" value={novoSabor.descricao} onChange={e => setNovoSabor({
                    ...novoSabor,
                    descricao: e.target.value
                  })} placeholder="Ex: Molho de tomate, mussarela e manjericão" />
                  </div>
                </div>
                <Button onClick={handleCriarSabor} className="w-full bg-orange-500 hover:bg-orange-600">
                  Adicionar Sabor
                </Button>

                <div className="mt-8 space-y-3">
                  <h3 className="font-semibold text-orange-600">Sabores Disponíveis:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sabores.map(sabor => <div key={sabor.id} className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                        {saborEditando === sabor.id ? <div className="space-y-3">
                            <Input value={dadosEdicaoSabor.nome} onChange={e => setDadosEdicaoSabor({
                        ...dadosEdicaoSabor,
                        nome: e.target.value
                      })} placeholder="Nome do sabor" />
                            <Input value={dadosEdicaoSabor.descricao} onChange={e => setDadosEdicaoSabor({
                        ...dadosEdicaoSabor,
                        descricao: e.target.value
                      })} placeholder="Descrição" />
                            <div className="flex gap-2">
                              <Button onClick={salvarEdicaoSabor} size="sm" className="bg-green-500 hover:bg-green-600">
                                Salvar
                              </Button>
                              <Button onClick={() => setSaborEditando(null)} size="sm" variant="outline">
                                Cancelar
                              </Button>
                            </div>
                          </div> : <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">🍕</span>
                              <div className="font-medium text-lg">{sabor.nome}</div>
                            </div>
                            {sabor.descricao && <div className="text-sm text-gray-600 mb-3">{sabor.descricao}</div>}
                            <div className="flex gap-2">
                              <Button onClick={() => iniciarEdicaoSabor(sabor)} size="sm" variant="outline" className="flex-1">
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>}
                      </div>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendas" className="space-y-6">
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">💰 Gestão de Vendas</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Formulário de Venda */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-orange-600">Registrar Nova Venda</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipoVenda">Tipo de Venda</Label>
                        <Select value={vendaAtual.tipo} onValueChange={(value: 'material' | 'viagem') => setVendaAtual({...vendaAtual, tipo: value, produtoId: ''})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="material">📦 Material/Produto</SelectItem>
                            <SelectItem value="viagem">🚗 Viagem (R$ 5,00)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="equipeVenda">Equipe</Label>
                        <Select value={vendaAtual.equipeId} onValueChange={(value) => setVendaAtual({...vendaAtual, equipeId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a equipe" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipes.map(equipe => (
                              <SelectItem key={equipe.id} value={equipe.id}>
                                <div className="flex items-center gap-2">
                                  <span style={{color: equipe.cor_tema}}>{equipe.emblema}</span>
                                  {equipe.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {vendaAtual.tipo === 'material' && (
                        <div>
                          <Label htmlFor="produtoVenda">Produto</Label>
                          <Select value={vendaAtual.produtoId} onValueChange={(value) => setVendaAtual({...vendaAtual, produtoId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.map(produto => (
                                <SelectItem key={produto.id} value={produto.id}>
                                  <div className="flex justify-between items-center w-full">
                                    <span>{produto.nome}</span>
                                    <span className="text-green-600 font-semibold ml-2">
                                      R$ {produto.valor_unitario.toFixed(2)}/{produto.unidade}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {vendaAtual.tipo === 'material' && (
                        <div>
                          <Label htmlFor="quantidadeVenda">Quantidade</Label>
                          <Input 
                            id="quantidadeVenda"
                            type="number" 
                            min="1" 
                            value={vendaAtual.quantidade} 
                            onChange={e => setVendaAtual({...vendaAtual, quantidade: Number(e.target.value)})}
                          />
                        </div>
                      )}

                      {/* Preview do valor */}
                      {vendaAtual.equipeId && (vendaAtual.tipo === 'viagem' || vendaAtual.produtoId) && (
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="font-semibold text-orange-700">Resumo da Venda:</div>
                          <div className="mt-2">
                            <div>Equipe: <span className="font-medium">{equipes.find(e => e.id === vendaAtual.equipeId)?.nome}</span></div>
                            {vendaAtual.tipo === 'viagem' ? (
                              <div>Tipo: <span className="font-medium">Viagem à loja</span></div>
                            ) : (
                              <>
                                <div>Produto: <span className="font-medium">{produtos.find(p => p.id === vendaAtual.produtoId)?.nome}</span></div>
                                <div>Quantidade: <span className="font-medium">{vendaAtual.quantidade}</span></div>
                              </>
                            )}
                            <div className="text-lg font-bold text-green-600 mt-2">
                              Total: R$ {vendaAtual.tipo === 'viagem' 
                                ? '5,00' 
                                : (produtos.find(p => p.id === vendaAtual.produtoId)?.valor_unitario * vendaAtual.quantidade || 0).toFixed(2)
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={handleRegistrarVenda} 
                        className="w-full bg-green-500 hover:bg-green-600"
                        disabled={!vendaAtual.equipeId || (vendaAtual.tipo === 'material' && !vendaAtual.produtoId)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Registrar Venda
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Produtos Disponíveis */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-orange-600">Produtos Disponíveis</h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {produtos.map(produto => (
                        <div key={produto.id} className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            {produto.imagem ? (
                              <img 
                                src={produto.imagem} 
                                alt={produto.nome} 
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                                <span className="text-lg">📦</span>
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="font-medium text-lg">{produto.nome}</div>
                              <div className="text-sm text-gray-600">{produto.unidade}</div>
                              <div className="text-sm text-green-600 font-semibold">
                                R$ {produto.valor_unitario.toFixed(2)}
                              </div>
                              <div className="text-xs text-blue-600">
                                Durabilidade: {produto.durabilidade || 1} pizzas
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setVendaAtual({
                                ...vendaAtual,
                                produtoId: produto.id,
                                tipo: 'material'
                              })}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botão para viagem */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">🚗 Viagem à Loja</div>
                          <div className="text-sm text-gray-600">Transporte para compras</div>
                          <div className="text-sm text-green-600 font-semibold">R$ 5,00</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setVendaAtual({
                            ...vendaAtual,
                            tipo: 'viagem',
                            produtoId: ''
                          })}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Selecionar
                        </Button>
                      </div>
                    </div>
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
    </div>;
};

export default LojinhaScreen;
