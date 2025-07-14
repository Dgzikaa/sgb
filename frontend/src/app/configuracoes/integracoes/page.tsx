'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { 
  ArrowLeft, 
  Save, 
  Shield, 
  CheckCircle, 
  MessageSquare, 
  Facebook, 
  Instagram, 
  Mail, 
  Smartphone, 
  Calendar, 
  BarChart3,
  Star,
  TrendingUp,
  Users,
  Settings,
  Loader2,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Clock,
  Link2
} from 'lucide-react'

export default function IntegracoesPage() {
  const { toast } = useToast()
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  
  const [activeTab, setActiveTab] = useState('discord')
  
  // Estados para webhooks Discord - CORRIGIDO: inicializar vazio
  const [webhookConfigs, setWebhookConfigs] = useState({
    sistema: '',
    contaazul: '',
    meta: '',
    checklists: '',
    contahub: '',
    sympla: '',    // Alterado de 'vendas' para 'sympla'
    yuzer: '',     // Novo webhook Yuzer
    reservas: ''   // Mantém, mas agora mapeia para sistema 'getin'
  })
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  
  useEffect(() => {
    setPageTitle('Integrações')
    return () => setPageTitle('')
  }, [setPageTitle])
  
  useEffect(() => {
    if (selectedBar) {
      // Carregar dados conforme a aba ativa
      switch (activeTab) {
        case 'discord':
          loadWebhookConfigs()
          break
        case 'contaazul':
          loadContaAzulStatus()
          break
        case 'meta':
          loadMetaStatus()
          break
        case 'whatsapp':
          loadWhatsAppStatus()
          break
        case 'eventos':
          loadEventosStatus()
          break
        // REMOVIDAS TEMPORARIAMENTE: email e analytics
        // case 'email':
        //   loadEmailStatus()
        //   break
        // case 'analytics':
        //   loadAnalyticsStatus()
        //   break
        default:
          // Aba não requer carregamento específico
          break
      }
    }
  }, [selectedBar, activeTab])
  
  const loadWebhookConfigs = async () => {
    if (!selectedBar) {
      setLoadingConfigs(false)
      return
    }
    
    setLoadingConfigs(true)
    
    try {
      const response = await fetch(`/api/configuracoes/webhooks?bar_id=${selectedBar.id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.configuracoes) {
          // Garantir que todas as propriedades existam
          const configsCompletas = {
            sistema: data.configuracoes.sistema || '',
            contaazul: data.configuracoes.contaazul || '',
            meta: data.configuracoes.meta || '',
            checklists: data.configuracoes.checklists || '',
            contahub: data.configuracoes.contahub || '',
            sympla: data.configuracoes.sympla || data.configuracoes.vendas || '', // Migração de vendas para sympla
            yuzer: data.configuracoes.yuzer || '',
            reservas: data.configuracoes.reservas || ''
          }
          setWebhookConfigs(configsCompletas)
        }
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar webhooks:', error)
    } finally {
      setLoadingConfigs(false)
    }
  }
  
  // Funções de carregamento para outras abas
  const loadContaAzulStatus = async () => {
    if (!selectedBar) return
    
    try {
      const response = await fetch(`/api/contaazul/auth?action=status&barId=${selectedBar.id}`)
      const data = await response.json()
      
      // Status verificado silenciosamente
    } catch (error) {
      console.error('❌ Erro ao verificar status ContaAzul:', error)
    }
  }
  
  const loadMetaStatus = async () => {
    if (!selectedBar) return
    
    try {
      const response = await fetch('/api/meta/config', {
        method: 'GET',
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin'
          }))
        }
      })
      
      const data = await response.json()
      // Status verificado silenciosamente
    } catch (error) {
      console.error('❌ Erro ao verificar status Meta:', error)
    }
  }
  
  const loadWhatsAppStatus = async () => {
    if (!selectedBar) return
    
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'GET',
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin'
          })
        }
      })
      
      const data = await response.json()
      // Status verificado silenciosamente
    } catch (error) {
      console.error('❌ Erro ao verificar status WhatsApp:', error)
    }
  }
  
  // FUNÇÕES REMOVIDAS TEMPORARIAMENTE
  // const loadEmailStatus = async () => {
  //   if (!selectedBar) return
  //   console.log('🟠 Carregando status Email para bar:', selectedBar.id)
  //   // TODO: Implementar verificação de configurações de email
  //   // Pode verificar SMTP, templates, etc.
  // }
  
  const loadEventosStatus = async () => {
    if (!selectedBar) return
    // TODO: Implementar verificação de integrações com Sympla, etc.
  }
  
  // const loadAnalyticsStatus = async () => {
  //   if (!selectedBar) return
  //   console.log('🔶 Carregando status Analytics para bar:', selectedBar.id)
  //   // TODO: Implementar verificação de conexões ContaHub, Power BI, etc.
  // }
  
  const handleSaveWebhooks = async () => {
    if (!selectedBar) {
      toast({
        title: '❌ Erro',
        description: 'Nenhum bar selecionado',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setWebhookLoading(true)
      
      const response = await fetch('/api/configuracoes/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          configuracoes: webhookConfigs
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '✅ Webhooks salvos com sucesso!',
          description: 'As configurações foram atualizadas no banco de dados.'
        })
      } else {
        console.error('❌ Erro retornado pela API:', data)
        toast({
          title: '❌ Erro ao salvar webhooks',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao salvar webhooks:', error)
      toast({
        title: '❌ Erro ao salvar webhooks',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setWebhookLoading(false)
    }
  }
  
  const testWebhook = async (webhookType: string) => {
    const webhookUrl = webhookConfigs[webhookType as keyof typeof webhookConfigs]
    
    if (!webhookUrl || webhookUrl.trim() === '') {
      toast({
        title: '❌ Webhook não configurado',
        description: `Configure o webhook ${webhookType} antes de testar`,
        variant: 'destructive'
      })
      return
    }
    
    if (!selectedBar) {
      toast({
        title: '❌ Erro',
        description: 'Nenhum bar selecionado',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setTestingWebhook(webhookType)
      
      const testData = {
        bar_id: selectedBar.id,
        webhook_type: webhookType,
        title: `🧪 Teste de Webhook - ${webhookType.toUpperCase()}`,
        description: `Este é um teste do webhook **${webhookType}** realizado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.\n\n✅ Se você está vendo esta mensagem, o webhook está funcionando corretamente!`,
        color: getWebhookColor(webhookType),
        fields: [
          {
            name: '🏢 Estabelecimento',
            value: selectedBar.nome || selectedBar.id || 'N/A',
            inline: true
          },
          {
            name: '🔗 Tipo de Webhook',
            value: webhookType.charAt(0).toUpperCase() + webhookType.slice(1),
            inline: true
          },
          {
            name: '⏰ Horário',
            value: new Date().toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            inline: true
          },
          {
            name: '✅ Status',
            value: 'Configuração funcionando corretamente!',
            inline: false
          }
        ]
      }
      
      const response = await fetch('/api/edge-functions/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '✅ Teste enviado com sucesso!',
          description: `Webhook ${webhookType} está funcionando corretamente.`
        })
      } else {
        console.error('❌ Erro no teste:', data)
        toast({
          title: '❌ Erro no teste',
          description: data.error || 'Erro ao enviar teste',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao testar webhook:', error)
      toast({
        title: '❌ Erro no teste',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setTestingWebhook(null)
    }
  }
  
  // Função para obter cor do webhook
  const getWebhookColor = (webhookType: string) => {
    const colors = {
      sistema: 0xff0000,      // Vermelho para sistema/segurança
      contaazul: 0x0066cc,    // Azul para ContaAzul
      meta: 0xff6600,         // Laranja para Meta/Social
      checklists: 0x00cc66,   // Verde para checklists
      contahub: 0xff9900,     // Laranja escuro para ContaHub
      sympla: 0xffd700,       // Dourado para Sympla (eventos)
      yuzer: 0x9932cc,        // Roxo escuro para Yuzer
      reservas: 0x6600cc      // Roxo para reservas
    }
    return colors[webhookType as keyof typeof colors] || 0x5865F2
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        {/* Header Profissional */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Central de Integrações
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Configure todas as integrações do seu estabelecimento
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="modal-button-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          
          {/* Status Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-green-800 dark:text-green-300 font-semibold">Ativas</p>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    {Object.values(webhookConfigs).filter(config => config && config.trim() !== '').length} integrações
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-blue-800 dark:text-blue-300 font-semibold">Conectadas</p>
                  <p className="text-blue-600 dark:text-blue-400 text-sm">Discord, Meta</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-yellow-800 dark:text-yellow-300 font-semibold">Pendentes</p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">2 configurações</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-purple-800 dark:text-purple-300 font-semibold">Seguras</p>
                  <p className="text-purple-600 dark:text-purple-400 text-sm">100% protegidas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Integrações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm">
            <TabsTrigger 
              value="discord" 
              className="flex items-center gap-2 data-[state=active]:bg-[#5865F2] data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <div className="w-4 h-4 bg-[#5865F2] data-[state=active]:bg-white/20 rounded"></div>
              Discord
            </TabsTrigger>
            <TabsTrigger 
              value="whatsapp" 
              className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger 
              value="contaazul" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <div className="w-4 h-4 bg-blue-500 data-[state=active]:bg-white/20 rounded"></div>
              ContaAzul
            </TabsTrigger>
            <TabsTrigger 
              value="meta" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 data-[state=active]:bg-white/20 rounded"></div>
              Meta
            </TabsTrigger>
            <TabsTrigger 
              value="getin" 
              className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <div className="w-4 h-4 bg-green-500 data-[state=active]:bg-white/20 rounded"></div>
              GetIn
            </TabsTrigger>
            <TabsTrigger 
              value="eventos" 
              className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Eventos
            </TabsTrigger>
            {/* OCULTAS TEMPORARIAMENTE - NÃO SERÃO USADAS TÃO CEDO */}
            {/* <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger> */}
          </TabsList>

          {/* Discord Tab */}
          <TabsContent value="discord" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#5865F2] rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-xl font-bold">D</span>
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900 dark:text-white">Discord Webhooks</CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Configure notificações automáticas para o Discord
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${Object.values(webhookConfigs).some(config => config && config.trim() !== '') ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm font-medium ${Object.values(webhookConfigs).some(config => config && config.trim() !== '') ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                      {Object.values(webhookConfigs).some(config => config && config.trim() !== '') ? 'Configurado' : 'Não configurado'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <>
                  {/* Loading State */}
                  {loadingConfigs && (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5865F2]"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Carregando configurações...</span>
                    </div>
                  )}
                  
                  {/* Webhook Sistema/Segurança */}
                  {!loadingConfigs && (
                    <div className="space-y-8">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <Label htmlFor="webhook-sistema" className="text-lg font-semibold text-red-800 dark:text-red-300">
                                Sistema & Segurança
                              </Label>
                              <p className="text-sm text-red-600 dark:text-red-400">
                                Eventos críticos e alertas de segurança
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className={`text-sm font-medium ${webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                              {webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'Conectado' : 'Não configurado'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <Input
                              id="webhook-sistema"
                              placeholder="https://discord.com/api/webhooks/..."
                              value={webhookConfigs.sistema}
                              onChange={(e) => setWebhookConfigs({...webhookConfigs, sistema: e.target.value})}
                              disabled={webhookLoading}
                              className="modal-input flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testWebhook('sistema')}
                              disabled={testingWebhook === 'sistema' || !webhookConfigs.sistema || webhookLoading}
                              className="modal-button-secondary px-4"
                            >
                              {testingWebhook === 'sistema' ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                  Testando...
                                </div>
                              ) : (
                                <>
                                  🧪 Testar
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
                            <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">📡 Notificações enviadas:</h4>
                            <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                              <li>• Rate limiting e tentativas de ataque</li>
                              <li>• SQL injection e vulnerabilidades</li>
                              <li>• Backups automáticos e falhas</li>
                              <li>• Eventos críticos de segurança</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                <Separator />

                {/* Webhook ContaAzul */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded" />
                    <Label htmlFor="webhook-contaazul" className="font-medium">
                      Webhook ContaAzul
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-contaazul"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.contaazul}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, contaazul: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('contaazul')}
                      disabled={testingWebhook === 'contaazul' || !webhookConfigs.contaazul || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'contaazul' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
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
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-meta"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.meta}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, meta: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('meta')}
                      disabled={testingWebhook === 'meta' || !webhookConfigs.meta || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'meta' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
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
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-checklists"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.checklists}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, checklists: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('checklists')}
                      disabled={testingWebhook === 'checklists' || !webhookConfigs.checklists || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'checklists' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
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
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-contahub"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.contahub}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, contahub: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('contahub')}
                      disabled={testingWebhook === 'contahub' || !webhookConfigs.contahub || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'contahub' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Análises financeiras, relatórios automatizados, alertas de performance
                  </p>
                </div>

                <Separator />

                {/* Webhook Sympla */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded" />
                    <Label htmlFor="webhook-sympla" className="font-medium">
                      Webhook Sympla
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.sympla && webhookConfigs.sympla.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.sympla && webhookConfigs.sympla.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.sympla && webhookConfigs.sympla.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-sympla"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.sympla}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, sympla: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('sympla')}
                      disabled={testingWebhook === 'sympla' || !webhookConfigs.sympla || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'sympla' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Eventos Sympla, vendas de ingressos, controle de participantes
                  </p>
                </div>

                <Separator />

                {/* Webhook Yuzer */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-600 rounded" />
                    <Label htmlFor="webhook-yuzer" className="font-medium">
                      Webhook Yuzer
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.yuzer && webhookConfigs.yuzer.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.yuzer && webhookConfigs.yuzer.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.yuzer && webhookConfigs.yuzer.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-yuzer"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.yuzer}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, yuzer: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('yuzer')}
                      disabled={testingWebhook === 'yuzer' || !webhookConfigs.yuzer || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'yuzer' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Sistema Yuzer, gestão de delivery e pedidos online
                  </p>
                </div>

                <Separator />

                {/* Webhook Reservas */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded" />
                    <Label htmlFor="webhook-reservas" className="font-medium">
                      Webhook Reservas
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-reservas"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.reservas}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, reservas: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('reservas')}
                      disabled={testingWebhook === 'reservas' || !webhookConfigs.reservas || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'reservas' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Novas reservas, cancelamentos, eventos especiais, occupancy rate
                  </p>
                </div>

                {/* Botão de Salvar */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Configurações alteradas
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Salve as alterações para aplicar as configurações
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSaveWebhooks} 
                      disabled={webhookLoading}
                      className="modal-button-primary px-6 py-3"
                    >
                      {webhookLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Salvando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Salvar Configurações
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
                    </div>
                  )}
                </>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GetIn Tab - SIMPLIFICADA */}
          <TabsContent value="getin" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900 dark:text-white">GetIn - Sistema de Reservas</CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Sincronização com plataforma de reservas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Em desenvolvimento
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status em Desenvolvimento */}
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">🚧</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 mb-3">🚧 Integração em Desenvolvimento</h4>
                      <div className="space-y-3 text-sm text-amber-700">
                        <p><strong>Status atual:</strong> Análise técnica concluída</p>
                        <p><strong>Sistema GetIn:</strong> Identificado como Single Page Application (SPA) complexo</p>
                        
                        <div className="bg-white p-4 rounded-lg border border-amber-200 mt-4">
                          <h5 className="font-medium text-amber-800 mb-3">Opções Disponíveis:</h5>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-blue-600 text-xs">💰</span>
                              </div>
                              <div>
                                <p className="font-medium text-blue-800">API Oficial GetIn</p>
                                <p className="text-xs text-blue-700">Custo: R$ 500/mês - Integração completa e confiável</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-purple-600 text-xs">⚙️</span>
                              </div>
                              <div>
                                <p className="font-medium text-purple-800">Automação Avançada</p>
                                <p className="text-xs text-purple-700">Desenvolvimento customizado com Playwright/Puppeteer</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-green-600 text-xs">🧪</span>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Dados Simulados</p>
                                <p className="text-xs text-green-700">Funcional para desenvolvimento e testes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
                          <p className="text-sm text-blue-800">
                            <strong>Próximos passos:</strong> Avaliação de custo-benefício entre API oficial (R$ 500/mês) 
                            versus desenvolvimento de solução customizada
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações da Integração */}
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Sobre a Integração GetIn</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• <strong>Sincronização automática</strong> de reservas do sistema GetIn</p>
                      <p>• <strong>Dados em tempo real</strong> sobre ocupação e disponibilidade</p>
                      <p>• <strong>Gestão centralizada</strong> de todas as reservas</p>
                      <p>• <strong>Relatórios integrados</strong> com outros sistemas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>WhatsApp Business API</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">WhatsApp Business API</h3>
                  <p className="text-gray-600 mb-6">
                    Configure notificações automáticas, confirmações de reserva e comunicação direta com seus clientes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-semibold text-green-800 mb-2">✨ Funcionalidades</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Confirmações automáticas de reservas</li>
                        <li>• Notificações de pedidos</li>
                        <li>• Lembretes de eventos</li>
                        <li>• Suporte ao cliente 24/7</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-800 mb-2">🎯 Benefícios</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Redução de no-shows em 75%</li>
                        <li>• Atendimento mais eficiente</li>
                        <li>• Maior satisfação dos clientes</li>
                        <li>• Aumento na fidelização</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/configuracoes/whatsapp'}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    💬 Configurar WhatsApp Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ContaAzul Tab */}
          <TabsContent value="contaazul" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">CA</span>
                  </div>
                  <CardTitle>ContaAzul Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded text-white flex items-center justify-center font-bold text-lg">
                      CA
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Integração ContaAzul</h3>
                  <p className="text-gray-600 mb-6">
                    Configure a conexão OAuth com ContaAzul para sincronização automática de dados financeiros
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-800 mb-2">📊 Dados Sincronizados</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Vendas e faturamento</li>
                        <li>• Produtos e categorias</li>
                        <li>• Clientes e fornecedores</li>
                        <li>• Contas a pagar e receber</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-semibold text-green-800 mb-2">⚡ Automação</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Renovação automática de tokens</li>
                        <li>• Sincronização em tempo real</li>
                        <li>• Relatórios automatizados</li>
                        <li>• Alertas de problemas</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/configuracoes/integracoes/contaazul'}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    🔗 Configurar ContaAzul OAuth
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meta Tab */}
          <TabsContent value="meta" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <CardTitle>Meta & Social Media</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Facebook</h4>
                          <p className="text-sm text-gray-600">Posts e análises</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Automação de posts, análise de engajamento e gerenciamento de campanhas publicitárias
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Em desenvolvimento</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-gradient-to-br from-pink-50 to-purple-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Instagram</h4>
                          <p className="text-sm text-gray-600">Stories e posts</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Publicação automática de conteúdo, stories promocionais e análise de métricas
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Em desenvolvimento</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border rounded-lg bg-gradient-to-br from-red-50 to-orange-50">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Google Reviews</h4>
                        <p className="text-sm text-gray-600">Monitoramento e resposta automática</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Monitoramento em tempo real de novas avaliações, notificações automáticas e sugestões de resposta
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">Planejado</span>
                    </div>
                  </div>

                  <div className="text-center py-6">
                    <Button 
                      onClick={() => window.location.href = '/configuracoes/meta-configuracao'}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      🎯 Configurar Meta APIs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab - OCULTA TEMPORARIAMENTE */}
          {/* <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>Email & SMS Marketing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-blue-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Email Marketing</h4>
                          <p className="text-sm text-gray-600">Campanhas automatizadas</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Envio de newsletters, promoções especiais e acompanhamento de eventos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Próxima versão</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-green-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">SMS Notifications</h4>
                          <p className="text-sm text-gray-600">Alertas em tempo real</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Confirmações de reserva, lembretes e notificações importantes via SMS
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Próxima versão</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Em Desenvolvimento</h3>
                    <p className="text-gray-600 mb-4">
                      Estamos trabalhando nas integrações de email e SMS para oferecer a melhor experiência de comunicação
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Lançamento previsto para próxima versão
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* Eventos Tab */}
          <TabsContent value="eventos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>Plataformas de Eventos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-yellow-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Sympla</h4>
                          <p className="text-sm text-gray-600">Gestão de eventos</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Sincronização automática de eventos, vendas de ingressos e controle de participantes
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Em desenvolvimento</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-indigo-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">GetIn</h4>
                          <p className="text-sm text-gray-600">Lista de convidados</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Integração para gestão de lista de convidados e controle de acesso a eventos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-xs text-indigo-600">Em desenvolvimento</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Integrações de Eventos</h3>
                    <p className="text-gray-600 mb-4">
                      Conecte seu estabelecimento com as principais plataformas de eventos do Brasil
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Funcionalidades em desenvolvimento
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab - OCULTA TEMPORARIAMENTE */}
          {/* <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>Business Intelligence & Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-orange-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">ContaHub</h4>
                          <p className="text-sm text-gray-600">Análise avançada</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Análise avançada de dados financeiros e operacionais com insights automáticos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Ativo</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-blue-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Power BI</h4>
                          <p className="text-sm text-gray-600">Dashboards avançados</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Dashboards interativos e relatórios personalizados com Microsoft Power BI
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Planejado</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-6">
                    <Button 
                      onClick={() => window.location.href = '/relatorios/contahub-teste'}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      📊 Acessar ContaHub Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
        
        {/* Espaçamento final para evitar corte da página */}
        <div className="h-16"></div>
      </div>
    </div>
  )
} 