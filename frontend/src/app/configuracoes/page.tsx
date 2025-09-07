'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Database,
  Shield,
  MessageSquare,
  Users,
  Bell,
  Key,
  UserCog,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/layouts/PageHeader';

interface ConfigStats {
  usuarios: number;
  integracoes: number;
  alertas: number;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ConfigStats>({
    usuarios: 0,
    integracoes: 5,
    alertas: 3,
  });
  const [loading, setLoading] = useState(true);

  // Carregar estatísticas reais
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Buscar contagem real de usuários
        const usuariosResponse = await fetch('/api/configuracoes/usuarios');
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          setStats(prev => ({
            ...prev,
            usuarios: usuariosData.usuarios?.length || 0,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <ProtectedRoute requiredModule="configuracoes">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header com busca */}
          <div className="card-dark p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Configurações do Sistema
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie todas as configurações e integrações do sistema
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar configurações..."
                    className="pl-10 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <Card className="card-dark shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Configurações
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                      10
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Integrações
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : stats.integracoes}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Usuários
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : stats.usuarios}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Alertas
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : stats.alertas}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Configuração */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Segurança */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                        Segurança
                      </CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 border-red-200 text-red-700 dark:border-red-700 dark:text-red-300">
                        Crítico
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Configure segurança e permissões do sistema
                </CardDescription>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-500">Protegido</div>
                </div>
                <Link href="/configuracoes/seguranca">
                  <Button className="w-full bg-red-500/10 border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:bg-red-900/20 dark:border-red-700 dark:hover:bg-red-900/30">
                    Configurar Segurança
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                        WhatsApp
                      </CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 border-green-200 text-green-700 dark:border-green-700 dark:text-green-300">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Configure integração com WhatsApp Business
                </CardDescription>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-500">Conectado</div>
                </div>
                <Link href="/configuracoes/whatsapp">
                  <Button className="w-full bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-500/20 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30">
                    Configurar WhatsApp
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Usuários */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                        Usuários
                      </CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Gerencie usuários e suas informações no sistema
                </CardDescription>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Usuários {loading ? '...' : stats.usuarios}
                  </div>
                </div>
                <Link href="/configuracoes/usuarios">
                  <Button className="w-full bg-blue-500/10 border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:bg-blue-900/20 dark:border-blue-700 dark:hover:bg-blue-900/30">
                    Gerenciar Usuários
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}