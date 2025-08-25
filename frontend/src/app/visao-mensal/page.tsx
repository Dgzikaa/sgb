'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBar } from '@/hooks/useBar';
import { useToast } from '@/hooks/use-toast';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { IndicadorCard } from '@/components/visao-geral/IndicadorCard';

interface IndicadoresMensais {
  faturamentoTotal: {
    valor: number;
    meta: number;
    variacao?: number;
  };
  
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
    variacao?: number;
  };
  
  artistica: {
    valor: number;
    meta: number;
    variacao?: number;
  };
}

export default function VisaoMensalPage() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [indicadoresMensais, setIndicadoresMensais] = useState<IndicadoresMensais | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [requestInProgress, setRequestInProgress] = useState(false);

  // Informações do mês - memoizado para evitar recriação
  const getMesInfo = useMemo(() => {
    return (mesString: string) => {
      const [ano, mes] = mesString.split('-').map(Number);
      const data = new Date(ano, mes - 1, 1);
      const nomeCompleto = data.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      const nomeAbreviado = data.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      return {
        nomeCompleto: nomeCompleto.charAt(0).toUpperCase() + nomeCompleto.slice(1),
        nomeAbreviado: nomeAbreviado.charAt(0).toUpperCase() + nomeAbreviado.slice(1),
        periodo: `${mes.toString().padStart(2, '0')}/${ano}`
      };
    };
  }, []);

  // Navegação entre meses
  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const data = new Date(ano, mes - 1, 1);
    
    if (direcao === 'anterior') {
      data.setMonth(data.getMonth() - 1);
    } else {
      data.setMonth(data.getMonth() + 1);
    }
    
    const novoMes = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
    setMesAtual(novoMes);
  };

  const carregarIndicadores = useCallback(async () => {
    if (!selectedBar || requestInProgress) {
      return;
    }

    setLoading(true);
    setRequestInProgress(true);
    showLoading('Carregando dados mensais...');
    
    const timestamp = Date.now();
    const mensalUrl = `/api/visao-geral/indicadores?periodo=mensal&mes=${mesAtual}&bar_id=${encodeURIComponent(selectedBar.id)}&_t=${timestamp}`;
    
    const requestHeaders = {
      'x-user-data': JSON.stringify({ bar_id: selectedBar.id, permissao: 'admin' })
    };

    try {
      const response = await fetch(mensalUrl, { headers: requestHeaders });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar dados mensais: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIndicadoresMensais(data.data);
      } else {
        throw new Error(data.error || 'Erro desconhecido ao carregar dados mensais');
      }

    } catch (error) {
      console.error('Erro ao carregar indicadores mensais:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível carregar os dados mensais',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRequestInProgress(false);
      hideLoading();
    }
  }, [selectedBar?.id, mesAtual, requestInProgress, toast, showLoading, hideLoading]);

  // useEffect para carregar dados quando bar ou mês mudar
  useEffect(() => {
    if (selectedBar) {
      carregarIndicadores();
    }
  }, [selectedBar, mesAtual, carregarIndicadores]);

  // Função para recarregar dados
  const recarregarDados = useCallback(() => {
    try {
      setIndicadoresMensais(null);
      setLoading(true);
      setRequestInProgress(false);
      
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
  }, [selectedBar, carregarIndicadores, toast]);

  const mesInfo = getMesInfo(mesAtual);
  const indicadoresMensaisMemo = useMemo(() => indicadoresMensais, [indicadoresMensais]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalLoadingComponent />
      
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="card-title-dark mb-2">📊 Visão Mensal</h1>
              <p className="card-description-dark">
                Indicadores mensais detalhados do {selectedBar?.nome || 'bar'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={recarregarDados}
                disabled={loading}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              >
                🔄 Atualizar
              </Button>
            </div>
          </div>

          {/* Navegador de Mês */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {mesInfo.nomeCompleto}
                  </CardTitle>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navegarMes('anterior')}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <Badge variant="secondary" className="px-3 py-1">
                    {mesInfo.periodo}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navegarMes('proximo')}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Indicadores Mensais */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          ) : indicadoresMensaisMemo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <IndicadorCard
                titulo="Faturamento Total"
                valor={indicadoresMensaisMemo.faturamentoTotal.valor}
                meta={indicadoresMensaisMemo.faturamentoTotal.meta}
                formato="moeda"
                cor="green"
                periodoAnalisado={mesInfo.nomeCompleto}
                comparacao={{
                  valor: indicadoresMensaisMemo.faturamentoTotal.variacao || 0,
                  label: "vs mês anterior"
                }}
              />
              
              <IndicadorCard
                titulo="Clientes Ativos (30d)"
                valor={indicadoresMensaisMemo.clientesAtivos.valor}
                meta={indicadoresMensaisMemo.clientesAtivos.meta}
                formato="numero"
                cor="blue"
                periodoAnalisado="Últimos 30 dias (2+ visitas)"
                comparacao={{
                  valor: indicadoresMensaisMemo.clientesAtivos.variacao || 0,
                  label: "vs mês anterior"
                }}
              />
              
              <IndicadorCard
                titulo="Clientes Totais"
                valor={indicadoresMensaisMemo.clientesTotais.valor}
                meta={indicadoresMensaisMemo.clientesTotais.meta}
                formato="numero"
                cor="indigo"
                periodoAnalisado={mesInfo.nomeCompleto}
                comparacao={{
                  valor: indicadoresMensaisMemo.clientesTotais.variacao || 0,
                  label: "vs mês anterior"
                }}
              />
              
              <IndicadorCard
                titulo="Taxa de Retenção"
                valor={indicadoresMensaisMemo.retencao.valor}
                meta={indicadoresMensaisMemo.retencao.meta}
                formato="percentual"
                cor="purple"
                periodoAnalisado="Fidelização de clientes"
                comparacao={{
                  valor: indicadoresMensaisMemo.retencao.variacao || 0,
                  label: "vs mês anterior"
                }}
              />
              
              <IndicadorCard
                titulo="CMV Limpo"
                valor={indicadoresMensaisMemo.cmvLimpo.valor}
                meta={indicadoresMensaisMemo.cmvLimpo.meta}
                formato="percentual"
                cor="orange"
                periodoAnalisado="Custo dos produtos vendidos"
                comparacao={{
                  valor: indicadoresMensaisMemo.cmvLimpo.variacao || 0,
                  label: "vs mês anterior"
                }}
              />
              
              <IndicadorCard
                titulo="Artística"
                valor={indicadoresMensaisMemo.artistica.valor}
                meta={indicadoresMensaisMemo.artistica.meta}
                formato="moeda"
                cor="pink"
                periodoAnalisado="Investimento em entretenimento"
                comparacao={{
                  valor: indicadoresMensaisMemo.artistica.variacao || 0,
                  label: "vs mês anterior"
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum dado encontrado para o período selecionado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
