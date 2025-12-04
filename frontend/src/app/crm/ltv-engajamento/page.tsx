'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Download,
  Activity,
  Target,
  Star,
  RefreshCcw,
  Zap
} from 'lucide-react';

interface ClienteLTV {
  telefone: string;
  nome: string;
  ltv_atual: number;
  ltv_projetado_12m: number;
  ltv_projetado_24m: number;
  score_engajamento: number;
  nivel_engajamento: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  total_visitas: number;
  frequencia_visitas: number;
  ticket_medio: number;
  valor_medio_mensal: number;
  tendencia_valor: 'crescente' | 'estavel' | 'decrescente';
  tendencia_frequencia: 'crescente' | 'estavel' | 'decrescente';
  potencial_crescimento: 'baixo' | 'medio' | 'alto';
  roi_marketing: number;
}

interface Stats {
  total_clientes: number;
  ltv_total_atual: number;
  ltv_total_projetado_12m: number;
  ltv_medio_atual: number;
  ltv_medio_projetado_12m: number;
  engajamento_muito_alto: number;
  engajamento_alto: number;
  engajamento_medio: number;
  engajamento_baixo: number;
}

export default function LTVEngajamentoPage() {
  const [clientes, setClientes] = useState<ClienteLTV[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  const fetchLTV = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/ltv-engajamento?limite=5000');
      const result = await response.json();

      if (result.success) {
        setClientes(result.data || []);
        setStats(result.stats);
        setFromCache(result.fromCache || false);
      } else {
        console.error('Erro na API:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar LTV:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLTV();
  }, []);

  // Reset página quando busca muda
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  );

  // Paginação
  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);
  const clientesPaginados = clientesFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const getEngajamentoBadge = (nivel: string, score: number) => {
    switch (nivel) {
      case 'muito_alto':
        return <Badge className="bg-green-600">⭐ {score} - Muito Alto</Badge>;
      case 'alto':
        return <Badge className="bg-blue-600">🔥 {score} - Alto</Badge>;
      case 'medio':
        return <Badge className="bg-yellow-600">⚡ {score} - Médio</Badge>;
      case 'baixo':
        return <Badge className="bg-gray-600">💤 {score} - Baixo</Badge>;
      default:
        return <Badge>-</Badge>;
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decrescente':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatarMoeda = (valor: number) => {
    if (valor >= 1000000) {
      return `R$ ${(valor / 1000000).toFixed(1)}M`;
    }
    if (valor >= 1000) {
      return `R$ ${(valor / 1000).toFixed(1)}k`;
    }
    return `R$ ${valor.toLocaleString('pt-BR')}`;
  };

  const exportarCSV = () => {
    const headers = ['Nome', 'Telefone', 'LTV Atual', 'LTV 12m', 'LTV 24m', 'Score', 'Nível', 'Visitas', 'Ticket Médio', 'ROI Marketing'];
    const rows = clientesFiltrados.map(c => [
      c.nome,
      c.telefone,
      c.ltv_atual,
      c.ltv_projetado_12m,
      c.ltv_projetado_24m,
      c.score_engajamento,
      c.nivel_engajamento,
      c.total_visitas,
      c.ticket_medio,
      c.roi_marketing
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ltv-engajamento-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              💰 LTV e Score de Engajamento
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Lifetime Value e métricas de engajamento dos clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {fromCache && (
              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                <Zap className="w-3 h-3 mr-1" />
                Cache
              </Badge>
            )}
            <Button 
              onClick={fetchLTV} 
              variant="outline" 
              disabled={loading}
              className="border-gray-300 dark:border-gray-600"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={exportarCSV} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">LTV Atual Total</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatarMoeda(stats.ltv_total_atual)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">LTV Projetado 12m</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatarMoeda(stats.ltv_total_projetado_12m)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">LTV Médio Atual</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatarMoeda(stats.ltv_medio_atual)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Engajamento Alto+</div>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.engajamento_muito_alto + stats.engajamento_alto}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Total Clientes</div>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {stats.total_clientes.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Busca */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Top Clientes por LTV ({clientesFiltrados.length.toLocaleString('pt-BR')})
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Ordenados por LTV projetado em 12 meses
              {totalPaginas > 1 && ` • Página ${paginaAtual} de ${totalPaginas}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : clientesPaginados.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {busca ? 'Nenhum cliente encontrado com essa busca' : 'Nenhum dado de cliente disponível'}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {clientesPaginados.map((cliente, index) => {
                    const posicaoGeral = (paginaAtual - 1) * itensPorPagina + index;
                    return (
                      <Card key={cliente.telefone} className="border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {posicaoGeral < 3 && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                                <span className="text-sm text-gray-500 dark:text-gray-400">#{posicaoGeral + 1}</span>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {cliente.nome}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.telefone}</p>
                            </div>
                            {getEngajamentoBadge(cliente.nivel_engajamento, cliente.score_engajamento)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">LTV Atual</div>
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatarMoeda(cliente.ltv_atual)}
                              </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <div className="text-xs text-green-600 dark:text-green-400 mb-1">Projeção 12m</div>
                              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                                {formatarMoeda(cliente.ltv_projetado_12m)}
                              </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Ticket Médio</div>
                              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                {formatarMoeda(cliente.ticket_medio)}
                              </div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">ROI Marketing</div>
                              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                {cliente.roi_marketing}x
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {cliente.total_visitas} visitas
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {getTendenciaIcon(cliente.tendencia_valor)}
                              <span className="text-gray-700 dark:text-gray-300">
                                Valor {cliente.tendencia_valor}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                Potencial: {cliente.potencial_crescimento}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(1)}
                      disabled={paginaAtual === 1}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Primeira
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Anterior
                    </Button>
                    
                    <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Próxima
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(totalPaginas)}
                      disabled={paginaAtual === totalPaginas}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Última
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
