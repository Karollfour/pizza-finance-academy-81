
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePedidosRodada } from '@/hooks/usePedidosRodada';
import { Rodada } from '@/types/database';

interface PedidoAtualEquipeProps {
  rodadaAtual: Rodada | null;
  equipeId: string;
}

const PedidoAtualEquipe = ({ rodadaAtual, equipeId }: PedidoAtualEquipeProps) => {
  const { pedidoAtivo, pedidos } = usePedidosRodada(rodadaAtual?.id);
  const [jaEntregou, setJaEntregou] = useState(false);

  useEffect(() => {
    if (pedidoAtivo && equipeId) {
      setJaEntregou(pedidoAtivo.equipes_que_entregaram.includes(equipeId));
    }
  }, [pedidoAtivo, equipeId]);

  // Escutar eventos globais de entrega
  useEffect(() => {
    const handlePizzaEntregue = (event: CustomEvent) => {
      const { equipeId: entregaEquipeId, pedidoId } = event.detail;
      if (entregaEquipeId === equipeId && pedidoId === pedidoAtivo?.id) {
        setJaEntregou(true);
      }
    };

    const handlePedidoAtivado = () => {
      setJaEntregou(false);
    };

    window.addEventListener('pizza-entregue-pedido', handlePizzaEntregue as EventListener);
    window.addEventListener('pedido-ativado', handlePedidoAtivado);

    return () => {
      window.removeEventListener('pizza-entregue-pedido', handlePizzaEntregue as EventListener);
      window.removeEventListener('pedido-ativado', handlePedidoAtivado);
    };
  }, [equipeId, pedidoAtivo?.id]);

  if (!rodadaAtual || rodadaAtual.status !== 'ativa') {
    return null;
  }

  if (!pedidoAtivo) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-600">🎯 Pedido Atual</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-lg">Aguardando próximo pedido...</p>
            <p className="text-sm">O administrador ativará o próximo sabor em breve</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg border-2 ${jaEntregou ? 'border-green-300' : 'border-orange-300'}`}>
      <CardHeader className={jaEntregou ? 'bg-green-50' : 'bg-orange-50'}>
        <CardTitle className={`flex items-center justify-between ${jaEntregou ? 'text-green-600' : 'text-orange-600'}`}>
          {jaEntregou ? '✅ Pedido Concluído' : '🎯 Pedido Atual'}
          <Badge className={jaEntregou ? 'bg-green-500' : 'bg-orange-500'}>
            #{pedidoAtivo.ordem}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-4 ${jaEntregou ? 'text-green-600' : 'text-orange-600'}`}>
            {pedidoAtivo.sabor.nome}
          </div>
          
          {jaEntregou ? (
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
                Faça uma pizza deste sabor e entregue!
              </p>
              
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
          
          {pedidoAtivo.sabor.descricao && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">{pedidoAtivo.sabor.descricao}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PedidoAtualEquipe;
