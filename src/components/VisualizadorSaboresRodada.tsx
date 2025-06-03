
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { useSabores } from '@/hooks/useSabores';
import { useEffect, useState } from 'react';

interface VisualizadorSaboresRodadaProps {
  rodadaId?: string;
}

const VisualizadorSaboresRodada = ({ rodadaId }: VisualizadorSaboresRodadaProps) => {
  const { historico } = useHistoricoSaboresRodada(rodadaId);
  const { sabores } = useSabores();
  const [indiceAtual, setIndiceAtual] = useState(0);

  // Encontrar o índice do sabor atual baseado no número de pizzas enviadas
  useEffect(() => {
    // Aqui você pode implementar a lógica para determinar qual sabor está ativo
    // Por enquanto, vamos usar o último sabor adicionado
    if (historico.length > 0) {
      setIndiceAtual(historico.length - 1);
    }
  }, [historico]);

  if (!rodadaId || historico.length === 0) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🍕</div>
          <p className="text-gray-500">Aguardando início da rodada...</p>
        </CardContent>
      </Card>
    );
  }

  const saborAtual = historico[indiceAtual];
  const proximoSabor2 = historico[indiceAtual + 1];
  const proximoSabor3 = historico[indiceAtual + 2];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sabor Atual - Ocupa mais espaço */}
      <div className="lg:col-span-2">
        <Card className="shadow-xl border-4 border-green-400 bg-green-50">
          <CardContent className="p-8 text-center">
            <Badge className="bg-green-500 text-white text-lg px-4 py-2 mb-4">
              🍕 SABOR ATUAL
            </Badge>
            <div className="text-6xl mb-4">🍕</div>
            <h2 className="text-4xl font-bold text-green-700 mb-2">
              {saborAtual?.sabor?.nome || 'Sabor não encontrado'}
            </h2>
            {saborAtual?.sabor?.descricao && (
              <p className="text-lg text-green-600 mb-4">
                {saborAtual.sabor.descricao}
              </p>
            )}
            <div className="text-lg text-green-600">
              Ordem: {saborAtual?.ordem || 1}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Sabores */}
      <div className="space-y-4">
        {/* Próximo Sabor 2 */}
        {proximoSabor2 && (
          <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                PRÓXIMO 2
              </Badge>
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="text-xl font-bold text-blue-700">
                {proximoSabor2.sabor?.nome || 'Sabor não encontrado'}
              </h3>
              <div className="text-sm text-blue-600">
                Ordem: {proximoSabor2.ordem}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximo Sabor 3 */}
        {proximoSabor3 && (
          <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                PRÓXIMO 3
              </Badge>
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="text-xl font-bold text-blue-700">
                {proximoSabor3.sabor?.nome || 'Sabor não encontrado'}
              </h3>
              <div className="text-sm text-blue-600">
                Ordem: {proximoSabor3.ordem}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há próximos sabores */}
        {!proximoSabor2 && !proximoSabor3 && (
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-sm text-gray-500">
                Próximos sabores serão revelados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VisualizadorSaboresRodada;
