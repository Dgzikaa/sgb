'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Mail, 
  ArrowLeft,
  LogIn,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginFidelidadePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('E-mail é obrigatório');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/fidelidade/cadastro?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        // Salvar dados do membro no localStorage
        localStorage.setItem('fidelidade_membro', JSON.stringify(data.membro));
        
        setSuccess('Login realizado com sucesso! Redirecionando...');
        
        setTimeout(() => {
          router.push('/fidelidade/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Membro não encontrado');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/fidelidade">
              <Button variant="ghost" className="text-amber-600 dark:text-amber-400 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center mb-6"
            >
              <Crown className="w-12 h-12 text-amber-600 dark:text-amber-400 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Área do Membro
                </h1>
                <p className="text-amber-600 dark:text-amber-400">
                  Ordinário Bar
                </p>
              </div>
            </motion.div>
          </div>

          {/* Card de Login */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-amber-200 dark:border-amber-700">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  Faça seu Login
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Digite seu e-mail de cadastro para acessar sua área VIP
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-12 bg-white dark:bg-gray-700"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 text-lg font-semibold"
                  >
                    {loading ? (
                      'Entrando...'
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Ainda não é membro VIP?
                  </p>
                  <Link href="/fidelidade/cadastro">
                    <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-900/20">
                      Quero me Cadastrar
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Problemas para acessar?{' '}
                    <Link href="/fidelidade/suporte" className="text-amber-600 dark:text-amber-400 hover:underline">
                      Entre em contato
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Informações de segurança */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-center"
          >
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-amber-200/50 dark:border-amber-700/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🔒 Seus dados estão protegidos por SSL
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
