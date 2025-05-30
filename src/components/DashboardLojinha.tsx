
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCompras } from '@/hooks/useCompras';
import { useEquipes } from '@/hooks/useEquipes';
import { useProdutos } from '@/hooks/useProdutos';
import { useRodadas } from '@/hooks/useRodadas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardLojinha = () => {
  const { compras } = useCompras();
  const { equipes } = useEquipes();
  const { produtos } = useProdutos();
  const { rodadaAtual } = useRodadas();

  // Dados por equipe
  const dadosPorEquipe = equipes.map(equipe => {
    const comprasEquipe = compras.filter(c => c.equipe_id === equipe.id);
    const totalGasto = comprasEquipe.reduce((sum, c) => sum + c.valor_total, 0);
    const viagens = comprasEquipe.filter(c => c.tipo === 'viagem').length;
    
    return {
      nome: equipe.nome,
      gasto: totalGasto,
      viagens
    };
  });

  // Produtos mais comprados
  const produtosMaisComprados = produtos.map(produto => {
    const comprasProduto = compras.filter(c => c.produto_id === produto.id);
    const quantidadeTotal = comprasProduto.reduce((sum, c) => sum + (c.quantidade || 0), 0);
    
    return {
      nome: produto.nome,
      quantidade: quantidadeTotal
    };
  }).filter(p => p.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade);

  // Distribuição de gastos
  const gastosCategoria = [
    {
      name: 'Materiais',
      value: compras.filter(c => c.tipo === 'material').reduce((sum, c) => sum + c.valor_total, 0)
    },
    {
      name: 'Viagens',
      value: compras.filter(c => c.tipo === 'viagem').reduce((sum, c) => sum + c.valor_total, 0)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gastos por Equipe */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Gastos por Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorEquipe}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Gasto Total']} />
                <Bar dataKey="gasto" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produtos Mais Comprados */}
        <Card>
          <CardHeader>
            <CardTitle>🛒 Produtos Mais Comprados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosMaisComprados.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Distribuição de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gastosCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gastosCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {compras.reduce((sum, c) => sum + c.valor_total, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">Total Gasto</div>
                </div>
                <div className="bg-green-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {compras.filter(c => c.tipo === 'viagem').length}
                  </div>
                  <div className="text-sm text-green-700">Total Viagens</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {produtos.length}
                  </div>
                  <div className="text-sm text-orange-700">Produtos Cadastrados</div>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {rodadaAtual?.numero || 0}
                  </div>
                  <div className="text-sm text-purple-700">Rodada Atual</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardLojinha;
