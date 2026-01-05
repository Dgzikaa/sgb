'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'despesa',
    cor: '#6B7280',
    icone: 'tag'
  })

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fp/categorias')
      const result = await response.json()
      
      if (result.success) {
        setCategorias(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = '/api/fp/categorias'
      const method = editando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando ? { ...formData, id: editando.id } : formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editando ? 'Categoria atualizada!' : 'Categoria criada!')
        setModalOpen(false)
        resetForm()
        fetchCategorias()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao salvar categoria')
    }
  }

  const handleEdit = (categoria: any) => {
    setEditando(categoria)
    setFormData({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor,
      icone: categoria.icone
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'despesa',
      cor: '#6B7280',
      icone: 'tag'
    })
    setEditando(null)
  }

  const cores = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#6B7280'
  ]

  const categoriasFiltradas = filtroTipo 
    ? categorias.filter(c => c.tipo === filtroTipo)
    : categorias

  const despesas = categorias.filter(c => c.tipo === 'despesa')
  const receitas = categorias.filter(c => c.tipo === 'receita')

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
                  Categorias
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Organize suas transações por categorias
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
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editando ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editando ? 'Atualize os dados da categoria' : 'Crie uma nova categoria para organizar suas transações'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome da Categoria *
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Alimentação"
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
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {cores.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-10 h-10 rounded-full ${formData.cor === cor ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      {editando ? 'Atualizar' : 'Criar Categoria'}
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

          {/* Filtro */}
          <div className="mt-4">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="max-w-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Categorias */}
        {loading ? (
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando categorias...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma categoria cadastrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece adicionando sua primeira categoria
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Categoria
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Despesas */}
            {(!filtroTipo || filtroTipo === 'despesa') && despesas.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Despesas ({despesas.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {despesas.map((categoria) => (
                    <Card 
                      key={categoria.id} 
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEdit(categoria)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: categoria.cor }}
                          >
                            <Tag className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {categoria.nome}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Despesa
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(categoria)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Receitas */}
            {(!filtroTipo || filtroTipo === 'receita') && receitas.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Receitas ({receitas.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {receitas.map((categoria) => (
                    <Card 
                      key={categoria.id} 
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEdit(categoria)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: categoria.cor }}
                          >
                            <Tag className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {categoria.nome}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Receita
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(categoria)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
