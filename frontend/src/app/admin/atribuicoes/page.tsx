'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useAssignments, formatarTipoAtribuicao, formatarFrequencia, formatarHorarios } from '@/hooks/useAssignments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Target,
  TrendingUp,
  Award
} from 'lucide-react'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AtribuicoesPage() {
  const { setPageTitle } = usePageTitle()
  const [activeTab, setActiveTab] = useState('atribuicoes')
  const [searchTerm, setSearchTerm] = useState('')
  const [filtros, setFiltros] = useState({
    tipo: '',
    ativo: '',
    setor: '',
    cargo: ''
  })

  const {
    atribuicoes,
    loading,
    error,
    estatisticas,
    paginacao,
    carregarAtribuicoes,
    excluirAtribuicao
  } = useAssignments()

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    carregarAtribuicoes()
  }, [])

  useEffect(() => {
    setPageTitle('Sistema de Atribuições')
    return () => setPageTitle('')
  }, [setPageTitle])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleSearch = () => {
    const filtrosAtivos: any = {
      ...filtros,
      search: searchTerm
    }
    
    // Converter string para boolean se necessário
    if (filtrosAtivos.ativo === 'true') {
      filtrosAtivos.ativo = true
    } else if (filtrosAtivos.ativo === 'false') {
      filtrosAtivos.ativo = false
    } else {
      delete filtrosAtivos.ativo
    }
    
    // Remover campos vazios
    Object.keys(filtrosAtivos).forEach(key => {
      if (!filtrosAtivos[key] && filtrosAtivos[key] !== false) {
        delete filtrosAtivos[key]
      }
    })

    carregarAtribuicoes(filtrosAtivos)
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a atribuição "${nome}"?`)) return

    const sucesso = await excluirAtribuicao(id)
    if (sucesso) {
      alert('Atribuição excluída com sucesso!')
    }
  }

  const limparFiltros = () => {
    setSearchTerm('')
    setFiltros({
      tipo: '',
      ativo: '',
      setor: '',
      cargo: ''
    })
    carregarAtribuicoes()
  }

  // =====================================================
  // COMPONENTES
  // =====================================================

  const Header = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <p className="text-gray-600 mt-1">
          Gerencie atribuições automáticas de checklists
        </p>
      </div>
      <Button 
        onClick={() => window.location.href = '/admin/atribuicoes/nova'}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nova Atribuição
      </Button>
    </div>
  )

  const EstatisticasCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Atribuições
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {estatisticas?.total_atribuicoes || 0}
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ativas
              </p>
              <p className="text-2xl font-bold text-green-600">
                {estatisticas?.atribuicoes_ativas || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Agendamentos
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {estatisticas?.total_agendamentos || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Taxa Conclusão
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {estatisticas?.taxa_conclusao_geral || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const FiltrosEBusca = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por checklist, funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filtros.tipo} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de atribuição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="funcionario_especifico">Funcionário Específico</SelectItem>
                <SelectItem value="cargo">Por Cargo</SelectItem>
                <SelectItem value="setor">Por Setor</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.ativo} onValueChange={(value) => setFiltros(prev => ({ ...prev, ativo: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Ativas</SelectItem>
                <SelectItem value="false">Inativas</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>

            <Button onClick={limparFiltros} variant="ghost">
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TabelaAtribuicoes = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Atribuições Configuradas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        ) : atribuicoes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma atribuição encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira atribuição para automatizar checklists
            </p>
            <Button 
              onClick={() => window.location.href = '/admin/atribuicoes/nova'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Atribuição
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {atribuicoes.map((atribuicao) => (
              <AtribuicaoCard key={atribuicao.id} atribuicao={atribuicao} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const AtribuicaoCard = ({ atribuicao, onDelete }: any) => (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {atribuicao.checklist?.nome}
            </h3>
            <Badge variant={atribuicao.ativo ? 'default' : 'secondary'}>
              {atribuicao.ativo ? 'Ativa' : 'Inativa'}
            </Badge>
            <Badge variant="outline">
              {formatarTipoAtribuicao(atribuicao.tipo_atribuicao)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
            <div>
              <span className="font-medium">Frequência:</span> {formatarFrequencia(atribuicao.frequencia)}
            </div>
            <div>
              <span className="font-medium">Horários:</span> {formatarHorarios(atribuicao.configuracao_frequencia?.horarios || [])}
            </div>
            <div>
              <span className="font-medium">Setor:</span> {atribuicao.checklist?.setor || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Criado por:</span> {atribuicao.criado_por_usuario?.nome}
            </div>
          </div>

          {atribuicao.funcionario && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Funcionário:</span> {atribuicao.funcionario.nome} ({atribuicao.funcionario.cargo})
            </div>
          )}

          {atribuicao.cargo && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Cargo alvo:</span> {atribuicao.cargo}
            </div>
          )}

          {atribuicao.setor && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Setor alvo:</span> {atribuicao.setor}
            </div>
          )}

          {atribuicao.estatisticas && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>{atribuicao.estatisticas.total_agendados} agendados</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{atribuicao.estatisticas.concluidos} concluídos</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{atribuicao.estatisticas.atrasados} atrasados</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-purple-500" />
                <span>{atribuicao.estatisticas.taxa_conclusao}% conclusão</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = `/admin/atribuicoes/${atribuicao.id}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = `/admin/atribuicoes/${atribuicao.id}/editar`}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDelete(atribuicao.id, atribuicao.checklist?.nome)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  const DashboardPreview = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Dashboard de Produtividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Dashboard de Produtividade
          </h3>
          <p className="text-gray-600 mb-4">
            Visualize métricas detalhadas de desempenho e ranking de funcionários
          </p>
          <Button 
            onClick={() => window.location.href = '/admin/dashboard/produtividade'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Abrir Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erro: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Header />
      <EstatisticasCards />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="atribuicoes">
            <Users className="w-4 h-4 mr-2" />
            Atribuições
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atribuicoes" className="space-y-6">
          <FiltrosEBusca />
          <TabelaAtribuicoes />
        </TabsContent>

        <TabsContent value="dashboard">
          <DashboardPreview />
        </TabsContent>
      </Tabs>
    </div>
  )
} 