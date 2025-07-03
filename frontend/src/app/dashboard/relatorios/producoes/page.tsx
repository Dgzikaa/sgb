'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBar } from '@/contexts/BarContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
  const [dataInput, setDataInput] = useState<string>(new Date().toISOString().split('T')[0])
  const [producoes, setProducoes] = useState<Producao[]>([])
  const [estatisticas, setEstatisticas] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

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
        console.log('📊 Dados recebidos:', data)
        setProducoes(data.producoes || [])
        setEstatisticas(data.estatisticas || {})
      } else {
        console.error('❌ Erro na API:', response.status)
        setProducoes([])
        setEstatisticas({})
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produções:', error)
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

  const calcularEficiencia = (real: number, esperado: number): number => {
    if (!esperado || esperado === 0) return 0
    return Math.round((real / esperado) * 100)
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          <span className="text-orange-600">🏭</span> Relatório de Produções
        </h1>
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

              <div className="space-y-3">
                {producoes.map((producao) => {
                  const eficiencia = calcularEficiencia(producao.rendimento_real, producao.rendimento_esperado)
                  
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
  )
} 