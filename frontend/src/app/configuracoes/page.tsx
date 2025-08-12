'use client';

import { useEffect } from 'react';
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
import {
  Settings,
  CheckSquare,
  Target,
  Database,
  Shield,
  MessageSquare,
  Zap,
  Clock,
  FileText,
  BarChart3,
  Smartphone,
  Users,
  Bell,
  Key,
  CreditCard,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/layouts/PageHeader';

export default function ConfiguracoesPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredModule="configuracoes">
      <div className="space-y-6 p-4">
        <PageHeader title="Configurações do Sistema" description="Gerencie todas as configurações e integrações do sistema" />

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
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
                    5
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
                    12
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
                    3
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
          {/* Checklists */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Checklists
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Configurar checklists</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs"
                >
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Configure checklists e templates do sistema
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Templates 8
                </span>
                <div className="w-12 sm:w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>
              <Link href="/configuracoes/checklists">
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs sm:text-sm">
                  Gerenciar Checklists
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Metas */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Metas
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Configurar metas</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs"
                >
                  Config
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Configure metas e objetivos do estabelecimento
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Metas 5
                </span>
                <div className="w-12 sm:w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: '60%' }}
                  ></div>
                </div>
              </div>
              <Link href="/configuracoes/metas">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm">
                  Configurar Metas
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Integrações */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Database className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Integrações
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">APIs e integrações</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs"
                >
                  APIs
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Gerencie integrações com APIs externas
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Ativas 3
                </span>
                <div className="w-12 sm:w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>
              <Link href="/configuracoes/integracoes">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs sm:text-sm">
                  Gerenciar Integrações
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Segurança
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Configurações de segurança</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs"
                >
                  Crítico
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Configure segurança e permissões do sistema
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Protegido
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/configuracoes/seguranca">
                <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs sm:text-sm">
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
                  <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      WhatsApp
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Configurar WhatsApp</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs"
                >
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Configure integração com WhatsApp Business
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Conectado
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/configuracoes/whatsapp">
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs sm:text-sm">
                  Configurar WhatsApp
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Usuários */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Usuários
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Gerenciar usuários</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs"
                >
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Gerencie usuários e suas informações no sistema
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Usuários 12
                </span>
                <div className="w-12 sm:w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <Link href="/configuracoes/usuarios">
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs sm:text-sm">
                  Gerenciar Usuários
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <UserCog className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Permissões
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Configurar permissões</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs"
                >
                  Sistema
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Configure permissões e acessos do sistema
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Roles 3
                </span>
                <div className="w-12 sm:w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <Link href="/configuracoes/permissoes">
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-xs sm:text-sm">
                  Configurar Permissões
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                      Templates
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Gerenciar templates</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs"
                >
                  Docs
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Gerencie templates e documentos do sistema
              </p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Templates 12
                </span>
                <div className="w-12 sm:w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: '90%' }}
                  ></div>
                </div>
              </div>
              <Link href="/configuracoes/templates">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-xs sm:text-sm">
                  Gerenciar Templates
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
