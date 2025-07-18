import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useBar } from '@/contexts/BarContext'
import { windsorAIService, WindsorConfig } from '@/lib/windsor-ai-service'
import { 
  Play, 
  Pause, 
  Settings, 
  Database, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Zap
} from 'lucide-react'

export default function WindsorAIPage() {
  const { selectedBar } = useBar()
  const [config, setConfig] = useState<WindsorConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const { toast } = useToast()

  // Carregar configuração quando bar for selecionado
  useEffect(() => {
    if (selectedBar) {
      loadConfig()
      loadStatus()
      loadLogs()
    }
  }, [selectedBar])

  const loadConfig = async () => {
    if (!selectedBar) return
    
    try {
      const configData = await windsorAIService.getConfig(selectedBar.id)
      setConfig(configData)
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    }
  }

  const loadStatus = async () => {
    if (!selectedBar) return
    
    try {
      const statusData = await windsorAIService.getIntegrationStatus(selectedBar.id)
      setStatus(statusData)
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    }
  }

  const loadLogs = async () => {
    if (!selectedBar) return
    
    try {
      const logsData = await windsorAIService.getLogs(selectedBar.id, 20)
      setLogs(logsData)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const updateConfig = async (updates: Partial<WindsorConfig>) => {
    if (!selectedBar || !config) return
    
    try {
      setLoading(true)
      const success = await windsorAIService.updateConfig(selectedBar.id, updates)
      
      if (success) {
        await loadConfig()
        toast({
          title: 'Configuração atualizada',
          description: 'As configurações do Windsor.ai foram salvas com sucesso.'
        })
      } else {
        throw new Error('Falha ao atualizar configuração')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar configuração Windsor.ai',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleIntegration = async (enabled: boolean) => {
    await updateConfig({ enabled })
  }

  const toggleConnector = async (platform: string, enabled: boolean) => {
    if (!config) return
    
    const updatedConnectors = {
      ...config.connectors,
      [platform]: {
        ...config.connectors[platform],
        enabled
      }
    }
    
    await updateConfig({ connectors: updatedConnectors })
  }

  const testConnection = async () => {
    if (!selectedBar) return
    
    try {
      setLoading(true)
      
      // Testar coleta de dados
      const result = await windsorAIService.collectData({
        barId: selectedBar.id,
        platform: 'facebook',
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias atrás
        dateTo: new Date().toISOString().split('T')[0]
      })
      
      if (result) {
        toast({
          title: 'Conexão testada com sucesso!',
          description: `Coletados ${result.processed_data?.length || 0} registros de dados.`
        })
        await loadStatus()
        await loadLogs()
      } else {
        throw new Error('Falha na coleta de dados')
      }
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: 'Falha ao testar conexão com Windsor.ai',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const cleanupData = async () => {
    if (!selectedBar) return
    
    try {
      setLoading(true)
      const deletedCount = await windsorAIService.cleanupOldData()
      
      toast({
        title: 'Limpeza concluída',
        description: `${deletedCount} registros antigos foram removidos.`
      })
      
      await loadStatus()
    } catch (error) {
      toast({
        title: 'Erro na limpeza',
        description: 'Erro ao limpar dados antigos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!selectedBar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">Windsor.ai Integration</CardTitle>
              <CardDescription className="card-description-dark">
                Configure a integração com Windsor.ai para coleta automática de dados de marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Selecione um bar para configurar a integração Windsor.ai
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Use o seletor de bar no menu lateral
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Windsor.ai Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure a integração com Windsor.ai para coleta automática de dados de marketing
          </p>
        </div>

        {/* Bar Info */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bar selecionado: <strong>{selectedBar?.nome}</strong> (ID: {selectedBar?.id})
          </p>
        </div>

        {/* Status Card */}
        {status && (
          <Card className="card-dark mb-6">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status da Integração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {status.enabled ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Plano: {status.plan || 'Free'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {status.total_records || 0} registros
                  </span>
                </div>
              </div>
              
              {status.last_collection && (
                <div className="mt-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Última coleta: {new Date(status.last_collection).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Configuration */}
        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="tabs-list-dark">
            <TabsTrigger value="config" className="tabs-trigger-dark">
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="platforms" className="tabs-trigger-dark">
              <Zap className="h-4 w-4 mr-2" />
              Plataformas
            </TabsTrigger>
            <TabsTrigger value="logs" className="tabs-trigger-dark">
              <Activity className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Configuração Geral</CardTitle>
                <CardDescription className="card-description-dark">
                  Configure a integração principal com Windsor.ai
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-900 dark:text-white">Habilitar Windsor.ai</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ativa a integração com Windsor.ai para este bar
                    </p>
                  </div>
                  <Switch
                    checked={config?.enabled || false}
                    onCheckedChange={toggleIntegration}
                    disabled={loading}
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">API Key Windsor.ai</Label>
                  <Input
                    type="password"
                    placeholder="Sua API key do Windsor.ai"
                    value={config?.api_key || ''}
                    onChange={(e) => updateConfig({ api_key: e.target.value })}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Obtenha sua API key em{' '}
                    <a 
                      href="https://windsor.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      windsor.ai
                    </a>
                  </p>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Webhook URL</Label>
                  <Input
                    placeholder="https://seu-dominio.com/api/windsor/webhook"
                    value={config?.webhook_url || ''}
                    onChange={(e) => updateConfig({ webhook_url: e.target.value })}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    URL para receber dados em tempo real (opcional)
                  </p>
                </div>

                {/* Plan Selection */}
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Plano Windsor.ai</Label>
                  <div className="flex gap-2">
                    {['free', 'basic', 'standard'].map((plan) => (
                      <Badge
                        key={plan}
                        variant={config?.plan === plan ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => updateConfig({ plan: plan as unknown })}
                      >
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plano Free: 30 dias de histórico, 3 data sources
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={testConnection}
                    disabled={loading || !config?.enabled}
                    className="btn-primary-dark"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </Button>
                  
                  <Button 
                    onClick={cleanupData}
                    disabled={loading}
                    variant="outline"
                    className="btn-outline-dark"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Limpar Dados Antigos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Plataformas Conectadas</CardTitle>
                <CardDescription className="card-description-dark">
                  Configure quais plataformas de marketing serão coletadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config?.connectors && Object.entries(config.connectors).map(([platform, connector]) => (
                    <div key={platform} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${connector.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                            {platform.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {connector.account_ids.length} contas configuradas
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={connector.enabled}
                        onCheckedChange={(enabled) => toggleConnector(platform, enabled)}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Logs de Atividade</CardTitle>
                <CardDescription className="card-description-dark">
                  Histórico de eventos e atividades da integração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.level === 'error' ? 'bg-red-500' : 
                        log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.event_type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Nenhum log encontrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Alert */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Plano Free Windsor.ai:</strong> Mantém apenas 30 dias de histórico, mas todos os dados são preservados no nosso banco. 
            Para histórico completo no Windsor.ai, considere o plano Basic ($20/mês).
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
} 