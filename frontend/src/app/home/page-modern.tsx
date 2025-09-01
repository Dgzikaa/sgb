'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { useRouter } from 'next/navigation';
import { 
  ModernPageLayout, 
  ModernCard, 
  ModernGrid, 
  ModernStat 
} from '@/components/layouts/ModernPageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useZykorToast } from '@/components/ui/toast-modern';
import { usePushNotifications } from '@/lib/push-notifications';
import { useBackgroundSync } from '@/lib/background-sync';
import { useBadgeAPI } from '@/lib/badge-api';
import { AnimatedCounter, HoverMotion } from '@/components/ui/motion-wrapper';
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
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Coffee,
  Music,
  Utensils,
  Camera,
  MessageSquare,
  Bell,
  Smartphone
} from 'lucide-react';
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
  priority?: 'high' | 'medium' | 'low';
}

interface RecentActivity {
  id: string;
  type: 'checklist' | 'venda' | 'evento' | 'sistema';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function HomeModernPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const router = useRouter();
  const toast = useZykorToast();
  const pushNotifications = usePushNotifications();
  const backgroundSync = useBackgroundSync();
  const badgeAPI = useBadgeAPI();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingTasks, setPendingTasks] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    // Simular carregamento de dados
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock de estatísticas rápidas
    const mockStats: QuickStat[] = [
      {
        label: 'Vendas Hoje',
        value: 'R$ 12.450',
        change: '+15.3% vs ontem',
        positive: true,
        icon: DollarSign
      },
      {
        label: 'Clientes Ativos',
        value: '147',
        change: '+8 novos hoje',
        positive: true,
        icon: Users
      },
      {
        label: 'Eventos Esta Semana',
        value: '3',
        change: '2 confirmados',
        positive: true,
        icon: Calendar
      },
      {
        label: 'Avaliação Média',
        value: '4.7',
        change: '+0.2 este mês',
        positive: true,
        icon: Star
      }
    ];

    // Mock de atividades recentes
    const mockActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'checklist',
        title: 'Checklist de Abertura Concluído',
        description: 'Todas as tarefas foram completadas por João',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'success'
      },
      {
        id: '2',
        type: 'venda',
        title: 'Pico de Vendas Detectado',
        description: 'R$ 2.340 em vendas na última hora',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'info'
      },
      {
        id: '3',
        type: 'evento',
        title: 'Evento de Quinta Confirmado',
        description: 'Show do artista Local Band confirmado',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'success'
      },
      {
        id: '4',
        type: 'sistema',
        title: 'Sincronização ContaAzul',
        description: 'Dados financeiros atualizados automaticamente',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: 'info'
      }
    ];

    // Mock de tarefas pendentes
    const mockTasks: QuickAction[] = [
      {
        title: 'Checklist de Fechamento',
        description: 'Tarefas pendentes para hoje',
        href: '/operacoes/checklists',
        icon: CheckCircle,
        color: 'bg-orange-500',
        badge: '3 pendentes',
        priority: 'high'
      },
      {
        title: 'Planejamento Semanal',
        description: 'Revisar eventos da próxima semana',
        href: '/estrategico/planejamento-comercial',
        icon: Calendar,
        color: 'bg-blue-500',
        badge: 'Recomendado',
        priority: 'medium'
      },
      {
        title: 'Relatório Financeiro',
        description: 'Gerar relatório do mês',
        href: '/estrategico/orcamentacao',
        icon: BarChart3,
        color: 'bg-green-500',
        badge: 'Pronto',
        priority: 'low'
      }
    ];

    setQuickStats(mockStats);
    setRecentActivities(mockActivities);
    setPendingTasks(mockTasks);

    // Atualizar badges baseado nas tarefas
    await badgeAPI.updateFromData({
      checklistsPendentes: 3,
      eventosHoje: 1,
      alertasSistema: 0
    });
  }, [badgeAPI]);

  const initializeDashboard = useCallback(async () => {
    setLoading(true);
    
    try {
      // Inicializar PWA features
      await Promise.all([
        pushNotifications.initialize(),
        backgroundSync.initialize(),
        badgeAPI.startAutoUpdate(5) // Atualizar a cada 5 minutos
      ]);

      // Carregar dados do dashboard
      await loadDashboardData();
      
      // Configurar notificação de boas-vindas
      if (pushNotifications.isEnabled()) {
        await pushNotifications.notifySystemAlert(
          `Bem-vindo ao Zykor Dashboard! ${selectedBar?.nome || 'Bar'} está pronto para ser gerenciado.`,
          'normal'
        );
      }

      setIsLoaded(true);
      toast.success('Dashboard carregado!', 'Todas as funcionalidades estão ativas');
      
    } catch (error) {
      console.error('Erro ao inicializar dashboard:', error);
      toast.error('Erro ao carregar dashboard', 'Algumas funcionalidades podem estar limitadas');
    } finally {
      setLoading(false);
    }
  }, [pushNotifications, backgroundSync, badgeAPI, selectedBar?.nome, toast, loadDashboardData]);

  useEffect(() => {
    setPageTitle('🏠 Dashboard');
    initializeDashboard();
    return () => setPageTitle('');
  }, [setPageTitle, initializeDashboard]);

  const handleQuickAction = async (action: QuickAction) => {
    toast.info(`Navegando para ${action.title}`, action.description);
    
    // Sincronizar ação em background
    await backgroundSync.addTask('config', 'update', {
      action: 'navigation',
      destination: action.href,
      timestamp: new Date().toISOString()
    });
    
    router.push(action.href);
  };

  const handleRefreshData = async () => {
    toast.loading('Atualizando dados...', 'Sincronizando informações em tempo real');
    await loadDashboardData();
    toast.success('Dados atualizados!', 'Informações sincronizadas com sucesso');
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    const icons = {
      checklist: CheckCircle,
      venda: DollarSign,
      evento: Music,
      sistema: Settings
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (status: RecentActivity['status']) => {
    const colors = {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      info: 'text-blue-500'
    };
    return colors[status];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <ModernPageLayout
      title={`Dashboard ${selectedBar?.nome || 'Zykor'}`}
      description="Visão geral e controle do seu negócio em tempo real"
      loading={loading}
      skeletonType="dashboard"
      showSettingsButton
      onSettings={() => router.push('/configuracoes')}
      actions={
        <Button onClick={handleRefreshData} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      }
    >
      {/* Boas-vindas personalizadas */}
      <ModernCard className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">
              Bem-vindo ao Zykor! 👋
            </h2>
            <p className="opacity-90">
              Gerencie {selectedBar?.nome || 'seu bar'} com inteligência artificial e automação avançada
            </p>
          </div>
          <div className="text-6xl opacity-30">
            🎯
          </div>
        </div>
      </ModernCard>

      {/* Estatísticas Rápidas */}
      <ModernCard title="📊 Visão Geral Hoje" className="mb-6" hoverable>
        <ModernGrid cols={4}>
          {quickStats.map((stat, index) => (
            <ModernStat
              key={index}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              changeType={stat.positive ? 'positive' : 'negative'}
              icon={stat.icon}
              loading={loading}
            />
          ))}
        </ModernGrid>
      </ModernCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarefas Prioritárias */}
        <div className="lg:col-span-2">
          <ModernCard title="🎯 Ações Prioritárias" description="Tarefas que precisam da sua atenção">
            <div className="space-y-4">
              {pendingTasks.map((task, index) => (
                <HoverMotion key={index} hoverEffect="lift">
                  <div 
                    onClick={() => handleQuickAction(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleQuickAction(task);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="flex items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className={`p-3 rounded-lg ${task.color} text-white mr-4`}>
                      <task.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        {task.badge && (
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {task.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </HoverMotion>
              ))}
            </div>
          </ModernCard>
        </div>

        {/* Atividades Recentes */}
        <div>
          <ModernCard title="🕐 Atividades Recentes" description="Últimas atualizações do sistema">
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <IconComponent className={`h-5 w-5 mt-0.5 ${getActivityColor(activity.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ModernCard>
        </div>
      </div>

      {/* Acesso Rápido */}
      <ModernCard title="🚀 Acesso Rápido" description="Principais funcionalidades do Zykor" className="mt-6">
        <ModernGrid cols={4}>
          {[
            { icon: Utensils, label: 'Operações', href: '/operacoes', color: 'text-orange-500' },
            { icon: BarChart3, label: 'Analytics', href: '/relatorios', color: 'text-blue-500' },
            { icon: Calendar, label: 'Eventos', href: '/ferramentas/calendario', color: 'text-purple-500' },
            { icon: Settings, label: 'Configurações', href: '/configuracoes', color: 'text-gray-500' },
            { icon: Users, label: 'Clientes', href: '/analitico/clientes', color: 'text-green-500' },
            { icon: DollarSign, label: 'Financeiro', href: '/estrategico/orcamentacao', color: 'text-emerald-500' },
            { icon: Zap, label: 'IA Assistant', href: '/assistente', color: 'text-yellow-500' },
            { icon: Shield, label: 'Segurança', href: '/configuracoes/seguranca', color: 'text-red-500' }
          ].map((item, index) => (
            <HoverMotion key={index} hoverEffect="scale">
              <Link href={item.href}>
                <div className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                  <item.icon className={`h-8 w-8 ${item.color} mb-2`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                    {item.label}
                  </span>
                </div>
              </Link>
            </HoverMotion>
          ))}
        </ModernGrid>
      </ModernCard>

      {/* PWA Install Banner (se não instalado) */}
      {!isLoaded && (
        <ModernCard className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Instale o Zykor como App
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Acesso rápido e notificações em tempo real
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Instalar App
            </Button>
          </div>
        </ModernCard>
      )}
    </ModernPageLayout>
  );
}
