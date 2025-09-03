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
  CheckSquare,
  FileText,
  Clock,
  Package,
  Target,
  RefreshCw,
  Zap,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/layouts/PageHeader';

export default function OperacoesPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredModule="operacoes">
      <div className="space-y-6 p-4">
        <PageHeader title="Operações" description="Centro de controle operacional do sistema" />

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-dark shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Checklists
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      3/5
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Receitas
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      24
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Insumos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      89
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Terminal
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ativo
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Módulos Operacionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gestão de Checklists */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        Gestão de Checklists
                      </CardTitle>
                      <CardDescription>Controle de checklists</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    Essencial
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Gerencie todos os checklists operacionais do sistema
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Concluídos hoje 3/5
                  </span>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                </div>
                <Link href="/operacoes/checklists">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                    Acessar Checklists
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Meus Checklists */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        Meus Checklists
                      </CardTitle>
                      <CardDescription>Checklists pessoais</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    Pessoal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Visualize e execute seus checklists pessoais
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Pendentes 2
                  </span>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: '40%' }}
                    ></div>
                  </div>
                </div>
                <Link href="/operacoes/checklists/checklists-funcionario">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    Ver Meus Checklists
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Receitas e Insumos */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        Receitas e Insumos
                      </CardTitle>
                      <CardDescription>Gestão completa</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  >
                    Popular
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Gerencie receitas, ingredientes e produtos do cardápio
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Receitas 24 | Insumos 89
                  </span>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: '80%' }}
                    ></div>
                  </div>
                </div>
                <Link href="/operacoes/receitas">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                    Gerenciar Receitas e Insumos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Terminal de Produção */}
            <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        Terminal de Produção
                      </CardTitle>
                      <CardDescription>Produção em tempo real</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  >
                    Tempo Real
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Terminal de produção em tempo real para controle operacional
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Ativo agora
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <Link href="/future/operacoes/terminal">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white">
                    Acessar Terminal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
    </ProtectedRoute>
  );
}
