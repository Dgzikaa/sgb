'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  Repeat, 
  X,
  Check,
  ChevronRight,
  Users,
  Bell,
  Settings,
  CalendarDays,
  Timer,
  Zap
} from 'lucide-react'

// =====================================================
// ðŸ“… AGENDAMENTO DE CHECKLISTS (MOBILE-FRIENDLY)
// =====================================================

interface ScheduleConfig {
  id?: string
  checklistId: string
  titulo: string
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'personalizada'
  horario: string
  diasSemana?: number[] // 0=domingo, 1=segunda, etc.
  diaMes?: number // 1-31
  ativo: boolean
  notificacoes: boolean
  responsaveis?: string[]
  observacoes?: string
}

interface ScheduleDialogProps {
  checklist: {
    id: string
    titulo: string
    categoria: string
  }
  existingSchedule?: ScheduleConfig
  onSave: (schedule: ScheduleConfig) => Promise<void>
  onDelete?: (scheduleId: string) => Promise<void>
  children: React.ReactNode
}

export default function ScheduleDialog({
  checklist,
  existingSchedule,
  onSave,
  onDelete,
  children
}: ScheduleDialogProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'frequency' | 'timing' | 'notifications' | 'confirm'>('frequency')
  const [isLoading, setIsLoading] = useState(false)
  
  const [config, setConfig] = useState<ScheduleConfig>({
    checklistId: checklist.id,
    titulo: existingSchedule?.titulo || `Agendamento - ${checklist.titulo}`,
    frequencia: existingSchedule?.frequencia || 'diaria',
    horario: existingSchedule?.horario || '08:00',
    diasSemana: existingSchedule?.diasSemana || [1, 2, 3, 4, 5], // Segunda a sexta
    diaMes: existingSchedule?.diaMes || 1,
    ativo: existingSchedule?.ativo ?? true,
    notificacoes: existingSchedule?.notificacoes ?? true,
    responsaveis: existingSchedule?.responsaveis || [],
    observacoes: existingSchedule?.observacoes || ''
  })

  const diasSemanaOptions = [
    { value: 0, label: 'Dom', emoji: 'ðŸ”µ' },
    { value: 1, label: 'Seg', emoji: 'ðŸ’¼' },
    { value: 2, label: 'Ter', emoji: 'ðŸ’¼' },
    { value: 3, label: 'Qua', emoji: 'ðŸ’¼' },
    { value: 4, label: 'Qui', emoji: 'ðŸ’¼' },
    { value: 5, label: 'Sex', emoji: 'ðŸ’¼' },
    { value: 6, label: 'SÃ¡b', emoji: 'ðŸ”µ' }
  ]

  const frequenciaOptions = [
    { 
      value: 'diaria', 
      label: 'DiÃ¡ria', 
      emoji: 'ðŸ“…', 
      desc: 'Todo dia no horÃ¡rio definido',
      example: 'Todos os dias Ã s 08:00'
    },
    { 
      value: 'semanal', 
      label: 'Semanal', 
      emoji: 'ðŸ“†', 
      desc: 'Dias especÃ­ficos da semana',
      example: 'Seg, Ter, Qua, Qui, Sex Ã s 08:00'
    },
    { 
      value: 'mensal', 
      label: 'Mensal', 
      emoji: 'ðŸ—“ï¸', 
      desc: 'Dia especÃ­fico do mÃªs',
      example: 'Todo dia 1 Ã s 08:00'
    },
    { 
      value: 'personalizada', 
      label: 'Personalizada', 
      emoji: 'âš™ï¸', 
      desc: 'ConfiguraÃ§Ã£o avanÃ§ada',
      example: 'ConfiguraÃ§Ã£o customizada'
    }
  ]

  const resetDialog = () => {
    setCurrentStep('frequency')
    setConfig({
      checklistId: checklist.id,
      titulo: `Agendamento - ${checklist.titulo}`,
      frequencia: 'diaria',
      horario: '08:00',
      diasSemana: [1, 2, 3, 4, 5],
      diaMes: 1,
      ativo: true,
      notificacoes: true,
      responsaveis: [],
      observacoes: ''
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(config)
      setIsOpen(false)
      if (!existingSchedule) {
        resetDialog()
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingSchedule?.id || !onDelete) return
    
    setIsLoading(true)
    try {
      await onDelete(existingSchedule.id)
      setIsOpen(false)
      resetDialog()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDiaSemana = (dia: number) => {
    setConfig(prev => ({
      ...prev,
      diasSemana: prev.diasSemana?.includes(dia)
        ? prev.diasSemana.filter((d: any) => d !== dia)
        : [...(prev.diasSemana || []), dia]
    }))
  }

  const getFrequenciaDescription = () => {
    switch (config.frequencia) {
      case 'diaria':
        return `Todos os dias Ã s ${config.horario}`
      case 'semanal':
        const diasTexto = config.diasSemana?.map((d: any) => diasSemanaOptions[d].label).join(', ')
        return `${diasTexto} Ã s ${config.horario}`
      case 'mensal':
        return `Todo dia ${config.diaMes} Ã s ${config.horario}`
      case 'personalizada':
        return 'ConfiguraÃ§Ã£o personalizada'
      default:
        return ''
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'frequency':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium text-blue-900">Escolha a FrequÃªncia</h3>
              <p className="text-sm text-blue-700 mt-1">
                Com que frequÃªncia este checklist deve ser executado?
              </p>
            </div>

            <div className="space-y-3">
              {frequenciaOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`cursor-pointer transition-all touch-manipulation ${
                    config.frequencia === option.value 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setConfig(prev => ({ ...prev, frequencia: option.value as any }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        ${config.frequencia === option.value 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {config.frequencia === option.value ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-xl">{option.emoji}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {option.desc}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Ex: {option.example}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'timing':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium text-green-900">Configure o HorÃ¡rio</h3>
              <p className="text-sm text-green-700 mt-1">
                Defina quando o checklist deve ser executado
              </p>
            </div>

            {/* HorÃ¡rio */}
            <div>
              <Label className="text-sm font-medium">HorÃ¡rio:</Label>
              <Input
                type="time"
                value={config.horario}
                onChange={(e) => setConfig(prev => ({ ...prev, horario: e.target.value }))}
                className="mt-1 touch-manipulation"
              />
            </div>

            {/* ConfiguraÃ§Ãµes especÃ­ficas por frequÃªncia */}
            {config.frequencia === 'semanal' && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Dias da Semana:</Label>
                <div className="grid grid-cols-7 gap-2">
                  {diasSemanaOptions.map((dia) => (
                    <Button
                      key={dia.value}
                      variant={config.diasSemana?.includes(dia.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDiaSemana(dia.value)}
                      className="h-12 flex flex-col touch-manipulation"
                    >
                      <span className="text-lg">{dia.emoji}</span>
                      <span className="text-xs">{dia.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {config.frequencia === 'mensal' && (
              <div>
                <Label className="text-sm font-medium">Dia do MÃªs:</Label>
                <Select 
                  value={config.diaMes?.toString()} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, diaMes: parseInt(value) }))}
                >
                  <SelectTrigger className="mt-1 touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia: any) => (
                      <SelectItem key={dia} value={dia.toString()}>
                        Dia {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview da configuraÃ§Ã£o */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">Preview:</div>
              <div className="text-sm text-gray-900">{getFrequenciaDescription()}</div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Bell className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-medium text-orange-900">NotificaÃ§Ãµes</h3>
              <p className="text-sm text-orange-700 mt-1">
                Configure lembretes e responsÃ¡veis
              </p>
            </div>

            {/* TÃ­tulo do Agendamento */}
            <div>
              <Label className="text-sm font-medium">TÃ­tulo do Agendamento:</Label>
              <Input
                value={config.titulo}
                onChange={(e) => setConfig(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Checklist de Abertura - ManhÃ£"
                className="mt-1 touch-manipulation"
              />
            </div>

            {/* Ativar Agendamento */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">Ativar Agendamento</div>
                <div className="text-sm text-blue-700">
                  O agendamento comeÃ§arÃ¡ a funcionar imediatamente
                </div>
              </div>
              <Switch
                checked={config.ativo}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, ativo: checked }))}
              />
            </div>

            {/* NotificaÃ§Ãµes */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="font-medium text-orange-900">Enviar NotificaÃ§Ãµes</div>
                <div className="text-sm text-orange-700">
                  Lembrar quando o checklist deve ser executado
                </div>
              </div>
              <Switch
                checked={config.notificacoes}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notificacoes: checked }))}
              />
            </div>

            {/* ObservaÃ§Ãµes */}
            <div>
              <Label className="text-sm font-medium">ObservaÃ§Ãµes (opcional):</Label>
              <textarea
                value={config.observacoes}
                onChange={(e) => setConfig(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="InstruÃ§Ãµes especiais, exceÃ§Ãµes, etc."
                className="mt-1 w-full p-3 border rounded-lg resize-none touch-manipulation"
                rows={3}
              />
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Check className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium text-green-900">Confirmar Agendamento</h3>
              <p className="text-sm text-green-700 mt-1">
                Revise as configuraÃ§Ãµes antes de salvar
              </p>
            </div>

            <div className="space-y-3">
              {/* Checklist */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Checklist:</div>
                <div className="text-sm text-blue-800">{checklist.titulo}</div>
                <Badge variant="outline" className="mt-1 bg-white">
                  {checklist.categoria}
                </Badge>
              </div>

              {/* Agendamento */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">TÃ­tulo:</div>
                <div className="text-sm text-gray-800">{config.titulo}</div>
              </div>

              {/* FrequÃªncia */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">FrequÃªncia:</div>
                <div className="text-sm text-gray-800">{getFrequenciaDescription()}</div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm font-medium text-gray-900">Status:</div>
                  <Badge className={config.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {config.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm font-medium text-gray-900">NotificaÃ§Ãµes:</div>
                  <Badge className={config.notificacoes ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                    {config.notificacoes ? 'Ativadas' : 'Desativadas'}
                  </Badge>
                </div>
              </div>

              {config.observacoes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">ObservaÃ§Ãµes:</div>
                  <div className="text-sm text-gray-800">{config.observacoes}</div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 'frequency':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 touch-manipulation"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={() => setCurrentStep('timing')}
              className="flex-1 touch-manipulation"
            >
              PrÃ³ximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 'timing':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('frequency')}
              className="flex-1 touch-manipulation"
            >
              Voltar
            </Button>
            <Button
              onClick={() => setCurrentStep('notifications')}
              className="flex-1 touch-manipulation"
            >
              PrÃ³ximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 'notifications':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('timing')}
              className="flex-1 touch-manipulation"
            >
              Voltar
            </Button>
            <Button
              onClick={() => setCurrentStep('confirm')}
              className="flex-1 touch-manipulation"
            >
              PrÃ³ximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-3">
            {existingSchedule && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="w-full touch-manipulation"
              >
                {isLoading ? 'Excluindo...' : 'Excluir Agendamento'}
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('notifications')}
                className="flex-1 touch-manipulation"
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 touch-manipulation"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {existingSchedule ? 'Atualizar' : 'Criar'} Agendamento
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {existingSchedule ? 'Editar' : 'Novo'} Agendamento
            </DialogTitle>
          </DialogHeader>
          
          {/* Indicador de Etapas */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${
              currentStep === 'frequency' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              currentStep === 'timing' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              currentStep === 'notifications' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              currentStep === 'confirm' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
          </div>

          {renderStepContent()}
          
          <Separator className="my-4" />
          
          {renderFooter()}
        </DialogContent>
      </Dialog>
    </>
  )
}

// =====================================================
// ðŸŽ¯ HOOK PARA GERENCIAR AGENDAMENTOS
// =====================================================

export function useSchedules() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSchedule = async (schedule: ScheduleConfig) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/checklists/schedules', {
        method: schedule.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar agendamento')
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/checklists/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir agendamento')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    saveSchedule,
    deleteSchedule,
    isLoading,
    error
  }
} 
