
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginScreenProps {
  onLogin: (userType: string, teamId?: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const handleLogin = () => {
    // Todos entram como tipo padrão - a seleção será feita nas abas internas
    onLogin('default');
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
          <div className="mb-4 flex justify-center">
            <img 
              src="/lovable-uploads/b3a71221-748b-4e55-b6be-91077d07846e.png" 
              alt="Pizza Lean Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-600">Pizza Lean</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Sistema de Educação Financeira
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              Bem-vindo à Pizzaria! 🍕
            </p>
            <p className="text-sm text-gray-600">
              Escolha seu papel após entrar no sistema usando as abas de navegação
            </p>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full pizza-button text-lg"
          >
            🚀 Entrar na Pizzaria
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
