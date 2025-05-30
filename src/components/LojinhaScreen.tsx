
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Team {
  id: string;
  name: string;
  initialBalance: number;
  totalSpent: number;
  remainingBalance: number;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}

const LojinhaScreen = () => {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Equipe Pepperoni', initialBalance: 100, totalSpent: 25, remainingBalance: 75 },
    { id: '2', name: 'Equipe Margherita', initialBalance: 100, totalSpent: 30, remainingBalance: 70 },
    { id: '3', name: 'Equipe Calabresa', initialBalance: 100, totalSpent: 15, remainingBalance: 85 },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Farinha', unit: 'kg', unitPrice: 5 },
    { id: '2', name: 'Queijo', unit: 'kg', unitPrice: 15 },
    { id: '3', name: 'Tomate', unit: 'kg', unitPrice: 8 },
    { id: '4', name: 'Pepperoni', unit: 'kg', unitPrice: 20 },
  ]);

  const [newTeam, setNewTeam] = useState({ name: '', balance: 0 });
  const [newProduct, setNewProduct] = useState({ name: '', unit: '', price: 0 });
  const [roundTime, setRoundTime] = useState(300); // 5 minutos em segundos

  const addTeam = () => {
    if (newTeam.name && newTeam.balance > 0) {
      const team: Team = {
        id: Date.now().toString(),
        name: newTeam.name,
        initialBalance: newTeam.balance,
        totalSpent: 0,
        remainingBalance: newTeam.balance,
      };
      setTeams([...teams, team]);
      setNewTeam({ name: '', balance: 0 });
    }
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.unit && newProduct.price > 0) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name,
        unit: newProduct.unit,
        unitPrice: newProduct.price,
      };
      setProducts([...products, product]);
      setNewProduct({ name: '', unit: '', price: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">
            🏪 Lojinha da Pizzaria
          </h1>
          <p className="text-gray-600">Administração de Recursos e Compras</p>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="teams">👥 Equipes</TabsTrigger>
            <TabsTrigger value="products">📦 Produtos</TabsTrigger>
            <TabsTrigger value="sales">💰 Vendas</TabsTrigger>
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <Card className="pizza-card">
              <CardHeader>
                <CardTitle>Cadastrar Nova Equipe</CardTitle>
                <CardDescription>Adicione uma nova equipe ao sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="teamName">Nome da Equipe</Label>
                    <Input
                      id="teamName"
                      placeholder="Ex: Equipe Pepperoni"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamBalance">Saldo Inicial ($)</Label>
                    <Input
                      id="teamBalance"
                      type="number"
                      placeholder="100"
                      value={newTeam.balance || ''}
                      onChange={(e) => setNewTeam({ ...newTeam, balance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addTeam} className="w-full pizza-button">
                      ➕ Adicionar Equipe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card key={team.id} className="team-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      {team.name}
                      <Badge variant="secondary">Ativa</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Saldo Inicial:</span>
                      <span className="font-bold text-green-600">${team.initialBalance}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Gasto:</span>
                      <span className="font-bold text-red-600">${team.totalSpent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Saldo Restante:</span>
                      <span className="font-bold text-blue-600">${team.remainingBalance}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        📝 Ver Compras
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        🚛 Registrar Viagem ($5)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="pizza-card">
              <CardHeader>
                <CardTitle>Cadastrar Novo Produto</CardTitle>
                <CardDescription>Adicione produtos disponíveis na loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="productName">Nome do Produto</Label>
                    <Input
                      id="productName"
                      placeholder="Ex: Farinha"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productUnit">Unidade</Label>
                    <Input
                      id="productUnit"
                      placeholder="Ex: kg"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productPrice">Preço Unitário ($)</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      placeholder="5"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addProduct} className="w-full pizza-button">
                      ➕ Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pizza-card">
              <CardHeader>
                <CardTitle>Produtos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="border border-orange-200 rounded-lg p-4 bg-white">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-gray-600">Unidade: {product.unit}</p>
                      <p className="text-orange-600 font-bold">${product.unitPrice}/{product.unit}</p>
                      <div className="mt-3 space-x-2">
                        <Button variant="outline" size="sm">✏️ Editar</Button>
                        <Button variant="destructive" size="sm">🗑️ Remover</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card className="pizza-card">
              <CardHeader>
                <CardTitle>Controle de Vendas</CardTitle>
                <CardDescription>Registre compras e viagens das equipes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">Sistema de Vendas</h3>
                  <p className="text-gray-500">
                    Funcionalidade em desenvolvimento para controle de compras
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="pizza-card">
              <CardHeader>
                <CardTitle>Dashboard Final</CardTitle>
                <CardDescription>Resumo e estatísticas do jogo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{teams.length}</div>
                    <div className="text-sm text-green-700">Equipes Ativas</div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">${teams.reduce((sum, team) => sum + team.totalSpent, 0)}</div>
                    <div className="text-sm text-blue-700">Total Gasto</div>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{products.length}</div>
                    <div className="text-sm text-orange-700">Produtos Disponíveis</div>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{Math.floor(roundTime / 60)}min</div>
                    <div className="text-sm text-purple-700">Tempo por Rodada</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roundTime">Tempo da Rodada (segundos)</Label>
                    <Input
                      id="roundTime"
                      type="number"
                      value={roundTime}
                      onChange={(e) => setRoundTime(Number(e.target.value))}
                      className="max-w-xs"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button className="pizza-button">🚀 Iniciar Nova Rodada</Button>
                    <Button variant="outline">⏸️ Pausar Rodada</Button>
                    <Button variant="destructive">⏹️ Finalizar Rodada</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LojinhaScreen;
