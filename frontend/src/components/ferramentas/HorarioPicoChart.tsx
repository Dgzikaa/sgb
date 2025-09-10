'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUpIcon, 
  UsersIcon, 
  DollarSignIcon, 
  RefreshCwIcon,
  AlertCircleIcon,
  EyeIcon,
  TrendingDownIcon,
  BarChart3Icon,
  LineChartIcon
} from 'lucide-react';

interface HorarioPicoData {
  hora: number;
  faturamento: number;
  transacoes: number;
  faturamento_semana_passada: number;
  media_ultimas_4: number;
  recorde_faturamento: number;
}

interface Estatisticas {
  total_faturamento: number;
  total_faturamento_semana_passada: number;
  total_media_ultimas_4: number;
  total_recorde: number;
  hora_pico_faturamento: number;
  max_faturamento: number;
  total_pessoas_dia: number;
  total_couvert: number;
  total_pagamentos: number;
  total_repique: number;
  faturamento_total_calculado: number;
  total_produtos_vendidos: number;
  produto_mais_vendido: string | null;
  produto_mais_vendido_qtd: number;
  produto_mais_faturou: string | null;
  produto_mais_faturou_valor: number;
  produtos_ranking: Array<{
    produto: string;
    quantidade: number;
    valor: number;
  }>;
  data_recorde: string;
  comparacao_semana_passada: number;
  comparacao_media_ultimas_4: number;
  comparacao_recorde: number;
}

interface LinhaVisibilidade {
  faturamento: boolean;
  semana_passada: boolean;
  media_ultimas_4: boolean;
  recorde: boolean;
}

interface HorarioPicoChartProps {
  dataSelecionada: string;
  onDataChange?: (data: string) => void;
}

export function HorarioPicoChart({ dataSelecionada, onDataChange }: HorarioPicoChartProps) {
  const [dados, setDados] = useState<HorarioPicoData[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [diaSemana, setDiaSemana] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInput, setDataInput] = useState(dataSelecionada);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [linhasVisiveis, setLinhasVisiveis] = useState<LinhaVisibilidade>({
    faturamento: true,
    semana_passada: true,
    media_ultimas_4: true,
    recorde: true
  });

  // Sincronizar estado interno com prop
  useEffect(() => {
    setDataInput(dataSelecionada);
  }, [dataSelecionada]);

  // Cleanup do timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Função para lidar com mudança de data no input
  const handleInputDataChange = (novaData: string) => {
    setDataInput(novaData);
    
    // Limpar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Se a data está completa, é válida e diferente da atual
    if (novaData && novaData.length === 10) {
      const dataObj = new Date(novaData + 'T00:00:00');
      if (!isNaN(dataObj.getTime()) && novaData !== dataSelecionada) {
        // Debounce bem curto - funciona para navegação e seleção
        timerRef.current = setTimeout(() => {
          onDataChange?.(novaData);
        }, 300);
      }
    }
  };

  const buscarDados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ferramentas/horario-pico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_selecionada: dataSelecionada,
          bar_id: 3
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Processar dados para o gráfico
        const dadosProcessados = result.data.horario_pico.map((item: any) => ({
          ...item,
          hora_formatada: `${item.hora.toString().padStart(2, '0')}:00`
        }));

        setDados(dadosProcessados);
        setEstatisticas(result.data.estatisticas);
        setDiaSemana(result.data.dia_semana);
      } else {
        setError(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataSelecionada) {
      buscarDados();
    }
  }, [dataSelecionada]);

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarHora = (hora: number) => {
    return `${hora.toString().padStart(2, '0')}:00`;
  };

  const toggleLinha = (linha: keyof LinhaVisibilidade) => {
    setLinhasVisiveis(prev => ({
      ...prev,
      [linha]: !prev[linha]
    }));
  };

  // Cores personalizadas para cada linha
  const cores = {
    faturamento: '#3B82F6', // Azul
    presenca: '#EF4444', // Vermelho
    semana_passada: '#10B981', // Verde
    media_ultimas_4: '#8B5CF6', // Roxo
    recorde: '#F59E0B', // Amarelo/Laranja
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[250px]">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {`Horário: ${label}`}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span style={{ color: entry.color }} className="font-medium">
                  {entry.name}:
                </span>
                <span className="ml-2 font-semibold text-white">
                  {entry.name === 'pessoas_presentes' 
                    ? `${entry.value} pessoas`
                    : formatarMoeda(entry.value)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={buscarDados} variant="outline">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3Icon className="w-6 h-6" />
                Horário de Pico - {diaSemana}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Análise de faturamento e presença por hora • {dataSelecionada}
              </CardDescription>
            </div>
            {/* Seletor de Data integrado */}
            <div className="flex items-center gap-2">
              <Label htmlFor="data-grafico" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Data:
              </Label>
              <Input
                id="data-grafico"
                type="date"
                value={dataInput}
                onChange={(e) => handleInputDataChange(e.target.value)}
                className="w-40 input-dark"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles de Visibilidade */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              Controles de Visualização
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="faturamento"
                  checked={linhasVisiveis.faturamento}
                  onCheckedChange={() => toggleLinha('faturamento')}
                />
                <Label htmlFor="faturamento" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  ● Faturamento Atual
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="semana_passada"
                  checked={linhasVisiveis.semana_passada}
                  onCheckedChange={() => toggleLinha('semana_passada')}
                />
                <Label htmlFor="semana_passada" className="text-sm font-medium text-green-600 dark:text-green-400">
                  ● Semana Passada
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="media_ultimas_4"
                  checked={linhasVisiveis.media_ultimas_4}
                  onCheckedChange={() => toggleLinha('media_ultimas_4')}
                />
                <Label htmlFor="media_ultimas_4" className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  ● Média 4 Semanas
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="recorde"
                  checked={linhasVisiveis.recorde}
                  onCheckedChange={() => toggleLinha('recorde')}
                />
                <Label htmlFor="recorde" className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  ● Recorde ({diaSemana})
                </Label>
              </div>
            </div>
          </div>

          {/* Resumo do Dia */}
          {estatisticas && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <BarChart3Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">⭐ Resumo do Dia - {dataSelecionada}</h3>
              </div>
              
              {/* Linha única com todas as métricas */}
              <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                {/* Produto Top */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Produto Top</p>
                  </div>
                  <p className="text-sm font-bold text-green-900 dark:text-green-100">
                    {estatisticas.produto_mais_vendido ? 
                      (estatisticas.produto_mais_vendido.length > 20 ? 
                        estatisticas.produto_mais_vendido.substring(0, 20) + '...' : 
                        estatisticas.produto_mais_vendido
                      ) : 'N/A'
                    }
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {estatisticas.produto_mais_vendido_qtd > 0 ? `${Math.round(estatisticas.produto_mais_vendido_qtd)} unidades` : 'Mais vendido'}
                  </p>
                </div>

                {/* Faturamento Top */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSignIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Faturamento Top</p>
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    {formatarMoeda(estatisticas.produto_mais_faturou_valor || 0)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {estatisticas.produto_mais_faturou ? 
                      (estatisticas.produto_mais_faturou.length > 15 ? 
                        estatisticas.produto_mais_faturou.substring(0, 15) + '...' : 
                        estatisticas.produto_mais_faturou
                      ) : 'Produto que mais faturou'
                    }
                  </p>
                </div>

                {/* Total do Dia */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSignIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Total do Dia</p>
                  </div>
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                    {formatarMoeda((estatisticas.total_faturamento || 0) + (estatisticas.total_couvert || 0) + (estatisticas.total_repique || 0))}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Faturamento total</p>
                </div>

                {/* Pico Faturamento */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <LineChartIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Pico Faturamento</p>
                  </div>
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                    {estatisticas.max_faturamento > 0 ? formatarHora(estatisticas.hora_pico_faturamento || 0) : '--:--'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {estatisticas.max_faturamento > 0 ? formatarMoeda(estatisticas.max_faturamento) : 'R$ 0,00'}
                  </p>
                </div>

                {/* Produtos Vendidos */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <UsersIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Produtos Vendidos</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{Math.round(estatisticas.total_produtos_vendidos || 0)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Unidades totais</p>
                </div>

                {/* Faturamento Produto */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSignIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Produtos</p>
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    {formatarMoeda(estatisticas.total_faturamento)}
                  </p>
                </div>

                {/* Couvert */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Couvert</p>
                  </div>
                  <p className="text-sm font-bold text-green-900 dark:text-green-100">
                    {formatarMoeda(estatisticas.total_couvert || 0)}
                  </p>
                </div>

                {/* 10% Garçom */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <UsersIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">10% Garçom</p>
                  </div>
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                    {formatarMoeda(estatisticas.total_repique || 0)}
                  </p>
                </div>

                {/* Total Pessoas */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <UsersIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Pessoas</p>
                  </div>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                    {estatisticas.total_pessoas_dia || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hora_formatada" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="faturamento"
                  orientation="left"
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Barras de Faturamento */}
                {linhasVisiveis.faturamento && (
                  <Bar
                    yAxisId="faturamento"
                    dataKey="faturamento"
                    fill={cores.faturamento}
                    name="Faturamento Atual"
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.8}
                  />
                )}
                
                {/* Linha Semana Passada */}
                {linhasVisiveis.semana_passada && (
                  <Line
                    yAxisId="faturamento"
                    type="monotone"
                    dataKey="faturamento_semana_passada"
                    stroke={cores.semana_passada}
                    strokeWidth={3}
                    name="Semana Passada"
                    dot={{ fill: cores.semana_passada, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: cores.semana_passada, strokeWidth: 2 }}
                  />
                )}
                
                {/* Linha Média 4 Semanas */}
                {linhasVisiveis.media_ultimas_4 && (
                  <Line
                    yAxisId="faturamento"
                    type="monotone"
                    dataKey="media_ultimas_4"
                    stroke={cores.media_ultimas_4}
                    strokeWidth={3}
                    strokeDasharray="8 8"
                    name="Média 4 Semanas"
                    dot={{ fill: cores.media_ultimas_4, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: cores.media_ultimas_4, strokeWidth: 2 }}
                  />
                )}
                
                {/* Linha Recorde */}
                {linhasVisiveis.recorde && (
                  <Line
                    yAxisId="faturamento"
                    type="monotone"
                    dataKey="recorde_faturamento"
                    stroke={cores.recorde}
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    name={`Recorde (${diaSemana})`}
                    dot={{ fill: cores.recorde, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: cores.recorde, strokeWidth: 2 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Cards de Comparação */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${
                estatisticas.comparacao_semana_passada >= 0 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {estatisticas.comparacao_semana_passada >= 0 ? (
                    <TrendingUpIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDownIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      estatisticas.comparacao_semana_passada >= 0 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      vs. Semana Passada
                    </p>
                    <p className={`text-lg font-bold ${
                      estatisticas.comparacao_semana_passada >= 0 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {estatisticas.comparacao_semana_passada >= 0 ? '+' : ''}
                      {formatarMoeda(estatisticas.comparacao_semana_passada)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                estatisticas.comparacao_media_ultimas_4 >= 0 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {estatisticas.comparacao_media_ultimas_4 >= 0 ? (
                    <TrendingUpIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDownIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      estatisticas.comparacao_media_ultimas_4 >= 0 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      vs. Média 4 Semanas
                    </p>
                    <p className={`text-lg font-bold ${
                      estatisticas.comparacao_media_ultimas_4 >= 0 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {estatisticas.comparacao_media_ultimas_4 >= 0 ? '+' : ''}
                      {formatarMoeda(estatisticas.comparacao_media_ultimas_4)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                estatisticas.comparacao_recorde >= 0 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {estatisticas.comparacao_recorde >= 0 ? (
                    <TrendingUpIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDownIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      estatisticas.comparacao_recorde >= 0 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      vs. Recorde ({diaSemana})
                    </p>
                    <p className={`text-lg font-bold ${
                      estatisticas.comparacao_recorde >= 0 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {estatisticas.comparacao_recorde >= 0 ? '+' : ''}
                      {formatarMoeda(estatisticas.comparacao_recorde)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}