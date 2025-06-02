
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePizzas } from '@/hooks/usePizzas';
import { useOptimizedRodadas } from '@/hooks/useOptimizedRodadas';

interface FilaProducaoProps {
  equipeId: string;
  equipeNome: string;
  onPizzaEnviada: () => void;
}

const FilaProducao = ({ equipeId, equipeNome, onPizzaEnviada }: FilaProducaoProps) => {
  const { rodadaAtual } = useOptimizedRodadas();
  const { pizzas, marcarPizzaPronta } = usePizzas(equipeId, rodadaAtual?.id);

  const handleEnviarPizza = async () => {
    if (!rodadaAtual) return;
    
    try {
      await marcarPizzaPronta(equipeId, rodadaAtual.id);
      onPizzaEnviada();
    } catch (error) {
      console.error('Erro ao enviar pizza para avaliação:', error);
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
    <div className="space-y-6">
      {/* Botão para Enviar Pizza */}
      <Card className="shadow-lg border-2 border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-600 text-center">🍕 Produção de Pizza</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🍕</div>
            <h3 className="text-xl font-bold text-gray-700">
              Pronto para enviar uma pizza?
            </h3>
            <p className="text-gray-600">
              Clique no botão abaixo quando sua pizza estiver pronta para avaliação
            </p>
            <Button
              onClick={handleEnviarPizza}
              className="w-full h-16 text-xl bg-green-500 hover:bg-green-600 text-white font-bold"
              disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'}
            >
              ✅ Enviar Pizza para Avaliação
            </Button>
            {(!rodadaAtual || rodadaAtual.status !== 'ativa') && (
              <p className="text-sm text-gray-500">
                Aguardando rodada ativa para enviar pizzas
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Mensagem quando não há pizzas */}
      {pizzas.length === 0 && rodadaAtual?.status === 'ativa' && (
        <Card className="shadow-lg border-2 border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Primeira Pizza da Rodada
            </h3>
            <p className="text-gray-500">
              Seja o primeiro a enviar uma pizza para avaliação nesta rodada!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilaProducao;
