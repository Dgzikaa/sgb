'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ScoreDisplay from '@/components/ScoreDisplay'
import { 
  Eye,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Coffee,
  ChefHat,
  Utensils,
  Truck,
  Shield,
  FileText,
  Filter,
  Download,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface ChecklistRelatorio {
  id: string
  nome: string
  setor: string
  tipo: string
  data_preenchimento: string
  hora_preenchimento: string
  responsavel: string
  tempo_execucao: number
  total_itens: number
  itens_ok: number
  itens_problema: number
  itens_na: number
  nota_geral: number
  status: 'excelente' | 'bom' | 'atencao' | 'critico'
  observacoes_gerais?: string
  possui_problemas: boolean
  atrasado: boolean
  last_input: string
  score_detalhado?: any
}

interface ChecklistDetalhe {
  id: string
  nome: string
  setor: string
  data_preenchimento: string
  responsavel: string
  secoes: {
    id: string
    nome: string
    cor: string
    itens: {
      id: string
      titulo: string
      tipo: string
      valor: any
      status: 'ok' | 'problema' | 'na'
      observacoes?: string
      foto?: string
      obrigatorio: boolean
    }[]
  }[]
}

const setoresConfig = [
  { id: 'cozinha', nome: 'Cozinha', icon: ChefHat, cor: 'bg-orange-500' },
  { id: 'bar', nome: 'Bar', icon: Coffee, cor: 'bg-blue-500' },
  { id: 'salao', nome: 'Salão', icon: Utensils, cor: 'bg-green-500' },
  { id: 'recebimento', nome: 'Recebimento', icon: Truck, cor: 'bg-purple-500' },
  { id: 'seguranca', nome: 'Segurança', icon: Shield, cor: 'bg-red-500' },
  { id: 'administrativo', nome: 'Administrativo', icon: FileText, cor: 'bg-gray-500' }
]

export default function RelatoriosChecklists() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  
  // Estados principais
  const [relatorios, setRelatorios] = useState<ChecklistRelatorio[]>([])
  const [checklistDetalhado, setChecklistDetalhado] = useState<ChecklistDetalhe | null>(null)
  const [modalDetalhes, setModalDetalhes] = useState(false)
  const [setorFiltro, setSetorFiltro] = useState<string>('todos')
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [busca, setBusca] = useState('')

  // Dados mockados para demonstração
  const relatoriosMock: ChecklistRelatorio[] = [
    {
      id: '1',
      nome: 'Checklist Abertura Cozinha',
      setor: 'cozinha',
      tipo: 'abertura',
      data_preenchimento: '2024-01-20',
      hora_preenchimento: '06:30',
      responsavel: 'João Silva',
      tempo_execucao: 35,
      total_itens: 15,
      itens_ok: 13,
      itens_problema: 2,
      itens_na: 0,
      nota_geral: 7.8,
      status: 'atencao',
      possui_problemas: true,
      atrasado: false,
      last_input: '2h atrás'
    },
    {
      id: '2',
      nome: 'Segurança do Bar',
      setor: 'bar',
      tipo: 'seguranca',
      data_preenchimento: '2024-01-20',
      hora_preenchimento: '07:15',
      responsavel: 'Maria Santos',
      tempo_execucao: 20,
      total_itens: 8,
      itens_ok: 8,
      itens_problema: 0,
      itens_na: 0,
      nota_geral: 10.0,
      status: 'excelente',
      possui_problemas: false,
      atrasado: false,
      last_input: '1h atrás'
    },
    {
      id: '3',
      nome: 'Limpeza Salão',
      setor: 'salao',
      tipo: 'qualidade',
      data_preenchimento: '2024-01-19',
      hora_preenchimento: '22:45',
      responsavel: 'Pedro Costa',
      tempo_execucao: 45,
      total_itens: 12,
      itens_ok: 10,
      itens_problema: 1,
      itens_na: 1,
      nota_geral: 8.5,
      status: 'bom',
      possui_problemas: true,
      atrasado: true,
      last_input: '14h atrás'
    }
  ]

  useEffect(() => {
    carregarRelatorios()
  }, [selectedBar?.id])

  useEffect(() => {
    setPageTitle('📊 Relatórios de Checklists')
    return () => setPageTitle('')
  }, [setPageTitle])

  const carregarRelatorios = async () => {
    // TODO: Implementar carregamento do banco
    setRelatorios(relatoriosMock)
  }

  const carregarDetalhes = async (id: string) => {
    // TODO: Implementar carregamento dos detalhes
    const mockDetalhes: ChecklistDetalhe = {
      id,
      nome: 'Checklist Abertura Cozinha',
      setor: 'cozinha',
      data_preenchimento: '2024-01-20 06:30',
      responsavel: 'João Silva',
      secoes: [
        {
          id: 'equipamentos',
          nome: 'Equipamentos',
          cor: 'bg-orange-500',
          itens: [
            {
              id: '1',
              titulo: 'Temperatura do freezer',
              tipo: 'numero',
              valor: -18,
              status: 'ok',
              obrigatorio: true
            },
            {
              id: '2',
              titulo: 'Fogão funcionando',
              tipo: 'sim_nao',
              valor: false,
              status: 'problema',
              observacoes: 'Boca 3 não está acendendo',
              obrigatorio: true
            },
            {
              id: '3',
              titulo: 'Foto da cozinha limpa',
              tipo: 'foto_camera',
              valor: 'foto-url',
              status: 'ok',
              foto: '/mock-foto-cozinha.jpg',
              obrigatorio: false
            }
          ]
        },
        {
          id: 'limpeza',
          nome: 'Limpeza',
          cor: 'bg-green-500',
          itens: [
            {
              id: '4',
              titulo: 'Bancadas sanitizadas',
              tipo: 'sim_nao',
              valor: true,
              status: 'ok',
              obrigatorio: true
            },
            {
              id: '5',
              titulo: 'Qualidade da limpeza',
              tipo: 'avaliacao',
              valor: 4,
              status: 'ok',
              obrigatorio: false
            }
          ]
        }
      ]
    }
    
    setChecklistDetalhado(mockDetalhes)
    setModalDetalhes(true)
  }

  // Filtrar relatórios
  const relatoriosFiltrados = relatorios.filter(relatorio => {
    const matchSetor = setorFiltro === 'todos' || relatorio.setor === setorFiltro
    const matchStatus = statusFiltro === 'todos' || relatorio.status === statusFiltro
    const matchBusca = relatorio.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      relatorio.responsavel.toLowerCase().includes(busca.toLowerCase())
    
    // TODO: Implementar filtro por data
    
    return matchSetor && matchStatus && matchBusca
  })

  // Calcular estatísticas
  const estatisticas = {
    total: relatorios.length,
    excelente: relatorios.filter(r => r.status === 'excelente').length,
    bom: relatorios.filter(r => r.status === 'bom').length,
    atencao: relatorios.filter(r => r.status === 'atencao').length,
    critico: relatorios.filter(r => r.status === 'critico').length,
    comProblemas: relatorios.filter(r => r.possui_problemas).length,
    atrasados: relatorios.filter(r => r.atrasado).length
  }

  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'excelente': return 'bg-green-500'
      case 'bom': return 'bg-blue-500'
      case 'atencao': return 'bg-yellow-500'
      case 'critico': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case 'excelente': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'bom': return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'atencao': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'critico': return <XCircle className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  const renderItemDetalhe = (item: any) => {
    return (
      <div className={`p-3 rounded border-l-4 ${
        item.status === 'ok' ? 'border-green-500 bg-green-50' :
        item.status === 'problema' ? 'border-red-500 bg-red-50' :
        'border-gray-300 bg-gray-50'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{item.titulo}</h4>
            {item.obrigatorio && <Badge className="bg-red-100 text-red-800 text-xs">Obrigatório</Badge>}
          </div>
          {obterIconeStatus(item.status)}
        </div>

        <div className="space-y-2">
          {/* Renderizar valor baseado no tipo */}
          {item.tipo === 'numero' && (
            <p className="text-sm"><strong>Valor:</strong> {item.valor}</p>
          )}
          {item.tipo === 'sim_nao' && (
            <p className="text-sm"><strong>Resposta:</strong> {item.valor ? 'Sim' : 'Não'}</p>
          )}
          {item.tipo === 'avaliacao' && (
            <div className="flex items-center gap-1">
              <strong className="text-sm">Avaliação:</strong>
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className={i <= item.valor ? 'text-yellow-500' : 'text-gray-300'}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
          )}
          {item.tipo === 'foto_camera' && item.foto && (
            <div>
              <p className="text-sm font-medium mb-1">Foto:</p>
              <div className="w-24 h-24 bg-gray-200 rounded border flex items-center justify-center">
                📷 Foto capturada
              </div>
            </div>
          )}

          {item.observacoes && (
            <div className="bg-white p-2 rounded border">
              <p className="text-xs text-gray-600 mb-1">Observações:</p>
              <p className="text-sm">{item.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredModule="admin">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Informações */}
        <div className="mb-6">
          <p className="text-gray-700">Acompanhe o desempenho e conformidade dos checklists</p>
          <div className="text-sm text-gray-600 mt-1">
            Bar: <strong>{selectedBar?.nome}</strong> • {relatorios.length} checklists analisados
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-black">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estatisticas.excelente}</div>
              <div className="text-sm text-gray-600">Excelente</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.bom}</div>
              <div className="text-sm text-gray-600">Bom</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.atencao}</div>
              <div className="text-sm text-gray-600">Atenção</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{estatisticas.critico}</div>
              <div className="text-sm text-gray-600">Crítico</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{estatisticas.comProblemas}</div>
              <div className="text-sm text-gray-600">C/ Problemas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{estatisticas.atrasados}</div>
              <div className="text-sm text-gray-600">Atrasados</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="🔍 Buscar por nome ou responsável..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={setorFiltro} onValueChange={setSetorFiltro}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os setores</SelectItem>
                    {setoresConfig.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="atencao">Atenção</SelectItem>
                    <SelectItem value="critico">Crítico</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs por Setor */}
        <Tabs value={setorFiltro} onValueChange={setSetorFiltro} className="mb-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="todos" className="text-xs">
              Todos ({relatorios.length})
            </TabsTrigger>
            {setoresConfig.map((setor) => {
              const SetorIcon = setor.icon
              const qtdSetor = relatorios.filter(r => r.setor === setor.id).length
              
              return (
                <TabsTrigger key={setor.id} value={setor.id} className="text-xs">
                  <SetorIcon className="w-4 h-4 mr-1" />
                  {setor.nome} ({qtdSetor})
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Lista de Relatórios */}
          <div className="mt-6">
            {relatoriosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum relatório encontrado</h3>
                <p className="text-gray-500">
                  {busca || setorFiltro !== 'todos' || statusFiltro !== 'todos' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Nenhum checklist foi preenchido ainda'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {relatoriosFiltrados.map((relatorio) => {
                  const setor = setoresConfig.find(s => s.id === relatorio.setor)
                  const SetorIcon = setor?.icon || FileText

                  return (
                    <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Ícone do Setor */}
                            <div className={`p-3 rounded-lg ${setor?.cor} text-white`}>
                              <SetorIcon className="w-6 h-6" />
                            </div>

                            {/* Informações Principais */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg text-black">{relatorio.nome}</h3>
                                
                                {/* Status Visual */}
                                <div className="flex items-center gap-1">
                                  {obterIconeStatus(relatorio.status)}
                                  <Badge className={`text-white ${obterCorStatus(relatorio.status)}`}>
                                    {relatorio.status}
                                  </Badge>
                                </div>

                                {/* Indicadores */}
                                {relatorio.possui_problemas && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Problemas
                                  </Badge>
                                )}
                                
                                {relatorio.atrasado && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Atrasado
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {relatorio.responsavel}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {relatorio.data_preenchimento} {relatorio.hora_preenchimento}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {relatorio.tempo_execucao}min
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  {relatorio.itens_ok}/{relatorio.total_itens} OK
                                </div>
                                <div className="flex items-center gap-1">
                                  {relatorio.score_detalhado ? (
                                    <ScoreDisplay 
                                      scoreResult={relatorio.score_detalhado} 
                                      variant="compact" 
                                      showProblems={false} 
                                    />
                                  ) : (
                                    <>
                                      <BarChart3 className="w-4 h-4" />
                                      Nota: {relatorio.nota_geral.toFixed(1)}
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 font-medium">
                                  <span className="text-blue-600">Last input: {relatorio.last_input}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => carregarDetalhes(relatorio.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </Tabs>

        {/* Modal de Detalhes */}
        <Dialog open={modalDetalhes} onOpenChange={setModalDetalhes}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes do Checklist
              </DialogTitle>
            </DialogHeader>
            
            {checklistDetalhado && (
              <div className="space-y-6">
                {/* Cabeçalho */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{checklistDetalhado.nome}</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Setor:</span> {setoresConfig.find(s => s.id === checklistDetalhado.setor)?.nome}
                    </div>
                    <div>
                      <span className="font-medium">Responsável:</span> {checklistDetalhado.responsavel}
                    </div>
                    <div>
                      <span className="font-medium">Preenchido em:</span> {checklistDetalhado.data_preenchimento}
                    </div>
                  </div>
                </div>

                {/* Seções */}
                {checklistDetalhado.secoes.map((secao) => (
                  <div key={secao.id}>
                    <div className={`p-3 rounded-t-lg text-white font-semibold ${secao.cor}`}>
                      {secao.nome}
                    </div>
                    
                    <div className="border border-t-0 rounded-b-lg p-4 space-y-3">
                      {secao.itens.map((item) => (
                        <div key={item.id}>
                          {renderItemDetalhe(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
} 