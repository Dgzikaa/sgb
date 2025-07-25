'use client';

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
  TrendingUp,
  Construction,
  Calendar,
  Clock,
  Users,
  Target,
  Smartphone,
  Globe,
  Mail,
  Share2,
  Plus,
  Edit,
  Eye,
  Play,
  Pause,
  Download,
  RefreshCw,
  Settings,
  PieChart,
  LineChart,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Métricas e análises de marketing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
              >
                Em Construção
              </Badge>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Status de Construção */}
        <Card className="card-dark mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Construction className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <CardTitle className="card-title-dark">
                  Sistema de Analytics
                </CardTitle>
                <CardDescription className="card-description-dark">
                  O sistema de analytics está sendo desenvolvido e estará
                  disponível em breve
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Design Finalizado
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Desenvolvimento
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Testes
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Lançamento
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades Planejadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Dashboard</CardTitle>
                  <CardDescription className="card-description-dark">
                    Visão geral em tempo real
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Métricas em tempo real</li>
                <li>• Gráficos interativos</li>
                <li>• KPIs principais</li>
                <li>• Alertas automáticos</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Conversão</CardTitle>
                  <CardDescription className="card-description-dark">
                    Análise de conversões
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Funil de conversão</li>
                <li>• Taxa de conversão</li>
                <li>• ROI por canal</li>
                <li>• Otimização</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Audiência</CardTitle>
                  <CardDescription className="card-description-dark">
                    Análise de público
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Demografia</li>
                <li>• Comportamento</li>
                <li>• Segmentação</li>
                <li>• Personas</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Campanhas</CardTitle>
                  <CardDescription className="card-description-dark">
                    Performance por campanha
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• ROI por campanha</li>
                <li>• A/B testing</li>
                <li>• Comparativo</li>
                <li>• Otimização</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Globe className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Canais</CardTitle>
                  <CardDescription className="card-description-dark">
                    Análise por canal
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• WhatsApp</li>
                <li>• Email</li>
                <li>• Redes sociais</li>
                <li>• Orgânico</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Tempo Real</CardTitle>
                  <CardDescription className="card-description-dark">
                    Monitoramento ativo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Atividade em tempo real</li>
                <li>• Alertas instantâneos</li>
                <li>• Notificações</li>
                <li>• Monitoramento 24/7</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Exemplo de Analytics (Preview) */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold card-title-dark mb-6">
            Preview: Dashboard Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-dark">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium card-title-dark">
                  Conversões
                </CardTitle>
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold card-title-dark">1.234</div>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% este mês
                </p>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium card-title-dark">
                  ROI Médio
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold card-title-dark">3.2x</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +0.8x este mês
                </p>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium card-title-dark">
                  Custo por Cliente
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold card-title-dark">
                  R$ 45,67
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -8.3% este mês
                </p>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium card-title-dark">
                  Taxa de Abertura
                </CardTitle>
                <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold card-title-dark">78.5%</div>
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.2% este mês
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">
                  Conversões por Canal
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Últimos 30 dias
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

            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">
                  Tendência de Conversões
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Últimos 90 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Gráfico de Linha
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Card className="card-dark">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold card-title-dark mb-2">
                Quer ser notificado quando estiver pronto?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Deixe seu email para receber atualizações sobre o lançamento do
                sistema de Analytics
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Notificar-me
                </Button>
                <Link href="/marketing">
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Voltar ao Marketing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
