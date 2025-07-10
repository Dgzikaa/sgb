'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ScheduleDialog, { useSchedules } from '@/components/checklist/ScheduleDialog'
import { 
  Calendar, 
  Clock, 
  Repeat,
  Bell,
  CheckCircle,
  Settings,
  CalendarDays,
  Timer,
  Zap,
  Play,
  Pause,
  Edit
} from 'lucide-react'

// =====================================================
// 📅 DEMONSTRAÇÃO DO SISTEMA DE AGENDAMENTO
// =====================================================

export default function ScheduleDemoPage() {
  
  const { saveSchedule, deleteSchedule, isLoading, error } = useSchedules()
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [schedules, setSchedules] = useState([
    {
      id: 'schedule-1',
      checklistId: 'checklist-1',
      titulo: 'Checklist de Abertura - Manhã',
      frequencia: 'diaria' as const,
      horario: '08:00',
      ativo: true,
      notificacoes: true,
      observacoes: 'Executar antes de abrir para o público'
    },
    {
      id: 'schedule-2',
      checklistId: 'checklist-2',
      titulo: 'Checklist de Limpeza - Semanal',
      frequencia: 'semanal' as const,
      horario: '18:00',
      diasSemana: [1, 3, 5], // Seg, Qua, Sex
      ativo: true,
      notificacoes: true,
      observacoes: 'Limpeza profunda'
    },
    {
      id: 'schedule-3',
      checklistId: 'checklist-3',
      titulo: 'Auditoria Mensal',
      frequencia: 'mensal' as const,
      horario: '09:00',
      diaMes: 1,
      ativo: false,
      notificacoes: false,
      observacoes: 'Primeiro dia útil do mês'
    }
  ])

  // Dados de exemplo
  const sampleChecklists = [
    {
      id: 'checklist-1',
      titulo: 'Checklist de Abertura - Restaurante',
      categoria: 'Operacional'
    },
    {
      id: 'checklist-2',
      titulo: 'Checklist de Limpeza Profunda',
      categoria: 'Limpeza'
    },
    {
      id: 'checklist-3',
      titulo: 'Checklist de Auditoria',
      categoria: 'Auditoria'
    },
    {
      id: 'checklist-4',
      titulo: 'Checklist de Eventos',
      categoria: 'Eventos'
    }
  ]

  const handleSaveSchedule = async (schedule: any) => {
    try {
      await saveSchedule(schedule)
      setLastResult(`✅ Agendamento "${schedule.titulo}" ${schedule.id ? 'atualizado' : 'criado'} com sucesso!`)
      
      // Simular atualização da lista
      if (schedule.id) {
        setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, ...schedule } : s))
      } else {
        setSchedules(prev => [...prev, { ...schedule, id: `schedule-${Date.now()}` }])
      }
    } catch (error) {
      setLastResult(`❌ Erro ao salvar agendamento: ${error}`)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId)
      setLastResult(`✅ Agendamento excluído com sucesso!`)
      setSchedules(prev => prev.filter(s => s.id !== scheduleId))
    } catch (error) {
      setLastResult(`❌ Erro ao excluir agendamento: ${error}`)
    }
  }

  const toggleScheduleStatus = (scheduleId: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, ativo: !s.ativo }
        : s
    ))
    const schedule = schedules.find(s => s.id === scheduleId)
    setLastResult(`✅ Agendamento "${schedule?.titulo}" ${schedule?.ativo ? 'pausado' : 'ativado'}!`)
  }

  const getFrequenciaDisplay = (schedule: any) => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    switch (schedule.frequencia) {
      case 'diaria':
        return `Todos os dias às ${schedule.horario}`
      case 'semanal':
        const dias = schedule.diasSemana?.map((d: number) => diasSemana[d]).join(', ')
        return `${dias} às ${schedule.horario}`
      case 'mensal':
        return `Todo dia ${schedule.diaMes} às ${schedule.horario}`
      default:
        return 'Configuração personalizada'
    }
  }

  const getFrequenciaIcon = (frequencia: string) => {
    switch (frequencia) {
      case 'diaria': return '📅'
      case 'semanal': return '📆'
      case 'mensal': return '🗓️'
      default: return '⚙️'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Agendamento
                </h1>
                <p className="text-sm text-gray-600">
                  Automatização de checklists com interface mobile-first
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                📅 Automático
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                📱 Mobile-First
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Introdução */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🤖</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Agendamento Inteligente de Checklists
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Configure execuções automáticas de checklists com <strong>frequências flexíveis</strong>, 
                    <strong>notificações inteligentes</strong> e <strong>interface totalmente otimizada para mobile</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      <Calendar className="w-3 h-3 mr-1" />
                      Múltiplas Frequências
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Bell className="w-3 h-3 mr-1" />
                      Notificações Smart
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Timer className="w-3 h-3 mr-1" />
                      4 Etapas Simples
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado da Última Ação */}
        {lastResult && (
          <div className="mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-900 font-medium">
                    {lastResult}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="schedules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Agendamentos Ativos
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Criar Agendamento
            </TabsTrigger>
          </TabsList>

          {/* Tab: Agendamentos Ativos */}
          <TabsContent value="schedules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className={`${
                  schedule.ativo ? 'bg-white' : 'bg-gray-50 opacity-75'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getFrequenciaIcon(schedule.frequencia)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{schedule.titulo}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={
                              schedule.ativo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }>
                              {schedule.ativo ? 'Ativo' : 'Pausado'}
                            </Badge>
                            {schedule.notificacoes && (
                              <Badge variant="outline" className="bg-white">
                                <Bell className="w-3 h-3 mr-1" />
                                Notifica
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleScheduleStatus(schedule.id)}
                          className="touch-manipulation"
                        >
                          {schedule.ativo ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <ScheduleDialog
                          checklist={sampleChecklists.find(c => c.id === schedule.checklistId) || sampleChecklists[0]}
                          existingSchedule={schedule}
                          onSave={handleSaveSchedule}
                          onDelete={handleDeleteSchedule}
                        >
                          <Button size="sm" variant="outline" className="touch-manipulation">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </ScheduleDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Frequência */}
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900 font-medium">
                          {getFrequenciaDisplay(schedule)}
                        </span>
                      </div>

                      {/* Observações */}
                      {schedule.observacoes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          💡 {schedule.observacoes}
                        </div>
                      )}

                      {/* Próxima Execução (simulada) */}
                      <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                        🕐 Próxima execução: {schedule.ativo ? 'Hoje às ' + schedule.horario : 'Pausado'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {schedules.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum agendamento criado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crie seu primeiro agendamento para automatizar checklists
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Criar Agendamento */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Checklists Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-green-600" />
                    Checklists Disponíveis
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Escolha um checklist para agendar execução automática
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sampleChecklists.map((checklist) => (
                      <div key={checklist.id} className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-green-900">{checklist.titulo}</h3>
                            <Badge variant="outline" className="mt-1 bg-white">
                              {checklist.categoria}
                            </Badge>
                          </div>
                          
                          <ScheduleDialog
                            checklist={checklist}
                            onSave={handleSaveSchedule}
                          >
                            <Button className="bg-green-600 hover:bg-green-700 touch-manipulation">
                              <Calendar className="w-4 h-4 mr-2" />
                              Agendar
                            </Button>
                          </ScheduleDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Guia de Frequências */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Tipos de Frequência
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Entenda as opções disponíveis para agendamento
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📅</span>
                        <span className="font-medium text-blue-900">Diária</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        Executa todos os dias no horário definido
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Ex: Todos os dias às 08:00
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📆</span>
                        <span className="font-medium text-green-900">Semanal</span>
                      </div>
                      <div className="text-sm text-green-800">
                        Executa em dias específicos da semana
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Ex: Segunda, Quarta e Sexta às 18:00
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🗓️</span>
                        <span className="font-medium text-orange-900">Mensal</span>
                      </div>
                      <div className="text-sm text-orange-800">
                        Executa em um dia específico do mês
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Ex: Todo dia 1 às 09:00
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚙️</span>
                        <span className="font-medium text-purple-900">Personalizada</span>
                      </div>
                      <div className="text-sm text-purple-800">
                        Configuração avançada com múltiplas opções
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Ex: Configuração complexa
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 