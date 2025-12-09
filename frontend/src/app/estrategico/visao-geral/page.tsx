'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useBar } from '@/contexts/BarContext';
import { IndicadorCard } from '@/components/visao-geral/IndicadorCard';
import { IndicadorRetencao } from '@/components/visao-geral/IndicadorRetencao';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  RefreshCw,
  Wallet,
  Palette,
  Activity,
  Edit3,
  Save,
  X,
  Star,
  DollarSign
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useGlobalLoading } from '@/components/ui/global-loading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IndicadoresAnuais {
  faturamento: {
    valor: number;
    meta: number;
    detalhes?: Record<string, number>;
  };
  pessoas: {
    valor: number;
    meta: number;
    detalhes?: Record<string, number>;
  };
  reputacao: {
    valor: number;
    meta: number;
  };
  ebitda: {
    valor: number;
    meta: number;
  };
}

interface IndicadoresTrimestrais {
  clientesAtivos: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  clientesTotais: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  retencao: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  retencaoReal: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  cmvLimpo: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  cmo: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  artistica: {
    valor: number;
    meta: number;
    variacao?: number;
  };
}

export default function VisaoGeralEstrategica() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 🚀 CACHE: Armazenar dados trimestrais já carregados para navegação rápida
  const cacheTrimestrais = useRef<Record<number, IndicadoresTrimestrais>>({});
  const cacheAnual = useRef<IndicadoresAnuais | null>(null);
  
  // Estado para modal de CMV
  const [modalCMVAberto, setModalCMVAberto] = useState(false);
  const [cmvPercentual, setCmvPercentual] = useState('');
  const [salvandoCMV, setSalvandoCMV] = useState(false);
  
  // Detectar trimestre atual automaticamente baseado na data
  const getCurrentQuarter = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() retorna 0-11, então +1 para 1-12
    
    if (month >= 4 && month <= 6) return 2; // Abr-Jun
    if (month >= 7 && month <= 9) return 3; // Jul-Set
    if (month >= 10 && month <= 12) return 4; // Out-Dez
    return 2; // Jan-Mar seria T1, mas como só temos T2-T4, usar T2 como fallback
  };

  const [trimestreAtual, setTrimestreAtual] = useState(getCurrentQuarter());
  const [anualExpanded, setAnualExpanded] = useState(true);
  const [trimestralExpanded, setTrimestralExpanded] = useState(true);
  const [requestInProgress, setRequestInProgress] = useState(false);


  // Removido useEffect do PageTitle para evitar re-renders desnecessários

  // Informações dos trimestres - memoizado para evitar recriação
  const getTrimestreInfo = useMemo(() => {
    const info = {
      2: { nome: '2º Trimestre 2025 (Abr-Jun)', periodo: 'abril-junho' },
      3: { nome: '3º Trimestre 2025 (Jul-Set)', periodo: 'julho-setembro' },
      4: { nome: '4º Trimestre 2025 (Out-Dez)', periodo: 'outubro-dezembro' }
    };
    return (trimestre: number) => info[trimestre as keyof typeof info];
  }, []);

  // Navegação entre trimestres
  const navegarTrimestre = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior' && trimestreAtual > 2) {
      setTrimestreAtual(trimestreAtual - 1);
    } else if (direcao === 'proximo' && trimestreAtual < 4) {
      setTrimestreAtual(trimestreAtual + 1);
    }
  };



  const carregarIndicadores = useCallback(async () => {
    if (!selectedBar || requestInProgress) {
      return;
    }

    // 🚀 CACHE: Verificar se já temos os dados em cache
    const temCacheAnual = cacheAnual.current !== null;
    const temCacheTrimestral = cacheTrimestrais.current[trimestreAtual] !== undefined;
    
    // Se já temos tudo em cache, usar cache (navegação instantânea)
    if (temCacheAnual && temCacheTrimestral) {
      console.log(`⚡ Cache hit! Usando dados em cache para T${trimestreAtual}`);
      setIndicadoresAnuais(cacheAnual.current);
      setIndicadoresTrimestrais(cacheTrimestrais.current[trimestreAtual]);
      setLoading(false);
      return;
    }

    // Buscar dados da API
    setLoading(true);
    setRequestInProgress(true);
    showLoading(temCacheAnual ? `Carregando T${trimestreAtual}...` : 'Carregando dados...');
    
    // Calcular o mês de retenção
    const getMesRetencao = (trimestre: number) => {
      const now = new Date();
      const mesAtual = now.getMonth() + 1;
      const anoAtual = now.getFullYear();
      const ultimoMesTrimestre = { 2: 6, 3: 9, 4: 12 };
      const primeiroMesTrimestre = { 2: 4, 3: 7, 4: 10 };
      const primeiro = primeiroMesTrimestre[trimestre as keyof typeof primeiroMesTrimestre];
      const ultimo = ultimoMesTrimestre[trimestre as keyof typeof ultimoMesTrimestre];
      
      let mesParaUsar = ultimo;
      if (mesAtual >= primeiro && mesAtual <= ultimo) {
        mesParaUsar = (now.getDate() <= 10 && mesAtual > primeiro) ? mesAtual - 1 : mesAtual;
      } else if (mesAtual > ultimo) {
        mesParaUsar = ultimo;
      }
      return `${anoAtual}-${mesParaUsar.toString().padStart(2, '0')}`;
    };
    
    const mesRetencao = getMesRetencao(trimestreAtual);
    const timestamp = Date.now();
    const requestHeaders = {
      'x-user-data': JSON.stringify({ bar_id: selectedBar.id, permissao: 'admin' })
    };

    try {
      // Só buscar anual se não tiver em cache
      const fetchPromises: Promise<Response>[] = [];
      
      if (!temCacheAnual) {
        fetchPromises.push(
          fetch(`/api/visao-geral/indicadores?periodo=anual&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`, { headers: requestHeaders })
        );
      }
      
      // Sempre buscar trimestral se não tiver em cache
      fetchPromises.push(
        fetch(`/api/visao-geral/indicadores?periodo=trimestral&trimestre=${trimestreAtual}&mes_retencao=${mesRetencao}&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`, { headers: requestHeaders })
      );

      const responses = await Promise.all(fetchPromises);
      
      if (!temCacheAnual) {
        const anualResponse = responses[0];
        if (!anualResponse.ok) throw new Error(`Erro ao buscar dados anuais: ${anualResponse.status}`);
        const anualData = await anualResponse.json();
        cacheAnual.current = anualData.anual;
        setIndicadoresAnuais(anualData.anual);
      } else {
        setIndicadoresAnuais(cacheAnual.current);
      }
      
      const trimestralResponse = temCacheAnual ? responses[0] : responses[1];
      if (!trimestralResponse.ok) throw new Error(`Erro ao buscar dados trimestrais: ${trimestralResponse.status}`);
      const trimestralData = await trimestralResponse.json();
      
      // Salvar no cache
      cacheTrimestrais.current[trimestreAtual] = trimestralData.trimestral;
      setIndicadoresTrimestrais(trimestralData.trimestral);
      
      console.log(`✅ Dados T${trimestreAtual} carregados e salvos em cache`);
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro ao carregar indicadores:', error);
      }
      toast({
        title: 'Erro ao carregar dados',
        description: error instanceof Error && error.message.includes('Failed to fetch') 
          ? 'Verifique sua conexão com a internet'
          : 'Erro interno do servidor. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRequestInProgress(false);
      hideLoading();
    }
  }, [selectedBar?.id, trimestreAtual, requestInProgress, toast, showLoading, hideLoading]);

  // useEffect para carregar dados quando bar ou trimestre mudar
  // Limpar cache quando bar mudar
  const lastBarId = useRef<string | number | null>(null);
  
  useEffect(() => {
    if (selectedBar) {
      // Se o bar mudou, limpar todo o cache
      if (lastBarId.current !== null && lastBarId.current !== selectedBar.id) {
        console.log('🔄 Bar mudou, limpando cache...');
        cacheAnual.current = null;
        cacheTrimestrais.current = {};
      }
      lastBarId.current = selectedBar.id;
      
      // Resetar requestInProgress para permitir nova requisição
      setRequestInProgress(false);
      const timer = setTimeout(() => {
        carregarIndicadores();
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBar?.id, trimestreAtual]);

  // Função para recarregar dados (limpa cache)
  const recarregarDados = useCallback(() => {
    try {
      // 🚀 Limpar cache para forçar reload
      cacheAnual.current = null;
      cacheTrimestrais.current = {};
      
      // Resetar estados
      setIndicadoresAnuais(null);
      setIndicadoresTrimestrais(null);
      setLoading(true);
      setRequestInProgress(false);
      
      // Recarregar dados
      if (selectedBar) {
        setTimeout(() => carregarIndicadores(), 100);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Dados recarregados com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível recarregar os dados',
        variant: 'destructive'
      });
    }
  }, [selectedBar?.id, toast, carregarIndicadores]);

  // Memoizar dados dos indicadores para evitar re-renders desnecessários
  const indicadoresAnuaisMemo = useMemo(() => indicadoresAnuais, [indicadoresAnuais]);
  const indicadoresTrimestraisMemo = useMemo(() => indicadoresTrimestrais, [indicadoresTrimestrais]);

  // Memoizar informações do trimestre atual
  const trimestreInfo = useMemo(() => getTrimestreInfo(trimestreAtual), [getTrimestreInfo, trimestreAtual]);

  // Função para salvar CMV manualmente
  const salvarCMV = async () => {
    if (!selectedBar?.id || !cmvPercentual) {
      toast({
        title: 'Erro',
        description: 'Preencha o valor do CMV',
        variant: 'destructive'
      });
      return;
    }

    setSalvandoCMV(true);
    try {
      const ano = new Date().getFullYear();
      const trimestresDatas: Record<number, { inicio: string; fim: string }> = {
        2: { inicio: `${ano}-04-01`, fim: `${ano}-06-30` },
        3: { inicio: `${ano}-07-01`, fim: `${ano}-09-30` },
        4: { inicio: `${ano}-10-01`, fim: `${ano}-12-31` }
      };
      
      const periodo = trimestresDatas[trimestreAtual] || trimestresDatas[4];
      
      const response = await fetch('/api/cmv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          periodo_tipo: 'trimestral',
          periodo_inicio: periodo.inicio,
          periodo_fim: periodo.fim,
          cmv_percentual: parseFloat(cmvPercentual.replace(',', '.')),
          fonte: 'manual'
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar CMV');

      toast({
        title: 'Sucesso!',
        description: `CMV de ${cmvPercentual}% salvo para o ${trimestreInfo?.nome}`,
      });

      setModalCMVAberto(false);
      setCmvPercentual('');
      
      // Recarregar indicadores
      carregarIndicadores();
    } catch (error) {
      console.error('Erro ao salvar CMV:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o CMV',
        variant: 'destructive'
      });
    } finally {
      setSalvandoCMV(false);
    }
  };

  // Memoizar componentes de skeleton para evitar re-renders
  const SkeletonCards = useMemo(() => {
    const AnualSkeleton = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-50 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );

    const TrimestralSkeleton = () => (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gray-50 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );

    return { AnualSkeleton, TrimestralSkeleton };
  }, []);

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalLoadingComponent />
      <div className="container mx-auto px-4 py-2 space-y-2">


        {/* Indicadores Anuais */}
        <div className="card-dark p-2">
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => setAnualExpanded(!anualExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAnualExpanded(!anualExpanded);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visão Geral • Performance Anual</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dashboard executivo • Performance estratégica desde abertura</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {anualExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {anualExpanded && (
            <>
              {loading ? (
                <SkeletonCards.AnualSkeleton />
              ) : indicadoresAnuaisMemo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <IndicadorCard
                    titulo="Faturamento 2025"
                    valor={indicadoresAnuaisMemo.faturamento.valor}
                    meta={indicadoresAnuaisMemo.faturamento.meta}
                    formato="moeda"
                    cor="green"
                    icone={DollarSign}
                    detalhes={indicadoresAnuaisMemo.faturamento.detalhes}
                  />
                  
                  <IndicadorCard
                    titulo="Pessoas"
                    valor={indicadoresAnuaisMemo.pessoas.valor}
                    meta={indicadoresAnuaisMemo.pessoas.meta}
                    formato="numero"
                    cor="blue"
                    icone={Users}
                    detalhes={indicadoresAnuaisMemo.pessoas.detalhes}
                  />
                  
                  <IndicadorCard
                    titulo="Reputação"
                    valor={indicadoresAnuaisMemo.reputacao.valor}
                    meta={indicadoresAnuaisMemo.reputacao.meta}
                    formato="decimal"
                    cor="purple"
                    icone={Star}
                    sufixo=" ⭐"
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400">Erro ao carregar indicadores anuais</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Indicadores Trimestrais */}
        <div className="card-dark p-2">
          <div className="flex items-center justify-between mb-2">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => setTrimestralExpanded(!trimestralExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setTrimestralExpanded(!trimestralExpanded);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{trimestreInfo?.nome}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Performance operacional</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Navegação de Trimestres */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navegarTrimestre('anterior');
                  }}
                  disabled={trimestreAtual <= 2}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                  {trimestreAtual}º Tri
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navegarTrimestre('proximo');
                  }}
                  disabled={trimestreAtual >= 4}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Botão Expandir/Colapsar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTrimestralExpanded(!trimestralExpanded)}
                className="p-2"
              >
                {trimestralExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {trimestralExpanded && (
            <>
              {loading ? (
                <SkeletonCards.TrimestralSkeleton />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <IndicadorCard
                    titulo="Clientes Ativos"
                    valor={indicadoresTrimestraisMemo?.clientesAtivos?.valor || 0}
                    meta={indicadoresTrimestraisMemo?.clientesAtivos?.meta || 3000}
                    formato="numero"
                    cor="green"
                    icone={Activity}
                    tooltipTexto="Base Ativa (90 dias): Clientes únicos que visitaram o bar nos últimos 90 dias a partir de hoje. Indica o tamanho da sua base de clientes ativos."
                    periodoAnalisado={`${trimestreInfo?.periodo} 2025`}
                    comparacao={{
                      valor: indicadoresTrimestraisMemo?.clientesAtivos?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <IndicadorCard
                    titulo="Clientes Totais"
                    valor={indicadoresTrimestraisMemo?.clientesTotais?.valor || 0}
                    meta={indicadoresTrimestraisMemo?.clientesTotais?.meta || 12000}
                    formato="numero"
                    cor="blue"
                    icone={Users}
                    tooltipTexto="Clientes únicos que visitaram o bar durante todo o trimestre (do início até a data atual). Inclui novos e retornantes."
                    periodoAnalisado={`${trimestreInfo?.periodo} 2025`}
                    comparacao={{
                      valor: indicadoresTrimestraisMemo?.clientesTotais?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <IndicadorRetencao
                    valor={indicadoresTrimestraisMemo?.retencao?.valor || 0}
                    meta={indicadoresTrimestraisMemo?.retencao?.meta || 40}
                    variacao={indicadoresTrimestraisMemo?.retencao?.variacao || 0}
                    periodoAnalisado={`${trimestreInfo?.periodo} 2025`}
                  />
                  
                  <IndicadorCard
                    titulo="Retenção Real"
                    valor={indicadoresTrimestraisMemo?.retencaoReal?.valor || 0}
                    meta={indicadoresTrimestraisMemo?.retencaoReal?.meta || 5}
                    formato="percentual"
                    cor="cyan"
                    icone={RefreshCw}
                    tooltipTexto="Percentual de clientes do trimestre ANTERIOR que VOLTARAM neste trimestre. Mede quantos clientes antigos você conseguiu trazer de volta."
                    comparacao={{
                      valor: indicadoresTrimestraisMemo?.retencaoReal?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <div className="relative group">
                    <IndicadorCard
                      titulo="CMV Limpo"
                      valor={indicadoresTrimestraisMemo?.cmvLimpo?.valor || 0}
                      meta={indicadoresTrimestraisMemo?.cmvLimpo?.meta || 34}
                      formato="percentual"
                      cor="orange"
                      icone={TrendingDown}
                      tooltipTexto="Custo de Mercadoria Vendida (CMV) descontando perdas e ajustes. Meta: abaixo de 34% do faturamento total."
                      comparacao={{
                        valor: indicadoresTrimestraisMemo?.cmvLimpo?.variacao || 0,
                        label: "vs trimestre anterior"
                      }}
                      inverterProgresso={true}
                      inverterComparacao={true}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
                      onClick={() => {
                        setCmvPercentual(indicadoresTrimestraisMemo?.cmvLimpo?.valor?.toString() || '');
                        setModalCMVAberto(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </Button>
                  </div>
                  
                  <IndicadorCard
                    titulo="CMO"
                    valor={indicadoresTrimestraisMemo?.cmo?.valor || 0}
                    meta={indicadoresTrimestraisMemo?.cmo?.meta || 20}
                    formato="percentual"
                    cor="orange"
                    icone={Wallet}
                    tooltipTexto="Custo de Mão de Obra: Percentual do faturamento gasto com funcionários. Quanto MENOR, melhor a eficiência operacional."
                    inverterProgresso={true}
                    inverterComparacao={true}
                    comparacao={{
                      valor: indicadoresTrimestraisMemo?.cmo?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <IndicadorCard
                    titulo="% Artística"
                    valor={indicadoresTrimestraisMemo?.artistica?.valor || 0}
                    meta={indicadoresTrimestraisMemo?.artistica?.meta || 17}
                    formato="percentual"
                    cor="pink"
                    icone={Palette}
                    tooltipTexto="Custo Artístico: Percentual do faturamento gasto com atrações (bandas, DJs, etc). Quanto MENOR, melhor o controle de custos."
                    inverterProgresso={true}
                    inverterComparacao={true}
                    comparacao={{
                      valor: indicadoresTrimestraisMemo?.artistica?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {/* Modal para editar CMV */}
      <Dialog open={modalCMVAberto} onOpenChange={setModalCMVAberto}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Atualizar CMV Limpo
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Insira o CMV (%) do {trimestreInfo?.nome} {new Date().getFullYear()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cmv" className="text-gray-900 dark:text-white">
                CMV Percentual (%)
              </Label>
              <div className="relative">
                <Input
                  id="cmv"
                  type="text"
                  placeholder="Ex: 32.5"
                  value={cmvPercentual}
                  onChange={(e) => setCmvPercentual(e.target.value)}
                  className="pr-8 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Meta: abaixo de {indicadoresTrimestraisMemo?.cmvLimpo?.meta || 34}%
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                <strong>Dica:</strong> O CMV é calculado na planilha &quot;Pedidos e Estoque&quot; 
                nas abas &quot;CMV Semanal&quot; ou &quot;CMV Mensal&quot;.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setModalCMVAberto(false);
                setCmvPercentual('');
              }}
              className="border-gray-300 dark:border-gray-600"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={salvarCMV}
              disabled={salvandoCMV || !cmvPercentual}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {salvandoCMV ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar CMV
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
