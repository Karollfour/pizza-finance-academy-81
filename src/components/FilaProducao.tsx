
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePizzas } from '@/hooks/usePizzas';
import { useRodadas } from '@/hooks/useRodadas';

interface FilaProducaoProps {
  equipeId: string;
  equipeNome: string;
}

const FilaProducao = ({ equipeId, equipeNome }: FilaProducaoProps) => {
  const { rodadaAtual } = useRodadas();
  const { pizzas, marcarPizzaPronta } = usePizzas(equipeId, rodadaAtual?.id);

  // Organizar pizzas por status
  const pizzasEmProducao = pizzas.filter(p => p.status === 'em_producao');
  const pizzasProntas = pizzas.filter(p => p.status === 'pronta');
  const pizzasAvaliadas = pizzas.filter(p => p.status === 'avaliada');

  // Simular fila de próximas pizzas (baseado em pizzas futuras que serão produzidas)
  const proximasPizzas = [
    { id: 'proxima1', tipo: 'Portuguesa', ingredientes: ['massa', 'molho', 'presunto', 'ovo', 'queijo'] },
    { id: 'proxima2', tipo: 'Mussarela', ingredientes: ['massa', 'molho', 'queijo', 'tomate'] }
  ];

  const handleMarcarPronta = async () => {
    if (!rodadaAtual) return;
    
    try {
      await marcarPizzaPronta(equipeId, rodadaAtual.id);
    } catch (error) {
      console.error('Erro ao marcar pizza como pronta:', error);
    }
  };

  const getStatusColor = (status: string, resultado?: string | null) => {
    if (status === 'em_producao') return 'bg-yellow-500';
    if (status === 'pronta') return 'bg-blue-500';
    if (resultado === 'aprovada') return 'bg-green-500';
    if (resultado === 'reprovada') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusText = (status: string, resultado?: string | null) => {
    if (status === 'em_producao') return 'Em Produção';
    if (status === 'pronta') return 'Aguardando Avaliação';
    if (resultado === 'aprovada') return 'Aprovada';
    if (resultado === 'reprovada') return 'Reprovada';
    return 'Desconhecido';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Em Produção */}
      <Card className="shadow-lg border-2 border-yellow-200">
        <CardHeader className="bg-yellow-50">
          <CardTitle className="text-yellow-600 text-center">🔥 Em Produção</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {pizzasEmProducao.length > 0 ? (
            <div className="space-y-3">
              {pizzasEmProducao.map((pizza, index) => (
                <div key={pizza.id} className="p-4 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                  <div className="text-center mb-3">
                    <div className="text-6xl mb-2">🍕</div>
                    <div className="font-bold text-lg">Pizza #{pizzas.length - index}</div>
                    <div className="text-sm text-gray-600">
                      Iniciada: {new Date(pizza.created_at).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleMarcarPronta}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3"
                    disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'}
                  >
                    ✅ Marcar como Pronta
                  </Button>
                </div>
              ))}
              
              {pizzasEmProducao.length === 0 && rodadaAtual?.status === 'ativa' && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔨</div>
                  <p className="text-gray-600">Nenhuma pizza em produção</p>
                  <p className="text-sm text-gray-500">Monte uma nova pizza para começar!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-gray-600">Aguardando produção</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximo 1 */}
      <Card className="shadow-lg border-2 border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-600 text-center">➡️ Próximo 1</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-2">🍕</div>
            <div className="font-bold text-lg text-green-600">Portuguesa</div>
            <div className="text-sm text-gray-600 mt-2">
              Ingredientes: Presunto, Ovo, Queijo, Tomate
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-700">
                Esta pizza será produzida automaticamente após finalizar a atual
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximo 2 */}
      <Card className="shadow-lg border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-600 text-center">⏭️ Próximo 2</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-2">🍕</div>
            <div className="font-bold text-lg text-blue-600">Mussarela</div>
            <div className="text-sm text-gray-600 mt-2">
              Ingredientes: Queijo, Tomate, Orégano
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-700">
                Próxima na fila após Portuguesa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Pizzas Produzidas */}
      {(pizzasProntas.length > 0 || pizzasAvaliadas.length > 0) && (
        <div className="lg:col-span-3 mt-4">
          <Card className="shadow-lg border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-600">📊 Histórico da Rodada</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...pizzasProntas, ...pizzasAvaliadas]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((pizza, index) => (
                    <div key={pizza.id} className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Pizza #{pizzas.length - index}</span>
                        <Badge className={getStatusColor(pizza.status, pizza.resultado)}>
                          {getStatusText(pizza.status, pizza.resultado)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pizza.created_at).toLocaleString('pt-BR')}
                      </div>
                      {pizza.resultado === 'reprovada' && pizza.justificativa_reprovacao && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                          {pizza.justificativa_reprovacao}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FilaProducao;
