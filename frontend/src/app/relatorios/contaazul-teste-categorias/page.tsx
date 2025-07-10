'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface VisaoCompetenciaItem {
  id: number
  parcela_id: string
  evento_id: string
  tipo: 'RECEITA' | 'DESPESA'
  descricao: string
  valor: number
  data_competencia: string
  data_vencimento: string
  categoria_id: string
  categoria_nome: string
  categoria_valor: number
  centro_custo_id: string
  centro_custo_nome: string
  centro_custo_valor: number
  status: string
  coletado_em: string
}

interface ResumoVisaoCompetencia {
  total_receitas: number
  total_despesas: number
  resultado_liquido: number
  total_registros: number
  categorias_distintas: number
  centros_custo_distintos: number
}

export default function TesteVisaoCompetenciaPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const [loading, setLoading] = useState(false)
  const [coletando, setColetando] = useState(false)
  const [dados, setDados] = useState<VisaoCompetenciaItem[]>([])
  const [resumo, setResumo] = useState<ResumoVisaoCompetencia>({
    total_receitas: 0,
    total_despesas: 0,
    resultado_liquido: 0,
    total_registros: 0,
    categorias_distintas: 0,
    centros_custo_distintos: 0
  })
  const [mesAno, setMesAno] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [ultimaColeta, setUltimaColeta] = useState<string>('')

  useEffect(() => {
    setPageTitle('🎯 Teste - Visão de Competência com Categorias')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    // Definir mês atual como padrão
    const agora = new Date()
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0')
    const ano = agora.getFullYear()
    setMesAno(`${ano}-${mes}`)
  }, [])

  useEffect(() => {
    if (selectedBar?.id && mesAno) {
      carregarDados()
    }
  }, [selectedBar?.id, mesAno])

  const carregarDados = async () => {
    if (!selectedBar?.id || !mesAno) return

    const supabase = await getSupabaseClient()
    if (!supabase) return

    setLoading(true)
    try {
      const [ano, mes] = mesAno.split('-')
      const dataInicio = `${ano}-${mes}-01`
      // Calcular último dia do mês corretamente
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate()
      const dataFim = `${ano}-${mes}-${ultimoDia.toString().padStart(2, '0')}`

      // Carregar dados da visão de competência
      const { data: dadosVisao, error } = await supabase
        .from('contaazul_visao_competencia')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: false })

      if (error) {
        console.error('Erro ao carregar dados:', error)
        return
      }

      setDados(dadosVisao || [])

      // Calcular resumo
      const receitas = dadosVisao?.filter((d: any) => d.tipo === 'RECEITA') || []
      const despesas = dadosVisao?.filter((d: any) => d.tipo === 'DESPESA') || []
      
      const totalReceitas = receitas.reduce((sum: number, item: any) => sum + (item.valor || 0), 0)
      const totalDespesas = despesas.reduce((sum: number, item: any) => sum + Math.abs(item.valor || 0), 0)
      
      const categorias = new Set(dadosVisao?.map((d: any) => d.categoria_id).filter(Boolean))
      const centrosCusto = new Set(dadosVisao?.map((d: any) => d.centro_custo_id).filter(Boolean))

      setResumo({
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        resultado_liquido: totalReceitas - totalDespesas,
        total_registros: dadosVisao?.length || 0,
        categorias_distintas: categorias.size,
        centros_custo_distintos: centrosCusto.size
      })

      // Verificar última coleta
      const { data: configData } = await supabase
        .from('contaazul_config')
        .select('ultima_sincronizacao')
        .eq('bar_id', selectedBar.id)
        .single()

      if (configData?.ultima_sincronizacao) {
        setUltimaColeta(new Date(configData.ultima_sincronizacao).toLocaleString('pt-BR'))
      }

    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const executarColetaComDetalhes = async () => {
    if (!selectedBar?.id || !mesAno) return

    setColetando(true)
    try {
      const [ano, mes] = mesAno.split('-')
      const dataInicio = `${ano}-${mes}-01`
      // Calcular último dia do mês corretamente
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate()
      const dataFim = `${ano}-${mes}-${ultimoDia.toString().padStart(2, '0')}`

      const response = await fetch('/api/contaazul/coletar-com-detalhes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          data_inicio: dataInicio,
          data_fim: dataFim
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`)
      }

      const resultado = await response.json()
      
      console.log('🎯 Resultado da coleta:', resultado)
      
      // Recarregar dados após a coleta
      setTimeout(carregarDados, 2000)

    } catch (error) {
      console.error('Erro na coleta:', error)
      alert(`Erro na coleta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setColetando(false)
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

  const dadosFiltrados = dados.filter(item => 
    filtroTipo === 'TODOS' || item.tipo === filtroTipo
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Teste - Visão de Competência com Categorias
          </h1>
          <div className="text-sm text-gray-600">
            Bar: {selectedBar?.nome || 'Nenhum selecionado'}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">📊 O que esta página faz:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Busca dados:</strong> Consulta a tabela `contaazul_visao_competencia`</li>
            <li>• <strong>Mostra categorias:</strong> Cada transação com sua categoria e centro de custo</li>
            <li>• <strong>Coleta dados:</strong> Usa a API `/api/contaazul/coletar-com-detalhes`</li>
            <li>• <strong>Estratégia 2 etapas:</strong> Busca lista básica + detalhes individuais</li>
          </ul>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mês/Ano (Competência):
          </label>
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtro por Tipo:
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="TODOS">Todos</option>
            <option value="RECEITA">Receitas</option>
            <option value="DESPESA">Despesas</option>
          </select>
        </div>
        
        <div className="flex flex-col justify-end">
          <Button
            onClick={carregarDados}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? '🔄 Carregando...' : '🔄 Recarregar'}
          </Button>
        </div>
        
        <div className="flex flex-col justify-end">
          <Button
            onClick={executarColetaComDetalhes}
            disabled={coletando || !selectedBar?.id}
            className="bg-green-500 hover:bg-green-600"
          >
            {coletando ? '🚀 Coletando...' : '🚀 Coletar Dados'}
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">💰 Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumo.total_receitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800">💸 Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(resumo.total_despesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">📊 Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.resultado_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(resumo.resultado_liquido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-800">📋 Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {resumo.total_registros}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-800">🏷️ Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {resumo.categorias_distintas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-800">🎯 Centros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {resumo.centros_custo_distintos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Última coleta:</span>
            <span className="ml-2 text-sm text-gray-600">
              {ultimaColeta || 'Nunca executada'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Registros encontrados:</span>
            <span className="ml-2 text-sm text-gray-600">{dadosFiltrados.length}</span>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>
            📊 Visão de Competência - {mesAno} ({dadosFiltrados.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro de Custo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Competência</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dadosFiltrados.slice(0, 100).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.tipo === 'RECEITA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.tipo === 'RECEITA' ? '💰' : '💸'} {item.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {item.descricao}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={item.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Math.abs(item.valor))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="max-w-xs truncate">
                        {item.categoria_nome || '-'}
                      </div>
                      {item.categoria_valor && (
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.categoria_valor)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="max-w-xs truncate">
                        {item.centro_custo_nome || '-'}
                      </div>
                      {item.centro_custo_valor && (
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.centro_custo_valor)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(item.data_competencia)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.status || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {dadosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">📭 Nenhum dado encontrado</div>
              <div className="text-sm">
                Clique em "🚀 Coletar Dados" para buscar informações do ContaAzul
              </div>
            </div>
          )}
          
          {dadosFiltrados.length > 100 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="text-sm text-yellow-800">
                ⚠️ Mostrando apenas os primeiros 100 registros de {dadosFiltrados.length} encontrados.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 