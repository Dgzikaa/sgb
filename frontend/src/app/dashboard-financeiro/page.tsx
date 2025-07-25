'use client';

import { useState, useEffect, useCallback } from 'react';
import { StandardPageLayout } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  FileTextIcon,
  RefreshCwIcon,
  DollarSignIcon,
  PieChartIcon,
  ActivityIcon,
  CalendarIcon,
  TrendingUp,
  EyeIcon,
  RefreshCw,
  Download,
  Percent,
  Users,
  Calculator,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBarContext } from '@/contexts/BarContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface DashboardData {
  resumo: {
    total_receitas: number;
    total_despesas: number;
    saldo_liquido: number;
    total_transacoes: number;
  };
  receitas_por_categoria: Array<{
    categoria: string;
    total: number;
    tipo: string;
  }>;
  despesas_por_categoria: Array<{
    categoria: string;
    total: number;
    tipo: string;
  }>;
  transacoes_recentes: Array<{
    id: string;
    tipo: 'receita' | 'despesa';
    descricao: string;
    valor: number;
    data: string;
    status: string;
    categoria: string;
  }>;
  estatisticas: {
    categorias_com_receitas: number;
    categorias_com_despesas: number;
    receitas_categorizadas: number;
    despesas_categorizadas: number;
  };
}

interface DREData {
  periodo: string;
  dre: {
    receitas: {
      total: number;
      detalhes: Record<string, number>;
    };
    custos: {
      cmo: { total: number; detalhes: Record<string, number> };
      cmv: { total: number; detalhes: Record<string, number> };
      custos_variaveis: { total: number; detalhes: Record<string, number> };
    };
    despesas: {
      despesas_comerciais: { total: number; detalhes: Record<string, number> };
      despesas_administrativas: {
        total: number;
        detalhes: Record<string, number>;
      };
      despesas_operacionais: {
        total: number;
        detalhes: Record<string, number>;
      };
      despesas_ocupacao: { total: number; detalhes: Record<string, number> };
      nao_operacionais: { total: number; detalhes: Record<string, number> };
      investimentos: { total: number; detalhes: Record<string, number> };
    };
    categorias_nao_mapeadas: Record<string, number>;
    estatisticas: {
      total_eventos: number;
      eventos_mapeados: number;
      eventos_nao_mapeados: number;
    };
  };
  metricas: {
    receita_total: number;
    custos_total: number;
    despesas_total: number;
    lucro_bruto: number;
    lucro_operacional: number;
    lucro_liquido: number;
    percentuais: {
      cmo_percent: number;
      cmv_percent: number;
      custos_variaveis_percent: number;
      despesas_comerciais_percent: number;
      despesas_administrativas_percent: number;
      despesas_operacionais_percent: number;
      despesas_ocupacao_percent: number;
      margem_bruta_percent: number;
      margem_liquida_percent: number;
    };
  };
}

export default function DashboardFinanceiroPage() {
  const { selectedBar } = useBarContext();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [loadingDre, setLoadingDre] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [activeTab, setActiveTab] = useState('resumo');

  const carregarDados = useCallback(async () => {
    if (!selectedBar) {
      toast({
        title: 'Bar não selecionado',
        description: 'Selecione um bar para ver os dados financeiros',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard-financeiro?barId=${selectedBar.id}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar dados');
      }

      setData(result);

      toast({
        title: '✅ Dados Carregados!',
        description: `${result.resumo.total_transacoes} transações encontradas`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar, toast]);

  const carregarDRE = async (mes?: string) => {
    if (!selectedBar) {
      toast({
        title: 'Bar não selecionado',
        description: 'Selecione um bar para ver a DRE',
        variant: 'destructive',
      });
      return;
    }

    setLoadingDre(true);
    try {
      const url = new URL('/api/contaazul/dre-analise', window.location.origin);
      url.searchParams.set('barId', selectedBar.id.toString());
      if (mes) {
        url.searchParams.set('mes', mes);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar DRE');
      }

      setDreData(result);

      toast({
        title: '📊 DRE Carregada!',
        description: `${result.dre.estatisticas.eventos_mapeados} eventos processados`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar DRE',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoadingDre(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para corrigir nomes das categorias com caracteres especiais mal codificados
  const fixCategoryName = (categoryName: string) => {
    if (!categoryName) return categoryName;

    return categoryName
      .replace(/CrÃ©dito/g, 'Crédito')
      .replace(/DÃ©bito/g, 'Débito')
      .replace(/EmprÃ©stimos/g, 'Empréstimos')
      .replace(/SÃ³cios/g, 'Sócios')
      .replace(/UtensÃ­lios/g, 'Utensílios')
      .replace(/DescartÃ¡veis/g, 'Descartáveis')
      .replace(/ÃgÃ¼a/g, 'Água')
      .replace(/ÃGUA/g, 'ÁGUA')
      .replace(/ElÃ©trica/g, 'Elétrica')
      .replace(/ENERGIA ELÃTRICA/g, 'ENERGIA ELÉTRICA')
      .replace(/ManutenÃ§Ã£o/g, 'Manutenção')
      .replace(/MANUTENÃÃO/g, 'MANUTENÇÃO')
      .replace(/AluguelCondomÃ­nio/g, 'Aluguel/Condomínio')
      .replace(/CONDOMÃNIO/g, 'CONDOMÍNIO')
      .replace(/SALÃRIOS/g, 'SALÁRIOS')
      .replace(/DÃ©cimo/g, 'Décimo')
      .replace(/GÃ¡s/g, 'Gás')
      .replace(/EscritÃ³rio/g, 'Escritório')
      .replace(/AdministrativoOrdinÃ¡rio/g, 'Administrativo Ordinário')
      .replace(/ProduÃ§Ã£o/g, 'Produção')
      .replace(/OperaÃ§Ã£o/g, 'Operação')
      .replace(/ProgramaÃ§Ã£o/g, 'Programação')
      .replace(/AtraÃ§Ãµes/g, 'Atrações');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'resumo':
        return '📊 Resumo Geral 2025';
      case 'dre':
        return '📊 DRE Mensal';
      case 'insights':
        return '👁️ Insights';
      default:
        return '📊 Dashboard Financeiro';
    }
  };

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, carregarDados]);

  const getMaxValue = (items: Array<{ total: number }>) => {
    return Math.max(...items.map(item => item.total), 1);
  };

  return (
    <ProtectedRoute requiredModule="relatorio_produtos">
      <StandardPageLayout>
        <div className="space-y-mobile">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-responsive-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-responsive-sm text-gray-600 mt-1">
                Visão completa das finanças - {selectedBar?.nome}
              </p>
            </div>
            <div className="flex gap-2">
              {activeTab === 'dre' && (
                <select
                  value={selectedMonth}
                  onChange={e => {
                    setSelectedMonth(e.target.value);
                    carregarDRE(e.target.value || undefined);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos os meses de 2025</option>
                  <option value="2025-01">Janeiro 2025</option>
                  <option value="2025-02">Fevereiro 2025</option>
                  <option value="2025-03">Março 2025</option>
                  <option value="2025-04">Abril 2025</option>
                  <option value="2025-05">Maio 2025</option>
                  <option value="2025-06">Junho 2025</option>
                  <option value="2025-07">Julho 2025</option>
                  <option value="2025-08">Agosto 2025</option>
                  <option value="2025-09">Setembro 2025</option>
                  <option value="2025-10">Outubro 2025</option>
                  <option value="2025-11">Novembro 2025</option>
                  <option value="2025-12">Dezembro 2025</option>
                </select>
              )}

              {activeTab === 'dre' ? (
                <Button
                  onClick={() => carregarDRE(selectedMonth || undefined)}
                  disabled={loadingDre}
                >
                  {loadingDre ? (
                    <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                  )}
                  Atualizar DRE
                </Button>
              ) : (
                <Button onClick={carregarDados} disabled={loading}>
                  {loading ? (
                    <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                  )}
                  Atualizar Dados
                </Button>
              )}

              <Button variant="outline" className="btn-touch touch-animation">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabs de Navegação */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <DollarSignIcon className="w-4 h-4" />
                Resumo Geral
              </TabsTrigger>
              <TabsTrigger value="dre" className="flex items-center gap-2">
                <BarChart3Icon className="w-4 h-4" />
                DRE Mensal
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <EyeIcon className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: RESUMO GERAL */}
            <TabsContent value="resumo" className="space-y-6">
              {/* Cards de Resumo */}
              {data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Total Receitas
                      </CardTitle>
                      <TrendingUpIcon className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(data.resumo.total_receitas)}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {data.estatisticas.receitas_categorizadas} receitas
                        categorizadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Total Despesas
                      </CardTitle>
                      <TrendingDownIcon className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(data.resumo.total_despesas)}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {data.estatisticas.despesas_categorizadas} despesas
                        categorizadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`shadow-lg border-0 hover:shadow-xl transition-all duration-300 ${data.resumo.saldo_liquido >= 0 ? 'bg-gradient-to-br from-green-50 to-white' : 'bg-gradient-to-br from-red-50 to-white'}`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Saldo Líquido
                      </CardTitle>
                      <BarChart3Icon
                        className={`h-5 w-5 ${data.resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${data.resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(data.resumo.saldo_liquido)}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        Receitas - Despesas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Total Transações
                      </CardTitle>
                      <ActivityIcon className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {data.resumo.total_transacoes.toLocaleString('pt-BR')}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {data.estatisticas.categorias_com_receitas +
                          data.estatisticas.categorias_com_despesas}{' '}
                        categorias ativas
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Análises Financeiras Avançadas */}
              {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Distribuição de Receitas */}
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-green-600" />
                        <span className="text-gray-800 font-bold">
                          Distribuição de Receitas
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Concentração e diversificação das fontes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {data.receitas_por_categoria
                          .slice(0, 3)
                          .map((item, index) => {
                            const percentage =
                              (item.total / data.resumo.total_receitas) * 100;
                            return (
                              <div key={index}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">
                                    {fixCategoryName(item.categoria)}
                                  </span>
                                  <span className="text-sm font-bold text-green-600">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-700 font-medium">
                            Top 3 representam{' '}
                            {(
                              (data.receitas_por_categoria
                                .slice(0, 3)
                                .reduce((sum, item) => sum + item.total, 0) /
                                data.resumo.total_receitas) *
                              100
                            ).toFixed(1)}
                            % do total
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Indicadores de Eficiência */}
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <ActivityIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-800 font-bold">
                          Indicadores de Eficiência
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Métricas operacionais chave
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Margem Líquida
                          </span>
                          <span
                            className={`text-sm font-bold ${data.resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {(
                              (data.resumo.saldo_liquido /
                                data.resumo.total_receitas) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Receita por Transação
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(
                              data.resumo.total_receitas /
                                data.estatisticas.receitas_categorizadas
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Despesa por Transação
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(
                              data.resumo.total_despesas /
                                data.estatisticas.despesas_categorizadas
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Taxa de Categorização
                          </span>
                          <span className="text-sm font-bold text-purple-600">
                            {(
                              ((data.estatisticas.receitas_categorizadas +
                                data.estatisticas.despesas_categorizadas) /
                                data.resumo.total_transacoes) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estrutura de Custos */}
                  <Card className="">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3Icon className="w-5 h-5 text-purple-600" />
                        <span className="text-gray-800 font-bold">
                          Estrutura de Custos
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Análise das principais despesas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {data.despesas_por_categoria
                          .slice(0, 4)
                          .map((item, index) => {
                            const percentage =
                              (item.total / data.resumo.total_despesas) * 100;
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center"
                              >
                                <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                                  {fixCategoryName(item.categoria)}
                                </span>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-red-600">
                                    {formatCurrency(item.total)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {percentage.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Análise de Volumes */}
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-yellow-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-yellow-600" />
                        <span className="text-gray-800 font-bold">
                          Análise de Volumes
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Distribuição de transações
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {data.estatisticas.categorias_com_receitas}
                          </div>
                          <div className="text-xs text-green-700 font-medium">
                            Tipos de Receita
                          </div>
                        </div>

                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {data.estatisticas.categorias_com_despesas}
                          </div>
                          <div className="text-xs text-red-700 font-medium">
                            Tipos de Despesa
                          </div>
                        </div>

                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {data.estatisticas.receitas_categorizadas}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">
                            Receitas
                          </div>
                        </div>

                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {data.estatisticas.despesas_categorizadas}
                          </div>
                          <div className="text-xs text-orange-700 font-medium">
                            Despesas
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparativo Financeiro */}
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSignIcon className="w-5 h-5 text-indigo-600" />
                        <span className="text-gray-800 font-bold">
                          Resumo Executivo
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Principais indicadores do período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-700 font-medium">
                            Maior Receita
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {data.receitas_por_categoria.length > 0
                              ? fixCategoryName(
                                  data.receitas_por_categoria[0].categoria
                                )
                              : 'N/A'}
                          </div>
                          <div className="text-sm text-green-600">
                            {data.receitas_por_categoria.length > 0
                              ? formatCurrency(
                                  data.receitas_por_categoria[0].total
                                )
                              : 'R$ 0,00'}
                          </div>
                        </div>

                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-sm text-red-700 font-medium">
                            Maior Despesa
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            {data.despesas_por_categoria.length > 0
                              ? fixCategoryName(
                                  data.despesas_por_categoria[0].categoria
                                )
                              : 'N/A'}
                          </div>
                          <div className="text-sm text-red-600">
                            {data.despesas_por_categoria.length > 0
                              ? formatCurrency(
                                  data.despesas_por_categoria[0].total
                                )
                              : 'R$ 0,00'}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg ${data.resumo.saldo_liquido >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
                        >
                          <div
                            className={`text-sm font-medium ${data.resumo.saldo_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}
                          >
                            Status Financeiro
                          </div>
                          <div
                            className={`text-lg font-bold ${data.resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {data.resumo.saldo_liquido >= 0
                              ? 'Lucrativo'
                              : 'Deficitário'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Diversificação de Receitas */}
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-teal-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        <span className="text-gray-800 font-bold">
                          Diversificação
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Análise de concentração de risco
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const topReceita =
                            data.receitas_por_categoria[0]?.total || 0;
                          const concentracao =
                            (topReceita / data.resumo.total_receitas) * 100;
                          const risco =
                            concentracao > 50
                              ? 'Alto'
                              : concentracao > 30
                                ? 'Médio'
                                : 'Baixo';
                          const corRisco =
                            concentracao > 50
                              ? 'text-red-600'
                              : concentracao > 30
                                ? 'text-yellow-600'
                                : 'text-green-600';

                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Concentração Principal
                                </span>
                                <span
                                  className={`text-sm font-bold ${corRisco}`}
                                >
                                  {concentracao.toFixed(1)}%
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Risco de Concentração
                                </span>
                                <span
                                  className={`text-sm font-bold ${corRisco}`}
                                >
                                  {risco}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Fontes Ativas
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                  {data.estatisticas.categorias_com_receitas}{' '}
                                  fontes
                                </span>
                              </div>

                              <div
                                className={`p-3 rounded-lg ${concentracao > 50 ? 'bg-red-50' : concentracao > 30 ? 'bg-yellow-50' : 'bg-green-50'}`}
                              >
                                <div
                                  className={`text-xs font-medium ${concentracao > 50 ? 'text-red-700' : concentracao > 30 ? 'text-yellow-700' : 'text-green-700'}`}
                                >
                                  {concentracao > 50
                                    ? '⚠️ Alta dependência de uma fonte'
                                    : concentracao > 30
                                      ? '⚡ Concentração moderada'
                                      : '✅ Receitas bem diversificadas'}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Estado de Loading */}
              {loading && (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
                      <p>Carregando dados financeiros do ContaAzul...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Buscando receitas, despesas e categorias...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado sem dados */}
              {!loading && !data && selectedBar && (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <DollarSignIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">
                        Dados Financeiros
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Clique em &quot;Atualizar Dados&quot; para carregar as
                        informações financeiras do ContaAzul.
                      </p>
                      <Button onClick={carregarDados}>
                        <RefreshCwIcon className="w-4 h-4 mr-2" />
                        Carregar Dados
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info sobre sincronização */}
              {!loading && !selectedBar && (
                <Alert>
                  <AlertDescription>
                    💡 Selecione um bar no menu lateral para visualizar os dados
                    financeiros do ContaAzul. Certifique-se de que o sync
                    categorizado foi executado nas configurações.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* ABA 2: DRE MENSAL */}
            <TabsContent value="dre" className="space-y-6">
              {loadingDre ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
                      <p>Calculando DRE...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : dreData ? (
                <div className="space-y-6">
                  {/* RESULTADO FINAL - No Topo */}
                  <Card
                    className={`border-2 ${dreData.metricas.lucro_liquido >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h3
                          className={`text-xl font-semibold mb-4 ${dreData.metricas.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}
                        >
                          🎯 RESULTADO FINAL
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-gray-600">Receitas</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(dreData.metricas.receita_total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Despesas</p>
                            <p className="text-2xl font-bold text-red-600">
                              {formatCurrency(dreData.metricas.despesas_total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Resultado</p>
                            <p
                              className={`text-3xl font-bold ${dreData.metricas.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}
                            >
                              {dreData.metricas.lucro_liquido >= 0 ? '+' : ''}
                              {formatCurrency(dreData.metricas.lucro_liquido)}
                            </p>
                            <p
                              className={`text-sm ${dreData.metricas.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {dreData.metricas.percentuais.margem_liquida_percent.toFixed(
                                1
                              )}
                              % da receita
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* DRE FORMATO EXCEL */}
                  <Card>
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="text-gray-800">
                        📊 DRE - Demonstração do Resultado do Exercício
                      </CardTitle>
                      <p className="text-gray-600 text-sm mt-1">
                        {dreData.periodo}
                      </p>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                Categoria
                              </th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                                Valor
                              </th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                                % Receita
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* RECEITAS */}
                            <tr className="bg-green-50 border-t-2 border-green-200">
                              <td className="py-3 px-4 font-bold text-green-700">
                                💰 RECEITAS
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-green-700">
                                {formatCurrency(dreData.dre.receitas.total)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-green-700">
                                100.0%
                              </td>
                            </tr>
                            {Object.entries(dreData.dre.receitas.detalhes)
                              .sort(([, a], [, b]) => b - a)
                              .map(([categoria, valor]) => (
                                <tr
                                  key={categoria}
                                  className="border-b border-gray-100"
                                >
                                  <td className="py-2 px-8 text-gray-700">
                                    {fixCategoryName(categoria)}
                                  </td>
                                  <td className="py-2 px-4 text-right text-green-600 font-medium">
                                    {formatCurrency(valor)}
                                  </td>
                                  <td className="py-2 px-4 text-right text-gray-600">
                                    {(
                                      (valor / dreData.metricas.receita_total) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </td>
                                </tr>
                              ))}

                            {/* DESPESAS */}
                            <tr className="bg-red-50 border-t-2 border-red-200">
                              <td className="py-3 px-4 font-bold text-red-700">
                                💸 DESPESAS
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-red-700">
                                {formatCurrency(
                                  dreData.metricas.despesas_total
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-red-700">
                                {(
                                  (dreData.metricas.despesas_total /
                                    dreData.metricas.receita_total) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                            {(() => {
                              // Combinar todas as despesas
                              const todasDespesas: Array<[string, number]> = [];

                              Object.entries(
                                dreData.dre.despesas.despesas_comerciais
                                  .detalhes
                              ).forEach(([cat, val]) =>
                                todasDespesas.push([cat, val])
                              );
                              Object.entries(
                                dreData.dre.despesas.despesas_administrativas
                                  .detalhes
                              ).forEach(([cat, val]) =>
                                todasDespesas.push([cat, val])
                              );
                              Object.entries(
                                dreData.dre.despesas.despesas_operacionais
                                  .detalhes
                              ).forEach(([cat, val]) =>
                                todasDespesas.push([cat, val])
                              );
                              Object.entries(
                                dreData.dre.despesas.despesas_ocupacao.detalhes
                              ).forEach(([cat, val]) =>
                                todasDespesas.push([cat, val])
                              );
                              Object.entries(
                                dreData.dre.despesas.nao_operacionais.detalhes
                              ).forEach(([cat, val]) =>
                                todasDespesas.push([cat, val])
                              );
                              Object.entries(
                                dreData.dre.despesas.investimentos.detalhes
                              ).forEach(([cat, val]) =>
                                todasDespesas.push([cat, val])
                              );

                              return todasDespesas
                                .sort(([, a], [, b]) => b - a)
                                .map(([categoria, valor]) => (
                                  <tr
                                    key={categoria}
                                    className="border-b border-gray-100"
                                  >
                                    <td className="py-2 px-8 text-gray-700">
                                      {fixCategoryName(categoria)}
                                    </td>
                                    <td className="py-2 px-4 text-right text-red-600 font-medium">
                                      {formatCurrency(valor)}
                                    </td>
                                    <td className="py-2 px-4 text-right text-gray-600">
                                      {(
                                        (valor /
                                          dreData.metricas.receita_total) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </td>
                                  </tr>
                                ));
                            })()}

                            {/* RESULTADO */}
                            <tr
                              className={`border-t-4 ${dreData.metricas.lucro_liquido >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}
                            >
                              <td
                                className={`py-4 px-4 font-bold text-lg ${dreData.metricas.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}
                              >
                                🎯 RESULTADO DO PERÍODO
                              </td>
                              <td
                                className={`py-4 px-4 text-right font-bold text-xl ${dreData.metricas.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}
                              >
                                {dreData.metricas.lucro_liquido >= 0 ? '+' : ''}
                                {formatCurrency(dreData.metricas.lucro_liquido)}
                              </td>
                              <td
                                className={`py-4 px-4 text-right font-bold ${dreData.metricas.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}
                              >
                                {dreData.metricas.percentuais.margem_liquida_percent.toFixed(
                                  1
                                )}
                                %
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <BarChart3Icon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">
                        DRE - Demonstração do Resultado
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Selecione um mês e clique em &quot;Atualizar DRE&quot;
                        para calcular a demonstração do resultado.
                      </p>
                      <Button onClick={() => carregarDRE()}>
                        <BarChart3Icon className="w-4 h-4 mr-2" />
                        Carregar DRE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ABA 3: INSIGHTS */}
            <TabsContent value="insights" className="space-y-6">
              {/* Cards de Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Crescimento Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Análise de crescimento de receitas mês a mês
                    </p>
                    <div className="text-center text-gray-500 py-8">
                      Em desenvolvimento...
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-blue-600" />
                      Sazonalidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Padrões sazonais de receitas e despesas
                    </p>
                    <div className="text-center text-gray-500 py-8">
                      Em desenvolvimento...
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-purple-600" />
                      Previsões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Projeções baseadas em dados históricos
                    </p>
                    <div className="text-center text-gray-500 py-8">
                      Em desenvolvimento...
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <ActivityIcon className="h-4 w-4" />
                <AlertDescription>
                  💡 Esta seção será desenvolvida com análises avançadas
                  baseadas nos dados coletados. Incluirá gráficos de tendências,
                  comparações mensais e insights automatizados.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
