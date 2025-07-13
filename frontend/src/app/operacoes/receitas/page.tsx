'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { useGlobalConfirm } from '@/components/ui/confirm-dialog'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface Insumo {
  id: number
  codigo: string
  nome: string
  categoria: string
  observacoes?: string
  custo_unitario?: number
  unidade_medida: string
  quantidade_necessaria?: number
  is_chefe?: boolean
}

interface ReceitaInsumo {
  insumo_id: number
  quantidade_necessaria: number
  is_chefe: boolean
}

interface Receita {
  receita_codigo: string
  receita_nome: string
  receita_categoria: string
  tipo_local: string
  rendimento_esperado?: number
  unidade_rendimento?: string
  custo_total?: number
  observacoes?: string
  ativo?: boolean
  insumos?: Insumo[]
}

interface NovaReceita {
  receita_codigo: string
  receita_nome: string
  receita_categoria: string
  tipo_local: 'bar' | 'cozinha'
  rendimento_esperado: number
  tempo_preparo_min: number
  instrucoes: string
  ativo: boolean
  insumos: {
    insumo_id: number
    quantidade_necessaria: number
    is_chefe: boolean
  }[]
}

export default function ReceitasPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const { confirmDelete, confirmAction } = useGlobalConfirm()
  const [activeTab, setActiveTab] = useState('insumos')
  
  // Estados para Insumos
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [novoInsumo, setNovoInsumo] = useState<Insumo>({
    codigo: '',
    nome: '',
    unidade_medida: 'g',
    categoria: 'cozinha',
    observacoes: ''
  })

  // Estados para Receitas
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [novaReceita, setNovaReceita] = useState<NovaReceita>({
    receita_codigo: '',
    receita_nome: '',
    receita_categoria: '',
    tipo_local: 'cozinha',
    rendimento_esperado: 0,
    tempo_preparo_min: 0,
    instrucoes: '',
    ativo: true,
    insumos: []
  })

  // Estados para busca (usando useMemo para evitar re-renders)
  const [buscaInsumosList, setBuscaInsumosList] = useState('')
  const [buscaReceitasList, setBuscaReceitasList] = useState('')

  // Estados para busca de insumos (simplificados)
  const [buscaInsumos, setBuscaInsumos] = useState<{[key: number]: string}>({})
  const [dropdownAberto, setDropdownAberto] = useState<{[key: number]: boolean}>({})

  // Estados para Modal de Edição - Insumos
  const [modalEditarInsumo, setModalEditarInsumo] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null)

  // Estados para Modal de Edição - Receitas (OTIMIZADO)
  const [modalEditarReceita, setModalEditarReceita] = useState(false)
  const [receitaEditando, setReceitaEditando] = useState<Receita | null>(null)
  
  // Estados separados para edição (evitar conflitos)
  const [buscaInsumosEdicao, setBuscaInsumosEdicao] = useState<{[key: number]: string}>({})
  const [dropdownAbertoEdicao, setDropdownAbertoEdicao] = useState<{[key: number]: boolean}>({})

  const [isLoading, setIsLoading] = useState(false)

  // MEMOIZAÇÃO para filtros (evitar loops infinitos)
  const insumosFiltrados = useMemo(() => {
    if (!buscaInsumosList.trim()) return insumos
    
    return insumos.filter(insumo => 
      insumo.nome.toLowerCase().includes(buscaInsumosList.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(buscaInsumosList.toLowerCase())
    ).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [buscaInsumosList, insumos])

  const receitasFiltradas = useMemo(() => {
    if (!buscaReceitasList.trim()) return receitas
    
    return receitas.filter(receita => 
      receita.receita_nome.toLowerCase().includes(buscaReceitasList.toLowerCase()) ||
      receita.receita_codigo.toLowerCase().includes(buscaReceitasList.toLowerCase())
    ).sort((a, b) => a.receita_nome.localeCompare(b.receita_nome))
  }, [buscaReceitasList, receitas])

  // OTIMIZAÇÃO: Funções memoizadas para evitar re-renders
  const carregarProximoCodigo = useCallback(async () => {
    try {
      const response = await fetch('/api/cadastros/insumos-basicos/proximo-codigo')
      if (response.ok) {
        const data = await response.json()
        setNovoInsumo(prev => ({ ...prev, codigo: data.codigo }))
      }
    } catch (error) {
      console.error('❌ Erro ao carregar próximo código:', error)
    }
  }, [])

  const carregarProximoCodigoReceita = useCallback(async () => {
    if (!selectedBar?.id) return
    
    try {
      const response = await fetch(`/api/receitas/proximo-codigo?bar_id=${selectedBar.id}`)
      if (response.ok) {
        const data = await response.json()
        setNovaReceita(prev => ({ ...prev, receita_codigo: data.codigo }))
      }
    } catch (error) {
      console.error('❌ Erro ao carregar próximo código da receita:', error)
    }
  }, [selectedBar?.id])

  const carregarInsumos = useCallback(async () => {
    if (!selectedBar?.id) return
    
    try {
      const response = await fetch(`/api/cadastros/insumos-basicos?bar_id=${selectedBar.id}`)
      if (response.ok) {
        const data = await response.json()
        setInsumos(data.insumos || [])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar insumos:', error)
    }
  }, [selectedBar?.id])

  const carregarReceitas = useCallback(async () => {
    if (!selectedBar?.id) return
    
    try {
      const response = await fetch(`/api/receitas/todas?bar_id=${selectedBar.id}`)
      if (response.ok) {
        const data = await response.json()
        setReceitas(data.receitas || [])
        console.log('✅ Receitas carregadas (todas):', data.receitas?.length || 0)
      } else {
        console.error('❌ Erro na API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar receitas:', error)
    }
  }, [selectedBar?.id])

  // Carregar dados apenas quando bar mudar
  useEffect(() => {
    if (selectedBar?.id) {
      carregarInsumos()
      carregarReceitas()
      carregarProximoCodigo()
      carregarProximoCodigoReceita()
    }
  }, [selectedBar?.id, carregarInsumos, carregarReceitas, carregarProximoCodigo, carregarProximoCodigoReceita])

  useEffect(() => {
    setPageTitle('🧪 Gestão de Receitas')
    return () => setPageTitle('')
  }, [setPageTitle])

  const salvarInsumo = async () => {
    if (!novoInsumo.codigo.trim() || !novoInsumo.nome.trim()) {
      toast.warning('Campos obrigatórios', 'Código e nome são obrigatórios!')
      return
    }

    setIsLoading(true)
    try {
      const dados = {
        ...novoInsumo,
        bar_id: selectedBar?.id,
        ativo: true
      }

      const response = await fetch('/api/cadastros/insumos-basicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })

      if (response.ok) {
        toast.success('Insumo salvo!', 'Insumo cadastrado com sucesso no sistema.')
        limparFormularioInsumo()
        carregarInsumos()
        carregarProximoCodigo()
      } else {
        const error = await response.json()
        toast.error('Erro ao salvar', error.message || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar insumo:', error)
      toast.error('Erro no sistema', 'Erro ao salvar insumo. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const editarInsumoModal = async () => {
    if (!insumoEditando || !insumoEditando.codigo.trim() || !insumoEditando.nome.trim()) {
      toast.warning('Campos obrigatórios', 'Código e nome são obrigatórios!')
      return
    }

    setIsLoading(true)
    try {
      const dados = {
        ...insumoEditando,
        bar_id: selectedBar?.id,
        ativo: true
      }

      const response = await fetch('/api/cadastros/insumos-basicos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })

      if (response.ok) {
        toast.success('Insumo atualizado!', 'Alterações salvas com sucesso.')
        setModalEditarInsumo(false)
        setInsumoEditando(null)
        carregarInsumos()
      } else {
        const error = await response.json()
        toast.error('Erro ao atualizar', error.message || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('❌ Erro ao editar insumo:', error)
      toast.error('Erro no sistema', 'Erro ao editar insumo. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const excluirInsumo = async () => {
    if (!insumoEditando?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cadastros/insumos-basicos/${insumoEditando.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Insumo excluído!', 'Insumo removido do sistema com sucesso.')
        setModalEditarInsumo(false)
        setInsumoEditando(null)
        carregarInsumos()
      } else {
        const error = await response.json()
        toast.error('Erro ao excluir', error.message || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('❌ Erro ao excluir insumo:', error)
      toast.error('Erro no sistema', 'Erro ao excluir insumo. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const criarNovaReceita = async () => {
    if (!novaReceita.receita_codigo.trim() || !novaReceita.receita_nome.trim()) {
      toast.warning('Campos obrigatórios', 'Código e nome da receita são obrigatórios!')
      return
    }

    if (novaReceita.insumos.length === 0) {
      toast.warning('Insumos necessários', 'Adicione pelo menos um insumo à receita!')
      return
    }

    const temChefe = novaReceita.insumos.some(i => i.is_chefe)
    if (!temChefe) {
      toast.warning('Insumo chefe', 'Selecione um insumo chefe para a receita!')
      return
    }

    setIsLoading(true)
    try {
      // Criar receitas diretamente na nova estrutura
      for (const insumo of novaReceita.insumos) {
        const receitaData = {
          bar_id: selectedBar?.id,
          receita_codigo: novaReceita.receita_codigo,
          receita_nome: novaReceita.receita_nome,
          receita_categoria: novaReceita.receita_categoria,
          insumo_id: insumo.insumo_id,
          quantidade_necessaria: insumo.quantidade_necessaria,
          insumo_chefe_id: insumo.is_chefe ? insumo.insumo_id : novaReceita.insumos.find(i => i.is_chefe)?.insumo_id,
          rendimento_esperado: insumo.is_chefe ? novaReceita.rendimento_esperado : 0,
          ativo: novaReceita.ativo
        }

        const response = await fetch('/api/receitas/criar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(receitaData)
        })

        if (!response.ok) {
          throw new Error('Erro ao salvar receita')
        }
      }

      toast.success('Receita criada!', 'Nova receita adicionada ao sistema com sucesso.')
      limparFormularioReceita()
      carregarReceitas()
    } catch (error) {
      console.error('❌ Erro ao criar receita:', error)
      toast.error('Erro ao criar receita', 'Ocorreu um erro ao salvar a receita. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const limparFormularioInsumo = useCallback(() => {
    setNovoInsumo({
      codigo: '',
      nome: '',
      unidade_medida: 'g',
      categoria: 'cozinha',
      observacoes: ''
    })
  }, [])

  const limparFormularioReceita = useCallback(() => {
    setNovaReceita({
      receita_codigo: '',
      receita_nome: '',
      receita_categoria: '',
      tipo_local: 'cozinha',
      rendimento_esperado: 0,
      tempo_preparo_min: 0,
      instrucoes: '',
      ativo: true,
      insumos: []
    })
    // Limpar estados de busca de insumos
    setBuscaInsumos({})
    setDropdownAberto({})
  }, [])

  const abrirModalEditarInsumo = useCallback((insumo: Insumo) => {
    setInsumoEditando({ ...insumo })
    setModalEditarInsumo(true)
  }, [])

  // FUNÇÃO OTIMIZADA PARA EDITAR RECEITA (evita loops)
  const abrirModalEditarReceita = useCallback((receita: Receita) => {
    console.log('🔧 Abrindo modal de edição para receita:', receita.receita_codigo)
    
    // Fazer uma cópia profunda segura da receita
    const receitaCopia: Receita = {
      receita_codigo: receita.receita_codigo,
      receita_nome: receita.receita_nome,
      receita_categoria: receita.receita_categoria,
      rendimento_esperado: receita.rendimento_esperado,
      tipo_local: receita.tipo_local,
      ativo: receita.ativo,
      insumos: receita.insumos?.map(insumo => ({
        id: insumo.id,
        codigo: insumo.codigo,
        nome: insumo.nome,
        categoria: insumo.categoria,
        observacoes: insumo.observacoes,
        custo_unitario: insumo.custo_unitario,
        unidade_medida: insumo.unidade_medida,
        quantidade_necessaria: insumo.quantidade_necessaria,
        is_chefe: insumo.is_chefe
      })) || []
    }
    
    // Definir estados de forma atômica
    setReceitaEditando(receitaCopia)
    setModalEditarReceita(true)
    
    // Limpar e pré-configurar estados de busca
    const buscaInicial: {[key: number]: string} = {}
    const dropdownInicial: {[key: number]: boolean} = {}
    
    receita.insumos?.forEach((insumo, index) => {
      buscaInicial[index] = `${insumo.codigo} - ${insumo.nome}`
      dropdownInicial[index] = false
    })
    
    setBuscaInsumosEdicao(buscaInicial)
    setDropdownAbertoEdicao(dropdownInicial)
    
    console.log('✅ Modal de edição configurado com sucesso')
  }, [])

  const editarReceitaModal = async () => {
    if (!receitaEditando || !receitaEditando.receita_codigo.trim() || !receitaEditando.receita_nome.trim()) {
      toast.warning('Campos obrigatórios', 'Código e nome da receita são obrigatórios!')
      return
    }

    if (receitaEditando.insumos?.length === 0) {
      toast.warning('Insumos necessários', 'Adicione pelo menos um insumo à receita!')
      return
    }

    const temChefe = receitaEditando.insumos?.some(i => i.is_chefe)
    if (!temChefe) {
      toast.warning('Insumo chefe', 'Selecione um insumo chefe para a receita!')
      return
    }

    setIsLoading(true)
    try {
      const dados = {
        receita_codigo: receitaEditando.receita_codigo,
        receita_nome: receitaEditando.receita_nome,
        receita_categoria: receitaEditando.receita_categoria,
        tipo_local: receitaEditando.tipo_local,
        rendimento_esperado: receitaEditando.rendimento_esperado || 0,
        insumos: receitaEditando.insumos,
        ativo: receitaEditando.ativo !== false,
        bar_id: selectedBar?.id
      }

      console.log('📝 Enviando dados para edição:', dados)

      const response = await fetch('/api/receitas/editar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Receita atualizada!', 'Alterações salvas com sucesso.')
        setModalEditarReceita(false)
        setReceitaEditando(null)
        setBuscaInsumosEdicao({})
        setDropdownAbertoEdicao({})
        carregarReceitas()
      } else {
        console.error('❌ Erro na API:', result)
        toast.error('Erro ao atualizar', result.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('❌ Erro ao editar receita:', error)
      toast.error('Erro no sistema', 'Erro ao editar receita. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const adicionarInsumoReceita = () => {
    const novoIndex = novaReceita.insumos.length
    setNovaReceita(prev => ({
      ...prev,
      insumos: [...prev.insumos, {
        insumo_id: 0,
        quantidade_necessaria: 0,
        is_chefe: false
      }]
    }))
    // Limpar busca do novo insumo
    setBuscaInsumos(prev => ({ ...prev, [novoIndex]: '' }))
    setDropdownAberto(prev => ({ ...prev, [novoIndex]: false }))
  }

  const removerInsumoReceita = (index: number) => {
    setNovaReceita(prev => ({
      ...prev,
      insumos: prev.insumos.filter((_, i) => i !== index)
    }))
    // Limpar estados de busca do insumo removido
    setBuscaInsumos(prev => {
      const novo = { ...prev }
      delete novo[index]
      // Reindexar os insumos restantes
      const reindexado: {[key: number]: string} = {}
      Object.keys(novo).forEach((key) => {
        const keyNum = parseInt(key)
        if (keyNum > index) {
          reindexado[keyNum - 1] = novo[keyNum]
        } else if (keyNum < index) {
          reindexado[keyNum] = novo[keyNum]
        }
      })
      return reindexado
    })
    setDropdownAberto(prev => {
      const novo = { ...prev }
      delete novo[index]
      // Reindexar os dropdowns restantes
      const reindexado: {[key: number]: boolean} = {}
      Object.keys(novo).forEach((key) => {
        const keyNum = parseInt(key)
        if (keyNum > index) {
          reindexado[keyNum - 1] = novo[keyNum]
        } else if (keyNum < index) {
          reindexado[keyNum] = novo[keyNum]
        }
      })
      return reindexado
    })
  }

  const atualizarInsumoReceita = (index: number, campo: keyof ReceitaInsumo, valor: any) => {
    setNovaReceita(prev => ({
      ...prev,
      insumos: prev.insumos.map((insumo, i) => 
        i === index ? { ...insumo, [campo]: valor } : insumo
      )
    }))
  }

  const definirInsumoChefe = (index: number) => {
    setNovaReceita(prev => ({
      ...prev,
      insumos: prev.insumos.map((insumo, i) => ({
        ...insumo,
        is_chefe: i === index
      }))
    }))
  }

  // Funções para busca de insumos
  const filtrarInsumos = (index: number) => {
    const busca = buscaInsumos[index] || ''
    if (!busca) return insumos.slice(0, 10) // Mostrar primeiros 10 quando sem busca
    
    return insumos.filter(insumo => 
      insumo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(busca.toLowerCase())
    )
  }

  const selecionarInsumo = (index: number, insumo: Insumo) => {
    atualizarInsumoReceita(index, 'insumo_id', insumo.id || 0)
    setBuscaInsumos(prev => ({ ...prev, [index]: `${insumo.codigo} - ${insumo.nome}` }))
    setDropdownAberto(prev => ({ ...prev, [index]: false }))
  }

  const abrirDropdownInsumo = (index: number) => {
    setDropdownAberto(prev => ({ ...prev, [index]: true }))
  }

  const fecharDropdownInsumo = (index: number) => {
    setTimeout(() => {
      setDropdownAberto(prev => ({ ...prev, [index]: false }))
    }, 200)
  }

  // === FUNÇÕES PARA EDIÇÃO DE INSUMOS DA RECEITA ===
  
  const adicionarInsumoReceitaEdicao = () => {
    if (!receitaEditando) return
    
    const novoIndex = receitaEditando.insumos?.length || 0
    const novoInsumo = {
      id: 0,
      codigo: '',
      nome: '',
      categoria: 'cozinha',
      observacoes: '',
      custo_unitario: 0,
      unidade_medida: 'g',
      quantidade_necessaria: 0,
      is_chefe: false
    }
    
    setReceitaEditando(prev => prev ? {
      ...prev,
      insumos: [...prev.insumos, novoInsumo]
    } : null)
    
    // Limpar busca do novo insumo
    setBuscaInsumosEdicao(prev => ({ ...prev, [novoIndex]: '' }))
    setDropdownAbertoEdicao(prev => ({ ...prev, [novoIndex]: false }))
  }

  const removerInsumoReceitaEdicao = (index: number) => {
    if (!receitaEditando) return
    
    setReceitaEditando(prev => prev ? {
      ...prev,
      insumos: prev.insumos.filter((_, i) => i !== index)
    } : null)
    
    // Limpar estados de busca do insumo removido e reindexar
    setBuscaInsumosEdicao(prev => {
      const novo = { ...prev }
      delete novo[index]
      const reindexado: {[key: number]: string} = {}
      Object.keys(novo).forEach((key) => {
        const keyNum = parseInt(key)
        if (keyNum > index) {
          reindexado[keyNum - 1] = novo[keyNum]
        } else if (keyNum < index) {
          reindexado[keyNum] = novo[keyNum]
        }
      })
      return reindexado
    })
    
    setDropdownAbertoEdicao(prev => {
      const novo = { ...prev }
      delete novo[index]
      const reindexado: {[key: number]: boolean} = {}
      Object.keys(novo).forEach((key) => {
        const keyNum = parseInt(key)
        if (keyNum > index) {
          reindexado[keyNum - 1] = novo[keyNum]
        } else if (keyNum < index) {
          reindexado[keyNum] = novo[keyNum]
        }
      })
      return reindexado
    })
  }

  const atualizarInsumoReceitaEdicao = (index: number, campo: string, valor: any) => {
    if (!receitaEditando) return
    
    setReceitaEditando(prev => prev ? {
      ...prev,
      insumos: prev.insumos.map((insumo, i) => 
        i === index ? { ...insumo, [campo]: valor } : insumo
      )
    } : null)
  }

  const definirInsumoReceitaChefe = (index: number) => {
    if (!receitaEditando) return
    
    setReceitaEditando(prev => prev ? {
      ...prev,
      insumos: prev.insumos.map((insumo, i) => ({
        ...insumo,
        is_chefe: i === index
      }))
    } : null)
  }

  const filtrarInsumosEdicao = (index: number) => {
    const busca = buscaInsumosEdicao[index] || ''
    if (!busca) return insumos.slice(0, 10)
    
    return insumos.filter(insumo => 
      insumo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(busca.toLowerCase())
    )
  }

  const selecionarInsumoEdicao = (index: number, insumo: Insumo) => {
    if (!receitaEditando) return
    
    // Atualizar dados do insumo na receita
    const insumoAtualizado = {
      ...receitaEditando.insumos[index],
      id: insumo.id || 0,
      codigo: insumo.codigo,
      nome: insumo.nome,
      categoria: insumo.categoria,
      observacoes: insumo.observacoes,
      custo_unitario: insumo.custo_unitario,
      unidade_medida: insumo.unidade_medida,
      quantidade_necessaria: insumo.quantidade_necessaria,
      is_chefe: insumo.is_chefe
    }
    
    setReceitaEditando(prev => prev ? {
      ...prev,
      insumos: prev.insumos.map((ins, i) => i === index ? insumoAtualizado : ins)
    } : null)
    
    setBuscaInsumosEdicao(prev => ({ ...prev, [index]: `${insumo.codigo} - ${insumo.nome}` }))
    setDropdownAbertoEdicao(prev => ({ ...prev, [index]: false }))
  }

  const abrirDropdownInsumoEdicao = (index: number) => {
    setDropdownAbertoEdicao(prev => ({ ...prev, [index]: true }))
  }

  const fecharDropdownInsumoEdicao = (index: number) => {
    setTimeout(() => {
      setDropdownAbertoEdicao(prev => ({ ...prev, [index]: false }))
    }, 200)
  }

  // Função para duplicar receita
  const duplicarReceita = async (receita: Receita) => {
    try {
      const novaReceita = {
        ...receita,
        receita_codigo: `${receita.receita_codigo}_COPIA`,
        receita_nome: `${receita.receita_nome} (Cópia)`
      }
      
      // TODO: Implementar lógica de duplicação
      console.log('📋 Duplicando receita:', novaReceita)
      
    } catch (error) {
      console.error('Erro ao duplicar receita:', error)
    }
  }

  if (!selectedBar) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Selecione um Bar</h1>
          <p className="text-gray-600">Você precisa selecionar um bar para gerenciar receitas e insumos.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredModule="receitas_insumos">
      <div className="p-3 sm:p-6 max-w-full">
      {/* Header mobile-first */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">🧪 Gestão de Receitas</h1>
        <p className="text-sm sm:text-base text-gray-700">Cadastro de insumos e criação de receitas</p>
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            📍 <strong>{selectedBar.nome}</strong>
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile-optimized tabs */}
        <TabsList className="grid w-full grid-cols-2 h-14 sm:h-auto mb-4">
          <TabsTrigger 
            value="insumos" 
            className="text-xs sm:text-sm px-2 sm:px-4 py-3 sm:py-2 touch-manipulation"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-base">📦</span>
              <span>Insumos ({insumos.length})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="receitas" 
            className="text-xs sm:text-sm px-2 sm:px-4 py-3 sm:py-2 touch-manipulation"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-base">👨‍🍳</span>
              <span>Receitas ({receitas.length})</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insumos" className="space-y-4 sm:space-y-6">
          {/* Formulário de Insumos - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-black font-semibold flex items-center gap-2">
                <span className="text-2xl">➕</span>
                Novo Insumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Mobile-first form layout */}
              <div className="space-y-4">
                <div>
                  <Label className="text-black font-semibold text-base mb-2 block">
                    🏷️ Código *
                  </Label>
                  <Input
                    value={novoInsumo.codigo}
                    onChange={(e) => setNovoInsumo(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: i0001"
                    className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  />
                </div>
                
                <div>
                  <Label className="text-black font-semibold text-base mb-2 block">
                    📦 Nome *
                  </Label>
                  <Input
                    value={novoInsumo.nome}
                    onChange={(e) => setNovoInsumo(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Frango a passarinho"
                    className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black font-semibold text-base mb-2 block">
                      🏪 Categoria
                    </Label>
                    <Select 
                      value={novoInsumo.categoria} 
                      onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                        <SelectItem value="bar">🍺 Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-black font-semibold text-base mb-2 block">
                      📏 Unidade de Medida
                    </Label>
                    <Select 
                      value={novoInsumo.unidade_medida} 
                      onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, unidade_medida: value }))}
                    >
                      <SelectTrigger className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Gramas (g)</SelectItem>
                        <SelectItem value="kg">Quilos (kg)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="l">Litros (l)</SelectItem>
                        <SelectItem value="un">Unidades (un)</SelectItem>
                        <SelectItem value="cx">Caixas (cx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-black font-semibold text-base mb-2 block">
                    📝 Observações
                  </Label>
                  <Textarea
                    value={novoInsumo.observacoes || ''}
                    onChange={(e) => setNovoInsumo(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais..."
                    className="text-black font-medium border-2 border-gray-300 min-h-[100px] text-lg sm:text-base touch-manipulation"
                  />
                </div>

                {/* Action buttons - Mobile first */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={carregarProximoCodigo}
                    variant="outline"
                    className="border-2 border-blue-300 text-blue-600 hover:text-blue-800 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  >
                    <span className="text-xl mr-2">🔄</span>
                    Próximo Código
                  </Button>
                  
                  <Button
                    onClick={salvarInsumo}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </div>
                    ) : (
                      <>
                        <span className="text-xl mr-2">💾</span>
                        Salvar Insumo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Insumos - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-black font-semibold flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Lista de Insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile-optimized search */}
              <div className="mb-4">
                <Input
                  type="text"
                  value={buscaInsumosList}
                  onChange={(e) => setBuscaInsumosList(e.target.value)}
                  placeholder="🔍 Buscar insumo..."
                  className="text-black font-medium border-2 border-gray-300 placeholder:text-gray-600 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                />
              </div>
              
              {insumosFiltrados.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg mb-2">
                    {buscaInsumosList ? 'Nenhum insumo encontrado' : 'Nenhum insumo cadastrado ainda'}
                  </p>
                  {buscaInsumosList && (
                    <p className="text-gray-400 text-sm">
                      Busca por: "{buscaInsumosList}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="card-grid">
                  {insumosFiltrados.map((insumo) => (
                    <div 
                      key={insumo.id}
                      className="card-responsive hover-lift-mobile"
                    >
                      <div className="stack-mobile mb-3">
                        <Badge variant="outline" className="badge-mobile">
                          {insumo.codigo}
                        </Badge>
                        <Button
                          onClick={() => abrirModalEditarInsumo(insumo)}
                          variant="ghost"
                          size="sm"
                          className="btn-icon-touch"
                        >
                          <span className="text-lg">✏️</span>
                        </Button>
                      </div>
                      
                      <h3 className="text-responsive-sm font-semibold text-black mb-2 leading-tight">
                        {insumo.nome}
                      </h3>
                      
                      <div className="space-y-mobile">
                        <div>
                          <span className="text-responsive-xs font-medium text-gray-600">Categoria:</span>
                          <p className="text-responsive-sm text-gray-900">{insumo.categoria}</p>
                        </div>
                        
                        <div className="card-grid-2">
                          <div>
                            <span className="text-responsive-xs font-medium text-gray-600">Custo:</span>
                            <p className="text-responsive-sm font-semibold text-green-600">
                              R$ {insumo.custo_unitario?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-responsive-xs font-medium text-gray-600">Unidade:</span>
                            <p className="text-responsive-sm text-gray-900">{insumo.unidade_medida}</p>
                          </div>
                        </div>

                        {insumo.observacoes && (
                          <div>
                            <span className="text-responsive-xs font-medium text-gray-600">Observações:</span>
                            <p className="text-responsive-xs text-gray-700 mt-1 leading-relaxed">
                              {insumo.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-4 sm:space-y-6">
          {/* Formulário de Receitas - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-black font-semibold flex items-center gap-2">
                <span className="text-2xl">➕</span>
                Nova Receita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Mobile-first form layout */}
              <div className="space-y-4">
                <div>
                  <Label className="text-black font-semibold text-base mb-2 block">
                    🏷️ Código da Receita *
                  </Label>
                  <Input
                    value={novaReceita.receita_codigo}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_codigo: e.target.value }))}
                    placeholder="Ex: pc0001"
                    className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  />
                </div>
                
                <div>
                  <Label className="text-black font-semibold text-base mb-2 block">
                    🍽️ Nome da Receita *
                  </Label>
                  <Input
                    value={novaReceita.receita_nome}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_nome: e.target.value }))}
                    placeholder="Ex: Frango a Passarinho"
                    className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black font-semibold text-base mb-2 block">
                      📁 Categoria
                    </Label>
                    <Input
                      value={novaReceita.receita_categoria}
                      onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_categoria: e.target.value }))}
                      placeholder="Ex: COZINHA - PREPAROS"
                      className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-black font-semibold text-base mb-2 block">
                      🏪 Local
                    </Label>
                    <Select 
                      value={novaReceita.tipo_local} 
                      onValueChange={(value) => setNovaReceita(prev => ({ ...prev, tipo_local: value as 'bar' | 'cozinha' }))}
                    >
                      <SelectTrigger className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                        <SelectItem value="bar">🍺 Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-black font-semibold text-base mb-2 block">
                    📏 Rendimento Esperado (g)
                  </Label>
                  <Input
                    type="number"
                    value={novaReceita.rendimento_esperado}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, rendimento_esperado: parseFloat(e.target.value) || 0 }))}
                    placeholder="Ex: 1000"
                    className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={carregarProximoCodigoReceita}
                    variant="outline"
                    className="border-2 border-blue-300 text-blue-600 hover:text-blue-800 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  >
                    <span className="text-xl mr-2">🔄</span>
                    Próximo Código
                  </Button>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <input
                      type="checkbox"
                      id="receita-ativa"
                      checked={novaReceita.ativo}
                      onChange={(e) => setNovaReceita(prev => ({ ...prev, ativo: e.target.checked }))}
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 touch-manipulation"
                    />
                    <Label htmlFor="receita-ativa" className="text-black font-semibold text-base">
                      <span className="text-xl mr-2">✅</span>
                      Receita Ativa
                    </Label>
                  </div>
                </div>
              </div>

              {/* Insumos da Receita - MOBILE OPTIMIZED */}
              <div className="border-t pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧪</span>
                    <Label className="text-black font-semibold text-lg">Insumos da Receita</Label>
                  </div>
                  <Button
                    onClick={adicionarInsumoReceita}
                    variant="outline"
                    className="border-2 border-green-300 text-green-600 hover:text-green-800 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                  >
                    <span className="text-xl mr-2">➕</span>
                    Adicionar Insumo
                  </Button>
                </div>

                {novaReceita.insumos.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">🧪</div>
                    <p className="text-gray-500 text-lg">Nenhum insumo adicionado ainda</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Clique em "Adicionar Insumo" para começar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {novaReceita.insumos.map((insumo, index) => (
                      <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        {/* Mobile-optimized insumo input */}
                        <div className="space-y-4">
                          {/* Busca de insumo */}
                          <div className="relative">
                            <Label className="text-black font-semibold text-base mb-2 block">
                              🔍 Buscar Insumo
                            </Label>
                            <Input
                              type="text"
                              value={buscaInsumos[index] || ''}
                              onChange={(e) => {
                                setBuscaInsumos(prev => ({ ...prev, [index]: e.target.value }))
                                setDropdownAberto(prev => ({ ...prev, [index]: true }))
                              }}
                              placeholder="Digite o nome ou código do insumo..."
                              className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                              onFocus={() => abrirDropdownInsumo(index)}
                              onBlur={() => fecharDropdownInsumo(index)}
                            />
                            
                            {buscaInsumos[index] && (
                              <Button
                                onClick={() => {
                                  setBuscaInsumos(prev => ({ ...prev, [index]: '' }))
                                  atualizarInsumoReceita(index, 'insumo_id', 0)
                                }}
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-9 sm:top-8 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 touch-manipulation"
                              >
                                <span className="text-lg">❌</span>
                              </Button>
                            )}
                            
                            {dropdownAberto[index] && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg border-2 border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                                {filtrarInsumos(index).length > 0 ? (
                                  <>
                                    {!buscaInsumos[index] && insumos.length > 10 && (
                                      <div className="p-3 bg-blue-50 text-blue-700 text-sm text-center border-b border-gray-100">
                                        💡 Digite para filtrar entre {insumos.length} insumos
                                      </div>
                                    )}
                                    {filtrarInsumos(index).map((ins) => (
                                      <div
                                        key={ins.id}
                                        className="p-4 cursor-pointer hover:bg-blue-50 border-b border-gray-100 transition-colors touch-manipulation"
                                        onClick={() => selecionarInsumo(index, ins)}
                                      >
                                        <div className="font-semibold text-black text-base">
                                          {ins.codigo} - {ins.nome}
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                          <span>{ins.categoria === 'bar' ? '🍺' : '🍽️'}</span>
                                          <span>{ins.categoria}</span>
                                          <span>•</span>
                                          <span>{ins.unidade_medida}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <div className="p-4 text-center text-gray-500">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <p>Nenhum insumo encontrado</p>
                                    <p className="text-sm mt-1">"{buscaInsumos[index]}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Quantidade */}
                          <div>
                            <Label className="text-black font-semibold text-base mb-2 block">
                              📏 Quantidade Necessária
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 500"
                              value={insumo.quantidade_necessaria || ''}
                              onChange={(e) => atualizarInsumoReceita(index, 'quantidade_necessaria', parseFloat(e.target.value) || 0)}
                              className="text-black font-medium border-2 border-gray-300 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                            />
                          </div>
                          
                          {/* INSUMO CHEFE - MOBILE OPTIMIZED */}
                          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border-2 border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">👑</div>
                                <div>
                                  <Label className="text-black font-bold text-lg block">
                                    Insumo Chefe
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    O insumo principal da receita
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => definirInsumoChefe(index)}
                                variant={insumo.is_chefe ? "default" : "outline"}
                                className={`h-14 px-6 text-lg font-bold touch-manipulation ${
                                  insumo.is_chefe 
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg" 
                                    : "border-2 border-red-300 text-red-600 hover:text-red-800 hover:bg-red-50"
                                }`}
                              >
                                {insumo.is_chefe ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">👑</span>
                                    <span>CHEFE</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🔄</span>
                                    <span>Tornar Chefe</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Remover insumo */}
                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => removerInsumoReceita(index)}
                              variant="outline"
                              className="border-2 border-red-300 text-red-600 hover:text-red-800 hover:bg-red-50 h-12 sm:h-10 px-6 text-lg sm:text-base touch-manipulation"
                            >
                              <span className="text-xl mr-2">🗑️</span>
                              Remover
                            </Button>
                          </div>
                        </div>
                        
                        {/* Resumo do insumo selecionado */}
                        {insumo.insumo_id > 0 && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">✅</span>
                              <div className="flex-1">
                                <p className="text-black font-medium text-base">
                                  {buscaInsumos[index]?.split(' - ')[1] || 'Insumo selecionado'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {insumo.quantidade_necessaria}g
                                  {insumo.is_chefe && (
                                    <span className="ml-2 text-red-600 font-bold">
                                      👑 CHEFE
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão criar receita */}
              <Button
                onClick={criarNovaReceita}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full h-14 text-lg touch-manipulation"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando Receita...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    <span>Criar Receita</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Receitas - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-black font-semibold flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Lista de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile-optimized search */}
              <div className="mb-4">
                <Input
                  type="text"
                  value={buscaReceitasList}
                  onChange={(e) => setBuscaReceitasList(e.target.value)}
                  placeholder="🔍 Buscar receita..."
                  className="text-black font-medium border-2 border-gray-300 placeholder:text-gray-600 h-12 sm:h-10 text-lg sm:text-base touch-manipulation"
                />
              </div>
              
              {receitasFiltradas.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-gray-500 text-lg mb-2">
                    {buscaReceitasList ? 'Nenhuma receita encontrada' : 'Nenhuma receita cadastrada ainda'}
                  </p>
                  {buscaReceitasList && (
                    <p className="text-gray-400 text-sm">
                      Busca por: "{buscaReceitasList}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="card-grid">
                  {receitasFiltradas.map((receita) => (
                    <div
                      key={receita.receita_codigo}
                      className={`card-responsive hover-lift-mobile ${
                        receita.ativo === false ? 'border-red-200 bg-red-50' : ''
                      }`}
                    >
                      <div className="stack-mobile mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="badge-mobile">
                            {receita.receita_codigo}
                          </Badge>
                          {receita.ativo === false && (
                            <Badge variant="destructive" className="badge-mobile">
                              Inativa
                            </Badge>
                          )}
                        </div>
                        <div className="btn-group-mobile">
                          <Button
                            onClick={() => abrirModalEditarReceita(receita)}
                            variant="ghost"
                            size="sm"
                            className="btn-touch touch-animation"
                          >
                            <span className="text-lg mr-2">✏️</span>
                            <span className="visible-mobile">Editar</span>
                          </Button>
                          <Button
                            onClick={() => duplicarReceita(receita)}
                            variant="ghost"
                            size="sm"
                            className="btn-touch touch-animation"
                          >
                            <span className="text-lg mr-2">📋</span>
                            <span className="visible-mobile">Duplicar</span>
                          </Button>
                        </div>
                      </div>

                      <h3 className="text-responsive-sm font-semibold text-black mb-2 leading-tight">
                        {receita.receita_nome}
                      </h3>

                      <div className="space-y-mobile">
                        <div className="card-grid-2">
                          <div>
                            <span className="text-responsive-xs font-medium text-gray-600">Categoria:</span>
                            <p className="text-responsive-sm text-gray-900">{receita.receita_categoria}</p>
                          </div>
                          <div>
                            <span className="text-responsive-xs font-medium text-gray-600">Rendimento:</span>
                            <p className="text-responsive-sm text-gray-900">
                              {receita.rendimento_esperado || '-'} {receita.unidade_rendimento || ''}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-responsive-xs font-medium text-gray-600">Custo Total:</span>
                          <p className="text-responsive-lg font-bold text-green-600">
                            R$ {receita.custo_total?.toFixed(2) || '0.00'}
                          </p>
                        </div>

                        <div>
                          <span className="text-responsive-xs font-medium text-gray-600">
                            Insumos ({receita.insumos?.length || 0}):
                          </span>
                          <div className="mt-2 max-h-32 overflow-y-auto scroll-mobile">
                            <div className="space-y-1">
                              {(receita.insumos || []).slice(0, 5).map((insumo: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-responsive-xs bg-gray-50 rounded p-2">
                                  <span className="text-gray-700 truncate flex-1">{insumo.nome}</span>
                                  <span className="text-gray-600 ml-2">{insumo.quantidade_necessaria}</span>
                                </div>
                              ))}
                              {(receita.insumos?.length || 0) > 5 && (
                                <div className="text-responsive-xs text-gray-500 text-center py-1">
                                  +{(receita.insumos?.length || 0) - 5} mais...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {receita.observacoes && (
                          <div>
                            <span className="text-responsive-xs font-medium text-gray-600">Observações:</span>
                            <p className="text-responsive-xs text-gray-700 mt-1 leading-relaxed">
                              {receita.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Insumo */}
      <Dialog open={modalEditarInsumo} onOpenChange={setModalEditarInsumo}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✏️</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  Editar Insumo
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Altere as informações do insumo ou exclua-o se necessário.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            {insumoEditando && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📝 Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🏷️ Código *
                      </Label>
                      <Input
                        value={insumoEditando.codigo}
                        onChange={(e) => setInsumoEditando(prev => prev ? { ...prev, codigo: e.target.value } : null)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        placeholder="Ex: i0001"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        📦 Nome *
                      </Label>
                      <Input
                        value={insumoEditando.nome}
                        onChange={(e) => setInsumoEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        placeholder="Ex: Frango a passarinho"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🏪 Categoria
                      </Label>
                      <Select 
                        value={insumoEditando.categoria} 
                        onValueChange={(value) => setInsumoEditando(prev => prev ? { ...prev, categoria: value } : null)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                          <SelectItem value="bar">🍺 Bar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        📏 Unidade de Medida
                      </Label>
                      <Select 
                        value={insumoEditando.unidade_medida} 
                        onValueChange={(value) => setInsumoEditando(prev => prev ? { ...prev, unidade_medida: value } : null)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Gramas (g)</SelectItem>
                          <SelectItem value="kg">Quilos (kg)</SelectItem>
                          <SelectItem value="ml">Mililitros (ml)</SelectItem>
                          <SelectItem value="l">Litros (l)</SelectItem>
                          <SelectItem value="un">Unidades (un)</SelectItem>
                          <SelectItem value="cx">Caixas (cx)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                      📝 Observações
                    </Label>
                    <Textarea
                      value={insumoEditando.observacoes || ''}
                      onChange={(e) => setInsumoEditando(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                onClick={async () => {
                  const confirmed = await confirmDelete(
                    insumoEditando?.nome || 'este insumo',
                    async () => {
                      await excluirInsumo()
                    }
                  )
                }}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    🗑️ Excluir
                  </>
                )}
              </Button>
              <Button
                onClick={() => setModalEditarInsumo(false)}
                variant="outline"
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={editarInsumoModal}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2 ml-auto"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    💾 Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Modal de Edição de Receita */}
      <Dialog open={modalEditarReceita} onOpenChange={setModalEditarReceita}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🍽️</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  Editar Receita
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Altere as informações da receita ou desative-a se necessário.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            {receitaEditando && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📝 Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🏷️ Código da Receita *
                      </Label>
                      <Input
                        value={receitaEditando.receita_codigo}
                        onChange={(e) => setReceitaEditando(prev => prev ? { ...prev, receita_codigo: e.target.value } : null)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="Ex: pc0001"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🍽️ Nome da Receita *
                      </Label>
                      <Input
                        value={receitaEditando.receita_nome}
                        onChange={(e) => setReceitaEditando(prev => prev ? { ...prev, receita_nome: e.target.value } : null)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="Ex: Frango a Passarinho"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        📁 Categoria
                      </Label>
                      <Input
                        value={receitaEditando.receita_categoria}
                        onChange={(e) => setReceitaEditando(prev => prev ? { ...prev, receita_categoria: e.target.value } : null)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="Ex: COZINHA - PREPAROS"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🏪 Local
                      </Label>
                      <Select 
                        value={receitaEditando.tipo_local} 
                        onValueChange={(value) => setReceitaEditando(prev => prev ? { ...prev, tipo_local: value } : null)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                          <SelectItem value="bar">🍺 Bar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        📏 Rendimento Esperado (g)
                      </Label>
                      <Input
                        type="number"
                        value={receitaEditando.rendimento_esperado || 0}
                        onChange={(e) => setReceitaEditando(prev => prev ? { ...prev, rendimento_esperado: parseFloat(e.target.value) || 0 } : null)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="Ex: 1000"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="receita-ativa-edit"
                        checked={receitaEditando.ativo !== false}
                        onChange={(e) => setReceitaEditando(prev => prev ? { ...prev, ativo: e.target.checked } : null)}
                        className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <Label htmlFor="receita-ativa-edit" className="text-gray-700 font-medium">
                        ✅ Receita Ativa (aparece no terminal de produção)
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Receitas inativas não aparecerão no terminal de produção, útil quando há estoque suficiente.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      🧪 Insumos da Receita
                    </h3>
                    <Button
                      onClick={adicionarInsumoReceitaEdicao}
                      variant="outline"
                      size="sm"
                      className="border-2 border-green-300 text-green-600 hover:text-green-800"
                    >
                      ➕ Adicionar Insumo
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {receitaEditando.insumos && receitaEditando.insumos.length > 0 ? (
                      receitaEditando.insumos.map((insumo, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <div className="relative">
                              <Label className="text-black font-semibold text-base mb-2 block">
                                🔍 Buscar Insumo
                              </Label>
                              <Input
                                type="text"
                                value={buscaInsumosEdicao[index] || ''}
                                onChange={(e) => {
                                  setBuscaInsumosEdicao(prev => ({ ...prev, [index]: e.target.value }))
                                  setDropdownAbertoEdicao(prev => ({ ...prev, [index]: true }))
                                }}
                                placeholder="Buscar insumo..."
                                className="text-black font-medium border-2 border-gray-300"
                                onFocus={() => abrirDropdownInsumoEdicao(index)}
                                onBlur={() => fecharDropdownInsumoEdicao(index)}
                              />
                              
                              {dropdownAbertoEdicao[index] && (
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border-2 border-gray-300 shadow-lg max-h-40 overflow-y-auto">
                                  {filtrarInsumosEdicao(index).map((insumoOpcao) => (
                                    <div
                                      key={insumoOpcao.id}
                                      className="p-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100"
                                      onClick={() => selecionarInsumoEdicao(index, insumoOpcao)}
                                    >
                                      <div className="font-semibold text-black text-sm">{insumoOpcao.codigo} - {insumoOpcao.nome}</div>
                                      <div className="text-xs text-gray-600">{insumoOpcao.categoria} • {insumoOpcao.unidade_medida}</div>
                                    </div>
                                  ))}
                                  {filtrarInsumosEdicao(index).length === 0 && (
                                    <div className="p-3 text-center text-gray-500 text-sm">
                                      Nenhum insumo encontrado
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <Input
                                type="number"
                                step="0.01"
                                value={insumo.quantidade_necessaria}
                                onChange={(e) => atualizarInsumoReceitaEdicao(index, 'quantidade_necessaria', parseFloat(e.target.value) || 0)}
                                placeholder="Quantidade"
                                className="text-black font-medium border-2 border-gray-300"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`chefe-edicao-${index}`}
                                name="insumo-chefe-edicao"
                                checked={insumo.is_chefe}
                                onChange={() => definirInsumoReceitaChefe(index)}
                                className="w-4 h-4 text-red-600"
                              />
                              <Label htmlFor={`chefe-edicao-${index}`} className="text-black font-medium text-sm">
                                {insumo.is_chefe ? '👑 CHEFE' : 'Chefe?'}
                              </Label>
                            </div>
                            
                            <div className="flex justify-end">
                              <Button
                                onClick={() => removerInsumoReceitaEdicao(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-100 h-8 w-8 p-0"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                          
                          {insumo.nome && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                insumo.is_chefe ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {insumo.codigo} - {insumo.nome} • {insumo.quantidade_necessaria} {insumo.unidade_medida}
                                {insumo.is_chefe && (
                                  <span className="ml-2 text-red-600 font-bold">
                                    👑 CHEFE
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum insumo adicionado ainda.</p>
                    )}
                  </div>
                  
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-green-500 text-lg">✅</span>
                      <div>
                        <p className="text-green-800 font-medium text-sm">Funcionalidade Ativa</p>
                        <p className="text-green-700 text-sm">
                          Agora você pode adicionar, remover e editar insumos diretamente neste modal! Marque o insumo chefe e defina as quantidades necessárias.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50 flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                onClick={async () => {
                  const confirmed = await confirmDelete(
                    receitaEditando?.receita_nome || 'esta receita',
                    async () => {
                      // TODO: Implementar exclusão de receita
                      toast.info('Funcionalidade em desenvolvimento', 'Exclusão de receitas será implementada em breve.')
                    }
                  )
                }}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    🗑️ Excluir
                  </>
                )}
              </Button>
              <Button
                onClick={() => setModalEditarReceita(false)}
                variant="outline"
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={editarReceitaModal}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2 ml-auto"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    💾 Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
} 