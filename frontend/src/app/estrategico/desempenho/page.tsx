'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Activity
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';

interface DadosSemana {
  semana: number;
  periodo: string;
  faturamento_total: number;
  clientes_total: number;
  ticket_medio: number;
  performance_geral: number;
  eventos_count: number;
  meta_faturamento: number;
  meta_clientes: number;
}

interface TotaisMensais {
  faturamento_total: number;
  clientes_total: number;
  ticket_medio: number;
  performance_media: number;
  eventos_total: number;
}

interface DadosMes {
  mes: number;
  ano: number;
  nome_mes: string;
  faturamento_total: number;
  clientes_total: number;
  ticket_medio: number;
  performance_media: number;
}

export default function DesempenhoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('semanal');
  const [loading, setLoading] = useState(true);
  const [anoAtual, setAnoAtual] = useState(() => new Date().getFullYear());
  const [dadosSemanas, setDadosSemanas] = useState<DadosSemana[]>([]);
  const [totaisAnuais, setTotaisAnuais] = useState<TotaisMensais | null>(null);
  const [dadosMensais, setDadosMensais] = useState<DadosMes[]>([]);

  const mesesNomes = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);

  // Carregar dados mensais consolidados (fevereiro 2025 até atual)
  const carregarDadosMensais = useCallback(async () => {
    if (!selectedBar) return;

    const dadosMensaisTemp: DadosMes[] = [];
    const anoAtualNum = new Date().getFullYear();
    const mesAtualNum = new Date().getMonth() + 1;

    // Buscar dados de fevereiro 2025 até o mês atual
    for (let ano = 2025; ano <= anoAtualNum; ano++) {
      const mesInicio = ano === 2025 ? 2 : 1; // Começar em fevereiro para 2025
      const mesFim = ano === anoAtualNum ? mesAtualNum : 12;

      for (let mes = mesInicio; mes <= mesFim; mes++) {
        try {
          const response = await fetch(`/api/estrategico/desempenho?mes=${mes}&ano=${ano}`, {
            headers: {
              'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.totais_mensais) {
              dadosMensaisTemp.push({
                mes,
                ano,
                nome_mes: mesesNomes[mes - 1],
                faturamento_total: data.totais_mensais.faturamento_total,
                clientes_total: data.totais_mensais.clientes_total,
                ticket_medio: data.totais_mensais.ticket_medio,
                performance_media: data.totais_mensais.performance_media
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao carregar dados de ${mes}/${ano}:`, error);
        }
      }
    }

    setDadosMensais(dadosMensaisTemp);
  }, [selectedBar, mesesNomes]);

  // Carregar dados da API
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!selectedBar) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/estrategico/desempenho?mes=1&ano=${anoAtual}`, {
        headers: {
          'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados de desempenho');
      }

      const data = await response.json();
      setDadosSemanas(data.semanas || []);
      setTotaisAnuais(data.totais_mensais || null);

      // Carregar dados mensais se estiver na aba mensal
      if (activeTab === 'mensal') {
        await carregarDadosMensais();
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de desempenho",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [anoAtual, selectedBar, activeTab]);

  const navegarAno = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior') {
      setAnoAtual(prev => prev - 1);
    } else {
      setAnoAtual(prev => prev + 1);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (performance >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    if (performance >= 70) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800';
  };

  useEffect(() => {
    setPageTitle('📈 Desempenho');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, anoAtual]);

  // Carregar dados mensais quando mudar para aba mensal
  useEffect(() => {
    if (activeTab === 'mensal' && selectedBar && dadosMensais.length === 0) {
      carregarDadosMensais();
    }
  }, [activeTab, selectedBar, dadosMensais.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <RefreshCcw className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse mx-auto"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando dados de desempenho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header Elegante */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              Desempenho Operacional
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium ml-16">
              Análise detalhada dos indicadores de performance
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navegarAno('anterior')}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg min-w-[120px] text-center shadow-lg">
              {anoAtual}
            </div>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => navegarAno('proximo')}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={carregarDados}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Cards de Resumo Elegantes */}
        {totaisAnuais && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Faturamento Total</p>
                    <p className="text-3xl font-bold">{formatarMoeda(totaisAnuais.faturamento_total)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <DollarSign className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">Clientes Atendidos</p>
                    <p className="text-3xl font-bold">{totaisAnuais.clientes_total.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-violet-100 text-sm font-medium uppercase tracking-wide">Ticket Médio</p>
                    <p className="text-3xl font-bold">{formatarMoeda(totaisAnuais.ticket_medio)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">Performance Geral</p>
                    <p className="text-3xl font-bold">{totaisAnuais.performance_media.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Elegantes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg p-1 rounded-xl">
            <TabsTrigger 
              value="semanal" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-6 py-3 font-medium transition-all duration-200"
            >
              <Activity className="h-4 w-4 mr-2" />
              Visão Semanal
            </TabsTrigger>
            <TabsTrigger 
              value="mensal" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-6 py-3 font-medium transition-all duration-200"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Visão Mensal
            </TabsTrigger>
          </TabsList>

          {/* Visão Semanal */}
          <TabsContent value="semanal" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Eventos por Semana - {anoAtual}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left py-4 px-6 font-semibold text-slate-900 dark:text-white">Semana</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900 dark:text-white">Período</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Faturamento</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Clientes</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Ticket Médio</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Performance</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosSemanas.map((semana, index) => (
                        <tr key={semana.semana} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                              <span className="font-semibold text-slate-900 dark:text-white">Semana {semana.semana}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">{semana.periodo}</td>
                          <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white">{formatarMoeda(semana.faturamento_total)}</td>
                          <td className="py-4 px-6 text-right font-semibold text-slate-700 dark:text-slate-300">{semana.clientes_total.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right font-semibold text-slate-700 dark:text-slate-300">{formatarMoeda(semana.ticket_medio)}</td>
                          <td className="py-4 px-6 text-right">
                            <Badge className={`${getPerformanceBadge(semana.performance_geral)} font-bold px-3 py-1 border`}>
                              {semana.performance_geral.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium">
                              {semana.eventos_count} eventos
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visão Mensal */}
          <TabsContent value="mensal" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  Comparativo dos Meses - Fevereiro 2025 até {mesesNomes[new Date().getMonth()]} {new Date().getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left py-4 px-6 font-semibold text-slate-900 dark:text-white">Mês</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Faturamento</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Clientes</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Ticket Médio</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-900 dark:text-white">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosMensais.map((dadoMes, index) => (
                        <tr key={`${dadoMes.mes}-${dadoMes.ano}`} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                              <span className="font-semibold text-slate-900 dark:text-white">{dadoMes.nome_mes} {dadoMes.ano}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white">{formatarMoeda(dadoMes.faturamento_total)}</td>
                          <td className="py-4 px-6 text-right font-semibold text-slate-700 dark:text-slate-300">{dadoMes.clientes_total.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right font-semibold text-slate-700 dark:text-slate-300">{formatarMoeda(dadoMes.ticket_medio)}</td>
                          <td className="py-4 px-6 text-right">
                            <Badge className={`${getPerformanceBadge(dadoMes.performance_media)} font-bold px-3 py-1 border`}>
                              {dadoMes.performance_media.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {dadosMensais.length > 0 && (
                        <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                              <span className="font-bold text-slate-900 dark:text-white text-lg">TOTAL GERAL</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-xl text-slate-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + m.faturamento_total, 0))}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-xl text-slate-900 dark:text-white">
                            {dadosMensais.reduce((sum, m) => sum + m.clientes_total, 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-xl text-slate-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + m.ticket_medio, 0) / dadosMensais.length)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold px-4 py-2 text-lg border-0">
                              {(dadosMensais.reduce((sum, m) => sum + m.performance_media, 0) / dadosMensais.length).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}