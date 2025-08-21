'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  Play,
  ExternalLink,
  X,
} from 'lucide-react';

// =====================================================
// 🚨 SISTEMA DE ALERTAS PARA CHECKLISTS (MOBILE-FRIENDLY)
// =====================================================

interface ChecklistAlert {
  id: string;
  checklistId: string;
  scheduleId: string;
  titulo: string;
  categoria: string;
  tipo: 'atraso' | 'perdido' | 'urgente' | 'lembrete';
  nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  tempoAtraso: number; // em minutos
  horaEsperada: string;
  dataEsperada: string;
  mensagem: string;
  ativo: boolean;
  resolvido: boolean;
  criadoEm: string;
}

interface AlertSystemProps {
  alerts?: ChecklistAlert[];
  onResolveAlert?: (alertId: string) => Promise<void>;
  onSnoozeAlert?: (alertId: string, minutes: number) => Promise<void>;
  onExecuteChecklist?: (checklistId: string) => Promise<void>;
  onOpenSchedule?: (scheduleId: string) => void;
  showFloatingButton?: boolean;
}

export default function AlertSystem({
  alerts = [],
  onResolveAlert,
  onSnoozeAlert,
  onExecuteChecklist,
  onOpenSchedule,
  showFloatingButton = true,
}: AlertSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ChecklistAlert | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const activeAlerts = alerts.filter(alert => alert.ativo && !alert.resolvido);
  const criticalAlerts = activeAlerts.filter(
    alert => alert.nivel === 'critico'
  );
  const urgentAlerts = activeAlerts.filter(alert => alert.nivel === 'alto');

  const getAlertIcon = (tipo: string, nivel: string) => {
    if (nivel === 'critico') return '🔴';
    if (nivel === 'alto') return '🟠';
    if (nivel === 'medio') return '🟡';
    if (tipo === 'lembrete') return '🔔';
    return '🔵';
  };

  const getAlertColor = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'alto':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medio':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'baixo':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getTempoAtrasoText = (minutos: number) => {
    if (minutos < 60) return `${minutos}min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!onResolveAlert) return;

    setIsLoading(true);
    try {
      await onResolveAlert(alertId);
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnoozeAlert = async (alertId: string, minutes: number) => {
    if (!onSnoozeAlert) return;

    setIsLoading(true);
    try {
      await onSnoozeAlert(alertId, minutes);
    } catch (error) {
      console.error('Erro ao adiar alerta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteChecklist = async (checklistId: string) => {
    if (!onExecuteChecklist) return;

    setIsLoading(true);
    try {
      await onExecuteChecklist(checklistId);
      setSelectedAlert(null);
    } catch (error) {
      console.error('Erro ao executar checklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const snoozeOptions = [
    { value: 15, label: '15 min', emoji: '⏰' },
    { value: 30, label: '30 min', emoji: '⏱️' },
    { value: 60, label: '1 hora', emoji: '🕐' },
    { value: 120, label: '2 horas', emoji: '🕑' },
  ];

  // Floating Alert Button
  const FloatingAlertButton = () => {
    if (!showFloatingButton || activeAlerts.length === 0) return null;

    return (
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={`
            shadow-lg touch-manipulation rounded-full w-14 h-14
            ${
              criticalAlerts.length > 0
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : urgentAlerts.length > 0
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
        >
          <div className="relative">
            {/* <Bell className="w-6 h-6 text-white" /> */}
            {activeAlerts.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </div>
            )}
          </div>
        </Button>
      </div>
    );
  };

  // Alert Detail Dialog
  const AlertDetailDialog = () => {
    if (!selectedAlert) return null;

    return (
      <Dialog
        open={!!selectedAlert}
        onOpenChange={() => setSelectedAlert(null)}
      >
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Detalhes do Alerta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info do Alerta */}
            <div
              className={`p-4 rounded-lg ${getAlertColor(selectedAlert.nivel)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {getAlertIcon(selectedAlert.tipo, selectedAlert.nivel)}
                </span>
                <div>
                  <div className="font-medium">{selectedAlert.titulo}</div>
                  <Badge variant="outline" className="bg-white">
                    {selectedAlert.categoria}
                  </Badge>
                </div>
              </div>
              <div className="text-sm mt-2">{selectedAlert.mensagem}</div>
            </div>

            {/* Tempo de Atraso */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 rounded-lg text-center">
                {/* <Clock className="w-5 h-5 mx-auto mb-1 text-red-600" /> */}
                <div className="text-sm font-medium text-red-900">Atraso</div>
                <div className="text-lg font-bold text-red-600">
                  {getTempoAtrasoText(selectedAlert.tempoAtraso)}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                {/* <CalendarX className="w-5 h-5 mx-auto mb-1 text-blue-600" /> */}
                <div className="text-sm font-medium text-blue-900">
                  Esperado
                </div>
                <div className="text-sm font-bold text-blue-600">
                  {selectedAlert.horaEsperada}
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="space-y-2">
              <Button
                onClick={() =>
                  handleExecuteChecklist(selectedAlert.checklistId)
                }
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 touch-manipulation"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Checklist Agora
              </Button>

              {/* Opções de Soneca */}
              <div className="grid grid-cols-2 gap-2">
                {snoozeOptions.slice(0, 2).map(option => (
                  <Button
                    key={option.value}
                    variant="outline"
                    onClick={() =>
                      handleSnoozeAlert(selectedAlert.id, option.value)
                    }
                    disabled={isLoading}
                    className="touch-manipulation"
                  >
                    {option.emoji} {option.label}
                  </Button>
                ))}
              </div>

              {/* Resolver/Outras ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                  disabled={isLoading}
                  className="flex-1 touch-manipulation"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolver
                </Button>
                {onOpenSchedule && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenSchedule(selectedAlert.scheduleId);
                      setSelectedAlert(null);
                    }}
                    className="flex-1 touch-manipulation"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Agendamento
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Main Alert List
  const AlertList = () => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <Bell className="w-5 h-5 text-orange-600" /> */}
              Alertas Ativos
            </div>
            <Badge className="bg-red-100 text-red-800">
              {activeAlerts.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-96 space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-medium text-gray-900 mb-2">Tudo em Ordem!</h3>
              <p className="text-gray-600 text-sm">
                Nenhum checklist atrasado no momento
              </p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <Card
                key={alert.id}
                className={`cursor-pointer transition-all touch-manipulation ${getAlertColor(alert.nivel)}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getAlertIcon(alert.tipo, alert.nivel)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{alert.titulo}</div>
                      <div className="text-sm opacity-80 mt-1">
                        {alert.mensagem}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-white text-xs">
                          {alert.categoria}
                        </Badge>
                        <div className="text-xs opacity-70 flex items-center gap-1">
                          {/* <Clock className="w-3 h-3" /> */}
                          {getTempoAtrasoText(alert.tempoAtraso)} atraso
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          handleResolveAlert(alert.id);
                        }}
                        className="h-8 w-8 p-0 touch-manipulation"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {activeAlerts.length > 0 && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => {
                activeAlerts.forEach(alert => handleResolveAlert(alert.id));
              }}
              disabled={isLoading}
              className="flex-1 touch-manipulation"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolver Todos
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 touch-manipulation"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <FloatingAlertButton />
      <AlertList />
      <AlertDetailDialog />
    </>
  );
}

// =====================================================
// 📊 COMPONENTE DE ESTATÍSTICAS DE ALERTAS
// =====================================================

interface AlertStatsProps {
  alerts: ChecklistAlert[];
  onOpenAlerts?: () => void;
}

export function AlertStats({ alerts, onOpenAlerts }: AlertStatsProps) {
  const activeAlerts = alerts.filter(alert => alert.ativo && !alert.resolvido);
  const criticalCount = activeAlerts.filter(
    alert => alert.nivel === 'critico'
  ).length;
  const urgentCount = activeAlerts.filter(
    alert => alert.nivel === 'alto'
  ).length;
  const totalCount = activeAlerts.length;

  if (totalCount === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-medium text-green-900">Tudo em Ordem!</div>
              <div className="text-sm text-green-700">
                Nenhum checklist atrasado
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`cursor-pointer transition-all touch-manipulation ${
        criticalCount > 0
          ? 'bg-red-50 border-red-200'
          : 'bg-orange-50 border-orange-200'
      }`}
      onClick={onOpenAlerts}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle
                className={`w-8 h-8 ${
                  criticalCount > 0 ? 'text-red-600' : 'text-orange-600'
                }`}
              />
              {criticalCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <div
                className={`font-medium ${
                  criticalCount > 0 ? 'text-red-900' : 'text-orange-900'
                }`}
              >
                {totalCount} Alerta{totalCount !== 1 ? 's' : ''} Ativo
                {totalCount !== 1 ? 's' : ''}
              </div>
              <div
                className={`text-sm ${
                  criticalCount > 0 ? 'text-red-700' : 'text-orange-700'
                }`}
              >
                {criticalCount > 0 &&
                  `${criticalCount} crítico${criticalCount !== 1 ? 's' : ''} • `}
                {urgentCount > 0 &&
                  `${urgentCount} urgente${urgentCount !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {criticalCount > 0 && (
              <Badge className="bg-red-500 text-white">{criticalCount}</Badge>
            )}
            {urgentCount > 0 && (
              <Badge className="bg-orange-500 text-white">{urgentCount}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// 🎯 HOOK PARA GERENCIAR ALERTAS
// =====================================================

export function useAlerts() {
  const [alerts, setAlerts] = useState<ChecklistAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/operacoes/checklists/alerts');
      if (!response.ok) {
        throw new Error('Erro ao buscar alertas');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    const response = await fetch(`/api/checklists/alerts/${alertId}/resolve`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Erro ao resolver alerta');
    }

    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, resolvido: true } : alert
      )
    );
  };

  const snoozeAlert = async (alertId: string, minutes: number) => {
    const response = await fetch(`/api/checklists/alerts/${alertId}/snooze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ minutes }),
    });

    if (!response.ok) {
      throw new Error('Erro ao adiar alerta');
    }

    // Temporarily hide the alert
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, ativo: false } : alert
      )
    );
  };

  useEffect(() => {
    fetchAlerts();

    // ✅ Otimizado: Auto-refresh alerts a cada 10 minutos em vez de 2
    const interval = setInterval(fetchAlerts, 10 * 60 * 1000); // 10 minutos
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    isLoading,
    error,
    resolveAlert,
    snoozeAlert,
    refreshAlerts: fetchAlerts,
  };
}
