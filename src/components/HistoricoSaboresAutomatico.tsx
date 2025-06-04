
import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSaborAutomatico } from '@/hooks/useSaborAutomatico';
import { Rodada } from '@/types/database';

interface HistoricoSaboresAutomaticoProps {
  rodada: Rodada | null;
  numeroPizzas: number;
}

const HistoricoSaboresAutomatico = memo(({ rodada, numeroPizzas }: HistoricoSaboresAutomaticoProps) => {
  const {
    saboresPassados,
    saborAtualIndex,
    intervaloTroca,
    totalSabores
  } = useSaborAutomatico({ rodada, numeroPizzas });

  // Memoizar função de formatação
  const formatarTempo = useMemo(() => (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoizar estatísticas para evitar recálculos
  const estatisticas = useMemo(() => ({
    totalSabores,
    finalizadas: saboresPassados.length,
    atual: saborAtualIndex + 1,
    intervaloFormatado: formatarTempo(intervaloTroca)
  }), [totalSabores, saboresPassados.length, saborAtualIndex, intervaloTroca, formatarTempo]);

  if (!rodada || saboresPassados.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-amber-200 mb-8">
      <CardHeader>
        <CardTitle className="text-amber-600">
          📋 Histórico de Sabores Automáticos - Rodada {rodada.numero}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações da sequência */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-600">{estatisticas.totalSabores}</div>
                <div className="text-sm text-amber-700">Total de Pizzas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{estatisticas.finalizadas}</div>
                <div className="text-sm text-green-700">Finalizadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{estatisticas.atual}</div>
                <div className="text-sm text-blue-700">Atual</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{estatisticas.intervaloFormatado}</div>
                <div className="text-sm text-purple-700">Intervalo</div>
              </div>
            </div>
          </div>

          {/* Lista de sabores passados - estável */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {saboresPassados.map((sabor, index) => (
              <div key={`${sabor.id}-${index}`} className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-200 shadow-sm">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 min-w-fit">
                    Pizza #{index + 1}
                  </Badge>
                  <div className="text-6xl">🍕</div>
                  <div>
                    <div className="font-bold text-lg text-amber-700">
                      {sabor.sabor?.nome || 'Sabor não encontrado'}
                    </div>
                    {sabor.sabor?.descricao && (
                      <div className="text-sm text-amber-600">
                        {sabor.sabor.descricao}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Duração: {formatarTempo(intervaloTroca)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500 text-white mb-2">
                    ✅ Finalizado
                  </Badge>
                  <div className="text-sm text-gray-600">
                    {new Date(sabor.tempoFinalizado).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {saboresPassados.length === 0 && rodada.status === 'ativa' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-500">Nenhum sabor finalizado ainda...</p>
              <p className="text-sm text-gray-400">Os sabores aparecerão aqui conforme o tempo passa</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

HistoricoSaboresAutomatico.displayName = 'HistoricoSaboresAutomatico';

export default HistoricoSaboresAutomatico;
