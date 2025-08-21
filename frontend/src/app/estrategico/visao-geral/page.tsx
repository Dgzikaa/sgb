'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);
  const [loading, setLoading] = useState(true);
  const [trimestreAtual, setTrimestreAtual] = useState(3); // 2º, 3º ou 4º trimestre
  const [anualExpanded, setAnualExpanded] = useState(true);
  const [trimestralExpanded, setTrimestralExpanded] = useState(true);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [cmoCalculado, setCmoCalculado] = useState<number>(0);


  // Removido useEffect do PageTitle para evitar re-renders desnecessários

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

  // Função para calcular CMO diretamente
  const calcularCMO = useCallback(async () => {
    if (!selectedBar) return 0;

    try {
      console.log('🧮 CALCULANDO CMO DIRETAMENTE NO FRONTEND');
      
      // Período do trimestre atual
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mesInicio = (trimestreAtual - 1) * 3 + 1;
      const startDate = `${ano}-${mesInicio.toString().padStart(2, '0')}-01`;
      const endDate = `${ano}-${(mesInicio + 2).toString().padStart(2, '0')}-31`;
      
      console.log(`Período CMO: ${startDate} até ${endDate}`);
      
      // 1. Buscar CMO (Nibo)
      const cmoResponse = await fetch(`/api/nibo/agendamentos?bar_id=${selectedBar.id}&start_date=${startDate}&end_date=${endDate}&categorias=SALARIO FUNCIONARIOS,ALIMENTAÇÃO,PROVISÃO TRABALHISTA,VALE TRANSPORTE,FREELA ATENDIMENTO,FREELA BAR,FREELA COZINHA,FREELA LIMPEZA,FREELA SEGURANÇA,Marketing,MANUTENÇÃO,Materiais Operação,Outros Operação`);
      
      let totalCMO = 0;
      if (cmoResponse.ok) {
        const cmoData = await cmoResponse.json();
        totalCMO = cmoData.reduce((sum: number, item: any) => sum + (item.valor || 0), 0);
      }
      
      // 2. Buscar Faturamento (ContaHub + Yuzer + Sympla)
      const [contahubRes, yuzerRes, symplaRes] = await Promise.all([
        fetch(`/api/contahub/pagamentos?bar_id=${selectedBar.id}&start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/yuzer/pagamentos?bar_id=${selectedBar.id}&start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/sympla/pedidos?start_date=${startDate}&end_date=${endDate}`)
      ]);
      
      let faturamentoTotal = 0;
      
      if (contahubRes.ok) {
        const contahubData = await contahubRes.json();
        const fatContahub = contahubData.reduce((sum: number, item: any) => sum + (item.liquido || 0), 0);
        faturamentoTotal += fatContahub;
        console.log(`ContaHub: R$ ${fatContahub.toLocaleString('pt-BR')}`);
      }
      
      if (yuzerRes.ok) {
        const yuzerData = await yuzerRes.json();
        const fatYuzer = yuzerData.reduce((sum: number, item: any) => sum + (item.valor_liquido || 0), 0);
        faturamentoTotal += fatYuzer;
        console.log(`Yuzer: R$ ${fatYuzer.toLocaleString('pt-BR')}`);
      }
      
      if (symplaRes.ok) {
        const symplaData = await symplaRes.json();
        const fatSympla = symplaData.reduce((sum: number, item: any) => sum + (item.valor_liquido || 0), 0);
        faturamentoTotal += fatSympla;
        console.log(`Sympla: R$ ${fatSympla.toLocaleString('pt-BR')}`);
      }
      
      // 3. Calcular percentual
      const percentualCMO = faturamentoTotal > 0 ? (totalCMO / faturamentoTotal) * 100 : 0;
      
      console.log('🧮 CÁLCULO CMO FRONTEND:');
      console.log(`CMO Total: R$ ${totalCMO.toLocaleString('pt-BR')}`);
      console.log(`Faturamento Total: R$ ${faturamentoTotal.toLocaleString('pt-BR')}`);
      console.log(`Percentual CMO: ${percentualCMO.toFixed(2)}%`);
      
      setCmoCalculado(percentualCMO);
      return percentualCMO;
      
    } catch (error) {
      console.error('Erro ao calcular CMO:', error);
      return 0;
    }
  }, [selectedBar, trimestreAtual]);

  // Função para limpar cache e recarregar
  const limparCacheERecarregar = () => {
    try {
      // Limpar TODOS os caches - sessionStorage E localStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('vg:') || key.includes('indicadores')) {
          sessionStorage.removeItem(key);
        }
      });
      
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('vg:') || key.includes('indicadores')) {
          localStorage.removeItem(key);
        }
      });
      
      // Forçar limpeza de estado
      setIndicadoresAnuais(null);
      setIndicadoresTrimestrais(null);
      setLoading(true);
      setRequestInProgress(false);
      
      // Adicionar timestamp para forçar nova requisição
      const timestamp = Date.now();
      console.log(`🧹 CACHE TOTALMENTE LIMPO - ${timestamp}`);
      
      // Recarregar dados
      if (selectedBar) {
        carregarIndicadores();
        calcularCMO(); // Calcular CMO diretamente
      }
      
      toast({
        title: 'Cache totalmente limpo',
        description: 'Dados recarregados com sucesso',
      });
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  const carregarIndicadores = useCallback(async () => {
    console.log('🔄 carregarIndicadores chamado:', { selectedBar: selectedBar?.id, requestInProgress });
    setDebugInfo(`Iniciando carregamento... Bar: ${selectedBar?.id}`);
    
    if (!selectedBar) {
      setDebugInfo('❌ Nenhum bar selecionado');
      return;
    }

    // Evitar múltiplas requisições simultâneas
    if (requestInProgress) {
      setDebugInfo('⏳ Requisição já em andamento');
      return;
    }

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    const timestamp = Date.now(); // Forçar bypass do cache HTTP
    const anualUrl = `/api/visao-geral/indicadores?periodo=anual&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;
    const trimestralUrl = `/api/visao-geral/indicadores?periodo=trimestral&trimestre=${trimestreAtual}&mes_retencao=${mesAtual}&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;

    // Cache com TTL menor para permitir atualizações
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

    // Se há cache válido, usa apenas ele
    if (anualCached && triCached) {
      console.log('📦 Usando dados do cache');
      setDebugInfo('📦 Carregado do cache');
      setIndicadoresAnuais(anualCached.anual);
      setIndicadoresTrimestrais(triCached.trimestral);
      setLoading(false);
      return;
    }

    // Sem cache: exibe spinner e busca
    setLoading(true);
    setRequestInProgress(true);
    showLoading('Carregando indicadores...');
    
    const requestHeaders = {
      'x-user-data': JSON.stringify({ bar_id: selectedBar.id, permissao: 'admin' })
    } as Record<string, string>;

    try {
      console.log('🔄 Fazendo requisição para indicadores...');
      setDebugInfo('🔄 Fazendo requisição para APIs...');
      
      const [anualResponse, trimestralResponse] = await Promise.all([
        fetch(anualUrl, { headers: requestHeaders }),
        fetch(trimestralUrl, { headers: requestHeaders })
      ]);

      if (!anualResponse.ok || !trimestralResponse.ok) {
        setDebugInfo(`❌ Erro HTTP: ${anualResponse.status}/${trimestralResponse.status}`);
        throw new Error('Erro ao buscar indicadores');
      }

      const anualData = await anualResponse.json();
      const trimestralData = await trimestralResponse.json();

      console.log('✅ Dados carregados:', { anual: anualData, trimestral: trimestralData });
      setDebugInfo('✅ Dados carregados com sucesso');

      setIndicadoresAnuais(anualData.anual);
      setIndicadoresTrimestrais(trimestralData.trimestral);
      writeCache(anualCacheKey, anualData);
      writeCache(triCacheKey, trimestralData);
    } catch (error) {
      console.error('❌ Erro ao carregar indicadores:', error);
      setDebugInfo(`❌ Erro: ${error}`);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os indicadores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRequestInProgress(false);
      hideLoading();
    }
  }, [selectedBar, trimestreAtual, requestInProgress, showLoading, hideLoading, toast]);

  // Carregar indicadores quando selectedBar estiver disponível
  useEffect(() => {
    console.log('🔍 useEffect disparado:', { selectedBar: selectedBar?.id, trimestreAtual });
    if (selectedBar) {
      carregarIndicadores();
      calcularCMO(); // Calcular CMO diretamente
    }
  }, [selectedBar, trimestreAtual, calcularCMO]);



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalLoadingComponent />
      <div className="container mx-auto px-4 pt-0 pb-1 space-y-3">
        <div className="flex items-center justify-between">
          <PageHeader title="Visão Geral" description="Resumo executivo do bar" />
          <div className="flex items-center gap-2">
            {debugInfo && (
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {debugInfo}
              </span>
            )}
            <Button
              onClick={limparCacheERecarregar}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🔄 Recarregar
            </Button>
          </div>
        </div>

        {/* Indicadores Anuais */}
        <div className="card-dark p-1">
          <div 
            className="flex items-center justify-between mb-1 cursor-pointer"
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
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
        <div className="card-dark p-1">
          <div className="flex items-center justify-between mb-1">
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
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
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
                  <IndicadorCard
                    titulo="Clientes Ativos (90d)"
                    valor={indicadoresTrimestrais?.clientesAtivos?.valor || 0}
                    meta={indicadoresTrimestrais?.clientesAtivos?.meta || 3000}
                    formato="numero"
                    cor="green"
                    periodoAnalisado="Últimos 90 dias (2+ visitas)"
                  />
                  
                  <IndicadorCard
                    titulo="Clientes Totais"
                    valor={indicadoresTrimestrais?.clientesTotais?.valor || 0}
                    meta={indicadoresTrimestrais?.clientesTotais?.meta || 12000}
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
                    valor={cmoCalculado || 0}
                    meta={indicadoresTrimestrais?.cmo?.meta || 20}
                    formato="percentual"
                    cor="orange"
                    inverterProgresso={true}
                  />
                  
                  <IndicadorCard
                    titulo="% Artística"
                    valor={indicadoresTrimestrais?.artistica?.valor || 0}
                    meta={indicadoresTrimestrais?.artistica?.meta || 17}
                    formato="percentual"
                    cor="pink"
                    inverterProgresso={true}
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
