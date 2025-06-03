
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSabores } from '@/hooks/useSabores';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { toast } from 'sonner';

interface SeletorSaborProfessorProps {
  rodadaId?: string;
}

const SeletorSaborProfessor = ({ rodadaId }: SeletorSaborProfessorProps) => {
  const [saborSelecionado, setSaborSelecionado] = useState<string>('');
  const { sabores } = useSabores();
  const { historico, adicionarSabor, loading } = useHistoricoSaboresRodada(rodadaId);

  const handleAdicionarSabor = async () => {
    if (!saborSelecionado || !rodadaId) return;

    try {
      await adicionarSabor(saborSelecionado);
      setSaborSelecionado('');
      toast.success('Sabor adicionado ao histórico da rodada!');
    } catch (error) {
      toast.error('Erro ao adicionar sabor');
    }
  };

  const saborAtual = historico[historico.length - 1];

  return (
    <div className="space-y-3">
      {/* Sabor Atual */}
      {saborAtual && (
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800 mb-1">
            🍕 Sabor Atual da Rodada
          </div>
          <div className="text-lg font-bold text-yellow-600">
            {saborAtual.sabor?.nome || 'Sabor não encontrado'}
          </div>
        </div>
      )}

      {/* Seletor de Novo Sabor */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Select value={saborSelecionado} onValueChange={setSaborSelecionado}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Escolher sabor..." />
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
          onClick={handleAdicionarSabor}
          disabled={!saborSelecionado || loading}
          size="sm"
          className="h-8 px-3 text-xs bg-blue-500 hover:bg-blue-600"
        >
          + Definir
        </Button>
      </div>

      {/* Histórico da Rodada */}
      {historico.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-blue-800">
            📜 Sequência de Sabores desta Rodada
          </div>
          <div className="flex flex-wrap gap-1">
            {historico.map((item, index) => (
              <Badge 
                key={item.id} 
                variant="outline" 
                className="bg-blue-50 text-blue-700 text-xs"
              >
                {index + 1}. {item.sabor?.nome || 'N/A'}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeletorSaborProfessor;
