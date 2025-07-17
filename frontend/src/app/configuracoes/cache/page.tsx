'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCacheMetrics } from '@/hooks/useCache'
import { usePageTitle } from '@/contexts/PageTitleContext'
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
    memoryUsage
    cacheSize: number
    avgResponseTime: string
    totalRequests: number
    cacheOperations: number
  }
  recommendations: string[]
}

export default function CachePage() {
  const { setPageTitle } = usePageTitle()
  const { metrics, isLoading, refetch, clearCache, warmupCache } = useCacheMetrics()
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [warming, setWarming] = useState(false)

  useEffect(() => {
    setPageTitle('Cache - Configuraá§áµes')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    fetchCacheStats()
  }, [])

  const fetchCacheStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cache/metricas')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar stats do cache:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      setClearing(true)
      await clearCache()
      await fetchCacheStats()
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
    } finally {
      setClearing(false)
    }
  }

  const handleWarmupCache = async () => {
    try {
      setWarming(true)
      await warmupCache()
      await fetchCacheStats()
    } catch (error) {
      console.error('Erro ao aquecer cache:', error)
    } finally {
      setWarming(false)
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

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando má©tricas do cache...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cache Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitoramento e controle do sistema de cache Redis
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchCacheStats}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                onClick={handleWarmupCache}
                variant="outline"
                size="sm"
                disabled={warming}
              >
                <Zap className="w-4 h-4 mr-2" />
                {warming ? 'Aquecendo...' : 'Aquecer Cache'}
              </Button>
              
              <Button
                onClick={handleClearCache}
                variant="destructive"
                size="sm"
                disabled={clearing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {clearing ? 'Limpando...' : 'Limpar Cache'}
              </Button>
            </div>
          </div>

          {/* Má©tricas Principais */}
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hit Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.cache.metrics.hitRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <Progress value={stats.cache.metrics.hitRate} className="mt-3" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache Size</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(stats.cache.size / 1024).toFixed(1)}KB
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                        <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.cache.uptimeFormatted}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Health Score</p>
                        <p className={`text-2xl font-bold ${getHealthColor(stats.cache.healthScore)}`}>
                          {stats.cache.healthScore}/100
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                        <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estatá­sticas Detalhadas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Operaá§áµes de Cache
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cache Hits</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {stats.cache.metrics.hits.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cache Misses</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {stats.cache.metrics.misses.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sets</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {stats.cache.metrics.sets.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Deletes</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {stats.cache.metrics.deletes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Eficiáªncia</span>
                        <Badge className={`${getEfficiencyColor(stats.cache.efficiency)} border-current`} variant="outline">
                          {stats.cache.efficiency.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Resposta Má©dio</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stats.performance.avgResponseTime}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total de Requests</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stats.performance.totalRequests.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Operaá§áµes de Cache</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stats.performance.cacheOperations.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uso de Memá³ria</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stats.performance.memoryUsage 
                            ? `${(stats.performance.memoryUsage.used / 1024 / 1024).toFixed(1)}MB`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendaá§áµes */}
              {stats.recommendations && stats.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      Recomendaá§áµes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 
