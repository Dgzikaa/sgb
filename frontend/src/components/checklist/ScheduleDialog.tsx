'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';

// =====================================================
// 📅 AGENDAMENTO DE CHECKLISTS (MOBILE-FRIENDLY)
// =====================================================

interface ScheduleConfig {
  id?: string;
  checklistId: string;
  titulo: string;
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'personalizada';
  horario: string;
  diasSemana?: number[]; // 0=domingo, 1=segunda, etc.
  diaMes?: number; // 1-31
  ativo: boolean;
  notificacoes: boolean;
  responsaveis?: string[];
  observacoes?: string;
}

interface ScheduleDialogProps {
  checklist: {
    id: string;
    titulo: string;
    categoria: string;
  };
  existingSchedule?: ScheduleConfig;
  onSave: (schedule: ScheduleConfig) => Promise<void>;
  onDelete?: (scheduleId: string) => Promise<void>;
  children: React.ReactNode;
}

export default function ScheduleDialog({
  checklist,
  existingSchedule,
  onSave,
  onDelete,
  children,
}: ScheduleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'frequency' | 'timing' | 'notifications' | 'confirm'
  >('frequency');
  const [isLoading, setIsLoading] = useState(false);

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
    observacoes: existingSchedule?.observacoes || '',
  });

  const diasSemanaOptions = [
    { value: 0, label: 'Dom', emoji: '🔵' },
    { value: 1, label: 'Seg', emoji: '💼' },
    { value: 2, label: 'Ter', emoji: '💼' },
    { value: 3, label: 'Qua', emoji: '💼' },
    { value: 4, label: 'Qui', emoji: '💼' },
    { value: 5, label: 'Sex', emoji: '💼' },
    { value: 6, label: 'Sáb', emoji: '🔵' },
  ];

  const frequenciaOptions = [
    {
      value: 'diaria',
      label: 'Diária',
      emoji: '📅',
      desc: 'Todo dia no horário definido',
      example: 'Todos os dias às 08:00',
    },
    {
      value: 'semanal',
      label: 'Semanal',
      emoji: '📆',
      desc: 'Dias específicos da semana',
      example: 'Seg, Ter, Qua, Qui, Sex às 08:00',
    },
    {
      value: 'mensal',
      label: 'Mensal',
      emoji: '🗓️',
      desc: 'Dia específico do mês',
      example: 'Todo dia 1 às 08:00',
    },
    {
      value: 'personalizada',
      label: 'Personalizada',
      emoji: '⚙️',
      desc: 'Configuração avançada',
      example: 'Configuração customizada',
    },
  ];

  const resetDialog = () => {
    setCurrentStep('frequency');
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
      observacoes: '',
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(config);
      setIsOpen(false);
      if (!existingSchedule) {
        resetDialog();
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSchedule?.id || !onDelete) return;

    setIsLoading(true);
    try {
      await onDelete(existingSchedule.id);
      setIsOpen(false);
      resetDialog();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiaSemana = (dia: number) => {
    setConfig(prev => ({
      ...prev,
      diasSemana: prev.diasSemana?.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...(prev.diasSemana || []), dia],
    }));
  };

  const getFrequenciaDescription = () => {
    switch (config.frequencia) {
      case 'diaria':
        return `Todos os dias às ${config.horario}`;
      case 'semanal': {
        const diasTexto = config.diasSemana
          ?.map(d => diasSemanaOptions[d].label)
          .join(', ');
        return `${diasTexto} às ${config.horario}`;
      }
      case 'mensal':
        return `Todo dia ${config.diaMes} às ${config.horario}`;
      case 'personalizada':
        return 'Configuração personalizada';
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'frequency':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium text-blue-900">
                Escolha a Frequência
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Com que frequência este checklist deve ser executado?
              </p>
            </div>

            <div className="space-y-3">
              {frequenciaOptions.map(option => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all touch-manipulation ${
                    config.frequencia === option.value
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() =>
                    setConfig(prev => ({
                      ...prev,
                      frequencia: option.value as 'diaria' | 'semanal' | 'mensal' | 'personalizada',
                    }))
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        ${
                          config.frequencia === option.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }
                      `}
                      >
                        {config.frequencia === option.value ? (
                          <CheckCircle className="w-5 h-5" />
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
        );

      case 'timing':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium text-green-900">
                Configure o Horário
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Defina quando o checklist deve ser executado
              </p>
            </div>

            {/* Horário */}
            <div>
              <Label className="text-sm font-medium">Horário:</Label>
              <Input
                type="time"
                value={config.horario}
                onChange={e =>
                  setConfig(prev => ({ ...prev, horario: e.target.value }))
                }
                className="mt-1 touch-manipulation"
              />
            </div>

            {/* Configurações específicas por frequência */}
            {config.frequencia === 'semanal' && (
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Dias da Semana:
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {diasSemanaOptions.map(dia => (
                    <Button
                      key={dia.value}
                      variant={
                        config.diasSemana?.includes(dia.value)
                          ? 'default'
                          : 'outline'
                      }
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
                <Label className="text-sm font-medium">Dia do Mês:</Label>
                <Select
                  value={config.diaMes?.toString()}
                  onValueChange={value =>
                    setConfig(prev => ({ ...prev, diaMes: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="mt-1 touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                      <SelectItem key={dia} value={dia.toString()}>
                        Dia {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview da configuração */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Preview:
              </div>
              <div className="text-sm text-gray-900">
                {getFrequenciaDescription()}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-medium text-orange-900">Notificações</h3>
              <p className="text-sm text-orange-700 mt-1">
                Configure lembretes e responsáveis
              </p>
            </div>

            {/* Título do Agendamento */}
            <div>
              <Label className="text-sm font-medium">
                Título do Agendamento:
              </Label>
              <Input
                value={config.titulo}
                onChange={e =>
                  setConfig(prev => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Ex: Checklist de Abertura - Manhã"
                className="mt-1 touch-manipulation"
              />
            </div>

            {/* Ativar Agendamento */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">
                  Ativar Agendamento
                </div>
                <div className="text-sm text-blue-700">
                  O agendamento começará a funcionar imediatamente
                </div>
              </div>
              <Switch
                checked={config.ativo}
                onCheckedChange={checked =>
                  setConfig(prev => ({ ...prev, ativo: checked }))
                }
              />
            </div>

            {/* Notificações */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="font-medium text-orange-900">
                  Enviar Notificações
                </div>
                <div className="text-sm text-orange-700">
                  Lembrar quando o checklist deve ser executado
                </div>
              </div>
              <Switch
                checked={config.notificacoes}
                onCheckedChange={checked =>
                  setConfig(prev => ({ ...prev, notificacoes: checked }))
                }
              />
            </div>

            {/* Observações */}
            <div>
              <Label className="text-sm font-medium">
                Observações (opcional):
              </Label>
              <textarea
                value={config.observacoes}
                onChange={e =>
                  setConfig(prev => ({ ...prev, observacoes: e.target.value }))
                }
                placeholder="Instruções especiais, exceções, etc."
                className="mt-1 w-full p-3 border rounded-lg resize-none touch-manipulation"
                rows={3}
              />
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium text-green-900">
                Confirmar Agendamento
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Revise as configurações antes de salvar
              </p>
            </div>

            <div className="space-y-3">
              {/* Checklist */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">
                  Checklist:
                </div>
                <div className="text-sm text-blue-800">{checklist.titulo}</div>
                <Badge variant="outline" className="mt-1 bg-white">
                  {checklist.categoria}
                </Badge>
              </div>

              {/* Agendamento */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">Título:</div>
                <div className="text-sm text-gray-800">{config.titulo}</div>
              </div>

              {/* Frequência */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  Frequência:
                </div>
                <div className="text-sm text-gray-800">
                  {getFrequenciaDescription()}
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm font-medium text-gray-900">
                    Status:
                  </div>
                  <Badge
                    className={
                      config.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {config.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm font-medium text-gray-900">
                    Notificações:
                  </div>
                  <Badge
                    className={
                      config.notificacoes
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {config.notificacoes ? 'Ativadas' : 'Desativadas'}
                  </Badge>
                </div>
              </div>

              {config.observacoes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">
                    Observações:
                  </div>
                  <div className="text-sm text-gray-800">
                    {config.observacoes}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
              Próximo
            </Button>
          </div>
        );

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
              Próximo
            </Button>
          </div>
        );

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
              Próximo
            </Button>
          </div>
        );

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
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {existingSchedule ? 'Atualizar' : 'Criar'} Agendamento
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
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
            <div
              className={`w-2 h-2 rounded-full ${
                currentStep === 'frequency' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                currentStep === 'timing' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                currentStep === 'notifications' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                currentStep === 'confirm' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          </div>

          {renderStepContent()}

          <Separator className="my-4" />

          {renderFooter()}
        </DialogContent>
      </Dialog>
    </>
  );
}

// =====================================================
// 🎯 HOOK PARA GERENCIAR AGENDAMENTOS
// =====================================================

export function useSchedules() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  interface AgendamentoData {
    checklist_id: string;
    data_inicio: string;
    data_fim: string;
    frequencia: string;
    responsavel_id: string;
    observacoes?: string;
    configuracao?: Record<string, unknown>;
  }

  const saveSchedule = async (schedule: ScheduleConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/operacional/checklists/schedules', {
        method: schedule.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar agendamento');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/checklists/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir agendamento');
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveSchedule,
    deleteSchedule,
    isLoading,
    error,
  };
}
