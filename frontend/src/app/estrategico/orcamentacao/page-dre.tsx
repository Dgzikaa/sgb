'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calculator,
  BarChart3
} from 'lucide-react';
import { AnimatedCurrency } from '@/components/ui/animated-counter';

interface DREItem {
  categoria: string;
  subcategoria?: string;
  valores: {
    [mes: string]: {
      valor: number;
      percentual: number;
    };
  };
  tipo: 'receita' | 'custo' | 'despesa' | 'resultado';
  nivel: number; // 1 = categoria principal, 2 = subcategoria, 3 = total
}

interface IndicadoresEstrategicos {
  breakeven: number;
  margem_contribuicao: number;
  projecao_lucro: number;
  meta_faturamento: number;
}

export default function OrcamentacaoDREPage() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [dreData, setDreData] = useState<DREItem[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresEstrategicos | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState(2025);
  const [mesesSelecionados, setMesesSelecionados] = useState(['08', '09', '10']); // Ago, Set, Out

  const mesesNomes = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };

  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    setLoading(true);
    try {
      // Simular dados DRE para demonstração
      const mockDREData: DREItem[] = [
        // RECEITAS
        {
          categoria: 'RECEITA BRUTA',
          tipo: 'receita',
          nivel: 1,
          valores: {
            '08': { valor: 485000, percentual: 100 },
            '09': { valor: 520000, percentual: 100 },
            '10': { valor: 495000, percentual: 100 }
          }
        },
        {
          categoria: 'Faturamento Couvert',
          tipo: 'receita',
          nivel: 2,
          valores: {
            '08': { valor: 145500, percentual: 30.0 },
            '09': { valor: 156000, percentual: 30.0 },
            '10': { valor: 148500, percentual: 30.0 }
          }
        },
        {
          categoria: 'Faturamento Bar',
          tipo: 'receita',
          nivel: 2,
          valores: {
            '08': { valor: 339500, percentual: 70.0 },
            '09': { valor: 364000, percentual: 70.0 },
            '10': { valor: 346500, percentual: 70.0 }
          }
        },
        
        // CUSTOS VARIÁVEIS
        {
          categoria: 'CUSTOS VARIÁVEIS',
          tipo: 'custo',
          nivel: 1,
          valores: {
            '08': { valor: -130950, percentual: -27.0 },
            '09': { valor: -140400, percentual: -27.0 },
            '10': { valor: -133650, percentual: -27.0 }
          }
        },
        {
          categoria: 'CMV Bebidas',
          tipo: 'custo',
          nivel: 2,
          valores: {
            '08': { valor: -97000, percentual: -20.0 },
            '09': { valor: -104000, percentual: -20.0 },
            '10': { valor: -99000, percentual: -20.0 }
          }
        },
        {
          categoria: 'CMV Comida',
          tipo: 'custo',
          nivel: 2,
          valores: {
            '08': { valor: -33950, percentual: -7.0 },
            '09': { valor: -36400, percentual: -7.0 },
            '10': { valor: -34650, percentual: -7.0 }
          }
        },

        // MARGEM DE CONTRIBUIÇÃO
        {
          categoria: 'MARGEM DE CONTRIBUIÇÃO',
          tipo: 'resultado',
          nivel: 1,
          valores: {
            '08': { valor: 354050, percentual: 73.0 },
            '09': { valor: 379600, percentual: 73.0 },
            '10': { valor: 361350, percentual: 73.0 }
          }
        },

        // DESPESAS FIXAS
        {
          categoria: 'DESPESAS FIXAS',
          tipo: 'despesa',
          nivel: 1,
          valores: {
            '08': { valor: -194000, percentual: -40.0 },
            '09': { valor: -208000, percentual: -40.0 },
            '10': { valor: -198000, percentual: -40.0 }
          }
        },
        {
          categoria: 'Recursos Humanos',
          tipo: 'despesa',
          nivel: 2,
          valores: {
            '08': { valor: -97000, percentual: -20.0 },
            '09': { valor: -104000, percentual: -20.0 },
            '10': { valor: -99000, percentual: -20.0 }
          }
        },
        {
          categoria: 'Contratos e Serviços',
          tipo: 'despesa',
          nivel: 2,
          valores: {
            '08': { valor: -48500, percentual: -10.0 },
            '09': { valor: -52000, percentual: -10.0 },
            '10': { valor: -49500, percentual: -10.0 }
          }
        },
        {
          categoria: 'Marketing',
          tipo: 'despesa',
          nivel: 2,
          valores: {
            '08': { valor: -24250, percentual: -5.0 },
            '09': { valor: -26000, percentual: -5.0 },
            '10': { valor: -24750, percentual: -5.0 }
          }
        },
        {
          categoria: 'Outras Despesas',
          tipo: 'despesa',
          nivel: 2,
          valores: {
            '08': { valor: -24250, percentual: -5.0 },
            '09': { valor: -26000, percentual: -5.0 },
            '10': { valor: -24750, percentual: -5.0 }
          }
        },

        // EBITDA
        {
          categoria: 'EBITDA',
          tipo: 'resultado',
          nivel: 1,
          valores: {
            '08': { valor: 160050, percentual: 33.0 },
            '09': { valor: 171600, percentual: 33.0 },
            '10': { valor: 163350, percentual: 33.0 }
          }
        }
      ];

      const mockIndicadores: IndicadoresEstrategicos = {
        breakeven: 295000,
        margem_contribuicao: 73.0,
        projecao_lucro: 165000,
        meta_faturamento: 500000
      };

      setDreData(mockDREData);
      setIndicadores(mockIndicadores);
    } catch (error) {
      console.error('Erro ao carregar dados DRE:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da DRE",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const getRowStyle = (item: DREItem) => {
    switch (item.tipo) {
      case 'receita':
        return item.nivel === 1 
          ? 'bg-green-50 border-green-200 text-green-900 font-bold' 
          : 'bg-green-25 text-green-800';
      case 'custo':
        return item.nivel === 1 
          ? 'bg-red-50 border-red-200 text-red-900 font-bold' 
          : 'bg-red-25 text-red-800';
      case 'despesa':
        return item.nivel === 1 
          ? 'bg-orange-50 border-orange-200 text-orange-900 font-bold' 
          : 'bg-orange-25 text-orange-800';
      case 'resultado':
        return 'bg-blue-50 border-blue-200 text-blue-900 font-bold border-2';
      default:
        return 'bg-white';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orçamentação DRE</h1>
            <p className="text-gray-600 mt-1">Demonstrativo de Resultado do Exercício</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              {anoSelecionado}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={loading}
              className="border-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Indicadores Estratégicos */}
        {indicadores && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm text-blue-900">Breakeven</h3>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  <AnimatedCurrency value={indicadores.breakeven} />
                </div>
                <p className="text-xs text-blue-700 mt-1">Ponto de equilíbrio</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm text-green-900">Margem Contribuição</h3>
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {indicadores.margem_contribuicao.toFixed(1)}%
                </div>
                <p className="text-xs text-green-700 mt-1">Margem sobre vendas</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm text-purple-900">Projeção Lucro</h3>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  <AnimatedCurrency value={indicadores.projecao_lucro} />
                </div>
                <p className="text-xs text-purple-700 mt-1">Lucro esperado</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm text-orange-900">Meta Faturamento</h3>
                  <DollarSign className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  <AnimatedCurrency value={indicadores.meta_faturamento} />
                </div>
                <p className="text-xs text-orange-700 mt-1">Objetivo mensal</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DRE - Formato Tradicional */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900">DRE - Comparativo Mensal</CardTitle>
            <p className="text-sm text-gray-600">Valores absolutos e percentuais sobre receita bruta</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm min-w-[200px]">
                      Conta
                    </th>
                    {mesesSelecionados.map((mes) => (
                      <th key={mes} className="text-center py-4 px-4 font-semibold text-gray-900 text-sm min-w-[140px]">
                        <div>{mesesNomes[mes as keyof typeof mesesNomes]} {anoSelecionado}</div>
                        <div className="text-xs text-gray-500 font-normal">Valor | %</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dreData.map((item, index) => (
                    <tr key={index} className={`${getRowStyle(item)} hover:opacity-90 transition-opacity`}>
                      <td className={`py-4 px-6 ${item.nivel === 2 ? 'pl-12' : ''} ${item.nivel === 1 || item.tipo === 'resultado' ? 'font-bold' : 'font-medium'}`}>
                        {item.categoria}
                      </td>
                      {mesesSelecionados.map((mes) => {
                        const dados = item.valores[mes];
                        if (!dados) return <td key={mes} className="py-4 px-4 text-center">-</td>;
                        
                        return (
                          <td key={mes} className="py-4 px-4 text-center">
                            <div className={`${item.nivel === 1 || item.tipo === 'resultado' ? 'font-bold' : 'font-medium'}`}>
                              {dados.valor < 0 ? '-' : ''}{formatCurrency(dados.valor)}
                            </div>
                            <div className="text-xs opacity-75">
                              {dados.percentual > 0 ? '+' : ''}{dados.percentual.toFixed(1)}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Executivo */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Análise de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Margem EBITDA:</span>
                  <span className="font-semibold text-green-600">33.0%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Crescimento MoM:</span>
                  <span className="font-semibold text-blue-600">+7.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Eficiência Operacional:</span>
                  <span className="font-semibold text-purple-600">Excelente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Manter margem de contribuição</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Otimizar custos variáveis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Aumentar ticket médio</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

