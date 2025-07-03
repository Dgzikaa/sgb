'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface Insumo {
  id?: number
  codigo: string
  nome: string
  unidade_medida: string
  categoria: string
  observacoes?: string
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
  rendimento_esperado?: number
  tipo_local: string
  insumos: {
    id: number
    codigo: string
    nome: string
    quantidade_necessaria: number
    unidade_medida: string
    categoria: string
    is_chefe: boolean
  }[]
}

interface NovaReceita {
  receita_codigo: string
  receita_nome: string
  receita_categoria: string
  tipo_local: 'bar' | 'cozinha'
  rendimento_esperado: number
  tempo_preparo_min: number
  instrucoes: string
  insumos: {
    insumo_id: number
    quantidade_necessaria: number
    is_chefe: boolean
  }[]
}

export default function ReceitasPage() {
  const { selectedBar } = useBar()
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
    insumos: []
  })

  // Estados para busca de insumos
  const [buscaInsumos, setBuscaInsumos] = useState<{[key: number]: string}>({})
  const [dropdownAberto, setDropdownAberto] = useState<{[key: number]: boolean}>({})

  // Estados para Modal de Edição
  const [modalEditarInsumo, setModalEditarInsumo] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null)
  const [modalConfirmarExclusao, setModalConfirmarExclusao] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  // Carregar dados
  useEffect(() => {
    if (selectedBar?.id) {
      carregarInsumos()
      carregarReceitas()
      carregarProximoCodigo()
    }
  }, [selectedBar?.id])

  const carregarProximoCodigo = async () => {
    try {
      const response = await fetch('/api/cadastros/insumos-basicos/proximo-codigo')
      if (response.ok) {
        const data = await response.json()
        setNovoInsumo(prev => ({ ...prev, codigo: data.codigo }))
      }
    } catch (error) {
      console.error('❌ Erro ao carregar próximo código:', error)
    }
  }

  const carregarInsumos = async () => {
    try {
      const response = await fetch(`/api/cadastros/insumos-basicos?bar_id=${selectedBar?.id}`)
      if (response.ok) {
        const data = await response.json()
        setInsumos(data.insumos || [])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar insumos:', error)
    }
  }

  const carregarReceitas = async () => {
    try {
      // CORREÇÃO: Usar a nova API de receitas
      const response = await fetch(`/api/receitas?bar_id=${selectedBar?.id}`)
      if (response.ok) {
        const data = await response.json()
        setReceitas(data.receitas || [])
        console.log('✅ Receitas carregadas:', data.receitas?.length || 0)
      } else {
        console.error('❌ Erro na API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar receitas:', error)
    }
  }

  const salvarInsumo = async () => {
    if (!novoInsumo.codigo.trim() || !novoInsumo.nome.trim()) {
      alert('⚠️ Código e nome são obrigatórios!')
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
        alert('✅ Insumo salvo com sucesso!')
        limparFormularioInsumo()
        carregarInsumos()
        carregarProximoCodigo()
      } else {
        const error = await response.json()
        alert('❌ Erro: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro ao salvar insumo:', error)
      alert('❌ Erro ao salvar insumo')
    } finally {
      setIsLoading(false)
    }
  }

  const editarInsumoModal = async () => {
    if (!insumoEditando || !insumoEditando.codigo.trim() || !insumoEditando.nome.trim()) {
      alert('⚠️ Código e nome são obrigatórios!')
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
        alert('✅ Insumo atualizado com sucesso!')
        setModalEditarInsumo(false)
        setInsumoEditando(null)
        carregarInsumos()
      } else {
        const error = await response.json()
        alert('❌ Erro: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro ao editar insumo:', error)
      alert('❌ Erro ao editar insumo')
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
        alert('✅ Insumo excluído com sucesso!')
        setModalConfirmarExclusao(false)
        setModalEditarInsumo(false)
        setInsumoEditando(null)
        carregarInsumos()
      } else {
        const error = await response.json()
        alert('❌ Erro: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro ao excluir insumo:', error)
      alert('❌ Erro ao excluir insumo')
    } finally {
      setIsLoading(false)
    }
  }

  const criarNovaReceita = async () => {
    if (!novaReceita.receita_codigo.trim() || !novaReceita.receita_nome.trim()) {
      alert('⚠️ Código e nome da receita são obrigatórios!')
      return
    }

    if (novaReceita.insumos.length === 0) {
      alert('⚠️ Adicione pelo menos um insumo à receita!')
      return
    }

    const temChefe = novaReceita.insumos.some(i => i.is_chefe)
    if (!temChefe) {
      alert('⚠️ Selecione um insumo chefe para a receita!')
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
          rendimento_esperado: insumo.is_chefe ? novaReceita.rendimento_esperado : 0
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

      alert('✅ Receita criada com sucesso!')
      limparFormularioReceita()
      carregarReceitas()
    } catch (error) {
      console.error('❌ Erro ao criar receita:', error)
      alert('❌ Erro ao criar receita')
    } finally {
      setIsLoading(false)
    }
  }

  const limparFormularioInsumo = () => {
    setNovoInsumo({
      codigo: '',
      nome: '',
      unidade_medida: 'g',
      categoria: 'cozinha',
      observacoes: ''
    })
  }

  const limparFormularioReceita = () => {
    setNovaReceita({
      receita_codigo: '',
      receita_nome: '',
      receita_categoria: '',
      tipo_local: 'cozinha',
      rendimento_esperado: 0,
      tempo_preparo_min: 0,
      instrucoes: '',
      insumos: []
    })
    // Limpar estados de busca de insumos
    setBuscaInsumos({})
    setDropdownAberto({})
  }

  const abrirModalEditarInsumo = (insumo: Insumo) => {
    setInsumoEditando({ ...insumo })
    setModalEditarInsumo(true)
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
        <h1 className="text-3xl font-bold text-black mb-2">🧪 Gestão de Receitas</h1>
        <p className="text-gray-700">Cadastro de insumos e criação de receitas</p>
        <p className="text-gray-600 text-sm">
          Bar: <strong>{selectedBar.nome}</strong>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insumos">📦 Insumos ({insumos.length})</TabsTrigger>
          <TabsTrigger value="receitas">👨‍🍳 Receitas ({receitas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="insumos" className="space-y-6">
          {/* Formulário de Insumos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">➕ Novo Insumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold">Código *</Label>
                  <Input
                    value={novoInsumo.codigo}
                    onChange={(e) => setNovoInsumo(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: i0001"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold">Nome *</Label>
                  <Input
                    value={novoInsumo.nome}
                    onChange={(e) => setNovoInsumo(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Frango a passarinho"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold">Categoria</Label>
                  <Select 
                    value={novoInsumo.categoria} 
                    onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                      <SelectItem value="bar">🍺 Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black font-semibold">Unidade de Medida</Label>
                  <Select 
                    value={novoInsumo.unidade_medida} 
                    onValueChange={(value) => setNovoInsumo(prev => ({ ...prev, unidade_medida: value }))}
                  >
                    <SelectTrigger className="text-black font-medium border-2 border-gray-300">
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
                <div className="md:col-span-2">
                  <Button
                    onClick={carregarProximoCodigo}
                    variant="outline"
                    size="sm"
                    className="border-2 border-blue-300 text-blue-600 hover:text-blue-800"
                  >
                    🔄 Próximo Código
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-black font-semibold">Observações</Label>
                <Textarea
                  value={novoInsumo.observacoes || ''}
                  onChange={(e) => setNovoInsumo(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  className="text-black font-medium border-2 border-gray-300"
                />
              </div>

              <Button
                onClick={salvarInsumo}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {isLoading ? '⏳ Salvando...' : '💾 Salvar Insumo'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Insumos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">📋 Lista de Insumos</CardTitle>
            </CardHeader>
            <CardContent>
              {insumos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum insumo cadastrado ainda.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insumos.map((insumo) => (
                    <div 
                      key={insumo.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {insumo.codigo}
                        </Badge>
                        <Button
                          onClick={() => abrirModalEditarInsumo(insumo)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                        >
                          ✏️
                        </Button>
                      </div>
                      <h3 className="font-semibold text-black text-sm mb-1">{insumo.nome}</h3>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{insumo.categoria === 'bar' ? '🍺' : '🍽️'} {insumo.categoria}</span>
                        <span>{insumo.unidade_medida}</span>
                      </div>
                      {insumo.observacoes && (
                        <p className="text-xs text-gray-500 mt-2 italic">{insumo.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-6">
          {/* Formulário de Receitas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">➕ Nova Receita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold">Código da Receita *</Label>
                  <Input
                    value={novaReceita.receita_codigo}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_codigo: e.target.value }))}
                    placeholder="Ex: pc0001"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold">Nome da Receita *</Label>
                  <Input
                    value={novaReceita.receita_nome}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_nome: e.target.value }))}
                    placeholder="Ex: Frango a Passarinho"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-black font-semibold">Categoria</Label>
                  <Input
                    value={novaReceita.receita_categoria}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, receita_categoria: e.target.value }))}
                    placeholder="Ex: COZINHA - PREPAROS"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold">Local</Label>
                  <Select 
                    value={novaReceita.tipo_local} 
                    onValueChange={(value) => setNovaReceita(prev => ({ ...prev, tipo_local: value as 'bar' | 'cozinha' }))}
                  >
                    <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                      <SelectItem value="bar">🍺 Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black font-semibold">Rendimento Esperado (g)</Label>
                  <Input
                    type="number"
                    value={novaReceita.rendimento_esperado}
                    onChange={(e) => setNovaReceita(prev => ({ ...prev, rendimento_esperado: parseFloat(e.target.value) || 0 }))}
                    placeholder="Ex: 1000"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
              </div>

              {/* Insumos da Receita */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-black font-semibold">🧪 Insumos da Receita</Label>
                  <Button
                    onClick={adicionarInsumoReceita}
                    variant="outline"
                    size="sm"
                    className="border-2 border-green-300 text-green-600 hover:text-green-800"
                  >
                    ➕ Adicionar Insumo
                  </Button>
                </div>

                {novaReceita.insumos.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum insumo adicionado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {novaReceita.insumos.map((insumo, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                          <div className="relative">
                            <Input
                              type="text"
                              value={buscaInsumos[index] || ''}
                              onChange={(e) => {
                                setBuscaInsumos(prev => ({ ...prev, [index]: e.target.value }))
                                setDropdownAberto(prev => ({ ...prev, [index]: true }))
                              }}
                              placeholder="🔍 Buscar insumo por nome ou código..."
                              className="text-black font-medium border-2 border-gray-300 pr-10"
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
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 h-6 w-6 p-0"
                              >
                                ❌
                              </Button>
                            )}
                            
                                                         {dropdownAberto[index] && (
                               <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg border-2 border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                                 {filtrarInsumos(index).length > 0 ? (
                                   <>
                                     {!buscaInsumos[index] && insumos.length > 10 && (
                                       <div className="p-2 bg-blue-50 text-blue-700 text-xs text-center border-b border-gray-100">
                                         💡 Digite para filtrar entre {insumos.length} insumos
                                       </div>
                                     )}
                                     {filtrarInsumos(index).map((ins) => (
                                       <div
                                         key={ins.id}
                                         className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 transition-colors"
                                         onClick={() => selecionarInsumo(index, ins)}
                                       >
                                         <div className="font-semibold text-black text-sm">{ins.codigo} - {ins.nome}</div>
                                         <div className="text-xs text-gray-600">{ins.categoria} • {ins.unidade_medida}</div>
                                       </div>
                                     ))}
                                   </>
                                 ) : (
                                   <div className="p-4 text-center text-gray-500">
                                     🔍 Nenhum insumo encontrado para "{buscaInsumos[index]}"
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                          <div>
                            <Input
                              type="number"
                              placeholder="Quantidade"
                              value={insumo.quantidade_necessaria}
                              onChange={(e) => atualizarInsumoReceita(index, 'quantidade_necessaria', parseFloat(e.target.value) || 0)}
                              className="text-black font-medium border-2 border-gray-300"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => definirInsumoChefe(index)}
                              variant={insumo.is_chefe ? "default" : "outline"}
                              size="sm"
                              className={insumo.is_chefe ? "bg-red-600 hover:bg-red-700 text-white" : "border-red-300 text-red-600 hover:text-red-800"}
                            >
                              {insumo.is_chefe ? "👑 CHEFE" : "Tornar Chefe"}
                            </Button>
                          </div>
                          <div>
                            <Button
                              onClick={() => removerInsumoReceita(index)}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={criarNovaReceita}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full"
              >
                {isLoading ? '⏳ Criando...' : '🍽️ Criar Receita'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Receitas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">📋 Lista de Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              {receitas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma receita cadastrada ainda.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receitas.map((receita) => (
                    <div 
                      key={receita.receita_codigo}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge 
                          variant="outline" 
                          className={receita.tipo_local === 'bar' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}
                        >
                          {receita.tipo_local === 'bar' ? '🍺 Bar' : '🍽️ Cozinha'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-black text-sm mb-1">{receita.receita_nome}</h3>
                      <p className="text-xs text-gray-600 mb-2">{receita.receita_codigo}</p>
                      <p className="text-xs text-gray-600 mb-2">{receita.receita_categoria}</p>
                      <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                        <span>📏 {receita.rendimento_esperado || 0}g</span>
                        <span>🧪 {receita.insumos?.length || 0} insumos</span>
                      </div>
                      {receita.insumos && receita.insumos.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <strong>Insumo chefe:</strong> {
                            receita.insumos.find(i => i.is_chefe)?.nome || 'Não definido'
                          }
                        </div>
                      )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✏️ Editar Insumo</DialogTitle>
            <DialogDescription>
              Altere as informações do insumo ou exclua-o se necessário.
            </DialogDescription>
          </DialogHeader>
          
          {insumoEditando && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold">Código *</Label>
                  <Input
                    value={insumoEditando.codigo}
                    onChange={(e) => setInsumoEditando(prev => prev ? { ...prev, codigo: e.target.value } : null)}
                    className="text-black font-medium"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold">Nome *</Label>
                  <Input
                    value={insumoEditando.nome}
                    onChange={(e) => setInsumoEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                    className="text-black font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold">Categoria</Label>
                  <Select 
                    value={insumoEditando.categoria} 
                    onValueChange={(value) => setInsumoEditando(prev => prev ? { ...prev, categoria: value } : null)}
                  >
                    <SelectTrigger className="text-black font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cozinha">🍽️ Cozinha</SelectItem>
                      <SelectItem value="bar">🍺 Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black font-semibold">Unidade de Medida</Label>
                  <Select 
                    value={insumoEditando.unidade_medida} 
                    onValueChange={(value) => setInsumoEditando(prev => prev ? { ...prev, unidade_medida: value } : null)}
                  >
                    <SelectTrigger className="text-black font-medium">
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
                <Label className="text-black font-semibold">Observações</Label>
                <Textarea
                  value={insumoEditando.observacoes || ''}
                  onChange={(e) => setInsumoEditando(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                  className="text-black font-medium"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setModalConfirmarExclusao(true)}
              variant="destructive"
              disabled={isLoading}
            >
              🗑️ Excluir
            </Button>
            <Button
              onClick={() => setModalEditarInsumo(false)}
              variant="outline"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={editarInsumoModal}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '⏳ Salvando...' : '💾 Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={modalConfirmarExclusao} onOpenChange={setModalConfirmarExclusao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o insumo <strong>{insumoEditando?.nome}</strong>?
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              onClick={() => setModalConfirmarExclusao(false)}
              variant="outline"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={excluirInsumo}
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Excluindo...' : '🗑️ Sim, Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 