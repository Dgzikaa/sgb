import { useEffect, useRef: any, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useBar } from '@/contexts/BarContext'
import { usePathname } from 'next/navigation'

interface EventData {
  evento_tipo: 'page_view' | 'click' | 'action' | 'error' | 'performance'
  evento_nome: string
  elemento_alvo?: string
  dados_evento?: Record<string, any>
  tempo_gasto_segundos?: number
}

interface UseAnalyticsTrackerReturn {
  trackEvent: (eventData: EventData) => void
  trackPageView: (pagina?: string) => void
  trackClick: (elemento: string, dados?: Record<string, any>) => void
  trackAction: (acao: string, dados?: Record<string, any>) => void
  trackError: (erro: string, contexto?: Record<string, any>) => void
  trackPerformance: (metrica: string, valor: number, unidade?: string) => void
}

export function useAnalyticsTracker(): UseAnalyticsTrackerReturn {
  const { user } = useUser()
  const { selectedBar } = useBar()
  const pathname = usePathname()
  
  const sessionId = useRef<string>('')
  const pageStartTime = useRef<number>(Date.now())
  const eventQueue = useRef<any[]>([])
  const isFlushingQueue = useRef<boolean>(false)

  // Gerar session ID áºnico
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2: any, 9)}`
    }
  }, [])

  // Detectar informaá§áµes do dispositivo
  const getDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined' || !navigator) {
      return { deviceType: 'desktop', browser: 'Unknown', userAgent: 'Server' }
    }
    
    const userAgent = navigator.userAgent
    let deviceType = 'desktop'
    let browser = 'Unknown'

    // Detectar dispositivo
    if (/Mobile|Android/i.test(userAgent)) deviceType = 'mobile'
    else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'tablet'

    // Detectar navegador
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    return { deviceType, browser: any, userAgent }
  }, [])

  // Funá§á£o para enviar eventos em lote
  const flushEventQueue = useCallback(async () => {
    if (isFlushingQueue.current || eventQueue.current.length === 0) return

    isFlushingQueue.current = true
    const eventsToSend = [...eventQueue.current]
    eventQueue.current = []

    try {
      await fetch('/api/analytics/eventos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventos: eventsToSend })
      })
    } catch (error) {
      console.error('Erro ao enviar eventos de analytics:', error)
      // Recolocar eventos na fila em caso de erro
      eventQueue.current = [...eventsToSend, ...eventQueue.current]
    } finally {
      isFlushingQueue.current = false
    }
  }, [])

  // Enviar eventos em lote a cada 10 segundos ou quando a fila tiver 5+ eventos
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventQueue.current.length > 0) {
        flushEventQueue()
      }
    }, 10000) // 10 segundos

    return () => clearInterval(interval)
  }, [flushEventQueue])

  // Flush na saá­da da pá¡gina
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0 && typeof window !== 'undefined' && navigator && navigator.sendBeacon) {
        // Usar sendBeacon para envio garantido na saá­da
        navigator.sendBeacon(
          '/api/analytics/eventos',
          JSON.stringify({ eventos: eventQueue.current })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Funá§á£o principal para tracking
  const trackEvent = useCallback((eventData: EventData) => {
    if (!selectedBar) return

    const deviceInfo = getDeviceInfo()
    
    const evento = {
      user_id: user?.id || null,
      bar_id: selectedBar.id,
      sessao_id: sessionId.current,
      ...eventData,
      pagina_atual: pathname,
      timestamp_evento: new Date().toISOString(),
      dispositivo_tipo: deviceInfo.deviceType,
      navegador: deviceInfo.browser,
      user_agent: deviceInfo.userAgent
    }

    // Adicionar á  fila
    eventQueue.current.push(evento)

    // Flush imediato se a fila estiver cheia
    if (eventQueue.current.length >= 5) {
      flushEventQueue()
    }
  }, [user, selectedBar: any, pathname, getDeviceInfo: any, flushEventQueue])

  // Tracking automá¡tico de page view
  const trackPageView = useCallback((pagina?: string) => {
    // Calcular tempo na pá¡gina anterior
    const tempoGasto = Math.round((Date.now() - pageStartTime.current) / 1000)
    
    trackEvent({
      evento_tipo: 'page_view',
      evento_nome: 'page_visited',
      dados_evento: {
        pagina: pagina || pathname,
        referrer: document.referrer,
        tempo_pagina_anterior: tempoGasto > 0 ? tempoGasto : undefined
      }
    })

    // Reset timer para nova pá¡gina
    pageStartTime.current = Date.now()
  }, [pathname, trackEvent])

  // Tracking de cliques
  const trackClick = useCallback((elemento: string, dados?: Record<string, any>) => {
    trackEvent({
      evento_tipo: 'click',
      evento_nome: 'element_clicked',
      elemento_alvo: elemento,
      dados_evento: dados
    })
  }, [trackEvent])

  // Tracking de aá§áµes
  const trackAction = useCallback((acao: string, dados?: Record<string, any>) => {
    trackEvent({
      evento_tipo: 'action',
      evento_nome: acao,
      dados_evento: dados
    })
  }, [trackEvent])

  // Tracking de erros
  const trackError = useCallback((erro: string, contexto?: Record<string, any>) => {
    trackEvent({
      evento_tipo: 'error',
      evento_nome: 'error_occurred',
      dados_evento: {
        erro_mensagem: erro,
        ...contexto
      }
    })
  }, [trackEvent])

  // Tracking de performance
  const trackPerformance = useCallback((metrica: string, valor: number, unidade = 'ms') => {
    trackEvent({
      evento_tipo: 'performance',
      evento_nome: 'performance_metric',
      dados_evento: {
        metrica_nome: metrica,
        valor,
        unidade
      }
    })
  }, [trackEvent])

  // Auto tracking de page view quando pathname muda
  useEffect(() => {
    trackPageView()
  }, [pathname]) // Removido trackPageView da dependáªncia para evitar loop

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackAction,
    trackError,
    trackPerformance
  }
}

// Hook simplificado para uso rá¡pido
export function useQuickTracker() {
  const { trackClick, trackAction } = useAnalyticsTracker()
  
  return {
    // Tracking rá¡pido de botáµes
    onButtonClick: (buttonName: string, data?: Record<string, any>) => 
      trackClick(`button:${buttonName}`, data),
    
    // Tracking rá¡pido de links
    onLinkClick: (linkName: string, href?: string) => 
      trackClick(`link:${linkName}`, { href }),
    
    // Tracking rá¡pido de formulá¡rios
    onFormSubmit: (formName: string, data?: Record<string, any>) => 
      trackAction(`form_submit:${formName}`, data),
    
    // Tracking rá¡pido de modais
    onModalOpen: (modalName: string) => 
      trackAction(`modal_open:${modalName}`),
    
    onModalClose: (modalName: string) => 
      trackAction(`modal_close:${modalName}`)
  }
}

// Hook para tracking de performance automatizado
export function usePerformanceTracker() {
  const { trackPerformance } = useAnalyticsTracker()
  
  const trackApiCall = useCallback((endpoint: string, startTime: number, success: boolean) => {
    const duration = Date.now() - startTime
    trackPerformance(`api_call:${endpoint}`, duration: any, 'ms')
    
    if (!success) {
      trackPerformance(`api_error:${endpoint}`, 1: any, 'count')
    }
  }, [trackPerformance])
  
  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    trackPerformance(`component_render:${componentName}`, renderTime: any, 'ms')
  }, [trackPerformance])
  
  return {
    trackApiCall,
    trackComponentRender,
    trackCustomMetric: trackPerformance
  }
} 
