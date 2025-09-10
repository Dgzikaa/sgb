'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Package,
  Settings,
  Zap,
  Bot,
  FileText,
  Database,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import Link from 'next/link';

interface FerramentaStats {
  total_ferramentas: number;
  ferramentas_ativas: number;
  ultima_atualizacao: string;
}

export default function FerramentasPage() {
  const router = useRouter();
  const [stats, setStats] = useState<FerramentaStats>({
    total_ferramentas: 8,
    ferramentas_ativas: 6,
    ultima_atualizacao: new Date().toLocaleDateString('pt-BR')
  });
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header com busca */}
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ferramentas de Análise
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ferramentas avançadas para análise de dados e insights do negócio
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar ferramentas..."
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
                    Ferramentas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total_ferramentas}
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
                    Ativas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.ferramentas_ativas}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Análises
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    3
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Atualização
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Hoje
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Análise de Eventos */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Análise de Eventos
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
                Análise detalhada de horários de pico, produtos e resumos semanais
              </CardDescription>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  • Horário de Pico • Produtos do Dia • Resumo Semanal
                </div>
              </div>
              <Link href="/analitico?tab=eventos">
                <Button className="w-full bg-blue-500/10 border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:bg-blue-900/20 dark:border-blue-700 dark:hover:bg-blue-900/30">
                  Acessar Análises
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Agendamento Automático */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Agendamento
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
                Automatização de processos e sincronização de dados
              </CardDescription>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Execução diária às 07:00
                </div>
              </div>
              <Link href="/operacoes/agendamento">
                <Button className="w-full bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-500/20 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30">
                  Configurar Agendamento
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Agente IA */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Agente IA
                    </CardTitle>
                    <Badge variant="outline" className="text-xs mt-1 border-yellow-200 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300">
                      Em Breve
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Assistente inteligente para análises e insights automáticos
              </CardDescription>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Em desenvolvimento
                </div>
              </div>
              <Button disabled className="w-full bg-gray-500/10 border border-gray-500 text-gray-500 cursor-not-allowed">
                Em Desenvolvimento
              </Button>
            </CardContent>
          </Card>

          {/* Relatórios Avançados */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Relatórios
                    </CardTitle>
                    <Badge variant="outline" className="text-xs mt-1 border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Relatórios detalhados de ContaHub, ContaAzul e análises
              </CardDescription>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  ContaHub • ContaAzul • Analítico
                </div>
              </div>
              <Link href="/relatorios">
                <Button className="w-full bg-orange-500/10 border border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 dark:bg-orange-900/20 dark:border-orange-700 dark:hover:bg-orange-900/30">
                  Ver Relatórios
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Configurações
                    </CardTitle>
                    <Badge variant="outline" className="text-xs mt-1 border-red-200 text-red-700 dark:border-red-700 dark:text-red-300">
                      Admin
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configurações do sistema, usuários e integrações
              </CardDescription>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Usuários • Segurança • Integrações
                </div>
              </div>
              <Link href="/configuracoes">
                <Button className="w-full bg-red-500/10 border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:bg-red-900/20 dark:border-red-700 dark:hover:bg-red-900/30">
                  Acessar Configurações
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Monitoramento */}
          <Card className="card-dark shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Monitoramento
                    </CardTitle>
                    <Badge variant="outline" className="text-xs mt-1 border-teal-200 text-teal-700 dark:border-teal-700 dark:text-teal-300">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Monitoramento de performance e saúde do sistema
              </CardDescription>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  APIs • Banco • Sincronização
                </div>
              </div>
              <Link href="/visao-geral">
                <Button className="w-full bg-teal-500/10 border border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 dark:bg-teal-900/20 dark:border-teal-700 dark:hover:bg-teal-900/30">
                  Ver Status
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}