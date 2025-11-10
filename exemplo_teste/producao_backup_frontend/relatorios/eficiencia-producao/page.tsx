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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, TrendingDown, Target, Scale, Calculator, Clock, User } from 'lucide-react'
import { useBar } from '@/contexts/BarContext'

interface ProducaoEficiencia {
  id: number
  produto_codigo: string
  produto_nome: string
  funcionario: string
  data_producao: string
  quantidade_produzida: number
  quantidade_esperada: number
  eficiencia_quantidade: number
  peso_bruto_g: number
  peso_limpo_g: number
  peso_final_g: number
  perda_limpeza_g: number
  perda_producao_g: number
  perda_total_g: number
  custo_esperado: number
  custo_total_insumos: number
  variacao_custo: number
  rendimento_teorico: number
  rendimento_real: number
  tempo_total_segundos: number
  insumos_utilizados: unknown[]
}

export default function RelatorioEficienciaProducao() {
  const { selectedBar } = useBar()
  
  const [producoes, setProducoes] = useState<ProducaoEficiencia[]>([])
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({
    produto: '',
    funcionario: '',
    data_inicio: '',
    data_fim: '',
    apenas_problemas: false
  })
  
  const [estatisticas, setEstatisticas] = useState({
    total_producoes: 0,
    eficiencia_media: 0,
    perda_media: 0,
    variacao_custo_media: 0,
    funcionarios_unicos: 0,
    produtos_unicos: 0
  })

  useEffect(() => {
    carregarDados()
  }, [selectedBar])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        bar_id: (selectedBar?.id || 1).toString(),
        limite: '100'
      })
      
      if (filtros.produto) params.append('produto_codigo', filtros.produto)
      if (filtros.funcionario) params.append('funcionario', filtros.funcionario)
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio)
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim)

      const response = await fetch(`/api/receitas/producao?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        let producoesFiltradas = data.data || []
        
        // Filtrar apenas problemas se solicitado
        if (filtros.apenas_problemas) {
          producoesFiltradas = producoesFiltradas.filter((p: ProducaoEficiencia) => 
            p.eficiencia_quantidade < 90 || 
            Math.abs(p.variacao_custo) > 1 || 
            p.perda_total_g > (p.peso_bruto_g * 0.25) // Mais de 25% de perda
          )
        }
        
        setProducoes(producoesFiltradas)
        calcularEstatisticas(producoesFiltradas)
      }
    } catch (error) {
      // Error silently handled
    } finally {
      setLoading(false)
    }
  }

  const calcularEstatisticas = (dados: ProducaoEficiencia[]) => {
    if (!dados.length) {
      setEstatisticas({
        total_producoes: 0,
        eficiencia_media: 0,
        perda_media: 0,
        variacao_custo_media: 0,
        funcionarios_unicos: 0,
        produtos_unicos: 0
      })
      return
    }

    const eficienciaMedia = dados.reduce((acc, p) => acc + p.eficiencia_quantidade, 0) / dados.length
    const perdaMedia = dados.reduce((acc, p) => acc + p.perda_total_g, 0) / dados.length
    const variacaoCustoMedia = dados.reduce((acc, p) => acc + p.variacao_custo, 0) / dados.length
    
    const funcionarios = new Set(dados.map((p) => p.funcionario)).size
    const produtos = new Set(dados.map((p) => p.produto_codigo)).size

    setEstatisticas({
      total_producoes: dados.length,
      eficiencia_media: Math.round(eficienciaMedia * 100) / 100,
      perda_media: Math.round(perdaMedia * 100) / 100,
      variacao_custo_media: Math.round(variacaoCustoMedia * 100) / 100,
      funcionarios_unicos: funcionarios,
      produtos_unicos: produtos
    })
  }

  const formatarTempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCorEficiencia = (eficiencia: number) => {
    if (eficiencia >= 95) return 'text-green-600'
    if (eficiencia >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCorVariacao = (variacao: number) => {
    if (Math.abs(variacao) <= 0.5) return 'text-green-600'
    if (Math.abs(variacao) <= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              RelatÃ¡Â³rio de EficiÃ¡Âªncia de ProduÃ¡Â§Ã¡Â£o
              {selectedBar && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {selectedBar.nome}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <Label className="text-black font-medium">Produto</Label>
                <Input
                  value={filtros.produto}
                  onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
                  placeholder="CÃ¡Â³digo do produto..."
                  className="text-black font-medium placeholder:text-gray-600 bg-white border-2 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-black font-medium">FuncionÃ¡Â¡rio</Label>
                <Input
                  value={filtros.funcionario}
                  onChange={(e) => setFiltros(prev => ({ ...prev, funcionario: e.target.value }))}
                  placeholder="Nome do funcionÃ¡Â¡rio..."
                  className="text-black font-medium placeholder:text-gray-600 bg-white border-2 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-black font-medium">Data InÃ¡Â­cio</Label>
                <Input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                  className="text-black font-medium bg-white border-2 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-black font-medium">Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                  className="text-black font-medium bg-white border-2 border-gray-300"
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button 
                  onClick={carregarDados}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Ã°Å¸â€Â Filtrar
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-black font-medium">
                <input
                  type="checkbox"
                  checked={filtros.apenas_problemas}
                  onChange={(e) => setFiltros(prev => ({ ...prev, apenas_problemas: e.target.checked }))}
                  className="rounded"
                />
                Mostrar apenas problemas (eficiÃ¡Âªncia &lt; 90%, variaÃ¡Â§Ã¡Â£o custo &gt; R$ 1,00, perda &gt; 25%)
              </label>
            </div>
          </CardContent>
        </Card>

        {/* EstatÃ¡Â­sticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.total_producoes}</div>
              <div className="text-sm text-black font-medium">ProduÃ¡Â§Ã¡Âµes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getCorEficiencia(estatisticas.eficiencia_media)}`}>
                {estatisticas.eficiencia_media}%
              </div>
              <div className="text-sm text-black font-medium">EficiÃ¡Âªncia MÃ¡Â©dia</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{estatisticas.perda_media}g</div>
              <div className="text-sm text-black font-medium">Perda MÃ¡Â©dia</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getCorVariacao(estatisticas.variacao_custo_media)}`}>
                R$ {estatisticas.variacao_custo_media.toFixed(2)}
              </div>
              <div className="text-sm text-black font-medium">VariaÃ¡Â§Ã¡Â£o Custo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{estatisticas.funcionarios_unicos}</div>
              <div className="text-sm text-black font-medium">FuncionÃ¡Â¡rios</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estatisticas.produtos_unicos}</div>
              <div className="text-sm text-black font-medium">Produtos</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de ProduÃ¡Â§Ã¡Âµes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">ProduÃ¡Â§Ã¡Âµes Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-black font-medium">Carregando...</div>
            ) : producoes.length === 0 ? (
              <div className="text-center py-8 text-black font-medium">
                Nenhuma produÃ¡Â§Ã¡Â£o encontrada com os filtros aplicados
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {producoes.map((producao) => (
                  <Card key={producao.id} className="border-2 border-gray-300">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        
                        {/* InformaÃ¡Â§Ã¡Âµes BÃ¡Â¡sicas */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-black">{producao.funcionario}</span>
                          </div>
                          <p className="text-sm text-black font-bold">{producao.produto_nome}</p>
                          <p className="text-xs text-gray-600">{producao.produto_codigo}</p>
                          <p className="text-xs text-gray-600">{new Date(producao.data_producao).toLocaleDateString('pt-BR')}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-gray-600" />
                            <span className="text-xs text-gray-600">{formatarTempo(producao.tempo_total_segundos)}</span>
                          </div>
                        </div>

                        {/* EficiÃ¡Âªncia de Quantidade */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-black">Quantidade</span>
                          </div>
                          <div className={`text-lg font-bold ${getCorEficiencia(producao.eficiencia_quantidade)}`}>
                            {producao.eficiencia_quantidade}%
                          </div>
                          <div className="text-xs text-black">
                            {producao.quantidade_produzida} / {producao.quantidade_esperada}
                          </div>
                          {producao.eficiencia_quantidade >= 95 ? 
                            <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-1" /> :
                            <TrendingDown className="h-4 w-4 text-red-600 mx-auto mt-1" />
                          }
                        </div>

                        {/* Perdas por Peso */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Scale className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-black">Perdas</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-black">Limpeza:</span>
                              <span className="font-bold text-yellow-600">{producao.perda_limpeza_g}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">ProduÃ¡Â§Ã¡Â£o:</span>
                              <span className="font-bold text-orange-600">{producao.perda_producao_g}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">Total:</span>
                              <span className="font-bold text-red-600">{producao.perda_total_g}g</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {((producao.perda_total_g / producao.peso_bruto_g) * 100).toFixed(1)}% do peso bruto
                          </div>
                        </div>

                        {/* VariaÃ¡Â§Ã¡Â£o de Custos */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Calculator className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-black">Custos</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-black">Esperado:</span>
                              <span className="font-bold text-blue-600">R$ {producao.custo_esperado.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">Real:</span>
                              <span className="font-bold text-purple-600">R$ {producao.custo_total_insumos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">VariaÃ¡Â§Ã¡Â£o:</span>
                              <span className={`font-bold ${getCorVariacao(producao.variacao_custo)}`}>
                                R$ {producao.variacao_custo >= 0 ? '+' : ''}{producao.variacao_custo.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {Math.abs(producao.variacao_custo) > 1 && (
                            <AlertTriangle className="h-4 w-4 text-red-600 mx-auto mt-1" />
                          )}
                        </div>
                      </div>

                      {/* Indicadores de Problemas */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {producao.eficiencia_quantidade < 90 && (
                          <Badge variant="destructive" className="text-xs">
                            Å¡Â Ã¯Â¸Â Baixa eficiÃ¡Âªncia quantidade
                          </Badge>
                        )}
                        {Math.abs(producao.variacao_custo) > 2 && (
                          <Badge variant="destructive" className="text-xs">
                            Ã°Å¸â€™Â° Alta variaÃ¡Â§Ã¡Â£o custo
                          </Badge>
                        )}
                        {(producao.perda_total_g / producao.peso_bruto_g) > 0.25 && (
                          <Badge variant="destructive" className="text-xs">
                            Å¡â€“Ã¯Â¸Â Perda excessiva ({((producao.perda_total_g / producao.peso_bruto_g) * 100).toFixed(0)}%)
                          </Badge>
                        )}
                        {producao.rendimento_real < (producao.rendimento_teorico - 10) && (
                          <Badge variant="secondary" className="text-xs">
                            Ã°Å¸â€œâ€° Rendimento abaixo do esperado
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 

