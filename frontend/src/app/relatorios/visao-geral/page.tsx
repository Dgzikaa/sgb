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
import { usePageTitle } from '@/contexts/PageTitleContext';
import {
  Calendar,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Eye,
  PieChart,
  TrendingUp,
  Target,
  BarChart3,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface VisaoGeralItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status: 'active' | 'beta' | 'coming_soon';
  badge?: string;
  color: string;
}

const visaoGeralItems: VisaoGeralItem[] = [
  {
    id: 'marketing-360',
    title: 'Marketing 360°',
    description: 'Visão completa das campanhas e métricas de marketing digital',
    icon: Target,
    href: '/visao-geral/marketing-360',
    status: 'active',
    badge: 'Popular',
    color: 'purple',
  },
  {
    id: 'financeiro-mensal',
    title: 'Financeiro Mensal',
    description: 'Análise detalhada do desempenho financeiro mensal',
    icon: DollarSign,
    href: '/visao-geral/financeiro-mensal',
    status: 'active',
    color: 'green',
  },
  {
    id: 'comparativo',
    title: 'Análise Comparativa',
    description: 'Compare períodos e identifique tendências de crescimento',
    icon: PieChart,
    href: '/visao-geral/comparativo',
    status: 'active',
    color: 'blue',
  },
  {
    id: 'metrica-evolucao',
    title: 'Evolução de Métricas',
    description:
      'Acompanhe a evolução das principais métricas ao longo do tempo',
    icon: TrendingUp,
    href: '/visao-geral/metrica-evolucao',
    status: 'active',
    color: 'indigo',
  },
  {
    id: 'diario',
    title: 'Visão Diária',
    description: 'Análise detalhada do desempenho diário do negócio',
    icon: Calendar,
    href: '/visao-geral/diario',
    status: 'active',
    color: 'cyan',
  },
  {
    id: 'semanal',
    title: 'Relatório Semanal',
    description: 'Consolidado semanal com insights e recomendações',
    icon: PieChart,
    href: '/visao-geral/semanal',
    status: 'active',
    color: 'pink',
  },
  {
    id: 'garcons',
    title: 'Performance Garçons',
    description: 'Análise de desempenho e produtividade dos garçons',
    icon: Users,
    href: '/visao-geral/garcons',
    status: 'active',
    color: 'blue',
  },
  {
    id: 'metricas-barras',
    title: 'Métricas em Barras',
    description: 'Visualização em gráficos de barras das principais métricas',
    icon: Activity,
    href: '/visao-geral/metricas-barras',
    status: 'active',
    color: 'green',
  },
  {
    id: 'instagram-tracking',
    title: 'Instagram Tracking',
    description: 'Análise detalhada e variações diárias do Instagram',
    icon: Users,
    href: '/visao-geral/instagram-tracking',
    status: 'active',
    badge: 'Novo',
    color: 'purple',
  },
];

export default function VisaoGeralPage() {
  const router = useRouter();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Visão Geral');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const getColorClasses = (color: string) => {
    const colors = {
      purple:
        'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      green:
        'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      indigo:
        'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      cyan: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            Ativo
          </Badge>
        );
      case 'beta':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
          >
            Beta
          </Badge>
        );
      case 'coming_soon':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
          >
            Em Breve
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredModule="relatorios">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Visão Geral
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Acesse relatórios detalhados, análises comparativas e insights
                estratégicos
              </p>
            </div>
          </div>
        </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Relatórios
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      9
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ativos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      8
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Períodos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      4
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Integrações
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      3
                    </p>
                  </div>
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Relatórios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visaoGeralItems.map(item => {
              const IconComponent = item.icon;
              return (
                <Card
                  key={item.id}
                  className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 bg-gradient-to-r ${getColorClasses(item.color)} rounded-lg`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-white">
                            {item.title}
                          </CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(item.status)}
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        Status: {item.status}
                      </span>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getColorClasses(item.color)} rounded-full`}
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                    <Link href={item.href}>
                      <Button
                        className={`w-full bg-gradient-to-r ${getColorClasses(item.color)} text-white`}
                        variant="outline"
                        disabled={item.status === 'coming_soon'}
                      >
                        <span>Acessar Relatório</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Info */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm mt-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  📊 Análises Inteligentes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Todos os relatórios são atualizados em tempo real e conectados
                  às suas integrações ativas (Windsor.ai, NIBO, WhatsApp). Use
                  os filtros de período para análises customizadas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </ProtectedRoute>
  );
}
