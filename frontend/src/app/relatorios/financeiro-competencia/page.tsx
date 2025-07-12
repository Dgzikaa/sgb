'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Button } from '@/components/ui/button'

interface DashboardData {
  entradas: MovimentacaoFinanceira[]
  saidas: MovimentacaoFinanceira[]
  custosExtras: CustoExtra[]
  resumo: ResumoFinanceiro
}

interface MovimentacaoFinanceira {
  id: string
  contaazul_id: string
  data_competencia: string
  data_vencimento?: string
  data_pagamento?: string
  valor: number
  descricao: string
  categoria_nome: string
  cliente_nome?: string
  fornecedor_nome?: string
  status: string
  status_portugues: string
}

interface CustoExtra {
  id: number
  data_competencia: string
  valor: number
  descricao: string
  responsavel: string
  pago: boolean
  data_pagamento?: string
  tipo_custo: {
    id: number
    nome: string
    cor: string
    icone: string
  }
}

interface ResumoFinanceiro {
  total_entradas: number
  entradas_pagas: number
  total_saidas_contaazul: number
  saidas_pagas_contaazul: number
  total_custos_extras: number
  custos_extras_pagos: number
  resultado_liquido: number
}

interface TipoCusto {
  id: number
  nome: string
  cor: string
  icone: string
  descricao: string
}

export default function FinanceiroCompetenciaPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [data, setData] = useState<DashboardData>({
    entradas: [],
    saidas: [],
    custosExtras: [],
    resumo: {
      total_entradas: 0,
      entradas_pagas: 0,
      total_saidas_contaazul: 0,
      saidas_pagas_contaazul: 0,
      total_custos_extras: 0,
      custos_extras_pagos: 0,
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

  const [tipoVisualizacao, setTipoVisualizacao] = useState<'resumo' | 'entradas' | 'saidas' | 'custos'>('resumo')
  const [tiposCustos, setTiposCustos] = useState<TipoCusto[]>([])

  // Estados para novo custo extra
  const [showNovoCusto, setShowNovoCusto] = useState(false)
  const [novoCusto, setNovoCusto] = useState({
    tipo_custo_id: '',
    data_competencia: new Date().toISOString().split('T')[0],
    valor: '',
    descricao: '',
    responsavel: '',
    documento: '',
    pago: false
  })

  useEffect(() => {
    setPageTitle('💰 Financeiro por Data de Competência')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados()
      carregarTiposCustos()
    }
  }, [selectedBar?.id, dataInicio, dataFim])

  const carregarDados = async () => {
    if (!selectedBar?.id) return

    setLoading(true)
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) return

      // Carregar entradas
      const { data: entradas } = await supabase
        .from('contaazul_entradas_competencia')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false })

      // Carregar saídas
      const { data: saidas } = await supabase
        .from('contaazul_saidas_competencia')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false })

      // Carregar custos extras
      const { data: custosExtras } = await supabase
        .from('custos_extras_competencia')
        .select(`
          *,
          tipo_custo:tipos_custos_extras(id, nome, cor, icone)
        `)
        .eq('bar_id', selectedBar.id)
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false })

      // Calcular resumo
      const totalEntradas = entradas?.reduce((sum: number, e: MovimentacaoFinanceira) => sum + parseFloat(e.valor.toString()), 0) || 0
      const entradasPagas = entradas?.filter((e: MovimentacaoFinanceira) => e.status === 'PAID').reduce((sum: number, e: MovimentacaoFinanceira) => sum + parseFloat(e.valor.toString()), 0) || 0
      const totalSaidas = saidas?.reduce((sum: number, s: MovimentacaoFinanceira) => sum + parseFloat(s.valor.toString()), 0) || 0
      const saidasPagas = saidas?.filter((s: MovimentacaoFinanceira) => s.status === 'PAID').reduce((sum: number, s: MovimentacaoFinanceira) => sum + parseFloat(s.valor.toString()), 0) || 0
      const totalCustosExtras = custosExtras?.reduce((sum: number, c: CustoExtra) => sum + parseFloat(c.valor.toString()), 0) || 0
      const custosExtrasPagos = custosExtras?.filter((c: CustoExtra) => c.pago).reduce((sum: number, c: CustoExtra) => sum + parseFloat(c.valor.toString()), 0) || 0

      setData({
        entradas: entradas || [],
        saidas: saidas || [],
        custosExtras: custosExtras || [],
        resumo: {
          total_entradas: totalEntradas,
          entradas_pagas: entradasPagas,
          total_saidas_contaazul: totalSaidas,
          saidas_pagas_contaazul: saidasPagas,
          total_custos_extras: totalCustosExtras,
          custos_extras_pagos: custosExtrasPagos,
          resultado_liquido: totalEntradas - totalSaidas - totalCustosExtras
        }
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarTiposCustos = async () => {
    if (!selectedBar?.id) return

    try {
      const response = await fetch(`/api/custos-extras?bar_id=${selectedBar.id}&action=tipos`)
      const result = await response.json()

      if (result.success) {
        setTiposCustos(result.tipos)
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de custos:', error)
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
      console.error('Erro na sincronização:', error)
      alert('❌ Erro na sincronização. Verifique o console.')
    } finally {
      setSyncing(false)
    }
  }

  const adicionarCustoExtra = async () => {
    if (!selectedBar?.id || !novoCusto.tipo_custo_id || !novoCusto.valor) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const response = await fetch('/api/custos-extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ...novoCusto,
          valor: parseFloat(novoCusto.valor)
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('✅ Custo extra adicionado com sucesso!')
        setShowNovoCusto(false)
        setNovoCusto({
          tipo_custo_id: '',
          data_competencia: new Date().toISOString().split('T')[0],
          valor: '',
          descricao: '',
          responsavel: '',
          documento: '',
          pago: false
        })
        await carregarDados()
      } else {
        alert(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar custo:', error)
      alert('❌ Erro ao adicionar custo extra')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-lg">🔄 Carregando dados financeiros...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Informações */}
      <div className="mb-8">
        <p className="text-gray-600">
          Controle completo de entradas, saídas e custos extras
        </p>
      </div>

      {/* Controles */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início:</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim:</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visualização:</label>
            <select
              value={tipoVisualizacao}
              onChange={(e) => setTipoVisualizacao(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="resumo">📊 Resumo Geral</option>
              <option value="entradas">💰 Entradas (ContaAzul)</option>
              <option value="saidas">💳 Saídas (ContaAzul)</option>
              <option value="custos">🎭 Custos Extras</option>
            </select>
          </div>

          <button
            onClick={sincronizarContaAzul}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sincronizando...
              </>
            ) : (
              <>
                🔄 Sincronizar ContaAzul
              </>
            )}
          </button>

          <button
            onClick={() => setShowNovoCusto(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            ➕ Novo Custo Extra
          </button>
        </div>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">💰 Entradas Total</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.resumo.total_entradas)}</p>
          <p className="text-sm text-green-700 mt-1">Pagas: {formatCurrency(data.resumo.entradas_pagas)}</p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">💳 Saídas ContaAzul</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(data.resumo.total_saidas_contaazul)}</p>
          <p className="text-sm text-red-700 mt-1">Pagas: {formatCurrency(data.resumo.saidas_pagas_contaazul)}</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">🎭 Custos Extras</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.resumo.total_custos_extras)}</p>
          <p className="text-sm text-purple-700 mt-1">Pagos: {formatCurrency(data.resumo.custos_extras_pagos)}</p>
        </div>

        <div className={`p-6 rounded-lg border ${
          data.resumo.resultado_liquido >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            data.resumo.resultado_liquido >= 0 
              ? 'text-blue-800' 
              : 'text-orange-800'
          }`}>
            📈 Resultado Líquido
          </h3>
          <p className={`text-2xl font-bold ${
            data.resumo.resultado_liquido >= 0 
              ? 'text-blue-600' 
              : 'text-orange-600'
          }`}>
            {formatCurrency(data.resumo.resultado_liquido)}
          </p>
          <p className={`text-sm mt-1 ${
            data.resumo.resultado_liquido >= 0 
              ? 'text-blue-700' 
              : 'text-orange-700'
          }`}>
            {data.resumo.resultado_liquido >= 0 ? 'Lucro' : 'Prejuízo'}
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {tipoVisualizacao === 'resumo' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-4">📊 Resumo do Período</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Entradas ContaAzul</h4>
              <p className="text-sm text-gray-600">{data.entradas.length} movimentações</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.resumo.total_entradas)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Saídas ContaAzul</h4>
              <p className="text-sm text-gray-600">{data.saidas.length} movimentações</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(data.resumo.total_saidas_contaazul)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Custos Extras</h4>
              <p className="text-sm text-gray-600">{data.custosExtras.length} registros</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(data.resumo.total_custos_extras)}</p>
            </div>
          </div>
        </div>
      )}

      {tipoVisualizacao === 'entradas' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">💰 Entradas (ContaAzul) - {data.entradas.length} registros</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.entradas.map((entrada) => (
                  <tr key={entrada.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(entrada.data_competencia)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{entrada.descricao}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entrada.cliente_nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entrada.categoria_nome}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(entrada.valor)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entrada.status)}`}>
                        {entrada.status_portugues}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tipoVisualizacao === 'saidas' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">💳 Saídas (ContaAzul) - {data.saidas.length} registros</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.saidas.map((saida) => (
                  <tr key={saida.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(saida.data_competencia)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{saida.descricao}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{saida.fornecedor_nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{saida.categoria_nome}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">{formatCurrency(saida.valor)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(saida.status)}`}>
                        {saida.status_portugues}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tipoVisualizacao === 'custos' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">🎭 Custos Extras - {data.custosExtras.length} registros</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.custosExtras.map((custo) => (
                  <tr key={custo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(custo.data_competencia)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{custo.tipo_custo.icone}</span>
                        <span 
                          className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: custo.tipo_custo.cor }}
                        >
                          {custo.tipo_custo.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{custo.descricao}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{custo.responsavel || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-purple-600">{formatCurrency(custo.valor)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        custo.pago ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {custo.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Novo Custo Extra */}
      {showNovoCusto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">➕ Novo Custo Extra</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Custo *</label>
                <select
                  value={novoCusto.tipo_custo_id}
                  onChange={(e) => setNovoCusto({...novoCusto, tipo_custo_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Selecione...</option>
                  {tiposCustos.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.icone} {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Competência *</label>
                <input
                  type="date"
                  value={novoCusto.data_competencia}
                  onChange={(e) => setNovoCusto({...novoCusto, data_competencia: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoCusto.valor}
                  onChange={(e) => setNovoCusto({...novoCusto, valor: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={novoCusto.descricao}
                  onChange={(e) => setNovoCusto({...novoCusto, descricao: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Descrição do custo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <input
                  type="text"
                  value={novoCusto.responsavel}
                  onChange={(e) => setNovoCusto({...novoCusto, responsavel: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Nome do responsável..."
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={novoCusto.pago}
                    onChange={(e) => setNovoCusto({...novoCusto, pago: e.target.checked})}
                    className="mr-2"
                  />
                  Já foi pago
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNovoCusto(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarCustoExtra}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 