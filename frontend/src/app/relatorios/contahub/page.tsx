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
  BarChart3,
  CreditCard,
  Calendar,
  Clock,
  TrendingUp,
  Database,
  RefreshCw,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function ContaHubPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredModule="relatorios">
      <div className="space-y-6 mt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
              <Database className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                Relatórios ContaHub
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Dados sincronizados do sistema ContaHub
              </p>
            </div>
          </div>
        </div>

        {/* Status de Sincronização */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Sincronização Ativa
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Última sincronização: Hoje às 07:00
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Agora
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Módulos de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Analítico */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Analítico
                    </CardTitle>
                    <CardDescription>Dados analíticos de vendas</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  Vendas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Relatórios detalhados de vendas, produtos e transações
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  Dados disponíveis
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/relatorios/contahub/analitico">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                  Acessar Analítico
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pagamentos */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Pagamentos
                    </CardTitle>
                    <CardDescription>Dados de pagamentos</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                >
                  Financeiro
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Análise de pagamentos, taxas e meios de pagamento
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  Dados disponíveis
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/relatorios/contahub/pagamentos">
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                  Acessar Pagamentos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Período */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Período
                    </CardTitle>
                    <CardDescription>Dados por período</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  Temporal
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Análise de dados por período e localização
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  Dados disponíveis
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/relatorios/contahub/periodo">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                  Acessar Período
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tempo */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Tempo
                    </CardTitle>
                    <CardDescription>Dados de tempo de produção</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                >
                  Produção
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Análise de tempos de produção e eficiência
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  Dados disponíveis
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/relatorios/contahub/tempo">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Acessar Tempo
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Faturamento por Hora */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      FatPorHora
                    </CardTitle>
                    <CardDescription>Faturamento por hora</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                >
                  Horário
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Análise de faturamento por hora e dia da semana
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  Dados disponíveis
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <Link href="/relatorios/contahub/fatporhora">
                <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                  Acessar FatPorHora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
} 