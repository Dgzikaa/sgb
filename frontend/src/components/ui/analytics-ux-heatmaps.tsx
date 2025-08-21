'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Eye, 
  Clock, 
  Target, 
  Zap,
  Play,
  Pause,
  Download,
  Upload,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Activity,
  Heatmap,
  Map,
  Layers,
  PieChart,
  LineChart,
  AreaChart,
  Scatter,
  Calendar,
  User,
  Users2,
  Mouse,
  Touch,
  Keyboard,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Flag,
  Star,
  Heart,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Plus,
  Minus,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Tipos para analytics
interface UserEvent {
  id: string;
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'navigation' | 'error' | 'performance';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  page: string;
  element: {
    tag: string;
    id?: string;
    className?: string;
    text?: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  metadata: {
    viewport: { width: number; height: number };
    userAgent: string;
    referrer?: string;
    duration?: number;
    value?: string;
    error?: string;
  };
}

interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  pageViews: string[];
  events: UserEvent[];
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    screen: { width: number; height: number };
  };
  location: {
    country?: string;
    city?: string;
    timezone: string;
  };
  performance: {
    loadTime: number;
    firstPaint: number;
    domReady: number;
  };
}

interface HeatmapData {
  page: string;
  clicks: Array<{ x: number; y: number; intensity: number }>;
  hovers: Array<{ x: number; y: number; intensity: number }>;
  scrollDepth: Array<{ y: number; users: number }>;
  elementEngagement: Array<{
    selector: string;
    clicks: number;
    hovers: number;
    timeSpent: number;
  }>;
}

interface AnalyticsMetrics {
  // Métricas de usuário
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  
  // Métricas de sessão
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  
  // Métricas de página
  pageViews: number;
  uniquePageViews: number;
  averageTimeOnPage: number;
  exitRate: number;
  
  // Métricas de engajamento
  clickThroughRate: number;
  scrollDepth: number;
  formCompletionRate: number;
  conversionRate: number;
  
  // Métricas de performance
  averageLoadTime: number;
  errorRate: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

interface AnalyticsUXProps {
  className?: string;
  autoTrack?: boolean;
  showHeatmaps?: boolean;
  showMetrics?: boolean;
  showSessions?: boolean;
  onEventTracked?: (event: UserEvent) => void;
  onSessionStart?: (session: UserSession) => void;
  onSessionEnd?: (session: UserSession) => void;
}

// Hook para analytics
export const useAnalytics = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);

  // Iniciar sessão
  const startSession = useCallback(() => {
    const session: UserSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      pageViews: [window.location.pathname],
      events: [],
      device: {
        type: getDeviceType(),
        os: getOS(),
        browser: getBrowser(),
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      },
      location: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      performance: {
        loadTime: performance.now(),
        firstPaint: 0,
        domReady: 0
      }
    };

    setCurrentSession(session);
    setSessions(prev => [...prev, session]);
    setIsTracking(true);

    return session;
  }, []);

  // Finalizar sessão
  const endSession = useCallback(() => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSession.id ? updatedSession : s
      ));

      setCurrentSession(null);
      setIsTracking(false);
    }
  }, [currentSession]);

  // Rastrear evento
  const trackEvent = useCallback((event: Omit<UserEvent, 'id' | 'timestamp' | 'sessionId'>) => {
    if (!currentSession) return;

    const newEvent: UserEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: currentSession.id
    };

    setEvents(prev => [...prev, newEvent]);
    setCurrentSession(prev => prev ? {
      ...prev,
      events: [...prev.events, newEvent]
    } : null);
  }, [currentSession]);

  // Rastrear clique
  const trackClick = useCallback((element: HTMLElement, position: { x: number; y: number }) => {
    trackEvent({
      type: 'click',
      page: window.location.pathname,
      element: {
        tag: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        text: element.textContent?.slice(0, 100) || undefined,
        position,
        size: {
          width: element.offsetWidth,
          height: element.offsetHeight
        }
      },
      metadata: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    });
  }, [trackEvent]);

  // Rastrear scroll
  const trackScroll = useCallback((depth: number) => {
    trackEvent({
      type: 'scroll',
      page: window.location.pathname,
      element: {
        tag: 'body',
        position: { x: 0, y: depth },
        size: { width: 0, height: 0 }
      },
      metadata: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent
      }
    });
  }, [trackEvent]);

  // Rastrear hover
  const trackHover = useCallback((element: HTMLElement, duration: number) => {
    trackEvent({
      type: 'hover',
      page: window.location.pathname,
      element: {
        tag: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        text: element.textContent?.slice(0, 100) || undefined,
        position: { x: 0, y: 0 },
        size: {
          width: element.offsetWidth,
          height: element.offsetHeight
        }
      },
      metadata: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent,
        duration
      }
    });
  }, [trackEvent]);

  // Calcular métricas
  const calculateMetrics = useCallback(() => {
    if (sessions.length === 0) return;

    const totalUsers = new Set(sessions.map(s => s.userId).filter(Boolean)).size;
    const totalSessions = sessions.length;
    const totalEvents = events.length;
    
    const averageSessionDuration = sessions.reduce((acc, session) => {
      if (session.endTime) {
        return acc + (session.endTime.getTime() - session.startTime.getTime());
      }
      return acc;
    }, 0) / sessions.filter(s => s.endTime).length;

    const bounceRate = sessions.filter(s => s.pageViews.length === 1).length / totalSessions * 100;
    const pagesPerSession = sessions.reduce((acc, session) => acc + session.pageViews.length, 0) / totalSessions;

    const metrics: AnalyticsMetrics = {
      totalUsers,
      activeUsers: sessions.filter(s => !s.endTime).length,
      newUsers: totalUsers,
      returningUsers: 0,
      totalSessions,
      averageSessionDuration,
      bounceRate,
      pagesPerSession,
      pageViews: sessions.reduce((acc, session) => acc + session.pageViews.length, 0),
      uniquePageViews: new Set(sessions.flatMap(s => s.pageViews)).size,
      averageTimeOnPage: averageSessionDuration / pagesPerSession,
      exitRate: 100 - bounceRate,
      clickThroughRate: events.filter(e => e.type === 'click').length / totalEvents * 100,
      scrollDepth: events.filter(e => e.type === 'scroll').reduce((acc, event) => {
        const depth = event.element.position.y;
        return Math.max(acc, depth);
      }, 0),
      formCompletionRate: 0, // Implementar lógica específica
      conversionRate: 0, // Implementar lógica específica
      averageLoadTime: sessions.reduce((acc, session) => acc + session.performance.loadTime, 0) / totalSessions,
      errorRate: events.filter(e => e.type === 'error').length / totalEvents * 100,
      coreWebVitals: {
        lcp: 0, // Implementar medição real
        fid: 0, // Implementar medição real
        cls: 0  // Implementar medição real
      }
    };

    setMetrics(metrics);
  }, [sessions, events]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    sessions,
    currentSession,
    events,
    isTracking,
    metrics,
    startSession,
    endSession,
    trackEvent,
    trackClick,
    trackScroll,
    trackHover
  };
};

// Hook para heatmaps
export const useHeatmaps = (events: UserEvent[]) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [activePage, setActivePage] = useState<string>('');

  // Gerar dados de heatmap
  const generateHeatmapData = useCallback((page: string) => {
    const pageEvents = events.filter(e => e.page === page);
    
    const clicks = pageEvents
      .filter(e => e.type === 'click')
      .map(e => ({
        x: e.element.position.x,
        y: e.element.position.y,
        intensity: 1
      }));

    const hovers = pageEvents
      .filter(e => e.type === 'hover')
      .map(e => ({
        x: e.element.position.x,
        y: e.element.position.y,
        intensity: e.metadata.duration || 1
      }));

    const scrollDepth = pageEvents
      .filter(e => e.type === 'scroll')
      .reduce((acc, event) => {
        const depth = Math.floor(event.element.position.y / 100) * 100;
        const existing = acc.find(item => item.y === depth);
        if (existing) {
          existing.users++;
        } else {
          acc.push({ y: depth, users: 1 });
        }
        return acc;
      }, [] as Array<{ y: number; users: number }>);

    const elementEngagement = pageEvents.reduce((acc, event) => {
      const selector = event.element.id || event.element.className || event.element.tag;
      const existing = acc.find(item => item.selector === selector);
      
      if (existing) {
        existing.clicks += event.type === 'click' ? 1 : 0;
        existing.hovers += event.type === 'hover' ? 1 : 0;
        existing.timeSpent += event.metadata.duration || 0;
      } else {
        acc.push({
          selector,
          clicks: event.type === 'click' ? 1 : 0,
          hovers: event.type === 'hover' ? 1 : 0,
          timeSpent: event.metadata.duration || 0
        });
      }
      
      return acc;
    }, [] as Array<{ selector: string; clicks: number; hovers: number; timeSpent: number }>);

    return {
      page,
      clicks,
      hovers,
      scrollDepth,
      elementEngagement
    };
  }, [events]);

  // Atualizar heatmap quando página mudar
  useEffect(() => {
    if (activePage) {
      const data = generateHeatmapData(activePage);
      setHeatmapData(prev => {
        const filtered = prev.filter(d => d.page !== activePage);
        return [...filtered, data];
      });
    }
  }, [activePage, generateHeatmapData]);

  return {
    heatmapData,
    activePage,
    setActivePage,
    generateHeatmapData
  };
};

// Componente de heatmap visual
const HeatmapVisualization: React.FC<{ data: HeatmapData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showClicks, setShowClicks] = useState(true);
  const [showHovers, setShowHovers] = useState(true);

  // Renderizar heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurar canvas
    canvas.width = window.innerWidth * zoom;
    canvas.height = window.innerHeight * zoom;

    // Renderizar cliques
    if (showClicks) {
      data.clicks.forEach(click => {
        const gradient = ctx.createRadialGradient(
          click.x * zoom, click.y * zoom, 0,
          click.x * zoom, click.y * zoom, 50 * zoom
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          click.x * zoom - 25 * zoom,
          click.y * zoom - 25 * zoom,
          50 * zoom,
          50 * zoom
        );
      });
    }

    // Renderizar hovers
    if (showHovers) {
      data.hovers.forEach(hover => {
        const alpha = Math.min(hover.intensity / 1000, 0.6);
        const gradient = ctx.createRadialGradient(
          hover.x * zoom, hover.y * zoom, 0,
          hover.x * zoom, hover.y * zoom, 30 * zoom
        );
        gradient.addColorStop(0, `rgba(0, 255, 0, ${alpha})`);
        gradient.addColorStop(1, `rgba(0, 255, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          hover.x * zoom - 15 * zoom,
          hover.y * zoom - 15 * zoom,
          30 * zoom,
          30 * zoom
        );
      });
    }
  }, [data, zoom, showClicks, showHovers]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Controles */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg z-20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showClicks}
              onChange={(e) => setShowClicks(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Cliques</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showHovers}
              onChange={(e) => setShowHovers(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Hovers</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal de analytics UX
export const AnalyticsUX: React.FC<AnalyticsUXProps> = ({
  className = '',
  autoTrack = true,
  showHeatmaps = true,
  showMetrics = true,
  showSessions = true,
  onEventTracked,
  onSessionStart,
  onSessionEnd
}) => {
  const {
    sessions,
    currentSession,
    events,
    isTracking,
    metrics,
    startSession,
    endSession,
    trackClick,
    trackScroll,
    trackHover
  } = useAnalytics();

  const { heatmapData, activePage, setActivePage } = useHeatmaps(events);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmaps' | 'sessions' | 'events'>('overview');
  const [selectedPage, setSelectedPage] = useState<string>('');

  // Inicializar tracking automático
  useEffect(() => {
    if (autoTrack && !isTracking) {
      const session = startSession();
      if (onSessionStart) onSessionStart(session);
    }

    return () => {
      if (isTracking) {
        endSession();
        if (onSessionEnd && currentSession) onSessionEnd(currentSession);
      }
    };
  }, [autoTrack, isTracking, startSession, endSession, onSessionStart, onSessionEnd, currentSession]);

  // Configurar event listeners
  useEffect(() => {
    if (!isTracking) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackClick(target, { x: e.clientX, y: e.clientY });
      if (onEventTracked) {
        // Criar evento para callback
        const event: UserEvent = {
          id: '',
          type: 'click',
          timestamp: new Date(),
          sessionId: currentSession?.id || '',
          page: window.location.pathname,
          element: {
            tag: target.tagName.toLowerCase(),
            id: target.id || undefined,
            className: target.className || undefined,
            text: target.textContent?.slice(0, 100) || undefined,
            position: { x: e.clientX, y: e.clientY },
            size: { width: target.offsetWidth, height: target.offsetHeight }
          },
          metadata: {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        };
        onEventTracked(event);
      }
    };

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = (scrollTop / maxScroll) * 100;
      trackScroll(scrollDepth);
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isTracking, trackClick, trackScroll, currentSession, onEventTracked]);

  // Páginas únicas
  const uniquePages = useMemo(() => {
    return Array.from(new Set(sessions.flatMap(s => s.pageViews)));
  }, [sessions]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics UX & Heatmaps
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitore comportamento do usuário e gere insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isTracking ? 'Rastreando' : 'Parado'}</span>
          </div>
          
          <Button
            onClick={isTracking ? endSession : startSession}
            variant={isTracking ? "outline" : "default"}
            size="sm"
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'heatmaps', label: 'Heatmaps', icon: Heatmap },
            { id: 'sessions', label: 'Sessões', icon: Users },
            { id: 'events', label: 'Eventos', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && showMetrics && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {metrics && (
              <>
                {/* Métricas principais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.totalUsers}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Usuários Totais
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.totalSessions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sessões
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MousePointer className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.pageViews}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Visualizações
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Conversão
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Métricas detalhadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Engajamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Rejeição</span>
                        <span className="font-medium">{metrics.bounceRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={100 - metrics.bounceRate} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Páginas por Sessão</span>
                        <span className="font-medium">{metrics.pagesPerSession.toFixed(1)}</span>
                      </div>
                      <Progress value={Math.min(metrics.pagesPerSession / 5 * 100, 100)} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tempo na Página</span>
                        <span className="font-medium">{Math.round(metrics.averageTimeOnPage / 1000)}s</span>
                      </div>
                      <Progress value={Math.min(metrics.averageTimeOnPage / 30000 * 100, 100)} className="h-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tempo de Carregamento</span>
                        <span className="font-medium">{Math.round(metrics.averageLoadTime)}ms</span>
                      </div>
                      <Progress value={Math.max(0, 100 - metrics.averageLoadTime / 100)} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Erro</span>
                        <span className="font-medium">{metrics.errorRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={100 - metrics.errorRate} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Profundidade de Scroll</span>
                        <span className="font-medium">{Math.round(metrics.scrollDepth)}%</span>
                      </div>
                      <Progress value={metrics.scrollDepth} className="h-2" />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'heatmaps' && showHeatmaps && (
          <motion.div
            key="heatmaps"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Seletor de página */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Página:
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione uma página</option>
                {uniquePages.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </div>

            {/* Visualização do heatmap */}
            {selectedPage && (
              <Card className="relative h-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heatmap className="w-5 h-5 text-red-500" />
                    Heatmap - {selectedPage}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <HeatmapVisualization 
                    data={heatmapData.find(d => d.page === selectedPage) || {
                      page: selectedPage,
                      clicks: [],
                      hovers: [],
                      scrollDepth: [],
                      elementEngagement: []
                    }} 
                  />
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'sessions' && showSessions && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Sessão {session.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {session.startTime.toLocaleString('pt-BR')} - 
                          {session.endTime ? session.endTime.toLocaleString('pt-BR') : 'Ativa'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.device.type} • {session.device.browser} • {session.pageViews.length} páginas
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.events.length} eventos
                        </div>
                        {session.endTime && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)}s
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {events.slice(-20).reverse().map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          event.type === 'click' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          event.type === 'scroll' ? 'bg-green-100 dark:bg-green-900/20' :
                          event.type === 'hover' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          'bg-gray-100 dark:bg-gray-900/20'
                        }`}>
                          {event.type === 'click' && <MousePointer className="w-4 h-4 text-blue-500" />}
                          {event.type === 'scroll' && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {event.type === 'hover' && <Eye className="w-4 h-4 text-purple-500" />}
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white capitalize">
                            {event.type}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {event.element.tag} {event.element.id ? `#${event.element.id}` : ''}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {event.page} • {event.timestamp.toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        {event.element.position.x}, {event.element.position.y}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Funções auxiliares
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getOS(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getBrowser(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// Componente de exemplo
export const AnalyticsUXExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Analytics UX & Heatmaps
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Sistema avançado de analytics com tracking de comportamento, 
            heatmaps e métricas de engajamento
          </p>
        </div>
        
        <AnalyticsUX
          autoTrack={true}
          showHeatmaps={true}
          showMetrics={true}
          showSessions={true}
          onEventTracked={(event) => {
            console.log('Event tracked:', event);
          }}
          onSessionStart={(session) => {
            console.log('Session started:', session);
          }}
          onSessionEnd={(session) => {
            console.log('Session ended:', session);
          }}
        />
      </div>
    </div>
  );
};

export default AnalyticsUXExample;
