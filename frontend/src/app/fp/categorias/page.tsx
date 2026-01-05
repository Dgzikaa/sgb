'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tag, Plus, Edit2, Trash2, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { fetchFP } from '@/lib/api-fp'

interface Categoria {
  id: string
  nome: string
  tipo: 'receita' | 'despesa'
  icone: string
  cor: string
  ativa: boolean
  origem?: 'template' | 'customizada'
  customizada?: boolean
}

const icones = [
  '🍔', '🚗', '🏠', '💡', '💊', '📚', '🎮', '👔',
  '💄', '🐕', '✈️', '📈', '🏛️', '🛡️', '❤️', '📦',
  '💰', '💼', '📊', '🛒', '🏡', '🎁', '💸', '💵',
  '🍕', '🎬', '🎵', '⚽', '🎨', '🔧', '📱', '💻'
]

const cores = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C',
  '#6B7280', '#9CA3AF'
]

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    icone: icones[0],
    cor: cores[0],
    ativa: true,
  })

  const resetForm = () => {
    setFormData({
      id: '',
      nome: '',
      tipo: 'despesa',
      icone: icones[0],
      cor: cores[0],
      ativa: true,
    })
  }

  const fetchCategorias = async () => {
    setLoading(true)
    try {
      const result = await fetchFP('/api/fp/categorias')
      
      if (result.success) {
        setCategorias(result.data)
      } else {
        toast.error('Erro ao carregar categorias', { description: result.error })
      }
    } catch (error: any) {
      toast.error('Erro de conexão', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await fetchFP('/api/fp/categorias', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (result.success) {
        toast.success('Categoria criada com sucesso!')
        setModalOpen(false)
        resetForm()
        fetchCategorias()
      } else {
        toast.error('Erro ao criar categoria', { description: result.error })
      }
    } catch (error: any) {
      toast.error('Erro de conexão', { description: error.message })
    }
  }

  const categoriasFiltradas = categorias.filter((cat) => {
    if (filtroTipo === 'todos') return true
    return cat.tipo === filtroTipo
  })

  const categoriasReceitas = categoriasFiltradas.filter((c) => c.tipo === 'receita')
  const categoriasDespesas = categoriasFiltradas.filter((c) => c.tipo === 'despesa')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/fp" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorias</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {categorias.length} categorias disponíveis
              </p>
            </div>
          </div>

          <Dialog open={modalOpen} onOpenChange={(open) => {
            setModalOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4 flex-shrink-0">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  ✨ Nova Categoria
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 mt-2">
                  Crie uma categoria personalizada
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Streaming, Academia..."
                      required
                      className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Tipo <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Ícone
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {icones.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setFormData({ ...formData, icone: ic })}
                          className={`w-12 h-12 rounded-xl text-2xl transition-all hover:scale-110 ${
                            formData.icone === ic 
                              ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-blue-400 scale-110 shadow-lg bg-blue-50 dark:bg-blue-900/30' 
                              : 'hover:shadow-md bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Cor
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {cores.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${
                            formData.cor === cor 
                              ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-blue-400 scale-110 shadow-lg' 
                              : 'hover:shadow-md'
                          }`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
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
                      ✨ Criar Categoria
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filtroTipo === 'todos' ? 'default' : 'outline'}
            onClick={() => setFiltroTipo('todos')}
            className={filtroTipo === 'todos' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Todas ({categorias.length})
          </Button>
          <Button
            variant={filtroTipo === 'receita' ? 'default' : 'outline'}
            onClick={() => setFiltroTipo('receita')}
            className={filtroTipo === 'receita' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Receitas ({categorias.filter((c) => c.tipo === 'receita').length})
          </Button>
          <Button
            variant={filtroTipo === 'despesa' ? 'default' : 'outline'}
            onClick={() => setFiltroTipo('despesa')}
            className={filtroTipo === 'despesa' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Despesas ({categorias.filter((c) => c.tipo === 'despesa').length})
          </Button>
        </div>

        {loading ? (
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando categorias...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Receitas */}
            {(filtroTipo === 'todos' || filtroTipo === 'receita') && categoriasReceitas.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Receitas ({categoriasReceitas.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {categoriasReceitas.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all relative group"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${cat.cor}20` }}
                      >
                        {cat.icone}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                        {cat.nome}
                      </p>
                      {cat.customizada && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Customizada
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Despesas */}
            {(filtroTipo === 'todos' || filtroTipo === 'despesa') && categoriasDespesas.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Despesas ({categoriasDespesas.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {categoriasDespesas.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all relative group"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${cat.cor}20` }}
                      >
                        {cat.icone}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                        {cat.nome}
                      </p>
                      {cat.customizada && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Customizada
                        </span>
                      )}
                    </div>
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
