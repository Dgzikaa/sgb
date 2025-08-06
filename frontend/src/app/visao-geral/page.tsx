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
          {/* Header Elegante */}
          <div className="card-dark p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="card-title-dark text-3xl font-bold">
                    Visão Geral
                  </h1>
                  <p className="card-description-dark text-lg">
                    Dashboard executivo com os principais indicadores do seu negócio
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
            
            {/* Stats rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Performance Anual</p>
                    <p className="text-xs text-blue-500 dark:text-blue-300">4 indicadores principais</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Metas Trimestrais</p>
                    <p className="text-xs text-green-500 dark:text-green-300">6 indicadores ativos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Período Atual</p>
                    <p className="text-xs text-purple-500 dark:text-purple-300">Jul-Set 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs para Anual e Trimestral */}
          <Tabs defaultValue="anual" className="space-y-6">
            <div className="card-dark p-6">
              <TabsList className="grid w-full max-w-[500px] grid-cols-2 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger value="anual" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  Metas Anuais 2025
                </TabsTrigger>
                <TabsTrigger value="trimestral" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300">
                  <Target className="w-4 h-4" />
                  Trimestre (Jul-Set)
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Indicadores Anuais */}
            <TabsContent value="anual" className="space-y-6 mt-6">
              <div className="card-dark p-8">
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-lg">
                          Metas Anuais 2025
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300">
                          Acompanhe o progresso das metas estabelecidas para o ano de 2025. 
                          Os valores são atualizados em tempo real com base nas integrações ativas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              ) : null}
            </TabsContent>

            {/* Indicadores Trimestrais */}
            <TabsContent value="trimestral" className="space-y-6 mt-6">
              <div className="card-dark p-8">
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