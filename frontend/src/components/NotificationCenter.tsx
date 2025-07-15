'use client'

import { useState, useEffect, useRef } from 'react'
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
  MousePointer,
  RefreshCw
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
  refreshInterval = 60000 // Aumentado para 60 segundos
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('todas')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  
  // Refs para evitar dependências circulares
  const hasInitializedRef = useRef(false)
  const pollingConfiguredRef = useRef(false)

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
  // INICIALIZAÇÃO (APENAS UMA VEZ)
  // =====================================================

  useEffect(() => {
    if (!hasInitializedRef.current) {
      console.log('🔄 NotificationCenter: Inicializando...')
      
      // Carregar notificações iniciais
      carregarNotificacoes({ apenas_nao_lidas: false, limit: 20 })
      
      hasInitializedRef.current = true
    }
  }, [carregarNotificacoes])

  // =====================================================
  // CONFIGURAR POLLING (SEPARADO DA INICIALIZAÇÃO)
  // =====================================================

  useEffect(() => {
    if (autoRefresh && !pollingConfiguredRef.current) {
      console.log('🔄 NotificationCenter: Configurando polling...')
      configurarPolling(refreshInterval)
      pollingConfiguredRef.current = true
    }

    return () => {
      if (pollingConfiguredRef.current) {
        console.log('🔄 NotificationCenter: Parando polling...')
        pararPolling()
        pollingConfiguredRef.current = false
      }
    }
  }, [autoRefresh, refreshInterval, configurarPolling, pararPolling])

  // =====================================================
  // SOLICITAR PERMISSÃO DE BROWSER (QUANDO ABRIR)
  // =====================================================

  useEffect(() => {
    if (isOpen && suportaBrowser && permissaoBrowser === 'default') {
      solicitarPermissaoBrowser()
    }
  }, [isOpen, suportaBrowser, permissaoBrowser, solicitarPermissaoBrowser])

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
        // Fechar popover antes de redirecionar
        setIsOpen(false)
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

  const handleRefresh = async () => {
    await carregarNotificacoes({ apenas_nao_lidas: false, limit: 20 })
  }

  const filtrarNotificacoes = (notificacoes: any[]) => {
    let filtradas = notificacoes

    // Filtrar por tab ativa
    switch (activeTab) {
      case 'nao_lidas':
        filtradas = filtradas.filter(n => ['pendente', 'enviada'].includes(n.status))
        break
      case 'checklists':
        filtradas = filtradas.filter(n => n.dados?.modulo === 'checklists')
        break
      case 'sistema':
        filtradas = filtradas.filter(n => ['metas', 'contaazul', 'relatorios', 'dashboard', 'sistema'].includes(n.dados?.modulo))
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
                  className="text-xs"
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
                <Clock className="w-3 h-3" />
                <span>{formatarTempo(notificacao.criada_em)}</span>
                {notificacao.dados?.modulo && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{notificacao.dados.modulo}</span>
                  </>
                )}
              </div>
              
              {temAcoes && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MousePointer className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-500">Clique para ação</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const EmptyState = () => (
    <div className="text-center py-8">
      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Nenhuma notificação encontrada
      </p>
    </div>
  )

  // =====================================================
  // RENDER
  // =====================================================

  const notificacoesFiltradas = filtrarNotificacoes(notificacoes)
  const naoLidas = estatisticas?.nao_lidas || 0

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${className}`}
        >
          {naoLidas > 0 ? (
            <BellRing className="w-5 h-5 text-blue-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
          
          {showUnreadCount && naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              
              <div className="flex items-center gap-2">
                {error && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={limparErro}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                
                {naoLidas > 0 && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={handleMarkAllRead}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {estatisticas && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {naoLidas} não lidas • {estatisticas.total_semana} esta semana
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-0">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="nao_lidas">
                  Não lidas
                  {naoLidas > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {naoLidas}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="checklists">Checklists</TabsTrigger>
                <TabsTrigger value="sistema">Sistema</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="m-0">
                <ScrollArea className="h-96">
                  {loading && notificacoesFiltradas.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Carregando notificações...</p>
                    </div>
                  ) : notificacoesFiltradas.length === 0 ? (
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
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/notifications')
                  }}
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
  const hasInitializedRef = useRef(false)
  const { carregarNotificacoes } = useNotifications()
  
  useEffect(() => {
    if (!hasInitializedRef.current) {
      carregarNotificacoes({ apenas_nao_lidas: true, limit: 5 })
      hasInitializedRef.current = true
    }
  }, [carregarNotificacoes])
  
  return (
    <NotificationCenter 
      className={className}
      showUnreadCount={true}
      autoRefresh={true}
      refreshInterval={120000} // 2 minutos para o bell
    />
  )
}

 