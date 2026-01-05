'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, ArrowLeft, Filter, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    contaId: '',
    categoriaId: '',
    tipo: ''
  })
  const [formData, setFormData] = useState({
    conta_id: '',
    categoria_id: '',
    tipo: 'despesa',
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: ''
  })

  useEffect(() => {
    fetchData()
  }, [filtros])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Build query string
      const params = new URLSearchParams()
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio)
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim)
      if (filtros.contaId) params.append('conta_id', filtros.contaId)
      if (filtros.categoriaId) params.append('categoria_id', filtros.categoriaId)
      if (filtros.tipo) params.append('tipo', filtros.tipo)

      const [transRes, contasRes, catRes] = await Promise.all([
        fetch(`/api/fp/transacoes?${params.toString()}`),
        fetch('/api/fp/contas'),
        fetch('/api/fp/categorias')
      ])

      const [transResult, contasResult, catResult] = await Promise.all([
        transRes.json(),
        contasRes.json(),
        catRes.json()
      ])

      if (transResult.success) setTransacoes(transResult.data || [])
      if (contasResult.success) setContas(contasResult.data || [])
      if (catResult.success) setCategorias(catResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = '/api/fp/transacoes'
      const method = editando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando ? { ...formData, id: editando.id } : formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editando ? 'Transação atualizada!' : 'Transação criada!')
        setModalOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao salvar transação')
    }
  }

  const handleEdit = (transacao: any) => {
    setEditando(transacao)
    setFormData({
      conta_id: transacao.conta_id,
      categoria_id: transacao.categoria_id || '',
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      data: transacao.data,
      observacoes: transacao.observacoes || ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return

    try {
      const response = await fetch(`/api/fp/transacoes?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Transação excluída!')
        fetchData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao excluir transação')
    }
  }

  const resetForm = () => {
    setFormData({
      conta_id: '',
      categoria_id: '',
      tipo: 'despesa',
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      observacoes: ''
    })
    setEditando(null)
  }

  const categoriasDoTipo = categorias.filter(c => c.tipo === formData.tipo)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/fp/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Transações
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gerencie suas receitas e despesas
                </p>
              </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={(open) => {
              setModalOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editando ? 'Editar Transação' : 'Nova Transação'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editando ? 'Atualize os dados da transação' : 'Adicione uma nova receita ou despesa'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo *
                    </label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value, categoria_id: '' })}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Conta *
                    </label>
                    <Select value={formData.conta_id} onValueChange={(value) => setFormData({ ...formData, conta_id: value })}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            {conta.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria
                    </label>
                    <Select value={formData.categoria_id} onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem categoria</SelectItem>
                        {categoriasDoTipo.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição *
                    </label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Almoço no restaurante"
                      required
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor (R$) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0.00"
                      required
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data *
                    </label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <Input
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Observações adicionais"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      {editando ? 'Atualizar' : 'Criar Transação'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setModalOpen(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              type="date"
              placeholder="Data Início"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="input-dark"
            />
            <Input
              type="date"
              placeholder="Data Fim"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="input-dark"
            />
            <Select value={filtros.contaId} onValueChange={(value) => setFiltros({ ...filtros, contaId: value })}>
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as contas</SelectItem>
                {contas.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtros.categoriaId} onValueChange={(value) => setFiltros({ ...filtros, categoriaId: value })}>
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Transações */}
        {loading ? (
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando transações...</p>
          </div>
        ) : transacoes.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {Object.values(filtros).some(f => f) 
                ? 'Tente ajustar os filtros ou adicione uma nova transação'
                : 'Comece adicionando sua primeira transação'}
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Transação
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {transacoes.map((t) => (
              <Card key={t.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: t.categoria?.cor || '#6B7280' }}
                      >
                        {t.tipo === 'receita' ? (
                          <ArrowUpRight className="w-6 h-6 text-white" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {t.descricao}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{t.conta?.nome || 'Sem conta'}</span>
                          {t.categoria && (
                            <>
                              <span>•</span>
                              <span>{t.categoria.nome}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`text-xl font-bold ${
                        t.tipo === 'receita' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {t.tipo === 'receita' ? '+' : '-'}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                      </p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(t)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(t.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
