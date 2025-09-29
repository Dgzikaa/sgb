'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { 
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  BarChart3,
  LineChart,
  Users,
  Clock
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';

interface HorarioSemanalData {
  hora: number;
  hora_formatada: string;
  faturamento_atual: number;
  faturamento_semana1: number;
  faturamento_semana2: number;
  faturamento_semana3: number;
  media_4_semanas: number;
  // Adicionar as datas para mostrar no tooltip
  data_atual?: string;
  data_semana1?: string;
  data_semana2?: string;
  data_semana3?: string;
  // Novos campos para suportar múltiplas datas
  todas_datas?: { [data: string]: number };
  datas_ordenadas?: string[];
}

interface EstatisticasSemana {
  total_faturamento_atual: number;
  total_faturamento_semana1: number;
  total_faturamento_semana2: number;
  total_faturamento_semana3: number;
  media_total_4_semanas: number;
  horario_pico_atual: number;
  horario_pico_media: number;
  crescimento_vs_semana_anterior: number;
  crescimento_vs_media: number;
  data_atual: string;
  data_semana1: string;
  data_semana2: string;
  data_semana3: string;
}

interface ResumoPorData {
  data: string;
  data_formatada: string;
  dia_semana: string;
  total_faturamento: number;
  horario_pico: number;
  horario_pico_valor: number;
  produto_mais_vendido: string;
  produto_mais_vendido_qtd: number;
  produto_mais_vendido_valor: number;
  total_produtos_vendidos: number;
  produtos_unicos: number;
}

interface DadosValorTotal {
  mes: string;
  mes_completo: string;
  dia_semana: string;
  data_completa: string;
  data_formatada: string;
  valor_total: number;
  cor_index: number;
  cor: string;
  sextas_detalhes?: { data: string, valor: number }[];
  // Propriedades dos dias da semana para modo multidimensional
  dom?: number;
  seg?: number;
  ter?: number;
  qua?: number;
  qui?: number;
  sex?: number;
  sab?: number;
  [key: string]: any; // Para permitir propriedades dinâmicas
}

interface LinhaVisibilidade {
  atual: boolean;
  semana1: boolean;
  semana2: boolean;
  semana3: boolean;
  media: boolean;
}

const DIAS_SEMANA = [
  { value: 'todos', label: 'Todos os Dias' },
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' }
];

const MESES_OPCOES = [
  { value: '2025-09', label: 'Setembro 2025' },
  { value: '2025-08', label: 'Agosto 2025' },
  { value: '2025-07', label: 'Julho 2025' },
  { value: '2025-06', label: 'Junho 2025' },
  { value: '2025-05', label: 'Maio 2025' },
  { value: '2025-04', label: 'Abril 2025' },
  { value: '2025-03', label: 'Março 2025' },
  { value: '2025-02', label: 'Fevereiro 2025' },
  { value: '2025-01', label: 'Janeiro 2025' }
];

export function ComparativoSemanal() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [dados, setDados] = useState<HorarioSemanalData[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasSemana | null>(null);
  const [resumoPorData, setResumoPorData] = useState<ResumoPorData[]>([]);
  const [dadosValorTotal, setDadosValorTotal] = useState<DadosValorTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string>('todos'); // Todos os dias por padrão
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>(['2025-09']); // Apenas setembro por padrão
  const [modoComparacao, setModoComparacao] = useState<'individual' | 'mes_x_mes'>('individual'); // Modo Individual por padrão
  const [linhasVisiveis, setLinhasVisiveis] = useState<LinhaVisibilidade>({
    atual: true,
    semana1: true,
    semana2: true,
    semana3: true,
    media: true
  });

  // Estado dinâmico para controlar visibilidade de cada data individual
  const [linhasVisiveisDinamicas, setLinhasVisiveisDinamicas] = useState<{ [data: string]: boolean }>({});

  const toggleMes = (mes: string) => {
    setMesesSelecionados(prev => {
      if (prev.includes(mes)) {
        // Se já está selecionado, remove (mas mantém pelo menos 1)
        return prev.length > 1 ? prev.filter(m => m !== mes) : prev;
      } else {
        // Se não está selecionado, adiciona (máximo 4 meses para usar todas as linhas do gráfico)
        return prev.length < 4 ? [...prev, mes] : prev;
      }
    });
  };

  const carregarDados = async () => {
    if (!selectedBar?.id) return;
    
    setLoading(true);
    
    try {
      // 🎯 Usar os meses realmente selecionados pelo usuário
      const mesesParam = mesesSelecionados.join(',');
      console.log('🎯 Carregando dados para os meses selecionados:', mesesSelecionados);
      const response = await fetch(
        `/api/analitico/semanal-horario?barId=${selectedBar.id}&diaSemana=${diaSelecionado}&meses=${mesesParam}&modo=${modoComparacao}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('📊 Dados recebidos da API:', {
          horarios: result.data.horarios.slice(0, 2), // Mostrar apenas 2 horários para debug
          estatisticas: result.data.estatisticas
        });
        setDados(result.data.horarios);
        setEstatisticas(result.data.estatisticas);
        setResumoPorData(result.data.resumo_por_data || []);
        setDadosValorTotal(result.data.valor_total_por_mes || []);

        // Inicializar estado dinâmico para modo individual
        if (modoComparacao === 'individual' && result.data.horarios.length > 0 && result.data.horarios[0].datas_ordenadas) {
          inicializarLinhasDinamicas(result.data.horarios[0].datas_ordenadas);
        }
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao carregar dados semanais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados semanais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [selectedBar?.id, diaSelecionado, mesesSelecionados, modoComparacao]);

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

  // Função para alternar visibilidade de linhas dinâmicas (por data específica)
  const toggleLinhaDinamica = (data: string) => {
    setLinhasVisiveisDinamicas(prev => ({
      ...prev,
      [data]: !prev[data]
    }));
  };

  // Inicializar estado dinâmico quando dados chegarem
  const inicializarLinhasDinamicas = (datasOrdenadas: string[]) => {
    const novoEstado: { [data: string]: boolean } = {};
    datasOrdenadas.forEach(data => {
      novoEstado[data] = true; // Todas visíveis por padrão
    });
    setLinhasVisiveisDinamicas(novoEstado);
  };

  // Cores personalizadas para cada linha
  const cores = {
    atual: '#3B82F6', // Azul
    semana1: '#10B981', // Verde
    semana2: '#8B5CF6', // Roxo
    semana3: '#F59E0B', // Amarelo/Laranja
    media: '#EF4444', // Vermelho
  };

  // Paleta de cores para múltiplas datas (24 cores distintas)
  const paletaCores = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#A855F7',
    '#EAB308', '#DC2626', '#0EA5E9', '#65A30D', '#EA580C', '#BE185D',
    '#4F46E5', '#059669', '#7C3AED', '#CA8A04', '#B91C1C', '#0284C7'
  ];

  // Gerar cores dinâmicas baseadas nas datas encontradas
  const gerarCoresDinamicas = () => {
    if (modoComparacao === 'individual' && dados.length > 0 && dados[0].datas_ordenadas) {
      const datasEncontradas = dados[0].datas_ordenadas;
      const coresDinamicas: { [data: string]: string } = {};
      
      datasEncontradas.forEach((data, index) => {
        coresDinamicas[data] = paletaCores[index % paletaCores.length];
      });
      
      return coresDinamicas;
    }
    return {};
  };

  const coresDinamicas = gerarCoresDinamicas();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dadosHora = dados.find(d => d.hora_formatada === label);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {`${label}`}
          </p>
          
          {modoComparacao === 'individual' && dadosHora ? (
            // 🎯 CORREÇÃO: Modo Individual - Mostrar dados disponíveis
            <>
              {(() => {
                const coresPorDiaSemana = {
                  'Dom': '#EF4444', 'Seg': '#F59E0B', 'Ter': '#84CC16', 
                  'Qua': '#10B981', 'Qui': '#06B6D4', 'Sex': '#3B82F6', 'Sáb': '#8B5CF6'
                };
                
                const dadosPorDiaSemana = new Map<string, { valores: number[], cor: string }>();
                
                // 🎯 PRIMEIRO: Tentar usar campos dia_* (novo formato)
                Object.keys(dadosHora).forEach(key => {
                  if (key.startsWith('dia_') && dadosHora[key] > 0) {
                    const diaAbrev = key.replace('dia_', '');
                    const diaCapitalizado = diaAbrev.charAt(0).toUpperCase() + diaAbrev.slice(1);
                    
                    dadosPorDiaSemana.set(diaCapitalizado, {
                      valores: [dadosHora[key]],
                      cor: coresPorDiaSemana[diaCapitalizado] || '#6B7280'
                    });
                  }
                });
                
                // 🎯 FALLBACK: Se não há campos dia_*, usar dados individuais
                if (dadosPorDiaSemana.size === 0 && dadosHora.todas_datas && dadosHora.datas_ordenadas) {
                  Object.entries(dadosHora.todas_datas)
                    .filter(([data, valor]) => valor > 0)
                    .forEach(([data, valor]) => {
                      const dataObj = new Date(data + 'T12:00:00');
                      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                      const diaAbrev = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3);
                      
                      if (!dadosPorDiaSemana.has(diaAbrev)) {
                        dadosPorDiaSemana.set(diaAbrev, { 
                          valores: [], 
                          cor: coresPorDiaSemana[diaAbrev] || '#6B7280' 
                        });
                      }
                      dadosPorDiaSemana.get(diaAbrev)!.valores.push(valor);
                    });
                }
                
                // Se ainda não há dados, mostrar apenas o valor atual
                if (dadosPorDiaSemana.size === 0) {
                  const valorAtual = dadosHora.faturamento_atual || 0;
                  if (valorAtual > 0) {
                    return (
                      <p className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Atual: {formatarMoeda(valorAtual)}
                        </span>
                      </p>
                    );
                  }
                }
                
                // Mostrar dados por dia da semana
                return Array.from(dadosPorDiaSemana.entries())
                  .map(([diaAbrev, dados]) => {
                    const media = dados.valores.reduce((sum, val) => sum + val, 0) / dados.valores.length;
                    const count = dados.valores.length;
                    
                    return (
                      <p key={diaAbrev} className="text-sm flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dados.cor }}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {count > 1 
                            ? `${diaAbrev} (${count}x): ${formatarMoeda(media)}`
                            : `${diaAbrev}: ${formatarMoeda(media)}`
                          }
                        </span>
                      </p>
                    );
                  })
                  .sort((a, b) => {
                    // Ordenar por ordem dos dias da semana
                    const ordemDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                    const diaA = a.key as string;
                    const diaB = b.key as string;
                    return ordemDias.indexOf(diaA) - ordemDias.indexOf(diaB);
                  });
              })()}
              {dadosHora.media_4_semanas > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 pt-1 border-t border-gray-200 dark:border-gray-600">
                  {`Média Geral: ${formatarMoeda(dadosHora.media_4_semanas)}`}
                </p>
              )}
            </>
          ) : (
            // Modo Mês x Mês: Comportamento original
            payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => {
                let dataLabel = entry.name;
                
                if (modoComparacao === 'mes_x_mes') {
                  if (entry.dataKey === 'faturamento_atual') {
                    dataLabel = MESES_OPCOES.find(m => m.value === mesesSelecionados[0])?.label.split(' ')[0] || 'Mês 1';
                  } else if (entry.dataKey === 'faturamento_semana1') {
                    dataLabel = MESES_OPCOES.find(m => m.value === mesesSelecionados[1])?.label.split(' ')[0] || 'Mês 2';
                  } else if (entry.dataKey === 'faturamento_semana2') {
                    dataLabel = MESES_OPCOES.find(m => m.value === mesesSelecionados[2])?.label.split(' ')[0] || 'Mês 3';
                  } else if (entry.dataKey === 'faturamento_semana3') {
                    dataLabel = MESES_OPCOES.find(m => m.value === mesesSelecionados[3])?.label.split(' ')[0] || 'Mês 4';
                  } else if (entry.dataKey === 'media_4_semanas') {
                    dataLabel = 'Média Geral';
                  }
                }
                
                return (
                  <p key={index} style={{ color: entry.color }} className="text-sm">
                    {`${dataLabel}: ${formatarMoeda(entry.value)}`}
                  </p>
                );
              })
          )}
        </div>
      );
    }
    return null;
  };

  const formatarData = (data: string) => {
    // Adicionar horário para evitar problemas de timezone
    const date = new Date(data + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Loading Circle */}
            <div className="relative mx-auto mb-6">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-600 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Carregando dados da visão geral...
            </h3>
            
            {/* Subtitle */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aguarde um momento...
            </p>
            
            {/* Progress dots */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível para o dia selecionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Carregando dados</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Processando {mesesSelecionados.length} {mesesSelecionados.length === 1 ? 'mês' : 'meses'}...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header com seletor */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comparativo Semanal - {DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comparativo entre {mesesSelecionados.map(m => MESES_OPCOES.find(opt => opt.value === m)?.label.split(' ')[0]).join(' vs ')} (17h às 3h)
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Seletor de Modo */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo:</label>
            <select 
              value={modoComparacao} 
              onChange={(e) => {
                const value = e.target.value as 'individual' | 'mes_x_mes';
                setModoComparacao(value);
                // 🎯 Quando muda para Individual, resetar para apenas Setembro
                if (value === 'individual') {
                  setMesesSelecionados(['2025-09']);
                  console.log('🎯 Modo Individual: Resetado para apenas Setembro');
                }
                // 🎯 Quando muda para Mês x Mês, usar padrão completo
                else if (value === 'mes_x_mes') {
                  setMesesSelecionados(['2025-09', '2025-08', '2025-07', '2025-06', '2025-05', '2025-04']);
                  console.log('🎯 Modo Mês x Mês: Resetado para padrão completo');
                }
              }}
              className="bg-transparent text-sm text-gray-900 dark:text-white border-none outline-none"
            >
              <option value="individual" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Individual</option>
              <option value="mes_x_mes" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Mês x Mês</option>
            </select>
          </div>

          <Select value={diaSelecionado} onValueChange={setDiaSelecionado}>
            <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
              <SelectValue placeholder="Escolha o dia da semana" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {DIAS_SEMANA.map(dia => (
                <SelectItem 
                  key={dia.value} 
                  value={dia.value}
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  {dia.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Seleção de Meses - Sempre visível */}
          <div className="flex flex-wrap gap-2">
            {MESES_OPCOES.slice(0, 6).map(mes => (
              <label 
                key={mes.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                  mesesSelecionados.includes(mes.value)
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={mesesSelecionados.includes(mes.value)}
                  onChange={() => toggleMes(mes.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{mes.label.split(' ')[0]}</span>
              </label>
            ))}
          </div>
          
          <Button onClick={carregarDados} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Mais Recente</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {formatarMoeda(estatisticas.total_faturamento_atual)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarData(estatisticas.data_atual)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Média 4 Semanas</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {formatarMoeda(estatisticas.media_total_4_semanas)}
                  </p>
                  <p className={`text-xs ${estatisticas.crescimento_vs_media >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {estatisticas.crescimento_vs_media >= 0 ? '+' : ''}{estatisticas.crescimento_vs_media.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Horário Pico Atual</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {formatarHora(estatisticas.horario_pico_atual)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Média: {formatarHora(estatisticas.horario_pico_media)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">vs Último Similar</p>
                  <p className={`font-bold text-lg ${estatisticas.crescimento_vs_semana_anterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {estatisticas.crescimento_vs_semana_anterior >= 0 ? '+' : ''}{estatisticas.crescimento_vs_semana_anterior.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarData(estatisticas.data_atual)} vs {formatarData(estatisticas.data_semana1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Gráfico de Valor Total (ambos os modos) */}
      {dadosValorTotal.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="w-5 h-5" />
              {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos'
                ? 'Evolução por Dia da Semana'
                : modoComparacao === 'mes_x_mes' 
                  ? `Média Mensal - ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s`
                  : `Evolução Individual - ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s`
              }
          </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos'
                ? 'Comparativo de todos os dias da semana por mês'
                : modoComparacao === 'mes_x_mes'
                  ? `Média de todas as ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label.toLowerCase()}s por mês`
                  : `Valor individual de cada ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label.toLowerCase()} por data`
              }
            </CardDescription>
        </CardHeader>
        <CardContent>
            {/* 🎨 Legenda Estratégica Melhorada */}
            {dadosValorTotal.length > 0 && (
              <div className="mb-6">
                {/* Header da Legenda */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos' 
                      ? '📊 Evolução por Dia da Semana' 
                      : '📅 Evolução por Mês'
                    }
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {dadosValorTotal.length} {dadosValorTotal.length === 1 ? 'período' : 'períodos'}
                  </span>
                </div>
                
                {/* Legenda Organizada */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos' ? (
                      // Legenda para dias da semana - Layout em grid
                      ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => {
                        const cores = ['#EF4444', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];
                        const diasCompletos = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                        return (
                          <div key={dia} className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-gray-700/50">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: cores[index] }}
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {dia}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {diasCompletos[index]}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : modoComparacao === 'individual' && diaSelecionado === 'todos' ? (
                      // 🎯 FILTROS DE DIAS DA SEMANA para modo Individual
                      ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => {
                        const cores = ['#EF4444', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];
                        const diasCompletos = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                        const diaValue = index.toString(); // 0=Domingo, 1=Segunda, etc.
                        
                        return (
                          <label 
                            key={dia}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${
                              diaSelecionado === diaValue || diaSelecionado === 'todos'
                                ? 'bg-white dark:bg-gray-700 border-2 border-blue-300 dark:border-blue-600'
                                : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="diaSemana"
                              value={diaValue}
                              checked={diaSelecionado === diaValue}
                              onChange={() => setDiaSelecionado(diaValue)}
                              className="sr-only"
                            />
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: cores[index] }}
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {dia}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {diasCompletos[index]}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      // Legenda por mês - Layout melhorado
                      Array.from(new Set(dadosValorTotal.map(d => d.mes_completo)))
                        .sort()
                        .map(mesCompleto => {
                          const item = dadosValorTotal.find(d => d.mes_completo === mesCompleto);
                          const total = dadosValorTotal
                            .filter(d => d.mes_completo === mesCompleto)
                            .reduce((sum, d) => sum + d.valor_total, 0);
                          
                          return (
                            <div key={mesCompleto} className="flex items-center gap-3 p-3 rounded-md bg-white dark:bg-gray-700/50">
                              <div 
                                className="w-4 h-4 rounded-full shadow-sm"
                                style={{ backgroundColor: item?.cor || '#3B82F6' }}
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item?.mes || new Date(mesCompleto + '-01').toLocaleDateString('pt-BR', { 
                                    month: 'short', 
                                    year: 'numeric' 
                                  }).replace('.', '')}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatarMoeda(total)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                  
                  {/* Botão "Todos os Dias" para modo Individual */}
                  {modoComparacao === 'individual' && diaSelecionado !== 'todos' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiaSelecionado('todos')}
                        className="text-xs"
                      >
                        📊 Ver Todos os Dias
                      </Button>
                    </div>
                  )}
                </div>
                  </div>
                )}

            {/* 🎯 Layout Estratégico do Gráfico */}
            <div className="space-y-4">
              {/* 📊 Insights Estratégicos */}
              {dadosValorTotal.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos' ? (
                      // Insights para análise multidimensional
                      <>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {(() => {
                              // Encontrar dia da semana com maior faturamento médio
                              const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
                              const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                              let melhorDia = '';
                              let maiorMedia = 0;
                              
                              diasSemana.forEach((dia, index) => {
                                const valores = dadosValorTotal.map(d => d[dia] || 0).filter(v => v > 0);
                                const media = valores.length > 0 ? valores.reduce((sum, v) => sum + v, 0) / valores.length : 0;
                                if (media > maiorMedia) {
                                  maiorMedia = media;
                                  melhorDia = nomesDias[index];
                                }
                              });
                              
                              return melhorDia || 'Sex';
                            })()}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Melhor Dia da Semana</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {(() => {
                              const totals = dadosValorTotal.map(d => 
                                (d.dom || 0) + (d.seg || 0) + (d.ter || 0) + (d.qua || 0) + 
                                (d.qui || 0) + (d.sex || 0) + (d.sab || 0)
                              );
                              const crescimento = totals.length > 1 ? 
                                ((totals[totals.length - 1] - totals[0]) / totals[0] * 100) : 0;
                              return crescimento > 0 ? `+${crescimento.toFixed(1)}%` : `${crescimento.toFixed(1)}%`;
                            })()}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Evolução Total</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {dadosValorTotal.length}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Meses Analisados</p>
                </div>
              </>
            ) : (
                      // Insights para análise tradicional
                      <>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatarMoeda(Math.max(...dadosValorTotal.map(d => d.valor_total)))}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Maior Faturamento</p>
                </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatarMoeda(dadosValorTotal.reduce((sum, d) => sum + d.valor_total, 0) / dadosValorTotal.length)}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Média do Período</p>
                </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {(() => {
                              const valores = dadosValorTotal.map(d => d.valor_total);
                              const crescimento = valores.length > 1 ? 
                                ((valores[valores.length - 1] - valores[0]) / valores[0] * 100) : 0;
                              return crescimento > 0 ? `+${crescimento.toFixed(1)}%` : `${crescimento.toFixed(1)}%`;
                            })()}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Tendência</p>
                        </div>
                      </>
                    )}
                  </div>
                  </div>
                )}

              {/* Controles de Visualização Estratégica */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos' 
                        ? 'Análise Multidimensional' 
                        : 'Análise Temporal'
                      }
                    </span>
                  </div>
                  {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos' && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      7 dimensões ativas
                  </div>
                )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dadosValorTotal.length} pontos de dados
                </div>
              </div>
              
              <div className="h-80 relative">
                <ResponsiveContainer width="100%" height="100%">
                  {modoComparacao === 'mes_x_mes' && diaSelecionado === 'todos' ? (
                    // 🚀 LAYOUT ESTRATÉGICO: Múltiplas barras por dia da semana
                    <ComposedChart data={dadosValorTotal} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="data_formatada" 
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dadosComValor = payload.filter((entry: any) => entry.value > 0);
                          const totalMes = dadosComValor.reduce((sum: number, entry: any) => sum + entry.value, 0);
                          
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]">
                              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                                {label} - Todos os Dias
                              </p>
                              
                              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                                Total do Mês: {formatarMoeda(totalMes)}
                              </p>
                              
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Por dia da semana:</p>
                                {dadosComValor
                                  .sort((a: any, b: any) => b.value - a.value)
                                  .map((entry: any, index: number) => (
                                    <p key={index} className="text-xs text-gray-700 dark:text-gray-300 flex justify-between items-center">
                                      <span>
                                        <span style={{ color: entry.color }}>●</span> {entry.name}
                                      </span>
                                      <span className="font-medium">{formatarMoeda(entry.value)}</span>
                                    </p>
                                  ))
                                }
                </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Barras para cada dia da semana */}
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => {
                      const cores = ['#EF4444', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];
                      return (
                        <Bar
                          key={dia}
                          dataKey={dia.toLowerCase()}
                          name={dia}
                          fill={cores[index]}
                          opacity={0.8}
                        >
                          <LabelList 
                            dataKey={dia.toLowerCase()}
                            position="top" 
                            formatter={(value: number) => value > 0 ? `R$ ${(value / 1000).toFixed(0)}k` : ''}
                            className="text-xs fill-gray-600 dark:fill-gray-300"
                          />
                        </Bar>
                      );
                    })}
                  </ComposedChart>
                ) : (
                  // LAYOUT ORIGINAL: Uma barra por mês/data
                  <ComposedChart data={dadosValorTotal} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="data_formatada" 
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                                {modoComparacao === 'mes_x_mes' 
                                  ? `${data.mes} (Total do Mês)`
                                  : `${data.data_formatada} (${data.mes})`
                                }
                              </p>
                              
                              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                <strong>
                                  {modoComparacao === 'mes_x_mes' 
                                    ? `Média: ${formatarMoeda(data.valor_total)}`
                                    : `Total: ${formatarMoeda(data.valor_total)}`
                                  }
                                </strong>
                              </p>
                              
                              {modoComparacao === 'mes_x_mes' && data.sextas_detalhes && data.sextas_detalhes.length > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Valores individuais ({data.sextas_detalhes.length}x):
                                  </p>
                                  {data.sextas_detalhes
                                    .sort((a: any, b: any) => b.valor - a.valor)
                                    .map((sexta: any, index: number) => (
                                      <p key={index} className="text-xs text-gray-700 dark:text-gray-300">
                                        {sexta.data} - {formatarMoeda(sexta.valor)}
                                      </p>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="valor_total"
                      name={modoComparacao === 'mes_x_mes' 
                        ? `Média ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s por Mês`
                        : `${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s por Data`
                      }
                      opacity={0.8}
                    >
                      <LabelList 
                        dataKey="valor_total" 
                        position="top" 
                        formatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
                        className="text-xs fill-gray-600 dark:fill-gray-300"
                      />
                      {dadosValorTotal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Gráfico por Hora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <BarChart3 className="w-5 h-5" />
            {modoComparacao === 'individual' 
              ? `Evolução por Horário - Média por Dia da Semana`
              : `Evolução por Horário - ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s`
            }
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {modoComparacao === 'individual'
              ? `Faturamento médio por hora agrupado por dia da semana (17h às 3h)`
              : `Faturamento detalhado por hora (17h às 3h)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hora_formatada" 
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {modoComparacao === 'individual' && dados.length > 0 ? (
                  // 🎯 CORREÇÃO: Modo Individual - Renderizar apenas dias com dados
                  (() => {
                    const coresPorDiaSemana = {
                      'Dom': '#EF4444', 'Seg': '#F59E0B', 'Ter': '#84CC16', 
                      'Qua': '#10B981', 'Qui': '#06B6D4', 'Sex': '#3B82F6', 'Sáb': '#8B5CF6'
                    };
                    
                    // 🎯 NOVA LÓGICA: Verificar quais campos dia_* existem nos dados
                    const diasComDados = new Set<string>();
                    
                    // Verificar se há dados nos campos dia_*
                    dados.forEach(horario => {
                      Object.keys(horario).forEach(key => {
                        if (key.startsWith('dia_') && horario[key] > 0) {
                          const diaAbrev = key.replace('dia_', '');
                          const diaCapitalizado = diaAbrev.charAt(0).toUpperCase() + diaAbrev.slice(1);
                          diasComDados.add(diaCapitalizado);
                        }
                      });
                    });
                    
                    // Se não há campos dia_*, usar lógica de fallback com datas individuais
                    if (diasComDados.size === 0 && dados[0].datas_ordenadas) {
                      const datasPorDiaSemana = new Map<string, string[]>();
                      
                      dados[0].datas_ordenadas
                        .filter(data => linhasVisiveisDinamicas[data] !== false)
                        .forEach(data => {
                          const dataObj = new Date(data + 'T12:00:00');
                          const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                          const diaAbrev = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3);
                          
                          if (!datasPorDiaSemana.has(diaAbrev)) {
                            datasPorDiaSemana.set(diaAbrev, []);
                          }
                          datasPorDiaSemana.get(diaAbrev)!.push(data);
                        });
                      
                      // Renderizar usando dados individuais (modo antigo)
                      return Array.from(datasPorDiaSemana.entries()).map(([diaAbrev, datasDodia]) => {
                        const dataKey = `data_${datasDodia[0].replace(/-/g, '_')}`;
                        
                        return (
                          <Line
                            key={diaAbrev}
                            type="monotone"
                            dataKey={dataKey}
                            name={diaAbrev}
                            stroke={coresPorDiaSemana[diaAbrev] || '#6B7280'}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        );
                      });
                    }
                    
                    // 🎯 RENDERIZAR: Uma linha por dia da semana (apenas os que têm dados)
                    return Array.from(diasComDados).map(diaAbrev => {
                      const dataKey = `dia_${diaAbrev.toLowerCase()}`;
                      
                      return (
                        <Line
                          key={diaAbrev}
                          type="monotone"
                          dataKey={dataKey}
                          name={diaAbrev}
                          stroke={coresPorDiaSemana[diaAbrev] || '#6B7280'}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      );
                    });
                  })()
                ) : (
                  // Modo Mês x Mês: Comportamento original
                  <>
                    {linhasVisiveis.atual && (
                      <Bar
                        dataKey="faturamento_atual"
                        name={modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[0])?.label.split(' ')[0]}` : "Data 1"}
                        fill={cores.atual}
                        opacity={0.7}
                      />
                    )}

                    {linhasVisiveis.semana1 && (
                      <Line
                        type="monotone"
                        dataKey="faturamento_semana1"
                        name={modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[1])?.label.split(' ')[0]}` : "Data 2"}
                        stroke={cores.semana1}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    )}

                    {linhasVisiveis.semana2 && (modoComparacao !== 'mes_x_mes' || mesesSelecionados.length > 2) && (
                      <Line
                        type="monotone"
                        dataKey="faturamento_semana2"
                        name={modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[2])?.label.split(' ')[0] || 'Mês 3'}` : "Data 3"}
                        stroke={cores.semana2}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    )}

                    {linhasVisiveis.semana3 && (modoComparacao !== 'mes_x_mes' || mesesSelecionados.length > 3) && (
                      <Line
                        type="monotone"
                        dataKey="faturamento_semana3"
                        name={modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[3])?.label.split(' ')[0] || 'Mês 4'}` : "Data 4"}
                        stroke={cores.semana3}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    )}
                  </>
                )}

                {linhasVisiveis.media && (
                  <Line
                    type="monotone"
                    dataKey="media_4_semanas"
                    name={modoComparacao === 'mes_x_mes' ? "Média Geral" : "Média 4 Semanas"}
                    stroke={cores.media}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 5 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Data - Apenas no modo Individual */}
      {modoComparacao === 'individual' && resumoPorData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="w-5 h-5" />
              Resumo por Data
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Detalhes de cada {DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label.toLowerCase()} selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {resumoPorData.map((resumo, index) => (
                <div 
                  key={resumo.data} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  {/* Header da Data */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: coresDinamicas[resumo.data] || paletaCores[index % paletaCores.length] }}
                      ></div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {resumo.data_formatada}
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {resumo.dia_semana}
                    </Badge>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Faturamento:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatarMoeda(resumo.total_faturamento)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Horário Pico:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {resumo.horario_pico.toString().padStart(2, '0')}:00
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Produtos:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {resumo.total_produtos_vendidos.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Top Produto:</p>
                      <p className="font-medium text-gray-900 dark:text-white text-xs leading-tight">
                        {resumo.produto_mais_vendido.length > 25 
                          ? `${resumo.produto_mais_vendido.substring(0, 25)}...` 
                          : resumo.produto_mais_vendido
                        }
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {resumo.produto_mais_vendido_qtd}x • {formatarMoeda(resumo.produto_mais_vendido_valor)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}