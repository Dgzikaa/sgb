'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Activity,
  Edit,
  Save
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
  faturamento_couvert: number;
  faturamento_bar: number;
  ticket_medio_contahub: number;
  tm_entrada: number;
  tm_bar: number;
  cmv_limpo_percentual: number;
  cmo_percentual: number;
  atracao_percentual: number;
  clientes_atendidos: number;
  clientes_ativos: number;
  reservas_totais: number;
  reservas_presentes: number;
  // Metas para cada indicador
  meta_faturamento_total: number;
  meta_faturamento_couvert: number;
  meta_faturamento_bar: number;
  meta_ticket_medio_contahub: number;
  meta_tm_entrada: number;
  meta_tm_bar: number;
  meta_cmv_limpo_percentual: number;
  meta_cmo_percentual: number;
  meta_atracao_percentual: number;
  meta_clientes_atendidos: number;
  meta_clientes_ativos: number;
  meta_reservas_totais: number;
  meta_reservas_presentes: number;
  // Campos antigos mantidos para compatibilidade
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
  faturamento_couvert: number;
  faturamento_bar: number;
  clientes_total: number;
  clientes_atendidos: number;
  clientes_ativos: number;
  ticket_medio: number;
  ticket_medio_contahub: number;
  tm_entrada: number;
  tm_bar: number;
  cmv_limpo_percentual: number;
  cmo_valor: number;
  cmo_percentual: number;
  atracao_faturamento: number;
  atracao_percentual: number;
  reservas_totais: number;
  reservas_presentes: number;
  performance_media: number;
}



export default function DesempenhoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('semanal');
  const [loading, setLoading] = useState(true);
  const [loadingMensal, setLoadingMensal] = useState(false);
  const [anoAtual, setAnoAtual] = useState(() => new Date().getFullYear());
  const [dadosSemanas, setDadosSemanas] = useState<DadosSemana[]>([]);
  const [totaisAnuais, setTotaisAnuais] = useState<TotaisMensais | null>(null);
  const [dadosMensais, setDadosMensais] = useState<DadosMes[]>([]);
  
  // Estados para modal de edição
  const [modalAberto, setModalAberto] = useState(false);
  const [semanaEditando, setSemanaEditando] = useState<DadosSemana | null>(null);
  const [valoresEditados, setValoresEditados] = useState<Partial<DadosSemana>>({});

  const mesesNomes = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);



  // Carregar dados mensais consolidados (fevereiro 2025 até atual)
  const carregarDadosMensais = useCallback(async () => {
    if (!selectedBar || !user) return;

    setLoadingMensal(true);
    
    try {
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

      // Ordenar por ano e mês decrescente (mais recente primeiro)
      dadosMensaisTemp.sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano;
        return b.mes - a.mes;
      });
      
      setDadosMensais(dadosMensaisTemp);
    } catch (error) {
      console.error('Erro ao carregar dados mensais:', error);
      toast({
        title: "Erro ao carregar dados mensais",
        description: "Não foi possível carregar os dados mensais",
        variant: "destructive"
      });
    } finally {
      setLoadingMensal(false);
    }
  }, [selectedBar, user, mesesNomes, toast]);

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
  }, [anoAtual, selectedBar, user, toast]);

  const navegarAno = (direcao: 'anterior' | 'proximo') => {
    // Limpar dados mensais ao mudar de ano
    setDadosMensais([]);
    
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

  // Função para abrir modal de edição
  const abrirModalEdicao = useCallback((semana: DadosSemana) => {
    setSemanaEditando(semana);
    setValoresEditados({
      cmv_limpo_percentual: semana.cmv_limpo_percentual,
      meta_faturamento_total: semana.meta_faturamento_total,
      meta_faturamento_couvert: semana.meta_faturamento_couvert,
      meta_faturamento_bar: semana.meta_faturamento_bar,
      meta_ticket_medio_contahub: semana.meta_ticket_medio_contahub,
      meta_tm_entrada: semana.meta_tm_entrada,
      meta_tm_bar: semana.meta_tm_bar,
      meta_cmv_limpo_percentual: semana.meta_cmv_limpo_percentual,
      meta_cmo_percentual: semana.meta_cmo_percentual,
      meta_atracao_percentual: semana.meta_atracao_percentual,
      meta_clientes_atendidos: semana.meta_clientes_atendidos,
      meta_clientes_ativos: semana.meta_clientes_ativos,
      meta_reservas_totais: semana.meta_reservas_totais,
      meta_reservas_presentes: semana.meta_reservas_presentes
    });
    setModalAberto(true);
  }, []);

  // Função para salvar valores editados
  const salvarValoresEditados = useCallback(async () => {
    if (!semanaEditando) return;

    try {
      // Atualizar localmente primeiro
      setDadosSemanas(prev => prev.map(s => 
        s.semana === semanaEditando.semana 
          ? { ...s, ...valoresEditados }
          : s
      ));

      toast({
        title: "Valores atualizados",
        description: `Valores da semana ${semanaEditando.semana} foram atualizados com sucesso.`,
      });

      setModalAberto(false);
      setSemanaEditando(null);
      setValoresEditados({});
    } catch (error) {
      console.error('Erro ao salvar valores:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar os valores. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [semanaEditando, valoresEditados, toast]);

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

  // Carregar dados mensais quando mudar para aba mensal ou ano
  useEffect(() => {
    if (activeTab === 'mensal' && selectedBar && user && dadosMensais.length === 0) {
      carregarDadosMensais();
    }
  }, [activeTab, selectedBar, user, anoAtual, dadosMensais.length, carregarDadosMensais]);



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
      <div className="w-full px-4 py-6">

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
                  <table className="w-full min-w-[1600px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Semana</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Fat. Total</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Fat. Couvert</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Fat. Bar</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Ticket Médio</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">TM Entrada</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">TM Bar</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">CMV %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">CMO %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">Atração %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Cli. Atendidos</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Cli. Ativos</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Reservas</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosSemanas.map((semana, index) => (
                        <tr key={semana.semana} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:scale-[1.02] transition-all duration-300 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">{semana.semana}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{semana.periodo}</span>
                              </div>
                            </div>
                          </td>
                          
                          {/* Faturamento Total */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.faturamento_total || 0) >= (semana.meta_faturamento_total || 263000) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.faturamento_total || 0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap whitespace-nowrap">
                                Meta: {formatarMoeda(semana.meta_faturamento_total || 263000)}
                              </span>
                            </div>
                          </td>
                          
                          {/* Faturamento Couvert */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.faturamento_couvert || 0) >= (semana.meta_faturamento_couvert || 38000) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.faturamento_couvert || 0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {formatarMoeda(semana.meta_faturamento_couvert || 38000)}
                              </span>
                            </div>
                          </td>
                          
                          {/* Faturamento Bar */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.faturamento_bar || 0) >= (semana.meta_faturamento_bar || 225000) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.faturamento_bar || 0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {formatarMoeda(semana.meta_faturamento_bar || 225000)}
                              </span>
                            </div>
                          </td>
                          
                          {/* Ticket Médio */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.ticket_medio_contahub || 0) >= (semana.meta_ticket_medio_contahub || 103) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.ticket_medio_contahub || 0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {formatarMoeda(semana.meta_ticket_medio_contahub || 103)}
                              </span>
                            </div>
                          </td>
                          
                          {/* TM Entrada */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.tm_entrada || 0) >= (semana.meta_tm_entrada || 15.5) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.tm_entrada || 0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {formatarMoeda(semana.meta_tm_entrada || 15.5)}
                              </span>
                            </div>
                          </td>
                          
                          {/* TM Bar */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.tm_bar || 0) >= (semana.meta_tm_bar || 77.5) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatarMoeda(semana.tm_bar || 0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {formatarMoeda(semana.meta_tm_bar || 77.5)}
                              </span>
                            </div>
                          </td>
                          
                          {/* CMV % */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <Badge className={`font-bold px-2 py-1 text-xs ${(semana.cmv_limpo_percentual || 0) <= (semana.meta_cmv_limpo_percentual || 33) ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                {(semana.cmv_limpo_percentual || 0).toFixed(1)}%
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {(semana.meta_cmv_limpo_percentual || 33).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          
                          {/* CMO % */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <Badge className={`font-bold px-2 py-1 text-xs ${(semana.cmo_percentual || 0) <= (semana.meta_cmo_percentual || 20) ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                {(semana.cmo_percentual || 0).toFixed(1)}%
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {(semana.meta_cmo_percentual || 20).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          
                          {/* Atração % */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <Badge className={`font-bold px-2 py-1 text-xs ${(semana.atracao_percentual || 0) <= (semana.meta_atracao_percentual || 17) ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                {(semana.atracao_percentual || 0).toFixed(1)}%
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {(semana.meta_atracao_percentual || 17).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          
                          {/* Clientes Atendidos */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.clientes_atendidos || 0) >= (semana.meta_clientes_atendidos || 2645) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {(semana.clientes_atendidos || 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {(semana.meta_clientes_atendidos || 2645).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          
                          {/* Clientes Ativos */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold ${(semana.clientes_ativos || 0) >= (semana.meta_clientes_ativos || 3000) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {(semana.clientes_ativos || 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {(semana.meta_clientes_ativos || 3000).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          
                          {/* Reservas */}
                          <td className="py-3 px-3 text-right font-bold text-sm">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-bold ${(semana.reservas_presentes || 0) >= (semana.meta_reservas_presentes || 650) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {(semana.reservas_presentes || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">/</span>
                                <span className={`text-sm font-bold ${(semana.reservas_totais || 0) >= (semana.meta_reservas_totais || 800) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {(semana.reservas_totais || 0).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                                Meta: {(semana.meta_reservas_presentes || 650).toLocaleString()}/{(semana.meta_reservas_totais || 800).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          
                          {/* Ações */}
                          <td className="py-3 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirModalEdicao(semana)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="h-4 w-4 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" />
                            </Button>
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
                  <table className="w-full min-w-[1600px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Mês</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Fat. Total</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Fat. Couvert</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Fat. Bar</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Ticket Médio</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">TM Entrada</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">TM Bar</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">CMV %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">CMO %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[80px]">Atração %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Cli. Atendidos</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Cli. Ativos</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm min-w-[120px]">Reservas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMensal ? (
                        <tr>
                          <td colSpan={13} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCcw className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400 mb-4" />
                              <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando dados mensais...</p>
                            </div>
                          </td>
                        </tr>
                      ) : dadosMensais.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-600 mb-4" />
                              <p className="text-gray-600 dark:text-gray-400 font-medium">Nenhum dado mensal encontrado</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dadosMensais.map((dadoMes, index) => (
                          <tr key={`${dadoMes.mes}-${dadoMes.ano}`} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-900/20 dark:hover:to-purple-900/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">{dadoMes.nome_mes} {dadoMes.ano}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white text-sm">{formatarMoeda(dadoMes.faturamento_total || 0)}</td>
                            <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white text-sm">{formatarMoeda(dadoMes.faturamento_couvert || 0)}</td>
                            <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white text-sm">{formatarMoeda(dadoMes.faturamento_bar || 0)}</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{formatarMoeda(dadoMes.ticket_medio_contahub || 0)}</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{formatarMoeda(dadoMes.tm_entrada || 0)}</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{formatarMoeda(dadoMes.tm_bar || 0)}</td>
                            <td className="py-3 px-3 text-right">
                              <Badge className={`font-bold px-2 py-1 text-xs ${(dadoMes.cmv_limpo_percentual || 0) <= 33 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                {(dadoMes.cmv_limpo_percentual || 0).toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Badge className={`font-bold px-2 py-1 text-xs ${(dadoMes.cmo_percentual || 0) <= 20 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                {(dadoMes.cmo_percentual || 0).toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Badge className={`font-bold px-2 py-1 text-xs ${(dadoMes.atracao_percentual || 0) <= 17 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                {(dadoMes.atracao_percentual || 0).toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{(dadoMes.clientes_atendidos || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">{(dadoMes.clientes_ativos || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                              {(dadoMes.reservas_presentes || 0).toLocaleString()}/{(dadoMes.reservas_totais || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                      {dadosMensais.length > 0 && !loadingMensal && (
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">TOTAL GERAL</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + (m.faturamento_total || 0), 0))}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + (m.faturamento_couvert || 0), 0))}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda(dadosMensais.reduce((sum, m) => sum + (m.faturamento_bar || 0), 0))}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda((dadosMensais.reduce((sum, m) => sum + (m.ticket_medio_contahub || 0), 0)) / dadosMensais.length)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda((dadosMensais.reduce((sum, m) => sum + (m.tm_entrada || 0), 0)) / dadosMensais.length)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda((dadosMensais.reduce((sum, m) => sum + (m.tm_bar || 0), 0)) / dadosMensais.length)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold px-2 py-1 text-xs border-0">
                              {((dadosMensais.reduce((sum, m) => sum + (m.cmv_limpo_percentual || 0), 0)) / dadosMensais.length).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold px-2 py-1 text-xs border-0">
                              {((dadosMensais.reduce((sum, m) => sum + (m.cmo_percentual || 0), 0)) / dadosMensais.length).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold px-2 py-1 text-xs border-0">
                              {((dadosMensais.reduce((sum, m) => sum + (m.atracao_percentual || 0), 0)) / dadosMensais.length).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {dadosMensais.reduce((sum, m) => sum + (m.clientes_atendidos || 0), 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {dadosMensais.reduce((sum, m) => sum + (m.clientes_ativos || 0), 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-gray-900 dark:text-white">
                            {dadosMensais.reduce((sum, m) => sum + (m.reservas_presentes || 0), 0).toLocaleString()}/{dadosMensais.reduce((sum, m) => sum + (m.reservas_totais || 0), 0).toLocaleString()}
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

        {/* Modal de Edição */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Editar Valores - {semanaEditando?.semana}
              </DialogTitle>
            </DialogHeader>
            
            {semanaEditando && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* CMV % */}
                <div className="space-y-2">
                  <Label htmlFor="cmv">CMV % (Realizado)</Label>
                  <Input
                    id="cmv"
                    type="number"
                    step="0.1"
                    value={valoresEditados.cmv_limpo_percentual || 0}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      cmv_limpo_percentual: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full"
                  />
                </div>

                {/* Metas */}
                <div className="space-y-2">
                  <Label htmlFor="meta_faturamento_total">Meta Faturamento Total</Label>
                  <Input
                    id="meta_faturamento_total"
                    type="number"
                    step="1000"
                    value={valoresEditados.meta_faturamento_total || 263000}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_faturamento_total: parseFloat(e.target.value) || 263000
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_faturamento_couvert">Meta Faturamento Couvert</Label>
                  <Input
                    id="meta_faturamento_couvert"
                    type="number"
                    step="1000"
                    value={valoresEditados.meta_faturamento_couvert || 38000}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_faturamento_couvert: parseFloat(e.target.value) || 38000
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_faturamento_bar">Meta Faturamento Bar</Label>
                  <Input
                    id="meta_faturamento_bar"
                    type="number"
                    step="1000"
                    value={valoresEditados.meta_faturamento_bar || 225000}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_faturamento_bar: parseFloat(e.target.value) || 225000
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_cmv">Meta CMV %</Label>
                  <Input
                    id="meta_cmv"
                    type="number"
                    step="0.1"
                    value={valoresEditados.meta_cmv_limpo_percentual || 33}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_cmv_limpo_percentual: parseFloat(e.target.value) || 33
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_cmo">Meta CMO %</Label>
                  <Input
                    id="meta_cmo"
                    type="number"
                    step="0.1"
                    value={valoresEditados.meta_cmo_percentual || 20}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_cmo_percentual: parseFloat(e.target.value) || 20
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_atracao">Meta Atração %</Label>
                  <Input
                    id="meta_atracao"
                    type="number"
                    step="0.1"
                    value={valoresEditados.meta_atracao_percentual || 17}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_atracao_percentual: parseFloat(e.target.value) || 17
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_clientes_atendidos">Meta Clientes Atendidos</Label>
                  <Input
                    id="meta_clientes_atendidos"
                    type="number"
                    value={valoresEditados.meta_clientes_atendidos || 2645}
                    onChange={(e) => setValoresEditados(prev => ({
                      ...prev,
                      meta_clientes_atendidos: parseInt(e.target.value) || 2645
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarValoresEditados}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}