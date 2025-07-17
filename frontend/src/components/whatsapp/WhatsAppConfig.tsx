'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent: any, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent: any, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent: any, SelectItem, SelectTrigger: any, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  MessageSquare, 
  Settings, 
  Smartphone, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Clock,
  Shield,
  Globe,
  Key,
  TestTube
} from 'lucide-react'

// =====================================================
// üì± CONFIGURA·á·ÉO WHATSAPP MULTI-PROVIDER
// =====================================================

interface WhatsAppProvider {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
  cost: 'free' | 'paid' | 'freemium'
  reliability: number // 1-5
  setup_time: string
  features: string[]
}

interface WhatsAppConfig {
  provider: string
  enabled: boolean
  phone_number: string
  api_url?: string
  api_key?: string
  instance_id?: string
  session_name?: string
  webhook_url?: string
  settings: {
    send_reminders: boolean
    send_alerts: boolean
    send_completions: boolean
    reminder_hours_before: number
    alert_repeat_minutes: number
  }
}

const providers: WhatsAppProvider[] = [
  {
    id: 'evolution',
    name: 'Evolution API',
    description: 'API gratuita e f·°cil de usar, ideal para come·ßar',
    icon: 'üöÄ',
    difficulty: 'easy',
    cost: 'free',
    reliability: 4,
    setup_time: '10 min',
    features: ['Envio de mensagens', 'Webhook', 'Multi-inst·¢ncia', 'QR Code']
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Servi·ßo profissional e confi·°vel da Twilio',
    icon: 'üìû',
    difficulty: 'medium',
    cost: 'paid',
    reliability: 5,
    setup_time: '20 min',
    features: ['Altamente confi·°vel', 'Suporte 24/7', 'Analytics', 'Templates']
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business API',
    description: 'API oficial do WhatsApp (requer aprova·ß·£o)',
    icon: 'úÖ',
    difficulty: 'hard',
    cost: 'paid',
    reliability: 5,
    setup_time: '2-7 dias',
    features: ['Oficial', 'Templates aprovados', 'Business features', 'Meta integration']
  },
  {
    id: 'baileys',
    name: 'Baileys (Self-hosted)',
    description: 'Biblioteca open source para auto-hospedagem',
    icon: 'üîß',
    difficulty: 'hard',
    cost: 'free',
    reliability: 3,
    setup_time: '60 min',
    features: ['Open source', 'Self-hosted', 'Customiza·ß·£o total', 'Sem custos']
  }
]

interface WhatsAppConfigProps {
  onConfigSave?: (config: WhatsAppConfig) => void
  onTestConnection?: (config: WhatsAppConfig) => Promise<boolean>
}

export default function WhatsAppConfig({ onConfigSave, onTestConnection }: WhatsAppConfigProps) {
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: '',
    enabled: false,
    phone_number: '',
    api_url: '',
    api_key: '',
    instance_id: '',
    session_name: '',
    webhook_url: '',
    settings: {
      send_reminders: true,
      send_alerts: true,
      send_completions: false,
      reminder_hours_before: 2,
      alert_repeat_minutes: 30
    }
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedProvider = providers.find((p: any) => p.id === config.provider)

  const handleProviderChange = (providerId: string) => {
    setConfig(prev => ({
      ...prev,
      provider: providerId,
      // Reset provider-specific fields
      api_url: '',
      api_key: '',
      instance_id: '',
      session_name: ''
    }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    if (!onTestConnection) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const success = await onTestConnection(config)
      setTestResult({
        success,
        message: success 
          ? 'úÖ Conex·£o estabelecida com sucesso!' 
          : 'ùå Falha na conex·£o. Verifique as configura·ß·µes.'
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `ùå Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      if (onConfigSave) {
        await onConfigSave(config)
      }
      
      setTestResult({
        success: true,
        message: 'üíæ Configura·ß·µes salvas com sucesso!'
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `ùå Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
    } finally {
      setSaving(false)
    }
  }

  const renderProviderConfig = () => {
    if (!selectedProvider) return null

    switch (selectedProvider.id) {
      case 'evolution':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL da API Evolution</label>
              <Input
                value={config.api_url || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
                placeholder="https://sua-evolution-api.com"
                className="touch-manipulation"
              />
              <p className="text-xs text-gray-600 mt-1">
                Ex: https://evolution.seudominio.com ou IP:porta
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">API Key</label>
              <Input
                type="password"
                value={config.api_key || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Sua chave de API"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Nome da Inst·¢ncia</label>
              <Input
                value={config.instance_id || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, instance_id: e.target.value }))}
                placeholder="minha-instancia"
                className="touch-manipulation"
              />
              <p className="text-xs text-gray-600 mt-1">
                Nome ·∫nico para sua inst·¢ncia (ex: sgb-checklists)
              </p>
            </div>
          </div>
        )

      case 'twilio':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Account SID</label>
              <Input
                value={config.api_key || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Auth Token</label>
              <Input
                type="password"
                value={config.session_name || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, session_name: e.target.value }))}
                placeholder="Seu Auth Token"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">WhatsApp Number (Twilio)</label>
              <Input
                value={config.api_url || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
                placeholder="whatsapp:+5511999999999"
                className="touch-manipulation"
              />
            </div>
          </div>
        )

      case 'whatsapp_business':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Requer Aprova·ß·£o</span>
              </div>
              <p className="text-sm text-yellow-700">
                A WhatsApp Business API requer aprova·ß·£o da Meta e pode levar de 2-7 dias.
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Business Account ID</label>
              <Input
                value={config.api_key || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Seu Business Account ID"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Access Token</label>
              <Input
                type="password"
                value={config.session_name || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, session_name: e.target.value }))}
                placeholder="Seu Access Token"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number ID</label>
              <Input
                value={config.instance_id || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, instance_id: e.target.value }))}
                placeholder="ID do n·∫mero de telefone"
                className="touch-manipulation"
              />
            </div>
          </div>
        )

      case 'baileys':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Self-Hosted</span>
              </div>
              <p className="text-sm text-blue-700">
                Voc·™ precisa hospedar sua pr·≥pria inst·¢ncia do Baileys.
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">URL do Servidor Baileys</label>
              <Input
                value={config.api_url || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
                placeholder="http://localhost:3000 ou sua URL"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Senha/Token (se configurado)</label>
              <Input
                type="password"
                value={config.api_key || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Opcional"
                className="touch-manipulation"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Nome da Sess·£o</label>
              <Input
                value={config.session_name || ''}
                onChange={(e: any) => setConfig(prev => ({ ...prev, session_name: e.target.value }))}
                placeholder="sgb-session"
                className="touch-manipulation"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MessageSquare className="w-8 h-8 text-green-600" />
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configura·ß·£o WhatsApp</h1>
        </div>
        <p className="text-gray-600">
          Configure a integra·ß·£o WhatsApp para enviar lembretes e notifica·ß·µes autom·°ticas
        </p>
      </div>

      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provider" className="touch-manipulation">
            <Globe className="w-4 h-4 mr-2" />
            Provedor
          </TabsTrigger>
          <TabsTrigger value="config" className="touch-manipulation">
            <Settings className="w-4 h-4 mr-2" />
            Configura·ß·£o
          </TabsTrigger>
          <TabsTrigger value="messages" className="touch-manipulation">
            <MessageSquare className="w-4 h-4 mr-2" />
            Mensagens
          </TabsTrigger>
        </TabsList>

        {/* Tab: Sele·ß·£o de Provedor */}
        <TabsContent value="provider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Escolha seu Provedor WhatsApp
              </CardTitle>
              <p className="text-sm text-gray-600">
                Selecione o provedor que melhor se adequa ·†s suas necessidades
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider: any) => (
                  <Card 
                    key={provider.id}
                    className={`cursor-pointer transition-all hover:shadow-md touch-manipulation ${
                      config.provider === provider.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleProviderChange(provider.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{provider.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{provider.name}</h3>
                            <Badge className={
                              provider.cost === 'free' ? 'bg-green-100 text-green-800' :
                              provider.cost === 'paid' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {provider.cost === 'free' ? 'Gratuito' : 
                               provider.cost === 'paid' ? 'Pago' : 'Freemium'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                            <div>Dificuldade: {
                              provider.difficulty === 'easy' ? 'üü¢ F·°cil' :
                              provider.difficulty === 'medium' ? 'üü° M·©dio' : 'üî¥ Dif·≠cil'
                            }</div>
                            <div>Setup: {provider.setup_time}</div>
                            <div>Confiabilidade: {'≠ê'.repeat(provider.reliability)}</div>
                          </div>
                          
                          <div className="space-y-1">
                            {provider.features.slice(0: any, 2).map((feature: any) => (
                              <div key={feature} className="text-xs text-gray-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configura·ß·£o */}
        <TabsContent value="config" className="space-y-6">
          {!selectedProvider ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold text-gray-800 mb-2">Selecione um Provedor</h3>
                <p className="text-gray-600">
                  Primeiro escolha um provedor na aba "Provedor"
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Configura·ß·µes B·°sicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedProvider.icon} {selectedProvider.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{selectedProvider.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Ativar WhatsApp</label>
                      <p className="text-sm text-gray-600">
                        Habilitar envio de mensagens via WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked: any) => setConfig(prev => ({ ...prev, enabled: checked }))}
                      className="touch-manipulation"
                    />
                  </div>

                  {config.enabled && (
                    <>
                      {/* N·∫mero de Telefone */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          N·∫mero de Telefone (com c·≥digo do pa·≠s)
                        </label>
                        <Input
                          value={config.phone_number}
                          onChange={(e: any) => setConfig(prev => ({ ...prev, phone_number: e.target.value }))}
                          placeholder="+5511999999999"
                          className="touch-manipulation"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Formato: +55 11 99999-9999 (sem espa·ßos ou tra·ßos)
                        </p>
                      </div>

                      {/* Configura·ß·µes Espec·≠ficas do Provedor */}
                      {renderProviderConfig()}

                      {/* Webhook URL (opcional) */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Webhook URL (opcional)
                        </label>
                        <Input
                          value={config.webhook_url || ''}
                          onChange={(e: any) => setConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                          placeholder="https://seudominio.com/api/whatsapp/webhook"
                          className="touch-manipulation"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Para receber confirma·ß·µes de entrega (opcional)
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Configura·ß·µes de Mensagens */}
              {config.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Configura·ß·µes de Envio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Lembretes</label>
                          <p className="text-xs text-gray-600">
                            Enviar lembretes de checklists agendados
                          </p>
                        </div>
                        <Switch
                          checked={config.settings.send_reminders}
                          onCheckedChange={(checked: any) => setConfig(prev => ({ 
                            ...prev, 
                            settings: { ...prev.settings, send_reminders: checked }
                          }))}
                          className="touch-manipulation"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Alertas de Atraso</label>
                          <p className="text-xs text-gray-600">
                            Notificar quando checklists est·£o atrasados
                          </p>
                        </div>
                        <Switch
                          checked={config.settings.send_alerts}
                          onCheckedChange={(checked: any) => setConfig(prev => ({ 
                            ...prev, 
                            settings: { ...prev.settings, send_alerts: checked }
                          }))}
                          className="touch-manipulation"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Confirma·ß·µes</label>
                          <p className="text-xs text-gray-600">
                            Enviar confirma·ß·£o quando checklist for completado
                          </p>
                        </div>
                        <Switch
                          checked={config.settings.send_completions}
                          onCheckedChange={(checked: any) => setConfig(prev => ({ 
                            ...prev, 
                            settings: { ...prev.settings, send_completions: checked }
                          }))}
                          className="touch-manipulation"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Lembrete (horas antes)
                        </label>
                        <Select
                          value={config.settings.reminder_hours_before.toString()}
                          onValueChange={(value: any) => setConfig(prev => ({ 
                            ...prev, 
                            settings: { ...prev.settings, reminder_hours_before: parseInt(value) }
                          }))}
                        >
                          <SelectTrigger className="touch-manipulation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora antes</SelectItem>
                            <SelectItem value="2">2 horas antes</SelectItem>
                            <SelectItem value="4">4 horas antes</SelectItem>
                            <SelectItem value="8">8 horas antes</SelectItem>
                            <SelectItem value="24">1 dia antes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Repetir alertas (minutos)
                        </label>
                        <Select
                          value={config.settings.alert_repeat_minutes.toString()}
                          onValueChange={(value: any) => setConfig(prev => ({ 
                            ...prev, 
                            settings: { ...prev.settings, alert_repeat_minutes: parseInt(value) }
                          }))}
                        >
                          <SelectTrigger className="touch-manipulation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                            <SelectItem value="0">N·£o repetir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Teste de Conex·£o */}
              {config.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="w-5 h-5 text-purple-600" />
                      Teste de Conex·£o
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testResult && (
                      <div className={`p-3 rounded-lg ${
                        testResult.success 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <p className="text-sm font-medium">{testResult.message}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleTestConnection}
                        disabled={testing || !config.phone_number}
                        className="bg-purple-600 hover:bg-purple-700 touch-manipulation"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {testing ? 'Testando...' : 'Testar Conex·£o'}
                      </Button>

                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 touch-manipulation"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar Configura·ß·µes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab: Mensagens */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Templates de Mensagem
              </CardTitle>
              <p className="text-sm text-gray-600">
                Personalize as mensagens enviadas automaticamente
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mensagem de Lembrete
                </label>
                <Textarea
                  placeholder={`üîî *Lembrete SGB*

Ol·°! Voc·™ tem um checklist pendente:

üìã *{CHECKLIST_NOME}*
è∞ Hor·°rio: {HORARIO}
üìç Setor: {SETOR}

Por favor, execute o checklist no hor·°rio programado.

_Sistema de Gest·£o de Bares_`}
                  rows={8}
                  className="touch-manipulation resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Vari·°veis dispon·≠veis: {'{CHECKLIST_NOME}'}, {'{HORARIO}'}, {'{SETOR}'}, {'{FUNCIONARIO}'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mensagem de Alerta (Atraso)
                </label>
                <Textarea
                  placeholder={`üö® *ALERTA - Checklist Atrasado*

ö†Ô∏è O checklist est·° atrasado!

üìã *{CHECKLIST_NOME}*
è∞ Era para: {HORARIO}
è±Ô∏è Atraso: {TEMPO_ATRASO}

Por favor, execute URGENTEMENTE!

_Sistema de Gest·£o de Bares_`}
                  rows={8}
                  className="touch-manipulation resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Vari·°veis adicionais: {'{TEMPO_ATRASO}'}, {'{NIVEL_URGENCIA}'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mensagem de Compartilhamento
                </label>
                <Textarea
                  placeholder={`úÖ *Checklist Conclu·≠do*

üìã *{CHECKLIST_NOME}*
üë§ Respons·°vel: {FUNCIONARIO}
è±Ô∏è Tempo: {TEMPO_EXECUCAO}min
üìä Status: {STATUS}

{RESUMO_RESULTADOS}

_Sistema de Gest·£o de Bares_`}
                  rows={8}
                  className="touch-manipulation resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Vari·°veis: {'{TEMPO_EXECUCAO}'}, {'{STATUS}'}, {'{RESUMO_RESULTADOS}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
