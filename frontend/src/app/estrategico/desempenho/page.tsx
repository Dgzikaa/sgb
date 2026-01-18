'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  Star,
  ShoppingCart,
  Megaphone,
  Wallet,
  BarChart3,
  Calendar,
  RefreshCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Tipos
interface DadosSemana {
  numero_semana: number;
  ano: number;
  data_inicio: string;
  data_fim: string;
  // Indicadores Estratégicos - GUARDRAIL
  faturamento_total: number;
  faturamento_entrada: number;
  faturamento_bar: number;
  faturamento_cmovivel: number;
  cmv_rs: number;
  ticket_medio: number;
  tm_entrada: number;
  tm_bar: number;
  cmv_limpo: number;
  cmv_global_real: number;
  cmv_teorico: number;
  cmo: number;
  custo_atracao_faturamento: number;
  // Indicadores Estratégicos - OVT
  retencao_1m: number;
  retencao_2m: number;
  perc_clientes_novos: number;
  clientes_atendidos: number;
  clientes_ativos: number;
  reservas_totais: number;
  reservas_presentes: number;
  // Cockpit Financeiro
  imposto: number;
  comissao: number;
  cmv: number;
  freelas: number;
  cmo_fixo_simulacao: number;
  alimentacao: number;
  cmo_custo: number;
  pro_labore: number;
  rh_estorno_outros_operacao: number;
  materiais: number;
  manutencao: number;
  atracoes_eventos: number;
  utensilios: number;
  // Indicadores de Qualidade
  avaliacoes_5_google_trip: number;
  media_avaliacoes_google: number;
  nps_reservas: number;
  nota_felicidade_equipe: number;
  // Cockpit Produtos
  stockout_comidas: number;
  stockout_drinks: number;
  stockout_bar: number;
  perc_bebidas: number;
  perc_drinks: number;
  perc_comida: number;
  perc_happy_hour: number;
  qtde_itens_bar: number;
  atrasos_bar: number;
  tempo_saida_bar: number;
  qtde_itens_cozinha: number;
  atrasos_cozinha: number;
  tempo_saida_cozinha: number;
  // Cockpit Vendas
  perc_faturamento_ate_19h: number;
  venda_balcao: number;
  couvert_atracoes: number;
  qui_sab_dom: number;
  // Cockpit Marketing - Orgânico
  o_num_posts: number;
  o_alcance: number;
  o_interacao: number;
  o_compartilhamento: number;
  o_engajamento: number;
  o_num_stories: number;
  o_visu_stories: number;
  // Cockpit Marketing - Meta
  m_valor_investido: number;
  m_alcance: number;
  m_frequencia: number;
  m_cpm: number;
  m_cliques: number;
  m_ctr: number;
  m_custo_por_clique: number;
  m_conversas_iniciadas: number;
}

// Componente de Indicador Individual
interface IndicadorProps {
  label: string;
  valor: number | null;
  valorAnterior?: number | null;
  formato?: 'moeda' | 'percentual' | 'numero' | 'decimal';
  inverso?: boolean; // Se true, menor é melhor (ex: CMV)
  sufixo?: string;
}

function Indicador({ label, valor, valorAnterior, formato = 'numero', inverso = false, sufixo = '' }: IndicadorProps) {
  const formatarValor = (v: number | null) => {
    if (v === null || v === undefined) return '-';
    
    switch (formato) {
      case 'moeda':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
      case 'percentual':
        return `${v.toFixed(1)}%`;
      case 'decimal':
        return v.toFixed(2) + sufixo;
      default:
        return v.toLocaleString('pt-BR') + sufixo;
    }
  };

  // Calcular variação
  const variacao = valorAnterior && valor ? ((valor - valorAnterior) / valorAnterior) * 100 : null;
  const temVariacao = variacao !== null && !isNaN(variacao) && isFinite(variacao);
  
  // Determinar se a variação é positiva (considerando se é inverso)
  const variacaoPositiva = inverso ? (variacao && variacao < 0) : (variacao && variacao > 0);
  const variacaoNegativa = inverso ? (variacao && variacao > 0) : (variacao && variacao < 0);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatarValor(valor)}
        </span>
        {temVariacao && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
            variacaoPositiva && "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30",
            variacaoNegativa && "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30",
            !variacaoPositiva && !variacaoNegativa && "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
          )}>
            {variacaoPositiva && <TrendingUp className="w-3 h-3" />}
            {variacaoNegativa && <TrendingDown className="w-3 h-3" />}
            {!variacaoPositiva && !variacaoNegativa && <Minus className="w-3 h-3" />}
            <span>{Math.abs(variacao!).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de Seção Colapsável
interface SecaoProps {
  titulo: string;
  icone: React.ReactNode;
  corGradiente: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Secao({ titulo, icone, corGradiente, children, defaultOpen = true }: SecaoProps) {
  const [aberto, setAberto] = useState(defaultOpen);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <CardHeader 
        className={cn("py-3 px-4 cursor-pointer", corGradiente)}
        onClick={() => setAberto(!aberto)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icone}
            <CardTitle className="text-sm font-semibold text-white">{titulo}</CardTitle>
          </div>
          {aberto ? (
            <ChevronUp className="w-4 h-4 text-white/80" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/80" />
          )}
        </div>
      </CardHeader>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-700">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Função para calcular a semana ISO do ano
function getSemanaISO(data: Date): { semana: number; ano: number } {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  // Ajustar para quinta-feira da semana (ISO 8601)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Primeiro dia do ano
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calcular número da semana
  const semana = Math.ceil((((d.getTime() - inicioAno.getTime()) / 86400000) + 1) / 7);
  return { semana, ano: d.getUTCFullYear() };
}

export default function DesempenhoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'semanal' | 'mensal'>('semanal');
  const [loading, setLoading] = useState(true);
  
  // Calcular semana atual dinamicamente
  const semanaInicialCalc = useMemo(() => getSemanaISO(new Date()), []);
  
  // Estados para visão semanal
  const [semanaAtual, setSemanaAtual] = useState<number>(semanaInicialCalc.semana);
  const [anoAtual, setAnoAtual] = useState<number>(semanaInicialCalc.ano);
  const [dadosSemana, setDadosSemana] = useState<DadosSemana | null>(null);
  const [dadosSemanaAnterior, setDadosSemanaAnterior] = useState<DadosSemana | null>(null);
  const [totalSemanas, setTotalSemanas] = useState<number>(53);
  
  // Estados para visão mensal
  const [mesAtual, setMesAtual] = useState<number>(new Date().getMonth() + 1);
  const [anoMensal, setAnoMensal] = useState<number>(new Date().getFullYear());
  const [dadosMes, setDadosMes] = useState<any | null>(null);
  const [dadosMesAnterior, setDadosMesAnterior] = useState<any | null>(null);
  const [qtdSemanasMes, setQtdSemanasMes] = useState<number>(0);
  
  const nomesMeses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Formatar data
  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Carregar dados da semana
  const carregarDadosSemanal = useCallback(async () => {
    if (!selectedBar || !user) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/estrategico/desempenho/semana?semana=${semanaAtual}&ano=${anoAtual}`,
        {
          headers: {
            'x-user-data': encodeURIComponent(JSON.stringify({ ...user, bar_id: selectedBar?.id }))
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao carregar dados');
      
      const data = await response.json();
      setDadosSemana(data.semana || null);
      setDadosSemanaAnterior(data.semanaAnterior || null);
      setTotalSemanas(data.totalSemanas || 53);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, user?.id, semanaAtual, anoAtual]);

  // Carregar dados do mês
  const carregarDadosMensal = useCallback(async () => {
    if (!selectedBar || !user) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/estrategico/desempenho/mensal?mes=${mesAtual}&ano=${anoMensal}`,
        {
          headers: {
            'x-user-data': encodeURIComponent(JSON.stringify({ ...user, bar_id: selectedBar?.id }))
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao carregar dados mensais');
      
      const data = await response.json();
      setDadosMes(data.mes || null);
      setDadosMesAnterior(data.mesAnterior || null);
      setQtdSemanasMes(data.quantidadeSemanas || 0);
    } catch (error) {
      console.error('Erro ao carregar dados mensais:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, user?.id, mesAtual, anoMensal]);

  // Função unificada para carregar dados
  const carregarDados = useCallback(() => {
    if (activeTab === 'semanal') {
      carregarDadosSemanal();
    } else {
      carregarDadosMensal();
    }
  }, [activeTab, carregarDadosSemanal, carregarDadosMensal]);

  // Navegação semanal
  const navegarSemana = (direcao: 'anterior' | 'proxima') => {
    if (direcao === 'anterior') {
      if (semanaAtual === 1) {
        setSemanaAtual(53);
        setAnoAtual(prev => prev - 1);
      } else {
        setSemanaAtual(prev => prev - 1);
      }
    } else {
      if (semanaAtual === 53) {
        setSemanaAtual(1);
        setAnoAtual(prev => prev + 1);
      } else {
        setSemanaAtual(prev => prev + 1);
      }
    }
  };

  // Navegação mensal
  const navegarMes = (direcao: 'anterior' | 'proxima') => {
    if (direcao === 'anterior') {
      if (mesAtual === 1) {
        setMesAtual(12);
        setAnoMensal(prev => prev - 1);
      } else {
        setMesAtual(prev => prev - 1);
      }
    } else {
      if (mesAtual === 12) {
        setMesAtual(1);
        setAnoMensal(prev => prev + 1);
      } else {
        setMesAtual(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    setPageTitle('📊 Desempenho');
  }, [setPageTitle]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Recarregar ao mudar de aba
  useEffect(() => {
    carregarDados();
  }, [activeTab]);

  // Dados ativos baseados na aba selecionada
  const dadosAtivos = activeTab === 'semanal' ? dadosSemana : dadosMes;
  const dadosAnteriores = activeTab === 'semanal' ? dadosSemanaAnterior : dadosMesAnterior;

  // Verificar seleção de bar
  if (!selectedBar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-white dark:bg-gray-800 p-8 text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Selecione um Bar
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha um bar no seletor acima para visualizar os indicadores de desempenho.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header com navegação */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[98vw] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'semanal' | 'mensal')}>
              <TabsList className="bg-gray-100 dark:bg-gray-700">
                <TabsTrigger value="semanal" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Semanal
                </TabsTrigger>
                <TabsTrigger value="mensal" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Mensal
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Navegação de Semana/Mês */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => activeTab === 'semanal' ? navegarSemana('anterior') : navegarMes('anterior')}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="min-w-[200px] text-center">
                {activeTab === 'semanal' ? (
                  <>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      Semana {semanaAtual.toString().padStart(2, '0')}
                    </div>
                    {dadosAtivos && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatarData(dadosAtivos.data_inicio)} a {formatarData(dadosAtivos.data_fim)}/{anoAtual}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {nomesMeses[mesAtual]} {anoMensal}
                    </div>
                    {qtdSemanasMes > 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {qtdSemanasMes} semanas consolidadas
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => activeTab === 'semanal' ? navegarSemana('proxima') : navegarMes('proxima')}
                className="h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Botão Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[98vw] mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : !dadosAtivos ? (
          <Card className="bg-white dark:bg-gray-800 p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sem dados para {activeTab === 'semanal' ? 'esta semana' : 'este mês'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'semanal' 
                ? `Não há dados de desempenho registrados para a Semana ${semanaAtual} de ${anoAtual}.`
                : `Não há dados de desempenho registrados para ${nomesMeses[mesAtual]} de ${anoMensal}.`
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {/* GUARDRAIL - Indicadores Estratégicos */}
            <Secao
              titulo="GUARDRAIL - Estratégicos"
              icone={<DollarSign className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Indicador label="Faturamento Total" valor={dadosAtivos.faturamento_total} valorAnterior={dadosAnteriores?.faturamento_total} formato="moeda" />
              <Indicador label="Faturamento Couvert" valor={dadosAtivos.faturamento_entrada} valorAnterior={dadosAnteriores?.faturamento_entrada} formato="moeda" />
              <Indicador label="Faturamento Bar" valor={dadosAtivos.faturamento_bar} valorAnterior={dadosAnteriores?.faturamento_bar} formato="moeda" />
              <Indicador label="Faturamento CMvível" valor={dadosAtivos.faturamento_cmovivel} valorAnterior={dadosAnteriores?.faturamento_cmovivel} formato="moeda" />
              <Indicador label="CMV R$" valor={dadosAtivos.cmv_rs} valorAnterior={dadosAnteriores?.cmv_rs} formato="moeda" inverso />
              <Indicador label="Ticket Médio ContaHub" valor={dadosAtivos.ticket_medio} valorAnterior={dadosAnteriores?.ticket_medio} formato="moeda" />
              <Indicador label="TM Entrada" valor={dadosAtivos.tm_entrada} valorAnterior={dadosAnteriores?.tm_entrada} formato="moeda" />
              <Indicador label="TM Bar" valor={dadosAtivos.tm_bar} valorAnterior={dadosAnteriores?.tm_bar} formato="moeda" />
              <Indicador label="CMV Limpo %" valor={dadosAtivos.cmv_limpo} valorAnterior={dadosAnteriores?.cmv_limpo} formato="percentual" inverso />
              <Indicador label="CMV Global Real" valor={dadosAtivos.cmv_global_real} valorAnterior={dadosAnteriores?.cmv_global_real} formato="percentual" inverso />
              <Indicador label="CMV Teórico" valor={dadosAtivos.cmv_teorico} valorAnterior={dadosAnteriores?.cmv_teorico} formato="percentual" inverso />
              <Indicador label="CMO %" valor={dadosAtivos.cmo} valorAnterior={dadosAnteriores?.cmo} formato="percentual" inverso />
              <Indicador label="Atração/Faturamento" valor={dadosAtivos.custo_atracao_faturamento} valorAnterior={dadosAnteriores?.custo_atracao_faturamento} formato="percentual" inverso />
            </Secao>

            {/* OVT - Clientes + Qualidade */}
            <Secao
              titulo="OVT - Clientes & Qualidade"
              icone={<Users className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <Indicador label="Retenção 1 mês" valor={dadosAtivos.retencao_1m} valorAnterior={dadosAnteriores?.retencao_1m} formato="percentual" />
              <Indicador label="Retenção 2 meses" valor={dadosAtivos.retencao_2m} valorAnterior={dadosAnteriores?.retencao_2m} formato="percentual" />
              <Indicador label="% Novos Clientes" valor={dadosAtivos.perc_clientes_novos} valorAnterior={dadosAnteriores?.perc_clientes_novos} formato="percentual" />
              <Indicador label="Visitas" valor={dadosAtivos.clientes_atendidos} valorAnterior={dadosAnteriores?.clientes_atendidos} />
              <Indicador label="Clientes Ativos" valor={dadosAtivos.clientes_ativos} valorAnterior={dadosAnteriores?.clientes_ativos} />
              <Indicador label="Reservas Totais" valor={dadosAtivos.reservas_totais} valorAnterior={dadosAnteriores?.reservas_totais} />
              <Indicador label="Reservas Presentes" valor={dadosAtivos.reservas_presentes} valorAnterior={dadosAnteriores?.reservas_presentes} />
              <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
                  <Star className="w-3 h-3" /> Qualidade
                </span>
              </div>
              <Indicador label="Avaliações 5★ Google/Trip" valor={dadosAtivos.avaliacoes_5_google_trip} valorAnterior={dadosAnteriores?.avaliacoes_5_google_trip} />
              <Indicador label="Média Avaliações Google" valor={dadosAtivos.media_avaliacoes_google} valorAnterior={dadosAnteriores?.media_avaliacoes_google} formato="decimal" />
              <Indicador label="NPS Reservas" valor={dadosAtivos.nps_reservas} valorAnterior={dadosAnteriores?.nps_reservas} />
              <Indicador label="NPS Felicidade Equipe" valor={dadosAtivos.nota_felicidade_equipe} valorAnterior={dadosAnteriores?.nota_felicidade_equipe} />
            </Secao>

            {/* Cockpit Financeiro */}
            <Secao
              titulo="Cockpit Financeiro"
              icone={<Wallet className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-violet-600 to-violet-700"
              defaultOpen={true}
            >
              <Indicador label="Imposto (7%)" valor={dadosAtivos.imposto} valorAnterior={dadosAnteriores?.imposto} formato="moeda" inverso />
              <Indicador label="Comissão" valor={dadosAtivos.comissao} valorAnterior={dadosAnteriores?.comissao} formato="moeda" inverso />
              <Indicador label="CMV" valor={dadosAtivos.cmv} valorAnterior={dadosAnteriores?.cmv} formato="moeda" inverso />
              <Indicador label="Freelas" valor={dadosAtivos.freelas} valorAnterior={dadosAnteriores?.freelas} formato="moeda" inverso />
              <Indicador label="CMO Fixo Simulação" valor={dadosAtivos.cmo_fixo_simulacao} valorAnterior={dadosAnteriores?.cmo_fixo_simulacao} formato="moeda" inverso />
              <Indicador label="Alimentação" valor={dadosAtivos.alimentacao} valorAnterior={dadosAnteriores?.alimentacao} formato="moeda" inverso />
              <Indicador label="Pró-Labore" valor={dadosAtivos.pro_labore} valorAnterior={dadosAnteriores?.pro_labore} formato="moeda" inverso />
              <Indicador label="RH+Estorno+Outros" valor={dadosAtivos.rh_estorno_outros_operacao} valorAnterior={dadosAnteriores?.rh_estorno_outros_operacao} formato="moeda" inverso />
              <Indicador label="Materiais" valor={dadosAtivos.materiais} valorAnterior={dadosAnteriores?.materiais} formato="moeda" inverso />
              <Indicador label="Manutenção" valor={dadosAtivos.manutencao} valorAnterior={dadosAnteriores?.manutencao} formato="moeda" inverso />
              <Indicador label="Atrações/Eventos" valor={dadosAtivos.atracoes_eventos} valorAnterior={dadosAnteriores?.atracoes_eventos} formato="moeda" inverso />
              <Indicador label="Utensílios" valor={dadosAtivos.utensilios} valorAnterior={dadosAnteriores?.utensilios} formato="moeda" inverso />
            </Secao>

            {/* Cockpit Produtos */}
            <Secao
              titulo="Cockpit Produtos"
              icone={<ShoppingCart className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-orange-500 to-orange-600"
              defaultOpen={true}
            >
              <Indicador label="StockOut Comidas" valor={dadosAtivos.stockout_comidas} valorAnterior={dadosAnteriores?.stockout_comidas} inverso />
              <Indicador label="StockOut Drinks" valor={dadosAtivos.stockout_drinks} valorAnterior={dadosAnteriores?.stockout_drinks} inverso />
              <Indicador label="StockOut Bar" valor={dadosAtivos.stockout_bar} valorAnterior={dadosAnteriores?.stockout_bar} inverso />
              <Indicador label="% Bebidas" valor={dadosAtivos.perc_bebidas} valorAnterior={dadosAnteriores?.perc_bebidas} formato="percentual" />
              <Indicador label="% Drinks" valor={dadosAtivos.perc_drinks} valorAnterior={dadosAnteriores?.perc_drinks} formato="percentual" />
              <Indicador label="% Comida" valor={dadosAtivos.perc_comida} valorAnterior={dadosAnteriores?.perc_comida} formato="percentual" />
              <Indicador label="% Happy Hour" valor={dadosAtivos.perc_happy_hour} valorAnterior={dadosAnteriores?.perc_happy_hour} formato="percentual" />
              <Indicador label="Qtde Itens Bar" valor={dadosAtivos.qtde_itens_bar} valorAnterior={dadosAnteriores?.qtde_itens_bar} />
              <Indicador label="Atrasos Bar" valor={dadosAtivos.atrasos_bar} valorAnterior={dadosAnteriores?.atrasos_bar} inverso />
              <Indicador label="Tempo Saída Bar" valor={dadosAtivos.tempo_saida_bar} valorAnterior={dadosAnteriores?.tempo_saida_bar} formato="decimal" sufixo=" min" inverso />
              <Indicador label="Qtde Itens Cozinha" valor={dadosAtivos.qtde_itens_cozinha} valorAnterior={dadosAnteriores?.qtde_itens_cozinha} />
              <Indicador label="Atrasos Cozinha" valor={dadosAtivos.atrasos_cozinha} valorAnterior={dadosAnteriores?.atrasos_cozinha} inverso />
              <Indicador label="Tempo Saída Cozinha" valor={dadosAtivos.tempo_saida_cozinha} valorAnterior={dadosAnteriores?.tempo_saida_cozinha} formato="decimal" sufixo=" min" inverso />
            </Secao>

            {/* Cockpit Vendas + Marketing */}
            <Secao
              titulo="Vendas & Marketing"
              icone={<Megaphone className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-pink-500 to-pink-600"
              defaultOpen={true}
            >
              {/* Vendas */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vendas</span>
              </div>
              <Indicador label="% Fat. até 19h" valor={dadosAtivos.perc_faturamento_ate_19h} valorAnterior={dadosAnteriores?.perc_faturamento_ate_19h} formato="percentual" />
              <Indicador label="Venda Balcão" valor={dadosAtivos.venda_balcao} valorAnterior={dadosAnteriores?.venda_balcao} formato="moeda" />
              <Indicador label="Couvert / Atrações" valor={dadosAtivos.couvert_atracoes} valorAnterior={dadosAnteriores?.couvert_atracoes} formato="moeda" />
              <Indicador label="QUI+SÁB+DOM" valor={dadosAtivos.qui_sab_dom} valorAnterior={dadosAnteriores?.qui_sab_dom} formato="moeda" />
              
              {/* Marketing Orgânico */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Marketing Orgânico</span>
              </div>
              <Indicador label="Nº de Posts" valor={dadosAtivos.o_num_posts} valorAnterior={dadosAnteriores?.o_num_posts} />
              <Indicador label="Alcance" valor={dadosAtivos.o_alcance} valorAnterior={dadosAnteriores?.o_alcance} />
              <Indicador label="Interação" valor={dadosAtivos.o_interacao} valorAnterior={dadosAnteriores?.o_interacao} />
              <Indicador label="Compartilhamento" valor={dadosAtivos.o_compartilhamento} valorAnterior={dadosAnteriores?.o_compartilhamento} />
              <Indicador label="Engajamento" valor={dadosAtivos.o_engajamento} valorAnterior={dadosAnteriores?.o_engajamento} formato="percentual" />
              <Indicador label="Nº Stories" valor={dadosAtivos.o_num_stories} valorAnterior={dadosAnteriores?.o_num_stories} />
              <Indicador label="Visu Stories" valor={dadosAtivos.o_visu_stories} valorAnterior={dadosAnteriores?.o_visu_stories} />
              
              {/* Marketing Pago */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Marketing Pago (Meta)</span>
              </div>
              <Indicador label="Valor Investido" valor={dadosAtivos.m_valor_investido} valorAnterior={dadosAnteriores?.m_valor_investido} formato="moeda" />
              <Indicador label="Alcance" valor={dadosAtivos.m_alcance} valorAnterior={dadosAnteriores?.m_alcance} />
              <Indicador label="Frequência" valor={dadosAtivos.m_frequencia} valorAnterior={dadosAnteriores?.m_frequencia} formato="decimal" />
              <Indicador label="CPM" valor={dadosAtivos.m_cpm} valorAnterior={dadosAnteriores?.m_cpm} formato="moeda" inverso />
              <Indicador label="Cliques" valor={dadosAtivos.m_cliques} valorAnterior={dadosAnteriores?.m_cliques} />
              <Indicador label="CTR" valor={dadosAtivos.m_ctr} valorAnterior={dadosAnteriores?.m_ctr} formato="percentual" />
              <Indicador label="Custo por Clique" valor={dadosAtivos.m_custo_por_clique} valorAnterior={dadosAnteriores?.m_custo_por_clique} formato="moeda" inverso />
              <Indicador label="Conversas Iniciadas" valor={dadosAtivos.m_conversas_iniciadas} valorAnterior={dadosAnteriores?.m_conversas_iniciadas} />
            </Secao>
          </div>
        )}
      </div>
    </div>
  );
}
