'use client';

import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { useForceDarkMode } from '@/hooks/useForceDarkMode';
import {
  BarChart3,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  // Force dark mode on all elements
  useForceDarkMode();

  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();

  useEffect(() => {
    setPageTitle('🏠 Home');
  }, [setPageTitle]);



  const quickActions = [
    {
      title: 'Novo Checklist',
      description: 'Iniciar checklist de abertura',
      href: '/checklists/abertura',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Relatórios',
      description: 'Ver relatórios financeiros',
      href: '/relatorios',
      icon: BarChart3,
      color: 'bg-blue-500',
    },
  ];

  const recentActivity = [
    {
      title: 'Checklist de Abertura Concluído',
      time: '2 horas atrás',
      user: 'João Silva',
      type: 'success',
    },
    {
      title: 'Sincronização Windsor.ai',
      time: '4 horas atrás',
      user: 'Sistema',
      type: 'info',
    },
    {
      title: 'Nova Reserva Cadastrada',
      time: '6 horas atrás',
      user: 'Maria Santos',
      type: 'success',
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Header */}
      <div className="main-content bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-header text-2xl font-bold text-gray-900 dark:text-white mb-1 mt-4">
              Bem-vindo de volta! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Visão geral do{' '}
              <strong className="text-gray-700 dark:text-gray-200">
                {selectedBar?.nome}
              </strong>{' '}
              - {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Sistema Online
          </div>
        </div>
      </div>



      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Ações Rápidas
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acesso rápido às principais funcionalidades
            </p>
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-3`}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Atividade Recente
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Últimas ações realizadas no sistema
            </p>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start">
                <div
                  className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                    activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {activity.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Status do Sistema
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitoramento em tempo real
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                Windsor.ai
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                NIBO API
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                Discord
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                Banco de Dados
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                Operacional
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Pronto para começar o dia?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Execute o checklist de abertura e mantenha tudo organizado.
            </p>
          </div>
          <a
            href="/checklists/abertura"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Iniciar Checklist
          </a>
        </div>
      </div>
    </div>
  );
}
