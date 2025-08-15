'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { IndicadorCard } from '@/components/visao-geral/IndicadorCard';
import { IndicadorRetencao } from '@/components/visao-geral/IndicadorRetencao';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PageHeader from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
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
  };
  clientesTotais: {
    valor: number;
    meta: number;
  };
  retencao: {
    valor: number;
    meta: number;
  };
  cmvLimpo: {
    valor: number;
    meta: number;
  };
  cmo: {
    valor: number;
    meta: number;
  };
  artistica: {
    valor: number;
    meta: number;
  };
}

export default function VisaoGeralEstrategica() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);
  const [loading, setLoading] = useState(true);
  const [trimestreAtual, setTrimestreAtual] = useState(3); // 2º, 3º ou 4º trimestre
  const [anualExpanded, setAnualExpanded] = useState(true);
  const [trimestralExpanded, setTrimestralExpanded] = useState(true);


  useEffect(() => {
    setPageTitle('📊 Visão Geral');
    return () => setPageTitle('');
  }, [setPageTitle]);

  // Informações dos trimestres
  const getTrimestreInfo = (trimestre: number) => {
    const info = {
      2: { nome: '2º Trimestre 2025 (Abr-Jun)', periodo: 'abril-junho' },
      3: { nome: '3º Trimestre 2025 (Jul-Set)', periodo: 'julho-setembro' },
      4: { nome: '4º Trimestre 2025 (Out-Dez)', periodo: 'outubro-dezembro' }
    };
    return info[trimestre as keyof typeof info];
  };

  // Navegação entre trimestres
  const navegarTrimestre = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior' && trimestreAtual > 2) {
      setTrimestreAtual(trimestreAtual - 1);
    } else if (direcao === 'proximo' && trimestreAtual < 4) {
      setTrimestreAtual(trimestreAtual + 1);
    }
  };

  const carregarIndicadores = async () => {
    if (!selectedBar) return;

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    const anualUrl = `/api/visao-geral/indicadores?periodo=anual&bar_id=${encodeURIComponent(selectedBar.id)}`;
    const trimestralUrl = `/api/visao-geral/indicadores?periodo=trimestral&trimestre=${trimestreAtual}&mes_retencao=${mesAtual}&bar_id=${encodeURIComponent(selectedBar.id)}`;

    // Cache por sessão: evita recarregar tudo ao voltar para a página
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
    const anualCacheKey = `vg:anual:${selectedBar.id}`;
    const triCacheKey = `vg:tri:${selectedBar.id}:${trimestreAtual}:${mesAtual}`;

    const readCache = (key: string) => {
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
    };

    const writeCache = (key: string, data: unknown) => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      } catch (error) {
        console.warn('Erro ao salvar cache:', error);
      }
    };

    const anualCached = readCache(anualCacheKey);
    const triCached = readCache(triCacheKey);

    const requestHeaders = {
      'x-user-data': JSON.stringify({ bar_id: selectedBar.id, permissao: 'admin' })
    } as Record<string, string>;

    // Se há cache, mostra imediatamente e revalida em background
    if (anualCached && triCached) {
      setIndicadoresAnuais(anualCached.anual);
      setIndicadoresTrimestrais(triCached.trimestral);

      // Revalidação silenciosa (sem spinner)
      try {
        const [anualResponse, trimestralResponse] = await Promise.all([
          fetch(anualUrl, { headers: requestHeaders }),
          fetch(trimestralUrl, { headers: requestHeaders })
        ]);
        if (anualResponse.ok) {
          const data = await anualResponse.json();
          setIndicadoresAnuais(data.anual);
          writeCache(anualCacheKey, data);
        }
        if (trimestralResponse.ok) {
          const data = await trimestralResponse.json();
          setIndicadoresTrimestrais(data.trimestral);
          writeCache(triCacheKey, data);
        }
      } catch {
        // ignora falhas silenciosamente
      }
      return;
    }

    // Sem cache: exibe spinner e busca
    setLoading(true);
    showLoading('Carregando indicadores...');
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
      writeCache(anualCacheKey, anualData);
      writeCache(triCacheKey, trimestralData);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os indicadores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  useEffect(() => {
    carregarIndicadores();
  }, [selectedBar, trimestreAtual]);



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalLoadingComponent />
      <div className="container mx-auto px-4 py-4 space-y-4">
        <PageHeader title="Visão Geral" description="Resumo executivo do bar" />

        {/* Indicadores Anuais */}
        <div className="card-dark p-4">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => setAnualExpanded(!anualExpanded)}
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              ) : indicadoresAnuais ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <IndicadorCard
                    titulo="Faturamento 2025"
                    valor={indicadoresAnuais.faturamento.valor}
                    meta={indicadoresAnuais.faturamento.meta}
                    formato="moeda"
                    cor="green"
                    detalhes={indicadoresAnuais.faturamento.detalhes}
                  />
                  
                  <IndicadorCard
                    titulo="Pessoas"
                    valor={indicadoresAnuais.pessoas.valor}
                    meta={indicadoresAnuais.pessoas.meta}
                    formato="numero"
                    cor="blue"
                    detalhes={indicadoresAnuais.pessoas.detalhes}
                  />
                  
                  <IndicadorCard
                    titulo="Reputação"
                    valor={indicadoresAnuais.reputacao.valor}
                    meta={indicadoresAnuais.reputacao.meta}
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
        <div className="card-dark p-4">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => setTrimestralExpanded(!trimestralExpanded)}
            >
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{getTrimestreInfo(trimestreAtual)?.nome}</h2>
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
              ) : indicadoresTrimestrais ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <IndicadorCard
                    titulo="Clientes Ativos (90d)"
                    valor={indicadoresTrimestrais.clientesAtivos.valor}
                    meta={indicadoresTrimestrais.clientesAtivos.meta}
                    formato="numero"
                    cor="green"
                    periodoAnalisado="Últimos 90 dias (2+ visitas)"
                  />
                  
                  <IndicadorCard
                    titulo="Clientes Totais"
                    valor={indicadoresTrimestrais.clientesTotais.valor}
                    meta={indicadoresTrimestrais.clientesTotais.meta}
                    formato="numero"
                    cor="blue"
                    periodoAnalisado={`${getTrimestreInfo(trimestreAtual)?.periodo} 2025`}
                  />
                  
                  <IndicadorRetencao
                    meta={indicadoresTrimestrais?.retencao?.meta || 10}
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
                    valor={indicadoresTrimestrais.cmo.valor}
                    meta={indicadoresTrimestrais.cmo.meta}
                    formato="percentual"
                    cor="orange"
                    inverterProgresso={true}
                  />
                  
                  <IndicadorCard
                    titulo="% Artística"
                    valor={indicadoresTrimestrais.artistica.valor}
                    meta={indicadoresTrimestrais.artistica.meta}
                    formato="percentual"
                    cor="pink"
                    inverterProgresso={true}
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400">Erro ao carregar indicadores trimestrais</p>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
  );
}
