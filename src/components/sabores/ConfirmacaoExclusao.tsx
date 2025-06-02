
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sabor } from '@/hooks/useSabores';
import { Trash2 } from 'lucide-react';

interface ConfirmacaoExclusaoProps {
  sabor: Sabor;
  onDelete: (sabor: Sabor) => Promise<void>;
}

export const ConfirmacaoExclusao = ({ sabor, onDelete }: ConfirmacaoExclusaoProps) => {
  const handleDelete = () => {
    onDelete(sabor);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o sabor <strong>"{sabor.nome}"</strong>?
            <br /><br />
            Esta ação é <strong>irreversível</strong> e o sabor será removido permanentemente do sistema.
            As equipes não poderão mais selecionar este sabor para suas pizzas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir Sabor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
