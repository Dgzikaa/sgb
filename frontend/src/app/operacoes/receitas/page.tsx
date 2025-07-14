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
  Target
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
    codigo: '',
    nome: '',
    unidade_medida: 'g',
    categoria: 'cozinha',
    observacoes: ''
  })
  const [buscaInsumos, setBuscaInsumos] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null)
  const [modalEditarInsumo, setModalEditarInsumo] = useState(false)

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
  const [buscaReceitas, setBuscaReceitas] = useState('')
  const [receitaEditando, setReceitaEditando] = useState<Receita | null>(null)
  const [modalCriarReceita, setModalCriarReceita] = useState(false)
  const [modalEditarReceita, setModalEditarReceita] = useState(false)

  useEffect(() => {
    setPageTitle('📋 Receitas e Insumos')
    return () => setPageTitle('')
  }, [setPageTitle])

  // Mock data para demonstração
  useEffect(() => {
    setInsumos([
      {
        id: 1,
        codigo: 'i0001',
        nome: 'Amaretto',
        categoria: 'cozinha',
        custo_unitario: 25.50,
        unidade_medida: 'g',
        observacoes: 'Ingrediente especial'
      }
    ])
  }, [])

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

  const salvarInsumo = async () => {
    if (!novoInsumo.codigo || !novoInsumo.nome) {
      toast.error('Erro', 'Código e nome são obrigatórios')
      return
    }

    setIsLoading(true)
    try {
      // Mock - aqui faria a chamada à API
      const novoId = Date.now()
      const insumo: Insumo = {
        id: novoId,
        ...novoInsumo,
        custo_unitario: novoInsumo.custo_unitario || 0
      }
      
      setInsumos(prev => [...prev, insumo])
      
      // Reset form
      setNovoInsumo({
        codigo: '',
        nome: '',
        unidade_medida: 'g',
        categoria: 'cozinha',
        observacoes: ''
      })
      
      toast.success('Sucesso!', 'Insumo cadastrado com sucesso')
    } catch (error) {
      toast.error('Erro', 'Falha ao salvar insumo')
    } finally {
      setIsLoading(false)
    }
  }

  const abrirModalEditarInsumo = (insumo: Insumo) => {
    setInsumoEditando(insumo)
    setModalEditarInsumo(true)
  }

  const excluirInsumo = async (insumo: Insumo) => {
    const confirmed = await confirmDelete(
      insumo.nome,
      async () => {
        setInsumos(prev => prev.filter(i => i.id !== insumo.id))
        toast.success('Sucesso!', 'Insumo excluído com sucesso')
      }
    )
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger 
              value="insumos" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300"
            >
              <Package className="w-4 h-4" />
              Insumos ({insumos.length})
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
                    <Label className="text-gray-700 dark:text-gray-300">Código *</Label>
                    <Input
                      value={novoInsumo.codigo}
                      onChange={(e) => setNovoInsumo(prev => ({ ...prev, codigo: e.target.value }))}
                      placeholder="Ex: i0001"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
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
                        <SelectItem value="un">Unidades (un)</SelectItem>
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
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
                    {insumosFiltrados.map((insumo) => (
                      <div 
                        key={insumo.id}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/25 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Badge 
                            variant="outline" 
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            {insumo.codigo}
                          </Badge>
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receitas" className="space-y-6">
            {/* Receitas Tab - será implementado */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <ChefHat className="w-5 h-5" />
                  Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ChefHat className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Em desenvolvimento
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    A funcionalidade de receitas estará disponível em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 