'use client'

import React, { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { 
  Facebook, 
  Instagram, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle,
  Share2,
  BarChart3,
  RefreshCw,
  Settings,
  Calendar as CalendarIcon,
  Download,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ========================================
// 🎯 TIPOS E INTERFACES
// ========================================

interface DateRange {
  from: Date
  to: Date
}

interface SocialStats {
  total_followers: number
  total_reach: number
  total_engagement: number
  engagement_rate: number
  growth_rate: number
  trending: {
    reach: 'up' | 'down' | 'stable'
    engagement: 'up' | 'down' | 'stable'
    followers: 'up' | 'down' | 'stable'
  }
  facebook_followers: number
  instagram_followers: number
  last_updated: string
}

interface MetricaConsolidada {
  id: number
  data_referencia: string
  total_reach: number
  total_impressions: number
  total_engagement: number
  total_followers: number
  facebook_reach: number
  facebook_impressions: number
  facebook_engagement: number
  facebook_followers: number
  instagram_reach: number
  instagram_impressions: number
  instagram_engagement: number
  instagram_followers: number
  engagement_rate_geral: number
  platform: string
}

interface CollectionStatus {
  ultima_coleta: {
    data: string
    status: string
    tipo: string
    registros: number
  } | null
  total_coletas_hoje: number
  configuracao_ativa: boolean
}

// ========================================
// 🎨 COMPONENTE PRINCIPAL
// ========================================

export default function MetricasSociaisPage() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  
  // Estados principais
  const [stats, setStats] = useState<SocialStats | null>(null)
  const [metricas, setMetricas] = useState<MetricaConsolidada[]>([])
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collecting, setCollecting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  })

  useEffect(() => {
    loadData()
    loadCollectionStatus()
  }, [selectedBar?.id, dateRange])

  useEffect(() => {
    setPageTitle('📱 Métricas Sociais')
    return () => setPageTitle('')
  }, [setPageTitle])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        platform: 'consolidated',
        date_from: format(dateRange.from, 'yyyy-MM-dd'),
        date_to: format(dateRange.to, 'yyyy-MM-dd'),
        limit: '30',
        order_by: 'data_referencia',
        order_direction: 'desc'
      })

      console.log('🔍 Buscando métricas:', `/api/meta/metrics?${params}`)

      const response = await fetch(`/api/meta/metrics?${params}`)
      const data = await response.json()

      console.log('📊 Resposta da API:', data)

      if (response.ok) {
        setStats(data.stats)
        setMetricas(data.metricas || [])
        
        if (!data.stats && (!data.metricas || data.metricas.length === 0)) {
          setError('Nenhuma métrica encontrada. Verifique se a coleta de dados está configurada.')
        }
      } else {
        console.error('❌ Erro ao carregar métricas:', data.error)
        setError(data.error || 'Erro ao carregar métricas')
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setError('Erro de conexão com a API')
    } finally {
      setLoading(false)
    }
  }

  const loadCollectionStatus = async () => {
    try {
      const response = await fetch('/api/meta/collect')
      const data = await response.json()

      console.log('📝 Status da coleta:', data)

      if (response.ok) {
        setCollectionStatus(data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar status de coleta:', error)
    }
  }

  // ========================================
  // 🚀 AÇÕES
  // ========================================

  const handleCollectMetrics = async () => {
    try {
      setCollecting(true)

      const response = await fetch('/api/meta/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          types: ['all'],
          period: 'day'
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Coleta realizada:', result)
        await loadData()
        await loadCollectionStatus()
      } else {
        console.error('❌ Erro na coleta:', result.error)
        setError(result.error || 'Erro ao coletar métricas')
      }
    } catch (error) {
      console.error('❌ Erro ao coletar métricas:', error)
      setError('Erro ao coletar métricas')
    } finally {
      setCollecting(false)
    }
  }

  // ========================================
  // 🎨 COMPONENTES DE UI
  // ========================================

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <div className="w-4 h-4" />
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'stable'
    icon: any
    color?: string
  }) => (
    <Card className="minimal-card hover-lift bg-white border border-gray-200/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-3">{value}</p>
            {change && (
              <div className="flex items-center gap-2">
                {trend && <TrendIcon trend={trend} />}
                <span className={`text-sm font-medium ${
                  trend === 'up' ? 'text-emerald-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-br ${
            color === 'blue' ? 'from-blue-100 to-blue-200' :
            color === 'green' ? 'from-emerald-100 to-emerald-200' :
            color === 'purple' ? 'from-purple-100 to-purple-200' :
            'from-amber-100 to-amber-200'
          }`}>
            <Icon className={`w-6 h-6 ${
              color === 'blue' ? 'text-blue-600' :
              color === 'green' ? 'text-emerald-600' :
              color === 'purple' ? 'text-purple-600' :
              'text-amber-600'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const PlatformCard = ({ 
    platform, 
    data, 
    icon: Icon,
    color = 'blue'
  }: {
    platform: string
    data: any
    icon: any
    color?: string
  }) => (
    <Card className="minimal-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <Icon className={`w-5 h-5 ${
            color === 'blue' ? 'text-blue-600' : 'text-pink-600'
          }`} />
          {platform}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${
            color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'
          }`}>
            <p className="text-sm text-gray-600 font-medium">Seguidores</p>
            <p className="text-2xl font-bold text-gray-900">{data.followers?.toLocaleString() || 0}</p>
          </div>
          <div className={`p-4 rounded-lg border ${
            color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'
          }`}>
            <p className="text-sm text-gray-600 font-medium">Alcance</p>
            <p className="text-2xl font-bold text-gray-900">{data.reach?.toLocaleString() || 0}</p>
          </div>
          <div className={`p-4 rounded-lg border ${
            color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'
          }`}>
            <p className="text-sm text-gray-600 font-medium">Impressões</p>
            <p className="text-2xl font-bold text-gray-900">{data.impressions?.toLocaleString() || 0}</p>
          </div>
          <div className={`p-4 rounded-lg border ${
            color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'
          }`}>
            <p className="text-sm text-gray-600 font-medium">Engajamento</p>
            <p className="text-2xl font-bold text-gray-900">{data.engagement?.toLocaleString() || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ========================================
  // 🎯 RENDER PRINCIPAL
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Carregando dados do Facebook e Instagram...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="minimal-card">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Informações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-600">
              Facebook e Instagram Analytics
              {stats?.last_updated && (
                <span className="ml-2">
                  • Atualizado {format(new Date(stats.last_updated), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro de Data */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="minimal-button-secondary">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(dateRange.from, 'dd/MM', { locale: ptBR })} - {format(dateRange.to, 'dd/MM', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      setDateRange({ from: date, to: date })
                    }
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Botão Coletar */}
            <Button 
              onClick={handleCollectMetrics}
              disabled={collecting}
              className="minimal-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
              {collecting ? 'Coletando...' : 'Coletar'}
            </Button>

            {/* Configurações */}
            <Button variant="outline" className="minimal-button-secondary">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </Button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Erro ao carregar dados</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da Coleta */}
        {collectionStatus && (
          <Card className="minimal-card border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      collectionStatus.configuracao_ativa ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">
                      {collectionStatus.configuracao_ativa ? 'Configurado' : 'Não Configurado'}
                    </span>
                  </div>
                  {collectionStatus.ultima_coleta && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Última coleta: {format(new Date(collectionStatus.ultima_coleta.data), 'dd/MM HH:mm', { locale: ptBR })}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {collectionStatus.total_coletas_hoje} coletas hoje
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Principais */}
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Seguidores"
              value={stats.total_followers.toLocaleString()}
              change={`${stats.growth_rate > 0 ? '+' : ''}${stats.growth_rate}%`}
              trend={stats.trending.followers}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Alcance Total"
              value={stats.total_reach.toLocaleString()}
              trend={stats.trending.reach}
              icon={Eye}
              color="green"
            />
            <MetricCard
              title="Engajamento Total"
              value={stats.total_engagement.toLocaleString()}
              trend={stats.trending.engagement}
              icon={Heart}
              color="purple"
            />
            <MetricCard
              title="Taxa de Engajamento"
              value={`${stats.engagement_rate}%`}
              icon={BarChart3}
              color="orange"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma métrica encontrada</h3>
              <p className="text-gray-600 mb-4">
                {collectionStatus?.configuracao_ativa 
                  ? 'Os dados foram coletados mas ainda não estão disponíveis. Tente coletar novamente.'
                  : 'Configure primeiro a integração com Meta API para começar a coletar dados.'
                }
              </p>
              <Button 
                onClick={handleCollectMetrics}
                disabled={collecting}
                className="minimal-button"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                {collecting ? 'Coletando Métricas...' : 'Coletar Métricas'}
              </Button>
            </div>
          </div>
        )}

        {/* Tabs de Conteúdo */}
        {stats && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger value="overview" className="text-sm font-medium">Visão Geral</TabsTrigger>
              <TabsTrigger value="platforms" className="text-sm font-medium">Por Plataforma</TabsTrigger>
              <TabsTrigger value="evolution" className="text-sm font-medium">Evolução</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlatformCard
                  platform="Facebook"
                  icon={Facebook}
                  color="blue"
                  data={{
                    followers: stats.facebook_followers,
                    reach: metricas[0]?.facebook_reach || 0,
                    impressions: metricas[0]?.facebook_impressions || 0,
                    engagement: metricas[0]?.facebook_engagement || 0
                  }}
                />
                <PlatformCard
                  platform="Instagram"
                  icon={Instagram}
                  color="pink"
                  data={{
                    followers: stats.instagram_followers,
                    reach: metricas[0]?.instagram_reach || 0,
                    impressions: metricas[0]?.instagram_impressions || 0,
                    engagement: metricas[0]?.instagram_engagement || 0
                  }}
                />
              </div>
            </TabsContent>

            {/* Por Plataforma */}
            <TabsContent value="platforms" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facebook */}
                <Card className="minimal-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      Facebook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metricas.length > 0 ? (
                        metricas.slice(0, 5).map((metrica, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date(metrica.data_referencia), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="text-xs text-gray-600">
                                {metrica.facebook_reach?.toLocaleString() || 0} alcance
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{metrica.facebook_engagement?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-600">engajamento</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          <p>Nenhum dado disponível</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Instagram */}
                <Card className="minimal-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      Instagram
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metricas.length > 0 ? (
                        metricas.slice(0, 5).map((metrica, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date(metrica.data_referencia), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="text-xs text-gray-600">
                                {metrica.instagram_reach?.toLocaleString() || 0} alcance
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{metrica.instagram_engagement?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-600">engajamento</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          <p>Nenhum dado disponível</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Evolução */}
            <TabsContent value="evolution" className="space-y-6">
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="text-gray-900">📈 Evolução das Métricas</CardTitle>
                </CardHeader>
                <CardContent>
                  {metricas.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-600 font-medium">Seguidores Total</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {metricas[0]?.total_followers?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-sm text-gray-600 font-medium">Alcance Total</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {metricas[0]?.total_reach?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-gray-600 font-medium">Engajamento Total</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {metricas[0]?.total_engagement?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {metricas.slice(0, 7).map((metrica, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">
                              {format(new Date(metrica.data_referencia), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-blue-600">
                                👥 {metrica.total_followers?.toLocaleString() || 0}
                              </span>
                              <span className="text-emerald-600">
                                👁️ {metrica.total_reach?.toLocaleString() || 0}
                              </span>
                              <span className="text-purple-600">
                                ❤️ {metrica.total_engagement?.toLocaleString() || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                      <p>Nenhum dado histórico disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
} 