'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Insumo {
  id: number
  codigo: string
  nome: string
  quantidade_necessaria: number
  quantidade_real: number
  unidade_medida: string
  categoria: string
  is_chefe: boolean
}

interface Receita {
  receita_codigo: string
  receita_nome: string
  receita_categoria: string
  rendimento_esperado?: number
  tipo_local: string
  insumos: Insumo[]
}

interface ProducaoAtiva {
  id: string
  receita: Receita
  tipo_local: string
  timerAtivo: boolean
  segundosDecorridos: number
  pesoBruto: string
  pesoLiquido: string
  rendimentoEsperado: string
  rendimentoProduzido: string
  observacoes: string
  insumos: Insumo[]
  insumoChefe?: Insumo
  insumosExpandidos?: boolean
  controlesExpandidos?: boolean
  rendimentoReceita?: number
}

export default function TerminalProducao() {
  const { selectedBar } = useBar()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [receitasFiltradas, setReceitasFiltradas] = useState<Receita[]>([])
  const [tipoLocalSelecionado, setTipoLocalSelecionado] = useState<'bar' | 'cozinha'>('cozinha')
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para busca de receitas
  const [buscaReceita, setBuscaReceita] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  // Múltiplas produções ativas
  const [producoesAtivas, setProducoesAtivas] = useState<ProducaoAtiva[]>([])
  const [producaoAtivaSelecionada, setProducaoAtivaSelecionada] = useState<string | null>(null)

  // Carregar receitas
  useEffect(() => {
    const carregarReceitas = async () => {
      if (!selectedBar?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/receitas?bar_id=${selectedBar.id}`)
        if (response.ok) {
          const data = await response.json()
          setReceitas(data.receitas || [])
          console.log('✅ Receitas carregadas:', data.receitas?.length || 0)
        } else {
          console.error('❌ Erro na API:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    carregarReceitas()
  }, [selectedBar?.id])

  // Filtrar receitas por tipo e busca
  useEffect(() => {
    let receitasFiltradasPorTipo = receitas.filter(receita => 
      receita.tipo_local === tipoLocalSelecionado
    )

    if (!buscaReceita.trim()) {
      setReceitasFiltradas(receitasFiltradasPorTipo)
    } else {
      const filtradas = receitasFiltradasPorTipo.filter(receita => 
        receita.receita_nome.toLowerCase().includes(buscaReceita.toLowerCase()) ||
        receita.receita_codigo.toLowerCase().includes(buscaReceita.toLowerCase())
      )
      setReceitasFiltradas(filtradas)
    }
  }, [buscaReceita, receitas, tipoLocalSelecionado])

  // Timer para todas as produções ativas
  useEffect(() => {
    const interval = setInterval(() => {
      setProducoesAtivas(prev => prev.map(producao => 
        producao.timerAtivo 
          ? { ...producao, segundosDecorridos: producao.segundosDecorridos + 1 }
          : producao
      ))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const alternarInsumosExpandidos = (id: string) => {
    setProducoesAtivas(prev => prev.map(producao => 
      producao.id === id 
        ? { ...producao, insumosExpandidos: !producao.insumosExpandidos }
        : producao
    ))
  }

  const alternarControlesExpandidos = (id: string) => {
    setProducoesAtivas(prev => prev.map(producao => 
      producao.id === id 
        ? { ...producao, controlesExpandidos: !producao.controlesExpandidos }
        : producao
    ))
  }

  const criarNovaProducao = (receita: Receita) => {
    const novaProducao: ProducaoAtiva = {
      id: Date.now().toString(),
      receita,
      tipo_local: receita.tipo_local,
      timerAtivo: false,
      segundosDecorridos: 0,
      pesoBruto: '',
      pesoLiquido: '',
      rendimentoEsperado: receita.rendimento_esperado?.toString() || '',
      rendimentoProduzido: '', // Começa vazio para o funcionário preencher
      observacoes: '',
      insumos: [],
      insumoChefe: undefined,
      insumosExpandidos: true,  // Iniciar expandido
      controlesExpandidos: true // Iniciar expandido
    }

    // Processar insumos e identificar insumo chefe
    if (receita.insumos && receita.insumos.length > 0) {
      const insumoChefe = receita.insumos.find(i => i.is_chefe)
      novaProducao.rendimentoReceita = receita.rendimento_esperado || 0
      
      // CORREÇÃO: Pré-preencher valores reais com valores planejados
      const insumosCalculados = receita.insumos.map(insumo => ({
        id: insumo.id,
        codigo: insumo.codigo,
        nome: insumo.nome,
        quantidade_necessaria: insumo.quantidade_necessaria || 0,
        quantidade_real: insumo.quantidade_necessaria || 0, // PRÉ-PREENCHER com valor planejado
        unidade_medida: insumo.unidade_medida || 'g',
        categoria: insumo.categoria,
        is_chefe: insumo.is_chefe
      }))

      novaProducao.insumos = insumosCalculados
      novaProducao.insumoChefe = insumoChefe
      
      // Se tem insumo chefe, pré-preencher peso líquido
      if (insumoChefe) {
        novaProducao.pesoLiquido = insumoChefe.quantidade_necessaria?.toString() || ''
      }
      
      console.log(`📋 Receita ${receita.receita_codigo}: insumo chefe = ${insumoChefe?.nome}, rendimento esperado = ${novaProducao.rendimentoReceita}`)
    }

    setProducoesAtivas(prev => [...prev, novaProducao])
    setProducaoAtivaSelecionada(novaProducao.id)
    setBuscaReceita('')
    setMostrarDropdown(false)
  }

  const atualizarProducao = (id: string, updates: Partial<ProducaoAtiva>) => {
    setProducoesAtivas(prev => prev.map(producao => 
      producao.id === id ? { ...producao, ...updates } : producao
    ))
  }

  const iniciarTimer = (id: string) => {
    const producao = producoesAtivas.find(p => p.id === id)
    if (!producao || !producao.pesoBruto || parseFloat(producao.pesoBruto) <= 0) {
      alert('⚠️ Preencha o peso bruto antes de iniciar a produção!')
      return
    }
    
    atualizarProducao(id, { 
      timerAtivo: true
    })
  }

  const resetarTimer = (id: string) => {
    atualizarProducao(id, { timerAtivo: false, segundosDecorridos: 0 })
  }

  const removerProducao = (id: string) => {
    setProducoesAtivas(prev => prev.filter(p => p.id !== id))
    if (producaoAtivaSelecionada === id) {
      const restantes = producoesAtivas.filter(p => p.id !== id)
      setProducaoAtivaSelecionada(restantes.length > 0 ? restantes[0].id : null)
    }
  }

  const salvarProducao = async (id: string) => {
    const producao = producoesAtivas.find(p => p.id === id)
    if (!producao) return

    if (!producao.rendimentoProduzido.trim()) {
      alert('⚠️ Rendimento produzido é obrigatório!')
      return
    }

    if (!selectedBar?.id) {
      alert('⚠️ Bar não selecionado!')
      return
    }

    const agora = new Date()
    const pesoBrutoNum = parseFloat(producao.pesoBruto) || 0
    const pesoLiquidoNum = parseFloat(producao.pesoLiquido) || 0
    const rendimentoNum = parseFloat(producao.rendimentoProduzido) || 0

    const dadosProducao = {
      bar_id: selectedBar.id,
      receita_codigo: producao.receita.receita_codigo,
      receita_nome: producao.receita.receita_nome,
      receita_categoria: producao.receita.receita_categoria,
      criado_por_nome: `Terminal ${producao.tipo_local}`,
      inicio_producao: new Date(Date.now() - (producao.segundosDecorridos * 1000)).toISOString(),
      fim_producao: agora.toISOString(),
      peso_bruto_proteina: pesoBrutoNum,
      peso_limpo_proteina: pesoLiquidoNum,
      rendimento_real: rendimentoNum,
      rendimento_esperado: parseFloat(producao.rendimentoEsperado) || 0,
      observacoes: producao.observacoes.trim(),
      insumo_chefe_id: producao.insumoChefe?.id,
      insumo_chefe_nome: producao.insumoChefe?.nome,
      peso_insumo_chefe: pesoLiquidoNum,
      status: 'finalizada'
    }

    try {
      const response = await fetch('/api/producoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosProducao)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert('✅ Produção salva com sucesso!')
        console.log('📊 Dados salvos:', result.data)
        removerProducao(id)
      } else {
        console.error('❌ Erro na API:', result)
        alert('Erro ao salvar produção: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      alert('Erro ao salvar produção: ' + (error as Error).message)
    }
  }

  const handleInputFocus = () => {
    setMostrarDropdown(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => setMostrarDropdown(false), 200)
  }

  const atualizarQuantidadeReal = (producaoId: string, insumoId: number, quantidade: string) => {
    const quantidadeNum = parseFloat(quantidade) || 0
    
    setProducoesAtivas(prev => prev.map(producao => {
      if (producao.id !== producaoId) return producao
      
      // Verificar se é insumo chefe
      const insumo = producao.insumos.find(i => i.id === insumoId)
      if (!insumo) return producao
      
      if (insumo.is_chefe) {
        // Se editou o insumo chefe diretamente, atualizar peso líquido também
        const proporcao = quantidadeNum / insumo.quantidade_necessaria
        
        const insumosAtualizados = producao.insumos.map(ins => 
          ins.is_chefe 
            ? { ...ins, quantidade_real: quantidadeNum }
            : { ...ins, quantidade_real: Math.round(ins.quantidade_necessaria * proporcao * 100) / 100 }
        )
        
        return { 
          ...producao, 
          pesoLiquido: quantidadeNum.toString(), // Sincronizar peso líquido com insumo chefe
          insumos: insumosAtualizados 
        }
      } else {
        // Se editou insumo não-chefe, apenas atualizar aquele insumo
        const insumosAtualizados = producao.insumos.map(ins => 
          ins.id === insumoId 
            ? { ...ins, quantidade_real: quantidadeNum }
            : ins
        )
        
        return { ...producao, insumos: insumosAtualizados }
      }
    }))
  }

  // NOVA FUNÇÃO: Atualizar peso líquido e recalcular todos os insumos + rendimento esperado
  const atualizarPesoLiquido = (id: string, novoPeso: string) => {
    const pesoNum = parseFloat(novoPeso) || 0
    
    setProducoesAtivas(prev => prev.map(producao => {
      if (producao.id !== id) return producao
      
      const insumoChefe = producao.insumoChefe
      if (!insumoChefe || !insumoChefe.quantidade_necessaria) {
        // Sem insumo chefe, apenas atualizar peso líquido
        return { ...producao, pesoLiquido: novoPeso }
      }
      
      // Calcular proporção baseada no insumo chefe
      const proporcao = pesoNum / insumoChefe.quantidade_necessaria
      
      // Recalcular TODOS os insumos baseado na nova proporção
      // CORREÇÃO: Insumo chefe sempre igual ao peso líquido
      const insumosAtualizados = producao.insumos.map(insumo => ({
        ...insumo,
        quantidade_real: insumo.is_chefe 
          ? pesoNum // Insumo chefe = peso líquido
          : Math.round(insumo.quantidade_necessaria * proporcao * 100) / 100
      }))
      
      // NOVA LÓGICA: Calcular rendimento esperado proporcional
      let novoRendimentoEsperado = producao.rendimentoEsperado
      if (producao.rendimentoReceita && producao.rendimentoReceita > 0) {
        const rendimentoCalculado = Math.round(producao.rendimentoReceita * proporcao)
        novoRendimentoEsperado = rendimentoCalculado.toString()
        console.log(`🧮 Peso líquido: ${novoPeso}g | Proporção: ${proporcao.toFixed(3)} | Rendimento esperado: ${rendimentoCalculado}g`)
      }
      
      return {
        ...producao,
        pesoLiquido: novoPeso,
        rendimentoEsperado: novoRendimentoEsperado,
        insumos: insumosAtualizados
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-black font-medium">Carregando receitas...</p>
        </div>
      </div>
    )
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

  const producaoAtual = producoesAtivas.find(p => p.id === producaoAtivaSelecionada)
  const receitasBar = receitas.filter(r => r.tipo_local === 'bar').length
  const receitasCozinha = receitas.filter(r => r.tipo_local === 'cozinha').length

  return (
    <ProtectedRoute requiredModule="terminal_producao">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">🏭 Terminal de Produção</h1>
          <p className="text-gray-700">Sistema multi-receitas com insumo chefe</p>
          <p className="text-gray-600 text-sm">
            Bar: <strong>{selectedBar.nome}</strong> • 
            Bar: {receitasBar} receitas • 
            Cozinha: {receitasCozinha} receitas
          </p>
        </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Coluna Principal */}
        <div className="w-full space-y-6">
          
          {/* Seletor de Tipo e Receita */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">🍽️ Selecionar Receita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Seletor Bar vs Cozinha */}
              <div>
                <Label className="text-black font-semibold">Local de Produção</Label>
                <Tabs value={tipoLocalSelecionado} onValueChange={(value) => setTipoLocalSelecionado(value as 'bar' | 'cozinha')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bar">🍺 Bar ({receitasBar})</TabsTrigger>
                    <TabsTrigger value="cozinha">👨‍🍳 Cozinha ({receitasCozinha})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Busca de Receita */}
              <div className="relative">
                <Input
                  type="text"
                  value={buscaReceita}
                  onChange={(e) => {
                    setBuscaReceita(e.target.value)
                    setMostrarDropdown(true)
                  }}
                  placeholder={`Buscar receita de ${tipoLocalSelecionado}...`}
                  className="text-black font-medium border-2 border-gray-300 placeholder:text-gray-600"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                
                {buscaReceita && (
                  <Button
                    onClick={() => setBuscaReceita('')}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ❌
                  </Button>
                )}
              </div>

              {mostrarDropdown && (
                <div className="mt-2 bg-white rounded-lg border-2 border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                  {receitasFiltradas.length > 0 ? (
                    receitasFiltradas.map((receita) => (
                      <div
                        key={receita.receita_codigo}
                        className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 transition-colors"
                        onClick={() => criarNovaProducao(receita)}
                      >
                        <div className="font-semibold text-black">{receita.receita_codigo} - {receita.receita_nome}</div>
                        <div className="text-sm text-gray-600">
                          {receita.tipo_local === 'bar' ? '🍺' : '👨‍🍳'} {receita.tipo_local} • {receita.insumos?.length || 0} insumos
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      🔍 Nenhuma receita de {tipoLocalSelecionado} encontrada para "{buscaReceita}"
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Abas das Produções Ativas */}
          {producoesAtivas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-black font-semibold">🔄 Produções Ativas ({producoesAtivas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={producaoAtivaSelecionada || ''} onValueChange={setProducaoAtivaSelecionada}>
                  <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {producoesAtivas.map((producao) => (
                      <TabsTrigger 
                        key={producao.id} 
                        value={producao.id}
                        className="text-xs font-medium"
                      >
                        {producao.receita.receita_nome} • {formatarTempo(producao.segundosDecorridos)}
                        {producao.timerAtivo && ' ⏱️'}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {producoesAtivas.map((producao) => (
                    <TabsContent key={producao.id} value={producao.id} className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Coluna 1: Dados da Produção */}
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-900 mb-2">
                              📋 {producao.receita.receita_nome}
                            </h3>
                            <p className="text-sm text-blue-700 mb-2">
                              <strong>Código:</strong> {producao.receita.receita_codigo}
                            </p>
                            <div className="text-sm text-blue-700">
                              <p><strong>Categoria:</strong> {producao.receita.receita_categoria}</p>
                              <p><strong>Local:</strong> {producao.tipo_local === 'bar' ? '🍺 Bar' : '👨‍🍳 Cozinha'}</p>
                              <p><strong>Rendimento Esperado:</strong> {producao.rendimentoReceita ? `${producao.rendimentoReceita}g` : 'Não definido'}</p>
                              <p><strong>Insumos:</strong> {producao.insumos.length}</p>
                              {producao.insumoChefe && (
                                <p><strong>Insumo Chefe:</strong> {producao.insumoChefe.nome}</p>
                              )}
                            </div>
                          </div>

                          {/* Timer e Controles */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-gray-900">⏱️ Timer de Produção</h4>
                              <div className="text-2xl font-mono font-bold text-blue-600">
                                {formatarTempo(producao.segundosDecorridos)}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => iniciarTimer(producao.id)}
                                disabled={producao.timerAtivo || !producao.pesoBruto || parseFloat(producao.pesoBruto) <= 0}
                                className={`${
                                  !producao.pesoBruto || parseFloat(producao.pesoBruto) <= 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                                } text-white`}
                              >
                                ▶️ Iniciar
                              </Button>
                              <Button
                                onClick={() => resetarTimer(producao.id)}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                🔄 Reset
                              </Button>
                              <Button
                                onClick={() => removerProducao(producao.id)}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                🗑️ Remover
                              </Button>
                            </div>
                          </div>

                          {/* Controles de Produção - Com Drill Down */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-gray-900">⚖️ Controles de Produção</h4>
                              <Button
                                onClick={() => alternarControlesExpandidos(producao.id)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-700 hover:bg-gray-100"
                              >
                                {producao.controlesExpandidos ? '🔽 Recolher' : '🔼 Expandir'}
                              </Button>
                            </div>

                            {producao.controlesExpandidos && (
                              <div className="space-y-3">
                                {/* SEMPRE MOSTRAR PESO BRUTO */}
                                <div>
                                  <Label htmlFor={`peso-bruto-${producao.id}`} className="text-black font-semibold">
                                    Peso Bruto (g) *
                                  </Label>
                                  <Input
                                    id={`peso-bruto-${producao.id}`}
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={producao.pesoBruto}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '')
                                      atualizarProducao(producao.id, { pesoBruto: value })
                                    }}
                                    placeholder="Digite o peso bruto..."
                                    className="text-black font-medium border-2 border-red-300"
                                    required
                                  />
                                </div>

                                {/* SÓ MOSTRAR APÓS INICIAR TIMER */}
                                {producao.timerAtivo && (
                                  <>
                                    <div>
                                      <Label htmlFor={`peso-liquido-${producao.id}`} className="text-black font-semibold">
                                        Peso Líquido (g) <span className="text-blue-600 text-xs">(Atualiza insumo chefe automaticamente)</span>
                                      </Label>
                                      <Input
                                        id={`peso-liquido-${producao.id}`}
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={producao.pesoLiquido}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '')
                                          atualizarPesoLiquido(producao.id, value)
                                        }}
                                        placeholder="Digite o peso líquido..."
                                        className="text-black font-medium border-2 border-blue-300"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor={`rendimento-esperado-${producao.id}`} className="text-black font-semibold">
                                        Rendimento Esperado (g)
                                        <span className="text-green-600 text-xs ml-2">(Calculado automaticamente)</span>
                                      </Label>
                                      <Input
                                        id={`rendimento-esperado-${producao.id}`}
                                        type="text"
                                        value={producao.rendimentoEsperado ? `${producao.rendimentoEsperado}g` : 'Não definido'}
                                        readOnly
                                        className="text-black font-medium border-2 border-green-300 bg-green-50 cursor-not-allowed"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor={`rendimento-produzido-${producao.id}`} className="text-black font-semibold">
                                        Rendimento Produzido (g) *
                                        <span className="text-orange-600 text-xs ml-2">(Preencha o resultado real)</span>
                                      </Label>
                                      <Input
                                        id={`rendimento-produzido-${producao.id}`}
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={producao.rendimentoProduzido}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '')
                                          atualizarProducao(producao.id, { rendimentoProduzido: value })
                                        }}
                                        placeholder="Digite o rendimento real obtido..."
                                        className="text-black font-medium border-2 border-orange-300"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor={`obs-${producao.id}`} className="text-black font-semibold">Observações</Label>
                                      <Textarea
                                        id={`obs-${producao.id}`}
                                        value={producao.observacoes}
                                        onChange={(e) => atualizarProducao(producao.id, { observacoes: e.target.value })}
                                        placeholder="Observações sobre a produção..."
                                        className="text-black font-medium resize-none"
                                        rows={3}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Coluna 2: Insumos */}
                        <div className="space-y-4">
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-orange-900">🥘 Insumos da Receita</h4>
                              <Button
                                onClick={() => alternarInsumosExpandidos(producao.id)}
                                variant="ghost"
                                size="sm"
                                className="text-orange-700 hover:bg-orange-100"
                              >
                                {producao.insumosExpandidos ? '🔽 Recolher' : '🔼 Expandir'}
                              </Button>
                            </div>

                            {producao.insumosExpandidos && (
                              <div className="space-y-3">
                                {producao.insumos.map((insumo) => (
                                  <div
                                    key={insumo.id}
                                    className={`p-3 rounded border-2 ${insumo.is_chefe ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-black">
                                          {insumo.codigo} - {insumo.nome}
                                        </span>
                                        {insumo.is_chefe && (
                                          <Badge variant="destructive" className="text-xs">CHEFE</Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Planejado:</span>
                                        <div className="font-medium text-black">
                                          {insumo.quantidade_necessaria} {insumo.unidade_medida}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Real:</span>
                                        <Input
                                          type="number"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          value={insumo.quantidade_real}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '')
                                            atualizarQuantidadeReal(producao.id, insumo.id, value)
                                          }}
                                          placeholder="0"
                                          className="h-8 text-xs text-black font-medium"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Botão Salvar */}
                          <Button
                            onClick={() => salvarProducao(producao.id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                            disabled={!producao.rendimentoProduzido.trim()}
                          >
                            💾 Salvar Produção
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {producoesAtivas.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium">🍽️ Nenhuma produção ativa</p>
                  <p className="text-sm">Selecione uma receita acima para começar</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
} 