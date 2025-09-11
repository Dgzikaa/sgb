'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Package, TrendingDown, TrendingUp, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StockoutData {
  data_referencia: string;
  bar_id: number;
  timestamp_consulta: string;
  estatisticas: {
    total_produtos: number;
    produtos_ativos: number;
    produtos_inativos: number;
    percentual_stockout: string;
    percentual_disponibilidade: string;
  };
  produtos: {
    ativos: Array<{
      produto_id: string;
      produto_descricao: string;
      grupo_descricao: string;
      timestamp_coleta: string;
    }>;
    inativos: Array<{
      produto_id: string;
      produto_descricao: string;
      grupo_descricao: string;
      timestamp_coleta: string;
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
  historico: Array<{
    data_referencia: string;
    total_produtos: number;
    produtos_ativos: number;
    produtos_inativos: number;
    percentual_stockout: string;
    percentual_disponibilidade: string;
  }>;
}

export default function StockoutPage() {
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
  
  // Datas para histórico
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

  const buscarDadosStockout = async (data: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contahub/stockout-dados?data=${data}&bar_id=3`);
      const result = await response.json();
      
      if (result.success) {
        setStockoutData(result.data);
        toast.success(`Dados de stockout carregados para ${data}`);
      } else {
        toast.error(result.error || 'Erro ao buscar dados de stockout');
        setStockoutData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de stockout:', error);
      toast.error('Erro ao buscar dados de stockout');
      setStockoutData(null);
    } finally {
      setLoading(false);
    }
  };

  const buscarHistoricoStockout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contahub/stockout-dados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_inicio: dataInicio,
          data_fim: dataFim,
          bar_id: 3
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setHistoricoData(result.data);
        toast.success(`Histórico de stockout carregado (${result.data.resumo.total_dias} dias)`);
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

  useEffect(() => {
    if (activeTab === 'diario') {
      buscarDadosStockout(selectedDate);
    } else if (activeTab === 'historico') {
      buscarHistoricoStockout();
    }
  }, [selectedDate, activeTab]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="card-title-dark flex items-center gap-2">
                <Package className="h-6 w-6" />
                Controle de Stockout
              </h1>
              <p className="card-description-dark">
                Monitore a disponibilidade de produtos do bar
              </p>
            </div>
            <Button
              onClick={executarSyncManual}
              disabled={syncLoading}
              className="btn-primary-dark"
            >
              {syncLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar
                </>
              )}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="tabs-list-dark">
              <TabsTrigger value="diario" className="tabs-trigger-dark">
                <Calendar className="h-4 w-4 mr-2" />
                Análise Diária
              </TabsTrigger>
              <TabsTrigger value="historico" className="tabs-trigger-dark">
                <TrendingDown className="h-4 w-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diario" className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data:
                  </label>
                </div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-dark w-auto"
                />
                <Button
                  onClick={() => buscarDadosStockout(selectedDate)}
                  disabled={loading}
                  variant="outline"
                  className="btn-outline-dark"
                >
                  {loading ? 'Carregando...' : 'Buscar'}
                </Button>
              </div>

              {stockoutData && (
                <>
                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total de Produtos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stockoutData.estatisticas.total_produtos}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                          Produtos Ativos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          {stockoutData.estatisticas.produtos_ativos}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {stockoutData.estatisticas.percentual_disponibilidade} disponível
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                          Produtos Inativos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          {stockoutData.estatisticas.produtos_inativos}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Em stockout
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="card-dark">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          % Stockout
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getStockoutColor(stockoutData.estatisticas.percentual_stockout)}`}>
                          {stockoutData.estatisticas.percentual_stockout}
                        </div>
                        <Badge className={getStockoutBadgeVariant(stockoutData.estatisticas.percentual_stockout)}>
                          {parseFloat(stockoutData.estatisticas.percentual_stockout.replace('%', '')) <= 10 ? 'Excelente' :
                           parseFloat(stockoutData.estatisticas.percentual_stockout.replace('%', '')) <= 25 ? 'Atenção' : 'Crítico'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Produtos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Produtos Inativos */}
                    <Card className="card-dark">
                      <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Produtos em Stockout ({stockoutData.estatisticas.produtos_inativos})
                        </CardTitle>
                        <CardDescription className="card-description-dark">
                          Produtos que não estavam disponíveis em {formatarData(stockoutData.data_referencia)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stockoutData.produtos.inativos.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>Nenhum produto em stockout!</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {stockoutData.grupos.inativos.map((grupo, index) => (
                              <div key={index} className="border-l-4 border-red-500 pl-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                  {grupo.grupo} ({grupo.quantidade})
                                </h4>
                                <div className="space-y-1">
                                  {grupo.produtos.map((produto, prodIndex) => (
                                    <div key={prodIndex} className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                      {produto}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Produtos Ativos */}
                    <Card className="card-dark">
                      <CardHeader>
                        <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Produtos Disponíveis ({stockoutData.estatisticas.produtos_ativos})
                        </CardTitle>
                        <CardDescription className="card-description-dark">
                          Produtos que estavam disponíveis em {formatarData(stockoutData.data_referencia)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {stockoutData.grupos.ativos.map((grupo, index) => (
                            <div key={index} className="border-l-4 border-green-500 pl-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {grupo.grupo} ({grupo.quantidade})
                              </h4>
                              <div className="space-y-1">
                                {grupo.produtos.slice(0, 5).map((produto, prodIndex) => (
                                  <div key={prodIndex} className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                    {produto}
                                  </div>
                                ))}
                                {grupo.produtos.length > 5 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                                    ... e mais {grupo.produtos.length - 5} produtos
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
                    className="input-dark w-auto"
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
                    className="input-dark w-auto"
                  />
                </div>
                <Button
                  onClick={buscarHistoricoStockout}
                  disabled={loading}
                  className="btn-primary-dark"
                >
                  {loading ? 'Carregando...' : 'Buscar Histórico'}
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

                  {/* Tabela de Histórico */}
                  <Card className="card-dark">
                    <CardHeader>
                      <CardTitle className="card-title-dark">
                        Histórico Detalhado
                      </CardTitle>
                      <CardDescription className="card-description-dark">
                        Dados diários de stockout do período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="table-dark">
                          <thead className="table-header-dark">
                            <tr className="table-row-dark">
                              <th className="table-cell-dark text-left">Data</th>
                              <th className="table-cell-dark text-center">Total Produtos</th>
                              <th className="table-cell-dark text-center">Ativos</th>
                              <th className="table-cell-dark text-center">Inativos</th>
                              <th className="table-cell-dark text-center">% Stockout</th>
                              <th className="table-cell-dark text-center">% Disponibilidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historicoData.historico.map((dia, index) => (
                              <tr key={index} className="table-row-dark">
                                <td className="table-cell-dark font-medium">
                                  {formatarData(dia.data_referencia)}
                                </td>
                                <td className="table-cell-dark text-center">
                                  {dia.total_produtos}
                                </td>
                                <td className="table-cell-dark text-center text-green-600 dark:text-green-400">
                                  {dia.produtos_ativos}
                                </td>
                                <td className="table-cell-dark text-center text-red-600 dark:text-red-400">
                                  {dia.produtos_inativos}
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
        </div>
      </div>
    </div>
  );
}
