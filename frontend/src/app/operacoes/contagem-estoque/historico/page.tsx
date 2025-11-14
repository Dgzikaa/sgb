'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  DollarSign,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface HistoricoItem {
  id: number;
  data_contagem: string;
  estoque_fechado: number;
  estoque_flutuante: number;
  estoque_total: number;
  preco: number;
  valor_total: number;
  variacao_percentual: number | null;
  alerta_variacao: boolean;
  alerta_preenchimento: boolean;
  observacoes: string | null;
  created_at: string;
  alteracoes: any[];
}

interface Estatisticas {
  total_contagens: number;
  total_alteracoes: number;
  primeira_contagem: string | null;
  ultima_contagem: string | null;
  estoque_atual: number;
  valor_atual: number;
  variacao_total_estoque: number;
  alertas_total: number;
}

const CATEGORIAS = [
  'Bebidas',
  'Alimentos',
  'Insumos',
  'Descartáveis',
  'Limpeza',
  'Outros'
];

export default function HistoricoContagemPage() {
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [graficoData, setGraficoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarHistorico = async () => {
    if (!categoria || !descricao) {
      toast.error('Preencha categoria e descrição');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        categoria,
        descricao,
        limit: '50'
      });

      const response = await fetch(`/api/operacoes/contagem-estoque/historico?${params}`);
      const result = await response.json();

      if (result.success) {
        setHistorico(result.data || []);
        setEstatisticas(result.estatisticas);
        setGraficoData(result.grafico || []);
        toast.success(`${result.total} contagens encontradas`);
      } else {
        toast.error(result.error || 'Erro ao buscar histórico');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao buscar histórico');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="card-title-dark flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Histórico Detalhado de Contagem
              </h1>
              <p className="card-description-dark">
                Visualize o histórico completo e variações de estoque de um produto
              </p>
            </div>
            <Link href="/operacoes/contagem-estoque">
              <Button variant="outline" className="btn-outline-dark">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Filtros */}
          <Card className="card-dark mb-6">
            <CardHeader>
              <CardTitle className="card-title-dark text-base">
                Buscar Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="input-dark">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Descrição do Produto</Label>
                  <Input
                    placeholder="Ex: Coca-Cola 2L"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="input-dark"
                    onKeyDown={(e) => e.key === 'Enter' && buscarHistorico()}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={buscarHistorico}
                    disabled={loading}
                    className="btn-primary-dark w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Buscar Histórico
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Contagens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {estatisticas.total_contagens}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {estatisticas.total_alteracoes} alterações
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Estoque Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {estatisticas.estoque_atual.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {estatisticas.variacao_total_estoque > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          +{estatisticas.variacao_total_estoque.toFixed(2)}
                        </span>
                      </>
                    ) : estatisticas.variacao_total_estoque < 0 ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {estatisticas.variacao_total_estoque.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Sem variação
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Valor Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatarValor(estatisticas.valor_atual)}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    estatisticas.alertas_total > 0 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {estatisticas.alertas_total}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {estatisticas.alertas_total > 0 ? 'Requer atenção' : 'Tudo OK'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráfico Simples de Variação */}
          {graficoData.length > 0 && (
            <Card className="card-dark mb-6">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Evolução do Estoque
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Variação do estoque ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {graficoData.map((item, index) => {
                    const maxEstoque = Math.max(...graficoData.map(d => d.estoque_total));
                    const larguraBarra = (item.estoque_total / maxEstoque) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {formatarData(item.data)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 dark:text-gray-400">
                              Total: {item.estoque_total.toFixed(2)}
                            </span>
                            {item.tem_alerta && (
                              <Badge className="badge-warning text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alerta
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <div 
                            className={`h-full ${
                              item.tem_alerta 
                                ? 'bg-orange-500' 
                                : 'bg-blue-500'
                            } transition-all`}
                            style={{ width: `${larguraBarra}%` }}
                          >
                            <div className="flex items-center justify-between h-full px-3">
                              <span className="text-xs text-white font-medium">
                                Fechado: {item.estoque_fechado.toFixed(2)}
                              </span>
                              <span className="text-xs text-white font-medium">
                                Flutuante: {item.estoque_flutuante.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Histórico */}
          {historico.length > 0 && (
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detalhamento por Data
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Todas as contagens registradas para este produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historico.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        item.alerta_variacao || item.alerta_preenchimento
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {formatarData(item.data_contagem)}
                            </h4>
                            {(item.alerta_variacao || item.alerta_preenchimento) && (
                              <Badge className="badge-warning text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alerta
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge className="badge-primary text-xs">
                                Mais Recente
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Registrado em {new Date(item.created_at).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(item.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        
                        {item.variacao_percentual !== null && (
                          <div className="flex items-center gap-2">
                            {item.variacao_percentual > 0 ? (
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                            <span className={`text-sm font-bold ${
                              item.variacao_percentual > 0 
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Fechado:</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {parseFloat(item.estoque_fechado.toString()).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Flutuante:</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {parseFloat(item.estoque_flutuante.toString()).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Total:</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {parseFloat(item.estoque_total.toString()).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Preço:</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatarValor(parseFloat(item.preco.toString()))}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Valor Total:</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatarValor(parseFloat(item.valor_total.toString()))}
                          </p>
                        </div>
                      </div>

                      {item.observacoes && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📝 {item.observacoes}
                          </p>
                        </div>
                      )}

                      {item.alteracoes && item.alteracoes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {item.alteracoes.length} alteraç{item.alteracoes.length !== 1 ? 'ões' : 'ão'} registrada{item.alteracoes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há dados */}
          {!loading && historico.length === 0 && estatisticas && (
            <Card className="card-dark">
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhum histórico encontrado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há contagens registradas para este produto
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

