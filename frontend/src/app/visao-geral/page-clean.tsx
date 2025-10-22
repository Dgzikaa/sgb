'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Users,
  DollarSign,
  Star,
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';
import { AnimatedCounter, AnimatedCurrency } from '@/components/ui/animated-counter';

interface BigNumber {
  label: string;
  value: number;
  meta?: number;
  format: 'currency' | 'number' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface WeekData {
  semana: string;
  periodo: string;
  faturamento: number;
  meta_faturamento: number;
  clientes: number;
  ticket_medio: number;
  nps?: number;
  avaliacao_google?: number;
  pesquisa_felicidade?: number;
}

export default function VisaoGeralCleanPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [bigNumbers, setBigNumbers] = useState<BigNumber[]>([]);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('mes-atual');

  useEffect(() => {
    setPageTitle('📊 Insights Zykor');
  }, [setPageTitle]);

  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    setLoading(true);
    try {
      // Simular dados para demonstração - depois conectar com API real
      const mockBigNumbers: BigNumber[] = [
        {
          label: 'Faturamento Mensal',
          value: 485000,
          meta: 450000,
          format: 'currency',
          trend: 'up',
          color: 'green'
        },
        {
          label: 'Clientes Atendidos',
          value: 2847,
          meta: 2500,
          format: 'number',
          trend: 'up',
          color: 'blue'
        },
        {
          label: 'Ticket Médio',
          value: 170.50,
          meta: 165.00,
          format: 'currency',
          trend: 'up',
          color: 'purple'
        },
        {
          label: 'NPS Score',
          value: 78,
          meta: 75,
          format: 'number',
          trend: 'up',
          color: 'orange'
        },
        {
          label: 'Avaliação Google',
          value: 4.6,
          meta: 4.5,
          format: 'number',
          trend: 'up',
          color: 'green'
        },
        {
          label: 'Pesquisa Felicidade',
          value: 8.2,
          meta: 8.0,
          format: 'number',
          trend: 'up',
          color: 'blue'
        }
      ];

      const mockWeekData: WeekData[] = [
        {
          semana: 'S40',
          periodo: '30/09 - 06/10',
          faturamento: 125000,
          meta_faturamento: 112500,
          clientes: 742,
          ticket_medio: 168.50,
          nps: 76,
          avaliacao_google: 4.5,
          pesquisa_felicidade: 8.1
        },
        {
          semana: 'S41',
          periodo: '07/10 - 13/10',
          faturamento: 118000,
          meta_faturamento: 112500,
          clientes: 695,
          ticket_medio: 169.80,
          nps: 79,
          avaliacao_google: 4.6,
          pesquisa_felicidade: 8.3
        },
        {
          semana: 'S42',
          periodo: '14/10 - 20/10',
          faturamento: 132000,
          meta_faturamento: 112500,
          clientes: 778,
          ticket_medio: 169.70,
          nps: 81,
          avaliacao_google: 4.7,
          pesquisa_felicidade: 8.4
        },
        {
          semana: 'S43',
          periodo: '21/10 - 27/10',
          faturamento: 110000,
          meta_faturamento: 112500,
          clientes: 632,
          ticket_medio: 174.05,
          nps: 75,
          avaliacao_google: 4.6,
          pesquisa_felicidade: 8.0
        }
      ];

      setBigNumbers(mockBigNumbers);
      setWeekData(mockWeekData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900',
      red: 'bg-red-50 border-red-200 text-red-900'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900">Insights Zykor</h1>
            <p className="text-gray-600 mt-1">Visão executiva simplificada</p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Big Numbers - Principais Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {bigNumbers.map((item, index) => (
            <Card key={index} className={`${getColorClasses(item.color)} border-2`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">{item.label}</h3>
                  {getTrendIcon(item.trend)}
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {item.format === 'currency' ? (
                      <AnimatedCurrency value={item.value} />
                    ) : item.format === 'percentage' ? (
                      <AnimatedCounter value={item.value} suffix="%" decimals={1} />
                    ) : (
                      <AnimatedCounter value={item.value} />
                    )}
                  </div>
                  {item.meta && (
                    <div className="text-sm text-gray-600">
                      Meta: {formatValue(item.meta, item.format)}
                      <span className={`ml-2 ${item.value >= item.meta ? 'text-green-600' : 'text-red-600'}`}>
                        ({item.value >= item.meta ? '+' : ''}{((item.value / item.meta - 1) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela Semanal - Formato Familiar */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Performance Semanal</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Semanas organizadas horizontalmente como no Excel</p>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                Outubro 2024
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Indicador</th>
                    {weekData.map((week) => (
                      <th key={week.semana} className="text-center py-4 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                        <div>{week.semana}</div>
                        <div className="text-xs text-gray-500 font-normal">{week.periodo}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Faturamento */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Faturamento Total</td>
                    {weekData.map((week) => (
                      <td key={`fat-${week.semana}`} className="py-4 px-4 text-center">
                        <div className="font-semibold text-gray-900">
                          {formatValue(week.faturamento, 'currency')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Meta: {formatValue(week.meta_faturamento, 'currency')}
                        </div>
                        <Badge 
                          variant={week.faturamento >= week.meta_faturamento ? "default" : "destructive"}
                          className="text-xs mt-1"
                        >
                          {week.faturamento >= week.meta_faturamento ? '✓' : '✗'}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* Clientes */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Clientes Atendidos</td>
                    {weekData.map((week) => (
                      <td key={`cli-${week.semana}`} className="py-4 px-4 text-center">
                        <div className="font-semibold text-gray-900">
                          {week.clientes.toLocaleString('pt-BR')}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Ticket Médio */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Ticket Médio</td>
                    {weekData.map((week) => (
                      <td key={`tm-${week.semana}`} className="py-4 px-4 text-center">
                        <div className="font-semibold text-gray-900">
                          {formatValue(week.ticket_medio, 'currency')}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* NPS */}
                  <tr className="hover:bg-gray-50 bg-blue-25">
                    <td className="py-4 px-6 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        NPS Score
                      </div>
                    </td>
                    {weekData.map((week) => (
                      <td key={`nps-${week.semana}`} className="py-4 px-4 text-center">
                        <div className="font-semibold text-blue-700">
                          {week.nps || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Avaliação Google */}
                  <tr className="hover:bg-gray-50 bg-green-25">
                    <td className="py-4 px-6 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-600" />
                        Avaliação Google
                      </div>
                    </td>
                    {weekData.map((week) => (
                      <td key={`google-${week.semana}`} className="py-4 px-4 text-center">
                        <div className="font-semibold text-green-700">
                          {week.avaliacao_google || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Pesquisa Felicidade */}
                  <tr className="hover:bg-gray-50 bg-purple-25">
                    <td className="py-4 px-6 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        Pesquisa Felicidade
                      </div>
                    </td>
                    {weekData.map((week) => (
                      <td key={`felicidade-${week.semana}`} className="py-4 px-4 text-center">
                        <div className="font-semibold text-purple-700">
                          {week.pesquisa_felicidade || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Planejamento Comercial</h3>
              <p className="text-sm text-gray-600">Ver detalhes completos</p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Orçamentação</h3>
              <p className="text-sm text-gray-600">Formato DRE</p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Desempenho</h3>
              <p className="text-sm text-gray-600">Tabela invertida</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

