'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Bell, Users, CheckSquare, Settings, Plus, Edit, Trash2, PlayCircle, PauseCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface Agendamento {
  id: string
  titulo: string
  checklist: {
    id: string
    nome: string
    setor: string
    tipo: string
  }
  frequencia: string
  horario: string
  dias_semana?: number[]
  dia_mes?: number
  ativo: boolean
  notificacoes_ativas: boolean
  tempo_limite_horas: number
  prioridade: string
  responsaveis_whatsapp: Array<{
    nome: string
    numero: string
    cargo?: string
  }>
  proxima_execucao?: string
  ultima_execucao?: any
  status_atual: string
  created_at: string
}

interface Checklist {
  id: string
  nome: string
  setor: string
  tipo: string
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [agendamentoEditando, setAgendamentoEditando] = useState<Agendamento | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroFrequencia, setFiltroFrequencia] = useState<string>('todos')
  
  const { toast } = useToast()

  // Estado do formulário
  const [formulario, setFormulario] = useState({
    checklist_id: '',
    titulo: '',
    frequencia: 'diaria',
    horario: '08:00',
    dias_semana: [] as number[],
    dia_mes: 1,
    ativo: true,
    notificacoes_ativas: true,
    tempo_limite_horas: 24,
    prioridade: 'normal',
    observacoes: '',
    responsaveis_whatsapp: [] as Array<{nome: string, numero: string, cargo?: string}>
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Carregar agendamentos
      const resAgendamentos = await fetch('/api/checklists/agendamentos')
      if (resAgendamentos.ok) {
        const dataAgendamentos = await resAgendamentos.json()
        setAgendamentos(dataAgendamentos.data || [])
      }

      // Carregar checklists disponíveis
      const resChecklists = await fetch('/api/checklists')
      if (resChecklists.ok) {
        const dataChecklists = await resChecklists.json()
        setChecklists(dataChecklists || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar agendamentos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const salvarAgendamento = async () => {
    try {
      const url = agendamentoEditando 
        ? `/api/checklists/agendamentos/${agendamentoEditando.id}`
        : '/api/checklists/agendamentos'
      
      const method = agendamentoEditando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Agendamento ${agendamentoEditando ? 'atualizado' : 'criado'} com sucesso`
        })
        setModalAberto(false)
        carregarDados()
        resetFormulario()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar agendamento')
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const alternarStatusAgendamento = async (id: string, ativo: boolean) => {
    try {
      const response = await fetch(`/api/checklists/agendamentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ativo })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Agendamento ${ativo ? 'ativado' : 'desativado'} com sucesso`
        })
        carregarDados()
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do agendamento',
        variant: 'destructive'
      })
    }
  }

  const excluirAgendamento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      const response = await fetch(`/api/checklists/agendamentos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Agendamento excluído com sucesso'
        })
        carregarDados()
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir agendamento',
        variant: 'destructive'
      })
    }
  }

  const abrirModalEdicao = (agendamento?: Agendamento) => {
    if (agendamento) {
      setAgendamentoEditando(agendamento)
      setFormulario({
        checklist_id: agendamento.checklist.id,
        titulo: agendamento.titulo,
        frequencia: agendamento.frequencia,
        horario: agendamento.horario,
        dias_semana: agendamento.dias_semana || [],
        dia_mes: agendamento.dia_mes || 1,
        ativo: agendamento.ativo,
        notificacoes_ativas: agendamento.notificacoes_ativas,
        tempo_limite_horas: agendamento.tempo_limite_horas,
        prioridade: agendamento.prioridade,
        observacoes: '',
        responsaveis_whatsapp: agendamento.responsaveis_whatsapp || []
      })
    } else {
      resetFormulario()
    }
    setModalAberto(true)
  }

  const resetFormulario = () => {
    setAgendamentoEditando(null)
    setFormulario({
      checklist_id: '',
      titulo: '',
      frequencia: 'diaria',
      horario: '08:00',
      dias_semana: [],
      dia_mes: 1,
      ativo: true,
      notificacoes_ativas: true,
      tempo_limite_horas: 24,
      prioridade: 'normal',
      observacoes: '',
      responsaveis_whatsapp: []
    })
  }

  const adicionarResponsavel = () => {
    setFormulario(prev => ({
      ...prev,
      responsaveis_whatsapp: [
        ...prev.responsaveis_whatsapp,
        { nome: '', numero: '', cargo: '' }
      ]
    }))
  }

  const removerResponsavel = (index: number) => {
    setFormulario(prev => ({
      ...prev,
      responsaveis_whatsapp: prev.responsaveis_whatsapp.filter((_, i) => i !== index)
    }))
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      atrasado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      aguardando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      inativo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }

    return (
      <Badge className={variants[status] || variants.agendado}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    if (filtroStatus !== 'todos' && agendamento.status_atual !== filtroStatus) return false
    if (filtroFrequencia !== 'todos' && agendamento.frequencia !== filtroFrequencia) return false
    return true
  })

  const estatisticas = {
    total: agendamentos.length,
    ativos: agendamentos.filter(a => a.ativo).length,
    inativos: agendamentos.filter(a => !a.ativo).length,
    comNotificacoes: agendamentos.filter(a => a.notificacoes_ativas).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando agendamentos...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto carregamos seus dados
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agendamentos de Checklists
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gerencie execuções automáticas e notificações WhatsApp
              </p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.total}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.ativos}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.inativos}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.comNotificacoes}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Com WhatsApp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => abrirModalEdicao()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </Button>

            <div className="flex gap-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroFrequencia} onValueChange={setFiltroFrequencia}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        <div className="grid gap-4">
          {agendamentosFiltrados.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {agendamento.titulo}
                      </h3>
                      {getStatusBadge(agendamento.status_atual)}
                      
                      <Badge variant="outline" className="text-xs">
                        {agendamento.frequencia}
                      </Badge>
                      
                      {agendamento.notificacoes_ativas && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          WhatsApp
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        <span>{agendamento.checklist.nome} ({agendamento.checklist.setor})</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{agendamento.horario}</span>
                      </div>
                      
                      {agendamento.proxima_execucao && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Próxima: {new Date(agendamento.proxima_execucao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    {agendamento.responsaveis_whatsapp && agendamento.responsaveis_whatsapp.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {agendamento.responsaveis_whatsapp.length} responsável(eis) configurado(s)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={agendamento.ativo}
                      onCheckedChange={(checked) => alternarStatusAgendamento(agendamento.id, checked)}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalEdicao(agendamento)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluirAgendamento(agendamento.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {agendamentosFiltrados.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {agendamentos.length === 0 
                    ? 'Crie seu primeiro agendamento para automatizar checklists'
                    : 'Nenhum agendamento corresponde aos filtros selecionados'
                  }
                </p>
                <Button onClick={() => abrirModalEdicao()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Agendamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Criação/Edição */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {agendamentoEditando ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
              <DialogDescription>
                Configure execução automática e notificações WhatsApp
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Informações Básicas</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checklist">Checklist</Label>
                    <Select 
                      value={formulario.checklist_id} 
                      onValueChange={(value) => setFormulario(prev => ({ ...prev, checklist_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um checklist" />
                      </SelectTrigger>
                      <SelectContent>
                        {checklists.map((checklist) => (
                          <SelectItem key={checklist.id} value={checklist.id}>
                            {checklist.nome} ({checklist.setor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="titulo">Título do Agendamento</Label>
                    <Input
                      id="titulo"
                      value={formulario.titulo}
                      onChange={(e) => setFormulario(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ex: Checklist Abertura Diário"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="frequencia">Frequência</Label>
                    <Select 
                      value={formulario.frequencia} 
                      onValueChange={(value) => setFormulario(prev => ({ ...prev, frequencia: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="conforme_necessario">Sob Demanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      type="time"
                      value={formulario.horario}
                      onChange={(e) => setFormulario(prev => ({ ...prev, horario: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select 
                      value={formulario.prioridade} 
                      onValueChange={(value) => setFormulario(prev => ({ ...prev, prioridade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tempo_limite">Tempo Limite (horas)</Label>
                  <Input
                    id="tempo_limite"
                    type="number"
                    min="1"
                    max="168"
                    value={formulario.tempo_limite_horas}
                    onChange={(e) => setFormulario(prev => ({ ...prev, tempo_limite_horas: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Configurações */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Configurações</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formulario.ativo}
                    onCheckedChange={(checked) => setFormulario(prev => ({ ...prev, ativo: checked }))}
                  />
                  <Label htmlFor="ativo">Agendamento ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notificacoes"
                    checked={formulario.notificacoes_ativas}
                    onCheckedChange={(checked) => setFormulario(prev => ({ ...prev, notificacoes_ativas: checked }))}
                  />
                  <Label htmlFor="notificacoes">Notificações WhatsApp ativas</Label>
                </div>
              </div>

              {/* Responsáveis WhatsApp */}
              {formulario.notificacoes_ativas && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Responsáveis WhatsApp</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={adicionarResponsavel}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  {formulario.responsaveis_whatsapp.map((responsavel, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label>Nome</Label>
                        <Input
                          value={responsavel.nome}
                          onChange={(e) => {
                            const novosResponsaveis = [...formulario.responsaveis_whatsapp]
                            novosResponsaveis[index].nome = e.target.value
                            setFormulario(prev => ({ ...prev, responsaveis_whatsapp: novosResponsaveis }))
                          }}
                          placeholder="Nome do responsável"
                        />
                      </div>
                      
                      <div className="col-span-4">
                        <Label>WhatsApp</Label>
                        <Input
                          value={responsavel.numero}
                          onChange={(e) => {
                            const novosResponsaveis = [...formulario.responsaveis_whatsapp]
                            novosResponsaveis[index].numero = e.target.value
                            setFormulario(prev => ({ ...prev, responsaveis_whatsapp: novosResponsaveis }))
                          }}
                          placeholder="+55 11 99999-9999"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Label>Cargo</Label>
                        <Input
                          value={responsavel.cargo || ''}
                          onChange={(e) => {
                            const novosResponsaveis = [...formulario.responsaveis_whatsapp]
                            novosResponsaveis[index].cargo = e.target.value
                            setFormulario(prev => ({ ...prev, responsaveis_whatsapp: novosResponsaveis }))
                          }}
                          placeholder="Cargo"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removerResponsavel(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {formulario.responsaveis_whatsapp.length === 0 && (
                    <Alert>
                      <Bell className="w-4 h-4" />
                      <AlertDescription>
                        Adicione pelo menos um responsável para receber as notificações WhatsApp quando os checklists forem executados ou ficarem atrasados.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formulario.observacoes}
                  onChange={(e) => setFormulario(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais sobre este agendamento..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarAgendamento}>
                {agendamentoEditando ? 'Atualizar' : 'Criar'} Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 