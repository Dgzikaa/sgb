'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Target,
  DollarSign,
  Calendar,
  Zap,
  Award,
  Lightbulb,
  AlertTriangle
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ========================================
// 🎯 TIPOS E INTERFACES
// ========================================

interface MarketingOverview {
  facebook: {
    followers: number
    growth_7d: number
    reach: number
    engagement: number
    posts_today: number
    best_post_reach: number
  }
  instagram: {
    followers: number
    growth_7d: number
    reach: number
    engagement: number
    posts_today: number
    best_post_reach: number
  }
  overall: {
    total_followers: number
    weekly_growth: number
    engagement_rate: number
    reach_rate: number
    content_frequency: number
    roi_estimate: number
  }
}

interface CampaignMetrics {
  active_campaigns: number
  campaign_reach: number
  campaign_clicks: number
  cost_per_click: number
  conversion_rate: number
  roi: number
}

interface CompetitorInsights {
  market_position: string
  engagement_vs_market: number
  content_gap_analysis: string[]
  recommended_actions: string[]
}

interface MarketingGoals {
  followers_target: number
  engagement_target: number
  reach_target: number
  monthly_posts_target: number
  roi_target: number
}

// ========================================
// 🎨 COMPONENTE PRINCIPAL
// ========================================

export default function Marketing360Page() {
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [overview, setOverview] = useState<MarketingOverview | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignMetrics | null>(null)
  const [insights, setInsights] = useState<CompetitorInsights | null>(null)
  const [goals, setGoals] = useState<MarketingGoals | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // ========================================
  // 🔄 EFEITOS E CARREGAMENTO
  // ========================================

  useEffect(() => {
    loadMarketingData()
  }, [])

  const loadMarketingData = async () => {
    try {
      setLoading(true)

      // Buscar dados reais das APIs
      const [metricsResponse, campaignsResponse] = await Promise.allSettled([
        fetch('/api/meta/metrics?platform=all&period=week'),
        fetch('/api/meta/campaigns')
      ])

      let facebookData = {
        followers: 0,
        growth_7d: 0,
        reach: 0,
        engagement: 0,
        posts_today: 0,
        best_post_reach: 0
      }

      let instagramData = {
        followers: 0,
        growth_7d: 0,
        reach: 0,
        engagement: 0,
        posts_today: 0,
        best_post_reach: 0
      }

      let overallData = {
        total_followers: 0,
        weekly_growth: 0,
        engagement_rate: 0,
        reach_rate: 0,
        content_frequency: 0,
        roi_estimate: 0
      }

      let campaignsData = {
        active_campaigns: 0,
        campaign_reach: 0,
        campaign_clicks: 0,
        cost_per_click: 0,
        conversion_rate: 0,
        roi: 0
      }

      // Processar métricas se disponíveis
      if (metricsResponse.status === 'fulfilled') {
        const metricsData = await metricsResponse.value.json()
        
        if (metricsData.success && metricsData.data) {
          // Separar dados do Facebook e Instagram
          const facebookMetrics = metricsData.data.filter((m: any) => m.platform === 'facebook')
          const instagramMetrics = metricsData.data.filter((m: any) => m.platform === 'instagram')

          // Processar dados do Facebook
          if (facebookMetrics.length > 0) {
            const latest = facebookMetrics[facebookMetrics.length - 1]
            const previous = facebookMetrics[facebookMetrics.length - 2]
            
            facebookData = {
              followers: latest.page_fans || 0,
              growth_7d: previous ? ((latest.page_fans - previous.page_fans) / previous.page_fans * 100) : 0,
              reach: latest.page_reach || 0,
              engagement: latest.page_engaged_users || 0,
              posts_today: latest.post_count || 0,
              best_post_reach: latest.post_reach || 0
            }
          }

          // Processar dados do Instagram
          if (instagramMetrics.length > 0) {
            const latest = instagramMetrics[instagramMetrics.length - 1]
            const previous = instagramMetrics[instagramMetrics.length - 2]
            
            instagramData = {
              followers: latest.follower_count || 0,
              growth_7d: previous ? ((latest.follower_count - previous.follower_count) / previous.follower_count * 100) : 0,
              reach: latest.reach || 0,
              engagement: latest.impressions || 0,
              posts_today: latest.media_count || 0,
              best_post_reach: latest.reach || 0
            }
          }

          // Calcular dados consolidados
          overallData = {
            total_followers: facebookData.followers + instagramData.followers,
            weekly_growth: (facebookData.growth_7d + instagramData.growth_7d) / 2,
            engagement_rate: facebookData.reach > 0 ? (facebookData.engagement / facebookData.reach * 100) : 0,
            reach_rate: (facebookData.reach + instagramData.reach) > 0 ? ((facebookData.reach + instagramData.reach) / (facebookData.followers + instagramData.followers) * 100) : 0,
            content_frequency: facebookData.posts_today + instagramData.posts_today,
            roi_estimate: 0 // Será calculado com base nas campanhas
          }
        }
      }

      // Processar campanhas se disponíveis
      if (campaignsResponse.status === 'fulfilled') {
        const campaignsResult = await campaignsResponse.value.json()
        
        if (campaignsResult.success && campaignsResult.campaigns) {
          campaignsData = campaignsResult.campaigns
          overallData.roi_estimate = campaignsData.roi
        }
      }

      setOverview({
        facebook: facebookData,
        instagram: instagramData,
        overall: overallData
      })

      setCampaigns(campaignsData)

      // Manter insights básicos (podem ser aprimorados futuramente)
      setInsights({
        market_position: overallData.engagement_rate > 5 ? 'Acima da Média' : overallData.engagement_rate > 2 ? 'Na Média' : 'Abaixo da Média',
        engagement_vs_market: overallData.engagement_rate,
        content_gap_analysis: overallData.engagement_rate > 5 ? [
          'Conteúdo atual tem boa performance',
          'Engajamento acima da média do mercado',
          'Continue com a estratégia atual'
        ] : [
          'Oportunidade de melhoria no engajamento',
          'Teste novos formatos de conteúdo',
          'Aumente frequência de posts'
        ],
        recommended_actions: overallData.total_followers < 5000 ? [
          'Foco no crescimento orgânico',
          'Criar conteúdo de bastidores',
          'Usar hashtags locais relevantes',
          'Interagir mais com seguidores'
        ] : [
          'Investir em anúncios pagos',
          'Parcerias com influencers locais',
          'Criar campanhas promocionais',
          'Análise detalhada de métricas'
        ]
      })

      // Buscar metas das configurações ou usar defaults
      setGoals({
        followers_target: 10000,
        engagement_target: 6.0,
        reach_target: 50000,
        monthly_posts_target: 60,
        roi_target: 400
      })

      setLoading(false)

    } catch (error) {
      console.error('Erro ao carregar dados de marketing:', error)
      
      // Em caso de erro, usar valores zerados
      setOverview({
        facebook: {
          followers: 0,
          growth_7d: 0,
          reach: 0,
          engagement: 0,
          posts_today: 0,
          best_post_reach: 0
        },
        instagram: {
          followers: 0,
          growth_7d: 0,
          reach: 0,
          engagement: 0,
          posts_today: 0,
          best_post_reach: 0
        },
        overall: {
          total_followers: 0,
          weekly_growth: 0,
          engagement_rate: 0,
          reach_rate: 0,
          content_frequency: 0,
          roi_estimate: 0
        }
      })

      setCampaigns({
        active_campaigns: 0,
        campaign_reach: 0,
        campaign_clicks: 0,
        cost_per_click: 0,
        conversion_rate: 0,
        roi: 0
      })

      setGoals({
        followers_target: 10000,
        engagement_target: 6.0,
        reach_target: 50000,
        monthly_posts_target: 60,
        roi_target: 400
      })

      setLoading(false)
    }
  }

  const handleCollectMetrics = async () => {
    try {
      setCollecting(true)
      
      // Executar coleta real via API
      const collectResponse = await fetch('/api/meta/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          types: ['all'],
          period: 'day',
          limit: 25
        })
      })

      if (collectResponse.ok) {
        const collectResult = await collectResponse.json()
        console.log('✅ Coleta executada:', collectResult)
      } else {
        console.warn('⚠️ Erro na coleta:', await collectResponse.text())
      }
      
      // Aguardar um pouco para os dados serem processados
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Recarregar os dados
      await loadMarketingData()
    } catch (error) {
      console.error('Erro ao coletar métricas:', error)
    } finally {
      setCollecting(false)
    }
  }

  // ========================================
  // 🎨 COMPONENTES DE UI
  // ========================================

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    target, 
    icon: Icon, 
    color = 'blue',
    format = 'number'
  }: {
    title: string
    value: string | number
    change?: number
    target?: number
    icon: any
    color?: string
    format?: 'number' | 'percent' | 'currency'
  }) => {
    const progress = target ? (Number(value) / target) * 100 : 0
    const isOnTarget = progress >= 80

    const formatValue = (val: string | number) => {
      const num = Number(val)
      if (format === 'percent') return `${num}%`
      if (format === 'currency') return `R$ ${num.toFixed(2)}`
      return num.toLocaleString()
    }

    return (
      <Card className="minimal-card hover-lift bg-white border border-gray-200/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{formatValue(value)}</p>
              
              {change !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  {change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                  <span className="text-xs text-gray-500">esta semana</span>
                </div>
              )}

              {target && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Meta: {formatValue(target)}</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className={`h-2 ${isOnTarget ? 'bg-emerald-100' : 'bg-amber-100'}`}
                  />
                </div>
              )}
            </div>
            
            <div className={`p-3 rounded-full bg-gradient-to-br ${
              color === 'blue' ? 'from-blue-100 to-blue-200' :
              color === 'pink' ? 'from-pink-100 to-pink-200' :
              color === 'green' ? 'from-emerald-100 to-emerald-200' :
              'from-amber-100 to-amber-200'
            } ml-4`}>
              <Icon className={`w-6 h-6 ${
                color === 'blue' ? 'text-blue-600' :
                color === 'pink' ? 'text-pink-600' :
                color === 'green' ? 'text-emerald-600' :
                'text-amber-600'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const InsightCard = ({ insight, type }: { insight: string, type: 'opportunity' | 'warning' | 'success' }) => {
    const colors = {
      opportunity: 'border-blue-200 bg-blue-50 text-blue-800',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-800'
    }

    const icons = {
      opportunity: <Lightbulb className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      success: <Award className="w-4 h-4" />
    }

    return (
      <div className={`p-4 rounded-lg border ${colors[type]} transition-all duration-200`}>
        <div className="flex items-start gap-3">
          {icons[type]}
          <p className="text-sm font-medium">{insight}</p>
        </div>
      </div>
    )
  }

  // ========================================
  // 🎯 RENDER PRINCIPAL
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Carregando análises...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-600">
              Visão completa da estratégia de marketing e redes sociais
            </p>
            {overview && overview.overall.total_followers > 0 ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Dados reais da Meta API</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-amber-600 font-medium">
                  {loading ? 'Carregando dados...' : 'Aguardando dados da Meta API'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCollectMetrics}
              disabled={collecting}
              className="minimal-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
              {collecting ? 'Coletando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* KPIs Principais */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Seguidores"
              value={overview.overall.total_followers}
              change={overview.overall.weekly_growth}
              target={goals?.followers_target}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Taxa de Engajamento"
              value={overview.overall.engagement_rate}
              target={goals?.engagement_target}
              icon={Heart}
              color="pink"
              format="percent"
            />
            <MetricCard
              title="Alcance Semanal"
              value={overview.facebook.reach + overview.instagram.reach}
              target={goals?.reach_target}
              icon={Eye}
              color="green"
            />
            <MetricCard
              title="ROI Estimado"
              value={overview.overall.roi_estimate}
              target={goals?.roi_target}
              icon={DollarSign}
              color="yellow"
              format="percent"
            />
          </div>
        )}

        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="overview" className="text-sm font-medium">Geral</TabsTrigger>
            <TabsTrigger value="platforms" className="text-sm font-medium">Plataformas</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-sm font-medium">Campanhas</TabsTrigger>
            <TabsTrigger value="insights" className="text-sm font-medium">Insights</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance por Plataforma */}
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Performance por Plataforma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overview && (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Facebook className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Facebook</p>
                            <p className="text-sm text-gray-600">{overview.facebook.followers.toLocaleString()} seguidores</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{overview.facebook.engagement.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">engajamento</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                        <div className="flex items-center gap-3">
                          <Instagram className="w-6 h-6 text-pink-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Instagram</p>
                            <p className="text-sm text-gray-600">{overview.instagram.followers.toLocaleString()} seguidores</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{overview.instagram.engagement.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">engajamento</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Metas e Objetivos */}
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Target className="w-5 h-5 text-emerald-600" />
                    Metas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goals && overview && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Seguidores</span>
                          <span>{overview.overall.total_followers.toLocaleString()} / {goals.followers_target.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(overview.overall.total_followers / goals.followers_target) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Engajamento</span>
                          <span>{overview.overall.engagement_rate}% / {goals.engagement_target}%</span>
                        </div>
                        <Progress 
                          value={(overview.overall.engagement_rate / goals.engagement_target) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Alcance Mensal</span>
                          <span>{((overview.facebook.reach + overview.instagram.reach) * 4).toLocaleString()} / {goals.reach_target.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={((overview.facebook.reach + overview.instagram.reach) * 4 / goals.reach_target) * 100} 
                          className="h-2"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plataformas */}
          <TabsContent value="platforms" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    Facebook Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overview && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{overview.facebook.followers.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Seguidores</p>
                        <p className="text-xs text-emerald-600 font-medium">+{overview.facebook.growth_7d.toFixed(1)}% esta semana</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{overview.facebook.reach.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Alcance</p>
                        <p className="text-xs text-gray-500">Últimos 7 dias</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Instagram className="w-5 h-5 text-pink-600" />
                    Instagram Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overview && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                        <p className="text-2xl font-bold text-pink-600">{overview.instagram.followers.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Seguidores</p>
                        <p className="text-xs text-emerald-600 font-medium">+{overview.instagram.growth_7d.toFixed(1)}% esta semana</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                        <p className="text-2xl font-bold text-pink-600">{overview.instagram.reach.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Alcance</p>
                        <p className="text-xs text-gray-500">Últimos 7 dias</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campanhas */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Target className="w-5 h-5 text-emerald-600" />
                    Resumo de Campanhas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campaigns && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-600">{campaigns.active_campaigns}</p>
                        <p className="text-sm text-gray-600 font-medium">Campanhas Ativas</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-600">{campaigns.campaign_reach.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Alcance Total</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">R$ {campaigns.cost_per_click.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 font-medium">Custo por Clique</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <p className="text-2xl font-bold text-purple-600">{campaigns.roi.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600 font-medium">ROI</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    Performance de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campaigns && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                        <span className="text-sm font-medium text-gray-700">Cliques Total</span>
                        <span className="text-lg font-bold text-amber-600">{campaigns.campaign_clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-gray-700">Taxa de Conversão</span>
                        <span className="text-lg font-bold text-green-600">{campaigns.conversion_rate.toFixed(1)}%</span>
                      </div>
                      {campaigns.active_campaigns === 0 && (
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-600 mb-2">Nenhuma campanha ativa</p>
                          <p className="text-sm text-gray-500">Configure campanhas no Meta Ads Manager para ver dados aqui</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Insights de Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.content_gap_analysis.map((insight, index) => (
                    <InsightCard 
                      key={index} 
                      insight={insight} 
                      type="opportunity" 
                    />
                  ))}
                </CardContent>
              </Card>

              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.recommended_actions.map((action, index) => (
                    <InsightCard 
                      key={index} 
                      insight={action} 
                      type="success" 
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 