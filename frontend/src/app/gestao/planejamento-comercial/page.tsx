'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Download, 
  Filter, 
  RefreshCcw, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Target,
  Activity,
  ChevronRight
} from 'lucide-react';

interface PlanejamentoData {
  data: string;
  dia: string;
  obsData: string;
  label: string;
  realizado: number;
  m1: number;
  clientes: {
    planejado: number;
    real: number;
    resTotal: number;
    resPresente: number;
    lotMax: number;
  };
  ticketEntrada: {
    planejado: number;
    real: number;
  };
  ticketBar: {
    planejado: number;
    real: number;
  };
  ticketMedio: number;
  rentabilidadeAtracoes: {
    custoArtistico: number;
    custoProducao: number;
    percArtFat: string;
  };
  cesta: {
    percBebidas: string;
    percDrinks: string;
    percCozinha: string;
  };
  tempo: {
    cozinha: number;
    bar: number;
  };
  faturamentoAte19h: string;
}

interface ApiResponse {
  success: boolean;
  data: PlanejamentoData[];
  totais: any;
  periodo: string;
}

export default function PlanejamentoComercialPage() {
  const [dados, setDados] = useState<PlanejamentoData[]>([]);
  const [totais, setTotais] = useState<any>(null);
  const [periodo, setPeriodo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumo');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gestao/planejamento-comercial');
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setDados(result.data);
        setTotais(result.totais);
        setPeriodo(result.periodo);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };

  const calcularPercentual = (realizado: number, meta: number) => {
    if (meta === 0) return 0;
    return ((realizado / meta) * 100);
  };

  const getPerformanceColor = (percentual: number) => {
    if (percentual >= 100) return 'text-green-600 dark:text-green-400';
    if (percentual >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceIcon = (percentual: number) => {
    if (percentual >= 100) return TrendingUp;
    if (percentual >= 80) return Activity;
    return TrendingDown;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-xl shadow-sm"></div>
              ))}
            </div>
            <div className="h-96 bg-white dark:bg-gray-800 rounded-xl shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        
        {/* Header Elegante */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl w-fit">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Planejamento Comercial
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Análise detalhada de eventos, indicadores e performance comercial - {periodo}
              </p>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Filtrar Período
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={carregarDados}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          
          {/* Sidebar com Métricas */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Performance Geral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                
                {/* Faturamento Total */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Faturamento
                      </span>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                    {totais ? formatarMoeda(totais.realizado) : '-'}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Meta: {totais ? formatarMoeda(totais.m1) : '-'}
                  </div>
                  {totais && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1">
                        {React.createElement(getPerformanceIcon(calcularPercentual(totais.realizado, totais.m1)), {
                          className: `w-4 h-4 ${getPerformanceColor(calcularPercentual(totais.realizado, totais.m1))}`
                        })}
                        <span className={`text-sm font-medium ${getPerformanceColor(calcularPercentual(totais.realizado, totais.m1))}`}>
                          {calcularPercentual(totais.realizado, totais.m1).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(calcularPercentual(totais.realizado, totais.m1), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clientes */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Clientes
                      </span>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {totais ? formatarNumero(totais.clientes.real) : '-'}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Planejado: {totais ? formatarNumero(totais.clientes.planejado) : '-'}
                  </div>
                </div>

                {/* Ticket Médio */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Ticket Médio
                      </span>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {totais ? formatarMoeda(totais.ticketMedio) : '-'}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Média do período
                  </div>
                </div>

                {/* Botões de Ação Rápida */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm"
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Relatório Detalhado
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    size="sm"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Definir Metas
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                    Dados Detalhados por Evento
                  </CardTitle>
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                    {dados.length} eventos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-6">
                    <TabsTrigger value="resumo" className="text-xs sm:text-sm">
                      Resumo
                    </TabsTrigger>
                    <TabsTrigger value="detalhado" className="text-xs sm:text-sm">
                      Detalhado
                    </TabsTrigger>
                    <TabsTrigger value="analises" className="text-xs sm:text-sm hidden lg:block">
                      Análises
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumo" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dados.filter(item => item.realizado > 0).map((item, index) => (
                        <Card key={index} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                  {item.data} - {item.dia}
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {item.obsData}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Faturamento</p>
                                <p className="font-bold text-green-600 dark:text-green-400">
                                  {formatarMoeda(item.realizado)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Clientes</p>
                                <p className="font-bold text-blue-600 dark:text-blue-400">
                                  {formatarNumero(item.clientes.real)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Ticket Médio</p>
                                <p className="font-bold text-purple-600 dark:text-purple-400">
                                  {formatarMoeda(item.ticketMedio)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Performance</p>
                                <div className="flex items-center gap-1">
                                  {React.createElement(getPerformanceIcon(calcularPercentual(item.realizado, item.m1)), {
                                    className: `w-3 h-3 ${getPerformanceColor(calcularPercentual(item.realizado, item.m1))}`
                                  })}
                                  <span className={`text-xs font-bold ${getPerformanceColor(calcularPercentual(item.realizado, item.m1))}`}>
                                    {calcularPercentual(item.realizado, item.m1).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="detalhado" className="space-y-4">
                    {/* Tabela Detalhada Original */}
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="min-w-[1800px]">
                        {/* Header da Tabela */}
                        <div className="grid grid-cols-[80px_80px_200px_100px_100px_300px_150px_150px_80px_200px_150px_100px_100px] gap-1 bg-gray-50 dark:bg-gray-700 p-3 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <div className="text-center">Data</div>
                          <div className="text-center">Dia</div>
                          <div className="text-center">Evento</div>
                          <div className="text-center">Realizado</div>
                          <div className="text-center">M1</div>
                          <div className="text-center">Clientes</div>
                          <div className="text-center">Ticket Entrada</div>
                          <div className="text-center">Ticket Bar</div>
                          <div className="text-center">TM</div>
                          <div className="text-center">Rentabilidade</div>
                          <div className="text-center">Cesta</div>
                          <div className="text-center">Tempo</div>
                          <div className="text-center">Até 19h</div>
                        </div>

                        {/* Dados da Tabela */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {dados.map((item, index) => (
                            <div
                              key={index}
                              className={`grid grid-cols-[80px_80px_200px_100px_100px_300px_150px_150px_80px_200px_150px_100px_100px] gap-1 py-3 px-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                item.realizado === 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                              }`}
                            >
                              {/* Mantém toda a estrutura da tabela original aqui */}
                              {/* Data */}
                              <div className="text-center font-medium text-gray-900 dark:text-white">
                                {item.data}
                              </div>

                              {/* Dia */}
                              <div className="text-center text-gray-700 dark:text-gray-300">
                                {item.dia}
                              </div>

                              {/* Evento */}
                              <div className="text-gray-900 dark:text-white px-2">
                                {item.obsData || '-'}
                              </div>

                              {/* Realizado */}
                              <div className="text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.realizado > 0 ? formatarMoeda(item.realizado) : '-'}
                                </div>
                              </div>

                              {/* M1 */}
                              <div className="text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.m1 > 0 ? formatarMoeda(item.m1) : '-'}
                                </div>
                              </div>

                              {/* Clientes */}
                              <div className="space-y-1 px-2">
                                <div className="grid grid-cols-5 gap-1 text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Plan</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Real</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Tot</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Pre</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Máx</div>
                                </div>
                                <div className="grid grid-cols-5 gap-1 text-center">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.clientes.planejado || '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.clientes.real || '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.clientes.resTotal || '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.clientes.resPresente || '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.clientes.lotMax || '-'}
                                  </div>
                                </div>
                              </div>

                              {/* Ticket Entrada */}
                              <div className="space-y-1 px-2">
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Plan</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Real</div>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.ticketEntrada.planejado > 0 ? formatarMoeda(item.ticketEntrada.planejado) : '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.ticketEntrada.real > 0 ? formatarMoeda(item.ticketEntrada.real) : '-'}
                                  </div>
                                </div>
                              </div>

                              {/* Ticket Bar */}
                              <div className="space-y-1 px-2">
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Plan</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Real</div>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.ticketBar.planejado > 0 ? formatarMoeda(item.ticketBar.planejado) : '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.ticketBar.real > 0 ? formatarMoeda(item.ticketBar.real) : '-'}
                                  </div>
                                </div>
                              </div>

                              {/* TM (Ticket Médio) */}
                              <div className="text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.ticketMedio > 0 ? formatarMoeda(item.ticketMedio) : '-'}
                                </div>
                              </div>

                              {/* Rentabilidade Atrações */}
                              <div className="space-y-1 px-2">
                                <div className="grid grid-cols-3 gap-1 text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Art</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Prod</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">%</div>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.rentabilidadeAtracoes.custoArtistico > 0 ? 
                                      formatarMoeda(item.rentabilidadeAtracoes.custoArtistico) : '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.rentabilidadeAtracoes.custoProducao > 0 ? 
                                      formatarMoeda(item.rentabilidadeAtracoes.custoProducao) : '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.rentabilidadeAtracoes.percArtFat}
                                  </div>
                                </div>
                              </div>

                              {/* Cesta */}
                              <div className="space-y-1 px-2">
                                <div className="grid grid-cols-3 gap-1 text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-500">%B</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">%D</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">%C</div>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.cesta.percBebidas}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.cesta.percDrinks}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.cesta.percCozinha}
                                  </div>
                                </div>
                              </div>

                              {/* Tempo */}
                              <div className="space-y-1 px-2">
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Coz</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">Bar</div>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.tempo.cozinha || '-'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {item.tempo.bar || '-'}
                                  </div>
                                </div>
                              </div>

                              {/* Até 19h */}
                              <div className="text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.faturamentoAte19h}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analises" className="space-y-4">
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Análises Avançadas
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Gráficos e análises estatísticas em desenvolvimento
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

              </CardContent>
            </Card>

            {/* Resumo Final */}
            {totais && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mt-6">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Resumo do Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Realizado</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatarMoeda(totais.realizado)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Meta</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatarMoeda(totais.m1)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Clientes Real</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatarNumero(totais.clientes.real)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Planejado</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatarNumero(totais.clientes.planejado)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Custo Artístico</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatarMoeda(totais.rentabilidadeAtracoes.custoArtistico)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Custo Produção</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatarMoeda(totais.rentabilidadeAtracoes.custoProducao)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 