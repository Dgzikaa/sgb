'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AlertSystem, { AlertStats, useAlerts } from '@/components/checklist/AlertSystem'
import { 
  AlertTriangle, 
  Clock, 
  Bell,
  CheckCircle,
  Settings,
  Zap,
  Target,
  RefreshCw,
  Shield,
  Activity
} from 'lucide-react'

// =====================================================
// 🚨 DEMONSTRAÇÃO DO SISTEMA DE ALERTAS
// =====================================================

export default function AlertsDemoPage() {
  
  const { alerts, isLoading, error, resolveAlert, snoozeAlert, refreshAlerts } = useAlerts()
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)

  // Dados de exemplo para demonstração
  const sampleAlerts = [
    {
      id: 'alert-1',
      checklistId: 'checklist-1',
      scheduleId: 'schedule-1',
      titulo: 'Checklist de Abertura - Manhã',
      categoria: 'Operacional',
      tipo: 'urgente' as const,
      nivel: 'alto' as const,
      tempoAtraso: 180, // 3 horas
      horaEsperada: '08:00',
      dataEsperada: new Date().toDateString(),
      mensagem: '🚨 URGENTE: "Checklist de Abertura - Manhã" não foi executado há 3 horas. Ação imediata requerida.',
      ativo: true,
      resolvido: false,
      criadoEm: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert-2',
      checklistId: 'checklist-2',
      scheduleId: 'schedule-2',
      titulo: 'Verificação de Segurança',
      categoria: 'Segurança',
      tipo: 'perdido' as const,
      nivel: 'critico' as const,
      tempoAtraso: 600, // 10 horas
      horaEsperada: '09:00',
      dataEsperada: new Date().toDateString(),
      mensagem: '⚠️ CRÍTICO: "Verificação de Segurança" está atrasado há 10 horas! Verificação urgente necessária.',
      ativo: true,
      resolvido: false,
      criadoEm: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert-3',
      checklistId: 'checklist-3',
      scheduleId: 'schedule-3',
      titulo: 'Limpeza do Salão',
      categoria: 'Limpeza',
      tipo: 'atraso' as const,
      nivel: 'medio' as const,
      tempoAtraso: 90, // 1.5 horas
      horaEsperada: '18:00',
      dataEsperada: new Date().toDateString(),
      mensagem: '⏰ ATENÇÃO: "Limpeza do Salão" está 1 horas atrasado. Execute assim que possível.',
      ativo: true,
      resolvido: false,
      criadoEm: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    },
    {
      id: 'alert-4',
      checklistId: 'checklist-4',
      scheduleId: 'schedule-4',
      titulo: 'Checklist de Fechamento',
      categoria: 'Operacional',
      tipo: 'lembrete' as const,
      nivel: 'baixo' as const,
      tempoAtraso: 20, // 20 minutos
      horaEsperada: '22:00',
      dataEsperada: new Date().toDateString(),
      mensagem: '🔔 LEMBRETE: "Checklist de Fechamento" deveria ter sido executado há 20 minutos.',
      ativo: true,
      resolvido: false,
      criadoEm: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    }
  ]

  const activeAlerts = alerts.length > 0 ? alerts : sampleAlerts
  const criticalAlerts = activeAlerts.filter(alert => alert.nivel === 'critico')
  const urgentAlerts = activeAlerts.filter(alert => alert.nivel === 'alto')

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId)
      setLastAction(`✅ Alerta resolvido com sucesso!`)
    } catch (error) {
      setLastAction(`❌ Erro ao resolver alerta: ${error}`)
    }
  }

  const handleSnoozeAlert = async (alertId: string, minutes: number) => {
    try {
      await snoozeAlert(alertId, minutes)
      setLastAction(`⏰ Alerta adiado por ${minutes} minutos`)
    } catch (error) {
      setLastAction(`❌ Erro ao adiar alerta: ${error}`)
    }
  }

  const handleExecuteChecklist = async (checklistId: string) => {
    // Simular execução do checklist
    setLastAction(`▶️ Redirecionando para execução do checklist...`)
    // Aqui você redirecionaria para a página de execução
  }

  const handleOpenSchedule = (scheduleId: string) => {
    setLastAction(`📅 Abrindo configurações do agendamento...`)
    // Aqui você redirecionaria para as configurações do agendamento
  }

  const getAlertLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'critico': return 'text-red-600'
      case 'alto': return 'text-orange-600'
      case 'medio': return 'text-yellow-600'
      case 'baixo': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Alertas
                </h1>
                <p className="text-sm text-gray-600">
                  Detecção inteligente de checklists atrasados
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">
                🚨 Automático
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
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
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🚨</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Detecção Inteligente de Atrasos
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Sistema automático que detecta checklists não executados e cria alertas com <strong>níveis de urgência</strong>, 
                    <strong>ações rápidas</strong> e <strong>interface mobile otimizada</strong> para resolução imediata.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      <Shield className="w-3 h-3 mr-1" />
                      4 Níveis de Urgência
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Bell className="w-3 h-3 mr-1" />
                      Alertas em Tempo Real
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Target className="w-3 h-3 mr-1" />
                      Ações Rápidas
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status dos Alertas */}
        <div className="mb-6">
          <AlertStats 
            alerts={activeAlerts}
            onOpenAlerts={() => setAlertsOpen(true)}
          />
        </div>

        {/* Resultado da Última Ação */}
        {lastAction && (
          <div className="mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {lastAction}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas Ativos
            </TabsTrigger>
            <TabsTrigger value="levels" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Níveis de Urgência
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Ações Disponíveis
            </TabsTrigger>
          </TabsList>

          {/* Tab: Alertas Ativos */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alertas Detectados Automaticamente</h3>
              <Button
                variant="outline"
                onClick={() => {
                  refreshAlerts()
                  setLastAction('🔄 Alertas atualizados!')
                }}
                disabled={isLoading}
                className="touch-manipulation"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className={`
                  ${alert.nivel === 'critico' ? 'bg-red-50 border-red-200' : 
                    alert.nivel === 'alto' ? 'bg-orange-50 border-orange-200' :
                    alert.nivel === 'medio' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }
                `}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">
                          {alert.nivel === 'critico' ? '🔴' :
                           alert.nivel === 'alto' ? '🟠' :
                           alert.nivel === 'medio' ? '🟡' : '🔵'}
                        </div>
                        <div>
                          <CardTitle className="text-base">{alert.titulo}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`
                              ${alert.nivel === 'critico' ? 'bg-red-500 text-white' :
                                alert.nivel === 'alto' ? 'bg-orange-500 text-white' :
                                alert.nivel === 'medio' ? 'bg-yellow-500 text-white' :
                                'bg-blue-500 text-white'}
                            `}>
                              {alert.nivel.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              {alert.categoria}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">{alert.mensagem}</div>
                      
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2 bg-white rounded">
                          <Clock className="w-4 h-4 mx-auto mb-1 text-red-600" />
                          <div className="text-xs font-medium">Atraso</div>
                          <div className="text-sm font-bold text-red-600">
                            {alert.tempoAtraso < 60 
                              ? `${alert.tempoAtraso}min`
                              : `${Math.floor(alert.tempoAtraso / 60)}h`}
                          </div>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <Bell className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                          <div className="text-xs font-medium">Esperado</div>
                          <div className="text-sm font-bold text-blue-600">
                            {alert.horaEsperada}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 touch-manipulation"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSnoozeAlert(alert.id, 30)}
                          className="flex-1 touch-manipulation"
                        >
                          ⏰ 30min
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Níveis de Urgência */}
          <TabsContent value="levels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Sistema de Classificação Automática
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Os alertas são classificados automaticamente baseado no tempo de atraso
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🔴</span>
                      <div>
                        <div className="font-semibold text-red-900">CRÍTICO</div>
                        <div className="text-sm text-red-700">Mais de 8 horas atrasado</div>
                      </div>
                    </div>
                    <div className="text-sm text-red-800 space-y-1">
                      <div>• Animação pulsante</div>
                      <div>• Prioridade máxima</div>
                      <div>• Requer ação imediata</div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🟠</span>
                      <div>
                        <div className="font-semibold text-orange-900">ALTO</div>
                        <div className="text-sm text-orange-700">4 a 8 horas atrasado</div>
                      </div>
                    </div>
                    <div className="text-sm text-orange-800 space-y-1">
                      <div>• Alta visibilidade</div>
                      <div>• Ação necessária hoje</div>
                      <div>• Notificação urgente</div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🟡</span>
                      <div>
                        <div className="font-semibold text-yellow-900">MÉDIO</div>
                        <div className="text-sm text-yellow-700">1 a 4 horas atrasado</div>
                      </div>
                    </div>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <div>• Atenção necessária</div>
                      <div>• Pode afetar operações</div>
                      <div>• Executar quando possível</div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🔵</span>
                      <div>
                        <div className="font-semibold text-blue-900">BAIXO</div>
                        <div className="text-sm text-blue-700">Até 1 hora atrasado</div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• Lembrete amigável</div>
                      <div>• Sem urgência crítica</div>
                      <div>• Oportunidade de execução</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ações Disponíveis */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    Ações Rápidas Mobile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Resolver Alerta</div>
                        <div className="text-sm text-gray-600">
                          Marca o alerta como resolvido e remove da lista
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">Adiar Alerta</div>
                        <div className="text-sm text-gray-600">
                          Oculta temporariamente (15min, 30min, 1h, 2h)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Executar Checklist</div>
                        <div className="text-sm text-gray-600">
                          Vai direto para a execução do checklist
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Settings className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Editar Agendamento</div>
                        <div className="text-sm text-gray-600">
                          Modifica horários e frequência do agendamento
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Interface Mobile-First
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    
                    <div className="flex items-start gap-3">
                      <div className="text-xl">📱</div>
                      <div>
                        <div className="font-medium">Botão Flutuante</div>
                        <div className="text-sm text-gray-600">
                          Ícone fixo com contador de alertas e cores por urgência
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-xl">👆</div>
                      <div>
                        <div className="font-medium">Touch-Optimized</div>
                        <div className="text-sm text-gray-600">
                          Botões grandes com classe touch-manipulation
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-xl">🎨</div>
                      <div>
                        <div className="font-medium">Cores Intuitivas</div>
                        <div className="text-sm text-gray-600">
                          Sistema de cores universal (vermelho=crítico, etc.)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-xl">⚡</div>
                      <div>
                        <div className="font-medium">Ações Instantâneas</div>
                        <div className="text-sm text-gray-600">
                          Feedback imediato e atualizações em tempo real
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sistema de Alertas */}
      <AlertSystem
        alerts={activeAlerts}
        onResolveAlert={handleResolveAlert}
        onSnoozeAlert={handleSnoozeAlert}
        onExecuteChecklist={handleExecuteChecklist}
        onOpenSchedule={handleOpenSchedule}
        showFloatingButton={true}
      />
    </div>
  )
} 