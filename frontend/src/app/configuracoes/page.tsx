'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { PWAInstaller, usePWAInstaller } from '@/components/PWAInstaller'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import { useBar } from '@/contexts/BarContext'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Target, User, Settings, Smartphone, CheckCircle, Shield, AlertTriangle, Users, Activity, Server, Eye, EyeOff, RefreshCw } from 'lucide-react'
import PermissionGuard from '@/components/PermissionGuard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SecurityEvent {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'critical'
  category: string
  event_type: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  endpoint?: string
  details: Record<string, any>
  risk_score: number
  resolved: boolean
}

interface SecurityMetrics {
  total_events: number
  critical_events: number
  warning_events: number
  info_events: number
  auth_events: number
  access_events: number
  injection_events: number
  rate_limit_events: number
  api_abuse_events: number
  backup_events: number
  system_events: number
  unique_ips: number
  failed_logins: number
  blocked_ips: number
}

interface AuditLog {
  id: string
  timestamp: string
  operation: string
  table_name?: string
  record_id?: string
  user_email?: string
  user_role?: string
  ip_address?: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: string
  endpoint?: string
  method?: string
}

interface RateLimitStatus {
  redisConnected: boolean
  totalKeys: number
}

function ConfiguracoesContent() {
  const { setPageTitle } = usePageTitle()
  const { toast } = useToast()
  const { user, isAdminWithSpecificPermissions } = usePermissions()
  const { selectedBar } = useBar()
  const { canInstall, isInstalled, install } = usePWAInstaller()

  const [activeTab, setActiveTab] = useState<'metas' | 'usuarios' | 'integracoes' | 'seguranca'>('metas')
  const [metas, setMetas] = useState({
    faturamento_diario: 37000,
    clientes_por_dia: 500,
    ticket_medio: 93,
    reservas_diarias: 133,
    reservas_semanais: 800,
    reservas_mensais: 3200,
    tempo_saida_cozinha: 12,
    tempo_saida_bar: 4,
    tempo_medio_atendimento: 15,
    eficiencia_producao: 85
  })
  const [loading, setLoading] = useState(false)

  // Estados para segurança
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showSensitiveData, setShowSensitiveData] = useState(false)

  useEffect(() => {
    setPageTitle('Configurações')
    return () => setPageTitle('')
  }, [setPageTitle])

  // Carregar dados de segurança
  const fetchSecurityData = async () => {
    try {
      setSecurityLoading(true)
      const [eventsRes, metricsRes, auditRes, rateLimitRes] = await Promise.all([
        fetch('/api/security/events'),
        fetch('/api/security/metrics'),
        fetch('/api/security/audit'),
        fetch('/api/security/rate-limit-status')
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setSecurityEvents(eventsData.events || [])
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setSecurityMetrics(metricsData.metrics)
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json()
        setAuditLogs(auditData.logs || [])
      }

      if (rateLimitRes.ok) {
        const rateLimitData = await rateLimitRes.json()
        setRateLimitStatus(rateLimitData.status)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error)
    } finally {
      setSecurityLoading(false)
    }
  }

  // Auto-refresh para dados de segurança
  useEffect(() => {
    if (activeTab === 'seguranca') {
      fetchSecurityData()
      
      let interval: NodeJS.Timeout | null = null
      if (autoRefresh) {
        interval = setInterval(fetchSecurityData, 30000) // 30 segundos
      }
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [activeTab, autoRefresh])

  // Formatadores para dados de segurança
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-green-600'
  }

  const maskSensitiveData = (data: string) => {
    if (!showSensitiveData) {
      return data.replace(/(\d{1,3}\.){3}\d{1,3}/g, 'xxx.xxx.xxx.xxx')
                 .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'xxx@xxx.xxx')
    }
    return data
  }

  const handleSaveMetas = async () => {
    try {
      setLoading(true)
      // Aqui você salvaria as metas na API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular API call
      toast({
        title: '✅ Metas salvas com sucesso!',
        description: 'As metas foram atualizadas para o sistema.',
      })
    } catch (error) {
      toast({
        title: '❌ Erro ao salvar metas',
        description: 'Ocorreu um erro ao salvar as metas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePWAInstall = async () => {
    const success = await install()
    if (success) {
      toast({
        title: '✅ App instalado com sucesso!',
        description: 'O SGB Dashboard foi instalado no seu dispositivo.',
      })
    }
  }

  const tabs = [
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'usuarios', label: 'Usuários', icon: User },
    { id: 'integracoes', label: 'Integrações', icon: Settings },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Banner de Teste de Permissões para Admin */}
      {isAdminWithSpecificPermissions() && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🧪</span>
                <div>
                  <strong>Modo de Teste de Permissões Ativo</strong>
                  <p className="text-sm mt-1">
                    Você está vendo apenas os módulos permitidos ({user?.modulos_permitidos?.length || 0}/23). 
                    Para voltar ao acesso completo, configure todas as permissões.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/configuracoes?tab=usuarios'}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800"
                size="sm"
              >
                Ajustar Permissões
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs laterais */}
        <div className="lg:w-64">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-left
                    ${activeTab === tab.id 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 border shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Seção PWA Installer - Discreto */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>Aplicativo</span>
              </h3>
              
              {isInstalled ? (
                <div className="flex items-center space-x-2 text-xs text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>App instalado</span>
                </div>
              ) : canInstall ? (
                <PWAInstaller
                  showButton={true}
                  onInstall={handlePWAInstall}
                  className="w-full text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  buttonText="Instalar App"
                  buttonIcon="📱"
                />
              ) : (
                <div className="text-xs text-gray-500">
                  App não disponível
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo das tabs */}
        <div className="flex-1">
          {activeTab === 'metas' && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <CardTitle>Metas do Negócio</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sistema de Metas Completo</h3>
                  <p className="text-gray-600 mb-6">
                    Gerencie todas as suas metas financeiras, operacionais e de performance de forma organizada
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/configuracoes/metas'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    🎯 Acessar Metas Completas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'usuarios' && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Funcionalidade de gerenciamento de usuários será implementada em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'integracoes' && (
            <div className="space-y-6">
              {/* Discord Webhooks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#5865F2] rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">D</span>
                    </div>
                    <CardTitle>Discord Webhooks</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Webhook Sistema/Segurança */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      <Label htmlFor="webhook-sistema" className="font-medium">
                        Webhook Sistema & Segurança
                      </Label>
                    </div>
                    <Input
                      id="webhook-sistema"
                      placeholder="https://discord.com/api/webhooks/..."
                      defaultValue="https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y"
                    />
                    <p className="text-xs text-gray-500">
                      Rate limiting, SQL injection, backups, eventos críticos de segurança
                    </p>
                  </div>

                  <Separator />

                  {/* Webhook ContaAzul */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <Label htmlFor="webhook-contaazul" className="font-medium">
                        Webhook ContaAzul
                      </Label>
                    </div>
                    <Input
                      id="webhook-contaazul"
                      placeholder="https://discord.com/api/webhooks/..."
                      defaultValue="https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ"
                    />
                    <p className="text-xs text-gray-500">
                      Sincronizações automáticas, renovação de tokens, dados financeiros
                    </p>
                  </div>

                  <Separator />

                  {/* Webhook Meta/Social */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
                      <Label htmlFor="webhook-meta" className="font-medium">
                        Webhook Meta & Social
                      </Label>
                    </div>
                    <Input
                      id="webhook-meta"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <p className="text-xs text-gray-500">
                      Instagram, Facebook, Google Reviews, campanhas de marketing
                    </p>
                  </div>

                  <Separator />

                  {/* Webhook Checklists */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <Label htmlFor="webhook-checklists" className="font-medium">
                        Webhook Checklists & Operações
                      </Label>
                    </div>
                    <Input
                      id="webhook-checklists"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <p className="text-xs text-gray-500">
                      Conclusão de checklists, alertas operacionais, relatórios diários
                    </p>
                  </div>

                  <Separator />

                  {/* Webhook ContaHub */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-500 rounded" />
                      <Label htmlFor="webhook-contahub" className="font-medium">
                        Webhook ContaHub
                      </Label>
                      <Badge variant="secondary" className="text-xs">Em breve</Badge>
                    </div>
                    <Input
                      id="webhook-contahub"
                      placeholder="https://discord.com/api/webhooks/..."
                      disabled
                    />
                    <p className="text-xs text-gray-500">
                      Análises financeiras, relatórios automatizados, alertas de performance
                    </p>
                  </div>

                  <Separator />

                  {/* Webhook Vendas */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-emerald-500 rounded" />
                      <Label htmlFor="webhook-vendas" className="font-medium">
                        Webhook Vendas & Receitas
                      </Label>
                    </div>
                    <Input
                      id="webhook-vendas"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <p className="text-xs text-gray-500">
                      Metas atingidas, vendas excepcionais, relatórios de faturamento
                    </p>
                  </div>

                  <Separator />

                  {/* Webhook Reservas */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-indigo-500 rounded" />
                      <Label htmlFor="webhook-reservas" className="font-medium">
                        Webhook Reservas & Eventos
                      </Label>
                    </div>
                    <Input
                      id="webhook-reservas"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <p className="text-xs text-gray-500">
                      Novas reservas, cancelamentos, eventos especiais, occupancy rate
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button>
                      Salvar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Outras Integrações */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <CardTitle>Outras Integrações</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      WhatsApp, Email, SMS e outras integrações serão implementadas em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-6">
              {/* Controles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Dashboard de Segurança</h2>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    onClick={fetchSecurityData}
                    disabled={securityLoading}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${securityLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="flex items-center gap-2"
                  >
                    {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showSensitiveData ? 'Ocultar' : 'Mostrar'} Dados Sensíveis
                  </Button>
                </div>
              </div>

              {/* Métricas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityMetrics?.total_events || 0}</div>
                    <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{securityMetrics?.critical_events || 0}</div>
                    <p className="text-xs text-muted-foreground">Requerem atenção</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityMetrics?.unique_ips || 0}</div>
                    <p className="text-xs text-muted-foreground">Acessos únicos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Redis Status</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${rateLimitStatus?.redisConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium">
                        {rateLimitStatus?.redisConnected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rateLimitStatus?.totalKeys || 0} chaves ativas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs de Segurança */}
              <Tabs defaultValue="events" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="events">Eventos de Segurança</TabsTrigger>
                  <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas Detalhadas</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Eventos de Segurança Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {securityEvents.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">Nenhum evento encontrado</p>
                        ) : (
                          securityEvents.slice(0, 10).map((event) => (
                            <div key={event.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={getLevelColor(event.level)}>
                                    {event.level.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium">{event.event_type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${getRiskColor(event.risk_score)}`}>
                                    Risco: {event.risk_score}/100
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(event.timestamp)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div>
                                  <strong>IP:</strong> {maskSensitiveData(event.ip_address || 'N/A')}
                                </div>
                                <div>
                                  <strong>Categoria:</strong> {event.category}
                                </div>
                                <div>
                                  <strong>Endpoint:</strong> {event.endpoint || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logs de Auditoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {auditLogs.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">Nenhum log encontrado</p>
                        ) : (
                          auditLogs.slice(0, 10).map((log) => (
                            <div key={log.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={getLevelColor(log.severity)}>
                                    {log.severity.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium">{log.operation}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(log.timestamp)}
                                </span>
                              </div>
                              
                              <p className="text-sm">{log.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <strong>Usuário:</strong> {maskSensitiveData(log.user_email || 'Sistema')}
                                </div>
                                <div>
                                  <strong>IP:</strong> {maskSensitiveData(log.ip_address || 'N/A')}
                                </div>
                                <div>
                                  <strong>Tabela:</strong> {log.table_name || 'N/A'}
                                </div>
                                <div>
                                  <strong>Método:</strong> {log.method || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Eventos por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Autenticação:</span>
                            <span className="font-medium">{securityMetrics?.auth_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate Limiting:</span>
                            <span className="font-medium">{securityMetrics?.rate_limit_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SQL Injection:</span>
                            <span className="font-medium">{securityMetrics?.injection_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Acesso:</span>
                            <span className="font-medium">{securityMetrics?.access_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>API Abuse:</span>
                            <span className="font-medium">{securityMetrics?.api_abuse_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Backup:</span>
                            <span className="font-medium">{securityMetrics?.backup_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sistema:</span>
                            <span className="font-medium">{securityMetrics?.system_events || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Estatísticas de Segurança</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total de Eventos:</span>
                            <span className="font-medium">{securityMetrics?.total_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Críticos:</span>
                            <span className="font-medium text-red-600">{securityMetrics?.critical_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Alertas:</span>
                            <span className="font-medium text-yellow-600">{securityMetrics?.warning_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Informativos:</span>
                            <span className="font-medium text-blue-600">{securityMetrics?.info_events || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Logins Falhados:</span>
                            <span className="font-medium">{securityMetrics?.failed_logins || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>IPs Únicos:</span>
                            <span className="font-medium">{securityMetrics?.unique_ips || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>IPs Bloqueados:</span>
                            <span className="font-medium">{securityMetrics?.blocked_ips || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  return (
    <PermissionGuard 
      requiredModules={['configuracoes']}
      redirectTo="/home"
    >
      <ConfiguracoesContent />
    </PermissionGuard>
  )
} 