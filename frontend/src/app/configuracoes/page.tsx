'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { PWAInstaller, usePWAInstaller } from '@/components/PWAInstaller'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import { useBar } from '@/contexts/BarContext'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Target, User, Settings, Smartphone, CheckCircle, Shield, AlertTriangle, Users, UserPlus, Edit, Trash2, Lock, Unlock, Save, X, Eye, EyeOff, Activity, Server, RefreshCw } from 'lucide-react'
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
  lastCheck?: string
  rateLimitingActive?: boolean
  environment?: string
}

interface Usuario {
  id: string
  nome: string
  email: string
  role: 'admin' | 'gerente' | 'funcionario'
  ativo: boolean
  modulos_permitidos: string[]
  criado_em: string
  ultimo_login?: string
  telefone?: string
  observacoes?: string
}

interface NovoUsuario {
  nome: string
  email: string
  password: string
  role: 'admin' | 'gerente' | 'funcionario'
  telefone?: string
  observacoes?: string
  modulos_permitidos: string[]
}

function ConfiguracoesContent() {
  const { setPageTitle } = usePageTitle()
  const { toast } = useToast()
  const { user, isAdminWithSpecificPermissions } = usePermissions()
  const { selectedBar } = useBar()
  const { canInstall, isInstalled, install } = usePWAInstaller()

  const [activeTab, setActiveTab] = useState<'metas' | 'usuarios' | 'integracoes' | 'seguranca' | 'aplicativo'>('metas')
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

  // Estados para usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosLoading, setUsuariosLoading] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuario>({
    nome: '',
    email: '',
    password: '',
    role: 'funcionario',
    telefone: '',
    observacoes: '',
    modulos_permitidos: []
  })
  const [dialogAberto, setDialogAberto] = useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)

  // Módulos disponíveis para permissões
  const modulosDisponiveis = [
    { id: 'dashboard', nome: 'Dashboard', categoria: 'Visualização' },
    { id: 'relatorios', nome: 'Relatórios', categoria: 'Análise' },
    { id: 'configuracoes', nome: 'Configurações', categoria: 'Administração' },
    { id: 'usuarios', nome: 'Usuários', categoria: 'Administração' },
    { id: 'checklists', nome: 'Checklists', categoria: 'Operações' },
    { id: 'receitas', nome: 'Receitas', categoria: 'Financeiro' },
    { id: 'desempenho', nome: 'Desempenho', categoria: 'Análise' },
    { id: 'terminal_producao', nome: 'Terminal Produção', categoria: 'Operações' },
    { id: 'meta_config', nome: 'Meta Config', categoria: 'Administração' },
    { id: 'contaazul', nome: 'ContaAzul', categoria: 'Integração' },
    { id: 'contahub', nome: 'ContaHub', categoria: 'Integração' },
    { id: 'whatsapp', nome: 'WhatsApp', categoria: 'Comunicação' },
    { id: 'discord', nome: 'Discord', categoria: 'Comunicação' },
    { id: 'backup', nome: 'Backup', categoria: 'Sistema' },
    { id: 'seguranca', nome: 'Segurança', categoria: 'Sistema' },
    { id: 'auditoria', nome: 'Auditoria', categoria: 'Sistema' },
    { id: 'integracao_sympla', nome: 'Sympla', categoria: 'Integração' },
    { id: 'integracao_getin', nome: 'GetIn', categoria: 'Integração' },
    { id: 'marketing', nome: 'Marketing', categoria: 'Marketing' },
    { id: 'social_media', nome: 'Social Media', categoria: 'Marketing' },
    { id: 'vendas', nome: 'Vendas', categoria: 'Financeiro' },
    { id: 'reservas', nome: 'Reservas', categoria: 'Operações' },
    { id: 'analytics', nome: 'Analytics', categoria: 'Análise' }
  ]

  // Estados para segurança
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)

  // Estados para webhooks Discord
  const [webhookConfigs, setWebhookConfigs] = useState({
    sistema: 'https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y',
    contaazul: 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ',
    meta: '',
    checklists: '',
    contahub: '',
    vendas: '',
    reservas: ''
  })
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

  useEffect(() => {
    setPageTitle('Configurações')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    if (activeTab === 'usuarios') {
      buscarUsuarios()
    }
  }, [activeTab, selectedBar])

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

  // Funções para gerenciar usuários
  const buscarUsuarios = async () => {
    if (!selectedBar) return
    
    try {
      setUsuariosLoading(true)
      const response = await fetch(`/api/usuarios?bar_id=${selectedBar.id}`)
      const data = await response.json()
      
      if (data.success) {
        setUsuarios(data.usuarios)
      } else {
        toast({
          title: '❌ Erro ao buscar usuários',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast({
        title: '❌ Erro ao buscar usuários',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setUsuariosLoading(false)
    }
  }

  const criarUsuario = async () => {
    if (!selectedBar) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ...novoUsuario
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '✅ Usuário criado com sucesso!',
          description: `${novoUsuario.nome} foi adicionado ao sistema.`
        })
        setNovoUsuario({
          nome: '',
          email: '',
          password: '',
          role: 'funcionario',
          telefone: '',
          observacoes: '',
          modulos_permitidos: []
        })
        setDialogAberto(false)
        buscarUsuarios()
      } else {
        toast({
          title: '❌ Erro ao criar usuário',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast({
        title: '❌ Erro ao criar usuário',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const editarUsuario = async () => {
    if (!selectedBar || !usuarioEditando) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${usuarioEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ...usuarioEditando
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '✅ Usuário atualizado com sucesso!',
          description: `${usuarioEditando.nome} foi atualizado.`
        })
        setUsuarioEditando(null)
        buscarUsuarios()
      } else {
        toast({
          title: '❌ Erro ao atualizar usuário',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao editar usuário:', error)
      toast({
        title: '❌ Erro ao atualizar usuário',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const excluirUsuario = async (usuario: Usuario) => {
    if (!selectedBar || !confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bar_id: selectedBar.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '✅ Usuário excluído com sucesso!',
          description: `${usuario.nome} foi removido do sistema.`
        })
        buscarUsuarios()
      } else {
        toast({
          title: '❌ Erro ao excluir usuário',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast({
        title: '❌ Erro ao excluir usuário',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleUsuarioAtivo = async (usuario: Usuario) => {
    const novoStatus = !usuario.ativo
    
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${usuario.id}/toggle-ativo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          bar_id: selectedBar?.id,
          ativo: novoStatus 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: novoStatus ? '✅ Usuário ativado!' : '🔒 Usuário desativado!',
          description: `${usuario.nome} foi ${novoStatus ? 'ativado' : 'desativado'}.`
        })
        buscarUsuarios()
      } else {
        toast({
          title: '❌ Erro ao alterar status',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: '❌ Erro ao alterar status',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Usar timezone de Brasília
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Função para cor do nível de severidade
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white'
      case 'warning': return 'bg-yellow-500 text-white'
      case 'info': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Função para cor do risco
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Função para mascarar dados sensíveis
  const maskSensitiveData = (data: string) => {
    if (!showSensitiveData) {
      if (data.includes('@')) {
        // Email
        const [user, domain] = data.split('@')
        return `${user.substring(0, 2)}***@${domain}`
      }
      if (data.includes('.')) {
        // IP
        const parts = data.split('.')
        return `${parts[0]}.${parts[1]}.xxx.xxx`
      }
    }
    return data
  }

  // Função para salvar configurações de webhook
  const handleSaveWebhooks = async () => {
    if (!selectedBar) return
    
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
          title: '✅ Configurações salvas com sucesso!',
          description: 'Os webhooks Discord foram atualizados.',
        })
      } else {
        toast({
          title: '❌ Erro ao salvar configurações',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: '❌ Erro ao salvar configurações',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive',
      })
    } finally {
      setWebhookLoading(false)
    }
  }

  // Função para carregar configurações de webhook
  const loadWebhookConfigs = async () => {
    if (!selectedBar) return
    
    try {
      const response = await fetch(`/api/configuracoes/webhooks?bar_id=${selectedBar.id}`)
      const data = await response.json()
      
      if (data.success && data.configuracoes) {
        setWebhookConfigs(data.configuracoes)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  // Carregar configurações ao selecionar um bar
  useEffect(() => {
    if (selectedBar && activeTab === 'integracoes') {
      loadWebhookConfigs()
    }
  }, [selectedBar, activeTab])

  // Função para testar webhook
  const testWebhook = async (webhookType: string) => {
    if (!selectedBar) {
      toast({
        title: '❌ Erro',
        description: 'Nenhum bar selecionado',
        variant: 'destructive'
      })
      return
    }

    const webhook = webhookConfigs[webhookType as keyof typeof webhookConfigs]
    if (!webhook || webhook.trim() === '') {
      toast({
        title: '❌ Webhook não configurado',
        description: `Configure o webhook ${webhookType} antes de testar`,
        variant: 'destructive'
      })
      return
    }

    try {
      setTestingWebhook(webhookType)
      
      const response = await fetch('/api/edge-functions/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          webhook_type: webhookType,
          title: `🧪 Teste de Webhook - ${webhookType.toUpperCase()}`,
          description: `Este é um teste do webhook **${webhookType}** configurado para o bar **${selectedBar.id}**.\n\n✅ Se você está vendo esta mensagem, o webhook está funcionando corretamente!`,
          color: getWebhookColor(webhookType),
          fields: [
            {
              name: '📍 Bar',
              value: selectedBar.id,
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
                timeZone: 'America/Sao_Paulo'
              }),
              inline: true
            }
          ]
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '✅ Teste realizado com sucesso!',
          description: `Webhook ${webhookType} está funcionando. Verifique seu Discord.`
        })
      } else {
        toast({
          title: '❌ Erro no teste',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error)
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
      sistema: 0xff0000,     // Vermelho
      contaazul: 0x0066cc,   // Azul
      meta: 0xff6600,        // Laranja
      checklists: 0x00cc66,  // Verde
      contahub: 0xff9900,    // Laranja escuro
      vendas: 0x00ff00,      // Verde claro
      reservas: 0x6600cc     // Roxo
    }
    return colors[webhookType as keyof typeof colors] || 0x808080
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'gerente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'funcionario': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'gerente': return 'Gerente'
      case 'funcionario': return 'Funcionário'
      default: return role
    }
  }

  const renderModulosPermitidos = (modulos: string[]) => {
    const categorias = modulosDisponiveis.reduce((acc: Record<string, string[]>, modulo) => {
      if (modulos.includes(modulo.id)) {
        if (!acc[modulo.categoria]) acc[modulo.categoria] = []
        acc[modulo.categoria].push(modulo.nome)
      }
      return acc
    }, {} as Record<string, string[]>)

    return Object.entries(categorias).map(([categoria, nomes]) => (
      <div key={categoria} className="mb-2">
        <div className="text-xs font-semibold text-gray-600 mb-1">{categoria}</div>
        <div className="flex flex-wrap gap-1">
          {nomes.map((nome: string) => (
            <Badge key={nome} variant="secondary" className="text-xs">
              {nome}
            </Badge>
          ))}
        </div>
      </div>
    ))
  }

  const tabs = [
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'usuarios', label: 'Usuários', icon: User },
    { id: 'integracoes', label: 'Integrações', icon: Settings },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'aplicativo', label: 'Aplicativo', icon: Smartphone },
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
                onClick={() => setActiveTab('usuarios')}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                  </div>
                  <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                    <button
                      onClick={() => setDialogAberto(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Novo Usuário</span>
                    </button>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Usuário</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nome">Nome Completo *</Label>
                            <Input
                              id="nome"
                              value={novoUsuario.nome}
                              onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                              placeholder="Digite o nome completo"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={novoUsuario.email}
                              onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                              placeholder="usuario@exemplo.com"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="password">Senha *</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={senhaVisivel ? 'text' : 'password'}
                                value={novoUsuario.password}
                                onChange={(e) => setNovoUsuario({...novoUsuario, password: e.target.value})}
                                placeholder="Digite a senha"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setSenhaVisivel(!senhaVisivel)}
                              >
                                {senhaVisivel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="role">Função *</Label>
                            <Select value={novoUsuario.role} onValueChange={(value) => setNovoUsuario({...novoUsuario, role: value as any})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a função" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="funcionario">Funcionário</SelectItem>
                                <SelectItem value="gerente">Gerente</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={novoUsuario.telefone}
                            onChange={(e) => setNovoUsuario({...novoUsuario, telefone: e.target.value})}
                            placeholder="(11) 99999-9999"
                          />
                        </div>

                        <div>
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea
                            id="observacoes"
                            value={novoUsuario.observacoes}
                            onChange={(e) => setNovoUsuario({...novoUsuario, observacoes: e.target.value})}
                            placeholder="Observações sobre o usuário"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Permissões de Módulos</Label>
                          <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                            {Object.entries(
                              modulosDisponiveis.reduce((acc: Record<string, typeof modulosDisponiveis>, modulo) => {
                                if (!acc[modulo.categoria]) acc[modulo.categoria] = []
                                acc[modulo.categoria].push(modulo)
                                return acc
                              }, {} as Record<string, typeof modulosDisponiveis>)
                            ).map(([categoria, modulos]) => (
                              <div key={categoria} className="mb-4">
                                <div className="font-semibold text-sm text-gray-700 mb-2">{categoria}</div>
                                <div className="space-y-2">
                                  {modulos.map(modulo => (
                                    <div key={modulo.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`modulo-${modulo.id}`}
                                        checked={novoUsuario.modulos_permitidos.includes(modulo.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setNovoUsuario({
                                              ...novoUsuario,
                                              modulos_permitidos: [...novoUsuario.modulos_permitidos, modulo.id]
                                            })
                                          } else {
                                            setNovoUsuario({
                                              ...novoUsuario,
                                              modulos_permitidos: novoUsuario.modulos_permitidos.filter(m => m !== modulo.id)
                                            })
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <Label htmlFor={`modulo-${modulo.id}`} className="text-sm">
                                        {modulo.nome}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setDialogAberto(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            onClick={criarUsuario}
                            disabled={loading || !novoUsuario.nome || !novoUsuario.email || !novoUsuario.password}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Criando...' : 'Criar Usuário'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {usuariosLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Carregando usuários...</p>
                  </div>
                ) : usuarios.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum usuário encontrado</h3>
                    <p className="text-gray-600 mb-4">
                      Comece criando o primeiro usuário para sua equipe
                    </p>
                    <Button
                      onClick={() => setDialogAberto(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Primeiro Usuário
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usuarios.map((usuario) => (
                      <div key={usuario.id} className="border rounded-lg p-4 bg-gradient-to-r from-white to-blue-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              usuario.role === 'admin' ? 'bg-red-500' : 
                              usuario.role === 'gerente' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}>
                              {usuario.role === 'admin' ? '👑' : usuario.role === 'gerente' ? '👨‍💼' : '👤'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{usuario.nome}</h3>
                              <p className="text-gray-600">{usuario.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getRoleColor(usuario.role)}>
                                  {getRoleLabel(usuario.role)}
                                </Badge>
                                <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsuarioEditando(usuario)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUsuarioAtivo(usuario)}
                            >
                              {usuario.ativo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => excluirUsuario(usuario)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Informações:</div>
                            <div>📅 Criado em: {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}</div>
                            {usuario.ultimo_login && (
                              <div>🕐 Último login: {new Date(usuario.ultimo_login).toLocaleDateString('pt-BR')}</div>
                            )}
                            {usuario.telefone && (
                              <div>📞 Telefone: {usuario.telefone}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Permissões ({usuario.modulos_permitidos.length}):</div>
                            <div className="max-h-32 overflow-y-auto">
                              {renderModulosPermitidos(usuario.modulos_permitidos)}
                            </div>
                          </div>
                        </div>
                        
                        {usuario.observacoes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <div className="text-gray-600 mb-1">Observações:</div>
                            <div>{usuario.observacoes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'integracoes' && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <CardTitle>Central de Integrações</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Todas as Integrações</h3>
                  <p className="text-gray-600 mb-6">
                    Acesse a central completa de integrações com abas organizadas para cada plataforma
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border rounded-lg bg-[#5865F2]/10">
                      <h4 className="font-semibold text-[#5865F2] mb-2">Discord</h4>
                      <p className="text-sm text-gray-600">Webhooks e notificações</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-semibold text-green-600 mb-2">WhatsApp</h4>
                      <p className="text-sm text-gray-600">Business API</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-600 mb-2">ContaAzul</h4>
                      <p className="text-sm text-gray-600">OAuth e sincronização</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/configuracoes/integracoes'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    🔗 Acessar Central de Integrações
                  </Button>
                </div>
              </CardContent>
            </Card>
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

          {activeTab === 'aplicativo' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <CardTitle>SGB Dashboard - App</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Status do App */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">SGB Dashboard</h3>
                          <p className="text-gray-600">Aplicativo Progressive Web App</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isInstalled ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Instalado</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-500">
                            <Smartphone className="w-5 h-5" />
                            <span className="font-medium">Não instalado</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão de instalação */}
                    {!isInstalled && (
                      <div className="text-center py-6">
                        {canInstall ? (
                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Instalar Aplicativo</h3>
                            <p className="text-gray-600 mb-6">
                              Instale o SGB Dashboard como um aplicativo em seu dispositivo para acesso rápido e experiência nativa.
                            </p>
                            <Button
                              onClick={handlePWAInstall}
                              size="lg"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                            >
                              <Smartphone className="w-5 h-5 mr-2" />
                              Instalar Aplicativo
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-600">Instalação Indisponível</h3>
                            <p className="text-gray-500">
                              O aplicativo não pode ser instalado neste navegador ou dispositivo no momento.
                            </p>
                            <div className="text-sm text-gray-400">
                              <p>• Certifique-se de estar usando um navegador compatível (Chrome, Edge, Safari)</p>
                              <p>• O aplicativo pode já estar instalado</p>
                              <p>• Alguns navegadores requerem HTTPS para instalação</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recursos do App */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Acesso Offline
                        </h4>
                        <p className="text-sm text-gray-600">
                          Funciona mesmo sem conexão com internet
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Notificações Push
                        </h4>
                        <p className="text-sm text-gray-600">
                          Receba alertas importantes instantaneamente
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Inicialização Rápida
                        </h4>
                        <p className="text-sm text-gray-600">
                          Carregamento instantâneo da tela inicial
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Interface Nativa
                        </h4>
                        <p className="text-sm text-gray-600">
                          Experiência como aplicativo nativo
                        </p>
                      </div>
                    </div>

                    {/* Informações técnicas */}
                    <div className="border-t pt-6">
                      <h4 className="font-semibold mb-4">Informações Técnicas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Versão:</span> 2.0.0
                        </div>
                        <div>
                          <span className="font-medium">Última atualização:</span> {new Date().toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Tecnologia:</span> Progressive Web App (PWA)
                        </div>
                        <div>
                          <span className="font-medium">Compatibilidade:</span> Chrome, Edge, Safari, Firefox
                        </div>
                      </div>
                    </div>

                    {/* Instruções */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-blue-800">Como instalar:</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• <strong>Chrome/Edge:</strong> Clique no botão "Instalar" acima ou no ícone de instalação na barra de endereços</p>
                        <p>• <strong>Safari (iOS):</strong> Toque em "Compartilhar" e depois em "Adicionar à Tela de Início"</p>
                        <p>• <strong>Android:</strong> Use o menu do navegador e selecione "Instalar app"</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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