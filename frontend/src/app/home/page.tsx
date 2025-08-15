'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  Crown,
  ArrowRight,
  Star,
  Activity,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
}

export default function HomePage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPageTitle('🏠 Dashboard');
    setIsLoaded(true);
  }, [setPageTitle]);

  const quickStats: QuickStat[] = [
    {
      label: 'Faturamento Hoje',
      value: 'R$ 2.847',
      change: '+18.2%',
      positive: true,
      icon: DollarSign
    },
    {
      label: 'Clientes Ativos',
      value: '147',
      change: '+12%',
      positive: true,
      icon: Users
    },
    {
      label: 'Ticket Médio',
      value: 'R$ 89,40',
      change: '+5.7%',
      positive: true,
      icon: TrendingUp
    },
    {
      label: 'Performance',
      value: '94%',
      change: '+2.1%',
      positive: true,
      icon: Target
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Visão Geral Estratégica',
      description: 'Dashboard executivo com todos os indicadores',
      href: '/estrategico/visao-geral',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      badge: 'Principal'
    },
    {
      title: 'Desempenho',
      description: 'Análise semanal e mensal dos resultados',
      href: '/estrategico/desempenho',
      icon: Activity,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Relatório de Clientes',
      description: 'Base unificada e análise comportamental',
      href: '/analitico/clientes',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Planejamento Comercial',
      description: 'Metas, projeções e estratégias',
      href: '/estrategico/planejamento-comercial',
      icon: Target,
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'DRE Operacional',
      description: 'Demonstrativo detalhado de resultados',
      href: '/operacional/dre',
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Configurações',
      description: 'Ajustes e configurações do sistema',
      href: '/configuracoes',
      icon: Settings,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ZYKOR Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Bem-vindo ao sistema de gestão mais completo para bares
              </p>
            </div>
            <div className="mt-4 lg:mt-0 text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentTime}
              </div>
              <div className="text-gray-600 dark:text-gray-400 capitalize">
                {currentDate}
              </div>
            </div>
          </div>

          {selectedBar && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {selectedBar.nome_bar}
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Sistema ativo • Todos os dados atualizados
                </p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {quickStats.map((stat, index) => (
            <Card key={index} className="card-dark hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <p className={`text-xs flex items-center ${
                  stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change} vs ontem
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Acesso Rápido
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Navegue diretamente para as funcionalidades principais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="group"
              >
                <Link href={action.href}>
                  <Card className="card-dark h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group-hover:ring-2 group-hover:ring-blue-500/50">
                    <CardHeader className="pb-4">
                      {action.badge && (
                        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                          {action.badge}
                        </Badge>
                      )}
                      <div className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <action.icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {action.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                        {action.description}
                      </p>
                      <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                        Acessar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div 
          className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">
                Sistema Operacional
              </h3>
              <p className="text-green-700 dark:text-green-400">
                Todos os serviços funcionando normalmente • Última atualização: {currentTime}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 dark:text-green-300 font-semibold">99.9% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}