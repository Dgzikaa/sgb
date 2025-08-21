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
  Target,
  Activity,
  Users,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCcw
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
  const [mesAtual, setMesAtual] = useState(() => new Date());
  const [dadosSemanas, setDadosSemanas] = useState<DadosSemana[]>([]);
  const [totaisMensais, setTotaisMensais] = useState<TotaisMensais | null>(null);
  const [dadosMensais, setDadosMensais] = useState<DadosMes[]>([]);

  const mesesNomes = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);

  // Carregar dados mensais consolidados (fevereiro 2025 até atual)
  const carregarDadosMensais = useCallback(async () => {
    if (!selectedBar) return;

    const dadosMensaisTemp: DadosMes[] = [];
    const anoAtual = new Date().getFullYear();
    const mesAtualNum = new Date().getMonth() + 1;

    // Buscar dados de fevereiro 2025 até o mês atual
    for (let ano = 2025; ano <= anoAtual; ano++) {
      const mesInicio = ano === 2025 ? 2 : 1; // Começar em fevereiro para 2025
      const mesFim = ano === anoAtual ? mesAtualNum : 12;

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
      const mes = mesAtual.getMonth() + 1;
      const ano = mesAtual.getFullYear();
      
      if (!selectedBar) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/estrategico/desempenho?mes=${mes}&ano=${ano}`, {
        headers: {
          'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados de desempenho');
      }

      const data = await response.json();
      setDadosSemanas(data.semanas || []);
      setTotaisMensais(data.totais_mensais || null);

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
  }, [mesAtual, selectedBar, activeTab, carregarDadosMensais, toast]);

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesAtual);
    if (direcao === 'anterior') {
      novoMes.setMonth(novoMes.getMonth() - 1);
    } else {
      novoMes.setMonth(novoMes.getMonth() + 1);
    }
    setMesAtual(novoMes);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (performance >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  useEffect(() => {
    setPageTitle('📈 Desempenho');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, mesAtual, carregarDados]);

  // Carregar dados mensais quando mudar para aba mensal
  useEffect(() => {
    if (activeTab === 'mensal' && selectedBar && dadosMensais.length === 0) {
      carregarDadosMensais();
    }
  }, [activeTab, selectedBar, dadosMensais.length, carregarDadosMensais]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de desempenho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              Desempenho Operacional
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análise detalhada dos indicadores de performance
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarMes('anterior')}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium min-w-[140px] text-center">
              {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarMes('proximo')}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        {totaisMensais && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Faturamento Total</p>
                    <p className="text-2xl font-bold">{formatarMoeda(totaisMensais.faturamento_total)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Clientes Atendidos</p>
                    <p className="text-2xl font-bold">{totaisMensais.clientes_total.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatarMoeda(totaisMensais.ticket_medio)}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Performance Geral</p>
                    <p className="text-2xl font-bold">{totaisMensais.performance_media.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="semanal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Visão Semanal
            </TabsTrigger>
            <TabsTrigger value="mensal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Visão Mensal
            </TabsTrigger>
          </TabsList>

          {/* Visão Semanal */}
          <TabsContent value="semanal" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Eventos por Semana - {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-500">
                        <th className="text-left py-3 px-4 font-medium text-blue-100">Semana</th>
                        <th className="text-left py-3 px-4 font-medium text-blue-100">Período</th>
                        <th className="text-right py-3 px-4 font-medium text-blue-100">Faturamento</th>
                        <th className="text-right py-3 px-4 font-medium text-blue-100">Clientes</th>
                        <th className="text-right py-3 px-4 font-medium text-blue-100">Ticket Médio</th>
                        <th className="text-right py-3 px-4 font-medium text-blue-100">Performance</th>
                        <th className="text-right py-3 px-4 font-medium text-blue-100">Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosSemanas.map((semana) => (
                        <tr key={semana.semana} className="border-b border-blue-500/30 hover:bg-blue-500/20">
                          <td className="py-3 px-4 font-medium">Semana {semana.semana}</td>
                          <td className="py-3 px-4 text-blue-100">{semana.periodo}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatarMoeda(semana.faturamento_total)}</td>
                          <td className="py-3 px-4 text-right">{semana.clientes_total}</td>
                          <td className="py-3 px-4 text-right">{formatarMoeda(semana.ticket_medio)}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge className={getPerformanceBadge(semana.performance_geral)}>
                              {semana.performance_geral.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="outline" className="text-blue-100 border-blue-300">
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
            <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Comparativo dos Meses - Fevereiro 2025 até {mesesNomes[new Date().getMonth()]} {new Date().getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-500">
                        <th className="text-left py-3 px-4 font-medium text-purple-100">Mês</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-100">Faturamento</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-100">Clientes</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-100">Ticket Médio</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-100">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosMensais.map((dadoMes) => (
                        <tr key={`${dadoMes.mes}-${dadoMes.ano}`} className="border-b border-purple-500/30 hover:bg-purple-500/20">
                          <td className="py-3 px-4 font-medium">{dadoMes.nome_mes} {dadoMes.ano}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatarMoeda(dadoMes.faturamento_total)}</td>
                          <td className="py-3 px-4 text-right">{dadoMes.clientes_total}</td>
                          <td className="py-3 px-4 text-right">{formatarMoeda(dadoMes.ticket_medio)}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge className={getPerformanceBadge(dadoMes.performance_media)}>
                              {dadoMes.performance_media.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {dadosMensais.length > 0 && (
                        <tr className="border-t-2 border-purple-400 bg-purple-500/30 font-bold">
                          <td className="py-3 px-4">TOTAL GERAL</td>
                          <td className="py-3 px-4 text-right">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + m.faturamento_total, 0))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {dadosMensais.reduce((sum, m) => sum + m.clientes_total, 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + m.ticket_medio, 0) / dadosMensais.length)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge className="bg-white text-purple-700 font-bold">
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