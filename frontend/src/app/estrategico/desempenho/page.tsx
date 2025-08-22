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
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return 'bg-green-100 text-green-800';
    if (performance >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de desempenho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
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
              onClick={() => navegarAno('anterior')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium min-w-[100px] text-center">
              {anoAtual}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarAno('proximo')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        {totaisAnuais && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Faturamento Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatarMoeda(totaisAnuais.faturamento_total)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes Atendidos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totaisAnuais.clientes_total.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatarMoeda(totaisAnuais.ticket_medio)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance Geral</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totaisAnuais.performance_media.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="semanal">Visão Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Visão Mensal</TabsTrigger>
          </TabsList>

          {/* Visão Semanal */}
          <TabsContent value="semanal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Semana - {anoAtual}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Semana</th>
                        <th className="text-left py-3 px-4 font-medium">Período</th>
                        <th className="text-right py-3 px-4 font-medium">Faturamento</th>
                        <th className="text-right py-3 px-4 font-medium">Clientes</th>
                        <th className="text-right py-3 px-4 font-medium">Ticket Médio</th>
                        <th className="text-right py-3 px-4 font-medium">Performance</th>
                        <th className="text-right py-3 px-4 font-medium">Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosSemanas.map((semana) => (
                        <tr key={semana.semana} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 font-medium">Semana {semana.semana}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{semana.periodo}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatarMoeda(semana.faturamento_total)}</td>
                          <td className="py-3 px-4 text-right">{semana.clientes_total}</td>
                          <td className="py-3 px-4 text-right">{formatarMoeda(semana.ticket_medio)}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge className={getPerformanceBadge(semana.performance_geral)}>
                              {semana.performance_geral.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="outline">
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
            <Card>
              <CardHeader>
                <CardTitle>Comparativo dos Meses - Fevereiro 2025 até {mesesNomes[new Date().getMonth()]} {new Date().getFullYear()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Mês</th>
                        <th className="text-right py-3 px-4 font-medium">Faturamento</th>
                        <th className="text-right py-3 px-4 font-medium">Clientes</th>
                        <th className="text-right py-3 px-4 font-medium">Ticket Médio</th>
                        <th className="text-right py-3 px-4 font-medium">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosMensais.map((dadoMes) => (
                        <tr key={`${dadoMes.mes}-${dadoMes.ano}`} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
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
                        <tr className="border-t-2 bg-gray-50 dark:bg-gray-800 font-bold">
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
                            <Badge className="bg-blue-100 text-blue-800 font-bold">
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