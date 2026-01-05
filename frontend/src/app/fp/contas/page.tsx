'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Wallet, Plus, Edit2, Trash2, ArrowLeft, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ContasPage() {
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [formData, setFormData] = useState({
    nome: '',
    banco: '',
    tipo: 'corrente',
    saldo_inicial: '0',
    cor: '#3B82F6'
  })

  useEffect(() => {
    fetchContas()
  }, [])

  const fetchContas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fp/contas')
      const result = await response.json()
      
      if (result.success) {
        setContas(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editando ? '/api/fp/contas' : '/api/fp/contas'
      const method = editando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando ? { ...formData, id: editando.id } : formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editando ? 'Conta atualizada!' : 'Conta criada!')
        setModalOpen(false)
        resetForm()
        fetchContas()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao salvar conta')
    }
  }

  const handleEdit = (conta: any) => {
    setEditando(conta)
    setFormData({
      nome: conta.nome,
      banco: conta.banco,
      tipo: conta.tipo,
      saldo_inicial: conta.saldo_inicial.toString(),
      cor: conta.cor
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return

    try {
      const response = await fetch(`/api/fp/contas?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Conta excluída!')
        fetchContas()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao excluir conta')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      banco: '',
      tipo: 'corrente',
      saldo_inicial: '0',
      cor: '#3B82F6'
    })
    setEditando(null)
  }

  const cores = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#6B7280'
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/fp/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Minhas Contas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gerencie suas contas bancárias e cartões
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
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editando ? 'Editar Conta' : 'Nova Conta'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editando ? 'Atualize os dados da conta' : 'Adicione uma nova conta bancária ou cartão'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome da Conta *
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Conta Corrente Nubank"
                      required
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banco *
                    </label>
                    <Input
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      placeholder="Ex: Nubank"
                      required
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo *
                    </label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Saldo Inicial
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.saldo_inicial}
                      onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                      placeholder="0.00"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex gap-2">
                      {cores.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-8 h-8 rounded-full ${formData.cor === cor ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      {editando ? 'Atualizar' : 'Criar Conta'}
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
        </div>

        {/* Lista de Contas */}
        {loading ? (
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando contas...</p>
          </div>
        ) : contas.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece adicionando sua primeira conta bancária ou cartão
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Conta
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contas.map((conta) => (
              <Card key={conta.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: conta.cor }}
                      >
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {conta.nome}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {conta.banco}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Saldo Atual
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.saldo_atual)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                        Tipo: {conta.tipo.charAt(0).toUpperCase() + conta.tipo.slice(1)}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(conta)}
                        className="flex-1"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(conta.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
