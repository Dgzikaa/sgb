'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { getSupabaseClient } from '@/lib/supabase'

interface MovimentacaoFinanceira {
  id: number
  bar_id: number
  descricao: string
  valor: number
  categoria: string
  centro_custo?: string
  data_competencia: string
  status: string
  tipo: string
  cliente_fornecedor?: string
  documento?: string
  forma_pagamento?: string
  observacoes?: string
  dados_originais?: any
  sincronizado_em: string
}

interface ResumoFinanceiro {
  total_entradas: number
  entradas_pagas: number
  total_saidas_contaazul: number
  saidas_pagas_contaazul: number
  resultado_liquido: number
}

interface DashboardData {
  entradas: MovimentacaoFinanceira[]
  saidas: MovimentacaoFinanceira[]
  resumo: ResumoFinanceiro
}

export default function FinanceiroCompetenciaPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [data, setData] = useState<DashboardData>({
    entradas: [],
    saidas: [],
    resumo: {
      total_entradas: 0,
      entradas_pagas: 0,
      total_saidas_contaazul: 0,
      saidas_pagas_contaazul: 0,
      resultado_liquido: 0
    }
  })

  // Filtros
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date()
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return primeiroDiaDoMes.toISOString().split('T')[0]
  })
  
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date()
    return hoje.toISOString().split('T')[0]
  })

  const [tipoVisualizacao, setTipoVisualizacao] = useState<'resumo' | 'entradas' | 'saidas'>('resumo')

  useEffect(() => {
    setPageTitle('💰 Financeiro por Data de Competência')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados()
    }
  }, [selectedBar?.id, dataInicio, dataFim])

  const carregarDados = async () => {
    if (!selectedBar?.id) return

    setLoading(true)
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) return

      // Carregar entradas (receitas) do ContaAzul
      const { data: entradas } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .eq('tipo', 'receita')
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false })

      // Carregar saídas (despesas) do ContaAzul  
      const { data: saidas } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .eq('tipo', 'despesa')
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false })

      // Calcular resumo
      const totalEntradas = entradas?.reduce((sum: number, e: MovimentacaoFinanceira) => sum + parseFloat(e.valor.toString()), 0) || 0
      const entradasPagas = entradas?.filter((e: MovimentacaoFinanceira) => e.status === 'PAID').reduce((sum: number, e: MovimentacaoFinanceira) => sum + parseFloat(e.valor.toString()), 0) || 0
      const totalSaidas = saidas?.reduce((sum: number, s: MovimentacaoFinanceira) => sum + parseFloat(s.valor.toString()), 0) || 0
      const saidasPagas = saidas?.filter((s: MovimentacaoFinanceira) => s.status === 'PAID').reduce((sum: number, s: MovimentacaoFinanceira) => sum + parseFloat(s.valor.toString()), 0) || 0

      setData({
        entradas: entradas || [],
        saidas: saidas || [],
        resumo: {
          total_entradas: totalEntradas,
          entradas_pagas: entradasPagas,
          total_saidas_contaazul: totalSaidas,
          saidas_pagas_contaazul: saidasPagas,
          resultado_liquido: totalEntradas - totalSaidas
        }
      })

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarContaAzul = async () => {
    if (!selectedBar?.id) return

    setSyncing(true)
    try {
      // Pegar dados do usuário do localStorage para autenticação
      const userData = localStorage.getItem('sgb_user')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Adicionar header de autenticação se o usuário estiver logado
      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData)
      }

      const response = await fetch('/api/contaazul-sync-competencia', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bar_id: selectedBar.id,
          data_inicio: dataInicio,
          data_fim: dataFim
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Sincronização concluída!\n\n💰 ${result.resumo.total_entradas} entradas\n💳 ${result.resumo.total_saidas} saídas\n\nPeríodo: ${result.periodo}`)
        await carregarDados()
      } else {
        alert(`❌ Erro na sincronização: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Erro na sincronização.')
    } finally {
      setSyncing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">💰 Financeiro por Competência</h1>
              <p className="text-blue-100 text-lg">
                Controle de entradas e saídas do ContaAzul por data de competência
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={sincronizarContaAzul}
                disabled={syncing}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Início:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Fim:</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visualização:</label>
              <select
                value={tipoVisualizacao}
                onChange={(e) => setTipoVisualizacao(e.target.value as any)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="resumo">📊 Resumo Geral</option>
                <option value="entradas">💰 Entradas (ContaAzul)</option>
                <option value="saidas">💳 Saídas (ContaAzul)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      {tipoVisualizacao === 'resumo' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">💰 Entradas Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.resumo.total_entradas)}</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">Pagas: {formatCurrency(data.resumo.entradas_pagas)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">💳 Saídas ContaAzul</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.resumo.total_saidas_contaazul)}</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">Pagas: {formatCurrency(data.resumo.saidas_pagas_contaazul)}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">💎 Resultado Líquido</p>
                  <p className={`text-2xl font-bold ${data.resumo.resultado_liquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.resumo.resultado_liquido)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {data.resumo.resultado_liquido >= 0 ? 'Lucro' : 'Prejuízo'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${data.resumo.resultado_liquido >= 0 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-orange-100 dark:bg-orange-900/20'}`}>
                  <DollarSign className={`h-6 w-6 ${data.resumo.resultado_liquido >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Entradas */}
      {tipoVisualizacao === 'entradas' && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-gray-900 dark:text-white">💰 Entradas (ContaAzul)</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {data.entradas.length} entradas encontradas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {data.entradas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(entrada.data_competencia)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {entrada.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {entrada.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(entrada.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(entrada.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Saídas */}
      {tipoVisualizacao === 'saidas' && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-gray-900 dark:text-white">💳 Saídas (ContaAzul)</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {data.saidas.length} saídas encontradas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {data.saidas.map((saida) => (
                    <tr key={saida.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(saida.data_competencia)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {saida.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {saida.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(saida.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(saida.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 