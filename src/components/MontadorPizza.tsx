
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

  // Ingredientes base necessários para fazer uma pizza
  const ingredientesBase = ['massa_de_pizza', 'caneta_do_molho'];
  
  // Mapear produtos com seus dados específicos
  const produtosPizza = [
    { id: 'massa_de_pizza', nome: 'Massa de Pizza', preco: 5, emoji: '🍕', tipo: 'base' },
    { id: 'caneta_do_molho', nome: 'Caneta do Molho', preco: 5, emoji: '🖊️', tipo: 'base' },
    { id: 'pepperoni', nome: 'Pepperoni', preco: 1, emoji: '🍖', tipo: 'topping' },
    { id: 'queijo', nome: 'Queijo', preco: 2, emoji: '🧀', tipo: 'topping' },
    { id: 'tomate', nome: 'Tomate', preco: 1, emoji: '🍅', tipo: 'topping' },
    { id: 'oregano', nome: 'Orégano', preco: 1, emoji: '🌿', tipo: 'topping' }
  ];

  const toggleIngrediente = (ingredienteId: string) => {
    setIngredientesSelecionados(prev => {
      if (prev.includes(ingredienteId)) {
        return prev.filter(id => id !== ingredienteId);
      } else {
        return [...prev, ingredienteId];
      }
    });
  };

  const calcularPrecoTotal = () => {
    const custoViagem = 5; // Cobrança fixa por viagem à loja
    const custoIngredientes = ingredientesSelecionados.reduce((total, ingredienteId) => {
      const produto = produtosPizza.find(p => p.id === ingredienteId);
      return total + (produto?.preco || 0);
    }, 0);
    return custoViagem + custoIngredientes;
  };

  const verificarIngredientesValidos = () => {
    return ingredientesBase.every(base => ingredientesSelecionados.includes(base));
  };

  const confirmarPizza = async () => {
    if (!verificarIngredientesValidos()) {
      toast.error('Pizza deve ter pelo menos massa e molho!');
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
      for (const ingredienteId of ingredientesSelecionados) {
        const produto = produtosPizza.find(p => p.id === ingredienteId);
        if (produto) {
          // Buscar o produto real do banco se existir, senão usar dados mock
          const produtoReal = produtos.find(p => p.nome.toLowerCase().includes(produto.nome.toLowerCase()));
          
          await registrarCompra(
            equipeId,
            produtoReal?.id || null,
            rodadaAtual?.id || null,
            1,
            produto.preco,
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
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-600">Ingredientes Base (Obrigatórios)</h3>
            <div className="grid grid-cols-2 gap-3">
              {produtosPizza.filter(p => p.tipo === 'base').map((produto) => (
                <Button
                  key={produto.id}
                  variant={ingredientesSelecionados.includes(produto.id) ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center space-y-1 ${
                    ingredientesSelecionados.includes(produto.id) 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'hover:bg-orange-50'
                  }`}
                  onClick={() => toggleIngrediente(produto.id)}
                >
                  <span className="text-2xl">{produto.emoji}</span>
                  <span className="text-xs font-medium">{produto.nome}</span>
                  <span className="text-xs">R$ {produto.preco}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Toppings Opcionais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600">Toppings (Opcionais)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {produtosPizza.filter(p => p.tipo === 'topping').map((produto) => (
                <Button
                  key={produto.id}
                  variant={ingredientesSelecionados.includes(produto.id) ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center space-y-1 ${
                    ingredientesSelecionados.includes(produto.id) 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'hover:bg-green-50'
                  }`}
                  onClick={() => toggleIngrediente(produto.id)}
                >
                  <span className="text-2xl">{produto.emoji}</span>
                  <span className="text-xs font-medium">{produto.nome}</span>
                  <span className="text-xs">R$ {produto.preco}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Resumo da Pizza */}
          {ingredientesSelecionados.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-700 mb-2">Resumo da Pizza:</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Viagem à loja:</span>
                  <span>R$ 5,00</span>
                </div>
                {ingredientesSelecionados.map(ingredienteId => {
                  const produto = produtosPizza.find(p => p.id === ingredienteId);
                  return produto ? (
                    <div key={ingredienteId} className="flex justify-between text-sm">
                      <span>{produto.emoji} {produto.nome}:</span>
                      <span>R$ {produto.preco.toFixed(2)}</span>
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
                ⚠️ Adicione pelo menos massa e molho para fazer uma pizza válida!
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
            disabled={!verificarIngredientesValidos() || calcularPrecoTotal() > saldoDisponivel || montandoPizza}
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
