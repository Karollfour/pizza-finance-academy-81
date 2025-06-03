
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { useSabores } from '@/hooks/useSabores';
import { useSaborAutomatico } from '@/hooks/useSaborAutomatico';
import { Rodada } from '@/types/database';

interface VisualizadorSaboresRodadaProps {
  rodada: Rodada | null;
  numeroPizzas: number;
}

const VisualizadorSaboresRodada = ({ rodada, numeroPizzas }: VisualizadorSaboresRodadaProps) => {
  const { historico, loading: loadingHistorico } = useHistoricoSaboresRodada(rodada?.id);
  const { sabores, loading: loadingSabores } = useSabores();
  
  // Usar o sistema automático de sabores
  const {
    saborAtual,
    proximoSabor,
    saboresPassados,
    saborAtualIndex,
    intervaloTroca,
    tempoProximaTroca
  } = useSaborAutomatico({ rodada, numeroPizzas });

  console.log('VisualizadorSaboresRodada - rodada:', rodada);
  console.log('VisualizadorSaboresRodada - historico:', historico);
  console.log('VisualizadorSaboresRodada - saborAtual:', saborAtual);

  if (!rodada) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🍕</div>
          <p className="text-gray-500">Aguardando rodada ativa...</p>
        </CardContent>
      </Card>
    );
  }

  if (loadingHistorico || loadingSabores) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Carregando sequência de sabores...</p>
        </CardContent>
      </Card>
    );
  }

  if (historico.length === 0) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🍕</div>
          <p className="text-gray-500">Sequência de sabores não criada ainda...</p>
        </CardContent>
      </Card>
    );
  }

  // Se a rodada não está ativa, mostrar apenas o primeiro sabor
  if (rodada.status !== 'ativa') {
    const primeiroSabor = historico[0];
    const segundoSabor = historico[1];
    const terceiroSabor = historico[2];

    const getSaborNome = (item: any) => {
      if (item?.sabor?.nome) {
        return item.sabor.nome;
      }
      const saborEncontrado = sabores.find(s => s.id === item?.sabor_id);
      return saborEncontrado?.nome || 'Sabor não encontrado';
    };

    const getSaborDescricao = (item: any) => {
      if (item?.sabor?.descricao) {
        return item.sabor.descricao;
      }
      const saborEncontrado = sabores.find(s => s.id === item?.sabor_id);
      return saborEncontrado?.descricao;
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Primeiro Sabor */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-4 border-yellow-400 bg-yellow-50">
            <CardContent className="p-8 text-center">
              <Badge className="bg-yellow-500 text-white text-lg px-4 py-2 mb-4">
                🍕 PRIMEIRO SABOR
              </Badge>
              <div className="text-6xl mb-4">🍕</div>
              <h2 className="text-4xl font-bold text-yellow-700 mb-2">
                {getSaborNome(primeiroSabor)}
              </h2>
              {getSaborDescricao(primeiroSabor) && (
                <p className="text-lg text-yellow-600 mb-4">
                  {getSaborDescricao(primeiroSabor)}
                </p>
              )}
              <div className="text-lg text-yellow-600">
                Pizza #{primeiroSabor?.ordem || 1}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Sabores */}
        <div className="space-y-4">
          {segundoSabor && (
            <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                  SEGUNDO
                </Badge>
                <div className="text-3xl mb-2">🍕</div>
                <h3 className="text-xl font-bold text-blue-700">
                  {getSaborNome(segundoSabor)}
                </h3>
                <div className="text-sm text-blue-600">
                  Pizza #{segundoSabor.ordem}
                </div>
              </CardContent>
            </Card>
          )}

          {terceiroSabor && (
            <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                  TERCEIRO
                </Badge>
                <div className="text-3xl mb-2">🍕</div>
                <h3 className="text-xl font-bold text-blue-700">
                  {getSaborNome(terceiroSabor)}
                </h3>
                <div className="text-sm text-blue-600">
                  Pizza #{terceiroSabor.ordem}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Para rodadas ativas, usar o sistema automático
  if (!saborAtual) {
    return (
      <Card className="shadow-lg border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Carregando sabor atual...</p>
        </CardContent>
      </Card>
    );
  }

  const getSaborNome = (item: any) => {
    if (item?.sabor?.nome) {
      return item.sabor.nome;
    }
    const saborEncontrado = sabores.find(s => s.id === item?.sabor_id);
    return saborEncontrado?.nome || 'Sabor não encontrado';
  };

  const getSaborDescricao = (item: any) => {
    if (item?.sabor?.descricao) {
      return item.sabor.descricao;
    }
    const saborEncontrado = sabores.find(s => s.id === item?.sabor_id);
    return saborEncontrado?.descricao;
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sabor Atual - Automático */}
      <div className="lg:col-span-2">
        <Card className="shadow-xl border-4 border-green-400 bg-green-50">
          <CardContent className="p-8 text-center">
            <Badge className="bg-green-500 text-white text-lg px-4 py-2 mb-4">
              🍕 SABOR ATUAL - AUTOMÁTICO
            </Badge>
            <div className="text-6xl mb-4">🍕</div>
            <h2 className="text-4xl font-bold text-green-700 mb-2">
              {getSaborNome(saborAtual)}
            </h2>
            {getSaborDescricao(saborAtual) && (
              <p className="text-lg text-green-600 mb-4">
                {getSaborDescricao(saborAtual)}
              </p>
            )}
            <div className="text-lg text-green-600 mb-4">
              Pizza #{saborAtualIndex + 1} de {historico.length}
            </div>
            
            {/* Tempo para próxima troca */}
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Próxima troca em: {formatarTempo(tempoProximaTroca)}
              </div>
              <div className="text-xs text-green-500">
                (Intervalo: {formatarTempo(intervaloTroca)} por pizza)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximo Sabor e Estatísticas */}
      <div className="space-y-4">
        {proximoSabor ? (
          <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Badge className="bg-blue-500 text-white text-sm px-3 py-1 mb-2">
                PRÓXIMO
              </Badge>
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="text-xl font-bold text-blue-700">
                {getSaborNome(proximoSabor)}
              </h3>
              <div className="text-sm text-blue-600">
                Pizza #{saborAtualIndex + 2}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🏁</div>
              <p className="text-sm text-gray-500">
                Último sabor da sequência
              </p>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <Card className="shadow-lg border-2 border-purple-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-purple-600">Finalizadas:</span>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {saboresPassados.length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-600">Restantes:</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  {historico.length - saborAtualIndex - 1}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-600">Total:</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-700">
                  {historico.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisualizadorSaboresRodada;
