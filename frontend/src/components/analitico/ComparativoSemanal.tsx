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
  ResponsiveContainer
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
  valor_total: number;
  cor_index: number;
}

interface LinhaVisibilidade {
  atual: boolean;
  semana1: boolean;
  semana2: boolean;
  semana3: boolean;
  media: boolean;
}

const DIAS_SEMANA = [
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
  const [diaSelecionado, setDiaSelecionado] = useState<string>('5'); // Sexta-feira por padrão
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>(['2025-09', '2025-08']); // Setembro e Agosto por padrão
  const [modoComparacao, setModoComparacao] = useState<'individual' | 'mes_x_mes'>('mes_x_mes'); // Novo modo
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
      const mesesParam = mesesSelecionados.join(',');
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
          
          {modoComparacao === 'individual' && dadosHora?.todas_datas && dadosHora?.datas_ordenadas ? (
            // Modo Individual: Mostrar TODAS as datas
            <>
              {Object.entries(dadosHora.todas_datas)
                .filter(([data, valor]) => valor > 0) // Só mostrar datas com valor
                .sort(([, a], [, b]) => b - a) // Ordenar por valor decrescente
                .map(([data, valor], index) => (
                  <p key={index} className="text-sm flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: coresDinamicas[data] || '#6B7280' }}
                    ></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {`${formatarData(data)}: ${formatarMoeda(valor)}`}
                    </span>
                  </p>
                ))}
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
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
    <div className="space-y-6">
      {/* Header com seletor */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comparativo Semanal - {DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comparativo entre {mesesSelecionados.map(m => MESES_OPCOES.find(opt => opt.value === m)?.label.split(' ')[0]).join(' vs ')} (17h às 3h) - v2.1
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Seletor de Modo */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo:</label>
            <select 
              value={modoComparacao} 
              onChange={(e) => setModoComparacao(e.target.value as 'individual' | 'mes_x_mes')}
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
          
          <Button onClick={carregarDados} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
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
                  <p className="text-xs text-gray-600 dark:text-gray-400">vs Anterior</p>
                  <p className={`font-bold text-lg ${estatisticas.crescimento_vs_semana_anterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {estatisticas.crescimento_vs_semana_anterior >= 0 ? '+' : ''}{estatisticas.crescimento_vs_semana_anterior.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarData(estatisticas.data_semana1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <LineChart className="w-5 h-5" />
            Filtros do Gráfico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {modoComparacao === 'individual' && dados.length > 0 && dados[0].datas_ordenadas ? (
              // Filtros dinâmicos para cada data no modo individual
              <>
                {dados[0].datas_ordenadas.map((data, index) => (
                  <div key={data} className="flex items-center space-x-2">
                    <Switch
                      id={`linha-data-${data}`}
                      checked={linhasVisiveisDinamicas[data] !== false} // Padrão true se não definido
                      onCheckedChange={() => toggleLinhaDinamica(data)}
                    />
                    <Label htmlFor={`linha-data-${data}`} className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: coresDinamicas[data] || paletaCores[index % paletaCores.length] }}></div>
                      {formatarData(data)}
                    </Label>
                  </div>
                ))}
                
                {/* Sempre mostrar filtro da média */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="linha-media"
                    checked={linhasVisiveis.media}
                    onCheckedChange={() => toggleLinha('media')}
                  />
                  <Label htmlFor="linha-media" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cores.media }}></div>
                    Média Total
                  </Label>
                </div>
              </>
            ) : (
              // Filtros fixos para modo mês x mês
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="linha-atual"
                    checked={linhasVisiveis.atual}
                    onCheckedChange={() => toggleLinha('atual')}
                  />
                  <Label htmlFor="linha-atual" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cores.atual }}></div>
                    {modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[0])?.label.split(' ')[0] || 'Mês 1'}` : 'Data 1'}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="linha-semana1"
                    checked={linhasVisiveis.semana1}
                    onCheckedChange={() => toggleLinha('semana1')}
                  />
                  <Label htmlFor="linha-semana1" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cores.semana1 }}></div>
                    {modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[1])?.label.split(' ')[0] || 'Mês 2'}` : 'Data 2'}
                  </Label>
                </div>

                {(modoComparacao !== 'mes_x_mes' || mesesSelecionados.length > 2) && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linha-semana2"
                      checked={linhasVisiveis.semana2}
                      onCheckedChange={() => toggleLinha('semana2')}
                    />
                    <Label htmlFor="linha-semana2" className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: cores.semana2 }}></div>
                      {modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[2])?.label.split(' ')[0] || 'Mês 3'}` : 'Data 3'}
                    </Label>
                  </div>
                )}

                {(modoComparacao !== 'mes_x_mes' || mesesSelecionados.length > 3) && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linha-semana3"
                      checked={linhasVisiveis.semana3}
                      onCheckedChange={() => toggleLinha('semana3')}
                    />
                    <Label htmlFor="linha-semana3" className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: cores.semana3 }}></div>
                      {modoComparacao === 'mes_x_mes' ? `Média ${MESES_OPCOES.find(m => m.value === mesesSelecionados[3])?.label.split(' ')[0] || 'Mês 4'}` : 'Data 4'}
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="linha-media"
                    checked={linhasVisiveis.media}
                    onCheckedChange={() => toggleLinha('media')}
                  />
                  <Label htmlFor="linha-media" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cores.media }}></div>
                    {modoComparacao === 'mes_x_mes' ? "Média Geral" : "Média Total"}
                  </Label>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Valor Total por Mês (Modo Mês x Mês) */}
      {modoComparacao === 'mes_x_mes' && dadosValorTotal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="w-5 h-5" />
              Evolução Mensal - {DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Comparativo do valor total de cada {DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label.toLowerCase()} por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosValorTotal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs"
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatarMoeda(value), `${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s`]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="valor_total"
                    name={`Total ${DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s`}
                    fill="#3B82F6"
                    opacity={0.8}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico por Hora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <BarChart3 className="w-5 h-5" />
            Evolução por Horário - {DIAS_SEMANA.find(d => d.value === diaSelecionado)?.label}s
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Faturamento detalhado por hora (17h às 3h)
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

                {modoComparacao === 'individual' && dados.length > 0 && dados[0].datas_ordenadas ? (
                  // Modo Individual: Renderizar linha para cada data dinamicamente (apenas se visível)
                  dados[0].datas_ordenadas
                    .filter(data => linhasVisiveisDinamicas[data] !== false) // Só renderizar se visível
                    .map((data, index) => {
                      const cor = coresDinamicas[data] || paletaCores[index % paletaCores.length];
                      const nomeData = formatarData(data);
                      
                      return (
                        <Line
                          key={data}
                          type="monotone"
                          dataKey={`data_${data.replace(/-/g, '_')}`}
                          name={nomeData}
                          stroke={cor}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      );
                    })
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