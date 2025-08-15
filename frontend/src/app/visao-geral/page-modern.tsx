'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useRouter } from 'next/navigation';
import { useBar } from '@/contexts/BarContext';
import { 
  ModernPageLayout, 
  ModernCard, 
  ModernGrid, 
  ModernStat 
} from '@/components/layouts/ModernPageLayout';
import { Button } from '@/components/ui/button';
import { useZykorToast } from '@/components/ui/toast-modern';
import { usePushNotifications } from '@/lib/push-notifications';
import { useBackgroundSync } from '@/lib/background-sync';
import { useShareAPI } from '@/lib/share-api';
import { useBadgeAPI } from '@/lib/badge-api';
import { AnimatedCounter, AnimatedProgress } from '@/components/ui/motion-wrapper';
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  Activity,
  BarChart3,
  Filter,
  Settings,
  Maximize2,
  Share,
  Download,
  RefreshCw,
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface IndicadoresAnuais {
  faturamento: {
    valor: number;
    meta: number;
    detalhes?: Record<string, number>;
  };
  pessoas: {
    valor: number;
    meta: number;
    detalhes?: Record<string, number>;
  };
  reputacao: {
    valor: number;
    meta: number;
  };
  ebitda: {
    valor: number;
    meta: number;
  };
}

interface IndicadoresTrimestrais {
  clientesAtivos: {
    valor: number;
    meta: number;
  };
  clientesTotais: {
    valor: number;
    meta: number;
  };
  retencao: {
    valor: number;
    meta: number;
  };
  cmvLimpo: {
    valor: number;
    meta: number;
  };
  cmo: {
    valor: number;
    meta: number;
  };
  artistica: {
    valor: number;
    meta: number;
  };
}

export default function VisaoGeralModernPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const router = useRouter();
  const toast = useZykorToast();
  const pushNotifications = usePushNotifications();
  const backgroundSync = useBackgroundSync();
  const shareAPI = useShareAPI();
  const badgeAPI = useBadgeAPI();
  
  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trimestreAtual, setTrimestreAtual] = useState(3);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    setPageTitle('📊 Visão Geral');
    
    // Inicializar PWA features
    initializePWAFeatures();
    
    return () => setPageTitle('');
  }, [setPageTitle]);

  const initializePWAFeatures = async () => {
    try {
      await Promise.all([
        pushNotifications.initialize(),
        backgroundSync.initialize(),
        badgeAPI.startAutoUpdate(10) // Atualizar badges a cada 10 minutos
      ]);
      
      // Solicitar permissão para notificações se não concedida
      if (!pushNotifications.isEnabled()) {
        await pushNotifications.requestPermission();
      }
      
      toast.success('Sistema PWA inicializado', 'Todas as funcionalidades avançadas estão ativas');
    } catch (error) {
      console.error('Erro ao inicializar PWA:', error);
      toast.warning('PWA parcialmente inicializado', 'Algumas funcionalidades podem estar limitadas');
    }
  };

  useEffect(() => {
    if (selectedBar?.id) {
      loadIndicadores();
    }
  }, [selectedBar]);

  const loadIndicadores = async () => {
    if (!selectedBar?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simular carregamento com dados mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAnuais: IndicadoresAnuais = {
        faturamento: {
          valor: 2500000,
          meta: 10000000,
          detalhes: {
            contahub: 1800000,
            yuzer: 500000,
            sympla: 200000
          }
        },
        pessoas: {
          valor: 32000,
          meta: 144000,
          detalhes: {
            contahub: 25000,
            yuzer: 4000,
            sympla: 3000
          }
        },
        reputacao: {
          valor: 4.6,
          meta: 4.8
        },
        ebitda: {
          valor: 0,
          meta: 1000000
        }
      };

      const mockTrimestrais: IndicadoresTrimestrais = {
        clientesAtivos: { valor: 1200, meta: 3000 },
        clientesTotais: { valor: 8500, meta: 10000 },
        retencao: { valor: 12.5, meta: 10.0 },
        cmvLimpo: { valor: 32.1, meta: 34.0 },
        cmo: { valor: 18.5, meta: 20.0 },
        artistica: { valor: 15.2, meta: 18.0 }
      };

      setIndicadoresAnuais(mockAnuais);
      setIndicadoresTrimestrais(mockTrimestrais);
      setLastUpdate(new Date());
      
      // Sincronizar dados em background
      await backgroundSync.addTask('analytics', 'update', {
        barId: selectedBar.id,
        indicadores: { mockAnuais, mockTrimestrais }
      }, 'normal');
      
      toast.success('Dados atualizados', 'Indicadores carregados com sucesso');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro ao carregar dados', errorMessage);
      
      // Tentar carregar dados do cache
      const cachedData = localStorage.getItem(`visao-geral-${selectedBar.id}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setIndicadoresAnuais(parsed.anuais);
        setIndicadoresTrimestrais(parsed.trimestrais);
        toast.info('Dados do cache carregados', 'Dados podem estar desatualizados');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast.info('Atualizando dados...', 'Aguarde enquanto sincronizamos');
    await loadIndicadores();
  };

  const handleShare = async () => {
    if (!indicadoresAnuais || !indicadoresTrimestrais) return;
    
    const dados = {
      bar: selectedBar?.nome,
      periodo: `Trimestre ${trimestreAtual}/2025`,
      anuais: indicadoresAnuais,
      trimestrais: indicadoresTrimestrais,
      geradoEm: new Date().toISOString()
    };
    
    await shareAPI.shareAnalytics(dados, `Trimestre ${trimestreAtual}/2025`);
  };

  const handleExport = async () => {
    toast.loading('Gerando relatório...', 'Preparando arquivo para download');
    
    // Simular geração de relatório
    setTimeout(() => {
      toast.success('Relatório gerado!', 'Download iniciado automaticamente');
    }, 2000);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      toast.info('Modo tela cheia ativado', 'Pressione ESC para sair');
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFilter = () => {
    toast.info('Filtros em desenvolvimento', 'Funcionalidade será disponibilizada em breve');
  };

  const handleSettings = () => {
    router.push('/configuracoes');
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/home' },
    { label: 'Visão Geral' }
  ];

  const pageActions = (
    <>
      <Button
        onClick={handleRefresh}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span>Atualizar</span>
      </Button>
      
      <Button
        onClick={handleShare}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Share className="h-4 w-4" />
        <span>Compartilhar</span>
      </Button>
      
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Exportar</span>
      </Button>
    </>
  );

  return (
    <ModernPageLayout
      title="Visão Geral"
      description={`Indicadores de desempenho do ${selectedBar?.nome || 'bar'} • Última atualização: ${lastUpdate?.toLocaleTimeString() || 'Nunca'}`}
      loading={loading}
      skeletonType="dashboard"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      showFilterButton
      showFullscreenButton
      showSettingsButton
      onFilter={handleFilter}
      onFullscreen={handleFullscreen}
      onSettings={handleSettings}
    >
      {error && (
        <ModernCard className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 mb-6">
          <div className="flex items-center space-x-3 text-red-800 dark:text-red-200">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold">Erro ao carregar dados</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Indicadores Anuais */}
      <ModernCard 
        title="📈 Indicadores Anuais 2025" 
        description="Metas e progressos do ano"
        className="mb-8"
        hoverable
      >
        <ModernGrid cols={4}>
          <ModernStat
            label="Faturamento"
            value={
              <AnimatedCounter
                to={indicadoresAnuais?.faturamento.valor || 0}
                prefix="R$ "
                duration={2}
              />
            }
            change={`${((indicadoresAnuais?.faturamento.valor || 0) / (indicadoresAnuais?.faturamento.meta || 1) * 100).toFixed(1)}% da meta`}
            changeType="positive"
            icon={DollarSign}
            loading={loading}
          />
          
          <ModernStat
            label="Número de Pessoas"
            value={
              <AnimatedCounter
                to={indicadoresAnuais?.pessoas.valor || 0}
                duration={2}
              />
            }
            change={`${((indicadoresAnuais?.pessoas.valor || 0) / (indicadoresAnuais?.pessoas.meta || 1) * 100).toFixed(1)}% da meta`}
            changeType="positive"
            icon={Users}
            loading={loading}
          />
          
          <ModernStat
            label="Reputação Google"
            value={
              <AnimatedCounter
                to={(indicadoresAnuais?.reputacao.valor || 0) * 10}
                duration={2}
                suffix="/50"
              />
            }
            change={`Meta: ${indicadoresAnuais?.reputacao.meta || 0}`}
            changeType="positive"
            icon={Star}
            loading={loading}
          />
          
          <ModernStat
            label="EBITDA 2025"
            value={
              <AnimatedCounter
                to={indicadoresAnuais?.ebitda.valor || 0}
                prefix="R$ "
                duration={2}
              />
            }
            change="Em desenvolvimento"
            changeType="neutral"
            icon={Target}
            loading={loading}
          />
        </ModernGrid>

        {/* Barras de progresso */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Faturamento</span>
              <span>R$ {(indicadoresAnuais?.faturamento.valor || 0).toLocaleString()} / R$ {(indicadoresAnuais?.faturamento.meta || 0).toLocaleString()}</span>
            </div>
            <AnimatedProgress
              value={indicadoresAnuais?.faturamento.valor || 0}
              max={indicadoresAnuais?.faturamento.meta || 1}
              color="blue"
              showPercentage
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Pessoas</span>
              <span>{(indicadoresAnuais?.pessoas.valor || 0).toLocaleString()} / {(indicadoresAnuais?.pessoas.meta || 0).toLocaleString()}</span>
            </div>
            <AnimatedProgress
              value={indicadoresAnuais?.pessoas.valor || 0}
              max={indicadoresAnuais?.pessoas.meta || 1}
              color="green"
              showPercentage
            />
          </div>
        </div>
      </ModernCard>

      {/* Indicadores Trimestrais */}
      <ModernCard 
        title={`📊 Indicadores ${trimestreAtual}º Trimestre`}
        description="Performance do trimestre atual"
        hoverable
        actions={
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setTrimestreAtual(Math.max(1, trimestreAtual - 1))}
              variant="outline"
              size="sm"
              disabled={trimestreAtual <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">T{trimestreAtual}</span>
            <Button
              onClick={() => setTrimestreAtual(Math.min(4, trimestreAtual + 1))}
              variant="outline"
              size="sm"
              disabled={trimestreAtual >= 4}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <ModernGrid cols={3}>
          <ModernStat
            label="Clientes Ativos"
            value={
              <AnimatedCounter
                to={indicadoresTrimestrais?.clientesAtivos.valor || 0}
                duration={1.5}
              />
            }
            change={`Meta: ${indicadoresTrimestrais?.clientesAtivos.meta || 0}`}
            changeType="positive"
            icon={Activity}
            loading={loading}
          />
          
          <ModernStat
            label="Retenção"
            value={
              <AnimatedCounter
                to={(indicadoresTrimestrais?.retencao.valor || 0) * 10}
                duration={1.5}
                suffix="%"
              />
            }
            change={`Meta: ${indicadoresTrimestrais?.retencao.meta || 0}%`}
            changeType="positive"
            icon={Award}
            loading={loading}
          />
          
          <ModernStat
            label="CMV Limpo"
            value={
              <AnimatedCounter
                to={(indicadoresTrimestrais?.cmvLimpo.valor || 0) * 10}
                duration={1.5}
                suffix="%"
              />
            }
            change={`Meta: ${indicadoresTrimestrais?.cmvLimpo.meta || 0}%`}
            changeType="positive"
            icon={BarChart3}
            loading={loading}
          />
        </ModernGrid>
      </ModernCard>

      {/* Ações Rápidas */}
      <ModernCard title="⚡ Ações Rápidas" className="mt-6">
        <ModernGrid cols={3}>
          <Button 
            className="h-20 flex-col space-y-2"
            variant="outline"
            onClick={() => router.push('/estrategico/planejamento-comercial')}
          >
            <Calendar className="h-6 w-6" />
            <span>Planejamento</span>
          </Button>
          
          <Button 
            className="h-20 flex-col space-y-2"
            variant="outline"
            onClick={() => router.push('/estrategico/orcamentacao')}
          >
            <Target className="h-6 w-6" />
            <span>Orçamentação</span>
          </Button>
          
          <Button 
            className="h-20 flex-col space-y-2"
            variant="outline"
            onClick={() => router.push('/estrategico/desempenho')}
          >
            <Zap className="h-6 w-6" />
            <span>Desempenho</span>
          </Button>
        </ModernGrid>
      </ModernCard>
    </ModernPageLayout>
  );
}
