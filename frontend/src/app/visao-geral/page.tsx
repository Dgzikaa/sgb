'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { IndicadorCard } from '@/components/visao-geral/IndicadorCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  Target,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
    valorAbsoluto?: number;
  };
  artistica: {
    valor: number;
    meta: number;
  };
}

export default function VisaoGeralPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);

  useEffect(() => {
    setPageTitle('📊 Visão Geral');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const carregarIndicadores = async () => {
    if (!selectedBar) return;

    try {
      setLoading(true);
      
      // Buscar indicadores anuais e trimestrais em paralelo
      const [anualResponse, trimestralResponse] = await Promise.all([
        fetch(`/api/visao-geral/indicadores?periodo=anual&bar_id=${selectedBar}`),
        fetch(`/api/visao-geral/indicadores?periodo=trimestral&bar_id=${selectedBar}`)
      ]);

      if (!anualResponse.ok || !trimestralResponse.ok) {
        throw new Error('Erro ao carregar indicadores');
      }

      const anualData = await anualResponse.json();
      const trimestralData = await trimestralResponse.json();

      setIndicadoresAnuais(anualData.anual);
      setIndicadoresTrimestrais(trimestralData.trimestral);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os indicadores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarIndicadores();
  }, [selectedBar]);

  const handleRefresh = () => {
    setRefreshing(true);
    carregarIndicadores();
  };

  return (
    <ProtectedRoute requiredModule="relatorios">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Visão Geral
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Acompanhe as principais métricas e indicadores do seu negócio
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Tabs para Anual e Trimestral */}
          <Tabs defaultValue="anual" className="space-y-6">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="anual" className="gap-2">
                <Calendar className="w-4 h-4" />
                Metas Anuais 2025
              </TabsTrigger>
              <TabsTrigger value="trimestral" className="gap-2">
                <Target className="w-4 h-4" />
                Trimestre (Jul-Set)
              </TabsTrigger>
            </TabsList>

            {/* Indicadores Anuais */}
            <TabsContent value="anual" className="space-y-6 mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-white dark:bg-gray-800">
                      <CardHeader>
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : indicadoresAnuais ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <IndicadorCard
                      titulo="Faturamento 2025"
                      valor={indicadoresAnuais.faturamento.valor}
                      meta={indicadoresAnuais.faturamento.meta}
                      formato="moeda"
                      cor="green"
                      detalhes={indicadoresAnuais.faturamento.detalhes}
                    />
                    
                    <IndicadorCard
                      titulo="Número de Pessoas"
                      valor={indicadoresAnuais.pessoas.valor}
                      meta={indicadoresAnuais.pessoas.meta}
                      formato="numero"
                      cor="blue"
                      detalhes={indicadoresAnuais.pessoas.detalhes}
                    />
                    
                    <IndicadorCard
                      titulo="Reputação"
                      valor={indicadoresAnuais.reputacao.valor}
                      meta={indicadoresAnuais.reputacao.meta}
                      formato="decimal"
                      cor="purple"
                      sufixo=" ⭐"
                    />
                    
                    <IndicadorCard
                      titulo="EBITDA 2025"
                      valor={indicadoresAnuais.ebitda.valor}
                      meta={indicadoresAnuais.ebitda.meta}
                      formato="moeda"
                      cor="yellow"
                    />
                  </div>

                  {/* Card informativo */}
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Metas Anuais 2025
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Acompanhe o progresso das metas estabelecidas para o ano de 2025. 
                            Os valores são atualizados em tempo real com base nas integrações ativas.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            {/* Indicadores Trimestrais */}
            <TabsContent value="trimestral" className="space-y-6 mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-white dark:bg-gray-800">
                      <CardHeader>
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : indicadoresTrimestrais ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <IndicadorCard
                      titulo="Clientes Ativos"
                      valor={indicadoresTrimestrais.clientesAtivos.valor}
                      meta={indicadoresTrimestrais.clientesAtivos.meta}
                      formato="numero"
                      cor="green"
                    />
                    
                    <IndicadorCard
                      titulo="Clientes Totais"
                      valor={indicadoresTrimestrais.clientesTotais.valor}
                      meta={indicadoresTrimestrais.clientesTotais.meta}
                      formato="numero"
                      cor="blue"
                    />
                    
                    <IndicadorCard
                      titulo="Retenção"
                      valor={indicadoresTrimestrais.retencao.valor}
                      meta={indicadoresTrimestrais.retencao.meta}
                      formato="percentual"
                      cor="purple"
                    />
                    
                    <IndicadorCard
                      titulo="CMV Limpo"
                      valor={indicadoresTrimestrais.cmvLimpo.valor}
                      meta={indicadoresTrimestrais.cmvLimpo.meta}
                      formato="percentual"
                      cor="yellow"
                    />
                    
                    <IndicadorCard
                      titulo="CMO %"
                      valor={indicadoresTrimestrais.cmo.valor}
                      meta={indicadoresTrimestrais.cmo.meta}
                      formato="percentual"
                      cor="red"
                    />
                    
                    <IndicadorCard
                      titulo="% Artística"
                      valor={indicadoresTrimestrais.artistica.valor}
                      meta={indicadoresTrimestrais.artistica.meta}
                      formato="percentual"
                      cor="purple"
                    />
                  </div>

                  {/* Card informativo */}
                  <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                            Trimestre Julho - Setembro 2025
                          </h3>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            Métricas trimestrais focadas em retenção e eficiência operacional. 
                            Alguns valores podem ser inseridos manualmente enquanto as integrações são configuradas.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}