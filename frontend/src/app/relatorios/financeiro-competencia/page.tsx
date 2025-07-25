'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBar } from '@/contexts/BarContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { getSupabaseClient } from '@/lib/supabase';

interface MovimentacaoFinanceira {
  id: number;
  bar_id: number;
  descricao: string;
  valor: number;
  categoria: string;
  centro_custo?: string;
  data_competencia: string;
  status: string;
  tipo: string;
  cliente_fornecedor?: string;
  documento?: string;
  forma_pagamento?: string;
  observacoes?: string;
  dados_originais?: Record<string, unknown>;
  sincronizado_em: string;
}

interface ResumoFinanceiro {
  total_entradas: number;
  entradas_pagas: number;
  total_saidas_contaazul: number;
  saidas_pagas_contaazul: number;
  resultado_liquido: number;
}

interface DashboardData {
  entradas: MovimentacaoFinanceira[];
  saidas: MovimentacaoFinanceira[];
  resumo: ResumoFinanceiro;
}

interface SyncResponse {
  success: boolean;
  error?: string;
  resumo?: {
    total_entradas: number;
    total_saidas: number;
  };
  periodo?: string;
}

function calcularResumo(
  entradas: MovimentacaoFinanceira[],
  saidas: MovimentacaoFinanceira[]
): ResumoFinanceiro {
  const totalEntradas = entradas.reduce(
    (sum, e) => sum + parseFloat(e.valor.toString()),
    0
  );
  const entradasPagas = entradas
    .filter(e => e.status === 'PAID')
    .reduce((sum, e) => sum + parseFloat(e.valor.toString()), 0);
  const totalSaidas = saidas.reduce(
    (sum, s) => sum + parseFloat(s.valor.toString()),
    0
  );
  const saidasPagas = saidas
    .filter(s => s.status === 'PAID')
    .reduce((sum, s) => sum + parseFloat(s.valor.toString()), 0);
  return {
    total_entradas: totalEntradas,
    entradas_pagas: entradasPagas,
    total_saidas_contaazul: totalSaidas,
    saidas_pagas_contaazul: saidasPagas,
    resultado_liquido: totalEntradas - totalSaidas,
  };
}

export default function FinanceiroCompetenciaPage() {
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    entradas: [],
    saidas: [],
    resumo: {
      total_entradas: 0,
      entradas_pagas: 0,
      total_saidas_contaazul: 0,
      saidas_pagas_contaazul: 0,
      resultado_liquido: 0,
    },
  });

  // Filtros
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return primeiroDiaDoMes.toISOString().split('T')[0];
  });

  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });

  const [tipoVisualizacao, setTipoVisualizacao] = useState<
    'resumo' | 'entradas' | 'saidas'
  >('resumo');

  useEffect(() => {
    setPageTitle('💰 Financeiro por Data de Competência');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      // Carregar entradas (receitas) do ContaAzul
      const { data: entradas } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .eq('tipo', 'receita')
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false });

      // Carregar saídas (despesas) do ContaAzul
      const { data: saidas } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .eq('tipo', 'despesa')
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false });

      setData({
        entradas: entradas || [],
        saidas: saidas || [],
        resumo: calcularResumo(entradas || [], saidas || []),
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, dataInicio, dataFim]);

  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados();
    }
  }, [selectedBar?.id, dataInicio, dataFim, carregarDados]);

  const sincronizarContaAzul = async () => {
    if (!selectedBar?.id) return;

    setSyncing(true);
    try {
      // Pegar dados do usuário do localStorage para autenticação
      const userData = localStorage.getItem('sgb_user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Adicionar header de autenticação se o usuário estiver logado
      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData);
      }

      const response = await fetch('/api/contaazul-sync-competencia', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bar_id: selectedBar.id,
          data_inicio: dataInicio,
          data_fim: dataFim,
        }),
      });

      const result = (await response.json()) as SyncResponse;

      if (result.success) {
        alert(
          `✅ Sincronização concluída!\n\n💰 ${result.resumo?.total_entradas} entradas\n💳 ${result.resumo?.total_saidas} saídas\n\nPeríodo: ${result.periodo}`
        );
        await carregarDados();
      } else {
        alert(`❌ Erro na sincronização: ${result.error}`);
      }
    } catch {
      alert('❌ Erro na sincronização.');
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
        );
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                💰 Financeiro por Competência
              </h1>
              <p className="text-blue-100">
                Análise financeira baseada na data de competência dos
                lançamentos
              </p>
            </div>
            <Button
              onClick={sincronizarContaAzul}
              disabled={syncing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar ContaAzul'}
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Filtros de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={carregarDados} className="w-full">
                🔍 Atualizar Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Total Entradas
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(data.resumo.total_entradas)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Entradas Pagas
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(data.resumo.entradas_pagas)}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Total Saídas
                </p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(data.resumo.total_saidas_contaazul)}
                </p>
              </div>
              <div className="text-3xl">💳</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Resultado Líquido
                </p>
                <p
                  className={`text-2xl font-bold ${data.resumo.resultado_liquido >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  {formatCurrency(data.resumo.resultado_liquido)}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button
              variant={tipoVisualizacao === 'resumo' ? 'default' : 'outline'}
              onClick={() => setTipoVisualizacao('resumo')}
            >
              📊 Resumo
            </Button>
            <Button
              variant={tipoVisualizacao === 'entradas' ? 'default' : 'outline'}
              onClick={() => setTipoVisualizacao('entradas')}
            >
              💰 Entradas ({data.entradas.length})
            </Button>
            <Button
              variant={tipoVisualizacao === 'saidas' ? 'default' : 'outline'}
              onClick={() => setTipoVisualizacao('saidas')}
            >
              💳 Saídas ({data.saidas.length})
            </Button>
          </div>

          {tipoVisualizacao === 'resumo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      💰 Entradas por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.entradas.length === 0 ? (
                      <p className="text-gray-500">
                        Nenhuma entrada encontrada
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(
                          data.entradas.reduce(
                            (
                              acc: Record<string, number>,
                              entrada: MovimentacaoFinanceira
                            ) => {
                              acc[entrada.categoria] =
                                (acc[entrada.categoria] || 0) +
                                parseFloat(entrada.valor.toString());
                              return acc;
                            },
                            {}
                          )
                        ).map(([categoria, valor]) => (
                          <div
                            key={categoria}
                            className="flex justify-between items-center p-2 bg-green-50 rounded"
                          >
                            <span className="font-medium">{categoria}</span>
                            <span className="text-green-700 font-bold">
                              {formatCurrency(valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">
                      💳 Saídas por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.saidas.length === 0 ? (
                      <p className="text-gray-500">Nenhuma saída encontrada</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(
                          data.saidas.reduce(
                            (
                              acc: Record<string, number>,
                              saida: MovimentacaoFinanceira
                            ) => {
                              acc[saida.categoria] =
                                (acc[saida.categoria] || 0) +
                                parseFloat(saida.valor.toString());
                              return acc;
                            },
                            {}
                          )
                        ).map(([categoria, valor]) => (
                          <div
                            key={categoria}
                            className="flex justify-between items-center p-2 bg-red-50 rounded"
                          >
                            <span className="font-medium">{categoria}</span>
                            <span className="text-red-700 font-bold">
                              {formatCurrency(valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {tipoVisualizacao === 'entradas' && (
            <div className="space-y-4">
              {data.entradas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma entrada encontrada
                </p>
              ) : (
                data.entradas.map((entrada: MovimentacaoFinanceira) => (
                  <Card
                    key={entrada.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-700">
                            {entrada.descricao}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {entrada.categoria}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(entrada.data_competencia)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-700">
                            {formatCurrency(
                              parseFloat(entrada.valor.toString())
                            )}
                          </p>
                          {getStatusBadge(entrada.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tipoVisualizacao === 'saidas' && (
            <div className="space-y-4">
              {data.saidas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma saída encontrada
                </p>
              ) : (
                data.saidas.map((saida: MovimentacaoFinanceira) => (
                  <Card
                    key={saida.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-700">
                            {saida.descricao}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {saida.categoria}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(saida.data_competencia)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-700">
                            {formatCurrency(parseFloat(saida.valor.toString()))}
                          </p>
                          {getStatusBadge(saida.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
