'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BarChart3,
  Settings,
  ArrowRight,
  Activity,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';



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



        {/* Quick Actions */}
        <motion.div 
          className="flex-1 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >


          <div className="grid grid-cols-3 grid-rows-2 gap-6 h-full">
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
                  <div className="relative h-full bg-gradient-to-br from-white/5 via-gray-800/30 to-gray-900/50 backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 group-hover:bg-gradient-to-br group-hover:from-white/8 group-hover:via-gray-800/40 group-hover:to-gray-900/60">
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
                    <div className="relative flex flex-col items-center h-full justify-center text-center">
                      {/* Icon with glow */}
                      <div className="relative mb-3">
                        <div className={`absolute -inset-1 bg-gradient-to-r ${action.color} rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                        <div className={`relative w-16 h-16 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/10`}>
                          <action.icon className="w-8 h-8 text-white drop-shadow-sm" />
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-400 dark:group-hover:text-blue-300 transition-colors duration-300 mb-2 leading-tight">
                        {action.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight mb-3 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors duration-300">
                        {action.description}
                      </p>
                      
                      {/* Action button */}
                      <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-all duration-300 bg-blue-500/10 dark:bg-blue-400/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-400/20">
                        <span className="mr-1">Acessar</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
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