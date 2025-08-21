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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="h-full px-4 py-2 flex flex-col max-w-none">
        {/* Header */}
        <motion.div 
          className="mb-2 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                ZYKOR Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Bem-vindo ao sistema de gestão mais completo para bares
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {currentTime}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs capitalize">
                {currentDate}
              </div>
            </div>
          </div>


        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-4 gap-3 mb-2 flex-shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {quickStats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="group"
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative h-full bg-gradient-to-br from-white/10 via-gray-800/20 to-gray-900/30 backdrop-blur-xl border border-gray-700/40 hover:border-gray-600/60 rounded-xl p-3 transition-all duration-300 hover:shadow-xl hover:shadow-gray-500/5">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.02] rounded-xl opacity-60"></div>
                
                {/* Header */}
                <div className="relative flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {stat.label}
                  </h3>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                    <stat.icon className="relative h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-400 dark:group-hover:text-blue-300 transition-colors duration-300" />
                  </div>
                </div>
                
                {/* Value */}
                <div className="relative text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {stat.value}
                </div>
                
                {/* Change indicator */}
                <div className={`relative flex items-center text-xs ${
                  stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                } group-hover:scale-105 transition-transform duration-300`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>{stat.change} vs ontem</span>
                </div>
                
                {/* Hover shimmer */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="flex-1 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Acesso Rápido
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Navegue diretamente para as funcionalidades principais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 flex-1">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="group"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <div className="relative h-full bg-gradient-to-br from-white/5 via-gray-800/30 to-gray-900/50 backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 rounded-2xl p-4 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 group-hover:bg-gradient-to-br group-hover:from-white/8 group-hover:via-gray-800/40 group-hover:to-gray-900/60 min-h-[150px]">
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02] rounded-2xl opacity-50"></div>
                    
                    {/* Badge */}
                    {action.badge && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-full blur opacity-75"></div>
                          <Badge className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold px-2 py-1 border border-blue-400/30">
                            {action.badge}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="relative flex flex-col items-center h-full justify-between text-center">
                      {/* Icon with glow */}
                      <div className="relative mb-4">
                        <div className={`absolute -inset-2 bg-gradient-to-r ${action.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                        <div className={`relative w-16 h-16 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/10`}>
                          <action.icon className="w-8 h-8 text-white drop-shadow-sm" />
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-400 dark:group-hover:text-blue-300 transition-colors duration-300 mb-3 leading-tight">
                        {action.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors duration-300">
                        {action.description}
                      </p>
                      
                      {/* Action button */}
                      <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-base group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-all duration-300 bg-blue-500/10 dark:bg-blue-400/10 px-4 py-2 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-400/20">
                        <span className="mr-2">Acessar</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                    
                    {/* Hover shimmer effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>


      </div>
    </div>
  );
}