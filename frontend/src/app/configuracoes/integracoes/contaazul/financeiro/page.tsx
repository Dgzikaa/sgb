'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FinancialSummary {
  receber_total: number
  receber_pago: number
  receber_aberto: number
  pagar_total: number
  pagar_pago: number
  pagar_aberto: number
}

interface ContaReceber {
  id: string
  status: string
  total: number
  descricao: string
  data_vencimento: string
  nao_pago: number
  pago: number
  cliente_nome: string
  data_criacao: string
}

interface ContaPagar {
  id: string
  status: string
  total: number
  descricao: string
  data_vencimento: string
  nao_pago: number
  pago: number
  fornecedor_nome: string
  data_criacao: string
}

interface Categoria {
  id: string
  nome: string
  descricao: string
  ativo: boolean
}

export default function ContaAzulFinanceiroPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary>({
    receber_total: 0,
    receber_pago: 0,
    receber_aberto: 0,
    pagar_total: 0,
    pagar_pago: 0,
    pagar_aberto: 0
  })
  
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [tipoVisualizacao, setTipoVisualizacao] = useState('RECEBER') // RECEBER, PAGAR, CATEGORIAS
  const [ultimaSync, setUltimaSync] = useState<string>('')

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setPageTitle('💰 ContaAzul - Dashboard Financeiro')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados()
    }
  }, [selectedBar?.id])

  const carregarDados = async () => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return;
    }

    try {
      setLoading(true)

      // 1. Carregar resumo financeiro
      const { data: reciverData } = await supabase
        .from('contaazul_contas_receber')
        .select('total, pago, nao_pago')
        .eq('bar_id', selectedBar!.id)

      const { data: pagarData } = await supabase
        .from('contaazul_contas_pagar')
        .select('total, pago, nao_pago')
        .eq('bar_id', selectedBar!.id)

      if (reciverData && pagarData) {
        const reciverTotal = reciverData.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
        const reciverPago = reciverData.reduce((sum: number, item: any) => sum + (item.pago || 0), 0)
        const reciverAberto = reciverData.reduce((sum: number, item: any) => sum + (item.nao_pago || 0), 0)

        const pagarTotal = pagarData.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
        const pagarPago = pagarData.reduce((sum: number, item: any) => sum + (item.pago || 0), 0)
        const pagarAberto = pagarData.reduce((sum: number, item: any) => sum + (item.nao_pago || 0), 0)

        setSummary({
          receber_total: reciverTotal,
          receber_pago: reciverPago,
          receber_aberto: reciverAberto,
          pagar_total: pagarTotal,
          pagar_pago: pagarPago,
          pagar_aberto: pagarAberto
        })
      }

      // 2. Carregar contas a receber (últimas 100)
      const { data: receberList } = await supabase
        .from('contaazul_contas_receber')
        .select('*')
        .eq('bar_id', selectedBar!.id)
        .order('data_vencimento', { ascending: false })
        .limit(100)

      if (receberList) {
        setContasReceber(receberList)
      }

      // 3. Carregar contas a pagar (últimas 100)
      const { data: pagarList } = await supabase
        .from('contaazul_contas_pagar')
        .select('*')
        .eq('bar_id', selectedBar!.id)
        .order('data_vencimento', { ascending: false })
        .limit(100)

      if (pagarList) {
        setContasPagar(pagarList)
      }

      // 4. Carregar categorias
      const { data: categoriasList } = await supabase
        .from('contaazul_categorias')
        .select('*')
        .eq('bar_id', selectedBar!.id)
        .order('nome')

      if (categoriasList) {
        setCategorias(categoriasList)
      }

      // 5. Verificar última sincronização
      const { data: configData } = await supabase
        .from('api_credentials')
        .select('ultima_sync')
        .eq('bar_id', selectedBar!.id)
        .eq('sistema', 'contaazul')
        .eq('ativo', true)
        .single()

      if (configData?.ultima_sync) {
        setUltimaSync(new Date(configData.ultima_sync).toLocaleString('pt-BR'))
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
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
      case 'ACQUITTED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACQUITTED':
        return 'Pago'
      case 'PENDING':
        return 'Pendente'
      case 'OVERDUE':
        return 'Vencido'
      default:
        return status
    }
  }

  const contasReceberFiltradas = contasReceber.filter(conta => 
    filtroStatus === 'TODOS' || conta.status === filtroStatus
  )

  const contasPagarFiltradas = contasPagar.filter(conta => 
    filtroStatus === 'TODOS' || conta.status === filtroStatus
  )

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
      <div className="mb-8">
        <p className="text-gray-600">
          Última sincronização: {ultimaSync || 'Nunca sincronizado'}
        </p>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">📥 Receber - Total</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.receber_total)}</p>
          <p className="text-sm text-green-700 mt-1">{contasReceber.length} registros</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">✅ Receber - Pago</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.receber_pago)}</p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">📤 Pagar - Total</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.pagar_total)}</p>
          <p className="text-sm text-red-700 mt-1">{contasPagar.length} registros</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">✅ Pagar - Pago</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.pagar_pago)}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visualização:</label>
          <select
            value={tipoVisualizacao}
            onChange={(e) => setTipoVisualizacao(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="RECEBER">📥 Contas a Receber</option>
            <option value="PAGAR">📤 Contas a Pagar</option>
            <option value="CATEGORIAS">🏷️ Categorias</option>
          </select>
        </div>

        {tipoVisualizacao !== 'CATEGORIAS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="TODOS">Todos</option>
              <option value="ACQUITTED">Pago</option>
              <option value="PENDING">Pendente</option>
              <option value="OVERDUE">Vencido</option>
            </select>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      {tipoVisualizacao === 'RECEBER' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">📥 Contas a Receber ({contasReceberFiltradas.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contasReceberFiltradas.slice(0, 50).map((conta) => (
                    <tr key={conta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(conta.status)}`}>
                          {getStatusText(conta.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {conta.descricao}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {conta.cliente_nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(conta.data_vencimento)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(conta.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {formatCurrency(conta.pago)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tipoVisualizacao === 'PAGAR' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">📤 Contas a Pagar ({contasPagarFiltradas.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contasPagarFiltradas.slice(0, 50).map((conta) => (
                    <tr key={conta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(conta.status)}`}>
                          {getStatusText(conta.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {conta.descricao}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {conta.fornecedor_nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(conta.data_vencimento)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(conta.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {formatCurrency(conta.pago)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tipoVisualizacao === 'CATEGORIAS' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">🏷️ Categorias ({categorias.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((categoria) => (
              <div key={categoria.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{categoria.nome}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${categoria.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {categoria.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {categoria.descricao && (
                  <p className="text-sm text-gray-600">{categoria.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={carregarDados}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          🔄 Recarregar Dados
        </button>
        
        <a
          href="/testar-contaazul"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
        >
          🚀 Nova Sincronização
        </a>
      </div>
    </div>
  )
} 