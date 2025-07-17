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
  Link2,
  Server
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
    reservas: ''   // Mantá©m, mas agora mapeia para sistema 'getin'
  })
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleResult, setGoogleResult] = useState<string | null>(null)
  
  useEffect(() => {
    setPageTitle('Integraá§áµes')
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
          // Aba ná£o requer carregamento especá­fico
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
            sympla: data.configuracoes.sympla || data.configuracoes.vendas || '', // Migraá§á£o de vendas para sympla
            yuzer: data.configuracoes.yuzer || '',
            reservas: data.configuracoes.reservas || ''
          }
          setWebhookConfigs(configsCompletas)
        }
      } else {
        console.error('Œ Erro na resposta da API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Œ Erro ao carregar webhooks:', error)
    } finally {
      setLoadingConfigs(false)
    }
  }
  
  // Funá§áµes de carregamento para outras abas
  const loadContaAzulStatus = async () => {
    if (!selectedBar) return
    
    try {
      const response = await fetch(`/api/contaazul/auth?action=status&barId=${selectedBar.id}`)
      const data = await response.json()
      
      // Status verificado silenciosamente
    } catch (error) {
      console.error('Œ Erro ao verificar status ContaAzul:', error)
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
      console.error('Œ Erro ao verificar status Meta:', error)
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
      console.error('Œ Erro ao verificar status WhatsApp:', error)
    }
  }
  
  // FUNá‡á•ES REMOVIDAS TEMPORARIAMENTE
  // const loadEmailStatus = async () => {
  //   if (!selectedBar) return
  //   console.log('ðŸŸ  Carregando status Email para bar:', selectedBar.id)
  //   // TODO: Implementar verificaá§á£o de configuraá§áµes de email
  //   // Pode verificar SMTP, templates, etc.
  // }
  
  const loadEventosStatus = async () => {
    if (!selectedBar) return
    // TODO: Implementar verificaá§á£o de integraá§áµes com Sympla, etc.
  }
  
  // const loadAnalyticsStatus = async () => {
  //   if (!selectedBar) return
  //   console.log('ðŸ”¶ Carregando status Analytics para bar:', selectedBar.id)
  //   // TODO: Implementar verificaá§á£o de conexáµes ContaHub, Power BI, etc.
  // }
  
  const handleSaveWebhooks = async () => {
    if (!selectedBar) {
      toast({
        title: 'Œ Erro',
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
          title: 'œ… Webhooks salvos com sucesso!',
          description: 'As configuraá§áµes foram atualizadas no banco de dados.'
        })
      } else {
        console.error('Œ Erro retornado pela API:', data)
        toast({
          title: 'Œ Erro ao salvar webhooks',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Œ Erro ao salvar webhooks:', error)
      toast({
        title: 'Œ Erro ao salvar webhooks',
        description: 'Erro de conexá£o com o servidor',
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
        title: 'Œ Webhook ná£o configurado',
        description: `Configure o webhook ${webhookType} antes de testar`,
        variant: 'destructive'
      })
      return
    }
    
    if (!selectedBar) {
      toast({
        title: 'Œ Erro',
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
        title: `ðŸ§ª Teste de Webhook - ${webhookType.toUpperCase()}`,
        description: `Este á© um teste do webhook **${webhookType}** realizado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.\n\nœ… Se vocáª está¡ vendo esta mensagem, o webhook está¡ funcionando corretamente!`,
        color: getWebhookColor(webhookType),
        fields: [
          {
            name: 'ðŸ¢ Estabelecimento',
            value: selectedBar.nome || selectedBar.id || 'N/A',
            inline: true
          },
          {
            name: 'ðŸ”— Tipo de Webhook',
            value: webhookType.charAt(0).toUpperCase() + webhookType.slice(1),
            inline: true
          },
          {
            name: '° Horá¡rio',
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
            name: 'œ… Status',
            value: 'Configuraá§á£o funcionando corretamente!',
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
          title: 'œ… Teste enviado com sucesso!',
          description: `Webhook ${webhookType} está¡ funcionando corretamente.`
        })
      } else {
        console.error('Œ Erro no teste:', data)
        toast({
          title: 'Œ Erro no teste',
          description: data.error || 'Erro ao enviar teste',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Œ Erro ao testar webhook:', error)
      toast({
        title: 'Œ Erro no teste',
        description: 'Erro de conexá£o com o servidor',
        variant: 'destructive'
      })
    } finally {
      setTestingWebhook(null)
    }
  }
  
  // Funá§á£o para obter cor do webhook
  const getWebhookColor = (webhookType: string) => {
    const colors = {
      sistema: 0xff0000,      // Vermelho para sistema/seguraná§a
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
  
  // Funá§á£o para rodar Google Avaliaá§áµes
  const handleRunGoogleReviews = async () => {
    setGoogleLoading(true)
    setGoogleResult(null)
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const res = await fetch('/api/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar?.id || 1,
          automatic: true,
          date: yesterday,
          businessName: 'Ordiná¡rio Bar e Máºsica',
          address: 'SBS Q. 2 BL Q Lojas 5/6 - Asa Sul, Brasá­lia - DF, 70070-120',
          days: 30,
          placeId: 'ChIJgTeXKY8aWpMR1hyW_mEEu2k'
        })
      })
      const data = await res.json()
      if (data.success) {
        setGoogleResult('œ… Coleta de avaliaá§áµes do Google realizada com sucesso!')
      } else {
        setGoogleResult('Œ Erro: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (e: any) {
      setGoogleResult('Œ Erro: ' + e.message)
    } finally {
      setGoogleLoading(false)
    }
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
                  Central de Integraá§áµes
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Configure todas as integraá§áµes do seu estabelecimento
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
                    {Object.values(webhookConfigs).filter((config: any) => config && config.trim() !== '').length} integraá§áµes
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
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">2 configuraá§áµes</p>
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

        {/* Tabs de Integraá§áµes */}
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
            {/* OCULTAS TEMPORARIAMENTE - NáƒO SERáƒO USADAS TáƒO CEDO */}
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
                        Configure notificaá§áµes automá¡ticas para o Discord
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${Object.values(webhookConfigs).some(config => config && config.trim() !== '') ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm font-medium ${Object.values(webhookConfigs).some(config => config && config.trim() !== '') ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                      {Object.values(webhookConfigs).some(config => config && config.trim() !== '') ? 'Configurado' : 'Ná£o configurado'}
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
                      <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Carregando configuraá§áµes...</span>
                    </div>
                  )}
                  
                  {/* Webhook Sistema/Seguraná§a */}
                  {!loadingConfigs && (
                    <div className="space-y-8">
                {/* Webhook Sistema/Seguraná§a */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <Label htmlFor="webhook-sistema" className="font-medium">
                      Webhook Sistema & Seguraná§a
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-sistema"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.sistema}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, sistema: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('sistema')}
                      disabled={testingWebhook === 'sistema' || !webhookConfigs.sistema || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'sistema' ? 'Testando...' : 'ðŸ§ª Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Eventos crá­ticos, alertas de seguraná§a, rate limiting, SQL injection
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
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'contaazul' ? 'Testando...' : 'ðŸ§ª Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Sincronizaá§áµes automá¡ticas, renovaá§á£o de tokens, dados financeiros
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
                        {webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'meta' ? 'Testando...' : 'ðŸ§ª Testar'}
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
                      Webhook Checklists & Operaá§áµes
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'checklists' ? 'Testando...' : 'ðŸ§ª Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Conclusá£o de checklists, alertas operacionais, relatá³rios diá¡rios
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
                        {webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'contahub' ? 'Testando...' : 'ðŸ§ª Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Aná¡lises financeiras, relatá³rios automatizados, alertas de performance
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
                        {webhookConfigs.sympla && webhookConfigs.sympla.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'sympla' ? 'Testando...' : 'ðŸ§ª Testar'}
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
                        {webhookConfigs.yuzer && webhookConfigs.yuzer.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'yuzer' ? 'Testando...' : 'ðŸ§ª Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Sistema Yuzer, gestá£o de delivery e pedidos online
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
                        {webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'Conectado' : 'Ná£o configurado'}
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
                      {testingWebhook === 'reservas' ? 'Testando...' : 'ðŸ§ª Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Novas reservas, cancelamentos, eventos especiais, occupancy rate
                  </p>
                </div>

                {/* Botá£o de Salvar */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Configuraá§áµes alteradas
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Salve as alteraá§áµes para aplicar as configuraá§áµes
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
                          Salvar Configuraá§áµes
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
                        Sincronizaá§á£o com plataforma de reservas
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
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">ðŸš§</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">ðŸš§ Integraá§á£o em Desenvolvimento</h4>
                      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <p><strong>Status atual:</strong> Aná¡lise tá©cnica concluá­da</p>
                        <p><strong>Sistema GetIn:</strong> Identificado como Single Page Application (SPA) complexo</p>
                        
                        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mt-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Opá§áµes Disponá­veis:</h5>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-blue-600 text-xs">ðŸ’°</span>
                              </div>
                              <div>
                                <p className="font-medium text-blue-800">API Oficial GetIn</p>
                                <p className="text-xs text-blue-700">Custo: R$ 500/máªs - Integraá§á£o completa e confiá¡vel</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-purple-600 text-xs">š™ï¸</span>
                              </div>
                              <div>
                                <p className="font-medium text-purple-800">Automaá§á£o Avaná§ada</p>
                                <p className="text-xs text-purple-700">Desenvolvimento customizado com Playwright/Puppeteer</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-green-600 text-xs">ðŸ§ª</span>
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
                            <strong>Prá³ximos passos:</strong> Avaliaá§á£o de custo-benefá­cio entre API oficial (R$ 500/máªs) 
                            versus desenvolvimento de soluá§á£o customizada
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informaá§áµes da Integraá§á£o */}
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Sobre a Integraá§á£o GetIn</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>€¢ <strong>Sincronizaá§á£o automá¡tica</strong> de reservas do sistema GetIn</p>
                      <p>€¢ <strong>Dados em tempo real</strong> sobre ocupaá§á£o e disponibilidade</p>
                      <p>€¢ <strong>Gestá£o centralizada</strong> de todas as reservas</p>
                      <p>€¢ <strong>Relatá³rios integrados</strong> com outros sistemas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            {/* Status Principal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">WhatsApp Business API</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Evolution API €¢ AWS sa-east-1</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    œ… Conectado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Náºmero</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">+55 61 9 9848-3434</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">99.9%</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mensagens/máªs</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">1,247</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa entrega</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">98.5%</p>
                  </div>
                </div>

                {/* Informaá§áµes Tá©cnicas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-dark p-6">
                    <h3 className="card-title-dark mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Configuraá§á£o Evolution API
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Instá¢ncia:</span>
                        <span className="text-gray-900 dark:text-white font-medium">SGB_Instance</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Servidor:</span>
                        <span className="text-gray-900 dark:text-white font-medium">evolution-api.sgb.aws.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Versá£o:</span>
                        <span className="text-gray-900 dark:text-white font-medium">v2.1.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Webhook:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">SSL:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Vá¡lido atá© 2024
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="card-dark p-6">
                    <h3 className="card-title-dark mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Funcionalidades Ativas
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Notificaá§áµes reservas</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Lembretes checklist</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Alertas atraso</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Relatá³rios automá¡ticos</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Resposta automá¡tica</span>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                          Config
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AWS & Performance */}
                <div className="card-dark p-6">
                  <h3 className="card-title-dark mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Infraestrutura AWS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Regiá£o</p>
                      <p className="font-semibold text-gray-900 dark:text-white">sa-east-1 (Sá£o Paulo)</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Latáªncia</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">&lt; 50ms</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">ášltima atualizaá§á£o</p>
                      <p className="font-semibold text-gray-900 dark:text-white">Hoje, 14:23</p>
                    </div>
                  </div>
                </div>

                {/* Aá§áµes */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => window.location.href = '/configuracoes/whatsapp'}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configuraá§áµes Avaná§adas
                  </Button>
                  
                  <Button
                    onClick={() => window.open('https://evolution-api.sgb.aws.com', '_blank')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Evolution Dashboard
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ContaAzul Tab */}
          <TabsContent value="contaazul" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">CA</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">ContaAzul Integration</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">OAuth 2.0 €¢ PgCron Sync €¢ API v2</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    œ… Conectado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ášltima Sync</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">Hoje, 15:30</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Eventos DB</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">2,547</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">PgCron</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">Ativo</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas/máªs</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">R$ 45.230</p>
                  </div>
                </div>

                {/* Informaá§áµes Tá©cnicas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-dark p-6">
                    <h3 className="card-title-dark mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Configuraá§á£o OAuth & API
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Token OAuth:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Vá¡lido
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Expira em:</span>
                        <span className="text-gray-900 dark:text-white font-medium">7 dias</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">API Base:</span>
                        <span className="text-gray-900 dark:text-white font-medium">api-v2.contaazul.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Versá£o:</span>
                        <span className="text-gray-900 dark:text-white font-medium">v2.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Refresh automá¡tico:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="card-dark p-6">
                    <h3 className="card-title-dark mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Dados Sincronizados
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Categorias financeiras</span>
                        <span className="text-gray-900 dark:text-white font-medium">24</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Eventos financeiros</span>
                        <span className="text-gray-900 dark:text-white font-medium">2,547</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Contas a receber</span>
                        <span className="text-gray-900 dark:text-white font-medium">1,234</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Contas a pagar</span>
                        <span className="text-gray-900 dark:text-white font-medium">567</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Parcelas</span>
                        <span className="text-gray-900 dark:text-white font-medium">3,401</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PgCron & Automaá§á£o */}
                <div className="card-dark p-6">
                  <h3 className="card-title-dark mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Automaá§á£o PgCron
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Frequáªncia</p>
                      <p className="font-semibold text-gray-900 dark:text-white">A cada 4 horas</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Prá³xima execuá§á£o</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">19:00 hoje</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">ášltima execuá§á£o</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">15:30 (sucesso)</p>
                    </div>
                  </div>
                </div>

                {/* Estatá­sticas Financeiras */}
                <div className="card-dark p-6">
                  <h3 className="card-title-dark mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Resumo Financeiro (Janeiro 2024)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-green-600 dark:text-green-400 mb-1">Receitas</p>
                      <p className="font-bold text-green-700 dark:text-green-300 text-lg">R$ 45.230</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-red-600 dark:text-red-400 mb-1">Despesas</p>
                      <p className="font-bold text-red-700 dark:text-red-300 text-lg">R$ 23.450</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-blue-600 dark:text-blue-400 mb-1">Saldo</p>
                      <p className="font-bold text-blue-700 dark:text-blue-300 text-lg">R$ 21.780</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-purple-600 dark:text-purple-400 mb-1">Transaá§áµes</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300 text-lg">2,547</p>
                    </div>
                  </div>
                </div>

                {/* Aá§áµes */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => window.location.href = '/configuracoes/contaazul-pgcron'}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configurar PgCron
                  </Button>
                  
                  <Button
                    onClick={() => window.open('https://api-v2.contaazul.com', '_blank')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    API ContaAzul
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar Agora
                  </Button>

                  <Button
                    onClick={() => window.location.href = '/relatorios/contaazul-teste'}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Relatá³rios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meta Tab */}
          <TabsContent value="meta" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">M</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Meta Business APIs</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Facebook €¢ Instagram €¢ Graph API v18.0</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    œ… Conectado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ášltima Coleta</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">Hoje, 14:15</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts Instagram</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">1,247</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts Facebook</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">823</p>
                  </div>

                  <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Engajamento</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">4.8%</p>
                  </div>
                </div>

                {/* Informaá§áµes Tá©cnicas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-dark p-6">
                    <h3 className="card-title-dark mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Configuraá§á£o API & Tokens
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Access Token:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Vá¡lido
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">App ID:</span>
                        <span className="text-gray-900 dark:text-white font-medium">1234567890</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Graph API:</span>
                        <span className="text-gray-900 dark:text-white font-medium">v18.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Facebook Page:</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                          Conectada
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Instagram Business:</span>
                        <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 text-xs">
                          Conectado
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="card-dark p-6">
                    <h3 className="card-title-dark mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Dados Coletados
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Posts Instagram</span>
                        <span className="text-gray-900 dark:text-white font-medium">1,247</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Posts Facebook</span>
                        <span className="text-gray-900 dark:text-white font-medium">823</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Instagram Insights</span>
                        <span className="text-gray-900 dark:text-white font-medium">3,401</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Total Dados</span>
                        <span className="text-gray-900 dark:text-white font-medium">5,471</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Aná¡lises Content</span>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                          Ativo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PgCron & Automaá§á£o */}
                <div className="card-dark p-6">
                  <h3 className="card-title-dark mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Automaá§á£o PgCron Meta
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Frequáªncia</p>
                      <p className="font-semibold text-gray-900 dark:text-white">A cada 6 horas</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Prá³xima coleta</p>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">20:00 hoje</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">ášltima coleta</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">14:15 (sucesso)</p>
                    </div>
                  </div>
                </div>

                {/* Estatá­sticas de Engajamento */}
                <div className="card-dark p-6">
                  <h3 className="card-title-dark mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    Má©tricas de Engajamento (ášltimos 30 dias)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                      <p className="text-pink-600 dark:text-pink-400 mb-1">Total Posts</p>
                      <p className="font-bold text-pink-700 dark:text-pink-300 text-lg">127</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-blue-600 dark:text-blue-400 mb-1">Total Likes</p>
                      <p className="font-bold text-blue-700 dark:text-blue-300 text-lg">12.4K</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-green-600 dark:text-green-400 mb-1">Comentá¡rios</p>
                      <p className="font-bold text-green-700 dark:text-green-300 text-lg">1.2K</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-purple-600 dark:text-purple-400 mb-1">Engajamento</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300 text-lg">4.8%</p>
                    </div>
                  </div>
                </div>

                {/* Aá§áµes */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configuraá§áµes Avaná§adas
                  </Button>
                  
                  <Button
                    onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Meta for Developers
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Coletar Agora
                  </Button>

                  <Button
                    onClick={() => window.location.href = '/visao-geral/marketing-360'}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Marketing 360°
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleRunGoogleReviews}
                    disabled={googleLoading}
                  >
                    <Star className="w-4 h-4 text-yellow-500" />
                    {googleLoading ? 'Coletando Google...' : 'Coletar Google Avaliaá§áµes (ontem)'}
                  </Button>
                </div>

                {googleResult && (
                  <div className="w-full mt-2 card-description-dark">{googleResult}</div>
                )}
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
                        Envio de newsletters, promoá§áµes especiais e acompanhamento de eventos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Prá³xima versá£o</span>
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
                        Confirmaá§áµes de reserva, lembretes e notificaá§áµes importantes via SMS
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Prá³xima versá£o</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Em Desenvolvimento</h3>
                    <p className="text-gray-600 mb-4">
                      Estamos trabalhando nas integraá§áµes de email e SMS para oferecer a melhor experiáªncia de comunicaá§á£o
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Laná§amento previsto para prá³xima versá£o
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
                          <p className="text-sm text-gray-600">Gestá£o de eventos</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Sincronizaá§á£o automá¡tica de eventos, vendas de ingressos e controle de participantes
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
                        Integraá§á£o para gestá£o de lista de convidados e controle de acesso a eventos
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Integraá§áµes de Eventos</h3>
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
                          <p className="text-sm text-gray-600">Aná¡lise avaná§ada</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Aná¡lise avaná§ada de dados financeiros e operacionais com insights automá¡ticos
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
                          <p className="text-sm text-gray-600">Dashboards avaná§ados</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Dashboards interativos e relatá³rios personalizados com Microsoft Power BI
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
                      ðŸ“Š Acessar ContaHub Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
        
        {/* Espaá§amento final para evitar corte da pá¡gina */}
        <div className="h-16"></div>
      </div>
    </div>
  )
} 
