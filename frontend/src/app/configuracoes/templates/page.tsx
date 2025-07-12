'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, Download, BookOpen, Settings, Trash2, Edit, Eye, Clock, Users } from 'lucide-react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface Template {
  id: string
  nome: string
  descricao?: string
  categoria: string
  setor: string
  tipo: string
  frequencia: string
  tempo_estimado: number
  publico: boolean
  predefinido: boolean
  criado_em: string
  criado_por: {
    nome: string
    email: string
  }
  template_tags?: Array<{
    template_tags: {
      nome: string
      cor: string
    }
  }>
  estatisticas?: {
    total_usos: number
    usos_completados: number
    usos_em_andamento: number
  }
}

interface Estatisticas {
  total: number
  por_categoria: Record<string, number>
  publicos: number
  predefinidos: number
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros e busca
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [setorFiltro, setSetorFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [publicoFiltro, setPublicoFiltro] = useState('')
  const [predefinidoFiltro, setPredefinidoFiltro] = useState('')

  // Estado de instalação
  const [instalandoPredefinidos, setInstalandoPredefinidos] = useState(false)

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    carregarTemplates()
  }, [busca, categoriaFiltro, setorFiltro, tipoFiltro, publicoFiltro, predefinidoFiltro])

  // =====================================================
  // FUNÇÕES
  // =====================================================

  const carregarTemplates = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (busca) params.append('busca', busca)
      if (categoriaFiltro) params.append('categoria', categoriaFiltro)
      if (setorFiltro) params.append('setor', setorFiltro)
      if (tipoFiltro) params.append('tipo', tipoFiltro)
      if (publicoFiltro) params.append('publico', publicoFiltro)
      if (predefinidoFiltro) params.append('predefinido', predefinidoFiltro)

      const response = await api.get(`/api/templates?${params.toString()}`)
      
      if (response.success) {
        setTemplates(response.data)
        setEstatisticas(response.estatisticas)
      } else {
        setError(response.error || 'Erro ao carregar templates')
      }
    } catch (err: any) {
      console.error('Erro ao carregar templates:', err)
      setError('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const instalarTemplatesPredefinidos = async () => {
    try {
      setInstalandoPredefinidos(true)
      
      const response = await api.post('/api/templates', {
        action: 'install_predefined'
      })
      
      if (response.success) {
        await carregarTemplates() // Recarregar lista
        alert(response.message)
      } else {
        alert(response.error || 'Erro ao instalar templates')
      }
    } catch (err: any) {
      console.error('Erro ao instalar templates:', err)
      alert('Erro ao instalar templates predefinidos')
    } finally {
      setInstalandoPredefinidos(false)
    }
  }

  const deletarTemplate = async (template: Template) => {
    if (!confirm(`Tem certeza que deseja deletar o template "${template.nome}"?`)) {
      return
    }

    try {
      const response = await api.delete(`/api/templates/${template.id}`)
      
      if (response.success) {
        await carregarTemplates()
        alert('Template deletado com sucesso')
      } else {
        alert(response.error || 'Erro ao deletar template')
      }
    } catch (err: any) {
      console.error('Erro ao deletar template:', err)
      alert('Erro ao deletar template')
    }
  }

  const criarChecklistAPartirDeTemplate = (template: Template) => {
                router.push(`/configuracoes/checklists/builder/novo?template=${template.id}`)
  }

  const editarTemplate = (template: Template) => {
                router.push(`/configuracoes/templates/editor/${template.id}`)
  }

  const visualizarTemplate = (template: Template) => {
                router.push(`/configuracoes/templates/preview/${template.id}`)
  }

  const limparFiltros = () => {
    setBusca('')
    setCategoriaFiltro('')
    setSetorFiltro('')
    setTipoFiltro('')
    setPublicoFiltro('')
    setPredefinidoFiltro('')
  }

  // =====================================================
  // UTILITÁRIOS DE RENDERIZAÇÃO
  // =====================================================

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      limpeza: 'bg-blue-100 text-blue-800',
      seguranca: 'bg-red-100 text-red-800',
      qualidade: 'bg-green-100 text-green-800',
      manutencao: 'bg-yellow-100 text-yellow-800',
      abertura: 'bg-purple-100 text-purple-800',
      fechamento: 'bg-indigo-100 text-indigo-800',
      auditoria: 'bg-gray-100 text-gray-800',
      geral: 'bg-orange-100 text-orange-800'
    }
    return colors[categoria] || 'bg-gray-100 text-gray-800'
  }

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, any> = {
      abertura: '🌅',
      fechamento: '🌙',
      manutencao: '🔧',
      qualidade: '✅',
      seguranca: '🛡️',
      limpeza: '🧹',
      auditoria: '📋'
    }
    return icons[tipo] || '📋'
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando templates...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={carregarTemplates} className="mt-2">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <p className="text-gray-600 mt-1">
            Gerencie modelos prontos e crie templates personalizados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
                          onClick={() => router.push('/configuracoes/templates/editor/novo')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Template
          </Button>
          <Button
            onClick={instalarTemplatesPredefinidos}
            disabled={instalandoPredefinidos}
            variant="outline"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {instalandoPredefinidos ? 'Instalando...' : 'Instalar Predefinidos'}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Públicos</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.publicos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Predefinidos</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.predefinidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Filter className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categorias</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(estatisticas.por_categoria).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="limpeza">Limpeza</SelectItem>
                <SelectItem value="seguranca">Segurança</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="abertura">Abertura</SelectItem>
                <SelectItem value="fechamento">Fechamento</SelectItem>
                <SelectItem value="auditoria">Auditoria</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Setor"
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
            />

            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="abertura">Abertura</SelectItem>
                <SelectItem value="fechamento">Fechamento</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="seguranca">Segurança</SelectItem>
                <SelectItem value="limpeza">Limpeza</SelectItem>
                <SelectItem value="auditoria">Auditoria</SelectItem>
              </SelectContent>
            </Select>

            <Select value={publicoFiltro} onValueChange={setPublicoFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Público" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Públicos</SelectItem>
                <SelectItem value="false">Privados</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                onClick={limparFiltros} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTipoIcon(template.tipo)}</span>
                  <div>
                    <CardTitle className="text-lg">{template.nome}</CardTitle>
                    {template.descricao && (
                      <p className="text-sm text-gray-600 mt-1">
                        {template.descricao}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getCategoriaColor(template.categoria)}>
                  {template.categoria}
                </Badge>
                <Badge variant="outline">{template.setor}</Badge>
                {template.predefinido && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Sistema
                  </Badge>
                )}
                {template.publico && (
                  <Badge className="bg-green-100 text-green-800">
                    Público
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{template.tempo_estimado} min • {template.frequencia}</span>
                </div>
                
                {template.estatisticas && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{template.estatisticas.total_usos} usos</span>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Por: {template.criado_por.nome}
                </div>
              </div>

              {/* Tags */}
              {template.template_tags && template.template_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.template_tags.map((tagRel, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs"
                    >
                      {tagRel.template_tags.nome}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => criarChecklistAPartirDeTemplate(template)}
                  size="sm"
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Usar
                </Button>
                
                <Button
                  onClick={() => visualizarTemplate(template)}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                {!template.predefinido && (
                  <>
                    <Button
                      onClick={() => editarTemplate(template)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => deletarTemplate(template)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {busca || categoriaFiltro || setorFiltro || tipoFiltro
              ? 'Tente ajustar os filtros ou criar um novo template.'
              : 'Comece criando seu primeiro template ou instalando os predefinidos.'
            }
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push('/configuracoes/templates/editor/novo')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Template
            </Button>
            <Button onClick={instalarTemplatesPredefinidos} variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Instalar Predefinidos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 