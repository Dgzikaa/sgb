'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useBar } from '@/contexts/BarContext'
import { 
  MessageSquare, 
  Settings, 
  TestTube, 
  Save,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Bell,
  Zap,
  Activity,
  Database,
  CreditCard,
  Building2,
  Users,
  Calendar,
  BarChart3,
  ArrowLeft
} from 'lucide-react'

interface DiscordWebhook {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  webhook_url: string
  enabled: boolean
  category: string
  test_url?: string
}

export default function DiscordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedBar } = useBar()
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  const defaultWebhooks: DiscordWebhook[] = [
    {
      id: 'geral',
      name: 'Geral',
      description: 'Notificações gerais do sistema',
      icon: <Bell className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'sistema'
    },
    {
      id: 'inter',
      name: 'Banco Inter',
      description: 'Todas as notificações do Banco Inter (PIX, boletos, pagamentos)',
      icon: <Zap className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'financeiro'
    },
    {
      id: 'nibo_notificacoes',
      name: 'NIBO Notificações',
      description: 'Notificações de sincronização NIBO',
      icon: <CreditCard className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'contabil'
    },
    {
      id: 'nibo_sync',
      name: 'NIBO Sincronização',
      description: 'Status de sincronização NIBO',
      icon: <Database className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'contabil'
    },
    {
      id: 'checklist',
      name: 'Checklists',
      description: 'Notificações de checklists e tarefas',
      icon: <CheckCircle className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'operacional'
    },
    {
      id: 'contahub',
      name: 'ContaHub',
      description: 'Notificações de sincronização ContaHub',
      icon: <Database className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'integracao'
    },
    {
      id: 'nibo',
      name: 'NIBO',
      description: 'Notificações de sincronização NIBO',
      icon: <CreditCard className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'integracao'
    },
    {
      id: 'funcionarios',
      name: 'Funcionários',
      description: 'Notificações relacionadas a funcionários',
      icon: <Users className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'rh'
    },
    {
      id: 'eventos',
      name: 'Eventos',
      description: 'Notificações de eventos e reservas',
      icon: <Calendar className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'eventos'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Relatórios e análises automáticas',
      icon: <BarChart3 className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'analytics'
    },
    {
      id: 'erros',
      name: 'Erros do Sistema',
      description: 'Alertas de erros e problemas técnicos',
      icon: <AlertCircle className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'sistema'
    }
  ]

  useEffect(() => {
    if (selectedBar?.id) {
      loadWebhooks()
    }
  }, [selectedBar?.id])

  const loadWebhooks = async () => {
    if (!selectedBar?.id) return

    try {
      setLoading(true)
      
      // Buscar webhooks da tabela api_credentials
      const response = await fetch('/api/credenciais/discord/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bar_id: selectedBar.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mapear webhooks do banco para o formato da interface
        const loadedWebhooks = defaultWebhooks.map(webhook => {
          // Buscar webhook específico baseado no ID
          let webhookUrl = ''
          
          // Mapear IDs para sistemas específicos
          if (webhook.id === 'inter') {
            webhookUrl = data.banco_inter?.webhook_url || ''
          } else if (webhook.id === 'nibo_notificacoes' || webhook.id === 'nibo_sync') {
            webhookUrl = data.nibo?.webhook_url || ''
          } else if (webhook.id === 'checklist') {
            webhookUrl = data.checklists?.webhook_url || ''
          } else if (webhook.id === 'contahub') {
            webhookUrl = data.contahub?.webhook_url || ''
          } else if (webhook.id === 'geral') {
            webhookUrl = data.sistema?.webhook_url || ''
          }
          
          return {
            ...webhook,
            webhook_url: webhookUrl,
            enabled: webhookUrl ? true : false
          }
        })
        setWebhooks(loadedWebhooks)
      } else {
        setWebhooks(defaultWebhooks)
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error)
      setWebhooks(defaultWebhooks)
    } finally {
      setLoading(false)
    }
  }

  const saveWebhooks = async () => {
    if (!selectedBar?.id) return

    try {
      setSaving(true)
      
      // Preparar dados para salvar
      const webhooksToSave = webhooks.map(webhook => ({
        id: webhook.id,
        webhook_url: webhook.webhook_url,
        enabled: webhook.enabled,
        name: webhook.name,
        category: webhook.category
      }))

      const response = await fetch('/api/configuracoes/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          action: 'save',
          webhooks: webhooksToSave
        })
      })

      if (response.ok) {
        toast({
          title: '✅ Configurações salvas!',
          description: 'Webhooks do Discord configurados com sucesso.',
        })
      } else {
        const error = await response.json()
        toast({
          title: '❌ Erro ao salvar',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '❌ Erro ao salvar',
        description: 'Erro de conexão ou servidor',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId)
    if (!webhook || !webhook.webhook_url) {
      toast({
        title: '❌ Webhook não configurado',
        description: 'Configure a URL do webhook primeiro.',
        variant: 'destructive'
      })
      return
    }

    try {
      setTesting(webhookId)
      
      const response = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhook.webhook_url,
          webhook_type: webhookId,
          bar_id: selectedBar?.id
        })
      })

      if (response.ok) {
        toast({
          title: '✅ Teste realizado!',
          description: `Webhook ${webhook.name} testado com sucesso.`,
        })
      } else {
        const error = await response.json()
        toast({
          title: '❌ Erro no teste',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '❌ Erro no teste',
        description: 'Erro de conexão ou servidor',
        variant: 'destructive'
      })
    } finally {
      setTesting(null)
    }
  }

  const copyWebhookUrl = async (webhookUrl: string) => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast({
        title: '✅ URL copiada!',
        description: 'Webhook URL copiada para a área de transferência.',
      })
    } catch (error) {
      toast({
        title: '❌ Erro ao copiar',
        description: 'Não foi possível copiar a URL.',
        variant: 'destructive'
      })
    }
  }

  const updateWebhook = (webhookId: string, field: 'webhook_url' | 'enabled', value: string | boolean) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, [field]: value }
        : webhook
    ))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sistema': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'financeiro': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'operacional': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'integracao': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'rh': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      case 'eventos': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'analytics': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const categories = [
    { id: 'sistema', name: 'Sistema', icon: <Settings className="h-4 w-4" /> },
    { id: 'financeiro', name: 'Financeiro', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'operacional', name: 'Operacional', icon: <Activity className="h-4 w-4" /> },
    { id: 'integracao', name: 'Integrações', icon: <Database className="h-4 w-4" /> },
    { id: 'rh', name: 'RH', icon: <Users className="h-4 w-4" /> },
    { id: 'eventos', name: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> }
  ]

  if (!selectedBar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <Card className="card-dark">
            <CardContent className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Selecione um bar para configurar os webhooks do Discord.
              </p>
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
            Discord Webhooks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure webhooks do Discord para receber notificações automáticas
          </p>
        </div>

        {/* Botão Voltar */}
        <div className="flex justify-start mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/configuracoes/integracoes')}
            className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Integrações
          </Button>
        </div>

        {/* Webhooks */}
        <div className="grid gap-6">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="card-dark hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      {webhook.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{webhook.name}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">{webhook.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getCategoryColor(webhook.category)} shadow-sm`}>
                      {categories.find(c => c.id === webhook.category)?.name}
                    </Badge>
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(checked) => updateWebhook(webhook.id, 'enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor={`webhook-${webhook.id}`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    URL do Webhook
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id={`webhook-${webhook.id}`}
                      value={webhook.webhook_url}
                      onChange={(e) => updateWebhook(webhook.id, 'webhook_url', e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyWebhookUrl(webhook.webhook_url)}
                      title="Copiar URL"
                      disabled={!webhook.webhook_url}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => testWebhook(webhook.id)}
                      title="Testar webhook"
                      disabled={!webhook.webhook_url || testing === webhook.id}
                      className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      {testing === webhook.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={saveWebhooks}
            disabled={saving}
            className="btn-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open('https://discord.com/developers/applications', '_blank')}
            className="btn-secondary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Discord Developer Portal
          </Button>
        </div>

        {/* Instruções */}
        <Card className="card-gradient mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              Como Configurar Webhooks do Discord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-gray-600 dark:text-gray-400">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    Criar Webhook no Discord
                  </h4>
                  <ol className="space-y-2 list-none">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Acesse o Discord Developer Portal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Crie uma nova aplicação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Vá em "Webhooks"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Clique em "New Webhook"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Copie a URL do webhook</span>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">2. Configurar no SGB:</h4>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Cole a URL do webhook no campo correspondente</li>
                    <li>Ative o webhook usando o switch</li>
                    <li>Teste o webhook para verificar se está funcionando</li>
                    <li>Salve as configurações</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 