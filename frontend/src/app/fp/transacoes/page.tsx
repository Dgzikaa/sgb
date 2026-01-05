'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Receipt, Plus, Edit2, Trash2, ArrowLeft, TrendingUp, TrendingDown, Calendar, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { fetchFP } from '@/lib/api-fp'

interface Transacao {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  conta_id: string
  conta?: any
  categoria?: any
  observacoes?: string
  tags?: string[]
  categorizada: boolean
  created_at: string
}

interface Conta {
  id: string
  nome: string
  banco: string
  cor: string
}

interface Categoria {
  id: string
  nome: string
  icone: string
  cor: string
  tipo: string
  origem?: string
}

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [filtroContaId, setFiltroContaId] = useState<string>('')
  const [busca, setBusca] = useState('')
  
  const [formData, setFormData] = useState({
    id: '',
    descricao: '',
    valor: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    data: new Date().toISOString().split('T')[0],
    conta_id: '',
    categoria_id: '',
    categoria_origem: '',
    observacoes: '',
    tags: [] as string[]
  })

  const resetForm = () => {
    setFormData({
      id: '',
      descricao: '',
      valor: '',
      tipo: 'despesa',
      data: new Date().toISOString().split('T')[0],
      conta_id: '',
      categoria_id: '',
      categoria_origem: '',
      observacoes: '',
      tags: []
    })
  }

  const fetchTransacoes = async () => {
    try {
      const response = await fetchFP('/api/fp/transacoes')
      const result = await response.json()
      
      if (result.success) {
        setTransacoes(result.data)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar transações')
    }
  }

  const fetchContas = async () => {
    try {
      const response = await fetchFP('/api/fp/contas')
      const result = await response.json()
      
      if (result.success) {
        setContas(result.data)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar contas')
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetchFP('/api/fp/categorias')
      const result = await response.json()
      
      if (result.success) {
        setCategorias(result.data)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar categorias')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTransacoes(), fetchContas(), fetchCategorias()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetchFP('/api/fp/transacoes', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Transação criada com sucesso!')
        setModalOpen(false)
        resetForm()
        fetchTransacoes()
        fetchContas() // Atualizar saldos
      } else {
        toast.error('Erro ao criar transação', { description: result.error })
      }
    } catch (error: any) {
      toast.error('Erro de conexão', { description: error.message })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const response = await fetchFP(`/api/fp/transacoes?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Transação excluída!')
        fetchTransacoes()
        fetchContas()
      } else {
        toast.error('Erro ao excluir', { description: result.error })
      }
    } catch (error: any) {
      toast.error('Erro de conexão')
    }
  }

  // Filtrar transações
  const transacoesFiltradas = transacoes.filter((t) => {
    if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false
    if (filtroContaId && t.conta_id !== filtroContaId) return false
    if (busca && !t.descricao.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  // Calcular totais
  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0)

  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0)

  const saldo = totalReceitas - totalDespesas

  // Categorias filtradas por tipo
  const categoriasFiltradas = categorias.filter(
    (c) => c.tipo === formData.tipo
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/fp" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {transacoesFiltradas.length} transações
            </p>
          </div>

          <Dialog open={modalOpen} onOpenChange={(open) => {
            setModalOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4 flex-shrink-0">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  ✨ Nova Transação
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 mt-2">
                  Registre uma receita ou despesa
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Tipo <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value, categoria_id: '', categoria_origem: '' })}>
                      <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        <SelectItem value="despesa">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            Despesa
                          </div>
                        </SelectItem>
                        <SelectItem value="receita">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            Receita
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Descrição <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Almoço no restaurante"
                      required
                      className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Valor (R$) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0,00"
                      required
                      className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                      className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Conta <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.conta_id} onValueChange={(value) => setFormData({ ...formData, conta_id: value })}>
                      <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: conta.cor }} />
                              {conta.nome} - {conta.banco}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Categoria
                    </label>
                    <Select 
                      value={formData.categoria_id} 
                      onValueChange={(value) => {
                        const cat = categorias.find(c => c.id === value)
                        setFormData({ 
                          ...formData, 
                          categoria_id: value,
                          categoria_origem: cat?.origem || ''
                        })
                      }}
                    >
                      <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 max-h-[300px]">
                        {categoriasFiltradas.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icone}</span>
                              {cat.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Observações
                    </label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Detalhes adicionais..."
                      rows={3}
                      className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 pt-4 pb-2 px-6 bg-white dark:bg-gray-800">
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setModalOpen(false)
                        resetForm()
                      }}
                      className="flex-1 h-12"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      ✨ Criar Transação
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Receitas</p>
                <p className="text-3xl font-bold mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Despesas</p>
                <p className="text-3xl font-bold mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-200" />
            </div>
          </Card>

          <Card className={`bg-gradient-to-br ${saldo >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white border-0 p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Saldo</p>
                <p className="text-3xl font-bold mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
                </p>
              </div>
              <Receipt className="w-12 h-12 text-white/60" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por descrição..."
                className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <Filter className="w-4 h-4 inline mr-1" />
                Tipo
              </label>
              <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Conta
              </label>
              <Select value={filtroContaId} onValueChange={(value) => setFiltroContaId(value)}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="">Todas as contas</SelectItem>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Transações */}
        {loading ? (
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando transações...</p>
          </div>
        ) : transacoesFiltradas.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece registrando sua primeira transação
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Transação
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {transacoesFiltradas.map((transacao) => (
              <Card key={transacao.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  {/* Categoria */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${transacao.categoria?.cor || '#9CA3AF'}20` }}
                  >
                    {transacao.categoria?.icone || '📦'}
                  </div>

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {transacao.descricao}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                      {transacao.conta && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: transacao.conta.cor }} />
                            {transacao.conta.nome}
                          </div>
                        </>
                      )}
                      {transacao.categoria && (
                        <>
                          <span>•</span>
                          <span>{transacao.categoria.nome}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-bold ${transacao.tipo === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transacao.tipo === 'receita' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transacao.valor)}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(transacao.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
