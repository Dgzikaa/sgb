'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Coffee,
  ChefHat,
  Store,
  Utensils,
  Truck,
  Shield,
  Settings,
  Bell,
  Plus,
  Eye,
  FileText
} from 'lucide-react'

interface ChecklistItem {
  id: string
  titulo: string
  descricao: string
  area: string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  tempo_estimado: number // em minutos
  responsavel?: string
  status: 'pendente' | 'fazendo' | 'concluido' | 'problema'
  observacoes?: string
  horario_inicio?: string
  horario_conclusao?: string
  verificado_por?: string
}

interface Area {
  id: string
  nome: string
  icon: any
  cor: string
  responsavel_padrao?: string
  itens_obrigatorios: number
  itens_concluidos: number
}

interface HistoricoChecklist {
  data: string
  areas_completas: number
  total_areas: number
  tempo_total: number
  responsavel_geral: string
  observacoes_gerais: string
}

export default function ChecklistAbertura() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  
  // Estados principais
  const [checklistAtivo, setChecklistAtivo] = useState<ChecklistItem[]>([])
  const [historico, setHistorico] = useState<HistoricoChecklist[]>([])
  const [areaSelecionada, setAreaSelecionada] = useState<string>('todas')
  const [checklistIniciado, setChecklistIniciado] = useState(false)
  const [horaInicio, setHoraInicio] = useState<string>('')
  
  // Modal para detalhes do item
  const [modalItemAberto, setModalItemAberto] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<ChecklistItem | null>(null)
  
  // Modal para adicionar item
  const [modalNovoItem, setModalNovoItem] = useState(false)
  const [novoItem, setNovoItem] = useState<Partial<ChecklistItem>>({
    area: 'cozinha',
    prioridade: 'media',
    tempo_estimado: 5
  })

  // Configuração das áreas
  const areas: Area[] = [
    {
      id: 'cozinha',
      nome: 'Cozinha',
      icon: ChefHat,
      cor: 'bg-orange-500',
      responsavel_padrao: 'Chef/Cozinheiro',
      itens_obrigatorios: 0,
      itens_concluidos: 0
    },
    {
      id: 'bar',
      nome: 'Bar',
      icon: Coffee,
      cor: 'bg-blue-500',
      responsavel_padrao: 'Bartender',
      itens_obrigatorios: 0,
      itens_concluidos: 0
    },
    {
      id: 'salao',
      nome: 'Salão',
      icon: Utensils,
      cor: 'bg-green-500',
      responsavel_padrao: 'Gerente de Salão',
      itens_obrigatorios: 0,
      itens_concluidos: 0
    },
    {
      id: 'recebimento',
      nome: 'Recebimento',
      icon: Truck,
      cor: 'bg-purple-500',
      responsavel_padrao: 'Responsável Estoque',
      itens_obrigatorios: 0,
      itens_concluidos: 0
    },
    {
      id: 'seguranca',
      nome: 'Segurança',
      icon: Shield,
      cor: 'bg-red-500',
      responsavel_padrao: 'Gerente Geral',
      itens_obrigatorios: 0,
      itens_concluidos: 0
    },
    {
      id: 'administrativo',
      nome: 'Administrativo',
      icon: FileText,
      cor: 'bg-gray-500',
      responsavel_padrao: 'Gerente',
      itens_obrigatorios: 0,
      itens_concluidos: 0
    }
  ]

  // Checklist padrão por área
  const checklistPadrao: Omit<ChecklistItem, 'id' | 'status' | 'horario_inicio' | 'horario_conclusao'>[] = [
    // Cozinha
    { titulo: 'Verificar temperatura dos freezers', descricao: 'Conferir se todos os freezers estão na temperatura adequada (-18°C)', area: 'cozinha', prioridade: 'critica', tempo_estimado: 5 },
    { titulo: 'Verificar temperatura das geladeiras', descricao: 'Conferir se todas as geladeiras estão entre 2-8°C', area: 'cozinha', prioridade: 'critica', tempo_estimado: 3 },
    { titulo: 'Limpeza e sanitização das bancadas', descricao: 'Limpar e sanitizar todas as superfícies de trabalho', area: 'cozinha', prioridade: 'alta', tempo_estimado: 15 },
    { titulo: 'Verificar validade dos alimentos', descricao: 'Conferir datas de validade dos produtos na linha de produção', area: 'cozinha', prioridade: 'alta', tempo_estimado: 10 },
    { titulo: 'Testar equipamentos da cozinha', descricao: 'Ligar e testar fogão, forno, chapa, fritadeira', area: 'cozinha', prioridade: 'media', tempo_estimado: 8 },
    
    // Bar
    { titulo: 'Verificar estoque de bebidas', descricao: 'Conferir níveis de cerveja, refrigerantes, águas', area: 'bar', prioridade: 'alta', tempo_estimado: 10 },
    { titulo: 'Limpeza dos equipamentos do bar', descricao: 'Limpar chopeira, máquina de refrigerante, máquina de café', area: 'bar', prioridade: 'alta', tempo_estimado: 15 },
    { titulo: 'Organizar insumos do bar', descricao: 'Repor gelo, guardanapos, canudos, copos limpos', area: 'bar', prioridade: 'media', tempo_estimado: 8 },
    { titulo: 'Testar sistemas de pagamento', descricao: 'Verificar se POS e máquinas de cartão estão funcionando', area: 'bar', prioridade: 'alta', tempo_estimado: 5 },
    
    // Salão
    { titulo: 'Limpeza das mesas e cadeiras', descricao: 'Limpar e organizar todas as mesas e cadeiras', area: 'salao', prioridade: 'alta', tempo_estimado: 20 },
    { titulo: 'Verificar banheiros', descricao: 'Conferir limpeza, papel higiênico, sabonete, toalhas', area: 'salao', prioridade: 'alta', tempo_estimado: 10 },
    { titulo: 'Organizar cardápios e materiais', descricao: 'Distribuir cardápios limpos e organizados nas mesas', area: 'salao', prioridade: 'media', tempo_estimado: 10 },
    { titulo: 'Testar som e iluminação', descricao: 'Verificar se sistema de som e luzes estão funcionando', area: 'salao', prioridade: 'media', tempo_estimado: 5 },
    
    // Recebimento
    { titulo: 'Conferir entregas agendadas', descricao: 'Verificar agenda de fornecedores para o dia', area: 'recebimento', prioridade: 'alta', tempo_estimado: 5 },
    { titulo: 'Organizar área de recebimento', descricao: 'Deixar área livre para recebimento de mercadorias', area: 'recebimento', prioridade: 'media', tempo_estimado: 10 },
    { titulo: 'Verificar balança e documentos', descricao: 'Testar balança e preparar documentos de conferência', area: 'recebimento', prioridade: 'media', tempo_estimado: 5 },
    
    // Segurança
    { titulo: 'Verificar saídas de emergência', descricao: 'Conferir se todas as saídas estão desobstruídas', area: 'seguranca', prioridade: 'critica', tempo_estimado: 8 },
    { titulo: 'Testar alarmes e câmeras', descricao: 'Verificar funcionamento dos sistemas de segurança', area: 'seguranca', prioridade: 'alta', tempo_estimado: 10 },
    { titulo: 'Conferir extintores', descricao: 'Verificar se extintores estão no lugar e com carga', area: 'seguranca', prioridade: 'critica', tempo_estimado: 5 },
    
    // Administrativo
    { titulo: 'Verificar caixa inicial', descricao: 'Conferir e registrar valor do troco inicial', area: 'administrativo', prioridade: 'alta', tempo_estimado: 10 },
    { titulo: 'Revisar agenda do dia', descricao: 'Conferir reservas, eventos especiais, funcionários escalados', area: 'administrativo', prioridade: 'alta', tempo_estimado: 15 },
    { titulo: 'Verificar sistemas', descricao: 'Testar sistema de vendas, internet, telefone', area: 'administrativo', prioridade: 'alta', tempo_estimado: 10 }
  ]

  // Carregar checklist do dia
  useEffect(() => {
    carregarChecklistDia()
    carregarHistorico()
  }, [selectedBar?.id])

  useEffect(() => {
    setPageTitle('✅ Checklist de Abertura')
    return () => setPageTitle('')
  }, [setPageTitle])

  const carregarChecklistDia = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      // Verificar se já existe checklist para hoje
      const response = await fetch(`/api/operacoes/checklist-abertura?bar_id=${selectedBar?.id}&data=${hoje}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.checklist && data.checklist.length > 0) {
          setChecklistAtivo(data.checklist)
          setChecklistIniciado(true)
          setHoraInicio(data.hora_inicio || '')
        } else {
          // Criar novo checklist baseado no padrão
          const novoChecklist = checklistPadrao.map((item, index) => ({
            ...item,
            id: `item_${index + 1}`,
            status: 'pendente' as const
          }))
          setChecklistAtivo(novoChecklist)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar checklist:', error)
      // Em caso de erro, usar checklist padrão
      const novoChecklist = checklistPadrao.map((item, index) => ({
        ...item,
        id: `item_${index + 1}`,
        status: 'pendente' as const
      }))
      setChecklistAtivo(novoChecklist)
    }
  }

  const carregarHistorico = async () => {
    try {
      const response = await fetch(`/api/operacoes/checklist-abertura/historico?bar_id=${selectedBar?.id}`)
      if (response.ok) {
        const data = await response.json()
        setHistorico(data.historico || [])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const iniciarChecklist = () => {
    const agora = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    setHoraInicio(agora)
    setChecklistIniciado(true)
  }

  const atualizarStatusItem = (itemId: string, novoStatus: ChecklistItem['status'], observacoes?: string) => {
    setChecklistAtivo(prev => prev.map(item => {
      if (item.id === itemId) {
        const agora = new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        
        return {
          ...item,
          status: novoStatus,
          observacoes,
          horario_inicio: item.horario_inicio || (novoStatus === 'fazendo' ? agora : undefined),
          horario_conclusao: novoStatus === 'concluido' ? agora : undefined,
          verificado_por: novoStatus === 'concluido' ? 'Usuário Logado' : item.verificado_por // TODO: pegar do contexto de usuário
        }
      }
      return item
    }))
  }

  const salvarChecklist = async () => {
    try {
      const dadosChecklistCompleto = {
        bar_id: selectedBar?.id,
        data: new Date().toISOString().split('T')[0],
        hora_inicio: horaInicio,
        hora_conclusao: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        itens: checklistAtivo,
        responsavel_geral: 'Usuário Logado', // TODO: pegar do contexto
        observacoes_gerais: ''
      }

      const response = await fetch('/api/operacoes/checklist-abertura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosChecklistCompleto)
      })

      if (response.ok) {
        alert('✅ Checklist salvo com sucesso!')
        carregarHistorico()
      } else {
        throw new Error('Erro ao salvar checklist')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('❌ Erro ao salvar checklist')
    }
  }

  // Calcular estatísticas
  const estatisticas = {
    total: checklistAtivo.length,
    concluidos: checklistAtivo.filter(item => item.status === 'concluido').length,
    problemas: checklistAtivo.filter(item => item.status === 'problema').length,
    pendentes: checklistAtivo.filter(item => item.status === 'pendente').length,
    fazendo: checklistAtivo.filter(item => item.status === 'fazendo').length
  }

  const progresso = estatisticas.total > 0 ? (estatisticas.concluidos / estatisticas.total * 100) : 0

  // Filtrar itens por área
  const itensFiltrados = areaSelecionada === 'todas' 
    ? checklistAtivo 
    : checklistAtivo.filter(item => item.area === areaSelecionada)

  const obterCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'bg-red-500'
      case 'alta': return 'bg-orange-500'
      case 'media': return 'bg-yellow-500'
      case 'baixa': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'problema': return <XCircle className="w-5 h-5 text-red-600" />
      case 'fazendo': return <Clock className="w-5 h-5 text-blue-600" />
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <ProtectedRoute requiredModule="operacoes">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Informações do Bar */}
        <div className="mb-6">
          <p className="text-gray-700">Sistema de verificação pré-operacional por áreas</p>
          <div className="text-sm text-gray-600 mt-1">
            Bar: <strong>{selectedBar?.nome}</strong> • 
            {checklistIniciado && (
              <span className="text-blue-600"> Iniciado às {horaInicio}</span>
            )}
          </div>
        </div>

        {/* Status Geral e Ações */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Progresso Geral</p>
                  <p className="text-2xl font-bold text-black">{progresso.toFixed(0)}%</p>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-300"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${progresso}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.concluidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Problemas</p>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.problemas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              {!checklistIniciado ? (
                <Button 
                  onClick={iniciarChecklist}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  ▶️ Iniciar Checklist
                </Button>
              ) : (
                <Button 
                  onClick={salvarChecklist}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={estatisticas.pendentes > 0 || estatisticas.fazendo > 0}
                >
                  💾 Salvar Checklist
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros por Área */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Áreas de Verificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={areaSelecionada} onValueChange={setAreaSelecionada}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                <TabsTrigger value="todas" className="text-xs">
                  Todas ({checklistAtivo.length})
                </TabsTrigger>
                {areas.map((area) => {
                  const AreaIcon = area.icon
                  const itensArea = checklistAtivo.filter(item => item.area === area.id)
                  const concluidos = itensArea.filter(item => item.status === 'concluido').length
                  
                  return (
                    <TabsTrigger key={area.id} value={area.id} className="text-xs">
                      <AreaIcon className="w-4 h-4 mr-1" />
                      {area.nome} ({concluidos}/{itensArea.length})
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {/* Lista de Itens */}
              <div className="mt-6 space-y-3">
                {itensFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      item.status === 'concluido' ? 'border-green-300 bg-green-50' :
                      item.status === 'problema' ? 'border-red-300 bg-red-50' :
                      item.status === 'fazendo' ? 'border-blue-300 bg-blue-50' :
                      'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setItemSelecionado(item)
                      setModalItemAberto(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {obterIconeStatus(item.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-black">{item.titulo}</h3>
                            <Badge className={`text-xs text-white ${obterCorPrioridade(item.prioridade)}`}>
                              {item.prioridade}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {areas.find(a => a.id === item.area)?.nome}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>⏱️ {item.tempo_estimado} min</span>
                            {item.horario_inicio && (
                              <span>🕐 Iniciado: {item.horario_inicio}</span>
                            )}
                            {item.horario_conclusao && (
                              <span>✅ Concluído: {item.horario_conclusao}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {checklistIniciado && (
                        <div className="flex gap-2">
                          {item.status === 'pendente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                atualizarStatusItem(item.id, 'fazendo')
                              }}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              ▶️ Iniciar
                            </Button>
                          )}
                          {item.status === 'fazendo' && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  atualizarStatusItem(item.id, 'concluido')
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                ✅ OK
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  atualizarStatusItem(item.id, 'problema')
                                }}
                              >
                                ❌ Problema
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {itensFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item encontrado para esta área</p>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Item */}
        <Dialog open={modalItemAberto} onOpenChange={setModalItemAberto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {itemSelecionado && obterIconeStatus(itemSelecionado.status)}
                Detalhes do Item
              </DialogTitle>
            </DialogHeader>
            
            {itemSelecionado && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-black">{itemSelecionado.titulo}</h3>
                  <p className="text-gray-600">{itemSelecionado.descricao}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Área:</span>
                    <p className="font-medium">{areas.find(a => a.id === itemSelecionado.area)?.nome}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Prioridade:</span>
                    <Badge className={`text-xs text-white ${obterCorPrioridade(itemSelecionado.prioridade)}`}>
                      {itemSelecionado.prioridade}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Tempo estimado:</span>
                    <p className="font-medium">{itemSelecionado.tempo_estimado} minutos</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium">{itemSelecionado.status}</p>
                  </div>
                </div>
                
                {itemSelecionado.observacoes && (
                  <div>
                    <span className="text-gray-600">Observações:</span>
                    <p className="text-sm bg-gray-50 p-2 rounded">{itemSelecionado.observacoes}</p>
                  </div>
                )}
                
                {checklistIniciado && itemSelecionado.status !== 'concluido' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Adicionar observações..."
                      value={itemSelecionado.observacoes || ''}
                      onChange={(e) => {
                        if (itemSelecionado) {
                          setItemSelecionado({
                            ...itemSelecionado,
                            observacoes: e.target.value
                          })
                        }
                      }}
                      rows={3}
                    />
                    
                    <div className="flex gap-2">
                      {itemSelecionado.status === 'pendente' && (
                        <Button
                          onClick={() => {
                            atualizarStatusItem(itemSelecionado.id, 'fazendo', itemSelecionado.observacoes)
                            setModalItemAberto(false)
                          }}
                          className="flex-1 text-blue-600 border-blue-300"
                          variant="outline"
                        >
                          ▶️ Iniciar
                        </Button>
                      )}
                      {itemSelecionado.status === 'fazendo' && (
                        <>
                          <Button
                            onClick={() => {
                              atualizarStatusItem(itemSelecionado.id, 'concluido', itemSelecionado.observacoes)
                              setModalItemAberto(false)
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✅ Concluir
                          </Button>
                          <Button
                            onClick={() => {
                              atualizarStatusItem(itemSelecionado.id, 'problema', itemSelecionado.observacoes)
                              setModalItemAberto(false)
                            }}
                            variant="destructive"
                            className="flex-1"
                          >
                            ❌ Problema
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalItemAberto(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
} 