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
  cmo_custo: number;
  pro_labore: number;
  ocupacao: number;
  adm_fixo: number;
  marketing_fixo: number;
  escritorio_central: number;
  adm_mkt_semana: number;
  rh_estorno_outros_operacao: number;
  materiais: number;
  manutencao: number;
  atracoes_eventos: number;
  utensilios: number;
  consumacao_sem_socio: number;
  lucro_rs: number;
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

export default function DesempenhoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'semanal' | 'mensal'>('semanal');
  const [loading, setLoading] = useState(true);
  const [semanaAtual, setSemanaAtual] = useState<number>(2); // Semana atual
  const [anoAtual, setAnoAtual] = useState<number>(2026);
  const [dadosSemana, setDadosSemana] = useState<DadosSemana | null>(null);
  const [dadosSemanaAnterior, setDadosSemanaAnterior] = useState<DadosSemana | null>(null);
  const [totalSemanas, setTotalSemanas] = useState<number>(53);

  // Formatar data
  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Carregar dados da semana
  const carregarDados = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBar?.id, user?.id, semanaAtual, anoAtual]);

  // Navegação
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

  useEffect(() => {
    setPageTitle('📊 Desempenho');
  }, [setPageTitle]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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
        <div className="max-w-7xl mx-auto px-4 py-3">
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

            {/* Navegação de Semana */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navegarSemana('anterior')}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="min-w-[200px] text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  Semana {semanaAtual.toString().padStart(2, '0')}
                </div>
                {dadosSemana && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatarData(dadosSemana.data_inicio)} a {formatarData(dadosSemana.data_fim)}/{anoAtual}
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navegarSemana('proxima')}
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : !dadosSemana ? (
          <Card className="bg-white dark:bg-gray-800 p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sem dados para esta semana
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Não há dados de desempenho registrados para a Semana {semanaAtual} de {anoAtual}.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* GUARDRAIL - Indicadores Estratégicos */}
            <Secao
              titulo="GUARDRAIL - Estratégicos"
              icone={<DollarSign className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Indicador label="Faturamento Total" valor={dadosSemana.faturamento_total} valorAnterior={dadosSemanaAnterior?.faturamento_total} formato="moeda" />
              <Indicador label="Faturamento Couvert" valor={dadosSemana.faturamento_entrada} valorAnterior={dadosSemanaAnterior?.faturamento_entrada} formato="moeda" />
              <Indicador label="Faturamento Bar" valor={dadosSemana.faturamento_bar} valorAnterior={dadosSemanaAnterior?.faturamento_bar} formato="moeda" />
              <Indicador label="Faturamento CMvível" valor={dadosSemana.faturamento_cmovivel} valorAnterior={dadosSemanaAnterior?.faturamento_cmovivel} formato="moeda" />
              <Indicador label="CMV R$" valor={dadosSemana.cmv_rs} valorAnterior={dadosSemanaAnterior?.cmv_rs} formato="moeda" inverso />
              <Indicador label="Ticket Médio ContaHub" valor={dadosSemana.ticket_medio} valorAnterior={dadosSemanaAnterior?.ticket_medio} formato="moeda" />
              <Indicador label="TM Entrada" valor={dadosSemana.tm_entrada} valorAnterior={dadosSemanaAnterior?.tm_entrada} formato="moeda" />
              <Indicador label="TM Bar" valor={dadosSemana.tm_bar} valorAnterior={dadosSemanaAnterior?.tm_bar} formato="moeda" />
              <Indicador label="CMV Limpo %" valor={dadosSemana.cmv_limpo} valorAnterior={dadosSemanaAnterior?.cmv_limpo} formato="percentual" inverso />
              <Indicador label="CMV Global Real" valor={dadosSemana.cmv_global_real} valorAnterior={dadosSemanaAnterior?.cmv_global_real} formato="percentual" inverso />
              <Indicador label="CMV Teórico" valor={dadosSemana.cmv_teorico} valorAnterior={dadosSemanaAnterior?.cmv_teorico} formato="percentual" inverso />
              <Indicador label="CMO %" valor={dadosSemana.cmo} valorAnterior={dadosSemanaAnterior?.cmo} formato="percentual" inverso />
              <Indicador label="Atração/Faturamento" valor={dadosSemana.custo_atracao_faturamento} valorAnterior={dadosSemanaAnterior?.custo_atracao_faturamento} formato="percentual" inverso />
            </Secao>

            {/* OVT - Indicadores Estratégicos */}
            <Secao
              titulo="OVT - Clientes"
              icone={<Users className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <Indicador label="Retenção 1 mês" valor={dadosSemana.retencao_1m} valorAnterior={dadosSemanaAnterior?.retencao_1m} formato="percentual" />
              <Indicador label="Retenção 2 meses" valor={dadosSemana.retencao_2m} valorAnterior={dadosSemanaAnterior?.retencao_2m} formato="percentual" />
              <Indicador label="% Novos Clientes" valor={dadosSemana.perc_clientes_novos} valorAnterior={dadosSemanaAnterior?.perc_clientes_novos} formato="percentual" />
              <Indicador label="Visitas" valor={dadosSemana.clientes_atendidos} valorAnterior={dadosSemanaAnterior?.clientes_atendidos} />
              <Indicador label="Clientes Ativos" valor={dadosSemana.clientes_ativos} valorAnterior={dadosSemanaAnterior?.clientes_ativos} />
              <Indicador label="Reservas Totais" valor={dadosSemana.reservas_totais} valorAnterior={dadosSemanaAnterior?.reservas_totais} />
              <Indicador label="Reservas Presentes" valor={dadosSemana.reservas_presentes} valorAnterior={dadosSemanaAnterior?.reservas_presentes} />
            </Secao>

            {/* Indicadores de Qualidade */}
            <Secao
              titulo="Qualidade"
              icone={<Star className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-amber-500 to-amber-600"
            >
              <Indicador label="Avaliações 5★ Google/Trip" valor={dadosSemana.avaliacoes_5_google_trip} valorAnterior={dadosSemanaAnterior?.avaliacoes_5_google_trip} />
              <Indicador label="Média Avaliações Google" valor={dadosSemana.media_avaliacoes_google} valorAnterior={dadosSemanaAnterior?.media_avaliacoes_google} formato="decimal" />
              <Indicador label="NPS Reservas" valor={dadosSemana.nps_reservas} valorAnterior={dadosSemanaAnterior?.nps_reservas} />
              <Indicador label="NPS Felicidade Equipe" valor={dadosSemana.nota_felicidade_equipe} valorAnterior={dadosSemanaAnterior?.nota_felicidade_equipe} />
            </Secao>

            {/* Cockpit Financeiro */}
            <Secao
              titulo="Cockpit Financeiro"
              icone={<Wallet className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-violet-600 to-violet-700"
              defaultOpen={false}
            >
              <Indicador label="Imposto" valor={dadosSemana.imposto} valorAnterior={dadosSemanaAnterior?.imposto} formato="moeda" inverso />
              <Indicador label="Comissão" valor={dadosSemana.comissao} valorAnterior={dadosSemanaAnterior?.comissao} formato="moeda" inverso />
              <Indicador label="CMV" valor={dadosSemana.cmv} valorAnterior={dadosSemanaAnterior?.cmv} formato="moeda" inverso />
              <Indicador label="CMO Custo" valor={dadosSemana.cmo_custo} valorAnterior={dadosSemanaAnterior?.cmo_custo} formato="moeda" inverso />
              <Indicador label="Pró-Labore" valor={dadosSemana.pro_labore} valorAnterior={dadosSemanaAnterior?.pro_labore} formato="moeda" inverso />
              <Indicador label="Ocupação" valor={dadosSemana.ocupacao} valorAnterior={dadosSemanaAnterior?.ocupacao} formato="moeda" inverso />
              <Indicador label="Adm Fixo" valor={dadosSemana.adm_fixo} valorAnterior={dadosSemanaAnterior?.adm_fixo} formato="moeda" inverso />
              <Indicador label="Marketing Fixo" valor={dadosSemana.marketing_fixo} valorAnterior={dadosSemanaAnterior?.marketing_fixo} formato="moeda" inverso />
              <Indicador label="Escritório Central" valor={dadosSemana.escritorio_central} valorAnterior={dadosSemanaAnterior?.escritorio_central} formato="moeda" inverso />
              <Indicador label="Adm e Mkt da Semana" valor={dadosSemana.adm_mkt_semana} valorAnterior={dadosSemanaAnterior?.adm_mkt_semana} formato="moeda" inverso />
              <Indicador label="RH+Estorno+Outros" valor={dadosSemana.rh_estorno_outros_operacao} valorAnterior={dadosSemanaAnterior?.rh_estorno_outros_operacao} formato="moeda" inverso />
              <Indicador label="Materiais" valor={dadosSemana.materiais} valorAnterior={dadosSemanaAnterior?.materiais} formato="moeda" inverso />
              <Indicador label="Manutenção" valor={dadosSemana.manutencao} valorAnterior={dadosSemanaAnterior?.manutencao} formato="moeda" inverso />
              <Indicador label="Atrações/Eventos" valor={dadosSemana.atracoes_eventos} valorAnterior={dadosSemanaAnterior?.atracoes_eventos} formato="moeda" inverso />
              <Indicador label="Utensílios" valor={dadosSemana.utensilios} valorAnterior={dadosSemanaAnterior?.utensilios} formato="moeda" inverso />
              <Indicador label="Consumação (sem sócio)" valor={dadosSemana.consumacao_sem_socio} valorAnterior={dadosSemanaAnterior?.consumacao_sem_socio} formato="moeda" />
              <Indicador label="Lucro (R$)" valor={dadosSemana.lucro_rs} valorAnterior={dadosSemanaAnterior?.lucro_rs} formato="moeda" />
            </Secao>

            {/* Cockpit Produtos */}
            <Secao
              titulo="Cockpit Produtos"
              icone={<ShoppingCart className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-orange-500 to-orange-600"
              defaultOpen={false}
            >
              <Indicador label="StockOut Comidas" valor={dadosSemana.stockout_comidas} valorAnterior={dadosSemanaAnterior?.stockout_comidas} inverso />
              <Indicador label="StockOut Drinks" valor={dadosSemana.stockout_drinks} valorAnterior={dadosSemanaAnterior?.stockout_drinks} inverso />
              <Indicador label="StockOut Bar" valor={dadosSemana.stockout_bar} valorAnterior={dadosSemanaAnterior?.stockout_bar} inverso />
              <Indicador label="% Bebidas" valor={dadosSemana.perc_bebidas} valorAnterior={dadosSemanaAnterior?.perc_bebidas} formato="percentual" />
              <Indicador label="% Drinks" valor={dadosSemana.perc_drinks} valorAnterior={dadosSemanaAnterior?.perc_drinks} formato="percentual" />
              <Indicador label="% Comida" valor={dadosSemana.perc_comida} valorAnterior={dadosSemanaAnterior?.perc_comida} formato="percentual" />
              <Indicador label="% Happy Hour" valor={dadosSemana.perc_happy_hour} valorAnterior={dadosSemanaAnterior?.perc_happy_hour} formato="percentual" />
              <Indicador label="Qtde Itens Bar" valor={dadosSemana.qtde_itens_bar} valorAnterior={dadosSemanaAnterior?.qtde_itens_bar} />
              <Indicador label="Atrasos Bar" valor={dadosSemana.atrasos_bar} valorAnterior={dadosSemanaAnterior?.atrasos_bar} inverso />
              <Indicador label="Tempo Saída Bar" valor={dadosSemana.tempo_saida_bar} valorAnterior={dadosSemanaAnterior?.tempo_saida_bar} formato="decimal" sufixo=" min" inverso />
              <Indicador label="Qtde Itens Cozinha" valor={dadosSemana.qtde_itens_cozinha} valorAnterior={dadosSemanaAnterior?.qtde_itens_cozinha} />
              <Indicador label="Atrasos Cozinha" valor={dadosSemana.atrasos_cozinha} valorAnterior={dadosSemanaAnterior?.atrasos_cozinha} inverso />
              <Indicador label="Tempo Saída Cozinha" valor={dadosSemana.tempo_saida_cozinha} valorAnterior={dadosSemanaAnterior?.tempo_saida_cozinha} formato="decimal" sufixo=" min" inverso />
            </Secao>

            {/* Cockpit Vendas + Marketing */}
            <Secao
              titulo="Vendas & Marketing"
              icone={<Megaphone className="w-4 h-4 text-white" />}
              corGradiente="bg-gradient-to-r from-pink-500 to-pink-600"
              defaultOpen={false}
            >
              {/* Vendas */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vendas</span>
              </div>
              <Indicador label="% Fat. até 19h" valor={dadosSemana.perc_faturamento_ate_19h} valorAnterior={dadosSemanaAnterior?.perc_faturamento_ate_19h} formato="percentual" />
              <Indicador label="Venda Balcão" valor={dadosSemana.venda_balcao} valorAnterior={dadosSemanaAnterior?.venda_balcao} formato="moeda" />
              <Indicador label="Couvert / Atrações" valor={dadosSemana.couvert_atracoes} valorAnterior={dadosSemanaAnterior?.couvert_atracoes} formato="moeda" />
              <Indicador label="QUI+SÁB+DOM" valor={dadosSemana.qui_sab_dom} valorAnterior={dadosSemanaAnterior?.qui_sab_dom} formato="moeda" />
              
              {/* Marketing Orgânico */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Marketing Orgânico</span>
              </div>
              <Indicador label="Nº de Posts" valor={dadosSemana.o_num_posts} valorAnterior={dadosSemanaAnterior?.o_num_posts} />
              <Indicador label="Alcance" valor={dadosSemana.o_alcance} valorAnterior={dadosSemanaAnterior?.o_alcance} />
              <Indicador label="Interação" valor={dadosSemana.o_interacao} valorAnterior={dadosSemanaAnterior?.o_interacao} />
              <Indicador label="Compartilhamento" valor={dadosSemana.o_compartilhamento} valorAnterior={dadosSemanaAnterior?.o_compartilhamento} />
              <Indicador label="Engajamento" valor={dadosSemana.o_engajamento} valorAnterior={dadosSemanaAnterior?.o_engajamento} formato="percentual" />
              <Indicador label="Nº Stories" valor={dadosSemana.o_num_stories} valorAnterior={dadosSemanaAnterior?.o_num_stories} />
              <Indicador label="Visu Stories" valor={dadosSemana.o_visu_stories} valorAnterior={dadosSemanaAnterior?.o_visu_stories} />
              
              {/* Marketing Pago */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Marketing Pago (Meta)</span>
              </div>
              <Indicador label="Valor Investido" valor={dadosSemana.m_valor_investido} valorAnterior={dadosSemanaAnterior?.m_valor_investido} formato="moeda" />
              <Indicador label="Alcance" valor={dadosSemana.m_alcance} valorAnterior={dadosSemanaAnterior?.m_alcance} />
              <Indicador label="Frequência" valor={dadosSemana.m_frequencia} valorAnterior={dadosSemanaAnterior?.m_frequencia} formato="decimal" />
              <Indicador label="CPM" valor={dadosSemana.m_cpm} valorAnterior={dadosSemanaAnterior?.m_cpm} formato="moeda" inverso />
              <Indicador label="Cliques" valor={dadosSemana.m_cliques} valorAnterior={dadosSemanaAnterior?.m_cliques} />
              <Indicador label="CTR" valor={dadosSemana.m_ctr} valorAnterior={dadosSemanaAnterior?.m_ctr} formato="percentual" />
              <Indicador label="Custo por Clique" valor={dadosSemana.m_custo_por_clique} valorAnterior={dadosSemanaAnterior?.m_custo_por_clique} formato="moeda" inverso />
              <Indicador label="Conversas Iniciadas" valor={dadosSemana.m_conversas_iniciadas} valorAnterior={dadosSemanaAnterior?.m_conversas_iniciadas} />
            </Secao>
          </div>
        )}
      </div>
    </div>
  );
}
