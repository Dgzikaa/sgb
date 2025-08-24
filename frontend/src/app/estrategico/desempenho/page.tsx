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
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCounter, AnimatedCurrency } from '@/components/ui/animated-counter';
import { motion } from 'framer-motion';

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
  const { user } = useUser();
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
    if (!selectedBar || !user) return;

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
              'x-user-data': encodeURIComponent(JSON.stringify(user))
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
  }, [selectedBar, user, mesesNomes]);

  // Carregar dados da API
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!selectedBar || !user) {
        setLoading(false);
        return;
      }

      // Para visualização semanal, não passar parâmetro 'mes'
      const response = await fetch(`/api/estrategico/desempenho?ano=${anoAtual}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
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
  }, [anoAtual, selectedBar, user, activeTab]);

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
    if (selectedBar && user) {
      carregarDados();
    }
  }, [selectedBar, user, anoAtual]);

  // Carregar dados mensais quando mudar para aba mensal
  useEffect(() => {
    if (activeTab === 'mensal' && selectedBar && user && dadosMensais.length === 0) {
      carregarDadosMensais();
    }
  }, [activeTab, selectedBar, user, dadosMensais.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando dados de desempenho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Desempenho Operacional
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
              Análise detalhada dos indicadores de performance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarAno('anterior')}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-sm min-w-[80px] text-center">
              {anoAtual}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarAno('proximo')}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        {totaisAnuais && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-blue-600">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Faturamento Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    <AnimatedCurrency 
                      value={totaisAnuais.faturamento_total}
                      duration={2}
                      className="text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Anual {anoAtual}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500 to-emerald-600">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clientes Atendidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    <AnimatedCounter 
                      value={totaisAnuais.clientes_total}
                      duration={2.2}
                      className="text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Total {anoAtual}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
                <CardHeader className="pb-3 bg-gradient-to-r from-violet-500 to-violet-600">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    <AnimatedCurrency 
                      value={totaisAnuais.ticket_medio}
                      duration={2.4}
                      className="text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                    Por cliente
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
                <CardHeader className="pb-3 bg-gradient-to-r from-orange-500 to-orange-600">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    <AnimatedCounter 
                      value={totaisAnuais.performance_media}
                      duration={2.6}
                      className="text-gray-900 dark:text-white"
                      suffix="%"
                      decimals={1}
                    />
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Média {anoAtual}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded-xl shadow-sm">
            <TabsTrigger 
              value="semanal" 
              className="px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 !rounded-xl"
            >
              <Activity className="h-4 w-4 mr-2" />
              Visão Semanal
            </TabsTrigger>
            <TabsTrigger 
              value="mensal" 
              className="px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 !rounded-xl"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Visão Mensal
            </TabsTrigger>
          </TabsList>

          {/* Visão Semanal */}
          <TabsContent value="semanal" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Eventos por Semana - {anoAtual}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Semana</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Período</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Faturamento</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Clientes</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Ticket Médio</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Performance</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosSemanas.map((semana, index) => (
                        <tr key={semana.semana} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">Semana {semana.semana}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium text-sm">{semana.periodo}</td>
                          <td className="py-3 px-4 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${semana.faturamento_total >= 263000 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.faturamento_total)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                / {formatarMoeda(263000)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{semana.clientes_total.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{formatarMoeda(semana.ticket_medio)}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge className={`${getPerformanceBadge(semana.performance_geral)} font-bold px-2 py-1 border text-xs`}>
                              {semana.performance_geral.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-xs">
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
            </motion.div>
          </TabsContent>

          {/* Visão Mensal */}
          <TabsContent value="mensal" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  Comparativo dos Meses - Fevereiro 2025 até {mesesNomes[new Date().getMonth()]} {new Date().getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Mês</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Faturamento</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Clientes</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Ticket Médio</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosMensais.map((dadoMes, index) => (
                        <tr key={`${dadoMes.mes}-${dadoMes.ano}`} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-900/20 dark:hover:to-purple-900/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">{dadoMes.nome_mes} {dadoMes.ano}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white text-sm">{formatarMoeda(dadoMes.faturamento_total)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{dadoMes.clientes_total.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{formatarMoeda(dadoMes.ticket_medio)}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge className={`${getPerformanceBadge(dadoMes.performance_media)} font-bold px-2 py-1 border text-xs`}>
                              {dadoMes.performance_media.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {dadosMensais.length > 0 && (
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">TOTAL GERAL</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + m.faturamento_total, 0))}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {dadosMensais.reduce((sum, m) => sum + m.clientes_total, 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + m.ticket_medio, 0) / dadosMensais.length)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold px-2 py-1 text-xs border-0">
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
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}