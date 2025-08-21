"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Activity,
  Target,
  Zap,
  Users,
  Building2,
  ShoppingCart,
  Wrench,
  Home,
  FileText
} from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

interface Categoria {
  nome: string;
  entradas: number;
  saidas: number;
}

interface MacroCategoria {
  nome: string;
  tipo: string;
  total_entradas: number;
  total_saidas: number;
  categorias: Categoria[];
}

interface DreApiResponse {
  macroCategorias: MacroCategoria[];
  entradasTotais: number;
  saidasTotais: number;
  saldo: number;
  ebitda: number;
  periodo: { month: number; year: number };
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getCurrentMonthYear = () => {
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

const getMacroIcon = (nome: string) => {
  const iconMap: { [key: string]: any } = {
    "Receita": TrendingUp,
    "Custos Variáveis": TrendingDown,
    "Custo insumos (CMV)": ShoppingCart,
    "Mão-de-Obra": Users,
    "Despesas Comerciais": Building2,
    "Despesas Administrativas": Wrench,
    "Despesas Operacionais": Activity,
    "Despesas de Ocupação (Contas)": Home,
    "Não Operacionais": FileText,
    "Investimentos": Zap,
    "Sócios": Users,
  };
  return iconMap[nome] || BarChart3;
};

const getMacroColor = (nome: string) => {
  const colorMap: { [key: string]: string } = {
    "Receita": "from-green-500 to-green-600",
    "Custos Variáveis": "from-red-500 to-red-600",
    "Custo insumos (CMV)": "from-orange-500 to-orange-600",
    "Mão-de-Obra": "from-blue-500 to-blue-600",
    "Despesas Comerciais": "from-purple-500 to-purple-600",
    "Despesas Administrativas": "from-indigo-500 to-indigo-600",
    "Despesas Operacionais": "from-pink-500 to-pink-600",
    "Despesas de Ocupação (Contas)": "from-gray-500 to-gray-600",
    "Não Operacionais": "from-yellow-500 to-yellow-600",
    "Investimentos": "from-cyan-500 to-cyan-600",
    "Sócios": "from-violet-500 to-violet-600",
  };
  return colorMap[nome] || "from-gray-500 to-gray-600";
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

export default function DrePage() {
  const [data, setData] = useState<DreApiResponse | null>(null);
  const [yearlyData, setYearlyData] = useState<DreApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingYearly, setLoadingYearly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedMacros, setCollapsedMacros] = useState<Set<string>>(new Set(['Receita', 'Custos Variáveis', 'Custo insumos (CMV)', 'Mão-de-Obra', 'Despesas Comerciais', 'Despesas Administrativas', 'Despesas Operacionais', 'Despesas de Ocupação (Contas)', 'Não Operacionais', 'Investimentos', 'Sócios']));
  const [month, setMonth] = useState(() => {
    const currentMonth = new Date().getMonth() + 1;
    console.log('Mês inicial:', currentMonth);
    return currentMonth;
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [historicalData, setHistoricalData] = useState<Array<{
    month: number;
    year: number;
    monthName: string;
    receitas: number;
    custos: number;
    ebitda: number;
  }>>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [consolidatedData, setConsolidatedData] = useState<Array<{
    month: number;
    year: number;
    monthName: string;
    macroCategorias: MacroCategoria[];
    ebitda: number;
  }>>([]);
  const [loadingConsolidated, setLoadingConsolidated] = useState(true);


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar a API monthly detailed que filtra por mês e ano específicos
      const response = await fetch(`/api/financeiro/nibo/dre-monthly-detailed?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }
      const result = await response.json();
      
      // Usar os dados completos da API detailed
      setData({
        macroCategorias: result.macroCategorias || [],
        entradasTotais: result.entradasTotais,
        saidasTotais: result.saidasTotais,
        saldo: result.saldo,
        ebitda: result.ebitda,
        periodo: { month, year }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const fetchYearlyData = useCallback(async () => {
    setLoadingYearly(true);
    setError(null);
    
    try {
      // Usar a API yearly detailed que pega dados do ano inteiro
      const response = await fetch(`/api/financeiro/nibo/dre-yearly-detailed?year=${year}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados anuais');
      }
      const result = await response.json();
      
      // Usar os dados completos da API yearly detailed
      setYearlyData({
        macroCategorias: result.macroCategorias || [],
        entradasTotais: result.entradasTotais,
        saidasTotais: result.saidasTotais,
        saldo: result.saldo,
        ebitda: result.ebitda,
        periodo: { month: 0, year } // 0 indica dados anuais
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoadingYearly(false);
    }
  }, [year]);



  useEffect(() => {
    fetchData();
  }, [fetchData, month, year]);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData, year]);



  useEffect(() => {
    fetchHistoricalData();
  }, []);

  useEffect(() => {
    fetchConsolidatedData();
  }, []);

  async function fetchHistoricalData() {
    setLoadingHistorical(true);
    try {
      // Usar a API monthly para evolução temporal real
      const response = await fetch(`/api/financeiro/nibo/dre-monthly-2025`);
      if (response.ok) {
        const result = await response.json();
        
        // Usar os dados mensais reais para o gráfico
        const historicalDataArray = result.monthlyData || [];
        
        setHistoricalData(historicalDataArray);
        console.log('📊 Dados mensais carregados:', historicalDataArray.length, 'meses');
      }
    } catch (err) {
      console.error('Erro ao buscar dados históricos:', err);
    } finally {
      setLoadingHistorical(false);
    }
  }

  async function fetchConsolidatedData() {
    setLoadingConsolidated(true);
    try {
      // Usar a API yearly detailed
      const response = await fetch(`/api/financeiro/nibo/dre-yearly-detailed?year=2025`);
      if (response.ok) {
        const result = await response.json();
        
        // Criar um array com os dados de 2025 para a tabela consolidada
        const consolidatedDataArray = [{
          month: 1,
          year: 2025,
          monthName: 'Janeiro',
          macroCategorias: result.macroCategorias || [], // Agora temos macro-categorias detalhadas
          ebitda: Number(result.ebitda) || 0
        }];
        
        setConsolidatedData(consolidatedDataArray);
      }
    } catch (err) {
      console.error('Erro ao buscar dados consolidados:', err);
    } finally {
      setLoadingConsolidated(false);
    }
  }

  const handleExpand = (macroNome: string) => {
    // Implementar modal ou navegação para detalhes
    console.log('Expandir:', macroNome);
  };

  const toggleMacroCollapse = (macroNome: string) => {
    setCollapsedMacros(prev => {
      const newSet = new Set(prev);
      if (newSet.has(macroNome)) {
        newSet.delete(macroNome);
      } else {
        newSet.add(macroNome);
      }
      return newSet;
    });
  };

  // Função helper para buscar valor de macro-categoria nos dados consolidados
  const getConsolidatedValue = (macroNome: string, monthIndex: number) => {
    if (!consolidatedData[monthIndex] || !consolidatedData[monthIndex].macroCategorias) {
      return 0;
    }
    
    const macro = consolidatedData[monthIndex].macroCategorias.find(m => m.nome === macroNome);
    if (!macro) {
      return 0;
    }
    
    // Para Receita, retorna total_entradas, para outros retorna total_saidas
    return macro.nome === "Receita" ? macro.total_entradas : macro.total_saidas;
  };

  // Dados para o gráfico de pizza (usando dados anuais)
  const pieChartData = (yearlyData ? {
    labels: yearlyData.macroCategorias
      .filter(macro => macro.nome !== "Investimentos" && macro.nome !== "Sócios")
      .map(macro => macro.nome),
    datasets: [
      {
        data: yearlyData.macroCategorias
          .filter(macro => macro.nome !== "Investimentos" && macro.nome !== "Sócios")
          .map(macro => Math.abs(macro.total_entradas - macro.total_saidas)),
        backgroundColor: [
          '#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6',
          '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ],
        borderWidth: 2,
        borderColor: '#1F2937'
      }
    ]
  } : null);

  // Dados para o gráfico de linha (dados reais dos últimos 12 meses)
  const lineChartData = {
    labels: historicalData.map(item => `${item.monthName} ${item.year}`),
    datasets: [
      {
        label: 'EBITDA',
        data: historicalData.map(item => item.ebitda),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Receitas',
        data: historicalData.map(item => item.receitas),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Custos',
        data: historicalData.map(item => item.custos),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#D1D5DB',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            return `${context.label}: ${formatCurrency(value)}`;
          }
        }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#D1D5DB',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#D1D5DB',
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      },
      x: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#D1D5DB'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            DRE Operacional
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstrativo de Resultado do Exercício - Visão Operacional
          </p>
        </div>

        {/* Tabs Avançados */}
          <div className="card-dark rounded-2xl shadow-xl overflow-hidden">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-2 rounded-none border-b border-gray-200 dark:border-gray-700">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Dashboard Geral
              </TabsTrigger>
              <TabsTrigger 
                value="mes" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                <Calendar className="w-5 h-5 mr-2" />
                DRE Mês
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="p-8">
              {loadingYearly ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Erro ao carregar dados</div>
                  <div className="text-gray-600 dark:text-gray-400">{error}</div>
                </div>
              ) : yearlyData ? (
                <div className="space-y-8">
                  {/* KPIs Principais */}
                  <div className="mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-blue-500 text-white">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Dashboard Anual {year}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Os cards principais mostram os totais consolidados de todo o ano {year}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Total Entradas ({year})</p>
                          <p className="text-2xl font-bold">
                            {loadingYearly ? (
                              <div className="animate-pulse bg-green-400 h-8 w-32 rounded"></div>
                            ) : (
                              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(yearlyData?.entradasTotais || 0)
                            )}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-200" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm font-medium">Total Saídas ({year})</p>
                          <p className="text-2xl font-bold">
                                                          {loadingYearly ? (
                                <div className="animate-pulse bg-red-400 h-8 w-32 rounded"></div>
                              ) : (
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(yearlyData?.saidasTotais || 0)
                              )}
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-200" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">EBITDA ({year})</p>
                          <p className="text-2xl font-bold">
                                                          {loadingYearly ? (
                                <div className="animate-pulse bg-blue-400 h-8 w-32 rounded"></div>
                              ) : (
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(yearlyData?.ebitda || 0)
                              )}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>

                    <div className={`rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                      (yearlyData?.saldo || 0) >= 0 
                        ? 'bg-gradient-to-br from-green-500 to-green-600' 
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium opacity-90">Saldo Geral ({year})</p>
                          <p className="text-2xl font-bold">
                            {loadingYearly ? (
                              <div className="animate-pulse bg-white/20 h-8 w-32 rounded"></div>
                            ) : (
                              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(yearlyData?.saldo || 0)
                            )}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 opacity-80" />
                      </div>
                    </div>
                  </div>

                  {/* Gráficos Funcionais */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <PieChart className="w-6 h-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Categoria</h3>
                      </div>
                      <div className="h-64">
                        {pieChartData ? (
                          <Pie data={pieChartData} options={pieChartOptions} />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evolução Temporal</h3>
                      </div>
                      <div className="h-64">
                        {loadingHistorical ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 dark:text-gray-400">Carregando dados históricos...</p>
                            </div>
                          </div>
                        ) : historicalData.length > 0 ? (
                          <Line data={lineChartData} options={lineChartOptions} />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 dark:text-gray-400">Nenhum dado histórico disponível</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Macro-Categorias Avançadas */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Macro-Categorias
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {yearlyData.macroCategorias.map((macro) => {
                        const Icon = getMacroIcon(macro.nome);
                        const colorClass = getMacroColor(macro.nome);
                        const macroSaldo = macro.total_entradas - macro.total_saidas;
                        
                        return (
                          <div key={macro.nome} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass} text-white`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{macro.nome}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {macro.categorias.length} categorias
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  macroSaldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(macroSaldo)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {macro.tipo === 'entrada' ? 'Receita' : 'Custo'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Entradas:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(macro.total_entradas)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Saídas:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(macro.total_saidas)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleExpand(macro.nome)}
                              className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                              Ver detalhes →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="mes" className="p-8">
              <div className="space-y-6">
                                {/* Filtros Compactos - Mobile Responsive */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 lg:p-3 mb-3 lg:mb-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0">
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-center lg:justify-end">
                      <select 
                        value={month} 
                        onChange={(e) => {
                          console.log('Mês selecionado:', e.target.value);
                          setMonth(Number(e.target.value));
                        }}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
                      >
                        {months.map((monthName, index) => {
                          const monthValue = index + 1;
                          return (
                            <option key={monthValue} value={monthValue}>
                              {monthName}
                            </option>
                          );
                        })}
                      </select>
                      
                      <select 
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Erro ao carregar dados</div>
                    <div className="text-gray-600 dark:text-gray-400">{error}</div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
                    {/* Sidebar Lateral com Analytics - Mobile First */}
                    <aside className="flex flex-col lg:w-80 w-full bg-gray-50 dark:bg-gray-900 p-2 lg:p-4">
                      <div className="space-y-6 w-full">
                        {/* Analytics do Mês - Mobile Responsive */}
                        <div>
                          <div className="text-xs font-medium dark:text-gray-300 text-gray-800 mb-2 block lg:mb-1">
                            Analytics do Mês
                          </div>
                          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:space-y-1 lg:gap-0 overflow-hidden">
                            {(() => {
                              // Calcular métricas
                              const custoFixo = (
                                (data.macroCategorias.find(m => m.nome === "Mão-de-Obra")?.total_saidas || 0) +
                                (data.macroCategorias.find(m => m.nome === "Despesas Comerciais")?.total_saidas || 0) +
                                (data.macroCategorias.find(m => m.nome === "Despesas Administrativas")?.total_saidas || 0) +
                                (data.macroCategorias.find(m => m.nome === "Despesas Operacionais")?.total_saidas || 0) +
                                (data.macroCategorias.find(m => m.nome === "Despesas de Ocupação (Contas)")?.total_saidas || 0)
                              );
                              
                              const totalReceitas = data.macroCategorias.find(m => m.nome === "Receita")?.total_entradas || 1;
                              const custosVariaveis = data.macroCategorias.find(m => m.nome === "Custos Variáveis")?.total_saidas || 0;
                              const cmv = data.macroCategorias.find(m => m.nome === "Custo insumos (CMV)")?.total_saidas || 0;
                              
                              const mc = (1 - ((custosVariaveis + cmv) / totalReceitas)) * 100;
                              const breakeven = custoFixo / (mc / 100);
                              
                              return (
                                <>
                                  {/* Custo Fixo */}
                                  <div className="dark:bg-gray-800 bg-gray-50 lg:rounded-t-[6px] rounded-[6px] p-2 border dark:border-gray-700 border-gray-300">
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-1 lg:mb-2">
                                      <div className="flex items-center justify-center lg:justify-start gap-1 mb-1 lg:mb-0">
                                        <span className="text-red-400">📉</span>
                                        <span className="text-xs dark:text-gray-400 text-gray-700 font-medium">Custo Fixo</span>
                                      </div>
                                    </div>
                                    <div className="text-center lg:text-left">
                                      <div className="lg:flex lg:justify-between lg:text-xs">
                                        <span className="text-red-400 text-xs lg:inline hidden">Total:</span>
                                        <span className="font-bold dark:text-white text-black text-xs">
                                          {formatCurrency(custoFixo)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* MC % */}
                                  <div className="dark:bg-gray-800 bg-gray-50 lg:rounded-none rounded-[6px] p-2 border dark:border-gray-700 border-gray-300">
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-1 lg:mb-2">
                                      <div className="flex items-center justify-center lg:justify-start gap-1 mb-1 lg:mb-0">
                                        <span className="text-orange-400">📊</span>
                                        <span className="text-xs dark:text-gray-400 text-gray-700 font-medium">MC %</span>
                                      </div>
                                    </div>
                                    <div className="text-center lg:text-left">
                                      <div className="lg:flex lg:justify-between lg:text-xs">
                                        <span className="text-orange-400 text-xs lg:inline hidden">Margem:</span>
                                        <span className="font-bold dark:text-white text-black text-xs">
                                          {mc.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Breakeven */}
                                  <div className="dark:bg-gray-800 bg-gray-50 lg:rounded-b-[6px] rounded-[6px] p-2 border dark:border-gray-700 border-gray-300">
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-1 lg:mb-2">
                                      <div className="flex items-center justify-center lg:justify-start gap-1 mb-1 lg:mb-0">
                                        <span className="text-blue-400">🎯</span>
                                        <span className="text-xs dark:text-gray-400 text-gray-700 font-medium">Breakeven</span>
                                      </div>
                                    </div>
                                    <div className="text-center lg:text-left">
                                      <div className="lg:flex lg:justify-between lg:text-xs">
                                        <span className="text-blue-400 text-xs lg:inline hidden">Ponto Equilíbrio:</span>
                                        <span className="font-bold dark:text-white text-black text-xs">
                                          {formatCurrency(breakeven)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </aside>

                    {/* Área Principal da Tabela - Mobile Responsive */}
                    <div className="flex-1 lg:overflow-x-visible overflow-x-auto lg:overflow-y-auto overflow-y-visible hide-scrollbar lg:mt-0 mt-4">
                      <div className="bg-white dark:bg-gray-800 lg:rounded-xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[320px]">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                          <tr>
                            <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-gray-900 dark:text-white text-xs lg:text-sm">
                              Macro-Categoria
                            </th>
                            <th className="text-right py-2 lg:py-3 px-2 lg:px-4 font-semibold text-gray-900 dark:text-white text-xs lg:text-sm">
                              Valor
                            </th>
                            <th className="text-right py-2 lg:py-3 px-2 lg:px-4 font-semibold text-gray-900 dark:text-white text-xs lg:text-sm">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {/* Macro-categorias do EBITDA */}
                          {data?.macroCategorias
                            .filter(macro => macro.nome !== "Investimentos" && macro.nome !== "Sócios")
                            .map((macro) => {
                            const Icon = getMacroIcon(macro.nome);
                            const colorClass = getMacroColor(macro.nome);
                            const isCollapsed = collapsedMacros.has(macro.nome);
                            // Calcular valor unificado: receitas positivas, custos negativos
                            const valorUnificado = macro.nome === "Receita" 
                              ? macro.total_entradas 
                              : -macro.total_saidas;
                            
                            // Calcular percentual baseado no total de receitas
                            const totalReceitas = data?.macroCategorias.find(m => m.nome === "Receita")?.total_entradas || 1;
                            const percentualReceita = macro.nome === "Receita"
                              ? null // Receita não mostra %
                              : (Math.abs(valorUnificado) / totalReceitas) * 100;
                            
                            return (
                              <React.Fragment key={macro.nome}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <td className="py-2 lg:py-2.5 px-2 lg:px-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleMacroCollapse(macro.nome)}
                                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {isCollapsed ? (
                                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                        )}
                                      </button>
                                      <div className={`p-1.5 rounded-md bg-gradient-to-br ${colorClass} text-white`}>
                                        <Icon className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                        {macro.nome}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 lg:py-2.5 px-2 lg:px-4 text-right">
                                    <span className={`text-sm lg:text-base font-semibold ${valorUnificado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {formatCurrency(valorUnificado)}
                                    </span>
                                  </td>
                                  <td className="py-2 lg:py-2.5 px-2 lg:px-4 text-right">
                                    <span className="text-sm lg:text-base font-medium text-gray-600 dark:text-gray-400">
                                      {percentualReceita ? `${percentualReceita.toFixed(1)}%` : '-'}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Categorias Expandidas */}
                                {!isCollapsed && macro.categorias.map((cat) => {
                                  // Valor unificado para subcategorias - Contratos são sempre positivos
                                  const valorCatUnificado = (macro.nome === "Receita" || cat.nome === "Contratos") 
                                    ? cat.entradas 
                                    : -cat.saidas;
                                  
                                  // Percentual da subcategoria baseado no total de receitas
                                  const percentualCatReceita = (macro.nome === "Receita" || cat.nome === "Contratos")
                                    ? (valorCatUnificado / totalReceitas) * 100
                                    : (Math.abs(valorCatUnificado) / totalReceitas) * 100;
                                  return (
                                    <tr key={cat.nome} className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="py-2 lg:py-3 px-3 lg:px-6 pl-8 lg:pl-16">
                                        <span className="text-gray-700 dark:text-gray-300 text-sm lg:text-base">{cat.nome}</span>
                                      </td>
                                      <td className="py-2 lg:py-3 px-3 lg:px-6 text-right">
                                        <span className={`text-sm lg:text-base ${valorCatUnificado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {formatCurrency(valorCatUnificado)}
                                        </span>
                                      </td>
                                      <td className="py-2 lg:py-3 px-3 lg:px-6 text-right">
                                        <span className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-500">
                                          {percentualCatReceita.toFixed(1)}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}

                          {/* Linha de separação antes do EBITDA */}
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <td colSpan={3} className="py-2"></td>
                          </tr>

                          {/* EBITDA - Linha especial */}
                          <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                  <Target className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-base text-blue-900 dark:text-blue-100">
                                  EBITDA
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`text-lg font-bold ${(data?.ebitda || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(data?.ebitda || 0)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                {data?.macroCategorias.find(m => m.nome === "Receita")?.total_entradas 
                                  ? ((data?.ebitda || 0) / data.macroCategorias.find(m => m.nome === "Receita")!.total_entradas * 100).toFixed(1) + '%'
                                  : '-'}
                              </span>
                            </td>
                          </tr>

                          {/* Linha de separação após EBITDA */}
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <td colSpan={3} className="py-2"></td>
                          </tr>

                          {/* Macro-categorias fora do EBITDA (Investimentos e Sócios) */}
                          {data?.macroCategorias
                            .filter(macro => macro.nome === "Investimentos" || macro.nome === "Sócios")
                            .map((macro) => {
                            const Icon = getMacroIcon(macro.nome);
                            const colorClass = getMacroColor(macro.nome);
                            const isCollapsed = collapsedMacros.has(macro.nome);
                            const totalReceitas = data?.macroCategorias.find(m => m.nome === "Receita")?.total_entradas || 1;
                            // Valor unificado para Investimentos e Sócios
                            const valorUnificadoInvSoc = macro.total_entradas > 0 
                              ? macro.total_entradas 
                              : -macro.total_saidas;
                            
                            return (
                              <React.Fragment key={macro.nome}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => toggleMacroCollapse(macro.nome)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {isCollapsed ? (
                                          <ChevronRight className="w-4 h-4 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-gray-500" />
                                        )}
                                      </button>
                                      <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} text-white`}>
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {macro.nome}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <span className={`text-lg font-semibold ${valorUnificadoInvSoc >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {formatCurrency(valorUnificadoInvSoc)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-500">
                                      -
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Categorias Expandidas */}
                                {!isCollapsed && macro.categorias.map((cat) => {
                                  // Valor unificado para subcategorias - Contratos são sempre positivos
                                  const valorCatUnificado = (macro.nome === "Receita" || cat.nome === "Contratos") 
                                    ? cat.entradas 
                                    : -cat.saidas;
                                  
                                  // Percentual da subcategoria baseado no total de receitas
                                  const percentualCatReceita = (macro.nome === "Receita" || cat.nome === "Contratos")
                                    ? (valorCatUnificado / totalReceitas) * 100
                                    : (Math.abs(valorCatUnificado) / totalReceitas) * 100;
                                  return (
                                    <tr key={cat.nome} className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="py-2 lg:py-3 px-3 lg:px-6 pl-8 lg:pl-16">
                                        <span className="text-gray-700 dark:text-gray-300 text-sm lg:text-base">{cat.nome}</span>
                                      </td>
                                      <td className="py-2 lg:py-3 px-3 lg:px-6 text-right">
                                        <span className={`text-sm lg:text-base ${valorCatUnificado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {formatCurrency(valorCatUnificado)}
                                        </span>
                                      </td>
                                      <td className="py-2 lg:py-3 px-3 lg:px-6 text-right">
                                        <span className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-500">
                                          {percentualCatReceita.toFixed(1)}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
