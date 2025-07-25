'use client';

import { useState } from 'react';
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
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  PieChart,
  LineChart,
  BarChart,
  Download,
  RefreshCw,
  Settings,
  Calculator,
} from 'lucide-react';

export default function WindsorAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header Avançado */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Windsor.ai Analytics
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Análise avançada de dados e métricas de performance
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                <select className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none">
                  <option>Últimos 30 dias</option>
                  <option>Últimos 90 dias</option>
                  <option>Último ano</option>
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
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-dark hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium card-title-dark">
                Receita Total
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold card-title-dark mb-1">
                R$ 45.231,89
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  +20.1% vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium card-title-dark">
                Pedidos
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold card-title-dark mb-1">
                1.234
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  +12.5% vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium card-title-dark">
                Ticket Médio
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold card-title-dark mb-1">
                R$ 36,67
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  +6.8% vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium card-title-dark">
                Clientes Únicos
              </CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold card-title-dark mb-1">892</div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  +8.3% vs período anterior
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Análise Avançada */}
        <Tabs defaultValue="vendas" className="space-y-6">
          <TabsList className="tabs-list-dark bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="vendas" className="tabs-trigger-dark">
              Vendas
            </TabsTrigger>
            <TabsTrigger value="produtos" className="tabs-trigger-dark">
              Produtos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="tabs-trigger-dark">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="tendencias" className="tabs-trigger-dark">
              Tendências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Vendas por Período
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Análise de vendas nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <BarChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Gráfico de Vendas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Distribuição por Categoria
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Vendas por categoria de produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Gráfico de Pizza
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-6">
            <Card className="card-dark border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="card-title-dark">
                  Produtos Mais Vendidos
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Ranking dos produtos com melhor performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      nome: 'Hambúrguer Clássico',
                      vendas: 156,
                      receita: 'R$ 4.680,00',
                    },
                    {
                      nome: 'Batata Frita',
                      vendas: 142,
                      receita: 'R$ 2.130,00',
                    },
                    {
                      nome: 'Refrigerante Cola',
                      vendas: 138,
                      receita: 'R$ 690,00',
                    },
                    {
                      nome: 'Sorvete de Chocolate',
                      vendas: 89,
                      receita: 'R$ 1.335,00',
                    },
                    {
                      nome: 'Salada Caesar',
                      vendas: 67,
                      receita: 'R$ 1.675,00',
                    },
                  ].map((produto, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        >
                          #{index + 1}
                        </Badge>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {produto.nome}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {produto.vendas} vendas
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {produto.receita}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Novos Clientes
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Crescimento da base de clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Gráfico de Crescimento
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">
                    Segmentação de Clientes
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Análise por faixa etária e comportamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Análise Demográfica
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tendencias" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">
                  Tendências de Mercado
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Análise de tendências e sazonalidade
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
        </Tabs>
      </div>
    </div>
  );
}
