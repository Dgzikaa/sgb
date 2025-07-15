'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useForceDarkMode } from '@/hooks/useForceDarkMode'
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  ChefHat, 
  Save,
  Copy,
  BookOpen,
  Clock,
  Target,
  RefreshCw,
  Loader2,
  Crown,
  X,
  Eye,
  Utensils
} from 'lucide-react'

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

interface NovoInsumo {
  codigo: string
  nome: string
  categoria: string
  observacoes?: string
  custo_unitario?: number
  unidade_medida: string
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
  insumo_chefe_id?: number
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
  // Force dark mode on all elements
  useForceDarkMode()
  
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const { confirmDelete, confirmAction } = useGlobalConfirm()
  const [activeTab, setActiveTab] = useState('insumos')
  
  // Estados para Insumos
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [novoInsumo, setNovoInsumo] = useState<NovoInsumo>({
    codigo: 'i0001', // Código padrão inicial
    nome: '',
    unidade_medida: 'g',
    categoria: 'cozinha',
    observacoes: ''
  })
  const [buscaInsumos, setBuscaInsumos] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null)
  const [modalEditarInsumo, setModalEditarInsumo] = useState(false)

  // Estados para Receitas
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [novaReceita, setNovaReceita] = useState<NovaReceita>({
    receita_codigo: 'r0001', // Código padrão inicial
    receita_nome: '',
    receita_categoria: '',
    tipo_local: 'cozinha',
    rendimento_esperado: 0,
    tempo_preparo_min: 0,
    instrucoes: '',
    ativo: true,
    insumos: []
  })
  const [buscaReceitas, setBuscaReceitas] = useState('')
  const [receitaEditando, setReceitaEditando] = useState<Receita | null>(null)
  const [modalCriarReceita, setModalCriarReceita] = useState(false)
  const [modalEditarReceita, setModalEditarReceita] = useState(false)
  const [modalVisualizarReceita, setModalVisualizarReceita] = useState(false)

  // Estados para criação de receitas
  const [insumosReceita, setInsumosReceita] = useState<{
    insumo_id: number
    quantidade_necessaria: number
    is_chefe: boolean
  }[]>([])
  const [insumoSelecionado, setInsumoSelecionado] = useState('')
  const [quantidadeInsumo, setQuantidadeInsumo] = useState('')

  useEffect(() => {
    setPageTitle('📋 Receitas e Insumos')
    return () => setPageTitle('')
  }, [setPageTitle])

  // CARREGAR DADOS REAIS DO BANCO - Função para buscar insumos
  const carregarInsumos = useCallback(async () => {
    if (!selectedBar) return
    
    try {
      console.log('🔄 Carregando insumos do banco...')
      const response = await fetch(`/api/receitas/insumos?ativo=true`)
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // Mapear dados da API para o formato esperado
        const insumosFormatados = data.data.map((insumo: any) => ({
          id: insumo.id,
          codigo: insumo.codigo,
          nome: insumo.nome,
          categoria: insumo.categoria || 'cozinha', // Default para compatibilidade
          custo_unitario: insumo.custo_unitario,
          unidade_medida: insumo.unidade || insumo.unidade_medida || 'g',
          observacoes: insumo.observacoes
        }))
        
        setInsumos(insumosFormatados)
        console.log(`✅ ${insumosFormatados.length} insumos carregados`)
      } else {
        console.error('❌ Erro na resposta da API insumos:', data)
        setInsumos([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar insumos:', error)
      toast.error('Erro', 'Falha ao carregar insumos do banco de dados')
      setInsumos([])
    }
  }, [selectedBar])

  // CARREGAR DADOS REAIS DO BANCO - Função para buscar receitas
  const carregarReceitas = useCallback(async () => {
    if (!selectedBar) return
    
    try {
      console.log('🔄 Carregando receitas do banco...')
      const response = await fetch(`/api/receitas/todas?bar_id=${selectedBar.id}`)
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.receitas) {
        setReceitas(data.receitas)
        console.log(`✅ ${data.receitas.length} receitas carregadas`)
      } else {
        console.error('❌ Erro na resposta da API receitas:', data)
        setReceitas([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar receitas:', error)
      toast.error('Erro', 'Falha ao carregar receitas do banco de dados')
      setReceitas([])
    }
  }, [selectedBar])

  // Função para verificar se um insumo é chefe em alguma receita
  const isInsumoChefe = useCallback((insumoId: number) => {
    return receitas.some(receita => 
      receita.insumos?.some(insumo => 
        insumo.id === insumoId && insumo.is_chefe
      )
    )
  }, [receitas])

  // Função para obter receitas onde o insumo é chefe
  const getReceitasOndeEChefe = useCallback((insumoId: number) => {
    return receitas.filter(receita => 
      receita.insumos?.some(insumo => 
        insumo.id === insumoId && insumo.is_chefe
      )
    ).map(receita => receita.receita_nome)
  }, [receitas])

  // Carregar dados quando o bar for selecionado
  useEffect(() => {
    if (selectedBar) {
      const carregarDados = async () => {
        setLoadingData(true)
        try {
          await Promise.all([
            carregarInsumos(),
            carregarReceitas()
          ])
        } finally {
          setLoadingData(false)
        }
      }
      
      carregarDados()
    }
  }, [selectedBar, carregarInsumos, carregarReceitas])

  const insumosFiltrados = useMemo(() => {
    return insumos.filter(insumo =>
      insumo.nome.toLowerCase().includes(buscaInsumos.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(buscaInsumos.toLowerCase()) ||
      insumo.categoria.toLowerCase().includes(buscaInsumos.toLowerCase())
    )
  }, [insumos, buscaInsumos])

  const receitasFiltradas = useMemo(() => {
    return receitas.filter(receita =>
      receita.receita_nome.toLowerCase().includes(buscaReceitas.toLowerCase()) ||
      receita.receita_codigo.toLowerCase().includes(buscaReceitas.toLowerCase()) ||
      receita.receita_categoria.toLowerCase().includes(buscaReceitas.toLowerCase())
    )
  }, [receitas, buscaReceitas])

  // Otimização: calcular insumos chefes uma vez
  const insumosChefes = useMemo(() => {
    return insumos.filter(insumo => isInsumoChefe(insumo.id))
  }, [insumos, isInsumoChefe])

  // Função para gerar próximo código de insumo
  const gerarProximoCodigoInsumo = useCallback(() => {
    if (insumos.length === 0) return 'i0001'
    
    // Buscar códigos que seguem o padrão i0000
    const codigosNumericos = insumos
      .map(insumo => insumo.codigo)
      .filter(codigo => /^i\d+$/.test(codigo))
      .map(codigo => parseInt(codigo.substring(1)))
      .filter(numero => !isNaN(numero))
    
    if (codigosNumericos.length === 0) return 'i0001'
    
    const maiorNumero = Math.max(...codigosNumericos)
    const proximoNumero = maiorNumero + 1
    
    return `i${proximoNumero.toString().padStart(4, '0')}`
  }, [insumos])

  // Função para gerar próximo código de receita
  const gerarProximoCodigoReceita = useCallback(() => {
    if (receitas.length === 0) return 'r0001'
    
    // Buscar códigos que seguem o padrão r0000
    const codigosNumericos = receitas
      .map(receita => receita.receita_codigo)
      .filter(codigo => /^r\d+$/.test(codigo))
      .map(codigo => parseInt(codigo.substring(1)))
      .filter(numero => !isNaN(numero))
    
    if (codigosNumericos.length === 0) return 'r0001'
    
    const maiorNumero = Math.max(...codigosNumericos)
    const proximoNumero = maiorNumero + 1
    
    return `r${proximoNumero.toString().padStart(4, '0')}`
  }, [receitas])

  // Atualizar código do insumo quando os dados carregarem
  useEffect(() => {
    if (insumos.length >= 0) { // Sempre atualizar quando os dados carregarem
      const novoCodigo = gerarProximoCodigoInsumo()
      setNovoInsumo(prev => ({
        ...prev,
        codigo: novoCodigo
      }))
    }
  }, [insumos, gerarProximoCodigoInsumo])

  // Atualizar código da receita quando os dados carregarem
  useEffect(() => {
    if (receitas.length >= 0) { // Sempre atualizar quando os dados carregarem
      const novoCodigo = gerarProximoCodigoReceita()
      setNovaReceita(prev => ({
        ...prev,
        receita_codigo: novoCodigo
      }))
    }
  }, [receitas, gerarProximoCodigoReceita])

  const salvarInsumo = async () => {
    if (!novoInsumo.codigo || !novoInsumo.nome) {
      toast.error('Erro', 'Código e nome são obrigatórios')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/receitas/insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codigo: novoInsumo.codigo,
          nome: novoInsumo.nome,
          custo_unitario: novoInsumo.custo_unitario || 0,
          unidade: novoInsumo.unidade_medida,
          observacoes: novoInsumo.observacoes || ''
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Sucesso!', 'Insumo cadastrado com sucesso')
        
        // Reset form
        setNovoInsumo({
          codigo: gerarProximoCodigoInsumo(), // Gerar próximo código automaticamente
          nome: '',
          unidade_medida: 'g',
          categoria: 'cozinha',
          observacoes: ''
        })
        
        // Recarregar insumos
        await carregarInsumos()
      } else {
        toast.error('Erro', data.error || 'Falha ao salvar insumo')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar insumo:', error)
      toast.error('Erro', 'Falha ao salvar insumo')
    } finally {
      setIsLoading(false)
    }
  }

  const abrirModalEditarInsumo = (insumo: Insumo) => {
    setInsumoEditando(insumo)
    setModalEditarInsumo(true)
  }

  const salvarEdicaoInsumo = async () => {
    if (!insumoEditando || !insumoEditando.nome.trim()) {
      toast.error('Nome do insumo é obrigatório')
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/receitas/insumos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: insumoEditando.id,
          codigo: insumoEditando.codigo,
          nome: insumoEditando.nome.trim(),
          custo_unitario: insumoEditando.custo_unitario,
          unidade: insumoEditando.unidade_medida,
          peso_volume_unidade: 1,
          observacoes: insumoEditando.observacoes?.trim() || null,
          ativo: true
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar insumo')
      }

      // Atualizar na lista local
      setInsumos(prev => prev.map(insumo => 
        insumo.id === insumoEditando.id 
          ? { ...insumoEditando }
          : insumo
      ))

      toast.success('Insumo atualizado com sucesso!')
      setModalEditarInsumo(false)
      setInsumoEditando(null)
      
    } catch (error) {
      console.error('Erro ao salvar edição do insumo:', error)
      toast.error('Erro ao atualizar insumo. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const editarReceita = (receita: Receita) => {
    setReceitaEditando(receita)
    setModalVisualizarReceita(false)
    setModalEditarReceita(true)
  }

  const salvarEdicaoReceita = async () => {
    if (!receitaEditando || !receitaEditando.receita_nome.trim()) {
      toast.error('Nome da receita é obrigatório')
      return
    }

    try {
      setIsLoading(true)
      
      // Mapear insumos para o formato correto da API
      const insumosParaAPI = (receitaEditando.insumos || []).map(insumo => ({
        id: insumo.id,
        quantidade_necessaria: insumo.quantidade_necessaria || 0,
        is_chefe: insumo.is_chefe || false
      }))

      const response = await fetch('/api/receitas/editar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receita_codigo: receitaEditando.receita_codigo,
          receita_nome: receitaEditando.receita_nome.trim(),
          receita_categoria: receitaEditando.receita_categoria,
          tipo_local: receitaEditando.tipo_local,
          rendimento_esperado: receitaEditando.rendimento_esperado,
          insumos: insumosParaAPI,
          ativo: receitaEditando.ativo,
          bar_id: selectedBar?.id
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar receita')
      }

      // Atualizar na lista local
      setReceitas(prev => prev.map(receita => 
        receita.receita_codigo === receitaEditando.receita_codigo 
          ? { ...receitaEditando }
          : receita
      ))

      toast.success('Receita atualizada com sucesso!')
      setModalEditarReceita(false)
      setReceitaEditando(null)
      
    } catch (error) {
      console.error('Erro ao salvar edição da receita:', error)
      toast.error('Erro ao atualizar receita. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const excluirInsumo = async (insumo: Insumo) => {
    const confirmed = await confirmDelete(
      insumo.nome,
      async () => {
        try {
          // TODO: Implementar API de exclusão
          // Por enquanto, remover localmente
          setInsumos(prev => prev.filter(i => i.id !== insumo.id))
          toast.success('Sucesso!', 'Insumo excluído com sucesso')
        } catch (error) {
          toast.error('Erro', 'Falha ao excluir insumo')
        }
      }
    )
  }

  // FUNÇÕES PARA RECEITAS

  const abrirModalCriarReceita = () => {
    setNovaReceita({
      receita_codigo: gerarProximoCodigoReceita(), // Gerar próximo código automaticamente
      receita_nome: '',
      receita_categoria: '',
      tipo_local: 'cozinha',
      rendimento_esperado: 0,
      tempo_preparo_min: 0,
      instrucoes: '',
      ativo: true,
      insumos: []
    })
    setInsumosReceita([])
    setModalCriarReceita(true)
  }

  const adicionarInsumoReceita = () => {
    if (!insumoSelecionado || !quantidadeInsumo) {
      toast.error('Erro', 'Selecione um insumo e informe a quantidade')
      return
    }

    const insumoId = parseInt(insumoSelecionado)
    const quantidade = parseFloat(quantidadeInsumo)

    // Verificar se insumo já foi adicionado
    if (insumosReceita.some(i => i.insumo_id === insumoId)) {
      toast.error('Erro', 'Este insumo já foi adicionado à receita')
      return
    }

    const novoInsumoReceita = {
      insumo_id: insumoId,
      quantidade_necessaria: quantidade,
      is_chefe: false // Por padrão não é chefe
    }

    setInsumosReceita(prev => [...prev, novoInsumoReceita])
    setInsumoSelecionado('')
    setQuantidadeInsumo('')
  }

  const removerInsumoReceita = (insumoId: number) => {
    setInsumosReceita(prev => prev.filter(i => i.insumo_id !== insumoId))
  }

  const definirInsumoChefe = (insumoId: number) => {
    setInsumosReceita(prev => {
      const insumoClicado = prev.find(i => i.insumo_id === insumoId)
      
      if (insumoClicado?.is_chefe) {
        // Se já é chefe, desmarcar
        return prev.map(i => 
          i.insumo_id === insumoId 
            ? { ...i, is_chefe: false }
            : i
        )
      } else {
        // Se não é chefe, marcar como chefe e desmarcar todos os outros
        return prev.map(i => ({
          ...i,
          is_chefe: i.insumo_id === insumoId
        }))
      }
    })
  }

  const salvarReceita = async () => {
    if (!novaReceita.receita_codigo || !novaReceita.receita_nome) {
      toast.error('Erro', 'Código e nome da receita são obrigatórios')
      return
    }

    if (insumosReceita.length === 0) {
      toast.error('Erro', 'Adicione pelo menos um insumo à receita')
      return
    }

    const temChefe = insumosReceita.some(i => i.is_chefe)
    if (!temChefe) {
      toast.error('Erro', 'Selecione um insumo chefe para a receita')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/receitas/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar?.id,
          receita_codigo: novaReceita.receita_codigo,
          receita_nome: novaReceita.receita_nome,
          receita_categoria: novaReceita.receita_categoria,
          tipo_local: novaReceita.tipo_local,
          rendimento_esperado: novaReceita.rendimento_esperado,
          ativo: novaReceita.ativo,
          insumos: insumosReceita
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Sucesso!', 'Receita criada com sucesso')
        setModalCriarReceita(false)
        
        // Resetar form com próximo código
        setNovaReceita({
          receita_codigo: gerarProximoCodigoReceita(),
          receita_nome: '',
          receita_categoria: '',
          tipo_local: 'cozinha',
          rendimento_esperado: 0,
          tempo_preparo_min: 0,
          instrucoes: '',
          ativo: true,
          insumos: []
        })
        setInsumosReceita([])
        
        await carregarReceitas()
      } else {
        toast.error('Erro', data.error || 'Falha ao criar receita')
      }
    } catch (error) {
      console.error('❌ Erro ao criar receita:', error)
      toast.error('Erro', 'Falha ao criar receita')
    } finally {
      setIsLoading(false)
    }
  }

  const visualizarReceita = (receita: Receita) => {
    setReceitaEditando(receita)
    setModalVisualizarReceita(true)
  }



  const excluirReceita = async (receita: Receita) => {
    const confirmed = await confirmDelete(
      receita.receita_nome,
      async () => {
        try {
          // TODO: Implementar API de exclusão de receitas
          setReceitas(prev => prev.filter(r => r.receita_codigo !== receita.receita_codigo))
          toast.success('Sucesso!', 'Receita excluída com sucesso')
        } catch (error) {
          toast.error('Erro', 'Falha ao excluir receita')
        }
      }
    )
  }

  const recarregarDados = async () => {
    if (!selectedBar) return
    
    setLoadingData(true)
    try {
      await Promise.all([
        carregarInsumos(),
        carregarReceitas()
      ])
      toast.success('Dados atualizados!', 'Insumos e receitas recarregados')
    } catch (error) {
      toast.error('Erro', 'Falha ao recarregar dados')
    } finally {
      setLoadingData(false)
    }
  }

  // Função para obter nome do insumo por ID
  const obterNomeInsumo = (insumoId: number) => {
    const insumo = insumos.find(i => i.id === insumoId)
    return insumo ? insumo.nome : `Insumo #${insumoId}`
  }

  // Função para obter insumo chefe de uma receita
  const obterInsumoChefe = (receita: Receita) => {
    if (!receita.insumos) return null
    return receita.insumos.find(i => i.is_chefe)
  }

  if (!selectedBar) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">⚠️ Selecione um Bar</h1>
          <p className="text-gray-600 dark:text-gray-400">Você precisa selecionar um bar para gerenciar receitas e insumos.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredModule="receitas_insumos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receitas e Insumos</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie insumos e receitas do estabelecimento</p>
          </div>
          
          <Button
            onClick={recarregarDados}
            disabled={loadingData}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loadingData ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Atualizar
          </Button>
        </div>

        {loadingData && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-gray-600 dark:text-gray-400">Carregando dados do banco...</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger 
              value="insumos" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300"
            >
              <Package className="w-4 h-4" />
              Insumos ({insumos.length})
              {insumosChefes.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs">
                    {insumosChefes.length}
                  </span>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="receitas" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300"
            >
              <ChefHat className="w-4 h-4" />
              Receitas ({receitas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insumos" className="space-y-6">
            {/* Formulário de Novo Insumo */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Plus className="w-5 h-5" />
                  Novo Insumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      Código * 
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(auto)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={novoInsumo.codigo}
                        onChange={(e) => setNovoInsumo(prev => ({ ...prev, codigo: e.target.value }))}
                        placeholder="Ex: i0001"
                        disabled={true}
                        className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNovoInsumo(prev => ({ ...prev, codigo: gerarProximoCodigoInsumo() }))}
                        className="px-3 shrink-0"
                        title="Gerar próximo código"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Nome *</Label>
                    <Input
                      value={novoInsumo.nome}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Frango a passarinho"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Categoria</Label>
                    <Select 
                      value={novoInsumo.categoria} 
                      onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="cozinha">Cozinha</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Unidade de Medida</Label>
                    <Select 
                      value={novoInsumo.unidade_medida} 
                      onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, unidade_medida: value }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="g">Gramas (g)</SelectItem>
                        <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="l">Litros (l)</SelectItem>
                        <SelectItem value="unid">Unidades (unid)</SelectItem>
                        <SelectItem value="pct">Pacotes (pct)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Custo Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoInsumo.custo_unitario || ''}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, custo_unitario: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Observações</Label>
                  <Textarea
                    value={novoInsumo.observacoes || ''}
                    onChange={(e) => setNovoInsumo(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais..."
                    rows={2}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={salvarInsumo}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Insumo
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Insumos */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Package className="w-5 h-5" />
                  Lista de Insumos
                  {insumosChefes.length > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <Badge variant="outline" className="border-yellow-400 text-yellow-700 dark:text-yellow-300">
                        {insumosChefes.length} Insumo{insumosChefes.length !== 1 ? 's' : ''} Chefe{insumosChefes.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    value={buscaInsumos}
                    onChange={(e) => setBuscaInsumos(e.target.value)}
                    placeholder="Buscar insumo..."
                    className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {insumosFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {buscaInsumos ? 'Nenhum insumo encontrado' : 'Nenhum insumo cadastrado'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {buscaInsumos ? `Busca por: "${buscaInsumos}"` : 'Comece cadastrando seus primeiros insumos'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insumosFiltrados.map((insumo) => {
                      const ehChefe = isInsumoChefe(insumo.id)
                      const receitasChefe = getReceitasOndeEChefe(insumo.id)
                      
                      return (
                        <div 
                          key={insumo.id}
                          className={`border rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/25 transition-all duration-200 ${
                            ehChefe 
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                              >
                                {insumo.codigo}
                              </Badge>
                              {ehChefe && (
                                <div className="flex items-center gap-1">
                                  <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  <Badge 
                                    variant="outline" 
                                    className="border-yellow-400 text-yellow-700 dark:text-yellow-300 text-xs"
                                  >
                                    Chefe
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => abrirModalEditarInsumo(insumo)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              >
                                <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                onClick={() => excluirInsumo(insumo)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                            {insumo.nome}
                          </h3>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                              <span className="text-gray-900 dark:text-gray-100 capitalize">{insumo.categoria}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Custo:</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                R$ {insumo.custo_unitario?.toFixed(2) || 'N/A'}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Unidade:</span>
                              <span className="text-gray-900 dark:text-gray-100">{insumo.unidade_medida}</span>
                            </div>

                            {ehChefe && receitasChefe.length > 0 && (
                              <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                                <span className="text-yellow-700 dark:text-yellow-300 font-medium text-xs">
                                  Insumo chefe em:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {receitasChefe.slice(0, 2).map((nomeReceita, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="secondary" 
                                      className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                                    >
                                      {nomeReceita}
                                    </Badge>
                                  ))}
                                  {receitasChefe.length > 2 && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                                    >
                                      +{receitasChefe.length - 2} mais
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {insumo.observacoes && (
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">Observações:</span>
                                <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-relaxed">
                                  {insumo.observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receitas" className="space-y-6">
            {/* Botão para criar nova receita */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <ChefHat className="w-5 h-5" />
                    Receitas
                  </CardTitle>
                  <Button
                    onClick={abrirModalCriarReceita}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Receita
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    value={buscaReceitas}
                    onChange={(e) => setBuscaReceitas(e.target.value)}
                    placeholder="Buscar receita..."
                    className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {receitasFiltradas.length === 0 ? (
                  <div className="text-center py-8">
                    <ChefHat className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {buscaReceitas ? 'Nenhuma receita encontrada' : 'Nenhuma receita cadastrada'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {buscaReceitas ? `Busca por: "${buscaReceitas}"` : 'Clique em "Nova Receita" para começar'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {receitasFiltradas.map((receita) => {
                      const insumoChefe = obterInsumoChefe(receita)
                      
                      return (
                        <div 
                          key={receita.receita_codigo}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/25 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                              >
                                {receita.receita_codigo}
                              </Badge>
                              {insumoChefe && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => visualizarReceita(receita)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                                title="Visualizar receita"
                              >
                                <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </Button>
                              <Button
                                onClick={() => editarReceita(receita)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                title="Editar receita"
                              >
                                <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                onClick={() => excluirReceita(receita)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                title="Excluir receita"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                              {receita.receita_nome}
                            </h3>
                            <Badge 
                              variant={receita.ativo !== false ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {receita.ativo !== false ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                              <span className="text-gray-900 dark:text-gray-100">{receita.receita_categoria}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Local:</span>
                              <span className="text-gray-900 dark:text-gray-100 capitalize">{receita.tipo_local}</span>
                            </div>
                            
                            {receita.rendimento_esperado && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Rendimento:</span>
                                <span className="text-gray-900 dark:text-gray-100">{receita.rendimento_esperado}g</span>
                              </div>
                            )}

                            {insumoChefe && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Insumo Chefe:</span>
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium text-xs">
                                  {insumoChefe.nome}
                                </span>
                              </div>
                            )}

                            {receita.insumos && receita.insumos.length > 0 && (
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">Total insumos:</span>
                                <span className="text-gray-700 dark:text-gray-300 text-xs ml-2">
                                  {receita.insumos.length} ingrediente{receita.insumos.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Criar Receita */}
        <Dialog open={modalCriarReceita} onOpenChange={setModalCriarReceita}>
          <DialogContent className="max-w-4xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Plus className="w-5 h-5" />
                Nova Receita
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Crie uma nova receita definindo os insumos e suas quantidades
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Dados básicos da receita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">
                    Código *
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(auto)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={novaReceita.receita_codigo}
                      onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_codigo: e.target.value }))}
                      placeholder="Ex: r0001"
                      disabled={true}
                      className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNovaReceita(prev => ({ ...prev, receita_codigo: gerarProximoCodigoReceita() }))}
                      className="px-3 shrink-0"
                      title="Gerar próximo código"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Nome *</Label>
                  <Input
                    value={novaReceita.receita_nome}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_nome: e.target.value }))}
                    placeholder="Ex: Frango à Passarinho"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Categoria</Label>
                  <Input
                    value={novaReceita.receita_categoria}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_categoria: e.target.value }))}
                    placeholder="Ex: Petiscos"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Local</Label>
                  <Select 
                    value={novaReceita.tipo_local} 
                    onValueChange={(value: 'bar' | 'cozinha') => setNovaReceita(prev => ({ ...prev, tipo_local: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="cozinha">Cozinha</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Rendimento Esperado (g)</Label>
                  <Input
                    type="number"
                    value={novaReceita.rendimento_esperado}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, rendimento_esperado: parseInt(e.target.value) || 0 }))}
                    placeholder="1000"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Seção de insumos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insumos da Receita</h3>
                </div>

                {/* Adicionar insumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Insumo</Label>
                    <Select value={insumoSelecionado} onValueChange={setInsumoSelecionado}>
                      <SelectTrigger className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecionar insumo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        {insumos.map((insumo) => (
                          <SelectItem key={insumo.id} value={insumo.id.toString()}>
                            {insumo.nome} ({insumo.codigo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Quantidade</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={quantidadeInsumo}
                      onChange={(e) => setQuantidadeInsumo(e.target.value)}
                      placeholder="100"
                      className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={adicionarInsumoReceita}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de insumos adicionados */}
                {insumosReceita.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Insumos Adicionados:</Label>
                    {insumosReceita.map((insumoReceita) => {
                      const insumo = insumos.find(i => i.id === insumoReceita.insumo_id)
                      if (!insumo) return null

                      return (
                        <div 
                          key={insumoReceita.insumo_id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={insumoReceita.is_chefe}
                                onCheckedChange={() => definirInsumoChefe(insumoReceita.insumo_id)}
                                className="border-gray-300 dark:border-gray-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Chefe</span>
                              {insumoReceita.is_chefe && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{insumo.nome}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                {insumoReceita.quantidade_necessaria} {insumo.unidade_medida}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => removerInsumoReceita(insumoReceita.insumo_id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {insumosReceita.length > 0 && !insumosReceita.some(i => i.is_chefe) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        Selecione um insumo chefe para definir o rendimento da receita
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setModalCriarReceita(false)}
                variant="outline"
                className="modal-button-secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarReceita}
                disabled={isLoading || insumosReceita.length === 0 || !insumosReceita.some(i => i.is_chefe)}
                className="modal-button-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Receita
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Visualizar Receita */}
        <Dialog open={modalVisualizarReceita} onOpenChange={setModalVisualizarReceita}>
          <DialogContent className="max-w-3xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Eye className="w-5 h-5" />
                Visualizar Receita
              </DialogTitle>
            </DialogHeader>

            {receitaEditando && (
              <div className="space-y-6">
                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Código:</Label>
                    <p className="font-semibold text-gray-900 dark:text-white">{receitaEditando.receita_codigo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Nome:</Label>
                    <p className="font-semibold text-gray-900 dark:text-white">{receitaEditando.receita_nome}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Categoria:</Label>
                    <p className="text-gray-900 dark:text-white">{receitaEditando.receita_categoria}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Local:</Label>
                    <p className="text-gray-900 dark:text-white capitalize">{receitaEditando.tipo_local}</p>
                  </div>
                  {receitaEditando.rendimento_esperado && (
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">Rendimento Esperado:</Label>
                      <p className="text-gray-900 dark:text-white">{receitaEditando.rendimento_esperado}g</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Status:</Label>
                    <Badge variant={receitaEditando.ativo !== false ? 'default' : 'secondary'}>
                      {receitaEditando.ativo !== false ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>

                {/* Lista de insumos */}
                {receitaEditando.insumos && receitaEditando.insumos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insumos</h3>
                    </div>
                    <div className="space-y-2">
                      {receitaEditando.insumos.map((insumo) => (
                        <div 
                          key={insumo.id}
                          className={`p-3 rounded-lg border ${
                            insumo.is_chefe 
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {insumo.is_chefe && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{insumo.nome}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({insumo.codigo})</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {insumo.quantidade_necessaria} {insumo.unidade_medida}
                              </span>
                              {insumo.is_chefe && (
                                <span className="block text-xs text-yellow-600 dark:text-yellow-400">
                                  Insumo Principal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setModalVisualizarReceita(false)}
                className="modal-button-secondary"
              >
                Fechar
              </Button>
              {receitaEditando && (
                <Button
                  onClick={() => {
                    setModalVisualizarReceita(false)
                    editarReceita(receitaEditando)
                  }}
                  className="modal-button-primary"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Insumo */}
        <Dialog open={modalEditarInsumo} onOpenChange={setModalEditarInsumo}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit3 className="w-5 h-5" />
                Editar Insumo
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Modifique as informações do insumo selecionado.
              </DialogDescription>
            </DialogHeader>

            {insumoEditando && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-codigo" className="text-gray-700 dark:text-gray-300">
                      Código
                    </Label>
                    <Input
                      id="edit-codigo"
                      value={insumoEditando.codigo}
                      onChange={(e) => setInsumoEditando({...insumoEditando, codigo: e.target.value})}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Ex: i0001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-nome" className="text-gray-700 dark:text-gray-300">
                      Nome do Insumo *
                    </Label>
                    <Input
                      id="edit-nome"
                      value={insumoEditando.nome}
                      onChange={(e) => setInsumoEditando({...insumoEditando, nome: e.target.value})}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Nome do insumo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-categoria" className="text-gray-700 dark:text-gray-300">
                      Categoria
                    </Label>
                    <Select 
                      value={insumoEditando.categoria} 
                      onValueChange={(value) => setInsumoEditando({...insumoEditando, categoria: value})}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="cozinha">Cozinha</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="bebidas">Bebidas</SelectItem>
                        <SelectItem value="descartaveis">Descartáveis</SelectItem>
                        <SelectItem value="limpeza">Limpeza</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-unidade" className="text-gray-700 dark:text-gray-300">
                      Unidade de Medida
                    </Label>
                    <Select 
                      value={insumoEditando.unidade_medida} 
                      onValueChange={(value) => setInsumoEditando({...insumoEditando, unidade_medida: value})}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="g">Gramas (g)</SelectItem>
                        <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="l">Litros (l)</SelectItem>
                        <SelectItem value="un">Unidades (un)</SelectItem>
                        <SelectItem value="cx">Caixas (cx)</SelectItem>
                        <SelectItem value="pct">Pacotes (pct)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-1">
                    <Label htmlFor="edit-custo" className="text-gray-700 dark:text-gray-300">
                      Custo Unitário (R$)
                    </Label>
                    <Input
                      id="edit-custo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={insumoEditando.custo_unitario || ''}
                      onChange={(e) => setInsumoEditando({
                        ...insumoEditando, 
                        custo_unitario: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-observacoes" className="text-gray-700 dark:text-gray-300">
                    Observações
                  </Label>
                  <Textarea
                    id="edit-observacoes"
                    value={insumoEditando.observacoes || ''}
                    onChange={(e) => setInsumoEditando({...insumoEditando, observacoes: e.target.value})}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="Observações adicionais sobre o insumo..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => {
                  setModalEditarInsumo(false)
                  setInsumoEditando(null)
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarEdicaoInsumo}
                disabled={!insumoEditando?.nome.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Receita */}
        <Dialog open={modalEditarReceita} onOpenChange={setModalEditarReceita}>
          <DialogContent className="max-w-4xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit3 className="w-5 h-5" />
                Editar Receita
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Modifique as informações da receita selecionada.
              </DialogDescription>
            </DialogHeader>

            {receitaEditando && (
              <div className="space-y-6">
                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-receita-codigo" className="text-gray-700 dark:text-gray-300">
                      Código
                    </Label>
                    <Input
                      id="edit-receita-codigo"
                      value={receitaEditando.receita_codigo}
                      onChange={(e) => setReceitaEditando({...receitaEditando, receita_codigo: e.target.value})}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Ex: r0001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-receita-nome" className="text-gray-700 dark:text-gray-300">
                      Nome da Receita *
                    </Label>
                    <Input
                      id="edit-receita-nome"
                      value={receitaEditando.receita_nome}
                      onChange={(e) => setReceitaEditando({...receitaEditando, receita_nome: e.target.value})}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Nome da receita"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-receita-categoria" className="text-gray-700 dark:text-gray-300">
                      Categoria
                    </Label>
                    <Input
                      id="edit-receita-categoria"
                      value={receitaEditando.receita_categoria}
                      onChange={(e) => setReceitaEditando({...receitaEditando, receita_categoria: e.target.value})}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Ex: Pratos principais, Bebidas, Sobremesas"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-tipo-local" className="text-gray-700 dark:text-gray-300">
                      Local de Preparo
                    </Label>
                    <Select 
                      value={receitaEditando.tipo_local} 
                      onValueChange={(value: 'bar' | 'cozinha') => setReceitaEditando({...receitaEditando, tipo_local: value})}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione o local" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="cozinha">Cozinha</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-rendimento" className="text-gray-700 dark:text-gray-300">
                      Rendimento Esperado (g)
                    </Label>
                    <Input
                      id="edit-rendimento"
                      type="number"
                      min="0"
                      value={receitaEditando.rendimento_esperado || ''}
                      onChange={(e) => setReceitaEditando({
                        ...receitaEditando, 
                        rendimento_esperado: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="Ex: 500"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      Status
                    </Label>
                    <Select 
                      value={receitaEditando.ativo !== false ? 'true' : 'false'} 
                      onValueChange={(value) => setReceitaEditando({...receitaEditando, ativo: value === 'true'})}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="true">Ativa</SelectItem>
                        <SelectItem value="false">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-observacoes-receita" className="text-gray-700 dark:text-gray-300">
                    Observações
                  </Label>
                  <Textarea
                    id="edit-observacoes-receita"
                    value={receitaEditando.observacoes || ''}
                    onChange={(e) => setReceitaEditando({...receitaEditando, observacoes: e.target.value})}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="Observações adicionais sobre a receita..."
                    rows={3}
                  />
                </div>

                {/* Edição de insumos da receita */}
                {receitaEditando.insumos && receitaEditando.insumos.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insumos da Receita</h3>
                      </div>
                      <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                        {receitaEditando.insumos.length} {receitaEditando.insumos.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto">
                      <div className="space-y-3">
                        {receitaEditando.insumos.map((insumo, index) => (
                          <div 
                            key={insumo.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              insumo.is_chefe 
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Info do insumo */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {insumo.is_chefe && (
                                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                  )}
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {insumo.nome}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    ({insumo.codigo})
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Quantidade */}
                                  <div>
                                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                                      Quantidade ({insumo.unidade_medida})
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={insumo.quantidade_necessaria || ''}
                                      onChange={(e) => {
                                        const newInsumos = [...receitaEditando.insumos!]
                                        newInsumos[index] = {
                                          ...newInsumos[index],
                                          quantidade_necessaria: parseFloat(e.target.value) || 0
                                        }
                                        setReceitaEditando({
                                          ...receitaEditando,
                                          insumos: newInsumos
                                        })
                                      }}
                                      className="h-8 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                      placeholder="0.0"
                                    />
                                  </div>

                                  {/* Checkbox insumo chefe */}
                                  <div className="flex items-center space-x-2 pt-4">
                                    <Checkbox
                                      checked={insumo.is_chefe || false}
                                      onCheckedChange={(checked) => {
                                        const newInsumos = [...receitaEditando.insumos!]
                                        // Se marcando como chefe, desmarcar todos os outros
                                        if (checked) {
                                          newInsumos.forEach((item, i) => {
                                            item.is_chefe = i === index
                                          })
                                        } else {
                                          // Se desmarcando, apenas desmarcar este
                                          newInsumos[index].is_chefe = false
                                        }
                                        setReceitaEditando({
                                          ...receitaEditando,
                                          insumos: newInsumos
                                        })
                                      }}
                                      className="border-gray-300 dark:border-gray-600"
                                    />
                                    <Label 
                                      className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                    >
                                      Insumo Chefe
                                    </Label>
                                  </div>
                                </div>
                              </div>

                              {/* Botão remover */}
                              <Button
                                onClick={() => {
                                  const newInsumos = receitaEditando.insumos!.filter((_, i) => i !== index)
                                  setReceitaEditando({
                                    ...receitaEditando,
                                    insumos: newInsumos
                                  })
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Badge do status */}
                            {insumo.is_chefe && (
                              <div className="mt-2 flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Ingrediente Principal
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Mensagem se não tem insumo chefe */}
                        {receitaEditando.insumos.length > 0 && !receitaEditando.insumos.some(i => i.is_chefe) && (
                          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-700 dark:text-amber-300">
                              Selecione pelo menos um insumo como principal (chefe)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col items-stretch gap-3">
              {/* Mensagem de requisitos */}
              {receitaEditando && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="font-medium mb-1">Requisitos para salvar:</div>
                  <ul className="space-y-1">
                    <li className={`flex items-center gap-1 ${
                      receitaEditando.receita_nome.trim() 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        receitaEditando.receita_nome.trim() ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      Nome da receita preenchido
                    </li>
                    <li className={`flex items-center gap-1 ${
                      receitaEditando.insumos?.length 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        receitaEditando.insumos?.length ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      Pelo menos um insumo na receita
                    </li>
                    <li className={`flex items-center gap-1 ${
                      receitaEditando.insumos?.some(i => i.is_chefe) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        receitaEditando.insumos?.some(i => i.is_chefe) ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      Um insumo marcado como chefe
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setModalEditarReceita(false)
                    setReceitaEditando(null)
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={salvarEdicaoReceita}
                  disabled={
                    !receitaEditando?.receita_nome.trim() || 
                    !receitaEditando?.insumos?.length ||
                    !receitaEditando?.insumos?.some(i => i.is_chefe)
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
} 