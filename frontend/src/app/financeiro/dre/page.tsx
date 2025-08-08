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
  const [loading, setLoading] = useState(true);
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



  useEffect(() => {
    fetchData();
  }, [fetchData, month, year]);



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

  // Dados para o gráfico de pizza
  const pieChartData = (data ? {
    labels: data.macroCategorias
      .filter(macro => macro.nome !== "Investimentos" && macro.nome !== "Sócios")
      .map(macro => macro.nome),
    datasets: [
      {
        data: data.macroCategorias
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
        {/* Tabs Avançados */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
              <TabsTrigger 
                value="consolidado" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Consolidado
              </TabsTrigger>
              <TabsTrigger 
                value="detalhada" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                <FileText className="w-5 h-5 mr-2" />
                DRE Detalhada
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="p-8">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Erro ao carregar dados</div>
                  <div className="text-gray-600 dark:text-gray-400">{error}</div>
                </div>
              ) : data ? (
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
                            {loading ? (
                              <div className="animate-pulse bg-green-400 h-8 w-32 rounded"></div>
                            ) : (
                              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.entradasTotais || 0)
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
                                                          {loading ? (
                                <div className="animate-pulse bg-red-400 h-8 w-32 rounded"></div>
                              ) : (
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.saidasTotais || 0)
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
                                                          {loading ? (
                                <div className="animate-pulse bg-blue-400 h-8 w-32 rounded"></div>
                              ) : (
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.ebitda || 0)
                              )}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>

                    <div className={`rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                      (data?.saldo || 0) >= 0 
                        ? 'bg-gradient-to-br from-green-500 to-green-600' 
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium opacity-90">Saldo Geral ({year})</p>
                          <p className="text-2xl font-bold">
                            {loading ? (
                              <div className="animate-pulse bg-white/20 h-8 w-32 rounded"></div>
                            ) : (
                              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.saldo || 0)
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
                      {data.macroCategorias.map((macro) => {
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
                                {/* Filtros Compactos */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={month} 
                        onChange={(e) => {
                          console.log('Mês selecionado:', e.target.value);
                          setMonth(Number(e.target.value));
                        }}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {/* Sidebar Lateral com Analytics */}
                    <aside className="flex flex-col w-80 bg-gray-50 dark:bg-gray-900 p-4">
                      <div className="space-y-6 w-full">
                        {/* Analytics do Mês */}
                        <div>
                          <label className="text-xs font-medium dark:text-gray-300 text-gray-800 mb-1 block">
                            Analytics do Mês
                          </label>
                          <div className="space-y-1 overflow-hidden">
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
                                  <div className="dark:bg-gray-800 bg-gray-50 rounded-t-[6px] p-2 border dark:border-gray-700 border-gray-300">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs dark:text-gray-400 text-gray-700">Custo Fixo</span>
                                      <span className="text-red-400">📉</span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-red-400">Total:</span>
                                        <span className="font-bold dark:text-white text-black">
                                          {formatCurrency(custoFixo)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* MC % */}
                                  <div className="dark:bg-gray-800 bg-gray-50 p-2 border dark:border-gray-700 border-gray-300">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs dark:text-gray-400 text-gray-700">MC %</span>
                                      <span className="text-orange-400">📊</span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-orange-400">Margem:</span>
                                        <span className="font-bold dark:text-white text-black">
                                          {mc.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Breakeven */}
                                  <div className="dark:bg-gray-800 bg-gray-50 p-2 border rounded-b-[6px] dark:border-gray-700 border-gray-300">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs dark:text-gray-400 text-gray-700">Breakeven</span>
                                      <span className="text-blue-400">🎯</span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-blue-400">Ponto Equilíbrio:</span>
                                        <span className="font-bold dark:text-white text-black">
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

                    {/* Área Principal da Tabela */}
                    <div className="flex-1 overflow-x-visible overflow-y-auto hide-scrollbar">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                              Macro-Categoria
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                              Valor
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
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
                                  <td className="py-2.5 px-4">
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
                                  <td className="py-2.5 px-4 text-right">
                                    <span className={`text-base font-semibold ${valorUnificado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {formatCurrency(valorUnificado)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <span className="text-base font-medium text-gray-600 dark:text-gray-400">
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
                                      <td className="py-3 px-6 pl-16">
                                        <span className="text-gray-700 dark:text-gray-300">{cat.nome}</span>
                                      </td>
                                      <td className="py-3 px-6 text-right">
                                        <span className={`${valorCatUnificado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {formatCurrency(valorCatUnificado)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-6 text-right">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
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
                                      <td className="py-3 px-6 pl-16">
                                        <span className="text-gray-700 dark:text-gray-300">{cat.nome}</span>
                                      </td>
                                      <td className="py-3 px-6 text-right">
                                        <span className={`${valorCatUnificado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {formatCurrency(valorCatUnificado)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-6 text-right">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
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

            <TabsContent value="consolidado" className="p-8">
              <div className="space-y-6">
                {/* Filtros Avançados */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Título e Descrição */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Visão Consolidada</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Análise comparativa por período</p>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Seletor de Ano */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ano</label>
                              <select 
                                value={year} 
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full bg-transparent text-gray-900 dark:text-white font-semibold text-base focus:outline-none cursor-pointer"
                              >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                  <option key={year} value={year} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    {year}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>


                    </div>
                  </div>
                </div>

                {loadingConsolidated ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Erro ao carregar dados</div>
                    <div className="text-gray-600 dark:text-gray-400">{error}</div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                              Macro-Categoria
                            </th>
                            {consolidatedData.map((item, index) => (
                              <th key={item.monthName} className="text-center py-4 px-3 font-semibold text-gray-900 dark:text-white min-w-[120px]">
                                <div className="text-sm">{item.monthName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.year}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {/* Receita */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Receita</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Receita", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Custos Variáveis */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                                  <TrendingDown className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Custos Variáveis</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Custos Variáveis", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Custo insumos (CMV) */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                                  <ShoppingCart className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Custo insumos (CMV)</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Custo insumos (CMV)", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Mão-de-Obra */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                  <Users className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Mão-de-Obra</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Mão-de-Obra", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Despesas Comerciais */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Despesas Comerciais</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Despesas Comerciais", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Despesas Administrativas */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                                  <Wrench className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Despesas Administrativas</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Despesas Administrativas", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Despesas Operacionais */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Despesas Operacionais</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Despesas Operacionais", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Despesas de Ocupação */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                                  <Home className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Despesas de Ocupação</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Despesas de Ocupação", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Não Operacionais */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Não Operacionais</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Não Operacionais", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Linha de separação */}
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <td colSpan={consolidatedData.length + 1} className="py-2"></td>
                          </tr>

                          {/* EBITDA */}
                          <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                            <td className="py-4 px-6 sticky left-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                  <Target className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-lg text-blue-900 dark:text-blue-100">EBITDA</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className={`text-lg font-bold ${(item.ebitda || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatCurrency(item.ebitda || 0)}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Linha de separação */}
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <td colSpan={consolidatedData.length + 1} className="py-2"></td>
                          </tr>

                          {/* Investimentos */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Investimentos</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Investimentos", index))}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Sócios */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                                  <Users className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">Sócios</span>
                              </div>
                            </td>
                            {consolidatedData.map((item, index) => (
                              <td key={item.monthName} className="py-4 px-3 text-center">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {formatCurrency(getConsolidatedValue("Sócios", index))}
                                </span>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="detalhada" className="p-8">
              <div className="space-y-6">
                {/* Filtros Avançados */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Título e Descrição */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">DRE Detalhada</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Análise granular por transação</p>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Filtro de Categorias */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-white">
                              <Filter className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Categoria</label>
                              <select className="w-full bg-transparent text-gray-900 dark:text-white font-semibold text-base focus:outline-none cursor-pointer">
                                <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Todas as Categorias</option>
                                <option value="Stone Crédito" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Stone Crédito</option>
                                <option value="Stone Débito" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Stone Débito</option>
                                <option value="IMPOSTO" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">IMPOSTO</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filtro de Fornecedores */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fornecedor</label>
                              <select className="w-full bg-transparent text-gray-900 dark:text-white font-semibold text-base focus:outline-none cursor-pointer">
                                <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Todos os Fornecedores</option>
                                <option value="Fornecedor 1" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Fornecedor 1</option>
                                <option value="Fornecedor 2" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Fornecedor 2</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>


                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Data</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Categoria</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Fornecedor/Cliente</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-white">Entradas</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-white">Saídas</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-white">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {[
                          { data: "2024-05-01", categoria: "Stone Crédito", fornecedor: "Fornecedor 1", entradas: 12000, saidas: 0, obs: "Venda cartão" },
                          { data: "2024-05-02", categoria: "IMPOSTO", fornecedor: "Prefeitura", entradas: 0, saidas: 3000, obs: "ISS" },
                          { data: "2024-05-03", categoria: "Stone Débito", fornecedor: "Fornecedor 2", entradas: 8000, saidas: 0, obs: "Venda débito" },
                          { data: "2024-05-04", categoria: "IMPOSTO", fornecedor: "Receita Federal", entradas: 0, saidas: 2500, obs: "IRPJ" },
                        ].map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-6 text-gray-900 dark:text-white font-medium">{item.data}</td>
                            <td className="py-4 px-6 text-gray-900 dark:text-white">{item.categoria}</td>
                            <td className="py-4 px-6 text-gray-900 dark:text-white">{item.fornecedor}</td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {formatCurrency(item.entradas)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                {formatCurrency(item.saidas)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">{item.obs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 