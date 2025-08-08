'use client';

import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, CheckSquare, Clock, ChefHat } from 'lucide-react';

export default function OperacionalPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('⚡ Operacional');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const operacionalItems = [
    {
      title: 'Agendamento',
      description: 'Gestão de pagamentos e recebimentos financeiros',
      href: '/financeiro/agendamento',
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Checklists',
      description: 'Checklists operacionais e de funcionários',
      href: '/operacoes/checklists',
      icon: CheckSquare,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Terminal Produção',
      description: 'Terminal de produção e operações',
      href: '/operacoes/terminal',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Receitas',
      description: 'Gestão de receitas e insumos',
      href: '/operacoes/receitas',
      icon: ChefHat,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚡ Operacional
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ferramentas para gestão operacional, processos e atividades diárias
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operacionalItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 h-full cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:scale-110 transition-transform duration-200`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
