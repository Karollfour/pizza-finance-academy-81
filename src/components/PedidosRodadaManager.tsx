
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePedidosRodada } from '@/hooks/usePedidosRodada';
import { useSabores } from '@/hooks/useSabores';
import { useEquipes } from '@/hooks/useEquipes';
import { Rodada } from '@/types/database';

interface PedidosRodadaManagerProps {
  rodadaAtual: Rodada | null;
}

const PedidosRodadaManager = ({ rodadaAtual }: PedidosRodadaManagerProps) => {
  const { sabores } = useSabores();
  const { equipes } = useEquipes();
  const {
    pedidos,
    pedidoAtivo,
    loading,
    gerarPedidosParaRodada,
    ativarProximoPedido
  } = usePedidosRodada(rodadaAtual?.id);

  const handleGerarPedidos = async () => {
    if (!rodadaAtual || sabores.length === 0) return;
    
    const saboresDisponiveis = sabores.filter(s => s.disponivel);
    if (saboresDisponiveis.length === 0) {
      alert('Nenhum sabor disponível para gerar pedidos!');
      return;
    }

    try {
      await gerarPedidosParaRodada(rodadaAtual.id, saboresDisponiveis, equipes.length);
    } catch (error) {
      console.error('Erro ao gerar pedidos:', error);
    }
  };

  const handleAtivarProximo = async () => {
    try {
      await ativarProximoPedido();
    } catch (error) {
      console.error('Erro ao ativar próximo pedido:', error);
    }
  };

  const getEquipeNome = (equipeId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    return equipe ? equipe.nome : 'Equipe não encontrada';
  };

  if (!rodadaAtual) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-600">🎯 Pedidos da Rodada</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Nenhuma rodada ativa para gerenciar pedidos
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2 border-purple-200">
      <CardHeader className="bg-purple-50">
        <CardTitle className="text-purple-600 flex items-center justify-between">
          🎯 Pedidos da Rodada {rodadaAtual.numero}
          <div className="flex gap-2">
            {pedidos.length === 0 && rodadaAtual.status === 'aguardando' && (
              <Button 
                onClick={handleGerarPedidos}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                disabled={loading || sabores.length === 0}
              >
                Gerar Pedidos
              </Button>
            )}
            {pedidos.length > 0 && rodadaAtual.status === 'ativa' && (
              <Button 
                onClick={handleAtivarProximo}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
                disabled={loading}
              >
                Próximo Pedido
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg text-gray-600 mb-2">Nenhum pedido gerado ainda</p>
            <p className="text-gray-500">
              Os pedidos serão alternados entre os sabores disponíveis
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pedido Ativo */}
            {pedidoAtivo && (
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-green-800">
                    🔥 Pedido Ativo
                  </h3>
                  <Badge className="bg-green-500">
                    Ordem #{pedidoAtivo.ordem}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {pedidoAtivo.sabor.nome}
                    </div>
                    <div className="text-sm text-green-700">Sabor Atual</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {pedidoAtivo.pizzas_entregues}
                    </div>
                    <div className="text-sm text-gray-600">Pizzas Entregues</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {pedidoAtivo.equipes_que_entregaram.length}
                    </div>
                    <div className="text-sm text-gray-600">Equipes que Entregaram</div>
                  </div>
                </div>
                
                {pedidoAtivo.equipes_que_entregaram.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-700 mb-2">Equipes que já entregaram:</h4>
                    <div className="flex flex-wrap gap-2">
                      {pedidoAtivo.equipes_que_entregaram.map(equipeId => (
                        <Badge key={equipeId} variant="outline" className="bg-green-50">
                          {getEquipeNome(equipeId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lista de Todos os Pedidos */}
            <div>
              <h3 className="text-lg font-bold text-purple-800 mb-3">
                📋 Sequência Completa de Pedidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {pedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className={`p-3 rounded-lg border ${
                      pedido.status === 'ativo'
                        ? 'bg-green-100 border-green-300'
                        : pedido.status === 'concluido'
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-600">
                        #{pedido.ordem}
                      </span>
                      <Badge
                        variant={
                          pedido.status === 'ativo'
                            ? 'default'
                            : pedido.status === 'concluido'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={
                          pedido.status === 'ativo'
                            ? 'bg-green-500'
                            : pedido.status === 'concluido'
                            ? 'bg-gray-500'
                            : 'bg-purple-100'
                        }
                      >
                        {pedido.status === 'ativo' && '🔥 Ativo'}
                        {pedido.status === 'concluido' && '✅ Concluído'}
                        {pedido.status === 'aguardando' && '⏳ Aguardando'}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{pedido.sabor.nome}</div>
                      <div className="text-gray-600">
                        {pedido.pizzas_entregues} entrega(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidosRodadaManager;
