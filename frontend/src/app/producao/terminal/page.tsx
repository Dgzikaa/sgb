'use client'

import { useState, useEffect, useRef } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
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

interface InsumoExpandido extends Insumo {
  quantidade_calculada?: number
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
  insumos: InsumoExpandido[]
  insumoChefe?: Insumo
  insumosExpandidos?: boolean
  controlesExpandidos?: boolean
  rendimentoReceita?: number
}

export default function TerminalProducao() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const intervalRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [receitasFiltradas, setReceitasFiltradas] = useState<Receita[]>([])
  const [tipoLocalSelecionado, setTipoLocalSelecionado] = useState<'bar' | 'cozinha'>('cozinha')
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para busca de receitas
  const [buscaReceita, setBuscaReceita] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  // M·∫ltiplas produ·ß·µes ativas
  const [producoesAtivas, setProducoesAtivas] = useState<ProducaoAtiva[]>([])
  const [producaoAtivaSelecionada, setProducaoAtivaSelecionada] = useState<string | null>(null)

  // Estados para adicionar insumos
  const [insumosDisponiveis, setInsumosDisponiveis] = useState<Insumo[]>([])
  const [adicionandoInsumo, setAdicionandoInsumo] = useState<{[key: string]: boolean}>({})
  const [buscaInsumo, setBuscaInsumo] = useState<{[key: string]: string}>({})
  const [mostrarDropdownInsumo, setMostrarDropdownInsumo] = useState<{[key: string]: boolean}>({})

  // Carregar insumos dispon·≠veis
  const carregarInsumos = async () => {
    try {
      const response = await fetch('/api/receitas/insumos?ativo=true')
      if (response.ok) {
        const data = await response.json()
        const insumos = data.data || []
        setInsumosDisponiveis(insumos)
      }
    } catch (error) {
      // Error silently handled
    }
  }

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
        }
      } catch (error) {
        // Error silently handled
      } finally {
        setIsLoading(false)
      }
    }

    carregarReceitas()
    carregarInsumos()
  }, [selectedBar?.id])

  // Filtrar receitas por tipo e busca
  useEffect(() => {
    let receitasFiltradasPorTipo = receitas.filter((receita) => 
      receita.tipo_local === tipoLocalSelecionado
    )

    if (!buscaReceita.trim()) {
      setReceitasFiltradas(receitasFiltradasPorTipo)
    } else {
      const filtradas = receitasFiltradasPorTipo.filter((receita) => 
        receita.receita_nome.toLowerCase().includes(buscaReceita.toLowerCase()) ||
        receita.receita_codigo.toLowerCase().includes(buscaReceita.toLowerCase())
      )
      setReceitasFiltradas(filtradas)
    }
    
    // Ordenar por nome da receita em ordem alfab·©tica
    setReceitasFiltradas(prev => [...prev].sort((a, b) => 
      a.receita_nome.localeCompare(b.receita_nome)
    ))
  }, [buscaReceita, receitas, tipoLocalSelecionado])

  // Timer para todas as produ·ß·µes ativas
  useEffect(() => {
    const interval = setInterval(() => {
      setProducoesAtivas(prev => prev.map((producao) => 
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
    setProducoesAtivas(prev => prev.map((producao) => 
      producao.id === id 
        ? { ...producao, insumosExpandidos: !producao.insumosExpandidos }
        : producao
    ))
  }

  const alternarControlesExpandidos = (id: string) => {
    setProducoesAtivas(prev => prev.map((producao) => 
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
      rendimentoProduzido: '', // Come·ßa vazio para o funcion·°rio preencher
      observacoes: '',
      insumos: [],
      insumoChefe: undefined,
      insumosExpandidos: true,  // Iniciar expandido
      controlesExpandidos: true // Iniciar expandido
    }

    // Processar insumos e identificar insumo chefe
    if (receita.insumos && receita.insumos.length > 0) {
      const insumoChefe = receita.insumos.find((i) => i.is_chefe)
      novaProducao.rendimentoReceita = receita.rendimento_esperado || 0
      
      // Inicializar insumos com quantidades corretas
      const insumosCalculados = receita.insumos.map((insumo) => ({
        id: insumo.id,
        codigo: insumo.codigo,
        nome: insumo.nome,
        quantidade_necessaria: insumo.quantidade_necessaria || 0,
        quantidade_calculada: insumo.quantidade_necessaria || 0, // Iniciar igual ao planejado
        quantidade_real: insumo.quantidade_necessaria || 0, // Iniciar igual ao planejado
        unidade_medida: insumo.unidade_medida || 'g',
        categoria: insumo.categoria,
        is_chefe: insumo.is_chefe
      }))

      novaProducao.insumos = insumosCalculados
      novaProducao.insumoChefe = insumoChefe
      
      // Se tem insumo chefe, pr·©-preencher peso l·≠quido
      if (insumoChefe) {
        novaProducao.pesoLiquido = insumoChefe.quantidade_necessaria?.toString() || ''
      }
      
      console.log(`üìã Receita ${receita.receita_codigo}: insumo chefe = ${insumoChefe?.nome}, rendimento esperado = ${novaProducao.rendimentoReceita}`)
    }

    setProducoesAtivas(prev => [...prev, novaProducao])
    setProducaoAtivaSelecionada(novaProducao.id)
    setBuscaReceita('')
    setMostrarDropdown(false)
  }

  const atualizarProducao = (id: string, updates: Partial<ProducaoAtiva>) => {
    setProducoesAtivas(prev => prev.map((producao) => 
      producao.id === id ? { ...producao, ...updates } : producao
    ))
  }

  const iniciarTimer = (id: string) => {
    const producao = producoesAtivas.find((p) => p.id === id)
    if (!producao || !producao.pesoBruto || parseFloat(producao.pesoBruto) <= 0) {
      alert('ö†Ô∏è Preencha o peso bruto antes de iniciar a produ·ß·£o!')
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
    setProducoesAtivas(prev => prev.filter((p) => p.id !== id))
    if (producaoAtivaSelecionada === id) {
      const restantes = producoesAtivas.filter((p) => p.id !== id)
      setProducaoAtivaSelecionada(restantes.length > 0 ? restantes[0].id : null)
    }
  }

  const salvarProducao = async (id: string) => {
    const producao = producoesAtivas.find((p) => p.id === id)
    if (!producao) return

    if (!producao.rendimentoProduzido.trim()) {
      alert('ö†Ô∏è Rendimento produzido ·© obrigat·≥rio!')
      return
    }

    if (!selectedBar?.id) {
      alert('ö†Ô∏è Bar n·£o selecionado!')
      return
    }

    const agora = new Date()
    const pesoBrutoNum = parseFloat(producao.pesoBruto) || 0
    const pesoLiquidoNum = parseFloat(producao.pesoLiquido) || 0
    const rendimentoNum = parseFloat(producao.rendimentoProduzido) || 0

    // Preparar dados dos insumos para an·°lise de ader·™ncia
    const dadosInsumos = producao.insumos.map((insumo) => ({
      id: insumo.id,
      codigo: insumo.codigo,
      nome: insumo.nome,
      quantidade_necessaria: insumo.quantidade_necessaria,
      quantidade_calculada: insumo.quantidade_calculada || insumo.quantidade_necessaria,
      quantidade_real: insumo.quantidade_real,
      unidade_medida: insumo.unidade_medida,
      categoria: insumo.categoria,
      is_chefe: insumo.is_chefe
    }))

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
      status: 'finalizada',
      // NOVO: Dados dos insumos para an·°lise de ader·™ncia
      insumos: dadosInsumos
    }

    console.log('üíæ Dados da produ·ß·£o sendo enviados:', {
      ...dadosProducao,
      insumos: `${dadosInsumos.length} insumos`
    })

    try {
      const response = await fetch('/api/producoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosProducao)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const aderencia = result.data.percentual_aderencia_receita
        let mensagem = 'úÖ Produ·ß·£o salva com sucesso!'
        
        if (aderencia !== undefined) {
          mensagem += `\n\nüìä Ader·™ncia ·† receita: ${aderencia.toFixed(1)}%`
          
          if (aderencia >= 95) {
            mensagem += '\nüèÜ Excelente! Receita seguida perfeitamente.'
          } else if (aderencia >= 85) {
            mensagem += '\nüëç Bom! Pequenos ajustes na receita.'
          } else if (aderencia >= 75) {
            mensagem += '\nö†Ô∏è Regular. Considere revisar as quantidades.'
          } else {
            mensagem += '\nüî¥ Aten·ß·£o! Grandes desvios da receita detectados.'
          }
        }
        
        if (result.data.insumos_salvos > 0) {
          mensagem += `\nüìã ${result.data.insumos_salvos} insumos salvos para an·°lise.`
        }
        
        alert(mensagem)
        console.log('üìä Dados salvos:', result.data)
        removerProducao(id)
      } else {
        console.error('ùå Erro na API:', result)
        alert('Erro ao salvar produ·ß·£o: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('ùå Erro na requisi·ß·£o:', error)
      alert('Erro ao salvar produ·ß·£o: ' + (error as Error).message)
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
    
    setProducoesAtivas(prev => prev.map((producao) => {
      if (producao.id !== producaoId) return producao
      
      // Verificar se ·© insumo chefe
      const insumo = producao.insumos.find((i) => i.id === insumoId)
      if (!insumo) return producao
      
      if (insumo.is_chefe) {
        // Se editou o insumo chefe diretamente, atualizar peso l·≠quido tamb·©m
        const proporcao = quantidadeNum / insumo.quantidade_necessaria
        
        const insumosAtualizados = producao.insumos.map((ins) => 
          ins.is_chefe 
            ? { ...ins, quantidade_real: quantidadeNum }
            : { ...ins, quantidade_real: Math.round(ins.quantidade_necessaria * proporcao * 100) / 100 }
        )
        
        return { 
          ...producao, 
          pesoLiquido: quantidadeNum.toString(), // Sincronizar peso l·≠quido com insumo chefe
          insumos: insumosAtualizados 
        }
      } else {
        // Se editou insumo n·£o-chefe, apenas atualizar aquele insumo
        const insumosAtualizados = producao.insumos.map((ins) => 
          ins.id === insumoId 
            ? { ...ins, quantidade_real: quantidadeNum }
            : ins
        )
        
        return { ...producao, insumos: insumosAtualizados }
      }
    }))
  }

  // NOVA FUN·á·ÉO: Atualizar peso l·≠quido e recalcular quantidades calculadas
  const atualizarPesoLiquido = (id: string, novoPeso: string) => {
    const pesoNum = parseFloat(novoPeso) || 0
    
    setProducoesAtivas(prev => prev.map((producao) => {
      if (producao.id !== id) return producao
      
      const insumoChefe = producao.insumoChefe
      if (!insumoChefe || !insumoChefe.quantidade_necessaria) {
        // Sem insumo chefe, apenas atualizar peso l·≠quido
        return { ...producao, pesoLiquido: novoPeso }
      }
      
      // Calcular propor·ß·£o baseada no insumo chefe
      const proporcao = pesoNum / insumoChefe.quantidade_necessaria
      
      // Recalcular quantidades calculadas baseado na nova propor·ß·£o
      const insumosAtualizados = producao.insumos.map((insumo) => ({
        ...insumo,
        quantidade_calculada: insumo.is_chefe 
          ? pesoNum // Insumo chefe = peso l·≠quido
          : Math.round(insumo.quantidade_necessaria * proporcao * 100) / 100
      }))
      
      // Calcular rendimento esperado proporcional
      let novoRendimentoEsperado = producao.rendimentoEsperado
      if (producao.rendimentoReceita && producao.rendimentoReceita > 0) {
        const rendimentoCalculado = Math.round(producao.rendimentoReceita * proporcao)
        novoRendimentoEsperado = rendimentoCalculado.toString()
        console.log(`üßÆ Peso l·≠quido: ${novoPeso}g | Propor·ß·£o: ${proporcao.toFixed(3)} | Rendimento esperado: ${rendimentoCalculado}g`)
      }
      
      return {
        ...producao,
        pesoLiquido: novoPeso,
        rendimentoEsperado: novoRendimentoEsperado,
        insumos: insumosAtualizados
      }
    }))
  }

  // NOVA FUN·á·ÉO: Atualizar apenas a quantidade real digitada pelo cozinheiro
  const atualizarQuantidadeRealManual = (producaoId: string, insumoId: number, quantidade: string) => {
    const quantidadeNum = parseFloat(quantidade) || 0
    
    setProducoesAtivas(prev => prev.map((producao) => {
      if (producao.id !== producaoId) return producao
      
      const insumosAtualizados = producao.insumos.map((ins) => 
        ins.id === insumoId 
          ? { ...ins, quantidade_real: quantidadeNum }
          : ins
      )
      
      return { ...producao, insumos: insumosAtualizados }
    }))
  }

  // NOVA FUN·á·ÉO: Atualizar quantidade planejada de insumo adicionado manualmente
  const atualizarQuantidadePlanejada = (producaoId: string, insumoId: number, quantidade: number) => {
    setProducoesAtivas(prev => prev.map((producao) => {
      if (producao.id !== producaoId) return producao
      
      const insumosAtualizados = producao.insumos.map((ins) => 
        ins.id === insumoId 
          ? { 
              ...ins, 
              quantidade_necessaria: quantidade,
              quantidade_calculada: quantidade // Inicialmente igual ao planejado
            }
          : ins
      )
      
      return { ...producao, insumos: insumosAtualizados }
    }))
  }

  // Fun·ß·£o para recalcular todas as quantidades quando peso l·≠quido muda
  const recalcularTodasQuantidades = (producaoId: string) => {
    const producao = producoesAtivas.find((p) => p.id === producaoId)
    if (!producao) return

    const pesoLiquido = parseFloat(producao.pesoLiquido) || 0
    const insumoChefe = producao.insumoChefe
    
    if (insumoChefe && insumoChefe.quantidade_necessaria && pesoLiquido > 0) {
      const proporcao = pesoLiquido / insumoChefe.quantidade_necessaria
      
      setProducoesAtivas(prev => prev.map((p) => {
        if (p.id !== producaoId) return p
        
        const insumosRecalculados = p.insumos.map((insumo) => ({
          ...insumo,
          quantidade_calculada: insumo.is_chefe 
            ? pesoLiquido
            : Math.round(insumo.quantidade_necessaria * proporcao * 100) / 100
        }))
        
        return { ...p, insumos: insumosRecalculados }
      }))
    }
  }

  // Fun·ß·£o para adicionar insumo ·† produ·ß·£o
  const adicionarInsumoProducao = (producaoId: string, insumo: Insumo) => {
    setProducoesAtivas(prev => prev.map((producao) => {
      if (producao.id !== producaoId) return producao
      
      // Verificar se insumo j·° existe
      const jaExiste = producao.insumos.some(i => i.id === insumo.id)
      if (jaExiste) {
        alert('ö†Ô∏è Este insumo j·° est·° na receita!')
        return producao
      }
      
      // Criar novo insumo para a produ·ß·£o
      const novoInsumo: InsumoExpandido = {
        id: insumo.id,
        codigo: insumo.codigo,
        nome: insumo.nome,
        quantidade_necessaria: 0, // Ser·° preenchido pelo usu·°rio
        quantidade_calculada: 0, // Iniciar zerado
        quantidade_real: 0,
        unidade_medida: insumo.unidade_medida || 'g',
        categoria: insumo.categoria || 'cozinha',
        is_chefe: false
      }
      
      return {
        ...producao,
        insumos: [...producao.insumos, novoInsumo]
      }
    }))
    
    // Limpar busca e fechar dropdown
    setBuscaInsumo(prev => ({ ...prev, [producaoId]: '' }))
    setMostrarDropdownInsumo(prev => ({ ...prev, [producaoId]: false }))
    setAdicionandoInsumo(prev => ({ ...prev, [producaoId]: false }))
  }

  // Fun·ß·£o para remover insumo da produ·ß·£o
  const removerInsumoProducao = (producaoId: string, insumoId: number) => {
    setProducoesAtivas(prev => prev.map((producao) => {
      if (producao.id !== producaoId) return producao
      
      // N·£o permitir remover insumo chefe
      const insumo = producao.insumos.find((i) => i.id === insumoId)
      if (insumo?.is_chefe) {
        alert('ö†Ô∏è N·£o ·© poss·≠vel remover o insumo chefe!')
        return producao
      }
      
      return {
        ...producao,
        insumos: producao.insumos.filter((i) => i.id !== insumoId)
      }
    }))
  }

  // Fun·ß·£o para filtrar insumos dispon·≠veis
  const filtrarInsumosDisponiveis = (producaoId: string) => {
    const busca = buscaInsumo[producaoId] || ''
    const producao = producoesAtivas.find((p) => p.id === producaoId)
    
    if (!producao) {
      console.log('ùå Produ·ß·£o n·£o encontrada:', producaoId)
      return []
    }
    
    // Filtrar insumos que ainda n·£o est·£o na produ·ß·£o
    const insumosNaoUsados = insumosDisponiveis.filter((insumo) => 
      !producao.insumos.some(i => i.id === insumo.id)
    )
    
    console.log(`üîç Busca: "${busca}" | Insumos dispon·≠veis: ${insumosDisponiveis.length} | N·£o usados: ${insumosNaoUsados.length}`)
    
    if (!busca) {
      const resultado = insumosNaoUsados.slice(0, 10)
      console.log('üìã Retornando primeiros 10:', resultado.map((i) => i.nome))
      return resultado
    }
    
    const filtrados = insumosNaoUsados.filter((insumo) => 
      insumo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(busca.toLowerCase())
    )
    
    console.log(`üîç Busca "${busca}" retornou ${filtrados.length} insumos:`, filtrados.map((i) => i.nome))
    return filtrados
  }

  useEffect(() => {
    setPageTitle('üè≠ Terminal de Produ·ß·£o')
    return () => setPageTitle('')
  }, [setPageTitle])

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
          <p className="text-red-600 font-medium">ö†Ô∏è Selecione um bar primeiro</p>
        </div>
      </div>
    )
  }

  const producaoAtual = producoesAtivas.find((p) => p.id === producaoAtivaSelecionada)
  const receitasBar = receitas.filter((r) => r.tipo_local === 'bar').length
  const receitasCozinha = receitas.filter((r) => r.tipo_local === 'cozinha').length

  return (
    <ProtectedRoute requiredModule="terminal_producao">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
          
            {/* Seletor de Tipo e Receita */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">üè≠ Terminal de Produ·ß·£o</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Seletor Bar vs Cozinha */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Local de Produ·ß·£o</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={tipoLocalSelecionado === 'cozinha' ? 'default' : 'outline'}
                      onClick={() => setTipoLocalSelecionado('cozinha')}
                      className="flex items-center justify-center gap-2 h-12 text-sm sm:text-base touch-manipulation"
                    >
                      üë®Äçüç≥ Cozinha ({receitasCozinha})
                    </Button>
                    <Button
                      variant={tipoLocalSelecionado === 'bar' ? 'default' : 'outline'}
                      onClick={() => setTipoLocalSelecionado('bar')}
                      className="flex items-center justify-center gap-2 h-12 text-sm sm:text-base touch-manipulation"
                    >
                      üç∫ Bar ({receitasBar})
                    </Button>
                  </div>
                </div>

                {/* Busca de Receita */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Buscar Receita</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={buscaReceita}
                      onChange={(e) => {
                        setBuscaReceita(e.target.value)
                        setMostrarDropdown(true)
                      }}
                      placeholder={`Buscar receita de ${tipoLocalSelecionado}...`}
                      className="h-12 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                    
                    {buscaReceita && (
                      <Button
                        onClick={() => setBuscaReceita('')}
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 h-8 w-8"
                      >
                        ·ó
                      </Button>
                    )}
                  </div>
                </div>

                {mostrarDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-y-auto">
                    {receitasFiltradas.length > 0 ? (
                      receitasFiltradas.map((receita) => (
                        <div
                          key={receita.receita_codigo}
                          className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors touch-manipulation"
                          onClick={() => criarNovaProducao(receita)}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">{receita.receita_nome}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {receita.tipo_local === 'bar' ? 'üç∫' : 'üë®Äçüç≥'} {receita.tipo_local} Ä¢ {receita.insumos?.length || 0} insumos
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        üîç Nenhuma receita de {tipoLocalSelecionado} encontrada para "{buscaReceita}"
                      </div>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>

            {/* Abas das Produ·ß·µes Ativas */}
            {producoesAtivas.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">üîÑ Produ·ß·µes Ativas ({producoesAtivas.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={producaoAtivaSelecionada || ''} onValueChange={setProducaoAtivaSelecionada}>
                    <TabsList className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2 h-auto bg-gray-100 dark:bg-gray-700">
                      {producoesAtivas.map((producao) => (
                        <TabsTrigger 
                          key={producao.id} 
                          value={producao.id}
                          className="text-xs sm:text-sm font-medium h-auto p-3 text-left justify-start data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white touch-manipulation"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{producao.receita.receita_nome}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatarTempo(producao.segundosDecorridos)} {producao.timerAtivo && 'è±Ô∏è'}
                            </span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                  {producoesAtivas.map((producao) => (
                    <TabsContent key={producao.id} value={producao.id} className="mt-6">
                        <div className="flex flex-col space-y-6">
                          
                          {/* Dados da Produ·ß·£o */}
                          <div className="space-y-6">
                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <CardHeader>
                                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  üìã {producao.receita.receita_nome}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">C·≥digo:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{producao.receita.receita_codigo}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{producao.receita.receita_categoria}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Local:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                      {producao.tipo_local === 'bar' ? 'üç∫ Bar' : 'üë®Äçüç≥ Cozinha'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Meta:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                      {producao.rendimentoReceita ? `${producao.rendimentoReceita}g` : 'N·£o definido'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Insumos:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{producao.insumos.length}</span>
                                  </div>
                                  {producao.insumoChefe && (
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Chefe:</span>
                                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{producao.insumoChefe.nome}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Timer e Controles */}
                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    è±Ô∏è Timer de Produ·ß·£o
                                  </CardTitle>
                                  <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {formatarTempo(producao.segundosDecorridos)}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <Button
                                    onClick={() => iniciarTimer(producao.id)}
                                    disabled={producao.timerAtivo || !producao.pesoBruto || parseFloat(producao.pesoBruto) <= 0}
                                    className={`flex-1 h-12 text-base touch-manipulation ${
                                      !producao.pesoBruto || parseFloat(producao.pesoBruto) <= 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                    } text-white`}
                                  >
                                    ñ∂Ô∏è Iniciar
                                  </Button>
                                  <Button
                                    onClick={() => resetarTimer(producao.id)}
                                    variant="outline"
                                    className="flex-1 h-12 text-base border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
                                  >
                                    üîÑ Reset
                                  </Button>
                                  <Button
                                    onClick={() => removerProducao(producao.id)}
                                    variant="outline"
                                    className="flex-1 h-12 text-base border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                                  >
                                    üóëÔ∏è Remover
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Controles de Produ·ß·£o */}
                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <CardHeader>
                                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  öñÔ∏è Controles de Produ·ß·£o
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-6">
                                  {/* Etapa 1: Peso Bruto (Sempre vis·≠vel) */}
                                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <Label htmlFor={`peso-bruto-${producao.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                                      1Ô∏èÉ£ Peso Bruto (g) *
                                      {producao.pesoBruto && parseFloat(producao.pesoBruto) > 0 && <span className="text-green-600 dark:text-green-400 text-xs">úÖ</span>}
                                    </Label>
                                    <Input
                                      id={`peso-bruto-${producao.id}`}
                                      type="number"
                                      inputMode="decimal"
                                      value={producao.pesoBruto}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '')
                                        atualizarProducao(producao.id, { pesoBruto: value })
                                      }}
                                      placeholder="Digite o peso bruto inicial..."
                                      className="h-12 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                      required
                                    />
                                  </div>

                                  {/* Etapa 2: Peso L·≠quido (S·≥ ap·≥s timer iniciar) */}
                                  {producao.timerAtivo && (
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <Label htmlFor={`peso-liquido-${producao.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                                        2Ô∏èÉ£ Peso L·≠quido (g)
                                        {producao.insumoChefe && <span className="text-blue-600 dark:text-blue-400 text-xs">üîó Ajusta {producao.insumoChefe.nome}</span>}
                                      </Label>
                                      <Input
                                        id={`peso-liquido-${producao.id}`}
                                        type="number"
                                        inputMode="decimal"
                                        value={producao.pesoLiquido}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9.]/g, '')
                                          atualizarPesoLiquido(producao.id, value)
                                        }}
                                        placeholder="Digite o peso ap·≥s limpeza..."
                                        className="h-12 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                      />
                                    </div>
                                  )}

                              {/* Etapa 3: Resultado Final (S·≥ ap·≥s timer iniciar) */}
                              {producao.timerAtivo && (
                                <div className="bg-white p-3 rounded border border-orange-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor={`rendimento-produzido-${producao.id}`} className="text-black font-semibold">
                                      3Ô∏èÉ£ Resultado Final (g) *
                                    </Label>
                                    {producao.rendimentoEsperado && (
                                      <span className="text-sm text-gray-600">
                                        üéØ Meta: {producao.rendimentoEsperado}g
                                      </span>
                                    )}
                                  </div>
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
                                    placeholder="Digite o peso do produto final..."
                                    className="text-black font-medium border-orange-300"
                                    required
                                  />
                                  
                                  {/* Compara·ß·£o com meta */}
                                  {producao.rendimentoProduzido && producao.rendimentoEsperado && (
                                    <div className="mt-2 text-sm">
                                      {(() => {
                                        const produzido = parseFloat(producao.rendimentoProduzido)
                                        const esperado = parseFloat(producao.rendimentoEsperado)
                                        const diferenca = produzido - esperado
                                        const percentual = esperado > 0 ? (diferenca / esperado * 100) : 0
                                        
                                        if (Math.abs(diferenca) < 5) {
                                          return <span className="text-green-600">úÖ Rendimento dentro do esperado</span>
                                        } else if (diferenca > 0) {
                                          return <span className="text-green-600">üìà +{diferenca.toFixed(1)}g (+{percentual.toFixed(1)}%) acima da meta</span>
                                        } else {
                                          return <span className="text-orange-600">üìâ {diferenca.toFixed(1)}g ({percentual.toFixed(1)}%) abaixo da meta</span>
                                        }
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Observa·ß·µes (S·≥ ap·≥s timer iniciar) */}
                              {producao.timerAtivo && (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <Label htmlFor={`obs-${producao.id}`} className="text-black font-semibold">
                                    üìù Observa·ß·µes
                                  </Label>
                                  <Textarea
                                    id={`obs-${producao.id}`}
                                    value={producao.observacoes}
                                    onChange={(e) => atualizarProducao(producao.id, { observacoes: e.target.value })}
                                    placeholder="Anote qualquer observa·ß·£o sobre a produ·ß·£o..."
                                    className="text-black font-medium resize-none mt-1"
                                    rows={2}
                                  />
                                </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Insumos da Receita */}
                          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  ü•ò Insumos da Receita
                                </CardTitle>
                                <Button
                                  onClick={() => alternarInsumosExpandidos(producao.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 h-10 w-10 touch-manipulation"
                                >
                                  {producao.insumosExpandidos ? 'üîΩ' : 'üîº'}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>

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
                                          {insumo.nome}
                                        </span>
                                        {insumo.is_chefe && (
                                          <Badge variant="destructive" className="text-xs">CHEFE</Badge>
                                        )}
                                      </div>
                                      {!insumo.is_chefe && (
                                        <Button
                                          onClick={() => removerInsumoProducao(producao.id, insumo.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                          title="Remover insumo"
                                        >
                                          ùå
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {/* Interface simplificada dos insumos */}
                                    <div className="space-y-2">
                                      {/* Linha 1: Quantidade sugerida/calculada */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                          {insumo.is_chefe ? 'üéØ Quantidade base:' : 'üí° Sugerido:'}
                                        </span>
                                        <div className="font-medium text-purple-700 text-sm bg-purple-50 rounded px-3 py-1 border border-purple-200">
                                          {insumo.quantidade_calculada ? 
                                            `${insumo.quantidade_calculada} ${insumo.unidade_medida}` : 
                                            `${insumo.quantidade_necessaria} ${insumo.unidade_medida}`
                                          }
                                        </div>
                                      </div>

                                      {/* Linha 2: Input para quantidade real */}
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 min-w-0 flex-shrink-0">
                                          úèÔ∏è Usado:
                                        </span>
                                        <Input
                                          type="number"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          value={insumo.quantidade_real}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '')
                                            atualizarQuantidadeRealManual(producao.id, insumo.id, value)
                                          }}
                                          placeholder={`${insumo.quantidade_calculada || insumo.quantidade_necessaria}`}
                                          className="h-9 text-sm text-black font-medium border-green-300 flex-1"
                                        />
                                        <span className="text-sm text-gray-500 min-w-0 flex-shrink-0">
                                          {insumo.unidade_medida}
                                        </span>
                                      </div>

                                      {/* Mostrar diferen·ßa se houver */}
                                      {insumo.quantidade_real > 0 && (
                                        <div className="text-xs text-right">
                                          {(() => {
                                            const calculado = insumo.quantidade_calculada || insumo.quantidade_necessaria
                                            const real = insumo.quantidade_real
                                            const diferenca = real - calculado
                                            const percentual = calculado > 0 ? (diferenca / calculado * 100) : 0
                                            
                                            if (Math.abs(diferenca) < 0.1) {
                                              return <span className="text-green-600">úÖ Conforme receita</span>
                                            } else if (diferenca > 0) {
                                              return <span className="text-orange-600">üìà +{diferenca.toFixed(1)}g (+{percentual.toFixed(1)}%)</span>
                                            } else {
                                              return <span className="text-blue-600">üìâ {diferenca.toFixed(1)}g ({percentual.toFixed(1)}%)</span>
                                            }
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Se·ß·£o para adicionar insumos */}
                                <div className="border-t pt-3 mt-3">
                                  {!adicionandoInsumo[producao.id] ? (
                                    <Button
                                      onClick={() => setAdicionandoInsumo(prev => ({ ...prev, [producao.id]: true }))}
                                      variant="outline"
                                      className="w-full border-dashed border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                                    >
                                      ûï Adicionar Insumo
                                    </Button>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">Adicionar Insumo:</span>
                                        <Button
                                          onClick={() => {
                                            setAdicionandoInsumo(prev => ({ ...prev, [producao.id]: false }))
                                            setBuscaInsumo(prev => ({ ...prev, [producao.id]: '' }))
                                            setMostrarDropdownInsumo(prev => ({ ...prev, [producao.id]: false }))
                                          }}
                                          variant="ghost"
                                          size="sm"
                                          className="text-gray-500 hover:text-gray-700 h-6 w-6 p-0"
                                        >
                                          ùå
                                        </Button>
                                      </div>
                                      
                                      <div className="relative">
                                        <Input
                                          type="text"
                                          value={buscaInsumo[producao.id] || ''}
                                          onChange={(e) => {
                                            setBuscaInsumo(prev => ({ ...prev, [producao.id]: e.target.value }))
                                            setMostrarDropdownInsumo(prev => ({ ...prev, [producao.id]: true }))
                                          }}
                                          placeholder="üîç Buscar insumo por nome ou c·≥digo..."
                                          className="text-sm text-black font-medium border-2 border-orange-300"
                                          onFocus={() => setMostrarDropdownInsumo(prev => ({ ...prev, [producao.id]: true }))}
                                          onBlur={() => {
                                            setTimeout(() => {
                                              setMostrarDropdownInsumo(prev => ({ ...prev, [producao.id]: false }))
                                            }, 200)
                                          }}
                                        />
                                        
                                        {mostrarDropdownInsumo[producao.id] && (
                                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg border-2 border-orange-300 shadow-lg max-h-40 overflow-y-auto">
                                            {filtrarInsumosDisponiveis(producao.id).length > 0 ? (
                                              <>
                                                {!buscaInsumo[producao.id] && filtrarInsumosDisponiveis(producao.id).length > 10 && (
                                                  <div className="p-2 bg-orange-50 text-orange-700 text-xs text-center border-b border-orange-100">
                                                    üí° Digite para filtrar entre {filtrarInsumosDisponiveis(producao.id).length} insumos
                                                  </div>
                                                )}
                                                {filtrarInsumosDisponiveis(producao.id).map((insumo) => (
                                                  <div
                                                    key={insumo.id}
                                                    className="p-2 cursor-pointer hover:bg-orange-50 border-b border-orange-100 transition-colors"
                                                    onClick={() => adicionarInsumoProducao(producao.id, insumo)}
                                                  >
                                                    <div className="font-semibold text-black text-sm">{insumo.nome}</div>
                                                    <div className="text-xs text-gray-600">{insumo.codigo} Ä¢ {insumo.unidade_medida}</div>
                                                  </div>
                                                ))}
                                              </>
                                            ) : (
                                              <div className="p-3 text-center text-gray-500 text-sm">
                                                {buscaInsumo[producao.id] ? 
                                                  `üîç Nenhum insumo encontrado para "${buscaInsumo[producao.id]}"` :
                                                  `ö†Ô∏è Nenhum insumo dispon·≠vel. Sistema tem ${insumosDisponiveis.length} insumos totais.`
                                                }
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            </CardContent>
                          </Card>

                          {/* Bot·£o Salvar */}
                          <Button
                            onClick={() => salvarProducao(producao.id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 h-12 text-base touch-manipulation"
                            disabled={!producao.rendimentoProduzido.trim()}
                          >
                            üíæ Salvar Produ·ß·£o
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {producoesAtivas.length === 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium">üçΩÔ∏è Nenhuma produ·ß·£o ativa</p>
                    <p className="text-sm">Selecione uma receita acima para come·ßar</p>
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
