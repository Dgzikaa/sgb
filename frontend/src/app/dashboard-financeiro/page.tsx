'use client';

import { useState, useEffect } from 'react';

// Forçar renderização dinâmica para evitar problemas de build
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBarContext } from '@/contexts/BarContext';
import { Loader2, TrendingUp, TrendingDown, Database, Calendar } from 'lucide-react';

interface DadosFinanceiros {
  receitas: any[];
  despesas: any[];
  categorias: any[];
  contas: any[];
  estatisticas: {
    total_receitas: number;
    total_despesas: number;
    valor_total_receitas: number;
    valor_total_despesas: number;
    saldo: number;
  };
}

export default function DashboardFinanceiro() {
  const { selectedBar } = useBarContext();
  const [dados, setDados] = useState<DadosFinanceiros | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const carregarDados = async () => {
    if (!selectedBar || !isMounted) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/contaazul/dashboard-dados?barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDados(data);
      } else {
        console.error('Erro ao carregar dados:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      carregarDados();
    }
  }, [selectedBar, isMounted]);

  // Loading durante hidratação
  if (!isMounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!selectedBar) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Financeiro</h1>
          <p className="text-gray-600">Selecione um bar para visualizar os dados financeiros</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-1">Dados sincronizados do ContaAzul - {selectedBar.nome}</p>
        </div>
        <Button onClick={carregarDados} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Database className="w-4 h-4 mr-2" />
          )}
          Atualizar Dados
        </Button>
      </div>

      {loading && !dados && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados financeiros...</p>
        </div>
      )}

      {dados && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {dados.estatisticas.valor_total_receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dados.estatisticas.total_receitas} registros
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {dados.estatisticas.valor_total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dados.estatisticas.total_despesas} registros
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${dados.estatisticas.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {dados.estatisticas.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receitas - Despesas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                <Database className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {dados.categorias.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dados.contas.length} contas financeiras
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Últimas Receitas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Últimas Receitas
              </CardTitle>
              <CardDescription>
                Últimos 10 registros de receitas sincronizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dados.receitas.slice(0, 10).map((receita, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{receita.descricao}</p>
                      <p className="text-sm text-gray-500">
                        Vencimento: {new Date(receita.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                      {receita.categoria_nome && (
                        <Badge variant="secondary" className="mt-1">
                          {receita.categoria_nome}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        R$ {parseFloat(receita.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={receita.status === 'PAID' ? 'default' : 'outline'}>
                        {receita.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Despesas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Últimas Despesas
              </CardTitle>
              <CardDescription>
                Últimos 10 registros de despesas sincronizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dados.despesas.slice(0, 10).map((despesa, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{despesa.descricao}</p>
                      <p className="text-sm text-gray-500">
                        Vencimento: {new Date(despesa.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                      {despesa.categoria_nome && (
                        <Badge variant="secondary" className="mt-1">
                          {despesa.categoria_nome}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        R$ {parseFloat(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={despesa.status === 'PAID' ? 'default' : 'outline'}>
                        {despesa.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categorias e Contas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>
                  Categorias sincronizadas do ContaAzul
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dados.categorias.slice(0, 10).map((categoria, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{categoria.nome}</span>
                      <Badge variant={categoria.ativa ? 'default' : 'secondary'}>
                        {categoria.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  ))}
                  {dados.categorias.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      +{dados.categorias.length - 10} categorias...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contas Financeiras</CardTitle>
                <CardDescription>
                  Contas bancárias sincronizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dados.contas.map((conta, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{conta.nome}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          R$ {parseFloat(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge variant={conta.ativa ? 'default' : 'secondary'}>
                          {conta.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!loading && !dados && (
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
          <p className="text-gray-600 mb-4">
            Execute a sincronização do ContaAzul para visualizar os dados aqui.
          </p>
          <Button onClick={() => window.location.href = '/configuracoes'}>
            Ir para Configurações
          </Button>
        </div>
      )}
    </div>
  );
} 