import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client'

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
  const [statsInsercao, setStatsInsercao] = useState({
    total_registros_banco: 0,
    ultima_insercao: '',
    registros_hoje: 0
  })

  useEffect(() => {
    setPageTitle('Teste - Visão de Competência com Categorias')
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

  const verificarStatsInsercao = async () => {
    if (!selectedBar?.id) return

    const supabase = await getSupabaseClient()
    if (!supabase) return

    try {
      // Total de registros no banco para este bar
      const { count: totalRegistros } = await supabase
        .from('contaazul_visao_competencia')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', selectedBar.id)

      // Registros inseridos hoje
      const hoje = new Date().toISOString().split('T')[0]
      const { count: registrosHoje } = await supabase
        .from('contaazul_visao_competencia')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', selectedBar.id)
        .gte('coletado_em', `${hoje}T00:00:00`)

      // última inserção
      const { data: ultimaInsercao } = await supabase
        .from('contaazul_visao_competencia')
        .select('coletado_em')
        .eq('bar_id', selectedBar.id)
        .order('coletado_em', { ascending: false })
        .limit(1)
        .single()

      setStatsInsercao({
        total_registros_banco: totalRegistros || 0,
        ultima_insercao: ultimaInsercao?.coletado_em 
          ? new Date(ultimaInsercao.coletado_em).toLocaleString('pt-BR')
          : 'Nunca',
        registros_hoje: registrosHoje || 0
      })

    } catch (error) {
      console.error('Erro ao verificar stats:', error)
    }
  }

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
      const receitas = dadosVisao?.filter((d: unknown) => d.tipo === 'RECEITA') || []
      const despesas = dadosVisao?.filter((d: unknown) => d.tipo === 'DESPESA') || []
      
      const totalReceitas = receitas.reduce((sum: number, item: unknown) => sum + (item.valor || 0), 0)
      const totalDespesas = despesas.reduce((sum: number, item: unknown) => sum + Math.abs(item.valor || 0), 0)
      
      const categorias = new Set(dadosVisao?.map((d: unknown) => d.categoria_id).filter(Boolean))
      const centrosCusto = new Set(dadosVisao?.map((d: unknown) => d.centro_custo_id).filter(Boolean))

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
        .from('api_credentials')
        .select('ultima_sincronizacao')
        .eq('bar_id', selectedBar.id)
        .eq('sistema', 'contaazul')
        .eq('ativo', true)
        .single()

      if (configData?.ultima_sincronizacao) {
        setUltimaColeta(new Date(configData.ultima_sincronizacao).toLocaleString('pt-BR'))
      }

      // Verificar estatísticas de inserção
      await verificarStatsInsercao()

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

      const response = await fetch('/api/contaazul/coletar-com-detalhes-otimizado', {
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
      
      console.log('Resultado da coleta:', resultado)
      
      // Recarregar dados e stats após a coleta
      setTimeout(() => {
        carregarDados()
        verificarStatsInsercao()
      }, 2000)

    } catch (error) {
      console.error('Erro na coleta:', error)
      alert(`Erro na coleta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setColetando(false)
    }
  }

  const executarColetaJsonCompleta = async () => {
    if (!selectedBar?.id) return

    setColetando(true)
    try {
      console.log('Iniciando coleta JSON completa (3 anos)...')
      
      const response = await fetch('/api/contaazul/coletar-json-completo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          data_inicio: '2024-01-01',
          data_fim: '2027-01-01'
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`)
      }

      const resultado = await response.json()
      
      console.log('Resultado da coleta JSON:', resultado)
      
      alert(`Coleta JSON concluída!\n\n` +
            `Receitas: ${resultado.resultado.receitas.total_parcelas} parcelas\n` +
            `Despesas: ${resultado.resultado.despesas.total_parcelas} parcelas\n` +
            `Arquivos: ${resultado.resultado.arquivos_gerados.length} salvos\n\n` +
            `Próximo passo: Clique em "Processar JSONs Offline"`)

    } catch (error) {
      console.error('Erro na coleta JSON:', error)
      alert(`Erro na coleta JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setColetando(false)
    }
  }

  const processarJsonsOffline = async () => {
    if (!selectedBar?.id) return

    // Solicitar o storage_path do usuário
    const storagePath = prompt(
      'Digite o storage_path dos JSONs coletados:\n\n' +
      'Formato: contaazul-dados/3/2025-07-10T15-30-00-123Z/\n\n' +
      'Este path foi mostrado no resultado da coleta JSON anterior.'
    )

    if (!storagePath) return

    setColetando(true)
    try {
      console.log('Iniciando processamento offline...')
      
      const response = await fetch('/api/contaazul/processar-json-offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          storage_path: storagePath
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`)
      }

      const resultado = await response.json()
      
      console.log('Resultado do processamento:', resultado)
      
      alert(`Processamento offline concluído!\n\n` +
            `Total inserido: ${resultado.resumo.total_geral} registros\n` +
            `Receitas: ${resultado.resumo.total_receitas}\n` +
            `Despesas: ${resultado.resumo.total_despesas}\n` +
            `Arquivos: ${resultado.resumo.arquivos_processados}\n\n` +
            `Dados disponíveis na tabela!`)

      // Recarregar dados e stats após o processamento
      setTimeout(() => {
        carregarDados()
        verificarStatsInsercao()
      }, 2000)

    } catch (error) {
      console.error('Erro no processamento offline:', error)
      alert(`Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
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

  const dadosFiltrados = dados.filter((item) => 
    filtroTipo === 'TODOS' || item.tipo === filtroTipo
  )

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold card-title-dark">
            Teste - Visão de Competência com Categorias
          </h1>
          <div className="text-sm card-description-dark">
            Bar: {selectedBar?.nome || 'Nenhum selecionado'}
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">O que esta página faz:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>Busca dados: Consulta a tabela <code>contaazul_visao_competencia</code></li>
            <li>Mostra categorias: Cada transação com sua categoria e centro de custo</li>
            <li>Coleta mensal: API <code>/api/contaazul/coletar-com-detalhes-otimizado</code> (1 mês)</li>
            <li>Coleta completa: API <code>/api/contaazul/coletar-json-completo</code> (3 anos – JSONs)</li>
            <li>Processamento offline: API <code>/api/contaazul/processar-json-offline</code> (JSONs – Banco)</li>
          </ul>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium card-title-dark mb-2">
            Mês/Ano (Competência):
          </label>
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="w-full input-dark"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium card-title-dark mb-2">
            Filtro por Tipo:
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full select-dark"
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
            className="btn-primary-dark"
          >
            {loading ? 'Carregando...' : 'Recarregar'}
          </Button>
        </div>
        
        <div className="flex flex-col justify-end">
          <Button
            onClick={executarColetaComDetalhes}
            disabled={coletando || !selectedBar?.id}
            className="btn-success-dark"
          >
            {coletando ? 'Coletando...' : 'Coletar Dados (Mês)'}
          </Button>
        </div>
        
        <div className="flex flex-col justify-end">
          <Button
            onClick={verificarStatsInsercao}
            disabled={loading}
            className="btn-secondary-dark"
          >
            Verificar Banco
          </Button>
        </div>
      </div>

      {/* Nova Seção: Estratégia Offline */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-700">
        <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">Estratégia Offline - 3 Anos Completos</h3>
        <div className="mb-4 text-sm text-orange-700 dark:text-orange-300">
          <p><strong>Vantagem:</strong> Coleta todos os dados de 2024-2027 de uma vez, salva em JSONs e processa offline (sem rate limits).</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={executarColetaJsonCompleta}
            disabled={coletando || !selectedBar?.id}
            className="btn-danger-dark"
          >
            {coletando ? 'Coletando...' : 'Coletar JSONs (2024-2027)'}
          </Button>
          <Button
            onClick={processarJsonsOffline}
            disabled={coletando || !selectedBar?.id}
            className="btn-outline-dark"
          >
            {coletando ? 'Processando...' : 'Processar JSONs Offline'}
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800 dark:text-green-200">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(resumo.total_receitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800 dark:text-red-200">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(resumo.total_despesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.resultado_liquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}> 
              {formatCurrency(resumo.resultado_liquido)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm card-title-dark">Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold card-description-dark">
              {resumo.total_registros}
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm card-title-dark">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold card-description-dark">
              {resumo.categorias_distintas}
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm card-title-dark">Centros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold card-description-dark">
              {resumo.centros_custo_distintos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status e Estatísticas de Inserção */}
      <div className="mb-6 space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium card-title-dark">Última coleta:</span>
              <span className="ml-2 text-sm card-description-dark">
                {ultimaColeta || 'Nunca executada'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium card-title-dark">Registros encontrados:</span>
              <span className="ml-2 text-sm card-description-dark">{dadosFiltrados.length}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Estatísticas de Inserção no Banco</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total no banco:</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statsInsercao.total_registros_banco}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Inseridos hoje:</span>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statsInsercao.registros_hoje}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Última inserção:</span>
              <div className="text-sm text-blue-600 dark:text-blue-400">{statsInsercao.ultima_insercao}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600 dark:text-blue-300">
            Estes números mostram se a API está realmente inserindo dados na tabela contaazul_visao_competencia
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="card-title-dark">
            Visão de Competência - {mesAno} ({dadosFiltrados.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full table-dark">
              <thead className="table-header-dark">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Centro de Custo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Competência</th>
                  <th className="px-4 py-3 text-left text-xs font-medium table-cell-dark uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dadosFiltrados.slice(0, 100).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.tipo === 'RECEITA' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {item.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm card-title-dark max-w-xs truncate">
                      {item.descricao}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={item.tipo === 'RECEITA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(Math.abs(item.valor))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm card-description-dark">
                      <div className="max-w-xs truncate">
                        {item.categoria_nome || '-'}
                      </div>
                      {item.categoria_valor && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.categoria_valor)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm card-description-dark">
                      <div className="max-w-xs truncate">
                        {item.centro_custo_nome || '-'}
                      </div>
                      {item.centro_custo_valor && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.centro_custo_valor)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm card-description-dark">
                      {formatDate(item.data_competencia)}
                    </td>
                    <td className="px-4 py-3 text-sm card-description-dark">
                      {item.status || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {dadosFiltrados.length === 0 && (
            <div className="text-center py-8 card-description-dark">
              <div className="mb-2">Nenhum dado encontrado</div>
              <div className="text-sm">
                Clique em "Coletar Dados" para buscar informações do ContaAzul
              </div>
            </div>
          )}
          
          {dadosFiltrados.length > 100 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                Mostrando apenas os primeiros 100 registros de {dadosFiltrados.length} encontrados.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 

