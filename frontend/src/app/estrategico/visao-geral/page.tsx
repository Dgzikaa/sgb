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
  ChevronUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  cmvLimpo: {
    valor: number;
    meta: number;
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

  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);
  const [loading, setLoading] = useState(true);
  const [trimestreAtual, setTrimestreAtual] = useState(3);
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

  // Cache inteligente com TTL
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
  
  const cacheManager = useMemo(() => ({
    read: (key: string) => {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.data || !parsed.ts) return null;
        const isFresh = Date.now() - parsed.ts < CACHE_TTL_MS;
        return isFresh ? parsed.data : null;
      } catch {
        return null;
      }
    },
    write: (key: string, data: unknown) => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      } catch (error) {
        // Falha silenciosa no cache
      }
    },
    clear: () => {
      try {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('vg:') || key.includes('indicadores')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        // Falha silenciosa na limpeza
      }
    }
  }), []);

  // Função para limpar cache e recarregar - otimizada
  const limparCacheERecarregar = useCallback(() => {
    try {
      cacheManager.clear();
      
      // Resetar estados
      setIndicadoresAnuais(null);
      setIndicadoresTrimestrais(null);
      setLoading(true);
      setRequestInProgress(false);
      
      // Recarregar dados se bar selecionado
      if (selectedBar) {
        carregarIndicadores();
      }
      
      toast({
        title: 'Cache limpo',
        description: 'Dados recarregados com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar o cache',
        variant: 'destructive'
      });
    }
  }, [selectedBar, cacheManager, toast]);

  const carregarIndicadores = useCallback(async () => {
    if (!selectedBar || requestInProgress) {
      return;
    }

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    const anualCacheKey = `vg:anual:${selectedBar.id}`;
    const triCacheKey = `vg:tri:${selectedBar.id}:${trimestreAtual}:${mesAtual}`;

    // Verificar cache primeiro
    const anualCached = cacheManager.read(anualCacheKey);
    const triCached = cacheManager.read(triCacheKey);

    if (anualCached && triCached) {
      setIndicadoresAnuais(anualCached.anual);
      setIndicadoresTrimestrais(triCached.trimestral);
      setLoading(false);
      return;
    }

    // Buscar dados da API
    setLoading(true);
    setRequestInProgress(true);
    
    const timestamp = Date.now();
    const anualUrl = `/api/visao-geral/indicadores?periodo=anual&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;
    const trimestralUrl = `/api/visao-geral/indicadores?periodo=trimestral&trimestre=${trimestreAtual}&mes_retencao=${mesAtual}&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;
    
    const requestHeaders = {
      'x-user-data': JSON.stringify({ bar_id: selectedBar.id, permissao: 'admin' })
    };

    try {
      const [anualResponse, trimestralResponse] = await Promise.all([
        fetch(anualUrl, { headers: requestHeaders }),
        fetch(trimestralUrl, { headers: requestHeaders })
      ]);

      if (!anualResponse.ok || !trimestralResponse.ok) {
        throw new Error('Erro ao buscar indicadores');
      }

      const anualData = await anualResponse.json();
      const trimestralData = await trimestralResponse.json();

      setIndicadoresAnuais(anualData.anual);
      setIndicadoresTrimestrais(trimestralData.trimestral);
      
      // Salvar no cache
      cacheManager.write(anualCacheKey, anualData);
      cacheManager.write(triCacheKey, trimestralData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os indicadores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRequestInProgress(false);
    }
  }, [selectedBar, trimestreAtual, requestInProgress, cacheManager, toast]);

  // Carregar indicadores quando selectedBar estiver disponível
  useEffect(() => {
    if (selectedBar) {
      carregarIndicadores();
    }
  }, [selectedBar, trimestreAtual, carregarIndicadores]);

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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
                  
                  <IndicadorCard
                    titulo="EBITDA 2025"
                    valor={0}
                    meta={100000}
                    formato="moeda"
                    cor="yellow"
                    emDesenvolvimento={true}
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  <IndicadorCard
                    titulo="Clientes Ativos (90d)"
                    valor={indicadoresTrimestrais?.clientesAtivos?.valor || 0}
                    meta={indicadoresTrimestrais?.clientesAtivos?.meta || 3000}
                    formato="numero"
                    cor="green"
                    periodoAnalisado="Últimos 90 dias (2+ visitas)"
                    comparacao={{
                      valor: indicadoresTrimestrais?.clientesAtivos?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <IndicadorCard
                    titulo="Clientes Totais"
                    valor={indicadoresTrimestrais?.clientesTotais?.valor || 0}
                    meta={indicadoresTrimestrais?.clientesTotais?.meta || 12000}
                    formato="numero"
                    cor="blue"
                    periodoAnalisado={`${getTrimestreInfo(trimestreAtual)?.periodo} 2025`}
                    comparacao={{
                      valor: indicadoresTrimestrais?.clientesTotais?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <IndicadorRetencao
                    valor={indicadoresTrimestrais?.retencao?.valor || 0}
                    meta={indicadoresTrimestrais?.retencao?.meta || 10}
                    variacao={indicadoresTrimestrais?.retencao?.variacao || 0}
                    mesSelected={`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`}
                  />
                  
                  <IndicadorCard
                    titulo="CMV Limpo"
                    valor={0}
                    meta={25}
                    formato="percentual"
                    cor="yellow"
                    inverterProgresso={true}
                    emDesenvolvimento={true}
                  />
                  
                  <IndicadorCard
                    titulo="CMO"
                    valor={indicadoresTrimestrais?.cmo?.valor || 0}
                    meta={indicadoresTrimestrais?.cmo?.meta || 20}
                    formato="percentual"
                    cor="orange"
                    inverterProgresso={true}
                    inverterComparacao={true}
                    comparacao={{
                      valor: indicadoresTrimestrais?.cmo?.variacao || 0,
                      label: "vs trimestre anterior"
                    }}
                  />
                  
                  <IndicadorCard
                    titulo="% Artística"
                    valor={indicadoresTrimestrais?.artistica?.valor || 0}
                    meta={indicadoresTrimestrais?.artistica?.meta || 17}
                    formato="percentual"
                    cor="pink"
                    inverterProgresso={true}
                    inverterComparacao={true}
                    comparacao={{
                      valor: indicadoresTrimestrais?.artistica?.variacao || 0,
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
