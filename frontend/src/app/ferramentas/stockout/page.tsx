'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Package, TrendingDown, TrendingUp, RefreshCw, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { usePageTitle } from '@/contexts/PageTitleContext';

interface StockoutData {
  data_referencia?: string;
  data_analisada?: string;
  bar_id?: number;
  timestamp_consulta: string;
  filtros_aplicados?: string[];
  estatisticas: {
    total_produtos: number;
    produtos_ativos: number;
    produtos_inativos: number;
    percentual_stockout: string;
    percentual_disponibilidade: string;
  };
  produtos: {
    ativos: Array<{
      produto_id?: string;
      produto_descricao?: string;
      prd_desc?: string;
      grupo_descricao?: string;
      loc_desc?: string;
      local_producao?: string;
      preco?: number;
      prd_precovenda?: number;
      estoque?: number;
      prd_estoque?: number;
      timestamp_coleta?: string;
    }>;
    inativos: Array<{
      produto_id?: string;
      produto_descricao?: string;
      prd_desc?: string;
      grupo_descricao?: string;
      loc_desc?: string;
      local_producao?: string;
      preco?: number;
      prd_precovenda?: number;
      estoque?: number;
      prd_estoque?: number;
      controla_estoque?: string;
      prd_controlaestoque?: string;
      valida_estoque_venda?: string;
      prd_validaestoquevenda?: string;
      timestamp_coleta?: string;
    }>;
  };
  grupos: {
    ativos: Array<{
      grupo: string;
      quantidade: number;
      produtos: string[];
    }>;
    inativos: Array<{
      grupo: string;
      quantidade: number;
      produtos: string[];
    }>;
  };
  analise_por_local?: Array<{
    local_producao: string;
    total_produtos: number;
    disponiveis: number;
    indisponiveis: number;
    perc_stockout: number;
  }>;
}

interface HistoricoData {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  bar_id: number;
  resumo: {
    total_dias: number;
    media_stockout: string;
    media_disponibilidade: string;
  };
  analise_por_dia_semana: Array<{
    dia_semana: string;
    dia_numero: number;
    total_ocorrencias: number;
    media_stockout: string;
    media_disponibilidade: string;
    melhor_dia: boolean;
    pior_dia: boolean;
  }>;
  analise_semanal: Array<{
    semana_inicio: string;
    semana_fim: string;
    numero_semana: number;
    dias_com_dados: number;
    media_stockout: string;
    media_disponibilidade: string;
  }>;
  historico_diario: Array<{
    data_referencia: string;
    dia_semana: string;
    total_produtos_ativos: number;
    produtos_disponiveis: number;
    produtos_stockout: number;
    percentual_stockout: string;
    percentual_disponibilidade: string;
  }>;
}

// Mapeamento de locais para categorias
const GRUPOS_LOCAIS = {
  drink: {
    nome: 'Drink / Bebida',
    locais: ['preshh', 'mexido', 'batidos', 'drink', 'bebida']
  },
  bar: {
    nome: 'Bar',
    locais: ['chopp', 'baldes', 'bar']
  },
  cozinha: {
    nome: 'Cozinha',
    locais: ['cozinha 1', 'cozinha 2', 'cozinha']
  }
};

export default function StockoutPage() {
  const { setPageTitle } = usePageTitle();
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  
  const [stockoutData, setStockoutData] = useState<StockoutData | null>(null);
  const [historicoData, setHistoricoData] = useState<HistoricoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('diario');
  
  // Estados para filtros
  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estado para local selecionado
  const [localSelecionado, setLocalSelecionado] = useState<string>('');
  
  // Modo de análise diária: 'unica' ou 'periodo'
  const [modoAnalise, setModoAnalise] = useState<'unica' | 'periodo'>('unica');
  
  // Datas para histórico e período
  const [dataInicio, setDataInicio] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 7 dias atrás
    return date.toISOString().split('T')[0];
  });
  
  const [dataFim, setDataFim] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  
  // Datas para análise diária em período
  const [dataInicioDiaria, setDataInicioDiaria] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 3); // 3 dias atrás
    return date.toISOString().split('T')[0];
  });
  
  const [dataFimDiaria, setDataFimDiaria] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  const buscarDadosStockout = async (data: string, filtros: string[] = []) => {
    setLoading(true);
    
    try {
      console.log('🔍 Buscando stockout para data:', data, 'filtros:', filtros);
      
      const response = await fetch('/api/analitico/stockout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_selecionada: data,
          filtros: filtros
        }),
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📊 Result:', result);
      
      if (result.success) {
        setStockoutData(result.data);
        const filtroTexto = filtros.length > 0 ? ` (${filtros.length} filtros aplicados)` : '';
        toast.success(`Dados de stockout carregados para ${data}${filtroTexto}`);
      } else {
        console.error('❌ Erro na resposta:', result.error);
        toast.error(result.error || 'Erro ao buscar dados de stockout');
        setStockoutData(null);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados de stockout:', error);
      toast.error('Erro ao buscar dados de stockout');
      setStockoutData(null);
    } finally {
      setLoading(false);
    }
  };

  const buscarDadosPeriodo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analitico/stockout-historico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_inicio: dataInicioDiaria,
          data_fim: dataFimDiaria,
          bar_id: 3,
          filtros: filtrosAtivos
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Converter dados de histórico para formato de stockout
        const mediaStockout = parseFloat(result.data.resumo.media_stockout.replace('%', ''));
        const mediaDisponibilidade = parseFloat(result.data.resumo.media_disponibilidade.replace('%', ''));
        
        // Calcular totais médios
        const totalDias = result.data.historico_diario.length;
        const somaAtivos = result.data.historico_diario.reduce((acc: number, dia: any) => acc + dia.total_produtos_ativos, 0);
        const somaDisponiveis = result.data.historico_diario.reduce((acc: number, dia: any) => acc + dia.produtos_disponiveis, 0);
        const somaStockout = result.data.historico_diario.reduce((acc: number, dia: any) => acc + dia.produtos_stockout, 0);
        
        const mediaAtivos = Math.round(somaAtivos / totalDias);
        const mediaDisponiveis = Math.round(somaDisponiveis / totalDias);
        const mediaStockoutQtd = Math.round(somaStockout / totalDias);
        
        // Criar objeto compatível com StockoutData
        const dadosPeriodo: StockoutData = {
          data_referencia: `${dataInicioDiaria} a ${dataFimDiaria}`,
          data_analisada: `${dataInicioDiaria} a ${dataFimDiaria}`,
          timestamp_consulta: new Date().toISOString(),
          filtros_aplicados: filtrosAtivos,
          estatisticas: {
            total_produtos: mediaAtivos,
            produtos_ativos: mediaDisponiveis,
            produtos_inativos: mediaStockoutQtd,
            percentual_stockout: `${mediaStockout.toFixed(1)}%`,
            percentual_disponibilidade: `${mediaDisponibilidade.toFixed(1)}%`
          },
          produtos: {
            ativos: [],
            inativos: []
          },
          grupos: {
            ativos: [],
            inativos: []
          }
        };
        
        setStockoutData(dadosPeriodo);
        toast.success(`Média de ${totalDias} dias analisados (${dataInicioDiaria} a ${dataFimDiaria})`);
      } else {
        toast.error(result.error || 'Erro ao buscar dados do período');
        setStockoutData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do período:', error);
      toast.error('Erro ao buscar dados do período');
      setStockoutData(null);
    } finally {
      setLoading(false);
    }
  };

  const buscarHistoricoStockout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analitico/stockout-historico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_inicio: dataInicio,
          data_fim: dataFim,
          bar_id: 3,
          filtros: filtrosAtivos
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setHistoricoData(result.data);
        toast.success(`Histórico carregado: ${result.data.resumo.total_dias} dias analisados`);
      } else {
        toast.error(result.error || 'Erro ao buscar histórico de stockout');
        setHistoricoData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de stockout:', error);
      toast.error('Erro ao buscar histórico de stockout');
      setHistoricoData(null);
    } finally {
      setLoading(false);
    }
  };

  const executarSyncManual = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch('/api/contahub/stockout-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_date: selectedDate
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Sincronização de stockout executada com sucesso!');
        // Recarregar dados após sync
        await buscarDadosStockout(selectedDate);
      } else {
        toast.error(result.error || 'Erro na sincronização de stockout');
      }
    } catch (error) {
      console.error('Erro na sincronização de stockout:', error);
      toast.error('Erro na sincronização de stockout');
    } finally {
      setSyncLoading(false);
    }
  };

  // Funções para gerenciar filtros
  const toggleFiltro = (filtro: string) => {
    setFiltrosAtivos(prev => {
      const novos = prev.includes(filtro) 
        ? prev.filter(f => f !== filtro)
        : [...prev, filtro];
      
      // Recarregar dados com novos filtros
      if (selectedDate && activeTab === 'diario') {
        buscarDadosStockout(selectedDate, novos);
      }
      
      return novos;
    });
  };

  const limparFiltros = () => {
    setFiltrosAtivos([]);
    if (selectedDate && activeTab === 'diario') {
      buscarDadosStockout(selectedDate, []);
    }
  };

  // Configurar título da página
  useEffect(() => {
    setPageTitle('📦 Controle de Stockout');
  }, [setPageTitle]);

  // Carregar dados automaticamente na primeira renderização
  useEffect(() => {
    if (activeTab === 'diario') {
      if (modoAnalise === 'unica' && selectedDate) {
        console.log('🚀 Carregando dados iniciais para:', selectedDate);
        buscarDadosStockout(selectedDate, filtrosAtivos);
      } else if (modoAnalise === 'periodo') {
        console.log('🚀 Carregando dados de período:', dataInicioDiaria, 'a', dataFimDiaria);
        buscarDadosPeriodo();
      }
    } else if (activeTab === 'historico') {
      buscarHistoricoStockout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, modoAnalise]);

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getStockoutColor = (percentual: string) => {
    const valor = parseFloat(percentual.replace('%', ''));
    if (valor <= 10) return 'text-green-600 dark:text-green-400';
    if (valor <= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStockoutBadgeVariant = (percentual: string) => {
    const valor = parseFloat(percentual.replace('%', ''));
    if (valor <= 10) return 'badge-success';
    if (valor <= 25) return 'badge-warning';
    return 'badge-error';
  };

  // Função para agrupar locais da análise
  const agruparLocaisPorCategoria = () => {
    if (!stockoutData?.analise_por_local) return [];

    const grupos: Record<string, any> = {};

    stockoutData.analise_por_local.forEach(local => {
      const localNormalizado = local.local_producao.toLowerCase().trim();
      
      // Encontrar em qual grupo o local pertence
      let grupoEncontrado = '';
      Object.entries(GRUPOS_LOCAIS).forEach(([key, grupo]) => {
        if (grupo.locais.some(l => localNormalizado.includes(l.toLowerCase()))) {
          grupoEncontrado = key;
        }
      });

      if (grupoEncontrado) {
        if (!grupos[grupoEncontrado]) {
          grupos[grupoEncontrado] = {
            nome: GRUPOS_LOCAIS[grupoEncontrado as keyof typeof GRUPOS_LOCAIS].nome,
            locais: [],
            total_produtos: 0,
            disponiveis: 0,
            indisponiveis: 0
          };
        }

        grupos[grupoEncontrado].locais.push(local);
        grupos[grupoEncontrado].total_produtos += local.total_produtos;
        grupos[grupoEncontrado].disponiveis += local.disponiveis;
        grupos[grupoEncontrado].indisponiveis += local.indisponiveis;
      }
    });

    // Calcular percentual de stockout para cada grupo
    return Object.entries(grupos).map(([key, grupo]) => ({
      key,
      ...grupo,
      perc_stockout: grupo.total_produtos > 0 
        ? parseFloat(((grupo.indisponiveis / grupo.total_produtos) * 100).toFixed(1))
        : 0
    }));
  };

  // Função para filtrar produtos por local selecionado
  const getProdutosPorLocal = () => {
    if (!localSelecionado || !stockoutData) {
      return { disponiveis: [], indisponiveis: [] };
    }

    const grupoSelecionado = GRUPOS_LOCAIS[localSelecionado as keyof typeof GRUPOS_LOCAIS];
    if (!grupoSelecionado) return { disponiveis: [], indisponiveis: [] };

    const disponiveis = (stockoutData.produtos?.ativos || []).filter(produto => {
      const localProduto = (produto.loc_desc || produto.local_producao || '').toLowerCase().trim();
      return grupoSelecionado.locais.some(l => localProduto.includes(l.toLowerCase()));
    });

    const indisponiveis = (stockoutData.produtos?.inativos || []).filter(produto => {
      const localProduto = (produto.loc_desc || produto.local_producao || '').toLowerCase().trim();
      return grupoSelecionado.locais.some(l => localProduto.includes(l.toLowerCase()));
    });

    return { disponiveis, indisponiveis };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <Card className="card-dark mb-6">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="tabs-list-dark mb-6">
                <TabsTrigger value="diario" className="tabs-trigger-dark inline-flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Análise Diária</span>
                </TabsTrigger>
                <TabsTrigger value="historico" className="tabs-trigger-dark inline-flex items-center">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  <span>Histórico</span>
                </TabsTrigger>
              </TabsList>

            <TabsContent value="diario" className="space-y-6">
              {/* Seletor de Modo */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modo de análise:
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={modoAnalise === 'unica' ? 'default' : 'outline'}
                    onClick={() => setModoAnalise('unica')}
                    className={`inline-flex items-center ${modoAnalise === 'unica' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-outline-dark'}`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Data Única</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={modoAnalise === 'periodo' ? 'default' : 'outline'}
                    onClick={() => setModoAnalise('periodo')}
                    className={`inline-flex items-center ${modoAnalise === 'periodo' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-outline-dark'}`}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    <span>Período</span>
                  </Button>
                </div>
              </div>

              {/* Controles de Data */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  {modoAnalise === 'unica' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Data:
                        </label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="input-dark w-[180px]"
                        />
                      </div>
                      <Button
                        onClick={() => buscarDadosStockout(selectedDate, filtrosAtivos)}
                        disabled={loading}
                        className="btn-primary-dark inline-flex items-center"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            <span>Carregando...</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Buscar</span>
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          De:
                        </label>
                        <Input
                          type="date"
                          value={dataInicioDiaria}
                          onChange={(e) => setDataInicioDiaria(e.target.value)}
                          className="input-dark w-[180px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Até:
                        </label>
                        <Input
                          type="date"
                          value={dataFimDiaria}
                          onChange={(e) => setDataFimDiaria(e.target.value)}
                          className="input-dark w-[180px]"
                        />
                      </div>
                      <Button
                        onClick={buscarDadosPeriodo}
                        disabled={loading}
                        className="btn-primary-dark inline-flex items-center"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            <span>Carregando...</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 mr-2" />
                            <span>Buscar Período</span>
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="btn-outline-dark inline-flex items-center"
                  >
                    <span>Filtros ({filtrosAtivos.length})</span>
                  </Button>
                  {filtrosAtivos.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={limparFiltros}
                      className="btn-outline-dark text-red-600 dark:text-red-400 inline-flex items-center"
                    >
                      <span>Limpar</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Seção de Filtros */}
              {mostrarFiltros && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Excluir da análise:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filtrosAtivos.includes('Pegue e Pague') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFiltro('Pegue e Pague')}
                      className={`inline-flex items-center ${filtrosAtivos.includes('Pegue e Pague') ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-outline-dark'}`}
                    >
                      <span>Pegue e Pague</span>
                    </Button>
                    <Button
                      variant={filtrosAtivos.includes('sem_local') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFiltro('sem_local')}
                      className={`inline-flex items-center ${filtrosAtivos.includes('sem_local') ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-outline-dark'}`}
                    >
                      <span>Sem local definido</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Produtos dos locais selecionados serão excluídos do cálculo de stockout
                  </p>
                </div>
              )}

              {stockoutData && (
                <>
                  {/* Badge de Período */}
                  {modoAnalise === 'periodo' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Análise de Período - Valores Médios
                          </h3>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Período: {formatarData(dataInicioDiaria)} até {formatarData(dataFimDiaria)}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Os valores abaixo representam as médias calculadas para o período selecionado
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {modoAnalise === 'periodo' ? 'Média de Produtos' : 'Total de Produtos'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stockoutData?.estatisticas?.total_produtos || 0}
                        </div>
                        {modoAnalise === 'periodo' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            por dia
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                          {modoAnalise === 'periodo' ? 'Média Produtos Ativos' : 'Produtos Ativos'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          {stockoutData?.estatisticas?.produtos_ativos || 0}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {stockoutData?.estatisticas?.percentual_disponibilidade || '0%'} disponível{modoAnalise === 'periodo' ? ' (média)' : ''}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                          {modoAnalise === 'periodo' ? 'Média Produtos Inativos' : 'Produtos Inativos'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          {stockoutData?.estatisticas?.produtos_inativos || 0}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Em stockout{modoAnalise === 'periodo' ? ' (média)' : ''}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          % Stockout {modoAnalise === 'periodo' ? '(Média)' : ''}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getStockoutColor(stockoutData?.estatisticas?.percentual_stockout || '0%')}`}>
                          {stockoutData?.estatisticas?.percentual_stockout || '0%'}
                        </div>
                        <Badge className={getStockoutBadgeVariant(stockoutData?.estatisticas?.percentual_stockout || '0%')}>
                          {parseFloat((stockoutData?.estatisticas?.percentual_stockout || '0%').replace('%', '')) <= 10 ? 'Excelente' :
                           parseFloat((stockoutData?.estatisticas?.percentual_stockout || '0%').replace('%', '')) <= 25 ? 'Atenção' : 'Crítico'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Análise Agrupada por Local */}
                  {stockoutData?.analise_por_local && stockoutData.analise_por_local.length > 0 && (
                    <>
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Análise por Local
                          </CardTitle>
                          <CardDescription className="card-description-dark">
                            Percentual de stockout por setor (clique em um local para ver detalhes)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {agruparLocaisPorCategoria().map((grupo) => (
                              <div 
                                key={grupo.key}
                                onClick={() => setLocalSelecionado(grupo.key)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  localSelecionado === grupo.key
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                              >
                                <div className="text-center">
                                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                                    {grupo.nome}
                                  </h4>
                                  <div className={`text-3xl font-bold mb-2 ${
                                    grupo.perc_stockout <= 10 ? 'text-green-600 dark:text-green-400' :
                                    grupo.perc_stockout <= 25 ? 'text-yellow-600 dark:text-yellow-400' :
                                    grupo.perc_stockout <= 50 ? 'text-orange-600 dark:text-orange-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {grupo.perc_stockout}%
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {grupo.total_produtos} produtos
                                  </p>
                                  <div className="flex justify-center gap-4 text-xs">
                                    <span className="text-green-600 dark:text-green-400">
                                      ✓ {grupo.disponiveis}
                                    </span>
                                    <span className="text-red-600 dark:text-red-400">
                                      ✗ {grupo.indisponiveis}
                                    </span>
                                  </div>
                                  {localSelecionado === grupo.key && (
                                    <div className="mt-2">
                                      <Badge className="badge-primary">Selecionado</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Detalhes do Local Selecionado */}
                      {localSelecionado && (
                        <Card className="card-dark">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <Package className="h-5 w-5" />
                                  Produtos: {GRUPOS_LOCAIS[localSelecionado as keyof typeof GRUPOS_LOCAIS]?.nome}
                                </CardTitle>
                                <CardDescription className="card-description-dark">
                                  Produtos disponíveis e em stockout para {formatarData(stockoutData?.data_analisada || '')}
                                </CardDescription>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocalSelecionado('')}
                                className="btn-outline-dark inline-flex items-center"
                              >
                                <span>Limpar</span>
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Produtos em Stockout */}
                              {getProdutosPorLocal().indisponiveis.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Produtos em Stockout ({getProdutosPorLocal().indisponiveis.length})
                                  </h4>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {getProdutosPorLocal().indisponiveis.map((produto, index) => (
                                      <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20 rounded">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                              {produto.prd_desc || produto.produto_descricao || 'Produto sem nome'}
                                            </h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              Local: {produto.loc_desc || produto.local_producao || 'Não informado'}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            {produto.prd_precovenda && (
                                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                R$ {Number(produto.prd_precovenda).toFixed(2)}
                                              </p>
                                            )}
                                            {produto.prd_estoque !== undefined && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Estoque: {produto.prd_estoque}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Produtos Disponíveis */}
                              {getProdutosPorLocal().disponiveis.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Produtos Disponíveis ({getProdutosPorLocal().disponiveis.length})
                                  </h4>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {getProdutosPorLocal().disponiveis.map((produto, index) => (
                                      <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-900/20 rounded">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                              {produto.prd_desc || produto.produto_descricao || 'Produto sem nome'}
                                            </h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              Local: {produto.loc_desc || produto.local_producao || 'Não informado'}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            {produto.prd_precovenda && (
                                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                R$ {Number(produto.prd_precovenda).toFixed(2)}
                                              </p>
                                            )}
                                            {produto.prd_estoque !== undefined && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Estoque: {produto.prd_estoque}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {getProdutosPorLocal().disponiveis.length === 0 && getProdutosPorLocal().indisponiveis.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                  <p>Nenhum produto encontrado para este local</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}

              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">Carregando dados de stockout...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    De:
                  </label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="input-dark w-[180px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Até:
                  </label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="input-dark w-[180px]"
                  />
                </div>
                <Button
                  onClick={buscarHistoricoStockout}
                  disabled={loading}
                  className="btn-primary-dark inline-flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 mr-2" />
                      <span>Buscar Histórico</span>
                    </>
                  )}
                </Button>
              </div>

              {historicoData && (
                <>
                  {/* Resumo do Período */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total de Dias
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {historicoData.resumo.total_dias}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                          Média de Stockout
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getStockoutColor(historicoData.resumo.media_stockout)}`}>
                          {historicoData.resumo.media_stockout}
                        </div>
                        <Badge className={getStockoutBadgeVariant(historicoData.resumo.media_stockout)}>
                          Período
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                          Média de Disponibilidade
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {historicoData.resumo.media_disponibilidade}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Análise por Dia da Semana */}
                  <Card className="card-dark">
                    <CardHeader>
                      <CardTitle className="card-title-dark flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Análise por Dia da Semana
                      </CardTitle>
                      <CardDescription className="card-description-dark">
                        Média de stockout por dia da semana (baseado em produtos ativos='S' e venda='N')
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        {historicoData.analise_por_dia_semana.map((dia, index) => (
                          <div key={index} className={`p-4 rounded-lg border-2 ${
                            dia.melhor_dia ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                            dia.pior_dia ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                            'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          }`}>
                            <div className="text-center">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                {dia.dia_semana}
                              </h4>
                              <div className={`text-lg font-bold ${getStockoutColor(dia.media_stockout)}`}>
                                {dia.media_stockout}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {dia.total_ocorrencias} dia{dia.total_ocorrencias !== 1 ? 's' : ''}
                              </p>
                              {dia.melhor_dia && (
                                <Badge className="badge-success mt-2">
                                  Melhor
                                </Badge>
                              )}
                              {dia.pior_dia && (
                                <Badge className="badge-error mt-2">
                                  Pior
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Análise Semanal */}
                  {historicoData.analise_semanal.length > 1 && (
                    <Card className="card-dark">
                      <CardHeader>
                        <CardTitle className="card-title-dark flex items-center gap-2">
                          <TrendingDown className="h-5 w-5" />
                          Análise Semanal
                        </CardTitle>
                        <CardDescription className="card-description-dark">
                          Média de stockout por semana
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {historicoData.analise_semanal.map((semana, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Semana {semana.numero_semana}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatarData(semana.semana_inicio)} - {formatarData(semana.semana_fim)} • {semana.dias_com_dados} dias
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${getStockoutColor(semana.media_stockout)}`}>
                                  {semana.media_stockout}
                                </div>
                                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      parseFloat(semana.media_stockout.replace('%', '')) <= 10 ? 'bg-green-500' :
                                      parseFloat(semana.media_stockout.replace('%', '')) <= 25 ? 'bg-yellow-500' :
                                      parseFloat(semana.media_stockout.replace('%', '')) <= 50 ? 'bg-orange-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(parseFloat(semana.media_stockout.replace('%', '')), 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tabela de Histórico */}
                  <Card className="card-dark">
                    <CardHeader>
                      <CardTitle className="card-title-dark">
                        Histórico Detalhado
                      </CardTitle>
                      <CardDescription className="card-description-dark">
                        Dados diários de stockout do período selecionado (apenas produtos ativos)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="table-dark">
                          <thead className="table-header-dark">
                            <tr className="table-row-dark">
                              <th className="table-cell-dark text-left">Data</th>
                              <th className="table-cell-dark text-center">Dia da Semana</th>
                              <th className="table-cell-dark text-center">Produtos Ativos</th>
                              <th className="table-cell-dark text-center">Disponíveis</th>
                              <th className="table-cell-dark text-center">Stockout</th>
                              <th className="table-cell-dark text-center">% Stockout</th>
                              <th className="table-cell-dark text-center">% Disponibilidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historicoData.historico_diario.map((dia, index) => (
                              <tr key={index} className="table-row-dark">
                                <td className="table-cell-dark font-medium">
                                  {formatarData(dia.data_referencia)}
                                </td>
                                <td className="table-cell-dark text-center text-gray-600 dark:text-gray-400">
                                  {dia.dia_semana}
                                </td>
                                <td className="table-cell-dark text-center">
                                  {dia.total_produtos_ativos}
                                </td>
                                <td className="table-cell-dark text-center text-green-600 dark:text-green-400">
                                  {dia.produtos_disponiveis}
                                </td>
                                <td className="table-cell-dark text-center text-red-600 dark:text-red-400">
                                  {dia.produtos_stockout}
                                </td>
                                <td className="table-cell-dark text-center">
                                  <Badge className={getStockoutBadgeVariant(dia.percentual_stockout)}>
                                    {dia.percentual_stockout}
                                  </Badge>
                                </td>
                                <td className="table-cell-dark text-center text-green-600 dark:text-green-400">
                                  {dia.percentual_disponibilidade}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">Carregando histórico de stockout...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
