
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProdutos } from '@/hooks/useProdutos';
import { useCompras } from '@/hooks/useCompras';
import { useRodadas } from '@/hooks/useRodadas';
import { toast } from 'sonner';

interface MontadorPizzaProps {
  equipeId: string;
  equipeNome: string;
  saldoDisponivel: number;
  onPizzaMontada: () => void;
}

const MontadorPizza = ({ equipeId, equipeNome, saldoDisponivel, onPizzaMontada }: MontadorPizzaProps) => {
  const { produtos } = useProdutos();
  const { registrarCompra } = useCompras();
  const { rodadaAtual } = useRodadas();
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState<string[]>([]);
  const [montandoPizza, setMontandoPizza] = useState(false);

  // Ingredientes base necessários (por nome - podem ser configurados no banco)
  const ingredientesBaseNomes = ['massa de pizza', 'molho', 'caneta do molho'];
  
  // Filtrar produtos disponíveis
  const produtosDisponiveis = produtos.filter(produto => produto.disponivel);
  
  // Identificar ingredientes base
  const ingredientesBase = produtosDisponiveis.filter(produto => 
    ingredientesBaseNomes.some(nomeBase => 
      produto.nome.toLowerCase().includes(nomeBase.toLowerCase())
    )
  );
  
  // Identificar toppings (todos os outros produtos)
  const toppings = produtosDisponiveis.filter(produto => 
    !ingredientesBaseNomes.some(nomeBase => 
      produto.nome.toLowerCase().includes(nomeBase.toLowerCase())
    )
  );

  const toggleIngrediente = (produtoId: string) => {
    setIngredientesSelecionados(prev => {
      if (prev.includes(produtoId)) {
        return prev.filter(id => id !== produtoId);
      } else {
        return [...prev, produtoId];
      }
    });
  };

  const calcularPrecoTotal = () => {
    const custoViagem = 5; // Cobrança fixa por viagem à loja
    const custoIngredientes = ingredientesSelecionados.reduce((total, produtoId) => {
      const produto = produtosDisponiveis.find(p => p.id === produtoId);
      return total + (produto?.valor_unitario || 0);
    }, 0);
    return custoViagem + custoIngredientes;
  };

  const verificarIngredientesValidos = () => {
    // Verificar se pelo menos um ingrediente base está selecionado
    return ingredientesBase.some(base => ingredientesSelecionados.includes(base.id));
  };

  const confirmarPizza = async () => {
    if (!verificarIngredientesValidos()) {
      toast.error('Pizza deve ter pelo menos um ingrediente base (massa ou molho)!');
      return;
    }

    const precoTotal = calcularPrecoTotal();
    if (precoTotal > saldoDisponivel) {
      toast.error('Saldo insuficiente para esta pizza!');
      return;
    }

    try {
      setMontandoPizza(true);

      // Registrar a viagem (custo fixo de $5)
      await registrarCompra(
        equipeId,
        null, // produto_id null para viagem
        rodadaAtual?.id || null,
        1,
        5,
        'viagem',
        'Viagem para comprar ingredientes'
      );

      // Registrar cada ingrediente comprado
      for (const produtoId of ingredientesSelecionados) {
        const produto = produtosDisponiveis.find(p => p.id === produtoId);
        if (produto) {
          await registrarCompra(
            equipeId,
            produto.id,
            rodadaAtual?.id || null,
            1,
            produto.valor_unitario,
            'material',
            `Ingrediente: ${produto.nome}`
          );
        }
      }

      toast.success('🍕 Pizza montada com sucesso!');
      setIngredientesSelecionados([]);
      onPizzaMontada();
    } catch (error) {
      toast.error('Erro ao montar pizza');
    } finally {
      setMontandoPizza(false);
    }
  };

  const renderProdutoCard = (produto: any, tipo: 'base' | 'topping') => {
    const isSelected = ingredientesSelecionados.includes(produto.id);
    const corBase = tipo === 'base' ? 'orange' : 'green';
    
    return (
      <Button
        key={produto.id}
        variant={isSelected ? "default" : "outline"}
        className={`h-24 flex flex-col items-center justify-center space-y-1 p-2 ${
          isSelected 
            ? `bg-${corBase}-500 hover:bg-${corBase}-600` 
            : `hover:bg-${corBase}-50`
        }`}
        onClick={() => toggleIngrediente(produto.id)}
      >
        {produto.imagem ? (
          <img 
            src={produto.imagem} 
            alt={produto.nome}
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs">📦</span>
          </div>
        )}
        <span className="text-xs font-medium text-center">{produto.nome}</span>
        <span className="text-xs">R$ {produto.valor_unitario.toFixed(2)}</span>
      </Button>
    );
  };

  return (
    <Card className="shadow-lg border-2 border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-orange-600">🍕 Montador de Pizza - {equipeNome}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Saldo Disponível */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              R$ {saldoDisponivel.toFixed(2)}
            </div>
            <div className="text-sm text-blue-700">Saldo Disponível</div>
          </div>

          {/* Ingredientes Base (Obrigatórios) */}
          {ingredientesBase.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-orange-600">Ingredientes Base (Obrigatórios)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ingredientesBase.map((produto) => renderProdutoCard(produto, 'base'))}
              </div>
            </div>
          )}

          {/* Toppings Opcionais */}
          {toppings.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-green-600">Toppings (Opcionais)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {toppings.map((produto) => renderProdutoCard(produto, 'topping'))}
              </div>
            </div>
          )}

          {/* Mensagem se não há produtos */}
          {produtosDisponiveis.length === 0 && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-700">
                Nenhum produto disponível na loja. Aguarde o professor adicionar ingredientes.
              </p>
            </div>
          )}

          {/* Resumo da Pizza */}
          {ingredientesSelecionados.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-700 mb-2">Resumo da Pizza:</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Viagem à loja:</span>
                  <span>R$ 5,00</span>
                </div>
                {ingredientesSelecionados.map(produtoId => {
                  const produto = produtosDisponiveis.find(p => p.id === produtoId);
                  return produto ? (
                    <div key={produtoId} className="flex justify-between text-sm items-center">
                      <div className="flex items-center gap-2">
                        {produto.imagem ? (
                          <img 
                            src={produto.imagem} 
                            alt={produto.nome}
                            className="w-4 h-4 object-cover rounded"
                          />
                        ) : (
                          <span>📦</span>
                        )}
                        <span>{produto.nome}</span>
                      </div>
                      <span>R$ {produto.valor_unitario.toFixed(2)}</span>
                    </div>
                  ) : null;
                })}
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">R$ {calcularPrecoTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Validações */}
          {!verificarIngredientesValidos() && ingredientesSelecionados.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-red-600 text-sm">
                ⚠️ Adicione pelo menos um ingrediente base para fazer uma pizza válida!
              </p>
            </div>
          )}

          {calcularPrecoTotal() > saldoDisponivel && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-red-600 text-sm">
                ⚠️ Saldo insuficiente! Remova alguns ingredientes.
              </p>
            </div>
          )}

          {/* Botão Confirmar */}
          <Button
            onClick={confirmarPizza}
            disabled={!verificarIngredientesValidos() || calcularPrecoTotal() > saldoDisponivel || montandoPizza || produtosDisponiveis.length === 0}
            className="w-full h-14 text-lg bg-green-500 hover:bg-green-600"
          >
            {montandoPizza ? '🔄 Montando Pizza...' : '🍕 Confirmar Pizza'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MontadorPizza;
