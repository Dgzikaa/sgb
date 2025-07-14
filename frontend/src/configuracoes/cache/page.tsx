'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCacheMetrics } from '@/hooks/useCache'
import { 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  Zap, 
  TrendingUp, 
  Clock, 
  Database,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react'

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
}

interface CacheStats {
  cache: {
    size: number
    metrics: CacheMetrics
    uptimeSeconds: number
    uptimeFormatted: string
    efficiency: 'excellent' | 'good' | 'fair' | 'poor'
    healthScore: number
  }
  performance: {
    memoryUsage: any
    cacheSize: number
    avgResponseTime: string
    totalRequests: number
    cacheOperations: number
  }
  recommendations: string[]
}

export default function CachePage() {
  const { metrics, isLoading, refetch, clearCache, warmupCache } = useCacheMetrics()
  const [detailedStats, setDetailedStats] = useState<CacheStats | null>(null)
  const [isOperating, setIsOperating] = useState(false)

  const fetchDetailedStats = async () => {
    try {
      const response = await fetch('/api/cache/metricas')
      const result = await response.json()
      
      if (result.success) {
        setDetailedStats(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas detalhadas:', error)
    }
  }

  useEffect(() => {
    fetchDetailedStats()
    const interval = setInterval(fetchDetailedStats, 5000) // Atualizar a cada 5 segundos
    return () => clearInterval(interval)
  }, [])

  const handleClearCache = async () => {
    setIsOperating(true)
    try {
      const result = await clearCache()
      if (result.success) {
        await fetchDetailedStats()
      }
    } finally {
      setIsOperating(false)
    }
  }

  const handleWarmupCache = async () => {
    setIsOperating(true)
    try {
      const result = await warmupCache()
      if (result.success) {
        await fetchDetailedStats()
      }
    } finally {
      setIsOperating(false)
    }
  }

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600 dark:text-green-400'
      case 'good': return 'text-blue-600 dark:text-blue-400'
      case 'fair': return 'text-yellow-600 dark:text-yellow-400'
      case 'poor': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getEfficiencyBadge = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'badge-success'
      case 'good': return 'badge-primary'
      case 'fair': return 'badge-warning'
      case 'poor': return 'badge-error'
      default: return 'badge-secondary'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="card-title-dark flex items-center gap-2">
                <Database className="w-6 h-6" />
                Monitoramento de Cache
              </h1>
              <p className="card-description-dark">
                Métricas em tempo real, performance e controle do sistema de cache
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={refetch}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="btn-outline-dark"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                onClick={handleWarmupCache}
                disabled={isOperating}
                variant="outline"
                size="sm"
                className="btn-outline-dark"
              >
                <Zap className="w-4 h-4 mr-2" />
                Warmup
              </Button>
              
              <Button
                onClick={handleClearCache}
                disabled={isOperating}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Cache
              </Button>
            </div>
          </div>

          {/* Métricas Principais */}
          {detailedStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {detailedStats.cache.metrics.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <Progress 
                    value={detailedStats.cache.metrics.hitRate} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cache Size</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {detailedStats.cache.size}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    entradas ativas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {detailedStats.cache.healthScore.toFixed(0)}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                  <Progress 
                    value={detailedStats.cache.healthScore} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {detailedStats.cache.uptimeFormatted}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <Badge className={getEfficiencyBadge(detailedStats.cache.efficiency)}>
                    {detailedStats.cache.efficiency}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Estatísticas Detalhadas */}
          {detailedStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Estatísticas de Operação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Cache Hits</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {detailedStats.cache.metrics.hits.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Cache Misses</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      {detailedStats.cache.metrics.misses.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Sets</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {detailedStats.cache.metrics.sets.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Deletes</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">
                      {detailedStats.cache.metrics.deletes.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Requests</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {detailedStats.performance.totalRequests.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {detailedStats.performance.avgResponseTime}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detailedStats.recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {detailedStats.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-yellow-800 dark:text-yellow-200">
                            {recommendation}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-800 dark:text-green-200">
                        Cache funcionando otimamente! Nenhuma recomendação no momento.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Memory Usage (se disponível) */}
          {detailedStats?.performance.memoryUsage && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Uso de Memória</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">RSS</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(detailedStats.performance.memoryUsage.rss / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Heap Used</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(detailedStats.performance.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Heap Total</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(detailedStats.performance.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">External</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(detailedStats.performance.memoryUsage.external / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 