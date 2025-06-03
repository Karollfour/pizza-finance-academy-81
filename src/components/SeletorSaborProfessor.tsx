
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSabores } from '@/hooks/useSabores';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { toast } from 'sonner';

interface SeletorSaborProfessorProps {
  rodadaId?: string;
  rodadaAtiva: boolean;
}

const SeletorSaborProfessor = ({ rodadaId, rodadaAtiva }: SeletorSaborProfessorProps) => {
  const [saborSelecionado, setSaborSelecionado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { sabores } = useSabores();
  const { historico, saborAtual, adicionarSabor } = useHistoricoSaboresRodada(rodadaId);

  const handleDefinirSabor = async () => {
    if (!saborSelecionado || !rodadaId) return;

    setLoading(true);
    try {
      const sucesso = await adicionarSabor(saborSelecionado, 'Professor');
      if (sucesso) {
        toast.success('✅ Sabor definido com sucesso!');
        setSaborSelecionado('');
      }
    } catch (error) {
      toast.error('❌ Erro ao definir sabor');
    } finally {
      setLoading(false);
    }
  };

  const getSaborNome = (saborId: string) => {
    const sabor = sabores.find(s => s.id === saborId);
    return sabor ? sabor.nome : 'Sabor não encontrado';
  };

  if (!rodadaAtiva || !rodadaId) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-purple-200 mb-6">
      <CardHeader className="bg-purple-50">
        <CardTitle className="text-purple-600">🎯 Controle de Sabor - Professor</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Sabor Atual */}
          {saborAtual && (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-800 mb-2">
                🍕 Sabor Atual da Rodada
              </h3>
              <div className="text-xl font-bold text-green-600">
                {getSaborNome(saborAtual.sabor_id)}
              </div>
              <p className="text-sm text-green-700 mt-1">
                Definido em: {new Date(saborAtual.definido_em).toLocaleString('pt-BR')}
              </p>
            </div>
          )}

          {/* Definir Novo Sabor */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-800 mb-4">
              🔄 Definir Próximo Sabor
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Select value={saborSelecionado} onValueChange={setSaborSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um sabor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sabores
                      .filter(sabor => sabor.disponivel)
                      .map(sabor => (
                        <SelectItem key={sabor.id} value={sabor.id}>
                          {sabor.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleDefinirSabor}
                disabled={!saborSelecionado || loading}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {loading ? 'Definindo...' : 'Definir Sabor'}
              </Button>
            </div>
          </div>

          {/* Histórico da Rodada */}
          {historico.length > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                📜 Sequência de Sabores desta Rodada
              </h3>
              <div className="space-y-2">
                {historico.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-100">
                        #{item.ordem}
                      </Badge>
                      <span className="font-medium text-blue-600">
                        {getSaborNome(item.sabor_id)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {new Date(item.definido_em).toLocaleTimeString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        por {item.definido_por || 'Professor'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {historico.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              <div className="text-3xl mb-2">🍕</div>
              <p>Nenhum sabor definido ainda para esta rodada</p>
              <p className="text-sm text-gray-400">Defina o primeiro sabor acima</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeletorSaborProfessor;
