
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePizzas } from '@/hooks/usePizzas';
import { useOptimizedRodadas } from '@/hooks/useOptimizedRodadas';
import { usePedidosRodada } from '@/hooks/usePedidosRodada';
import { toast } from 'sonner';

interface FilaProducaoProps {
  equipeId: string;
  equipeNome: string;
  onPizzaEnviada: () => void;
}

const FilaProducao = ({ equipeId, equipeNome, onPizzaEnviada }: FilaProducaoProps) => {
  const { rodadaAtual } = useOptimizedRodadas();
  const { pizzas, marcarPizzaPronta } = usePizzas(equipeId, rodadaAtual?.id);
  const { pedidoAtivo, registrarEntregaPizza } = usePedidosRodada(rodadaAtual?.id);
  const [enviandoPizza, setEnviandoPizza] = useState(false);

  const handleConfirmarPedido = async () => {
    if (!rodadaAtual || !pedidoAtivo) return;
    
    try {
      setEnviandoPizza(true);
      
      // Marcar pizza como pronta com o sabor do pedido ativo
      await marcarPizzaPronta(equipeId, rodadaAtual.id, pedidoAtivo.sabor_id);
      
      // Registrar entrega no sistema de pedidos
      await registrarEntregaPizza(pedidoAtivo.id, equipeId);
      
      onPizzaEnviada();
      
      toast.success(`🍕 Pizza de ${pedidoAtivo.sabor.nome} confirmada e enviada!`);
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      toast.error('Erro ao confirmar pedido. Tente novamente.');
    } finally {
      setEnviandoPizza(false);
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

  const getSaborNome = (pizza: any) => {
    return pizza.sabor?.nome || 'Sabor não informado';
  };

  // Verificar se a equipe já entregou o pedido ativo
  const jaEntregouPedidoAtivo = pedidoAtivo?.equipes_que_entregaram?.includes(equipeId) || false;

  return (
    <div className="space-y-6">
      {/* Confirmação do Pedido Ativo */}
      {pedidoAtivo && (
        <Card className={`shadow-lg border-2 ${jaEntregouPedidoAtivo ? 'border-green-300' : 'border-orange-300'}`}>
          <CardHeader className={jaEntregouPedidoAtivo ? 'bg-green-50' : 'bg-orange-50'}>
            <CardTitle className={`text-center ${jaEntregouPedidoAtivo ? 'text-green-600' : 'text-orange-600'}`}>
              {jaEntregouPedidoAtivo ? '✅ Pedido Já Entregue' : '🎯 Confirmar Pedido Atual'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`text-4xl font-bold mb-4 ${jaEntregouPedidoAtivo ? 'text-green-600' : 'text-orange-600'}`}>
                {pedidoAtivo.sabor.nome}
              </div>
              
              {pedidoAtivo.sabor.descricao && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">{pedidoAtivo.sabor.descricao}</p>
                </div>
              )}
              
              {jaEntregouPedidoAtivo ? (
                <div className="space-y-2">
                  <p className="text-lg text-green-600 font-medium">
                    Sua equipe já entregou este pedido!
                  </p>
                  <p className="text-sm text-gray-600">
                    Aguarde o próximo pedido ser ativado
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-orange-600 font-medium">
                    Faça uma pizza deste sabor e confirme a entrega
                  </p>
                  
                  <Button
                    onClick={handleConfirmarPedido}
                    className="w-full h-16 text-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                    disabled={!rodadaAtual || rodadaAtual.status !== 'ativa' || enviandoPizza}
                  >
                    {enviandoPizza ? (
                      <>🔄 Confirmando...</>
                    ) : (
                      <>✅ Confirmar Entrega do Pedido</>
                    )}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {pedidoAtivo.pizzas_entregues}
                      </div>
                      <div className="text-blue-700">Total Entregues</div>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {pedidoAtivo.equipes_que_entregaram.length}
                      </div>
                      <div className="text-purple-700">Equipes que Entregaram</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Pizzas da Rodada */}
      {pizzas.length > 0 && (
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-600">📊 Pizzas da Rodada {rodadaAtual?.numero}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pizzas
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((pizza, index) => (
                  <div key={pizza.id} className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">Pizza #{pizzas.length - index}</span>
                      <Badge className={`text-white ${getStatusColor(pizza.status, pizza.resultado)}`}>
                        {getStatusText(pizza.status, pizza.resultado)}
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Sabor: </span>
                      <span className="text-sm text-gray-600">{getSaborNome(pizza)}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">
                      Enviada: {new Date(pizza.created_at).toLocaleString('pt-BR')}
                    </div>
                    
                    {pizza.resultado === 'reprovada' && pizza.justificativa_reprovacao && (
                      <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-600">
                        <strong>Motivo da reprovação:</strong><br />
                        {pizza.justificativa_reprovacao}
                      </div>
                    )}
                    {pizza.resultado === 'aprovada' && (
                      <div className="mt-3 p-3 bg-green-50 rounded text-sm text-green-600">
                        <strong>✅ Pizza aprovada!</strong>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há pedido ativo */}
      {!pedidoAtivo && rodadaAtual?.status === 'ativa' && (
        <Card className="shadow-lg border-2 border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Aguardando Próximo Pedido
            </h3>
            <p className="text-gray-500">
              O administrador ainda não ativou nenhum pedido para esta rodada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há pizzas */}
      {pizzas.length === 0 && rodadaAtual?.status === 'ativa' && pedidoAtivo && (
        <Card className="shadow-lg border-2 border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Primeira Pizza da Rodada
            </h3>
            <p className="text-gray-500">
              Confirme o pedido acima para ser o primeiro a enviar uma pizza nesta rodada!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilaProducao;
