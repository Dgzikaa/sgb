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
import InsightsCard from '@/components/dashboard/InsightsCard';



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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="h-full px-6 py-8 flex flex-col max-w-none">
        {/* Header - Apenas hora e data */}
        <motion.div 
          className="mb-8 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentTime}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm capitalize">
                {currentDate}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6">
          {/* Quick Actions Grid */}
          <motion.div 
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-3 grid-rows-2 gap-6 h-full">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="group"
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={action.href}>
                    <div className="relative h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden">
                      
                      {/* Badge */}
                      {action.badge && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 shadow-lg">
                            {action.badge}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="relative flex flex-col items-center h-full justify-center text-center">
                        {/* Icon */}
                        <div className="relative mb-6">
                          <div className={`w-20 h-20 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
                            <action.icon className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                          {action.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                          {action.description}
                        </p>
                        
                        {/* Action button */}
                        <div className="mt-auto flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:gap-2 transition-all duration-300">
                          <span>Acessar</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Insights Sidebar */}
          <motion.div
            className="w-96 flex-shrink-0 hidden xl:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <InsightsCard showActions={true} maxAlertas={5} />
          </motion.div>
        </div>

      </div>
    </div>
  );
}