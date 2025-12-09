'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useBar } from '@/contexts/BarContext';
import { IndicadorCard } from '@/components/visao-geral/IndicadorCard';
import { IndicadorRetencao } from '@/components/visao-geral/IndicadorRetencao';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
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
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useGlobalLoading } from '@/components/ui/global-loading';

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

    // Buscar dados da API diretamente
    setLoading(true);
    setRequestInProgress(true);
    showLoading('Carregando dados da visão geral...');
    
    // Calcular o mês de retenção baseado no trimestre selecionado
    // Usar o mês atual DINÂMICO para cada trimestre
    const getMesRetencao = (trimestre: number) => {
      const now = new Date();
      const mesAtual = now.getMonth() + 1; // 1-12
      const anoAtual = now.getFullYear();
      
      // Se estamos no trimestre atual, usar o mês atual
      // Se estamos vendo trimestre passado, usar o último mês do trimestre
      const ultimoMesTrimestre = {
        2: 6,  // T2 (Abr-Jun): Junho
        3: 9,  // T3 (Jul-Set): Setembro
        4: 12  // T4 (Out-Dez): Dezembro
      };
      
      const primeiroMesTrimestre = {
        2: 4,  // T2 (Abr-Jun): Abril
        3: 7,  // T3 (Jul-Set): Julho
        4: 10  // T4 (Out-Dez): Outubro
      };
      
      // Se estamos no trimestre selecionado, usar o mês atual (ou anterior se estamos no início do mês)
      const primeiro = primeiroMesTrimestre[trimestre as keyof typeof primeiroMesTrimestre];
      const ultimo = ultimoMesTrimestre[trimestre as keyof typeof ultimoMesTrimestre];
      
      let mesParaUsar: number;
      
      if (mesAtual >= primeiro && mesAtual <= ultimo) {
        // Estamos no trimestre selecionado - usar mês atual
        // Se estamos nos primeiros 10 dias do mês, usar mês anterior para ter dados completos
        if (now.getDate() <= 10 && mesAtual > primeiro) {
          mesParaUsar = mesAtual - 1;
        } else {
          mesParaUsar = mesAtual;
        }
      } else if (mesAtual > ultimo) {
        // Trimestre já passou - usar último mês do trimestre
        mesParaUsar = ultimo;
      } else {
        // Trimestre ainda não chegou - usar último mês do trimestre do ano anterior
        mesParaUsar = ultimo;
      }
      
      return `${anoAtual}-${mesParaUsar.toString().padStart(2, '0')}`;
    };
    
    const mesRetencao = getMesRetencao(trimestreAtual);
    console.log(`📊 Visão Geral: Usando mês ${mesRetencao} para retenção do T${trimestreAtual}`);
    const timestamp = Date.now();
    
    const anualUrl = `/api/visao-geral/indicadores?periodo=anual&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;
    const trimestralUrl = `/api/visao-geral/indicadores?periodo=trimestral&trimestre=${trimestreAtual}&mes_retencao=${mesRetencao}&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;
    
    const requestHeaders = {
      'x-user-data': JSON.stringify({ bar_id: selectedBar.id, permissao: 'admin' })
    };

    try {
      const [anualResponse, trimestralResponse] = await Promise.all([
        fetch(anualUrl, { headers: requestHeaders }),
        fetch(trimestralUrl, { headers: requestHeaders })
      ]);

      if (!anualResponse.ok) {
        const errorText = await anualResponse.text();
        throw new Error(`Erro ao buscar dados anuais: ${anualResponse.status} - ${errorText}`);
      }
      
      if (!trimestralResponse.ok) {
        const errorText = await trimestralResponse.text();
        throw new Error(`Erro ao buscar dados trimestrais: ${trimestralResponse.status} - ${errorText}`);
      }

      const anualData = await anualResponse.json();
      const trimestralData = await trimestralResponse.json();

      setIndicadoresAnuais(anualData.anual);
      setIndicadoresTrimestrais(trimestralData.trimestral);
      
    } catch (error) {
      // Log detalhado apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro ao carregar indicadores da visão geral:', error);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro ao carregar dados',
        description: errorMessage.includes('Failed to fetch') 
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
  useEffect(() => {
    if (selectedBar && !requestInProgress) {
      carregarIndicadores();
    }
  }, [selectedBar?.id, trimestreAtual]); // Removido carregarIndicadores das dependências

  // Função para recarregar dados
  const recarregarDados = useCallback(() => {
    try {
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

  // Carregar indicadores quando selectedBar estiver disponível
  useEffect(() => {
    if (selectedBar) {
      carregarIndicadores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBar, trimestreAtual]);

  // Memoizar dados dos indicadores para evitar re-renders desnecessários
  const indicadoresAnuaisMemo = useMemo(() => indicadoresAnuais, [indicadoresAnuais]);
  const indicadoresTrimestraisMemo = useMemo(() => indicadoresTrimestrais, [indicadoresTrimestrais]);

  // Memoizar informações do trimestre atual
  const trimestreInfo = useMemo(() => getTrimestreInfo(trimestreAtual), [getTrimestreInfo, trimestreAtual]);

  // Memoizar componentes de skeleton para evitar re-renders
  const SkeletonCards = useMemo(() => {
    const AnualSkeleton = () => (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <IndicadorCard
                    titulo="Faturamento 2025"
                    valor={indicadoresAnuaisMemo.faturamento.valor}
                    meta={indicadoresAnuaisMemo.faturamento.meta}
                    formato="moeda"
                    cor="green"
                    detalhes={indicadoresAnuaisMemo.faturamento.detalhes}
                  />
                  
                  <IndicadorCard
                    titulo="Pessoas"
                    valor={indicadoresAnuaisMemo.pessoas.valor}
                    meta={indicadoresAnuaisMemo.pessoas.meta}
                    formato="numero"
                    cor="blue"
                    detalhes={indicadoresAnuaisMemo.pessoas.detalhes}
                  />
                  
                  <IndicadorCard
                    titulo="Reputação"
                    valor={indicadoresAnuaisMemo.reputacao.valor}
                    meta={indicadoresAnuaisMemo.reputacao.meta}
                    formato="decimal"
                    cor="purple"
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
  );
}
