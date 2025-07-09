'use client'

import { useState, useEffect } from 'react'
import { useReportTemplates, useReportExecutions } from '@/hooks/useReports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Plus, 
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  Settings,
  Trash2,
  Play,
  Pause,
  MoreVertical,
  FileBarChart,
  FileSpreadsheet,
  Table,
  AlertCircle,
  TrendingUp,
  Users,
  Building
} from 'lucide-react'

/**
 * PÁGINA: Sistema de Relatórios Administrativo
 * 
 * Funcionalidades principais:
 * - Visualizar templates disponíveis
 * - Executar relatórios com filtros
 * - Acompanhar status das execuções
 * - Baixar relatórios prontos
 * - Gerenciar templates personalizados
 * - Dashboard de estatísticas
 */

export default function RelatoriosAdminPage() {
  const [activeTab, setActiveTab] = useState('executar')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busca, setBusca] = useState('')
  const [templateSelecionado, setTemplateSelecionado] = useState<any>(null)
  const [showExecuteDialog, setShowExecuteDialog] = useState(false)

  const {
    templates,
    loading: loadingTemplates,
    estatisticas: estatisticasTemplates,
    carregar: carregarTemplates,
    porCategoria,
    error: errorTemplates,
    limparErro: limparErroTemplates
  } = useReportTemplates()

  const {
    execucoes,
    loading: loadingExecucoes,
    executing,
    estatisticas: estatisticasExecucoes,
    carregar: carregarExecucoes,
    executar: executarRelatorio,
    baixar: baixarRelatorio,
    cancelar: cancelarExecucao,
    error: errorExecucoes,
    limparErro: limparErroExecucoes
  } = useReportExecutions()

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    carregarTemplates()
    carregarExecucoes()
  }, [])

  useEffect(() => {
    // Auto-refresh das execuções a cada 30 segundos
    const interval = setInterval(() => {
      carregarExecucoes()
    }, 30000)

    return () => clearInterval(interval)
  }, [carregarExecucoes])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleExecutarRelatorio = async (templateId: string, formato: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    const execucaoId = await executarRelatorio({
      template_id: templateId,
      formato,
      notificar_conclusao: true
    })

    if (execucaoId) {
      setShowExecuteDialog(false)
      alert('✅ Relatório enviado para processamento!')
    }
  }

  const handleBaixarRelatorio = async (execucaoId: string) => {
    await baixarRelatorio(execucaoId)
  }

  const filtrarTemplates = () => {
    let templatesFilter = templates

    if (filtroCategoria) {
      templatesFilter = templatesFilter.filter(t => t.categoria === filtroCategoria)
    }

    if (busca) {
      templatesFilter = templatesFilter.filter(t => 
        t.nome.toLowerCase().includes(busca.toLowerCase()) ||
        t.descricao?.toLowerCase().includes(busca.toLowerCase())
      )
    }

    return templatesFilter
  }

  // =====================================================
  // COMPONENTES
  // =====================================================

  const TemplateCard = ({ template }: { template: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {template.tipo_relatorio === 'tabular' && <FileText className="w-5 h-5 text-blue-600" />}
              {template.tipo_relatorio === 'dashboard' && <BarChart3 className="w-5 h-5 text-blue-600" />}
              {template.tipo_relatorio === 'grafico' && <TrendingUp className="w-5 h-5 text-blue-600" />}
              {template.tipo_relatorio === 'calendario' && <Calendar className="w-5 h-5 text-blue-600" />}
            </div>
            
            <div>
              <CardTitle className="text-lg">{template.nome}</CardTitle>
              {template.descricao && (
                <p className="text-sm text-gray-600 mt-1">{template.descricao}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge variant={template.publico ? 'default' : 'secondary'}>
              {template.publico ? 'Público' : 'Privado'}
            </Badge>
            <Badge variant="outline">
              {template.categoria}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {template.formatos_suportados?.includes('pdf') && (
              <Badge variant="outline" className="text-xs">
                <FileBarChart className="w-3 h-3 mr-1" />
                PDF
              </Badge>
            )}
            {template.formatos_suportados?.includes('excel') && (
              <Badge variant="outline" className="text-xs">
                <FileSpreadsheet className="w-3 h-3 mr-1" />
                Excel
              </Badge>
            )}
            {template.formatos_suportados?.includes('csv') && (
              <Badge variant="outline" className="text-xs">
                <Table className="w-3 h-3 mr-1" />
                CSV
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTemplateSelecionado(template)
                setShowExecuteDialog(true)
              }}
            >
              <Play className="w-3 h-3 mr-1" />
              Executar
            </Button>
            
            <Button size="sm" variant="ghost">
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ExecucaoCard = ({ execucao }: { execucao: any }) => {
    const getStatusIcon = () => {
      switch (execucao.status) {
        case 'pendente':
          return <Clock className="w-4 h-4 text-gray-500" />
        case 'processando':
          return <Loader className="w-4 h-4 text-blue-500 animate-spin" />
        case 'concluido':
          return <CheckCircle className="w-4 h-4 text-green-500" />
        case 'erro':
          return <XCircle className="w-4 h-4 text-red-500" />
        default:
          return <Clock className="w-4 h-4 text-gray-500" />
      }
    }

    const getStatusColor = () => {
      switch (execucao.status) {
        case 'pendente': return 'bg-gray-100 text-gray-700'
        case 'processando': return 'bg-blue-100 text-blue-700'
        case 'concluido': return 'bg-green-100 text-green-700'
        case 'erro': return 'bg-red-100 text-red-700'
        default: return 'bg-gray-100 text-gray-700'
      }
    }

    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon()}
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {execucao.template?.nome || 'Template removido'}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Solicitado por {execucao.solicitado_por_usuario?.nome} • 
                  {new Date(execucao.iniciado_em).toLocaleString('pt-BR')}
                </p>
                
                {execucao.total_registros && (
                  <p className="text-xs text-gray-500 mt-1">
                    {execucao.total_registros} registros • 
                    {execucao.tempo_execucao_ms && `${Math.round(execucao.tempo_execucao_ms / 1000)}s • `}
                    {execucao.tamanho_arquivo_kb && `${Math.round(execucao.tamanho_arquivo_kb / 1024)}MB`}
                  </p>
                )}
                
                {execucao.erro_detalhes && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {execucao.erro_detalhes}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getStatusColor()}`}>
                {execucao.status}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {execucao.formato_exportacao?.toUpperCase()}
              </Badge>
              
              {execucao.status === 'concluido' && execucao.arquivo_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBaixarRelatorio(execucao.id)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Baixar
                </Button>
              )}
              
              {execucao.status === 'processando' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelarExecucao(execucao.id)}
                >
                  <Pause className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Templates Disponíveis</p>
              <p className="text-2xl font-bold">{estatisticasTemplates?.total || 0}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Execuções Hoje</p>
              <p className="text-2xl font-bold">{estatisticasExecucoes?.por_status?.concluido || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold">{estatisticasExecucoes?.taxa_sucesso || 0}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold">
                {estatisticasExecucoes?.tempo_medio_execucao ? 
                  `${Math.round(estatisticasExecucoes.tempo_medio_execucao / 1000)}s` : 
                  '0s'
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ExecuteDialog = () => (
    <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Executar Relatório</DialogTitle>
        </DialogHeader>
        
        {templateSelecionado && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">{templateSelecionado.nome}</h4>
              <p className="text-sm text-gray-600">{templateSelecionado.descricao}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Formato de Exportação</label>
              <div className="grid grid-cols-3 gap-2">
                {templateSelecionado.formatos_suportados?.includes('pdf') && (
                  <Button
                    variant="outline"
                    onClick={() => handleExecutarRelatorio(templateSelecionado.id, 'pdf')}
                    disabled={executing}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <FileBarChart className="w-6 h-6" />
                    <span className="text-xs">PDF</span>
                  </Button>
                )}
                
                {templateSelecionado.formatos_suportados?.includes('excel') && (
                  <Button
                    variant="outline"
                    onClick={() => handleExecutarRelatorio(templateSelecionado.id, 'excel')}
                    disabled={executing}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <FileSpreadsheet className="w-6 h-6" />
                    <span className="text-xs">Excel</span>
                  </Button>
                )}
                
                {templateSelecionado.formatos_suportados?.includes('csv') && (
                  <Button
                    variant="outline"
                    onClick={() => handleExecutarRelatorio(templateSelecionado.id, 'csv')}
                    disabled={executing}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <Table className="w-6 h-6" />
                    <span className="text-xs">CSV</span>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              💡 O relatório será processado em segundo plano. 
              Você receberá uma notificação quando estiver pronto para download.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  const templatesFilter = filtrarTemplates()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>

          <p className="text-gray-600">
            Gere e gerencie relatórios personalizados com exportação PDF, Excel e CSV
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Mensagens de erro */}
      {(errorTemplates || errorExecucoes) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {errorTemplates || errorExecucoes}
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={limparErroTemplates}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="executar">
            <Play className="w-4 h-4 mr-2" />
            Executar Relatórios
          </TabsTrigger>
          <TabsTrigger value="execucoes">
            <Clock className="w-4 h-4 mr-2" />
            Execuções
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Tab: Executar Relatórios */}
        <TabsContent value="executar" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar relatórios..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    <SelectItem value="checklist">Checklists</SelectItem>
                    <SelectItem value="produtividade">Produtividade</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Templates */}
          {loadingTemplates ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Carregando templates...</span>
            </div>
          ) : templatesFilter.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum template encontrado
                </h3>
                <p className="text-gray-600">
                  {busca || filtroCategoria ? 
                    'Tente ajustar os filtros para encontrar templates.' :
                    'Crie seu primeiro template para começar a gerar relatórios.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesFilter.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Execuções */}
        <TabsContent value="execucoes" className="space-y-4">
          {loadingExecucoes ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Carregando execuções...</span>
            </div>
          ) : execucoes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma execução encontrada
                </h3>
                <p className="text-gray-600">
                  Execute seu primeiro relatório para ver o histórico aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {execucoes.map((execucao) => (
                <ExecucaoCard key={execucao.id} execucao={execucao} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Gerenciamento de Templates
            </h3>
            <p className="text-gray-600">
              Em desenvolvimento: Editor de templates, importação/exportação, versionamento.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de execução */}
      <ExecuteDialog />
    </div>
  )
} 