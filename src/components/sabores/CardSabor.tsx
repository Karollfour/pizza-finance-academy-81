import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sabor } from '@/hooks/useSabores';
import { Trash2, Edit } from 'lucide-react';
import { ConfirmacaoExclusao } from './ConfirmacaoExclusao';
interface CardSaborProps {
  sabor: Sabor;
  onEdit: (sabor: Sabor) => void;
  onDelete: (sabor: Sabor) => Promise<void>;
  getProdutoNome: (produtoId: string) => string;
}
export const CardSabor = ({
  sabor,
  onEdit,
  onDelete,
  getProdutoNome
}: CardSaborProps) => {
  return <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{sabor.nome}</CardTitle>
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(sabor)}>
              <Edit className="w-4 h-4" />
            </Button>
            <ConfirmacaoExclusao sabor={sabor} onDelete={onDelete} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sabor.imagem && <img src={sabor.imagem} alt={sabor.nome} className="w-full h-32 rounded-md mb-3 object-scale-down" />}
        
        {sabor.descricao && <p className="text-sm text-gray-600 mb-3">{sabor.descricao}</p>}
        
        {sabor.ingredientes && sabor.ingredientes.length > 0 && <div>
            <p className="text-sm font-medium mb-1">Ingredientes:</p>
            <div className="flex flex-wrap gap-1">
              {sabor.ingredientes.map(ingredienteId => <Badge key={ingredienteId} variant="outline" className="text-xs">
                  {getProdutoNome(ingredienteId)}
                </Badge>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
};