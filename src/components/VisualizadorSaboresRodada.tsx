
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { useSabores } from '@/hooks/useSabores';

interface VisualizadorSaboresRodadaProps {
  rodadaId?: string;
}

const VisualizadorSaboresRodada = ({ rodadaId }: VisualizadorSaboresRodadaProps) => {
  const { historico } = useHistoricoSaboresRodada(rodadaId);
  const { sabores } = useSabores();

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

  // Sempre mostrar os 3 primeiros sabores da sequência
  const saborAtual = historico[0]; // Primeiro sabor (atual)
  const proximoSabor2 = historico[1]; // Segundo sabor
  const proximoSabor3 = historico[2]; // Terceiro sabor

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sabor Atual - Ocupa mais espaço e em verde */}
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
              Pizza #{saborAtual?.ordem || 1}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Sabores - Em azul, um em cima do outro */}
      <div className="space-y-4">
        {/* Próximo Sabor 2 */}
        {proximoSabor2 && (
          <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                PRÓXIMO
              </Badge>
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="text-xl font-bold text-blue-700">
                {proximoSabor2.sabor?.nome || 'Sabor não encontrado'}
              </h3>
              <div className="text-sm text-blue-600">
                Pizza #{proximoSabor2.ordem}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximo Sabor 3 */}
        {proximoSabor3 && (
          <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                DEPOIS
              </Badge>
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="text-xl font-bold text-blue-700">
                {proximoSabor3.sabor?.nome || 'Sabor não encontrado'}
              </h3>
              <div className="text-sm text-blue-600">
                Pizza #{proximoSabor3.ordem}
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
