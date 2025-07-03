'use client'

import { useState, useEffect, useRef } from 'react'
import { useBar } from '@/contexts/BarContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Play,
  Pause,
  Square,
  Clock,
  Scale,
  ChefHat,
  Timer,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

// Interfaces
interface Produto {
  prd_desc: string
  grp_desc: string
  tempo_medio: number
  popularidade: number
  total_vendas: number
}

interface ProducaoSimples {
  produto_nome: string
  funcionario: string
  tempo_producao: number
  meta_tempo: number
  data_producao: string
  iniciado_em: string
  finalizado_em: string
}

interface ProducaoReceitas {
  produto_codigo: string
  produto_nome: string
  funcionario: string
  peso_bruto_g: number
  peso_limpo_g: number
  peso_final_g: number
  quantidade_produzida: number
  tempo_total_segundos: number
  observacoes: string
  data_producao: string
  timestamp_iniciado: string
  timestamp_finalizado: string
}

export default function ProducaoPage() {
  const { selectedBar } = useBar()
  const [modoAtual, setModoAtual] = useState<'simples' | 'receitas'>('simples')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [funcionario, setFuncionario] = useState('')
  
  // Estados do timer
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [iniciadoEm, setIniciadoEm] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Estados do modo receitas
  const [pesoBruto, setPesoBruto] = useState('')
  const [pesoLimpo, setPesoLimpo] = useState('')
  const [pesoFinal, setPesoFinal] = useState('')
  const [quantidadeProduzida, setQuantidadeProduzida] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Estados de resultado
  const [ultimaProducao, setUltimaProducao] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Carregar produtos ao montar o componente
  useEffect(() => {
    if (selectedBar) {
      carregarProdutos()
    }
  }, [selectedBar])

  // Gerenciar timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTempoDecorrido(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused])

  const carregarProdutos = async () => {
    try {
      const response = await fetch(`/api/terminal/produtos?bar_id=${selectedBar?.id}`)
      const data = await response.json()
      
      if (data.success) {
        setProdutos(data.produtos)
        console.log(`✅ ${data.produtos.length} produtos carregados`)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
    }
  }

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const iniciarTimer = () => {
    if (modoAtual === 'receitas' && !pesoBruto) {
      alert('Digite o peso bruto antes de iniciar!')
      return
    }

    setIsRunning(true)
    setIsPaused(false)
    setIniciadoEm(new Date())
    setTempoDecorrido(0)
    console.log('⏱️ Timer iniciado')
  }

  const pausarTimer = () => {
    setIsPaused(!isPaused)
    console.log(isPaused ? '▶️ Timer retomado' : '⏸️ Timer pausado')
  }

  const pararTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    console.log('⏹️ Timer parado')
  }

  const resetarTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTempoDecorrido(0)
    setIniciadoEm(null)
    console.log('🔄 Timer resetado')
  }

  const finalizarProducao = async () => {
    if (!produtoSelecionado || !funcionario.trim()) {
      alert('Selecione um produto e digite o nome do funcionário')
      return
    }

    if (modoAtual === 'receitas' && (!pesoLimpo || !pesoFinal)) {
      alert('Preencha peso limpo e peso final para finalizar')
      return
    }

    setLoading(true)

    try {
      const agora = new Date()
      const dataProducao = agora.toISOString().split('T')[0]

      if (modoAtual === 'simples') {
        // Salvar produção simples
        const dadosSimples: ProducaoSimples = {
          produto_nome: produtoSelecionado.prd_desc,
          funcionario: funcionario.trim(),
          tempo_producao: tempoDecorrido,
          meta_tempo: produtoSelecionado.tempo_medio || 300,
          data_producao: dataProducao,
          iniciado_em: iniciadoEm?.toISOString() || agora.toISOString(),
          finalizado_em: agora.toISOString()
        }

        const response = await fetch('/api/terminal/producao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bar_id: selectedBar?.id,
            produto_grupo: produtoSelecionado.grp_desc,
            produto_tipo: 'indefinido',
            ...dadosSimples
          })
        })

        const result = await response.json()
        if (result.success) {
          setUltimaProducao(result)
          console.log('✅ Produção simples salva:', result)
        } else {
          throw new Error(result.error)
        }

      } else {
        // Salvar produção com receitas
        const dadosReceitas: ProducaoReceitas = {
          produto_codigo: produtoSelecionado.prd_desc.substring(0, 20),
          produto_nome: produtoSelecionado.prd_desc,
          funcionario: funcionario.trim(),
          peso_bruto_g: parseFloat(pesoBruto),
          peso_limpo_g: parseFloat(pesoLimpo),
          peso_final_g: parseFloat(pesoFinal),
          quantidade_produzida: parseInt(quantidadeProduzida) || 1,
          tempo_total_segundos: tempoDecorrido,
          observacoes: observacoes.trim(),
          data_producao: dataProducao,
          timestamp_iniciado: iniciadoEm?.toISOString() || agora.toISOString(),
          timestamp_finalizado: agora.toISOString()
        }

        // Calcular perdas
        const perdaLimpeza = parseFloat(pesoBruto) - parseFloat(pesoLimpo)
        const perdaProducao = parseFloat(pesoLimpo) - parseFloat(pesoFinal)
        const perdaTotal = perdaLimpeza + perdaProducao

        const response = await fetch('/api/receitas/producao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bar_id: selectedBar?.id,
            perda_limpeza_g: perdaLimpeza,
            perda_producao_g: perdaProducao,
            perda_total_g: perdaTotal,
            ...dadosReceitas
          })
        })

        const result = await response.json()
        if (result.success) {
          setUltimaProducao(result)
          console.log('✅ Produção com receitas salva:', result)
        } else {
          throw new Error(result.error)
        }
      }

      // Resetar formulário
      resetarProducao()

    } catch (error) {
      console.error('❌ Erro ao salvar produção:', error)
      alert('Erro ao salvar produção: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const resetarProducao = () => {
    resetarTimer()
    setProdutoSelecionado(null)
    setFuncionario('')
    setPesoBruto('')
    setPesoLimpo('')
    setPesoFinal('')
    setQuantidadeProduzida('')
    setObservacoes('')
  }

  const getStatusPerformance = (tempo: number, meta: number) => {
    if (!meta || meta === 0) return { cor: 'bg-gray-100 text-gray-800', texto: 'Sem Meta' }
    
    const percentual = (tempo / meta) * 100
    
    if (percentual <= 80) return { cor: 'bg-green-100 text-green-800', texto: 'Excelente' }
    if (percentual <= 100) return { cor: 'bg-blue-100 text-blue-800', texto: 'Bom' }
    if (percentual <= 150) return { cor: 'bg-yellow-100 text-yellow-800', texto: 'Atenção' }
    return { cor: 'bg-red-100 text-red-800', texto: 'Crítico' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Terminal de Produção
        </h1>
        <p className="text-gray-600">
          Registre tempos de produção, pesos e insumos em tempo real
        </p>
      </div>

      {/* Seleção de Modo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Modo de Operação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={modoAtual} onValueChange={(value) => setModoAtual(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simples" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Modo Simples
              </TabsTrigger>
              <TabsTrigger value="receitas" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Modo Receitas
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {modoAtual === 'simples' 
                ? '⏱️ Registra apenas tempo de produção e performance'
                : '⚖️ Registra pesos, insumos, custos e cálculos completos'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Seleção e Dados */}
        <div className="space-y-6">
          {/* Seleção de Produto */}
          <Card>
            <CardHeader>
              <CardTitle>Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="produto">Selecionar Produto</Label>
                <Select 
                  value={produtoSelecionado?.prd_desc || ''} 
                  onValueChange={(value) => {
                    const produto = produtos.find(p => p.prd_desc === value)
                    setProdutoSelecionado(produto || null)
                  }}
                >
                  <SelectTrigger className="text-black font-medium">
                    <SelectValue placeholder="Escolha um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto, index) => (
                      <SelectItem key={index} value={produto.prd_desc}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{produto.prd_desc}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {produto.grp_desc} • {formatarTempo(produto.tempo_medio)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {produtoSelecionado && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Grupo:</span>
                      <p className="font-medium text-black">{produtoSelecionado.grp_desc}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Tempo Médio:</span>
                      <p className="font-medium text-black">{formatarTempo(produtoSelecionado.tempo_medio)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="funcionario">Funcionário</Label>
                <Input
                  id="funcionario"
                  value={funcionario}
                  onChange={(e) => setFuncionario(e.target.value)}
                  placeholder="Nome do funcionário"
                  className="text-black font-medium"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados de Peso (Modo Receitas) */}
          {modoAtual === 'receitas' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Controle de Peso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="peso-bruto">Peso Bruto (g)</Label>
                    <Input
                      id="peso-bruto"
                      type="number"
                      value={pesoBruto}
                      onChange={(e) => setPesoBruto(e.target.value)}
                      placeholder="1000"
                      className="text-black font-medium"
                    />
                    <p className="text-xs text-gray-500 mt-1">Peso inicial</p>
                  </div>
                  <div>
                    <Label htmlFor="peso-limpo">Peso Limpo (g)</Label>
                    <Input
                      id="peso-limpo"
                      type="number"
                      value={pesoLimpo}
                      onChange={(e) => setPesoLimpo(e.target.value)}
                      placeholder="850"
                      className="text-black font-medium"
                    />
                    <p className="text-xs text-gray-500 mt-1">Após limpeza</p>
                  </div>
                  <div>
                    <Label htmlFor="peso-final">Peso Final (g)</Label>
                    <Input
                      id="peso-final"
                      type="number"
                      value={pesoFinal}
                      onChange={(e) => setPesoFinal(e.target.value)}
                      placeholder="750"
                      className="text-black font-medium"
                    />
                    <p className="text-xs text-gray-500 mt-1">Produto final</p>
                  </div>
                </div>

                {pesoBruto && pesoLimpo && pesoFinal && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Perda Limpeza</p>
                      <p className="font-bold text-blue-800">
                        {(parseFloat(pesoBruto) - parseFloat(pesoLimpo)).toFixed(0)}g
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Perda Produção</p>
                      <p className="font-bold text-blue-800">
                        {(parseFloat(pesoLimpo) - parseFloat(pesoFinal)).toFixed(0)}g
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Rendimento</p>
                      <p className="font-bold text-blue-800">
                        {((parseFloat(pesoFinal) / parseFloat(pesoBruto)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantidade">Quantidade Produzida</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={quantidadeProduzida}
                      onChange={(e) => setQuantidadeProduzida(e.target.value)}
                      placeholder="4"
                      className="text-black font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações sobre a produção..."
                      className="text-black font-medium min-h-[60px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 2: Timer e Controles */}
        <div className="space-y-6">
          {/* Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Cronômetro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display do Tempo */}
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-gray-900 mb-2">
                  {formatarTempo(tempoDecorrido)}
                </div>
                {produtoSelecionado && produtoSelecionado.tempo_medio > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">Meta:</span>
                    <span className="text-sm font-medium text-black">
                      {formatarTempo(produtoSelecionado.tempo_medio)}
                    </span>
                    {tempoDecorrido > 0 && (
                      <Badge className={getStatusPerformance(tempoDecorrido, produtoSelecionado.tempo_medio).cor}>
                        {getStatusPerformance(tempoDecorrido, produtoSelecionado.tempo_medio).texto}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Controles do Timer */}
              <div className="flex justify-center gap-2">
                {!isRunning ? (
                  <Button 
                    onClick={iniciarTimer}
                    disabled={!produtoSelecionado || !funcionario.trim()}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={pausarTimer}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      {isPaused ? 'Retomar' : 'Pausar'}
                    </Button>
                    <Button 
                      onClick={pararTimer}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Parar
                    </Button>
                  </>
                )}
                
                <Button 
                  onClick={resetarTimer}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              {/* Status */}
              <div className="text-center space-y-2">
                {isRunning && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {isPaused ? '⏸️ Pausado' : '▶️ Em Andamento'}
                  </Badge>
                )}
                
                {iniciadoEm && (
                  <p className="text-xs text-gray-500">
                    Iniciado às {iniciadoEm.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Finalizar Produção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={finalizarProducao}
                disabled={!produtoSelecionado || !funcionario.trim() || loading}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Finalizar e Salvar'}
              </Button>

              <Button 
                onClick={resetarProducao}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Nova Produção
              </Button>
            </CardContent>
          </Card>

          {/* Resultado da Última Produção */}
          {ultimaProducao && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Produção Registrada!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-green-700">
                    <strong>Produto:</strong> {ultimaProducao.data?.produto_nome}
                  </p>
                  <p className="text-green-700">
                    <strong>Tempo:</strong> {formatarTempo(ultimaProducao.data?.tempo_producao_segundos || ultimaProducao.data?.tempo_total_segundos)}
                  </p>
                  {ultimaProducao.performance && (
                    <p className="text-green-700">
                      <strong>Performance:</strong> {ultimaProducao.performance.percentual.toFixed(1)}% - {ultimaProducao.data?.status_performance}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 