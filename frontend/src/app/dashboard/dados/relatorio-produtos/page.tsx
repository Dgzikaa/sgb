'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useBar } from '@/contexts/BarContext';

interface ProdutoTempo {
  produto: string;
  grupo: string;
  tempo_medio_geral: number;
  tempo_medio_30dias: number;
  tempo_dia_especifico: number;
  variacao_percentual: number;
  total_pedidos: number;
  pedidos_30dias: number;
  pedidos_dia: number;
  status: 'normal' | 'alto' | 'muito_alto' | 'baixo';
}

interface TempoHistorico {
  data: string;
  tempo_medio: number;
  total_pedidos: number;
  produtos_problema: string[];
}

interface EstatisticasGerais {
  tempo_medio_geral: number;
  tempo_medio_30dias: number;
  tempo_dia_especifico: number;
  variacao_geral: number;
  total_produtos: number;
  produtos_problema: number;
}

export default function RelatorioProdutos() {
  const { selectedBar } = useBar();

  const getDataOntem = () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return ontem.toISOString().split('T')[0];
  };

  const getDataHoje = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };

  // Estados
  const [dataEspecifica, setDataEspecifica] = useState(getDataOntem()); // Começar com ontem por padrão
  const [periodoAnalise, setPeriodoAnalise] = useState('30');
  const [grupoFiltro, setGrupoFiltro] = useState('todos');
  const [filtroVariacao, setFiltroVariacao] = useState('todos'); // Novo filtro de variação
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [analisado, setAnalisado] = useState(false); // Novo estado para controlar se já foi analisado
  
  const [produtosTempo, setProdutosTempo] = useState<ProdutoTempo[]>([]);
  const [tempoHistorico, setTempoHistorico] = useState<TempoHistorico[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [metaInfo, setMetaInfo] = useState<any>(null);
  const [metricas, setMetricas] = useState<any>(null);

  // Carregar apenas grupos inicialmente
  useEffect(() => {
    carregarGrupos();
  }, [selectedBar]);

  const carregarGrupos = async () => {
    try {
      const response = await fetch(`/api/relatorios/produtos/grupos?bar_id=${selectedBar?.id || 1}`);
      const data = await response.json();
      if (data.success) {
        setGrupos(data.grupos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const analisarTempos = async () => {
    if (!dataEspecifica) {
      alert('Por favor, selecione uma data para análise');
      return;
    }

    console.log(`🔍 INICIANDO ANÁLISE - Data: ${dataEspecifica}, Período: ${periodoAnalise}, Grupo: ${grupoFiltro}, Bar: ${selectedBar?.id || 1}`);
    
    setLoading(true);
    setAnalisado(false); // Reset do estado analisado
    try {
      const params = new URLSearchParams({
        data_especifica: dataEspecifica,
        periodo_analise: periodoAnalise,
        grupo_filtro: grupoFiltro,
        bar_id: (selectedBar?.id || 1).toString()
      });

      console.log(`🔍 Parâmetros da requisição:`, params.toString());

      const [produtosRes, historicoRes, estatisticasRes] = await Promise.all([
        fetch(`/api/relatorios/produtos/tempos?${params}`),
        fetch(`/api/relatorios/produtos/historico?${params}`),
        fetch(`/api/relatorios/produtos/estatisticas?${params}`)
      ]);

      console.log(`📡 Status das respostas:`, {
        produtos: produtosRes.status,
        historico: historicoRes.status,
        estatisticas: estatisticasRes.status
      });

      const produtosData = await produtosRes.json();
      const historicoData = await historicoRes.json();
      const estatisticasData = await estatisticasRes.json();

      console.log('📊 Dados recebidos:', {
        produtos: {
          success: produtosData.success,
          length: produtosData.produtos?.length || 0,
          error: produtosData.error
        },
        historico: {
          success: historicoData.success,
          length: historicoData.historico?.length || 0,
          error: historicoData.error
        },
        estatisticas: {
          success: estatisticasData.success,
          data: !!estatisticasData.estatisticas,
          error: estatisticasData.error
        }
      });

      if (produtosData.success) {
        setProdutosTempo(produtosData.produtos || []);
        setMetaInfo(produtosData.meta || null);
        setMetricas(produtosData.metricas_qualidade || null);
        console.log(`✅ Produtos definidos: ${produtosData.produtos?.length || 0}`);
        
        // Debug detalhado dos produtos
        const produtos = produtosData.produtos || [];
        console.log(`🔍 Debug produtos filtrados:`, {
          total: produtos.length,
          comTempoDia: produtos.filter((p: any) => p.tempo_dia_especifico > 0).length,
          comPedidosDia: produtos.filter((p: any) => p.pedidos_dia > 0).length,
          comTempoGeral: produtos.filter((p: any) => p.tempo_medio_geral > 0).length,
          exemplos: produtos.slice(0, 5).map((p: any) => ({
            nome: p.produto,
            pedidos_dia: p.pedidos_dia,
            tempo_dia: p.tempo_dia_especifico,
            tempo_geral: p.tempo_medio_geral,
            variacao: p.variacao_percentual,
            tipo: p.tipo,
            tempo_usado: p.tempo_usado
          }))
        });
        
        // Log das métricas de qualidade
        if (produtosData.metricas_qualidade) {
          console.log(`📊 Métricas de qualidade:`, produtosData.metricas_qualidade);
        }
      } else {
        console.error('❌ Erro nos dados de produtos:', produtosData.error);
      }
      
      if (historicoData.success) {
        setTempoHistorico(historicoData.historico || []);
        console.log(`✅ Histórico definido: ${historicoData.historico?.length || 0}`);
      } else {
        console.error('❌ Erro nos dados de histórico:', historicoData.error);
      }
      
      if (estatisticasData.success) {
        setEstatisticas(estatisticasData.estatisticas || null);
        console.log(`✅ Estatísticas definidas:`, estatisticasData.estatisticas);
      } else {
        console.error('❌ Erro nos dados de estatísticas:', estatisticasData.error);
      }

      // Marcar como analisado após carregar todos os dados
      setAnalisado(true);

    } catch (error) {
      console.error('❌ Erro ao analisar tempos:', error);
      alert('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
      console.log(`🏁 Análise finalizada - Loading: false`);
    }
  };

  // Função para carregar dados de hoje
  const carregarDadosHoje = () => {
    setDataEspecifica(getDataHoje());
    setTimeout(() => analisarTempos(), 100);
  };

  // Função para carregar dados de ontem
  const carregarDadosOntem = () => {
    setDataEspecifica(getDataOntem());
    setTimeout(() => analisarTempos(), 100);
  };

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'muito_alto': return 'bg-red-600 text-white';
      case 'alto': return 'bg-orange-500 text-white';
      case 'baixo': return 'bg-blue-500 text-white';
      default: return 'bg-green-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'muito_alto': return <AlertTriangle className="h-4 w-4" />;
      case 'alto': return <TrendingUp className="h-4 w-4" />;
      case 'baixo': return <TrendingDown className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatório de Tempo de Produção</h1>
          <p className="text-gray-600">
            Análise detalhada dos tempos de produção por produto com detecção de outliers
          </p>
          
          {/* Botões de acesso rápido */}
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={carregarDadosHoje}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Hoje
            </Button>
            <Button 
              onClick={carregarDadosOntem}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Clock className="h-4 w-4 mr-1" />
              Ontem
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configurações da Análise</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="data" className="text-gray-700 font-medium mb-2 block">Data para Análise</Label>
              <div className="relative">
                <Input
                  id="data"
                  type="date"
                  value={dataEspecifica}
                  onChange={(e) => setDataEspecifica(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    colorScheme: 'light'
                  }}
                />
              </div>
              {dataEspecifica && (
                <p className="text-xs text-gray-500 mt-1">
                  Data selecionada: {new Date(dataEspecifica + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodo" className="text-gray-700 font-medium mb-2 block">Período de Comparação</Label>
              <Select value={periodoAnalise} onValueChange={setPeriodoAnalise}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="todos">Desde o início</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grupo" className="text-gray-700 font-medium mb-2 block">Filtrar por Grupo</Label>
              <Select value={grupoFiltro} onValueChange={setGrupoFiltro}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  {grupos.map(grupo => (
                    <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="variacao" className="text-gray-700 font-medium mb-2 block">Filtrar por Variação</Label>
              <Select value={filtroVariacao} onValueChange={setFiltroVariacao}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Selecione a variação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="muito_alto">🔴 Muito Alto (&gt;50%)</SelectItem>
                  <SelectItem value="alto">🟠 Alto (25-50%)</SelectItem>
                  <SelectItem value="normal">🟢 Normal (&lt;25%)</SelectItem>
                  <SelectItem value="baixo">🔵 Baixo (&lt;-15%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={analisarTempos} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analisando...
                  </div>
                ) : (
                  'Analisar Tempos'
                )}
              </Button>
            </div>
          </div>

          {/* Informações da análise */}
          {analisado && metaInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total de Produtos:</span>
                  <br />
                  <span className="text-gray-900">{metaInfo.total_produtos}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Com Dados no Dia:</span>
                  <br />
                  <span className="text-gray-900">{metaInfo.produtos_com_dados_dia}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Variação Alta:</span>
                  <br />
                  <span className="text-orange-600 font-semibold">{metaInfo.produtos_com_variacao_alta}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Registros Analisados:</span>
                  <br />
                  <span className="text-gray-900">{metaInfo.dados_periodo_total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas Gerais */}
        {analisado && estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio Geral</p>
                  <p className="text-2xl font-bold text-gray-900">{formatarTempo(estatisticas.tempo_medio_geral)}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo no Dia</p>
                  <p className="text-2xl font-bold text-gray-900">{formatarTempo(estatisticas.tempo_dia_especifico)}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Variação</p>
                  <p className={`text-2xl font-bold ${estatisticas.variacao_geral > 0 ? 'text-red-600' : estatisticas.variacao_geral < -10 ? 'text-green-600' : 'text-gray-600'}`}>
                    {estatisticas.variacao_geral > 0 ? '+' : ''}{estatisticas.variacao_geral.toFixed(1)}%
                  </p>
                </div>
                {estatisticas.variacao_geral > 10 ? 
                  <TrendingUp className="h-8 w-8 text-red-500" /> : 
                  estatisticas.variacao_geral < -10 ?
                  <TrendingDown className="h-8 w-8 text-green-500" /> :
                  <Clock className="h-8 w-8 text-gray-400" />
                }
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Produtos Problema</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {estatisticas.produtos_problema}/{estatisticas.total_produtos}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Métricas de Qualidade dos Dados */}
        {analisado && metricas && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Qualidade dos Dados</h2>
              <span className="text-sm text-gray-500">
                (Regras: Bebidas t0→t3, Comidas t1→t2)
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bebidas */}
              <div className="border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  🍺 Bebidas (t0→t3)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{metricas.bebidas.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">✅ Completas:</span>
                    <span className="font-medium text-green-600">{metricas.bebidas.completas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">❌ Sem t0:</span>
                    <span className="font-medium text-red-600">{metricas.bebidas.sem_t0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">❌ Sem t3:</span>
                    <span className="font-medium text-red-600">{metricas.bebidas.sem_t3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">⚠️ Sem cálculo:</span>
                    <span className="font-medium text-orange-600">{metricas.bebidas.sem_calculo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">🔍 Outliers:</span>
                    <span className="font-medium text-purple-600">{metricas.bebidas.outliers}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>Taxa de Sucesso:</span>
                      <span className={metricas.bebidas.total > 0 ? 
                        (metricas.bebidas.completas / metricas.bebidas.total > 0.8 ? 'text-green-600' : 'text-orange-600') : 
                        'text-gray-600'
                      }>
                        {metricas.bebidas.total > 0 ? 
                          `${((metricas.bebidas.completas / metricas.bebidas.total) * 100).toFixed(1)}%` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comidas */}
              <div className="border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  🍽️ Comidas (t1→t2)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{metricas.comidas.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">✅ Completas:</span>
                    <span className="font-medium text-green-600">{metricas.comidas.completas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">❌ Sem t1:</span>
                    <span className="font-medium text-red-600">{metricas.comidas.sem_t1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">❌ Sem t2:</span>
                    <span className="font-medium text-red-600">{metricas.comidas.sem_t2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">⚠️ Sem cálculo:</span>
                    <span className="font-medium text-orange-600">{metricas.comidas.sem_calculo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">🔍 Outliers:</span>
                    <span className="font-medium text-purple-600">{metricas.comidas.outliers}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>Taxa de Sucesso:</span>
                      <span className={metricas.comidas.total > 0 ? 
                        (metricas.comidas.completas / metricas.comidas.total > 0.8 ? 'text-green-600' : 'text-orange-600') : 
                        'text-gray-600'
                      }>
                        {metricas.comidas.total > 0 ? 
                          `${((metricas.comidas.completas / metricas.comidas.total) * 100).toFixed(1)}%` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indefinidos */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  ❓ Indefinidos
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{metricas.indefinidos.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">📊 Com dados:</span>
                    <span className="font-medium text-blue-600">{metricas.indefinidos.com_dados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">❌ Sem dados:</span>
                    <span className="font-medium text-gray-600">{metricas.indefinidos.sem_dados}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo de Ações */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Ações Recomendadas:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Treinar equipe para sempre preencher t0 (lançamento) e t3 (entrega) para bebidas</li>
                <li>• Treinar equipe para sempre preencher t1 (início produção) e t2 (fim produção) para comidas</li>
                <li>• Outliers são automaticamente excluídos do cálculo da média</li>
                <li>• Meta: Taxa de sucesso acima de 80% para dados confiáveis</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tabs com análises */}
        {analisado && (
          <div className="bg-white rounded-lg shadow-sm">
            <Tabs defaultValue="produtos" className="p-6">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="produtos" className="data-[state=active]:bg-white">
                  Análise por Produto
                </TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-white">
                  Histórico Temporal
                </TabsTrigger>
              </TabsList>

            <TabsContent value="produtos" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Produtos Produzidos no Dia
                    {(() => {
                      const produtosFiltrados = produtosTempo
                        .filter(p => p.pedidos_dia > 0 && p.tempo_dia_especifico > 0)
                        .filter(p => filtroVariacao === 'todos' || p.status === filtroVariacao);
                      return produtosFiltrados.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {produtosFiltrados.length} produtos
                          {filtroVariacao !== 'todos' && (
                            <span className="ml-1 text-xs">
                              ({filtroVariacao.replace('_', ' ')})
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Produtos que foram efetivamente produzidos no dia selecionado, ordenados por variação de tempo
                  </p>
                </div>
                
                {produtosTempo.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
                    <p className="text-gray-600 mb-4">
                      Não foram encontrados dados de tempo de produção para a data selecionada.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={carregarDadosOntem} variant="outline">
                        Tentar Ontem
                      </Button>
                      <Button onClick={carregarDadosHoje} variant="outline">
                        Tentar Hoje
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                      {produtosTempo
                        .filter(produto => produto.pedidos_dia > 0 && produto.tempo_dia_especifico > 0) // Mostrar apenas produtos com dados no dia
                        .filter(produto => {
                          // Filtro de variação
                          if (filtroVariacao === 'todos') return true;
                          return produto.status === filtroVariacao;
                        })
                        .map((produto: any, index: any) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{produto.produto}</h4>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                  {produto.grupo}
                                </span>
                                {produto.tipo && (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    produto.tipo === 'bebida' ? 'bg-blue-100 text-blue-700' :
                                    produto.tipo === 'comida' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {produto.tipo === 'bebida' ? '🍺' : produto.tipo === 'comida' ? '🍽️' : '❓'} {produto.tipo}
                                  </span>
                                )}
                                {produto.tempo_usado && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                    {produto.tempo_usado}
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(produto.status)}`}>
                                  {getStatusIcon(produto.status)}
                                  {produto.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium text-gray-700">Média Geral:</span>
                                  <br />
                                  <span className="text-gray-900">{formatarTempo(produto.tempo_medio_geral)}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">No Dia:</span>
                                  <br />
                                  <span className="text-gray-900">
                                    {produto.tempo_dia_especifico > 0 ? formatarTempo(produto.tempo_dia_especifico) : 'Sem dados'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Variação:</span>
                                  <br />
                                  <span className={produto.variacao_percentual > 0 ? 'text-red-600 font-semibold' : produto.variacao_percentual < -10 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                                    {produto.tempo_dia_especifico > 0 ? 
                                      `${produto.variacao_percentual > 0 ? '+' : ''}${produto.variacao_percentual.toFixed(1)}%` : 
                                      'N/A'
                                    }
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Pedidos:</span>
                                  <br />
                                  <span className="text-gray-900">
                                    {produto.pedidos_dia > 0 ? `${produto.pedidos_dia} no dia` : 'Nenhum no dia'}
                                  </span>
                                </div>
                                {produto.desvio_padrao && (
                                  <div>
                                    <span className="font-medium text-gray-700">Desvio:</span>
                                    <br />
                                    <span className="text-gray-900">{formatarTempo(produto.desvio_padrao)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                                              ))}
                      
                      {/* Mostrar quando não há produtos */}
                      {(() => {
                        const produtosFiltrados = produtosTempo
                          .filter(p => p.pedidos_dia > 0 && p.tempo_dia_especifico > 0)
                          .filter(p => filtroVariacao === 'todos' || p.status === filtroVariacao);
                        return produtosFiltrados.length === 0 && (
                          <div className="text-center py-8">
                            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">
                              {filtroVariacao === 'todos' 
                                ? 'Nenhum produto encontrado com dados no dia selecionado.'
                                : `Nenhum produto encontrado com status "${filtroVariacao.replace('_', ' ')}" no dia selecionado.`
                              }
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              {filtroVariacao === 'todos' 
                                ? 'Tente selecionar uma data diferente ou verificar se há dados disponíveis.'
                                : 'Tente alterar o filtro de variação ou selecionar uma data diferente.'
                              }
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Evolução Temporal</h3>
                  <p className="text-gray-600 mb-4">
                    Histórico dos tempos médios de produção nos últimos dias
                  </p>
                </div>

                {tempoHistorico.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Tempo Médio por Dia</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={tempoHistorico}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="data" 
                              stroke="#6b7280"
                              fontSize={12}
                            />
                            <YAxis 
                              stroke="#6b7280"
                              fontSize={12}
                              tickFormatter={(value) => `${Math.round(value/60)}m`}
                            />
                            <Tooltip 
                              formatter={(value: number) => [formatarTempo(value), 'Tempo Médio']}
                              labelFormatter={(label) => `Data: ${label}`}
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="tempo_medio" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Volume de Pedidos</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tempoHistorico}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="data" 
                              stroke="#6b7280"
                              fontSize={12}
                            />
                            <YAxis 
                              stroke="#6b7280"
                              fontSize={12}
                            />
                            <Tooltip 
                              formatter={(value: number) => [value, 'Pedidos']}
                              labelFormatter={(label) => `Data: ${label}`}
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                              }}
                            />
                            <Bar 
                              dataKey="total_pedidos" 
                              fill="#10b981"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          </div>
        )}

        {/* Estado inicial - antes da análise */}
        {!analisado && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pronto para Análise</h3>
            <p className="text-gray-600 mb-6">
              Configure os filtros acima e clique em "Analisar Tempos" para ver os dados de produção.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={carregarDadosOntem} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <Clock className="h-4 w-4 mr-1" />
                Analisar Ontem
              </Button>
              <Button onClick={carregarDadosHoje} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <Calendar className="h-4 w-4 mr-1" />
                Analisar Hoje
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 