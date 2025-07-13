'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Clock, 
  Activity,
  Lock,
  Globe,
  Users,
  Database,
  RefreshCw
} from 'lucide-react'

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

interface SecurityEvent {
  id: string
  level: string
  category: string
  event_type: string
  message: string
  ip_address?: string
  user_id?: string
  timestamp: string
  details?: any
}

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource: string
  timestamp: string
  ip_address?: string
  details?: any
}

export default function SecurityPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadSecurityData()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000) // Atualizar a cada 30 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      // Carregar métricas, eventos e logs em paralelo
      const [metricsResponse, eventsResponse, auditResponse] = await Promise.all([
        fetch('/api/security/metrics'),
        fetch('/api/security/events'),
        fetch('/api/security/audit')
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        if (metricsData.success) {
          setMetrics(metricsData.metrics)
        }
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        if (eventsData.success) {
          setEvents(eventsData.events)
        }
      }

      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        if (auditData.success) {
          setAuditLogs(auditData.logs)
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error)
      toast({
        title: "❌ Erro",
        description: "Erro ao carregar dados de segurança",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400 font-bold'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400 font-semibold'
    if (score >= 20) return 'text-blue-600 dark:text-blue-400 font-medium'
    return 'text-green-600 dark:text-green-400 font-medium'
  }

  const getRiskScoreLabel = (score: number) => {
    if (score >= 80) return 'ALTO'
    if (score >= 50) return 'MÉDIO'
    if (score >= 20) return 'BAIXO'
    return 'MÍNIMO'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/configuracoes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard de Segurança</h1>
              <p className="text-gray-600 dark:text-gray-400">Monitore eventos de segurança e auditoria</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSecurityData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Eventos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics?.total_events || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Últimas 24 horas</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Eventos Críticos</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {metrics?.critical_events || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Últimas 24 horas</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IPs Únicos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics?.unique_ips || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Últimas 24 horas</p>
              </div>
              <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Redis Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Offline</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sistema de cache</p>
              </div>
              <Database className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Activity className="w-5 h-5" />
              Eventos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Autenticação</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  {metrics?.auth_events || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <span className="text-sm font-medium text-green-900 dark:text-green-100">Controle de Acesso</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  {metrics?.access_events || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <span className="text-sm font-medium text-red-900 dark:text-red-100">SQL Injection</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                  {metrics?.injection_events || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Rate Limiting</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  {metrics?.rate_limit_events || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Sistema</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                  {metrics?.system_events || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Lock className="w-5 h-5" />
              Estatísticas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Login Falhados</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Últimas 24h</p>
                </div>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics?.failed_logins || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">IPs Bloqueados</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Últimas 24h</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics?.blocked_ips || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Abuso de API</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Últimas 24h</p>
                </div>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics?.api_abuse_events || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eventos de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Eye className="w-5 h-5" />
            Eventos de Segurança Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum evento de segurança encontrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Os eventos aparecerão aqui quando forem registrados no sistema</p>
              </div>
            ) : (
              events.slice(0, 10).map((event) => (
                <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getLevelColor(event.level)} variant="outline">
                          {event.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.category.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Risco: <span className={getRiskScoreColor(event.details?.risk_score || 0)}>
                            {event.details?.risk_score || 'N/A'}/100 ({getRiskScoreLabel(event.details?.risk_score || 0)})
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Evento:</span>
                          <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {event.event_type}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição:</span>
                          <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                            {event.message}
                          </span>
                        </div>
                        
                        {event.ip_address && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">IP:</span>
                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {event.ip_address}
                            </span>
                          </div>
                        )}
                        
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Detalhes:</span>
                            <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded mt-1 font-mono">
                              {JSON.stringify(event.details, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {formatTimestamp(event.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.timestamp).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Clock className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum log de auditoria encontrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Os logs de auditoria aparecerão aqui quando ações forem registradas</p>
              </div>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ação:</span>
                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {log.action}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurso:</span>
                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                              {log.resource}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuário:</span>
                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {log.user_id}
                            </span>
                          </div>
                          
                          {log.ip_address && (
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">IP:</span>
                              <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {log.ip_address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-gray-100">Carregando dados de segurança...</span>
          </div>
        </div>
      )}
    </div>
  )
} 