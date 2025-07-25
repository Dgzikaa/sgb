'use client';

import { useState, useEffect, useCallback } from 'react';
import { StandardPageLayout } from '@/components/layouts';
import { DashboardGrid } from '@/components/ui/dashboard-grid';
import { WidgetConfig, WIDGET_PRESETS } from '@/components/ui/dashboard-widget';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBarContext } from '@/contexts/BarContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RefreshCw, Settings } from 'lucide-react';

// Interfaces para tipagem
interface ResumoExecutivo {
  receitas: number;
  despesas: number;
  margem: number;
  totalAgendamentos: number;
  tendencia: {
    receitas: number;
    despesas: number;
    agendamentos: number;
  };
}

interface OperacoesCriticas {
  checklist: {
    total: number;
    concluidos: number;
    pendentes: number;
    problemas: number;
  };
  alertas: Array<{
    tipo: 'critico' | 'importante' | 'info';
    mensagem: string;
    timestamp: string;
  }>;
}

interface MetricasChave {
  nibo: {
    status: 'ativo' | 'erro' | 'sync';
    ultima_sync: string;
    registros: number;
    categorias: number;
    stakeholders: number;
  };
  discord: {
    status: 'ativo' | 'erro';
    mensagens: number;
  };
}

// Componente principal
export default function DashboardUnificado() {
  const { selectedBar } = useBarContext();
  const { toast } = useToast();

  // Estados para dados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para widgets
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    // Tentar carregar do localStorage ou usar presets padrão
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-widgets');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return Object.values(WIDGET_PRESETS);
  });

  // Função para carregar dados
  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    try {
      setLoading(true);

      // Buscar dados reais da API
      const response = await fetch(
        `/api/dashboard-unificado?barId=${selectedBar.id}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard');
      }

      const data = await response.json();

      // Atualizar estados com dados reais
      // setResumoExecutivo(data.resumoExecutivo) // Removed
      // setOperacoesCriticas(data.operacoesCriticas) // Removed
      // setMetricasChave(data.metricasChave) // Removed
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Ocorreu um erro ao carregar as informações do dashboard.',
        variant: 'destructive',
      });

      // Fallback para dados mockados em caso de erro
      // setResumoExecutivo({ // Removed
      //   receitas: 0,
      //   despesas: 0,
      //   margem: 0,
      //   totalAgendamentos: 0,
      //   tendencia: { receitas: 0, despesas: 0, agendamentos: 0 }
      // })

      // setOperacoesCriticas({ // Removed
      //   checklist: { total: 0, concluidos: 0, pendentes: 0, problemas: 0 },
      //   alertas: []
      // })

      // setMetricasChave({ // Removed
      //   nibo: { status: 'erro', ultima_sync: 'N/A', registros: 0, categorias: 0, stakeholders: 0 },
      //   discord: { status: 'erro', mensagens: 0 }
      // })
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, toast]);

  // Função para refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
    toast({
      title: 'Dados atualizados',
      description: 'Dashboard atualizado com sucesso!',
      variant: 'default',
    });
  };

  // Função para salvar widgets no localStorage
  const handleWidgetsChange = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  // Função para formatar valores monetários // Removed
  // const formatarValor = (valor: number) => { // Removed
  //   return new Intl.NumberFormat('pt-BR', { // Removed
  //     style: 'currency', // Removed
  //     currency: 'BRL' // Removed
  //   }).format(valor) // Removed
  // } // Removed

  // Função para formatar data // Removed
  // const formatarData = (data: string) => { // Removed
  //   return new Date(data).toLocaleString('pt-BR') // Removed
  // } // Removed

  if (loading) {
    return (
      <StandardPageLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎯 Dashboard Unificado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Centro de Comando do Sistema
          </p>
        </div>

        <div className="grid gap-6">
          {/* Skeleton loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="card-dark">
                <CardHeader>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <ProtectedRoute>
      <StandardPageLayout>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎯 Dashboard Unificado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Centro de Comando do Sistema
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
        {/* Dashboard Grid com Widgets */}
        <DashboardGrid
          widgets={widgets}
          onWidgetsChange={handleWidgetsChange}
        />
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
