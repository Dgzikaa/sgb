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
  const [statsInsercao, setStatsInsercao] = useState({
    total_registros_banco: 0,
    ultima_insercao: '',
    registros_hoje: 0
  })

  useEffect(() => {
    setPageTitle('ğŸ¯ Teste - Visá£o de Competáªncia com Categorias')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    // Definir máªs atual como padrá£o
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

      // ášltima inserá§á£o
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
      // Calcular áºltimo dia do máªs corretamente
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate()
      const dataFim = `${ano}-${mes}-${ultimoDia.toString().padStart(2, '0')}`

      // Carregar dados da visá£o de competáªncia
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
      const receitas = dadosVisao?.filter((d) => d.tipo === 'RECEITA') || []
      const despesas = dadosVisao?.filter((d) => d.tipo === 'DESPESA') || []
      
      const totalReceitas = receitas.reduce((sum: number, item) => sum + (item.valor || 0), 0)
      const totalDespesas = despesas.reduce((sum: number, item) => sum + Math.abs(item.valor || 0), 0)
      
      const categorias = new Set(dadosVisao?.map((d) => d.categoria_id).filter(Boolean))
      const centrosCusto = new Set(dadosVisao?.map((d) => d.centro_custo_id).filter(Boolean))

      setResumo({
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        resultado_liquido: totalReceitas - totalDespesas,
        total_registros: dadosVisao?.length || 0,
        categorias_distintas: categorias.size,
        centros_custo_distintos: centrosCusto.size
      })

      // Verificar áºltima coleta
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

      // Verificar estatá­sticas de inserá§á£o
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
      // Calcular áºltimo dia do máªs corretamente
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
      
      console.log('ğŸ¯ Resultado da coleta:', resultado)
      
      // Recarregar dados e stats apá³s a coleta
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
      console.log('ğŸ“ Iniciando coleta JSON completa (3 anos)...')
      
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
      
      console.log('ğŸ“ Resultado da coleta JSON:', resultado)
      
      alert(`œ… Coleta JSON concluá­da!\n\n` +
            `ğŸ“Š Receitas: ${resultado.resultado.receitas.total_parcelas} parcelas\n` +
            `ğŸ’¸ Despesas: ${resultado.resultado.despesas.total_parcelas} parcelas\n` +
            `ğŸ“ Arquivos: ${resultado.resultado.arquivos_gerados.length} salvos\n\n` +
            `š™ï¸ Prá³ximo passo: Clique em "Processar JSONs Offline"`)

    } catch (error) {
      console.error('Erro na coleta JSON:', error)
      alert(`Erro na coleta JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setColetando(false)
    }
  }

  const processarJsonsOffline = async () => {
    if (!selectedBar?.id) return

    // Solicitar o storage_path do usuá¡rio
    const storagePath = prompt(
      'ğŸ“ Digite o storage_path dos JSONs coletados:\n\n' +
      'Formato: contaazul-dados/3/2025-07-10T15-30-00-123Z/\n\n' +
      'ğŸ’¡ Este path foi mostrado no resultado da coleta JSON anterior.'
    )

    if (!storagePath) return

    setColetando(true)
    try {
      console.log('š™ï¸ Iniciando processamento offline...')
      
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
      
      console.log('š™ï¸ Resultado do processamento:', resultado)
      
      alert(`œ… Processamento offline concluá­do!\n\n` +
            `ğŸ“Š Total inserido: ${resultado.resumo.total_geral} registros\n` +
            `ğŸ’° Receitas: ${resultado.resumo.total_receitas}\n` +
            `ğŸ’¸ Despesas: ${resultado.resumo.total_despesas}\n` +
            `ğŸ“ Arquivos: ${resultado.resumo.arquivos_processados}\n\n` +
            `ğŸ‰ Dados disponá­veis na tabela!`)

      // Recarregar dados e stats apá³s o processamento
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            ğŸ¯ Teste - Visá£o de Competáªncia com Categorias
          </h1>
          <div className="text-sm text-gray-600">
            Bar: {selectedBar?.nome || 'Nenhum selecionado'}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">ğŸ“Š O que esta pá¡gina faz:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>€¢ <strong>Busca dados:</strong> Consulta a tabela `contaazul_visao_competencia`</li>
            <li>€¢ <strong>Mostra categorias:</strong> Cada transaá§á£o com sua categoria e centro de custo</li>
            <li>€¢ <strong>Coleta mensal:</strong> API `/api/contaazul/coletar-com-detalhes-otimizado` (1 máªs)</li>
            <li>€¢ <strong>Coleta completa:</strong> API `/api/contaazul/coletar-json-completo` (3 anos †’ JSONs)</li>
            <li>€¢ <strong>Processamento offline:</strong> API `/api/contaazul/processar-json-offline` (JSONs †’ Banco)</li>
          </ul>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máªs/Ano (Competáªncia):
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
            {loading ? 'ğŸ”„ Carregando...' : 'ğŸ”„ Recarregar'}
          </Button>
        </div>
        
                 <div className="flex flex-col justify-end">
           <Button
             onClick={executarColetaComDetalhes}
             disabled={coletando || !selectedBar?.id}
             className="bg-green-500 hover:bg-green-600"
           >
             {coletando ? 'ğŸš€ Coletando...' : 'ğŸš€ Coletar Dados (Máªs)'}
           </Button>
         </div>
         
         <div className="flex flex-col justify-end">
           <Button
             onClick={verificarStatsInsercao}
             disabled={loading}
             className="bg-purple-500 hover:bg-purple-600"
           >
             ğŸ—„ï¸ Verificar Banco
           </Button>
         </div>
      </div>

      {/* Nova Seá§á£o: Estratá©gia Offline */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h3 className="font-semibold text-orange-800 mb-3">ğŸ“ Estratá©gia Offline - 3 Anos Completos</h3>
        <div className="mb-4 text-sm text-orange-700">
          <p><strong>Vantagem:</strong> Coleta todos os dados de 2024-2027 de uma vez, salva em JSONs e processa offline (sem rate limits).</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={executarColetaJsonCompleta}
            disabled={coletando || !selectedBar?.id}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {coletando ? 'ğŸ“ Coletando...' : 'ğŸ“ Coletar JSONs (2024-2027)'}
          </Button>
          <Button
            onClick={processarJsonsOffline}
            disabled={coletando || !selectedBar?.id}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {coletando ? 'š™ï¸ Processando...' : 'š™ï¸ Processar JSONs Offline'}
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">ğŸ’° Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumo.total_receitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800">ğŸ’¸ Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(resumo.total_despesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">ğŸ“Š Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.resultado_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(resumo.resultado_liquido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-800">ğŸ“‹ Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {resumo.total_registros}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-800">ğŸ·ï¸ Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {resumo.categorias_distintas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-800">ğŸ¯ Centros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {resumo.centros_custo_distintos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status e Estatá­sticas de Inserá§á£o */}
      <div className="mb-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">ášltima coleta:</span>
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

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">ğŸ—„ï¸ Estatá­sticas de Inserá§á£o no Banco</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-blue-700">Total no banco:</span>
              <div className="text-2xl font-bold text-blue-600">{statsInsercao.total_registros_banco}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-700">Inseridos hoje:</span>
              <div className="text-2xl font-bold text-green-600">{statsInsercao.registros_hoje}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-700">ášltima inserá§á£o:</span>
              <div className="text-sm text-blue-600">{statsInsercao.ultima_insercao}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            ğŸ’¡ Estes náºmeros mostram se a API está¡ realmente inserindo dados na tabela contaazul_visao_competencia
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>
            ğŸ“Š Visá£o de Competáªncia - {mesAno} ({dadosFiltrados.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descriá§á£o</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro de Custo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Competáªncia</th>
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
                        {item.tipo === 'RECEITA' ? 'ğŸ’°' : 'ğŸ’¸'} {item.tipo}
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
              <div className="mb-2">ğŸ“­ Nenhum dado encontrado</div>
              <div className="text-sm">
                Clique em "ğŸš€ Coletar Dados" para buscar informaá§áµes do ContaAzul
              </div>
            </div>
          )}
          
          {dadosFiltrados.length > 100 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="text-sm text-yellow-800">
                š ï¸ Mostrando apenas os primeiros 100 registros de {dadosFiltrados.length} encontrados.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
