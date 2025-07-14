'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface Producao {
  id: number
  bar_id: number
  receita_codigo: string
  receita_nome: string
  receita_categoria: string
  criado_por_nome: string
  inicio_producao: string
  fim_producao: string
  tempo_total_producao: string
  peso_bruto_proteina: number
  peso_limpo_proteina: number
  rendimento_real: number
  rendimento_esperado: number
  observacoes: string
  status: string
  insumo_chefe_nome: string
  peso_insumo_chefe: number
  criado_em: string
  percentual_aderencia_receita?: number  // NOVO CAMPO
}

interface EstatisticasResponse {
  success: boolean
  producoes: Producao[]
  estatisticas: {
    total_producoes: number
    desvio_medio: number
    eficiencia_excelente: number
    eficiencia_boa: number
    eficiencia_regular: number
    eficiencia_ruim: number
  }
  total: number
}

export default function RelatorioProducoesPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const [dataInput, setDataInput] = useState<string>(new Date().toISOString().split('T')[0])
  const [producoes, setProducoes] = useState<Producao[]>([])
  const [estatisticas, setEstatisticas] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [executandoMigration, setExecutandoMigration] = useState(false)

  // NOVA FUNÇÃO: Executar migration
  const executarMigration = async () => {
    setExecutandoMigration(true)
    try {
              const response = await fetch('/api/producoes/adicionar-campos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Migration executada com sucesso!\n\n` +
              `📊 Detalhes:\n` +
              `• Campo na tabela produções: ${result.detalhes.campo_producoes}\n` +
              `• Atualização tabela insumos: ${result.detalhes.tabela_insumos}\n` +
              `• Criação de índices: ${result.detalhes.indices}\n\n` +
              `🎯 Agora o sistema pode calcular o percentual de aderência à receita!`)
        
        // Recarregar produções para pegar os novos campos
        carregarProducoes()
      } else {
        alert(`❌ Erro na migration: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Erro ao executar migration de campos')
    } finally {
      setExecutandoMigration(false)
    }
  }

  const carregarProducoes = useCallback(async () => {
    if (!selectedBar?.id) return
    
    setIsLoading(true)
    try {
      // Criar filtros de data para o dia selecionado
      const dataInicio = `${dataInput}T00:00:00.000Z`
      const dataFim = `${dataInput}T23:59:59.999Z`
      
      const params = new URLSearchParams({
        bar_id: selectedBar.id.toString(),
        data_inicio: dataInicio,
        data_fim: dataFim,
        limite: '100'
      })
      
      const response = await fetch(`/api/producoes?${params}`)
      
      if (response.ok) {
        const data: EstatisticasResponse = await response.json()
        setProducoes(data.producoes || [])
        setEstatisticas(data.estatisticas || {})
      } else {
        setProducoes([])
        setEstatisticas({})
      }
    } catch (error) {
      setProducoes([])
      setEstatisticas({})
    } finally {
      setIsLoading(false)
    }
  }, [selectedBar?.id, dataInput])

  useEffect(() => {
    if (selectedBar?.id) {
      carregarProducoes()
    }
  }, [selectedBar?.id, carregarProducoes])

  useEffect(() => {
    setPageTitle('🏭 Relatório de Produções')
    return () => setPageTitle('')
  }, [setPageTitle])

  const calcularEficiencia = (real: number, esperado: number): number => {
    if (!esperado || esperado === 0) return 0
    return Math.round((real / esperado) * 100)
  }

  // NOVA FUNÇÃO: Calcular desvio percentual
  const calcularDesvio = (real: number, esperado: number): number => {
    if (!esperado || esperado === 0) return 0
    return Math.round(Math.abs((real - esperado) / esperado) * 100)
  }

  // NOVA FUNÇÃO: Calcular fator de correção
  const calcularFatorCorrecao = (real: number, esperado: number): number => {
    if (!real || real === 0) return 0
    return Math.round((esperado / real) * 100) / 100
  }

  // NOVA FUNÇÃO: Cor do status de aderência
  const getAdherenciaColor = (aderencia: number | undefined) => {
    if (!aderencia) return 'bg-gray-100 border-gray-300 text-gray-600'
    if (aderencia >= 95) return 'bg-green-100 border-green-300 text-green-800'
    if (aderencia >= 85) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    if (aderencia >= 75) return 'bg-orange-100 border-orange-300 text-orange-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  // NOVA FUNÇÃO: Texto do status de aderência
  const getAdherenciaText = (aderencia: number | undefined) => {
    if (!aderencia) return '❓ Sem dados'
    if (aderencia >= 95) return '🏆 Excelente'
    if (aderencia >= 85) return '👍 Bom'
    if (aderencia >= 75) return '⚠️ Regular'
    return '🔴 Ruim'
  }

  const getStatusColor = (eficiencia: number) => {
    if (eficiencia >= 95) return 'bg-green-100 border-green-300 text-green-800'
    if (eficiencia >= 85) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    if (eficiencia >= 75) return 'bg-orange-100 border-orange-300 text-orange-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  const getStatusText = (eficiencia: number) => {
    if (eficiencia >= 95) return '✅ Excelente'
    if (eficiencia >= 85) return '👍 Boa'
    if (eficiencia >= 75) return '⚠️ Regular'
    return '❌ Ruim'
  }

  const formatarTempo = (tempoString: string) => {
    if (!tempoString) return '0:00'
    // Se for formato PostgreSQL interval (00:05:30)
    const match = tempoString.match(/(\d{2}):(\d{2}):(\d{2})/)
    if (match) {
      const [, horas, minutos, segundos] = match
      if (parseInt(horas) > 0) {
        return `${parseInt(horas)}h ${parseInt(minutos)}m`
      }
      return `${parseInt(minutos)}m ${parseInt(segundos)}s`
    }
    return tempoString
  }

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!selectedBar?.id) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium">⚠️ Selecione um bar primeiro</p>
        </div>
      </div>
    )
  }

      return (
      <ProtectedRoute requiredModule="relatorio_producoes">
        <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-700">Análise de desempenho da produção por data</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-black">📅 Selecionar Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                className="w-auto max-w-48 text-black font-medium border-2 border-gray-300"
              />
              <Button 
                onClick={carregarProducoes} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? '⏳ Carregando...' : '🔄 Atualizar'}
              </Button>
              <Button 
                onClick={executarMigration} 
                disabled={executandoMigration}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                title="Executar migration para habilitar análise de aderência à receita"
              >
                {executandoMigration ? '�� Executando...' : '📊 Migrar Campos'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {producoes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-black">📈 Estatísticas do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{estatisticas.total_producoes || producoes.length}</div>
                  <div className="text-sm text-blue-700">Total Produções</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{estatisticas.eficiencia_excelente || 0}</div>
                  <div className="text-sm text-green-700">Excelentes (≥95%)</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{estatisticas.eficiencia_boa || 0}</div>
                  <div className="text-sm text-yellow-700">Boas (85-94%)</div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{estatisticas.eficiencia_ruim || 0}</div>
                  <div className="text-sm text-red-700">Ruins (&lt;75%)</div>
                </div>
                
                {/* NOVA SEÇÃO: Estatísticas de Aderência */}
                {producoes.some(p => p.percentual_aderencia_receita !== undefined) && (
                  <>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {producoes.filter(p => p.percentual_aderencia_receita && p.percentual_aderencia_receita >= 95).length}
                      </div>
                      <div className="text-sm text-purple-700">Aderência Excelente</div>
                    </div>
                    
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">
                        {producoes.some(p => p.percentual_aderencia_receita) 
                          ? Math.round(producoes.filter(p => p.percentual_aderencia_receita).reduce((acc, p) => acc + (p.percentual_aderencia_receita || 0), 0) / producoes.filter(p => p.percentual_aderencia_receita).length)
                          : 0}%
                      </div>
                      <div className="text-sm text-indigo-700">Aderência Média</div>
                    </div>
                    
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">
                        {producoes.filter(p => p.percentual_aderencia_receita && p.percentual_aderencia_receita < 75).length}
                      </div>
                      <div className="text-sm text-pink-700">Aderência Ruim</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {producoes.filter(p => !p.percentual_aderencia_receita).length}
                      </div>
                      <div className="text-sm text-gray-700">Sem Dados</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-black">
              <span className="text-orange-600">🏭</span> Produções
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-blue-600 text-lg">⏳ Carregando produções...</div>
              </div>
            ) : producoes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">📭 Nenhuma produção encontrada</div>
                <p className="text-gray-400 text-sm mt-2">
                  Data selecionada: {new Date(dataInput).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-600 text-sm">
                  Total: <strong className="text-black">{producoes.length} produções</strong> em {new Date(dataInput).toLocaleDateString('pt-BR')}
                </div>

                {/* AVISO: Migration necessária */}
                {producoes.length > 0 && !producoes.some(p => p.percentual_aderencia_receita !== undefined) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-600 text-xl">⚠️</span>
                      <h3 className="font-bold text-orange-800">Dados de Aderência Não Disponíveis</h3>
                    </div>
                    <p className="text-orange-700 text-sm mb-3">
                      Para ver as métricas de aderência à receita, desvio e fator de correção, 
                      execute a migration clicando no botão <strong>"📊 Migrar Campos"</strong> acima.
                    </p>
                    <p className="text-orange-600 text-xs">
                      💡 A migration adiciona campos no banco para análise avançada das produções.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {producoes.map((producao) => {
                    const eficiencia = calcularEficiencia(producao.rendimento_real, producao.rendimento_esperado)
                    const desvio = calcularDesvio(producao.rendimento_real, producao.rendimento_esperado)
                    const fatorCorrecao = calcularFatorCorrecao(producao.rendimento_real, producao.rendimento_esperado)
                    const aderencia = producao.percentual_aderencia_receita
                    
                    return (
                      <div key={producao.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-black text-lg">
                                {producao.receita_codigo} - {producao.receita_nome}
                              </h3>
                              <Badge className={getStatusColor(eficiencia)}>
                                {getStatusText(eficiencia)} ({eficiencia}%)
                              </Badge>
                              {aderencia !== undefined && (
                                <Badge className={getAdherenciaColor(aderencia)}>
                                  {getAdherenciaText(aderencia)} ({aderencia.toFixed(1)}%)
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">
                                  <strong className="text-black">Categoria:</strong> {producao.receita_categoria}
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">Operador:</strong> {producao.criado_por_nome}
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">Status:</strong> {producao.status}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-600">
                                  <strong className="text-black">Peso Bruto:</strong> {producao.peso_bruto_proteina}g
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">Peso Líquido:</strong> {producao.peso_limpo_proteina}g
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">Insumo Chefe:</strong> {producao.insumo_chefe_nome} ({producao.peso_insumo_chefe}g)
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-600">
                                  <strong className="text-black">Rendimento Real:</strong> {producao.rendimento_real}g
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">Rendimento Esperado:</strong> {producao.rendimento_esperado}g
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">Tempo:</strong> {formatarTempo(producao.tempo_total_producao)}
                                </p>
                              </div>

                              {/* NOVA COLUNA: Métricas de Análise */}
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-600">
                                  <strong className="text-black">📊 Desvio:</strong> {desvio}%
                                </p>
                                <p className="text-gray-600">
                                  <strong className="text-black">⚖️ Fator Correção:</strong> {fatorCorrecao}x
                                </p>
                                {aderencia !== undefined ? (
                                  <p className="text-gray-600">
                                    <strong className="text-black">🎯 Aderência:</strong> {aderencia.toFixed(1)}%
                                  </p>
                                ) : (
                                  <p className="text-gray-400 text-xs">
                                    Execute migration para ver aderência
                                  </p>
                                )}
                              </div>
                            </div>

                            {producao.observacoes && (
                              <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                                <strong className="text-black">Observações:</strong> {producao.observacoes}
                              </div>
                            )}

                            <div className="mt-2 text-xs text-gray-500">
                              Início: {formatarData(producao.inicio_producao)} | 
                              Fim: {formatarData(producao.fim_producao)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 