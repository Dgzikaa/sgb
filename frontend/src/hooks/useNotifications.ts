import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface Notificacao {
  id: string
  modulo: 'checklists' | 'metas' | 'contaazul' | 'relatorios' | 'dashboard' | 'sistema'
  tipo: 'info' | 'alerta' | 'erro' | 'sucesso'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  categoria?: string
  titulo: string
  mensagem: string
  dados_extras?: Record<string, any>
  acoes?: Array<{
    label: string
    action: 'redirect' | 'callback' | 'download'
    url?: string
    callback?: string
  }>
  canais: string[]
  status: 'pendente' | 'enviada' | 'lida' | 'descartada'
  usuario_id?: string
  role_alvo?: string
  referencia_tipo?: string
  referencia_id?: string
  criada_em: string
  lida_em?: string
  criada_por_usuario?: {
    nome: string
    email: string
  }
}

interface NovaNotificacao {
  modulo: 'checklists' | 'metas' | 'contaazul' | 'relatorios' | 'dashboard' | 'sistema'
  tipo: 'info' | 'alerta' | 'erro' | 'sucesso'
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica'
  categoria?: string
  titulo: string
  mensagem: string
  dados_extras?: Record<string, any>
  acoes?: Array<{
    label: string
    action: 'redirect' | 'callback' | 'download'
    url?: string
    callback?: string
  }>
  canais?: string[]
  usuario_id?: string
  role_alvo?: 'admin' | 'financeiro' | 'funcionario'
  enviar_em?: string
  referencia_tipo?: string
  referencia_id?: string
  chave_duplicacao?: string
}

interface NotificacaoTemplate {
  template_nome: string
  template_modulo: string
  template_categoria: string
  variaveis: Record<string, any>
  usuario_id?: string
  role_alvo?: 'admin' | 'financeiro' | 'funcionario'
  enviar_em?: string
}

interface FiltrosNotificacao {
  status?: 'pendente' | 'enviada' | 'lida' | 'descartada'
  modulo?: string
  tipo?: string
  prioridade?: string
  data_inicio?: string
  data_fim?: string
  usuario_id?: string
  apenas_nao_lidas?: boolean
  page?: number
  limit?: number
}

interface EstatisticasNotificacao {
  total_semana: number
  nao_lidas: number
  alta_prioridade: number
  por_tipo: Record<string, number>
  por_modulo: Record<string, number>
}

interface UseNotificationsResult {
  // Estados
  notificacoes: Notificacao[]
  notificacao: Notificacao | null
  loading: boolean
  creating: boolean
  updating: boolean
  error: string | null
  
  // Dados auxiliares
  estatisticas: EstatisticasNotificacao | null
  paginacao: any
  
  // Browser notifications
  permissaoBrowser: NotificationPermission | null
  suportaBrowser: boolean
  
  // Ações CRUD
  carregarNotificacoes: (filtros?: FiltrosNotificacao) => Promise<void>
  carregarNotificacao: (id: string) => Promise<void>
  criarNotificacao: (dados: NovaNotificacao) => Promise<boolean>
  criarNotificacaoTemplate: (dados: NotificacaoTemplate) => Promise<boolean>
  marcarComoLida: (id: string) => Promise<boolean>
  marcarTodasComoLidas: (modulo?: string) => Promise<boolean>
  excluirNotificacao: (id: string) => Promise<boolean>
  limparAntigas: (dias?: number) => Promise<boolean>
  
  // Browser notifications
  solicitarPermissaoBrowser: () => Promise<boolean>
  enviarBrowserNotification: (titulo: string, opcoes?: NotificationOptions) => void
  
  // Utilitários
  recarregar: () => Promise<void>
  limparErro: () => void
  configurarPolling: (intervalo?: number) => void
  pararPolling: () => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useNotifications(): UseNotificationsResult {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [notificacao, setNotificacao] = useState<Notificacao | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState<EstatisticasNotificacao | null>(null)
  const [paginacao, setPaginacao] = useState(null)
  const [filtrosAtuais, setFiltrosAtuais] = useState<FiltrosNotificacao>({})

  // Browser notifications
  const [permissaoBrowser, setPermissaoBrowser] = useState<NotificationPermission | null>(null)
  const [suportaBrowser, setSuportaBrowser] = useState(false)
  
  // Polling
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  useEffect(() => {
    // Verificar suporte a browser notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSuportaBrowser(true)
      setPermissaoBrowser(Notification.permission)
    }

    return () => {
      // Cleanup polling ao desmontar
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // =====================================================
  // AÇÕES CRUD
  // =====================================================

  const carregarNotificacoes = useCallback(async (filtros: FiltrosNotificacao = {}) => {
    try {
      setLoading(true)
      setError(null)
      setFiltrosAtuais(filtros)

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/api/notifications?${params.toString()}`)

      if (response.success) {
        setNotificacoes(response.data.notificacoes || [])
        setEstatisticas(response.data.estatisticas)
        setPaginacao(response.data.paginacao)
      } else {
        setError(response.error || 'Erro ao carregar notificações')
      }
    } catch (err: any) {
      console.error('Erro ao carregar notificações:', err)
      setError('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarNotificacao = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/api/notifications/${id}`)

      if (response.success) {
        setNotificacao(response.data)
      } else {
        setError(response.error || 'Erro ao carregar notificação')
      }
    } catch (err: any) {
      console.error('Erro ao carregar notificação:', err)
      setError('Erro ao carregar notificação')
    } finally {
      setLoading(false)
    }
  }, [])

  const criarNotificacao = useCallback(async (dados: NovaNotificacao): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)

      const response = await api.post('/api/notifications', dados)

      if (response.success) {
        console.log('📢 Notificação criada com sucesso!')
        
        // Enviar browser notification se permitido
        if (dados.canais?.includes('browser') && permissaoBrowser === 'granted') {
          enviarBrowserNotification(dados.titulo, {
            body: dados.mensagem,
            icon: getIconByType(dados.tipo),
            tag: response.data?.id,
            requireInteraction: dados.prioridade === 'critica'
          })
        }
        
        // Recarregar lista
        await carregarNotificacoes(filtrosAtuais)
        return true
      } else {
        setError(response.error || 'Erro ao criar notificação')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao criar notificação:', err)
      setError('Erro ao criar notificação')
      return false
    } finally {
      setCreating(false)
    }
  }, [carregarNotificacoes, filtrosAtuais, permissaoBrowser])

  const criarNotificacaoTemplate = useCallback(async (dados: NotificacaoTemplate): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)

      const response = await api.post('/api/notifications?modo=template', dados)

      if (response.success) {
        console.log('📢 Notificação criada via template!')
        await carregarNotificacoes(filtrosAtuais)
        return true
      } else {
        setError(response.error || 'Erro ao criar notificação via template')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao criar notificação via template:', err)
      setError('Erro ao criar notificação via template')
      return false
    } finally {
      setCreating(false)
    }
  }, [carregarNotificacoes, filtrosAtuais])

  const marcarComoLida = useCallback(async (id: string): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const response = await api.put(`/api/notifications/${id}`, {
        status: 'lida'
      })

      if (response.success) {
        // Atualizar na lista local
        setNotificacoes(prev => prev.map(n => 
          n.id === id ? { ...n, status: 'lida', lida_em: new Date().toISOString() } : n
        ))
        
        // Atualizar notificação individual se carregada
        if (notificacao?.id === id) {
          setNotificacao(prev => prev ? { ...prev, status: 'lida', lida_em: new Date().toISOString() } : null)
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao marcar como lida')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao marcar como lida:', err)
      setError('Erro ao marcar como lida')
      return false
    } finally {
      setUpdating(false)
    }
  }, [notificacao])

  const marcarTodasComoLidas = useCallback(async (modulo?: string): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const params = modulo ? `?action=mark_all_read&modulo=${modulo}` : '?action=mark_all_read'
      const response = await api.put(`/api/notifications/bulk${params}`)

      if (response.success) {
        console.log(`📱 ${response.count} notificações marcadas como lidas`)
        await carregarNotificacoes(filtrosAtuais)
        return true
      } else {
        setError(response.error || 'Erro ao marcar todas como lidas')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao marcar todas como lidas:', err)
      setError('Erro ao marcar todas como lidas')
      return false
    } finally {
      setUpdating(false)
    }
  }, [carregarNotificacoes, filtrosAtuais])

  const excluirNotificacao = useCallback(async (id: string): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const response = await api.delete(`/api/notifications/${id}`)

      if (response.success) {
        // Remover da lista local
        setNotificacoes(prev => prev.filter(n => n.id !== id))
        
        // Limpar notificação individual se era a atual
        if (notificacao?.id === id) {
          setNotificacao(null)
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao excluir notificação')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao excluir notificação:', err)
      setError('Erro ao excluir notificação')
      return false
    } finally {
      setUpdating(false)
    }
  }, [notificacao])

  const limparAntigas = useCallback(async (dias: number = 7): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const response = await api.put(`/api/notifications/bulk?action=clear_old&dias=${dias}`)

      if (response.success) {
        console.log(`🧹 ${response.count} notificações antigas removidas`)
        await carregarNotificacoes(filtrosAtuais)
        return true
      } else {
        setError(response.error || 'Erro ao limpar notificações antigas')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao limpar notificações antigas:', err)
      setError('Erro ao limpar notificações antigas')
      return false
    } finally {
      setUpdating(false)
    }
  }, [carregarNotificacoes, filtrosAtuais])

  // =====================================================
  // BROWSER NOTIFICATIONS
  // =====================================================

  const solicitarPermissaoBrowser = useCallback(async (): Promise<boolean> => {
    if (!suportaBrowser) {
      console.warn('Browser não suporta notificações')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissaoBrowser(permission)
      
      if (permission === 'granted') {
        console.log('✅ Permissão para notificações concedida')
        return true
      } else {
        console.log('❌ Permissão para notificações negada')
        return false
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }, [suportaBrowser])

  const enviarBrowserNotification = useCallback((titulo: string, opcoes?: NotificationOptions) => {
    if (!suportaBrowser || permissaoBrowser !== 'granted') {
      console.warn('Não é possível enviar notificação browser')
      return
    }

    try {
      const notification = new Notification(titulo, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...opcoes
      })

      // Auto-close após 5 segundos se não for crítica
      if (!opcoes?.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Eventos
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Se tem tag (ID da notificação), marcar como lida
        if (opcoes?.tag) {
          marcarComoLida(opcoes.tag)
        }
      }

    } catch (error) {
      console.error('Erro ao enviar notificação browser:', error)
    }
  }, [suportaBrowser, permissaoBrowser, marcarComoLida])

  // =====================================================
  // POLLING E UTILITÁRIOS
  // =====================================================

  const configurarPolling = useCallback((intervalo: number = 30000) => {
    // Parar polling anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Configurar novo polling
    intervalRef.current = setInterval(() => {
      carregarNotificacoes({ ...filtrosAtuais, apenas_nao_lidas: true })
    }, intervalo)

    console.log(`🔄 Polling de notificações configurado: ${intervalo}ms`)
  }, [carregarNotificacoes, filtrosAtuais])

  const pararPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      console.log('⏹️ Polling de notificações parado')
    }
  }, [])

  const recarregar = useCallback(async () => {
    await carregarNotificacoes(filtrosAtuais)
  }, [carregarNotificacoes, filtrosAtuais])

  const limparErro = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Estados
    notificacoes,
    notificacao,
    loading,
    creating,
    updating,
    error,
    
    // Dados auxiliares
    estatisticas,
    paginacao,
    
    // Browser notifications
    permissaoBrowser,
    suportaBrowser,
    
    // Ações CRUD
    carregarNotificacoes,
    carregarNotificacao,
    criarNotificacao,
    criarNotificacaoTemplate,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    limparAntigas,
    
    // Browser notifications
    solicitarPermissaoBrowser,
    enviarBrowserNotification,
    
    // Utilitários
    recarregar,
    limparErro,
    configurarPolling,
    pararPolling
  }
}

// =====================================================
// HOOKS AUXILIARES
// =====================================================

export function useNotificationSettings() {
  const [configuracoes, setConfiguracoes] = useState({
    ativo: true,
    browser: true,
    whatsapp: false,
    email: false,
    horario_inicio: '08:00',
    horario_fim: '22:00',
    por_modulo: {
      checklists: { ativo: true, tipos: ['alerta', 'info'] },
      metas: { ativo: true, tipos: ['info'] },
      contaazul: { ativo: true, tipos: ['erro'] }
    }
  })

  const atualizarConfiguracao = useCallback((campo: string, valor: any) => {
    setConfiguracoes(prev => ({ ...prev, [campo]: valor }))
  }, [])

  const salvarConfiguracoes = useCallback(async () => {
    // TODO: Implementar API para salvar preferências
    console.log('💾 Configurações salvas:', configuracoes)
    return true
  }, [configuracoes])

  return {
    configuracoes,
    atualizarConfiguracao,
    salvarConfiguracoes
  }
}

// =====================================================
// UTILITÁRIOS
// =====================================================

export function getIconByType(tipo: string): string {
  const icons: Record<string, string> = {
    'info': '/icons/info.png',
    'alerta': '/icons/warning.png',
    'erro': '/icons/error.png',
    'sucesso': '/icons/success.png'
  }
  return icons[tipo] || '/favicon.ico'
}

export function getColorByType(tipo: string): string {
  const colors: Record<string, string> = {
    'info': 'blue',
    'alerta': 'yellow',
    'erro': 'red',
    'sucesso': 'green'
  }
  return colors[tipo] || 'gray'
}

export function getColorByPriority(prioridade: string): string {
  const colors: Record<string, string> = {
    'baixa': 'gray',
    'media': 'blue',
    'alta': 'orange',
    'critica': 'red'
  }
  return colors[prioridade] || 'gray'
}

export function formatarTempo(dataString: string): string {
  const data = new Date(dataString)
  const agora = new Date()
  const diff = agora.getTime() - data.getTime()
  
  const minutos = Math.floor(diff / (1000 * 60))
  const horas = Math.floor(diff / (1000 * 60 * 60))
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `${minutos}min`
  if (horas < 24) return `${horas}h`
  if (dias < 7) return `${dias}d`
  
  return data.toLocaleDateString('pt-BR')
}

// =====================================================
// FUNÇÕES ESPECÍFICAS PARA CHECKLISTS
// =====================================================

export async function criarNotificacaoChecklist(
  categoria: 'lembrete' | 'atraso' | 'conclusao' | 'performance',
  variaveis: Record<string, any>,
  usuarioId?: string,
  roleAlvo?: string
) {
  try {
    const response = await api.post('/api/notifications?modo=template', {
      template_nome: getTemplateNameByCategory(categoria),
      template_modulo: 'checklists',
      template_categoria: categoria,
      variaveis,
      usuario_id: usuarioId,
      role_alvo: roleAlvo
    })

    if (response.success) {
      console.log(`📋 Notificação de checklist criada: ${categoria}`)
      return response.notificacao_id
    }

    return null
  } catch (error) {
    console.error('Erro ao criar notificação de checklist:', error)
    return null
  }
}

function getTemplateNameByCategory(categoria: string): string {
  const templates: Record<string, string> = {
    'lembrete': 'lembrete_agendamento',
    'atraso': 'checklist_atrasado',
    'conclusao': 'checklist_concluido',
    'performance': 'baixa_performance'
  }
  
  return templates[categoria] || 'lembrete_agendamento'
} 