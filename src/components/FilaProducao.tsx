
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePizzas } from '@/hooks/usePizzas';
import { useOptimizedRodadas } from '@/hooks/useOptimizedRodadas';
import { useSabores } from '@/hooks/useSabores';
import { toast } from 'sonner';

interface FilaProducaoProps {
  equipeId: string;
  equipeNome: string;
  onPizzaEnviada: () => void;
}

const FilaProducao = ({ equipeId, equipeNome, onPizzaEnviada }: FilaProducaoProps) => {
  const { rodadaAtual } = useOptimizedRodadas();
  const { pizzas, marcarPizzaPronta } = usePizzas(equipeId, rodadaAtual?.id);
  const { sabores, loading: loadingSabores } = useSabores();
  const [saborSelecionado, setSaborSelecionado] = useState<string>('');
  const [enviandoPizza, setEnviandoPizza] = useState(false);

  const handleEnviarPizza = async () => {
    if (!rodadaAtual) return;
    
    if (!saborSelecionado) {
      toast.error('Por favor, selecione o sabor da pizza antes de enviar!');
      return;
    }
    
    try {
      setEnviandoPizza(true);
      
      // Disparar evento de seleção de sabor
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pizza-sabor-selecionado', { 
          detail: { 
            equipeId,
            rodadaId: rodadaAtual.id,
            saborId: saborSelecionado,
            timestamp: new Date().toISOString() 
          } 
        }));
      }
      
      await marcarPizzaPronta(equipeId, rodadaAtual.id, saborSelecionado);
      onPizzaEnviada();
      
      // Limpar seleção após envio
      setSaborSelecionado('');
      
      toast.success('🍕 Pizza enviada para avaliação!');
    } catch (error) {
      console.error('Erro ao enviar pizza para avaliação:', error);
      toast.error('Erro ao enviar pizza. Tente novamente.');
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

  return (
    <div className="space-y-6">
      {/* Formulário para Enviar Pizza */}
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
            
            {/* Seleção de Sabor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">
                Selecione o sabor da pizza:
              </label>
              <Select 
                value={saborSelecionado} 
                onValueChange={setSaborSelecionado}
                disabled={!rodadaAtual || rodadaAtual.status !== 'ativa' || loadingSabores}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha o sabor da pizza..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {sabores.map((sabor) => (
                    <SelectItem key={sabor.id} value={sabor.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{sabor.nome}</span>
                        {sabor.descricao && (
                          <span className="text-xs text-gray-500">{sabor.descricao}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-gray-600">
              Escolha o sabor e clique no botão abaixo quando sua pizza estiver pronta para avaliação
            </p>
            
            <Button
              onClick={handleEnviarPizza}
              className="w-full h-16 text-xl bg-green-500 hover:bg-green-600 text-white font-bold"
              disabled={!rodadaAtual || rodadaAtual.status !== 'ativa' || !saborSelecionado || enviandoPizza}
            >
              {enviandoPizza ? (
                <>🔄 Enviando...</>
              ) : (
                <>✅ Enviar Pizza para Avaliação</>
              )}
            </Button>
            
            {(!rodadaAtual || rodadaAtual.status !== 'ativa') && (
              <p className="text-sm text-gray-500">
                Aguardando rodada ativa para enviar pizzas
              </p>
            )}
            
            {!saborSelecionado && rodadaAtual?.status === 'ativa' && (
              <p className="text-sm text-orange-600">
                ⚠️ Selecione o sabor da pizza antes de enviar
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

      {/* Mensagem quando não há pizzas */}
      {pizzas.length === 0 && rodadaAtual?.status === 'ativa' && (
        <Card className="shadow-lg border-2 border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Primeira Pizza da Rodada
            </h3>
            <p className="text-gray-500">
              Escolha um sabor e seja o primeiro a enviar uma pizza para avaliação nesta rodada!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilaProducao;
