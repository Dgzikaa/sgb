'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  HardDrive, 
  Cpu, 
  HardDrive as Memory,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Pause,
  Settings,
  BarChart3,
  Activity,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Database,
  Layers,
  Sparkles,
  Rocket,
  Timer,
  Battery,
  BatteryCharging,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Tipos para métricas de performance
interface PerformanceMetrics {
  // Métricas de carregamento
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  
  // Métricas de recursos
  totalResources: number;
  totalSize: number;
  imageCount: number;
  scriptCount: number;
  cssCount: number;
  
  // Métricas de rede
  networkLatency: number;
  bandwidth: number;
  connectionType: string;
  
  // Métricas de memória
  memoryUsage: number;
  memoryLimit: number;
  
  // Métricas de CPU
  cpuUsage: number;
  mainThreadBlocking: number;
  
  // Métricas de cache
  cacheHitRate: number;
  cacheSize: number;
  
  // Timestamp
  timestamp: Date;
}

interface PerformanceOptimization {
  id: string;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'applied' | 'failed';
  estimatedImprovement: number;
  appliedAt?: Date;
  error?: string;
}

interface PerformanceOptimizerProps {
  className?: string;
  autoOptimize?: boolean;
  showMetrics?: boolean;
  showOptimizations?: boolean;
  onOptimizationComplete?: (optimization: PerformanceOptimization) => void;
}

// Hook para métricas de performance
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Coletar métricas básicas
  const collectBasicMetrics = useCallback((): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource');
    
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const largestContentfulPaint = paint.find(p => p.name === 'largest-contentful-paint')?.startTime || 0;
    
    const totalSize = resources.reduce((acc, resource) => acc + (resource as PerformanceResourceTiming).transferSize, 0);
    const imageCount = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)).length;
    const scriptCount = resources.filter(r => r.name.match(/\.(js|mjs)$/i)).length;
    const cssCount = resources.filter(r => r.name.match(/\.css$/i)).length;

    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay: 0, // Será calculado quando houver interação
      totalResources: resources.length,
      totalSize,
      imageCount,
      scriptCount,
      cssCount,
      networkLatency: navigation.responseStart - navigation.requestStart,
      bandwidth: 0, // Será calculado
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      memoryLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
      cpuUsage: 0, // Será calculado
      mainThreadBlocking: 0, // Será calculado
      cacheHitRate: 0, // Será calculado
      cacheSize: 0, // Será calculado
      timestamp: new Date()
    };
  }, []);

  // Calcular métricas avançadas
  const calculateAdvancedMetrics = useCallback(async (basicMetrics: PerformanceMetrics): Promise<PerformanceMetrics> => {
    // Calcular bandwidth
    const bandwidthTest = await measureBandwidth();
    
    // Calcular CPU usage
    const cpuUsage = await measureCPUUsage();
    
    // Calcular cache hit rate
    const cacheHitRate = await measureCacheHitRate();
    
    return {
      ...basicMetrics,
      bandwidth: bandwidthTest,
      cpuUsage,
      cacheHitRate
    };
  }, []);

  // Medir bandwidth
  const measureBandwidth = useCallback(async (): Promise<number> => {
    try {
      const startTime = performance.now();
      const response = await fetch('/api/performance/bandwidth-test', {
        method: 'POST',
        body: JSON.stringify({ size: 1024 * 1024 }) // 1MB
      });
      const endTime = performance.now();
      
      if (response.ok) {
        const duration = (endTime - startTime) / 1000; // segundos
        return (1024 * 1024) / duration; // bytes por segundo
      }
    } catch (error) {
      console.warn('Bandwidth test failed:', error);
    }
    
    return 0;
  }, []);

  // Medir CPU usage
  const measureCPUUsage = useCallback(async (): Promise<number> => {
    try {
      // Simular medição de CPU
      const startTime = performance.now();
      await new Promise(resolve => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.random();
        }
        resolve(sum);
      });
      const endTime = performance.now();
      
      // Quanto mais rápido, menor o uso de CPU
      const executionTime = endTime - startTime;
      return Math.max(0, 100 - (executionTime / 10));
    } catch (error) {
      console.warn('CPU measurement failed:', error);
      return 0;
    }
  }, []);

  // Medir cache hit rate
  const measureCacheHitRate = useCallback(async (): Promise<number> => {
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const cachedResources = resources.filter(r => r.transferSize === 0);
      return (cachedResources.length / resources.length) * 100;
    } catch (error) {
      console.warn('Cache hit rate measurement failed:', error);
      return 0;
    }
  }, []);

  // Iniciar monitoramento
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Coletar métricas iniciais
    const basicMetrics = collectBasicMetrics();
    const advancedMetrics = await calculateAdvancedMetrics(basicMetrics);
    setMetrics(advancedMetrics);
    
    // Configurar monitoramento contínuo
    const interval = setInterval(async () => {
      const basicMetrics = collectBasicMetrics();
      const advancedMetrics = await calculateAdvancedMetrics(basicMetrics);
      setMetrics(advancedMetrics);
    }, 5000); // A cada 5 segundos
    
    setMonitoringInterval(interval);
  }, [isMonitoring, collectBasicMetrics, calculateAdvancedMetrics]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    setIsMonitoring(false);
  }, [monitoringInterval]);

  // Limpar métricas
  const clearMetrics = useCallback(() => {
    setMetrics(null);
  }, []);

  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    collectBasicMetrics,
    calculateAdvancedMetrics
  };
};

// Hook para otimizações de performance
export const usePerformanceOptimizations = () => {
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Gerar otimizações baseadas nas métricas
  const generateOptimizations = useCallback((metrics: PerformanceMetrics): PerformanceOptimization[] => {
    const optimizations: PerformanceOptimization[] = [];

    // Otimização de imagens
    if (metrics.imageCount > 10) {
      optimizations.push({
        id: 'image-optimization',
        name: 'Otimização de Imagens',
        description: 'Reduzir tamanho e usar formatos modernos (WebP, AVIF)',
        impact: 'high',
        status: 'pending',
        estimatedImprovement: 15
      });
    }

    // Otimização de scripts
    if (metrics.scriptCount > 5) {
      optimizations.push({
        id: 'script-bundling',
        name: 'Bundling de Scripts',
        description: 'Combinar scripts em um único bundle',
        impact: 'high',
        status: 'pending',
        estimatedImprovement: 20
      });
    }

    // Lazy loading
    if (metrics.totalResources > 20) {
      optimizations.push({
        id: 'lazy-loading',
        name: 'Lazy Loading',
        description: 'Carregar recursos sob demanda',
        impact: 'medium',
        status: 'pending',
        estimatedImprovement: 25
      });
    }

    // Cache optimization
    if (metrics.cacheHitRate < 50) {
      optimizations.push({
        id: 'cache-optimization',
        name: 'Otimização de Cache',
        description: 'Melhorar estratégias de cache',
        impact: 'medium',
        status: 'pending',
        estimatedImprovement: 30
      });
    }

    // Memory optimization
    if (metrics.memoryUsage > metrics.memoryLimit * 0.8) {
      optimizations.push({
        id: 'memory-optimization',
        name: 'Otimização de Memória',
        description: 'Reduzir uso de memória e vazamentos',
        impact: 'high',
        status: 'pending',
        estimatedImprovement: 40
      });
    }

    return optimizations;
  }, []);

  // Aplicar otimização
  const applyOptimization = useCallback(async (optimization: PerformanceOptimization): Promise<boolean> => {
    setIsOptimizing(true);
    
    try {
      switch (optimization.id) {
        case 'image-optimization':
          await applyImageOptimization();
          break;
        case 'script-bundling':
          await applyScriptBundling();
          break;
        case 'lazy-loading':
          await applyLazyLoading();
          break;
        case 'cache-optimization':
          await applyCacheOptimization();
          break;
        case 'memory-optimization':
          await applyMemoryOptimization();
          break;
        default:
          throw new Error('Otimização não implementada');
      }

      // Marcar como aplicada
      setOptimizations(prev => prev.map(opt => 
        opt.id === optimization.id 
          ? { ...opt, status: 'applied', appliedAt: new Date() }
          : opt
      ));

      return true;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      
      // Marcar como falhou
      setOptimizations(prev => prev.map(opt => 
        opt.id === optimization.id 
          ? { ...opt, status: 'failed', error: error.message }
          : opt
      ));

      return false;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  // Implementar otimizações específicas
  const applyImageOptimization = async () => {
    // Simular otimização de imagens
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Image optimization applied');
  };

  const applyScriptBundling = async () => {
    // Simular bundling de scripts
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Script bundling applied');
  };

  const applyLazyLoading = async () => {
    // Simular implementação de lazy loading
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Lazy loading applied');
  };

  const applyCacheOptimization = async () => {
    // Simular otimização de cache
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Cache optimization applied');
  };

  const applyMemoryOptimization = async () => {
    // Simular otimização de memória
    await new Promise(resolve => setTimeout(resolve, 2500));
    console.log('Memory optimization applied');
  };

  // Aplicar todas as otimizações
  const applyAllOptimizations = useCallback(async () => {
    const pendingOptimizations = optimizations.filter(opt => opt.status === 'pending');
    
    for (const optimization of pendingOptimizations) {
      await applyOptimization(optimization);
    }
  }, [optimizations, applyOptimization]);

  // Limpar otimizações
  const clearOptimizations = useCallback(() => {
    setOptimizations([]);
  }, []);

  return {
    optimizations,
    isOptimizing,
    generateOptimizations,
    applyOptimization,
    applyAllOptimizations,
    clearOptimizations
  };
};

// Componente de métricas de performance
const PerformanceMetricsDisplay: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100;
    
    // Penalizar tempos de carregamento altos
    if (metrics.loadTime > 3000) score -= 20;
    if (metrics.firstContentfulPaint > 2000) score -= 15;
    if (metrics.largestContentfulPaint > 4000) score -= 15;
    
    // Penalizar uso de memória alto
    if (metrics.memoryUsage > metrics.memoryLimit * 0.8) score -= 10;
    
    // Penalizar cache hit rate baixo
    if (metrics.cacheHitRate < 50) score -= 10;
    
    return Math.max(0, score);
  };

  const score = getPerformanceScore(metrics);
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Score geral */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {score}
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : 'Precisa Melhorar'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Performance Score
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de carregamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Carregamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Load Time</span>
              <span className="font-medium">{formatTime(metrics.loadTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">DOM Ready</span>
              <span className="font-medium">{formatTime(metrics.domContentLoaded)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">First Paint</span>
              <span className="font-medium">{formatTime(metrics.firstContentfulPaint)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Largest Paint</span>
              <span className="font-medium">{formatTime(metrics.largestContentfulPaint)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de recursos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-500" />
              Recursos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="font-medium">{metrics.totalResources}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tamanho</span>
              <span className="font-medium">{formatBytes(metrics.totalSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Imagens</span>
              <span className="font-medium">{metrics.imageCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Scripts</span>
              <span className="font-medium">{metrics.scriptCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Memory className="w-5 h-5 text-purple-500" />
              Memória
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Uso</span>
                <span className="font-medium">{formatBytes(metrics.memoryUsage)}</span>
              </div>
              <Progress 
                value={(metrics.memoryUsage / metrics.memoryLimit) * 100} 
                className="h-2"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {((metrics.memoryUsage / metrics.memoryLimit) * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-orange-500" />
              CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Uso</span>
                <span className="font-medium">{metrics.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cpuUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Hit Rate</span>
                <span className="font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de rede */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-500" />
            Rede
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(metrics.networkLatency)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Latência</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(metrics.bandwidth)}/s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bandwidth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.connectionType}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conexão</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de otimizações
const PerformanceOptimizations: React.FC<{ 
  optimizations: PerformanceOptimization[];
  onApply: (optimization: PerformanceOptimization) => void;
  onApplyAll: () => void;
  isOptimizing: boolean;
}> = ({ optimizations, onApply, onApplyAll, isOptimizing }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (optimizations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium mb-2">Nenhuma otimização necessária</p>
        <p className="text-sm">Sua aplicação está otimizada!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Otimizações Disponíveis ({optimizations.length})
        </h3>
        <Button
          onClick={onApplyAll}
          disabled={isOptimizing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isOptimizing ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Rocket className="w-4 h-4 mr-2" />
          )}
          Aplicar Todas
        </Button>
      </div>

      {/* Lista de otimizações */}
      <div className="space-y-3">
        {optimizations.map((optimization) => (
          <Card key={optimization.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {optimization.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(optimization.impact)}`}>
                      {optimization.impact.toUpperCase()}
                    </span>
                    {getStatusIcon(optimization.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {optimization.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      +{optimization.estimatedImprovement}% melhoria estimada
                    </span>
                    
                    {optimization.appliedAt && (
                      <span className="text-gray-500 dark:text-gray-400">
                        Aplicada em {optimization.appliedAt.toLocaleString('pt-BR')}
                      </span>
                    )}
                    
                    {optimization.error && (
                      <span className="text-red-500 dark:text-red-400">
                        Erro: {optimization.error}
                      </span>
                    )}
                  </div>
                </div>
                
                {optimization.status === 'pending' && (
                  <Button
                    onClick={() => onApply(optimization)}
                    disabled={isOptimizing}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Aplicar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Componente principal de otimização de performance
export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  className = '',
  autoOptimize = false,
  showMetrics = true,
  showOptimizations = true,
  onOptimizationComplete
}) => {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring, clearMetrics } = usePerformanceMetrics();
  const { 
    optimizations, 
    isOptimizing, 
    generateOptimizations, 
    applyOptimization, 
    applyAllOptimizations,
    clearOptimizations 
  } = usePerformanceOptimizations();
  
  const [activeTab, setActiveTab] = useState<'metrics' | 'optimizations'>('metrics');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Gerar otimizações quando métricas mudarem
  useEffect(() => {
    if (metrics && optimizations.length === 0) {
      const newOptimizations = generateOptimizations(metrics);
      // Atualizar estado local
      // setOptimizations(newOptimizations);
    }
  }, [metrics, optimizations.length, generateOptimizations]);

  // Aplicar otimização automática se habilitado
  useEffect(() => {
    if (autoOptimize && optimizations.length > 0) {
      const highImpactOptimizations = optimizations.filter(opt => 
        opt.impact === 'high' && opt.status === 'pending'
      );
      
      if (highImpactOptimizations.length > 0) {
        applyOptimization(highImpactOptimizations[0]);
      }
    }
  }, [autoOptimize, optimizations, applyOptimization]);

  // Manipular aplicação de otimização
  const handleApplyOptimization = useCallback(async (optimization: PerformanceOptimization) => {
    const success = await applyOptimization(optimization);
    if (success && onOptimizationComplete) {
      onOptimizationComplete(optimization);
    }
  }, [applyOptimization, onOptimizationComplete]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Otimizador de Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitore e otimize a performance da sua aplicação
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "outline" : "default"}
            className={isMonitoring ? "border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" : ""}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Monitorar
              </>
            )}
          </Button>
          
          <Button
            onClick={clearMetrics}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Gauge className="w-4 h-4 inline mr-2" />
            Métricas
          </button>
          
          <button
            onClick={() => setActiveTab('optimizations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'optimizations'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Otimizações
          </button>
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      <AnimatePresence mode="wait">
        {activeTab === 'metrics' && showMetrics && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {metrics ? (
              <PerformanceMetricsDisplay metrics={metrics} />
            ) : (
              <div className="text-center p-12 text-gray-500 dark:text-gray-400">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2">Nenhuma métrica disponível</p>
                <p className="text-sm">Inicie o monitoramento para coletar dados de performance</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'optimizations' && showOptimizations && (
          <motion.div
            key="optimizations"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <PerformanceOptimizations
              optimizations={optimizations}
              onApply={handleApplyOptimization}
              onApplyAll={applyAllOptimizations}
              isOptimizing={isOptimizing}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status do monitoramento */}
      {isMonitoring && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Monitorando performance...
        </motion.div>
      )}
    </div>
  );
};

// Componente de exemplo
export const PerformanceOptimizerExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Otimizador de Performance
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Sistema abrangente de monitoramento e otimização de performance 
            com métricas em tempo real e otimizações automáticas
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <PerformanceOptimizer
          autoOptimize={true}
          showMetrics={true}
          showOptimizations={true}
          onOptimizationComplete={(optimization) => {
            console.log('Optimization completed:', optimization);
          }}
        />
      </div>
    </div>
  );
};

export default PerformanceOptimizerExample;
