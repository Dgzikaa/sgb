'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilterIcon, BarChart3Icon, RefreshCw, Upload, ChevronDownIcon, ChevronUpIcon, EditIcon, TrashIcon, PlusIcon } from 'lucide-react'
import { useBar } from '@/contexts/BarContext'

interface DadosDesempenho {
  id: number
  bar_id: number
  ano: number
  numero_semana: number
  data_inicio: string
  data_fim: string
  faturamento_total: number
  faturamento_entrada: number
  faturamento_bar: number
  clientes_atendidos: number
  reservas_totais: number
  reservas_presentes: number
  ticket_medio: number
  cmv_teorico: number
  cmv_limpo: number
  meta_semanal: number
  atingimento?: number
  observacoes?: string
  criado_em: string
  atualizado_em: string
}

interface ResumoDesempenho {
  total_semanas: number
  faturamento_medio: number
  faturamento_total_ano: number
  clientes_medio: number
  clientes_total_ano: number
  ticket_medio_geral: number
  atingimento_medio: number
  cmv_medio: number
}

export default function TabelaDesempenhoPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const { setSidebarCollapsed } = useSidebar()
  const [dados, setDados] = useState<DadosDesempenho[]>([])
  const [resumo, setResumo] = useState<ResumoDesempenho | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // Filtros
  const [filtrosExpanded, setFiltrosExpanded] = useState(false)
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear().toString())
  const [mesFiltro, setMesFiltro] = useState('todos')
  const [filtroTexto, setFiltroTexto] = useState('')

  // URL da planilha fixa
  const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/1WRnwl_F_tgqvQmHIyQUFtiWQVujTBk2TDL-ii0JjfAY/edit?gid=972882162#gid=972882162'

  useEffect(() => {
    setPageTitle('📈 Tabela de Desempenho')
    
    return () => {
      setPageTitle(null)
    }
  }, [setPageTitle])

  // Efeito separado para colapsar sidebar apenas uma vez quando tudo estiver carregado
  useEffect(() => {
    if (!hasInitialized && selectedBar?.id) {
      // Colapsar sidebar depois que o bar estiver selecionado e componentes carregados
             const timer = setTimeout(() => {
         setSidebarCollapsed(true)
         setHasInitialized(true)
       }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [setSidebarCollapsed, hasInitialized, selectedBar?.id])

  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados()
    }
  }, [selectedBar?.id, anoFiltro, mesFiltro])

  const carregarDados = async () => {
    if (!selectedBar?.id) return
    
    setLoading(true)
    console.log('🔄 Carregando dados de desempenho...')

    try {
      const params = new URLSearchParams({
        ano: anoFiltro
      })
      
      if (mesFiltro && mesFiltro !== 'todos') {
        params.append('mes', mesFiltro)
      }

      const response = await fetch(`/api/admin/desempenho-semanal?${params.toString()}`, {
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin'
          })
        }
      })
      
      const data = await response.json()

      if (data.success) {
        setDados(data.data || [])
        setResumo(data.resumo || null)
        console.log('✅ Dados carregados:', data.data?.length || 0, 'semanas')
      } else {
        console.error('❌ Erro ao carregar dados:', data.error)
        setDados([])
        setResumo(null)
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      setDados([])
      setResumo(null)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarComGoogleSheets = async () => {
    if (!selectedBar?.id) {
      alert('Nenhum bar selecionado')
      return
    }

    setSyncing(true)
    
    try {
      console.log('🔄 Iniciando sincronização com Google Sheets...')
      
      const response = await fetch('/api/admin/desempenho-semanal/sync-sheets-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin'
          })
        },
        body: JSON.stringify({
          planilha_url: URL_PLANILHA,
          substituir_existentes: true
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Sincronização concluída!\n\n` +
              `📥 Importados: ${result.resultados.dados_importados}\n` +
              `🔄 Atualizados: ${result.resultados.dados_atualizados}\n` +
              `📊 Total processados: ${result.resultados.total_processados}\n` +
              `❌ Erros: ${result.resultados.erros}`)
        
        // Recarregar dados após sincronização
        await carregarDados()
      } else {
        alert(`❌ Erro na sincronização:\n\n${result.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error)
      alert(`❌ Erro na sincronização:\n\n${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const excluirSemana = async (id: number, semana: number) => {
    if (!confirm(`Tem certeza que deseja excluir os dados da Semana ${semana}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/desempenho-semanal?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: selectedBar?.id,
            permissao: 'admin'
          })
        }
      })

      const result = await response.json()

      if (result.success) {
        alert('✅ Semana excluída com sucesso!')
        await carregarDados()
      } else {
        alert(`❌ Erro ao excluir: ${result.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir:', error)
      alert(`❌ Erro ao excluir: ${error.message}`)
    }
  }

  const limparTodosDados = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso irá excluir TODOS os dados de desempenho deste bar. Esta ação não pode ser desfeita!\n\nTem certeza que deseja continuar?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/desempenho-semanal/clear-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar?.id,
            permissao: 'admin'
          })
        }
      })

      const result = await response.json()

      if (result.success) {
        alert('✅ Todos os dados foram excluídos!')
        await carregarDados()
      } else {
        alert(`❌ Erro ao limpar dados: ${result.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro ao limpar dados:', error)
      alert(`❌ Erro ao limpar dados: ${error.message}`)
    }
  }

  const dadosFiltrados = dados.filter(item => {
    const matchTexto = !filtroTexto || 
      item.numero_semana.toString().includes(filtroTexto) ||
      item.data_inicio.includes(filtroTexto) ||
      item.observacoes?.toLowerCase().includes(filtroTexto.toLowerCase())
    
    return matchTexto
  }).sort((a, b) => b.numero_semana - a.numero_semana) // Ordenação decrescente por semana

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const getAtingimentoColor = (atingimento: number) => {
    if (atingimento >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (atingimento >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const limparFiltros = () => {
    setAnoFiltro(new Date().getFullYear().toString())
    setMesFiltro('todos')
    setFiltroTexto('')
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-6 p-6">
      {/* Filtros Expandir/Minimizar */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setFiltrosExpanded(!filtrosExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                Filtros & Configurações
              </CardTitle>
              <CardDescription>
                {filtrosExpanded ? 'Clique para minimizar filtros' : 'Clique para expandir filtros de busca'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {dadosFiltrados.length} registros
              </Badge>
              <div className="flex gap-2">
                <Button 
                  onClick={carregarDados}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button 
                  onClick={sincronizarComGoogleSheets}
                  disabled={syncing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Sincronizar
                    </>
                  )}
                </Button>
                <Button 
                  onClick={limparTodosDados}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Limpar Tudo
                </Button>
                <Button 
                  onClick={() => alert('🚧 Funcionalidade de criação em desenvolvimento')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nova Semana
                </Button>
              </div>
              {filtrosExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </div>
          </div>
        </CardHeader>
        {filtrosExpanded && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Busca Geral
                </label>
                <Input
                  placeholder="Pesquisar..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 shadow-sm"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ano
                </label>
                <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 shadow-sm">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mês
                </label>
                <Select value={mesFiltro} onValueChange={setMesFiltro}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 shadow-sm">
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="todos">Todos os meses</SelectItem>
                    <SelectItem value="1">Janeiro</SelectItem>
                    <SelectItem value="2">Fevereiro</SelectItem>
                    <SelectItem value="3">Março</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Maio</SelectItem>
                    <SelectItem value="6">Junho</SelectItem>
                    <SelectItem value="7">Julho</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Setembro</SelectItem>
                    <SelectItem value="10">Outubro</SelectItem>
                    <SelectItem value="11">Novembro</SelectItem>
                    <SelectItem value="12">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabela com Ações */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">
            Dados de Desempenho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Semana</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Período</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Faturamento</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Clientes</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ticket Médio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Reservas</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Meta</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Atingimento</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((item) => {
                  const atingimento = item.meta_semanal > 0 ? (item.faturamento_total / item.meta_semanal) * 100 : 0
                  
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        Semana {item.numero_semana}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <div className="text-sm">
                          <div>{formatarData(item.data_inicio)}</div>
                          <div className="text-gray-500">até {formatarData(item.data_fim)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">
                        <div>{formatarMoeda(item.faturamento_total)}</div>
                        {item.faturamento_entrada > 0 && (
                          <div className="text-xs text-gray-500">
                            Entrada: {formatarMoeda(item.faturamento_entrada)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{item.clientes_atendidos}</td>
                      <td className="py-3 px-4 text-slate-800">
                        {item.clientes_atendidos > 0 ? 
                          formatarMoeda(item.faturamento_total / item.clientes_atendidos) : 
                          '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <div className="text-sm">
                          <div>{item.reservas_presentes}/{item.reservas_totais}</div>
                          <div className="text-gray-500">
                            {item.reservas_totais > 0 ? 
                              `${((item.reservas_presentes / item.reservas_totais) * 100).toFixed(0)}%` : 
                              '-'
                            }
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {formatarMoeda(item.meta_semanal)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getAtingimentoColor(atingimento)}>
                          {atingimento.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => alert('🚧 Modal de edição em desenvolvimento')}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => excluirSemana(item.id, item.numero_semana)}
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {dadosFiltrados.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <BarChart3Icon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Nenhum dado encontrado com os filtros aplicados</p>
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  className="mt-4"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 