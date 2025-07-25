'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  Settings,
  PieChart,
  LineChart,
  BarChart,
  Eye,
  EyeOff,
  MoreHorizontal,
  ChevronRight,
  Star,
  Award,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function VisaoGeralPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const metrics: MetricCard[] = [
    {
      title: 'Receita Total',
      value: 'R$ 156.789,45',
      change: 12.5,
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      description: 'Receita bruta do período',
    },
    {
      title: 'Pedidos',
      value: '2.847',
      change: 8.3,
      changeType: 'positive',
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      description: 'Total de pedidos realizados',
    },
    {
      title: 'Ticket Médio',
      value: 'R$ 55,12',
      change: -2.1,
      changeType: 'negative',
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      description: 'Valor médio por pedido',
    },
    {
      title: 'Clientes Únicos',
      value: '1.234',
      change: 15.7,
      changeType: 'positive',
      icon: Users,
      color: 'text-orange-600 dark:text-orange-400',
      description: 'Novos clientes no período',
    },
    {
      title: 'Taxa de Conversão',
      value: '3.2%',
      change: 0.8,
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      description: 'Conversão de visitantes',
    },
    {
      title: 'Tempo Médio',
      value: '12m 34s',
      change: -5.2,
      changeType: 'positive',
      icon: Clock,
      color: 'text-cyan-600 dark:text-cyan-400',
      description: 'Tempo médio de atendimento',
    },
  ];

  const chartData: ChartData[] = [
    { name: 'Vendas Diretas', value: 45, color: 'bg-blue-500' },
    { name: 'Delivery', value: 30, color: 'bg-green-500' },
    { name: 'Reservas', value: 15, color: 'bg-purple-500' },
    { name: 'Eventos', value: 10, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header Avançado */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Visão Geral
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Dashboard executivo e análise de performance
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="1y">Último ano</option>
                </select>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className="card-dark hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium card-title-dark">
                  {metric.title}
                </CardTitle>
                <div
                  className={`p-2 rounded-lg ${metric.color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')} bg-opacity-10 dark:bg-opacity-20`}
                >
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold card-title-dark mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center gap-2">
                  {metric.changeType === 'positive' ? (
                    <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                  ) : metric.changeType === 'negative' ? (
                    <ArrowDownRight className="w-3 h-3 text-red-600 dark:text-red-400" />
                  ) : (
                    <Activity className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      metric.changeType === 'positive'
                        ? 'text-green-600 dark:text-green-400'
                        : metric.changeType === 'negative'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {metric.change > 0 ? '+' : ''}
                    {metric.change}% vs período anterior
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs de Análise Avançada */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="tabs-list-dark bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="overview" className="tabs-trigger-dark">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="performance" className="tabs-trigger-dark">
              Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="tabs-trigger-dark">
              Tendências
            </TabsTrigger>
            <TabsTrigger value="analytics" className="tabs-trigger-dark">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Vendas */}
              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="card-title-dark">
                        Vendas por Canal
                      </CardTitle>
                      <CardDescription className="card-description-dark">
                        Distribuição de vendas por canal de atendimento
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${item.color}`}
                          ></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-500`}
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Performance */}
              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    KPIs de Performance
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Indicadores-chave de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Meta de Vendas
                        </span>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        +15% Acima
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Satisfação
                        </span>
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        4.8/5.0
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Eficiência
                        </span>
                      </div>
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                        92%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Performance por Período
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Análise detalhada de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Gráfico de Performance
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Comparativo Mensal
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Comparação com meses anteriores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <BarChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Gráfico Comparativo
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="card-title-dark">
                  Análise de Tendências
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Identificação de padrões e tendências de mercado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Análise de Tendências
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Analytics Avançado
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Métricas avançadas e insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Analytics Avançado
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Insights Automáticos
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Recomendações baseadas em IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Oportunidade de Crescimento
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Seus horários de pico têm 23% mais potencial de
                            vendas
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Excelente Performance
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Taxa de satisfação aumentou 12% este mês
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Atenção Necessária
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Tempo de atendimento aumentou 8% na última semana
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-8">
          <Card className="card-dark border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold card-title-dark mb-2">
                  Precisa de insights mais detalhados?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Acesse relatórios avançados e análises personalizadas
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                    Relatórios Avançados
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Configurar Alertas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
