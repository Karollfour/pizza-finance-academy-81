
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LoginScreenProps {
  onLogin: (userType: string, teamId?: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [userType, setUserType] = useState('');
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (userType && (userType !== 'equipe' || teamId)) {
      onLogin(userType, teamId || undefined);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-300 rounded-full opacity-20 animate-bounce-gentle"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-red-300 rounded-full opacity-20 animate-bounce-gentle delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-yellow-300 rounded-full opacity-20 animate-bounce-gentle delay-2000"></div>
      </div>
      
      <Card className="w-full max-w-md pizza-card relative z-10">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🍕</div>
          <CardTitle className="text-3xl font-bold text-orange-600">
            Pizzaria Financeira
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Sistema Educativo Gamificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userType">Tipo de Usuário</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lojinha">🏪 Professor - Lojinha</SelectItem>
                <SelectItem value="avaliador">🧑‍🏫 Professor - Avaliador</SelectItem>
                <SelectItem value="equipe">👥 Equipe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userType === 'equipe' && (
            <div className="space-y-2">
              <Label htmlFor="teamId">Nome da Equipe</Label>
              <Input
                id="teamId"
                placeholder="Digite o nome da sua equipe"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>
          )}

          <Button 
            onClick={handleLogin} 
            className="w-full pizza-button text-lg"
            disabled={!userType || (userType === 'equipe' && !teamId)}
          >
            🚀 Entrar na Pizzaria
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
