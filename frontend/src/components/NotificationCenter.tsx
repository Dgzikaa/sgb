'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications, getColorByType, getColorByPriority, formatarTempo } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  X, 
  Settings, 
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  ExternalLink,
  Trash2,
  Eye,
  MoreVertical,
  MousePointer
} from 'lucide-react'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

interface NotificationCenterProps {
  className?: string
  showUnreadCount?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function NotificationCenter({ 
  className = '', 
  showUnreadCount = true,
  autoRefresh = true,
  refreshInterval = 30000 
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('todas')
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  const {
    notificacoes,
    loading,
    error,
    estatisticas,
    permissaoBrowser,
    suportaBrowser,
    carregarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    solicitarPermissaoBrowser,
    configurarPolling,
    pararPolling,
    limparErro
  } = useNotifications()

  const router = useRouter()

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    // Carregar notificações iniciais
    carregarNotificacoes({ apenas_nao_lidas: false, limit: 20 })

    // Configurar auto-refresh se habilitado
    if (autoRefresh) {
      configurarPolling(refreshInterval)
    }

    return () => {
      if (autoRefresh) {
        pararPolling()
      }
    }
  }, [autoRefresh, refreshInterval])

  useEffect(() => {
    // Solicitar permissão para browser notifications quando abrir pela primeira vez
    if (isOpen && suportaBrowser && permissaoBrowser === 'default') {
      solicitarPermissaoBrowser()
    }
  }, [isOpen, suportaBrowser, permissaoBrowser])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleNotificationClick = async (notificacao: any) => {
    // Marcar como lida se não estiver
    if (notificacao.status !== 'lida') {
      await marcarComoLida(notificacao.id)
    }

    // Executar ação se tiver - verificar tanto no campo acoes quanto no campo dados
    let acoes = notificacao.acoes || []
    
    // Se não há ações diretas, verificar no campo dados
    if ((!acoes || acoes.length === 0) && notificacao.dados) {
      acoes = notificacao.dados.acoes || []
    }

    if (acoes && acoes.length > 0) {
      const acao = acoes[0] // Primeira ação por padrão
      
      if (acao.action === 'redirect' && acao.url) {
        // Usar router do Next.js para redirecionamento
        router.push(acao.url)
      } else if (acao.action === 'callback' && acao.callback) {
        // Executar callback personalizado
        try {
          eval(acao.callback)
        } catch (error) {
          console.error('Erro ao executar callback da notificação:', error)
        }
      }
    }
  }

  const handleMarkAllRead = async () => {
    const sucesso = await marcarTodasComoLidas()
    if (sucesso) {
      console.log('📱 Todas as notificações marcadas como lidas')
    }
  }

  const filtrarNotificacoes = (notificacoes: any[]) => {
    let filtradas = notificacoes

    // Filtrar por tab ativa
    switch (activeTab) {
      case 'nao_lidas':
        filtradas = filtradas.filter(n => ['pendente', 'enviada'].includes(n.status))
        break
      case 'checklists':
        filtradas = filtradas.filter(n => n.modulo === 'checklists')
        break
      case 'sistema':
        filtradas = filtradas.filter(n => ['metas', 'contaazul', 'relatorios', 'dashboard'].includes(n.modulo))
        break
    }

    // Filtrar por tipo se selecionado
    if (filtroTipo) {
      filtradas = filtradas.filter(n => n.tipo === filtroTipo)
    }

    return filtradas
  }

  // =====================================================
  // COMPONENTES
  // =====================================================

  const IconeNotificacao = ({ tipo }: { tipo: string }) => {
    const iconProps = { className: "w-4 h-4" }
    
    switch (tipo) {
      case 'info': 
      case 'sistema': 
        return <Info {...iconProps} className="w-4 h-4 text-blue-500" />
      case 'alerta': 
      case 'lembrete': 
        return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-500" />
      case 'erro': 
      case 'problema': 
        return <XCircle {...iconProps} className="w-4 h-4 text-red-500" />
      case 'sucesso': 
      case 'conclusao': 
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-500" />
      default: return <Info {...iconProps} />
    }
  }

  const NotificationItem = ({ notificacao }: { notificacao: any }) => {
    // Verificar se há ações disponíveis
    const acoes = notificacao.acoes || notificacao.dados?.acoes || []
    const temAcoes = acoes.length > 0
    
    return (
      <div 
        className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group relative ${
          notificacao.status === 'lida' ? 'opacity-60' : ''
        }`}
        onClick={() => handleNotificationClick(notificacao)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <IconeNotificacao tipo={notificacao.tipo} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {notificacao.titulo}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getColorByPriority(notificacao.dados?.prioridade || 'media')}`}
                >
                  {notificacao.dados?.prioridade || 'media'}
                </Badge>
                {notificacao.status !== 'lida' && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {notificacao.mensagem}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                <Badge variant="secondary" className="text-xs">
                  {notificacao.dados?.modulo || 'sistema'}
                </Badge>
                <span>•</span>
                <span>{formatarTempo(notificacao.criada_em)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {temAcoes && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <MousePointer className="w-3 h-3" />
                    <span>Clique para acessar</span>
                  </div>
                )}
                
                {temAcoes && (
                  <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                excluirNotificacao(notificacao.id)
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const EmptyState = () => (
    <div className="text-center py-8">
      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">
        Nenhuma notificação
      </h3>
      <p className="text-xs text-gray-500">
        Você está em dia com tudo!
      </p>
    </div>
  )

  const FilterBar = () => (
    <div className="flex items-center justify-between p-3 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <select 
          value={filtroTipo} 
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="text-sm border-none bg-transparent focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          <option value="info">Info</option>
          <option value="alerta">Alerta</option>
          <option value="erro">Erro</option>
          <option value="sucesso">Sucesso</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
          <CheckCheck className="w-4 h-4 mr-1" />
          Marcar todas
        </Button>
      </div>
    </div>
  )

  const SettingsPanel = () => (
    <div className="p-4 space-y-4">
      <h4 className="text-sm font-medium">Configurações</h4>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm">Browser notifications</label>
          <Switch 
            checked={permissaoBrowser === 'granted'} 
            onCheckedChange={() => {
              if (permissaoBrowser !== 'granted') {
                solicitarPermissaoBrowser()
              }
            }}
            disabled={!suportaBrowser}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm">Auto-refresh</label>
          <Switch checked={autoRefresh} disabled />
        </div>
        
        <div className="text-xs text-gray-500">
          {suportaBrowser ? (
            permissaoBrowser === 'granted' ? 
              '✅ Notificações ativadas' : 
              '❌ Permissão necessária'
          ) : (
            '❌ Browser não suporta notificações'
          )}
        </div>
      </div>
    </div>
  )

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  const naoLidas = estatisticas?.nao_lidas || 0
  const notificacoesFiltradas = filtrarNotificacoes(notificacoes)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${className}`}
        >
          {naoLidas > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          
          {showUnreadCount && naoLidas > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center"
            >
              {naoLidas > 99 ? '99+' : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                {loading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                <Button size="sm" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {estatisticas && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{estatisticas.total_semana} esta semana</span>
                <span>•</span>
                <span>{naoLidas} não lidas</span>
                <span>•</span>
                <span>{estatisticas.alta_prioridade} urgentes</span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {error && (
              <div className="p-3 bg-red-50 border-b">
                <p className="text-sm text-red-600">{error}</p>
                <Button size="sm" variant="ghost" onClick={limparErro}>
                  Tentar novamente
                </Button>
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 rounded-none">
                <TabsTrigger value="todas" className="text-xs">
                  Todas
                </TabsTrigger>
                <TabsTrigger value="nao_lidas" className="text-xs">
                  Não lidas
                  {naoLidas > 0 && (
                    <Badge className="ml-1 px-1 py-0 text-xs h-4">
                      {naoLidas}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="checklists" className="text-xs">
                  Checklists
                </TabsTrigger>
                <TabsTrigger value="sistema" className="text-xs">
                  Sistema
                </TabsTrigger>
              </TabsList>
              
              <FilterBar />
              
              <TabsContent value={activeTab} className="m-0">
                <ScrollArea className="h-96">
                  {notificacoesFiltradas.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div>
                      {notificacoesFiltradas.map((notificacao) => (
                        <NotificationItem 
                          key={notificacao.id} 
                          notificacao={notificacao} 
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <div className="border-t p-3">
              <div className="flex items-center justify-between">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => carregarNotificacoes()}
                >
                  Atualizar
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {/* TODO: Abrir página completa */}}
                >
                  Ver todas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

// =====================================================
// COMPONENTE SIMPLIFICADO PARA HEADER
// =====================================================

export function NotificationBell({ className = '' }: { className?: string }) {
  const { estatisticas, carregarNotificacoes } = useNotifications()
  
  useEffect(() => {
    carregarNotificacoes({ apenas_nao_lidas: true, limit: 5 })
  }, [])
  
  const naoLidas = estatisticas?.nao_lidas || 0
  
  return (
    <NotificationCenter 
      className={className}
      showUnreadCount={true}
      autoRefresh={true}
      refreshInterval={60000} // 1 minuto
    />
  )
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================

export function NotificationToast({ 
  notificacao, 
  onClose, 
  onAction 
}: { 
  notificacao: any
  onClose: () => void
  onAction?: () => void 
}) {
  useEffect(() => {
    // Auto-close após 5 segundos se não for crítica
    if (notificacao.prioridade !== 'critica') {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [notificacao.prioridade, onClose])

  return (
    <Card className="fixed top-4 right-4 w-80 shadow-lg border z-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <IconeNotificacao tipo={notificacao.tipo} />
          
          <div className="flex-1">
            <h4 className="text-sm font-medium">{notificacao.titulo}</h4>
            <p className="text-sm text-gray-600 mt-1">{notificacao.mensagem}</p>
            
            {notificacao.acoes && notificacao.acoes.length > 0 && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onAction}>
                  {notificacao.acoes[0].label}
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Dispensar
                </Button>
              </div>
            )}
          </div>
          
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Função auxiliar para usar no topo da aplicação
function IconeNotificacao({ tipo }: { tipo: string }) {
  const iconProps = { className: "w-4 h-4" }
  
  switch (tipo) {
    case 'info': return <Info {...iconProps} className="w-4 h-4 text-blue-500" />
    case 'alerta': return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-500" />
    case 'erro': return <XCircle {...iconProps} className="w-4 h-4 text-red-500" />
    case 'sucesso': return <CheckCircle {...iconProps} className="w-4 h-4 text-green-500" />
    default: return <Info {...iconProps} />
  }
} 