'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Heart, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Share2,
  MessageSquare,
  BarChart3,
  Award,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react'

interface FallbackSummaryData {
  total_followers: number
  total_reach: number
  total_engagement: number
  facebook_followers: number
  instagram_followers: number
  facebook_impressions: number
  instagram_impressions: number
  last_updated: string
}

interface FallbackVariations {
  followers_change_today: number
  followers_change_percent: number
  engagement_change_today: number
  reach_change_today: number
}

interface FallbackTrends {
  growth_rate_7d: number
  avg_daily_engagement_change: number
  trend_direction: string
}

interface FallbackCampaigns {
  active_campaigns: number
  total_spend: number
  total_clicks: number
  total_impressions: number
  total_conversions: number
}

interface FallbackDailyData {
  facebook_posts_count: number
  instagram_posts_count: number
}

interface FallbackResponse {
  success: boolean
  data?: {
    summary: FallbackSummaryData
    variations: FallbackVariations
    trends: FallbackTrends
    campaigns_summary: FallbackCampaigns
    daily_data?: FallbackDailyData[]
  }
  error?: string
}

interface DailyDataState {
  days: DailyData[]
  comparisons: ComparisonData[]
  trends: {
    followers_trend: string
    engagement_trend: string
    reach_trend: string
  }
}

interface MarketingData {
  metrics: {
    total_followers: number
    engagement_rate: number
    weekly_reach: number
    roi_estimate: number
    facebook: {
      followers: number
      engagement: number
      reach: number
      posts: number
    }
    instagram: {
      followers: number
      engagement: number
      reach: number
      posts: number
    }
  }
  campaigns: {
    active_campaigns: number
    total_spend: number
    total_clicks: number
    conversion_rate: number
  }
  goals: {
    followers_target: number
    engagement_target: number
    reach_target: number
    roi_target: number
  }
  variations: {
    followers_change: number
    followers_change_percent: number
    engagement_change: number
    reach_change: number
    trend_direction: string
  }
  last_updated: string
  data_source: string
}

interface WindsorResponse {
  success: boolean
  data?: MarketingData
  error?: string
}

interface DailyComparisonResponse {
  success: boolean
  data?: DailyDataState
  error?: string
}

interface CampaignsResponse {
  success: boolean
  data?: {
    campaigns: CampaignData[]
    ad_accounts: AdAccountData[]
    ads: AdData[]
    totals: CampaignTotals
  }
  error?: string
}

interface DailyData {
  date: string
  followers: number
  engagement: number
  reach: number
  posts: number
}

interface ComparisonData {
  period: string
  metric: string
  current: number
  previous: number
  change: number
  change_percent: number
  followers_change: number
  followers_percent: number
  reach_change: number
  engagement_change: number
}

interface CampaignData {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  reach: number
  clicks: number
}

interface AdAccountData {
  id: string
  name: string
  status: string
  spend: number
  campaigns: number
}

interface AdData {
  id: string
  name: string
  campaign_id: string
  status: string
  spend: number
  impressions: number
  reach: number
  clicks: number
}

interface CampaignTotals {
  total_spend: number
  total_impressions: number
  total_reach: number
  total_clicks: number
  active_campaigns: number
  total_campaigns: number
  total_ads: number
}

interface Campaign {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  reach: number
  clicks: number
  conversions: number
  start_date: string
  end_date: string
}

export default function Marketing360Page() {
  const [loading, setLoading] = useState(true)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [data, setData] = useState({
    metrics: {
      total_followers: 0,
      engagement_rate: 0,
      weekly_reach: 0,
      roi_estimate: 0,
      facebook: { followers: 0, engagement: 0, reach: 0, posts: 0 },
      instagram: { followers: 0, engagement: 0, reach: 0, posts: 0 }
    },
    campaigns: {
      active_campaigns: 0,
      total_spend: 0,
      total_clicks: 0,
      conversion_rate: 0
    },
    goals: {
      followers_target: 10000,
      engagement_target: 6.0,
      reach_target: 50000,
      roi_target: 400
    }
  })
  
  const [dailyData, setDailyData] = useState<DailyDataState>({
    days: [],
    comparisons: [],
    trends: {
      followers_trend: 'stable',
      engagement_trend: 'stable',
      reach_trend: 'stable'
    }
  })

  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsDetailedData, setCampaignsDetailedData] = useState({
    campaigns: [] as CampaignData[],
    ad_accounts: [] as AdAccountData[],
    ads: [] as AdData[],
    totals: {
      total_spend: 0,
      total_impressions: 0,
      total_reach: 0,
      total_clicks: 0,
      active_campaigns: 0,
      total_campaigns: 0,
      total_ads: 0
    } as CampaignTotals
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('🚀 Carregando dados do Marketing 360°...')
      
      // Usar diretamente a API marketing-360 que é mais confiável
      const response = await fetch('/api/windsor/marketing-360')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: WindsorResponse = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Dados carregados:', result.data.data_source)
        setData(result.data)
        return
      } else {
        throw new Error(result.error || 'Erro ao carregar dados')
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      
      // Fallback para daily-summary se marketing-360 falhar
      console.log('⚠️ Tentando fallback para daily-summary...')
      try {
        const fallbackResponse = await fetch('/api/windsor/daily-summary?days=30')
        if (fallbackResponse.ok) {
          const fallbackResult: FallbackResponse = await fallbackResponse.json()
          if (fallbackResult.success && fallbackResult.data) {
            console.log('✅ Fallback daily-summary bem-sucedido')
            
            // Converter dados da daily-summary para formato do Marketing 360°
            const summaryData = fallbackResult.data.summary
            const variations = fallbackResult.data.variations
            const trends = fallbackResult.data.trends
            const campaigns = fallbackResult.data.campaigns_summary
            
            // Calcular ROI baseado no engagement e alcance
            const roiEstimate = Math.min(Math.round((summaryData.total_reach || 0) / 100 + (trends.growth_rate_7d || 0) * 10), 500)
            
            // Calcular engagement rate consolidado
            const totalImpressions = summaryData.facebook_impressions + summaryData.instagram_impressions || 1
            const engagementRate = totalImpressions > 0 ? 
              (summaryData.total_engagement / totalImpressions * 100) : 
              Math.max(trends.avg_daily_engagement_change || 0, 2.5)
            
            const transformedData: MarketingData = {
              metrics: {
                total_followers: summaryData.total_followers || 0,
                engagement_rate: Math.round(engagementRate * 10) / 10,
                weekly_reach: summaryData.total_reach || 0,
                roi_estimate: roiEstimate,
                facebook: {
                  followers: summaryData.facebook_followers || 0,
                  engagement: Math.round(engagementRate * 0.6 * 10) / 10,
                  reach: Math.round((summaryData.total_reach || 0) * 0.45),
                  posts: fallbackResult.data.daily_data?.[0]?.facebook_posts_count || 0
                },
                instagram: {
                  followers: summaryData.instagram_followers || 0,
                  engagement: Math.round(engagementRate * 1.4 * 10) / 10,
                  reach: Math.round((summaryData.total_reach || 0) * 0.55),
                  posts: fallbackResult.data.daily_data?.[0]?.instagram_posts_count || 0
                }
              },
              campaigns: {
                active_campaigns: campaigns.active_campaigns || 0,
                total_spend: campaigns.total_spend || 0,
                total_clicks: campaigns.total_clicks || Math.round((campaigns.total_impressions || 0) * 0.02),
                conversion_rate: campaigns.total_clicks > 0 ? 
                  Math.round((campaigns.total_conversions || 0) / campaigns.total_clicks * 100 * 100) / 100 : 0
              },
              goals: {
                followers_target: 50000,
                engagement_target: 6.0,
                reach_target: Math.max((summaryData.total_reach || 0) * 1.5, 100000),
                roi_target: 400
              },
              variations: {
                followers_change: variations.followers_change_today || 0,
                followers_change_percent: Math.round((variations.followers_change_percent || 0) * 100) / 100,
                engagement_change: variations.engagement_change_today || 0,
                reach_change: variations.reach_change_today || 0,
                trend_direction: trends.trend_direction || 'stable'
              },
              last_updated: summaryData.last_updated || new Date().toISOString(),
              data_source: 'daily_summary_fallback'
            }
            
            setData(transformedData)
            return
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError)
      }
      
      // Sem dados mockados - mostrar erro real
      console.log('❌ Erro completo: não foi possível carregar dados reais')
      
      // Manter dados iniciais vazios (estrutura mínima para não quebrar a UI)
      const emptyData: MarketingData = {
        metrics: {
          total_followers: 0,
          engagement_rate: 0,
          weekly_reach: 0,
          roi_estimate: 0,
          facebook: { followers: 0, engagement: 0, reach: 0, posts: 0 },
          instagram: { followers: 0, engagement: 0, reach: 0, posts: 0 }
        },
        campaigns: {
          active_campaigns: 0,
          total_spend: 0,
          total_clicks: 0,
          conversion_rate: 0
        },
        goals: {
          followers_target: 50000,
          engagement_target: 6.0,
          reach_target: 100000,
          roi_target: 400
        },
        variations: {
          followers_change: 0,
          followers_change_percent: 0,
          engagement_change: 0,
          reach_change: 0,
          trend_direction: 'stable'
        },
        last_updated: new Date().toISOString(),
        data_source: 'error'
      }
      
      setData(emptyData)
    } finally {
      setLoading(false)
    }
  }

  const loadDailyData = async () => {
    setDailyLoading(true)
    try {
      console.log('📅 Carregando dados de análise diária...')
      
      const response = await fetch('/api/windsor/daily-comparison?days=7')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: DailyComparisonResponse = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Dados diários carregados:', result.data.days?.length || 0, 'dias')
        setDailyData(result.data)
      } else {
        throw new Error(result.error || 'Erro ao carregar dados diários')
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados diários:', error)
      
      // Manter estrutura vazia, SEM dados simulados
      const emptyDailyData: DailyDataState = {
        days: [] as DailyData[],
        comparisons: [] as ComparisonData[],
        trends: {
          followers_trend: 'stable',
          engagement_trend: 'stable',
          reach_trend: 'stable'
        }
      }
      
      setDailyData(emptyDailyData)
    } finally {
      setDailyLoading(false)
    }
  }

  const loadCampaignsData = async () => {
    setCampaignsLoading(true)
    try {
      console.log('🎯 Carregando dados detalhados de campanhas...')
      
      const response = await fetch('/api/windsor/test-campaigns-collection')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: CampaignsResponse = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Dados de campanhas carregados:', result.data.total_campaigns, 'campanhas')
        setCampaignsDetailedData({
          campaigns: result.data.campaigns || [],
          ad_accounts: result.data.ad_accounts || [],
          ads: result.data.ads || [],
          totals: {
            total_spend: result.data.campaigns?.reduce((sum: number, camp: Campaign) =>
              sum + (camp.spend || 0), 0) || 0,
            total_impressions: result.data.campaigns?.reduce((sum: number, camp: Campaign) =>
              sum + (camp.impressions || 0), 0) || 0,
            total_reach: result.data.campaigns?.reduce((sum: number, camp: Campaign) =>
              sum + (camp.reach || 0), 0) || 0,
            total_clicks: result.data.campaigns?.reduce((sum: number, camp: Campaign) =>
              sum + (camp.clicks || 0), 0) || 0,
            active_campaigns: result.data.campaigns?.filter((camp: Campaign) =>
              camp.status === 'active').length || 0,
            total_campaigns: result.data.total_campaigns || 0,
            total_ads: result.data.total_ads || 0
          }
        })
      } else {
        console.log('⚠️ Sem dados de campanhas:', result.error)
        setCampaignsDetailedData({
          campaigns: [],
          ad_accounts: [],
          ads: [],
          totals: {
            total_spend: 0,
            total_impressions: 0,
            total_reach: 0,
            total_clicks: 0,
            active_campaigns: 0,
            total_campaigns: 0,
            total_ads: 0
          }
        })
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar campanhas:', error)
      setCampaignsDetailedData({
        campaigns: [],
        ad_accounts: [],
        ads: [],
        totals: {
          total_spend: 0,
          total_impressions: 0,
          total_reach: 0,
          total_clicks: 0,
          active_campaigns: 0,
          total_campaigns: 0,
          total_ads: 0
        }
      })
    } finally {
      setCampaignsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-purple-700 to-blue-800 dark:from-pink-700 dark:via-purple-800 dark:to-blue-900">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-12">
            <div className="text-center text-white space-y-6">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce delay-150">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce delay-300">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold">📊 Marketing 360</h1>
              <p className="text-xl text-pink-100">Carregando dados das redes sociais...</p>
              <div className="w-64 mx-auto">
                <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-white h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-purple-700 to-blue-800 dark:from-pink-700 dark:via-purple-800 dark:to-blue-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">📊 Marketing 360</h1>
              <p className="text-pink-100 text-lg mb-4">
                Visão completa da performance em redes sociais e campanhas
              </p>
              <div className="flex items-center space-x-6 text-pink-200 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Instagram Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Facebook Insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Campanhas Windsor.ai</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={loadData}
                disabled={loading}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar Dados'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Seguidores</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(data.metrics.total_followers)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Meta: {formatNumber(data.goals.followers_target)}
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {calculateProgress(data.metrics.total_followers, data.goals.followers_target).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(data.metrics.total_followers, data.goals.followers_target)} 
                  className="h-2 mt-2"
                />
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa Engajamento</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {data.metrics.engagement_rate.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Meta: {data.goals.engagement_target}%
                  </span>
                  <span className="text-xs font-medium text-pink-600 dark:text-pink-400">
                    {calculateProgress(data.metrics.engagement_rate, data.goals.engagement_target).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(data.metrics.engagement_rate, data.goals.engagement_target)} 
                  className="h-2 mt-2"
                />
              </div>
              <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/20">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alcance Semanal</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(data.metrics.weekly_reach)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Meta: {formatNumber(data.goals.reach_target)}
                  </span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {calculateProgress(data.metrics.weekly_reach, data.goals.reach_target).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(data.metrics.weekly_reach, data.goals.reach_target)} 
                  className="h-2 mt-2"
                />
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ROI Estimado</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {data.metrics.roi_estimate.toFixed(0)}%
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Meta: {data.goals.roi_target}%
                  </span>
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {calculateProgress(data.metrics.roi_estimate, data.goals.roi_target).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(data.metrics.roi_estimate, data.goals.roi_target)} 
                  className="h-2 mt-2"
                />
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800 w-full md:w-auto">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
          >
            📊 Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="platforms"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
          >
            📱 Plataformas
          </TabsTrigger>
          <TabsTrigger 
            value="campaigns"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
            onClick={() => !campaignsLoading && campaignsDetailedData.campaigns.length === 0 && loadCampaignsData()}
          >
            🎯 Campanhas
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
          >
            💡 Insights
          </TabsTrigger>
          <TabsTrigger 
            value="daily"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
            onClick={() => !dailyLoading && dailyData.days.length === 0 && loadDailyData()}
          >
            📅 Análise Diária
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Performance Geral</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Resumo das principais métricas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.metrics.total_followers}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Seguidores</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.metrics.engagement_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Engajamento</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(data.metrics.weekly_reach)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alcance Semanal</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.metrics.roi_estimate}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ROI Estimado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span>Progresso das Metas</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Acompanhamento dos objetivos mensais
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-gray-700 dark:text-gray-300">Seguidores</span>
                      <span className="text-gray-900 dark:text-white">{data.metrics.total_followers} / {data.goals.followers_target}</span>
                    </div>
                    <Progress value={calculateProgress(data.metrics.total_followers, data.goals.followers_target)} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-gray-700 dark:text-gray-300">Engajamento</span>
                      <span className="text-gray-900 dark:text-white">{data.metrics.engagement_rate.toFixed(1)}% / {data.goals.engagement_target}%</span>
                    </div>
                    <Progress value={calculateProgress(data.metrics.engagement_rate, data.goals.engagement_target)} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-gray-700 dark:text-gray-300">Alcance</span>
                      <span className="text-gray-900 dark:text-white">{formatNumber(data.metrics.weekly_reach)} / {formatNumber(data.goals.reach_target)}</span>
                    </div>
                    <Progress value={calculateProgress(data.metrics.weekly_reach, data.goals.reach_target)} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-gray-700 dark:text-gray-300">ROI</span>
                      <span className="text-gray-900 dark:text-white">{data.metrics.roi_estimate}% / {data.goals.roi_target}%</span>
                    </div>
                    <Progress value={calculateProgress(data.metrics.roi_estimate, data.goals.roi_target)} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plataformas */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  <span>Instagram Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{formatNumber(data.metrics.instagram.followers)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Seguidores</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{data.metrics.instagram.engagement}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Engajamento</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{formatNumber(data.metrics.instagram.reach)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alcance</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{data.metrics.instagram.posts}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Facebook Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(data.metrics.facebook.followers)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Seguidores</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.metrics.facebook.engagement}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Engajamento</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(data.metrics.facebook.reach)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alcance</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.metrics.facebook.posts}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campanhas */}
        <TabsContent value="campaigns" className="space-y-6">
          {campaignsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Carregando campanhas publicitárias...</p>
              </div>
            </div>
          )}

          {!campaignsLoading && (
            <>
              {/* Header com totais */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {campaignsDetailedData.totals.active_campaigns}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Campanhas Ativas</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      de {campaignsDetailedData.totals.total_campaigns} total
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(campaignsDetailedData.totals.total_spend)}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">Gasto Total</div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">últimos 7 dias</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(campaignsDetailedData.totals.total_impressions)}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Impressões</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">visualizações</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatNumber(campaignsDetailedData.totals.total_reach)}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Alcance</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">pessoas únicas</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatNumber(campaignsDetailedData.totals.total_clicks)}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Cliques</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      CTR: {campaignsDetailedData.totals.total_impressions > 0 
                        ? ((campaignsDetailedData.totals.total_clicks / campaignsDetailedData.totals.total_impressions) * 100).toFixed(2)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Campanhas Detalhada */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span>Campanhas Publicitárias</span>
                    </div>
                    <Button
                      onClick={loadCampaignsData}
                      disabled={campaignsLoading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${campaignsLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Performance detalhada de cada campanha • Dados em tempo real do Windsor.ai Analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {campaignsDetailedData.campaigns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Campanha
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Status
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Objetivo
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Orçamento
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Gasto
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Impressões
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Alcance
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              Cliques
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              CPC
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                              CTR
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {campaignsDetailedData.campaigns.map((campaign: CampaignData, index: number) => {
                            const insights = campaign.insights?.data?.[0] || {}
                            const spend = parseFloat(insights.spend) || 0
                            const impressions = parseInt(insights.impressions) || 0
                            const reach = parseInt(insights.reach) || 0
                            const clicks = parseInt(insights.clicks) || 0
                            const cpc = parseFloat(insights.cpc) || 0
                            const ctr = parseFloat(insights.ctr) || 0
                            const dailyBudget = parseFloat(campaign.daily_budget) || 0
                            const lifetimeBudget = parseFloat(campaign.lifetime_budget) || 0

                            return (
                              <tr key={campaign.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                      {campaign.name || `Campanha ${index + 1}`}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {campaign.ad_account_name || 'Windsor.ai Ads'}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge className={
                                    campaign.effective_status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      : campaign.effective_status === 'PAUSED'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  }>
                                    {campaign.effective_status === 'ACTIVE' ? 'Ativa' :
                                     campaign.effective_status === 'PAUSED' ? 'Pausada' : 'Inativa'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                                    {campaign.objective || 'TRAFFIC'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {dailyBudget > 0 
                                      ? `R$ ${dailyBudget.toFixed(2)}/dia`
                                      : lifetimeBudget > 0 
                                      ? `R$ ${lifetimeBudget.toFixed(2)} total`
                                      : '--'
                                    }
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                    R$ {spend.toFixed(2)}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {impressions.toLocaleString()}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {reach.toLocaleString()}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {clicks.toLocaleString()}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    R$ {cpc.toFixed(2)}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {ctr.toFixed(2)}%
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Target className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Nenhuma campanha encontrada
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Configure o Business ID nas configurações Windsor.ai para ver campanhas publicitárias
                      </p>
                      <Button onClick={loadCampaignsData} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ad Accounts */}
              {campaignsDetailedData.ad_accounts.length > 0 && (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span>Contas Publicitárias</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Informações das contas vinculadas ao Business Manager
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {campaignsDetailedData.ad_accounts.map((account: AdAccountData, index: number) => (
                        <div key={account.id || index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {account.name || `Conta ${index + 1}`}
                            </h4>
                            <Badge className={
                              account.account_status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }>
                              {account.account_status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">ID:</span>
                              <span className="text-gray-900 dark:text-white font-mono text-xs">
                                {account.id?.replace('act_', '') || '--'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Moeda:</span>
                              <span className="text-gray-900 dark:text-white">
                                {account.currency || 'BRL'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Gasto:</span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {account.amount_spent ? `${account.currency || 'R$'} ${parseFloat(account.amount_spent).toFixed(2)}` : 'R$ 0,00'}
                              </span>
                            </div>
                            {account.balance && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Saldo:</span>
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {account.currency || 'R$'} {parseFloat(account.balance).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span>Oportunidades de Melhoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">Aumente a frequência de posts</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">Postar mais conteúdo pode melhorar o engajamento em 15-25%</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">Otimize horários de publicação</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Posts entre 18h-21h têm 40% mais engajamento</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">Use mais vídeos</p>
                      <p className="text-sm text-green-700 dark:text-green-400">Conteúdo em vídeo gera 3x mais engajamento</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span>Próximas Ações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-300">Crie campanhas para Stories</p>
                      <p className="text-sm text-purple-700 dark:text-purple-400">Stories têm 30% mais visualizações que posts do feed</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-300">Responda mais comentários</p>
                      <p className="text-sm text-orange-700 dark:text-orange-400">Interação direta aumenta o alcance orgânico</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-indigo-800 dark:text-indigo-300">Faça parcerias com influencers</p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-400">Micro-influencers têm até 60% mais engajamento</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Análise Diária */}
        <TabsContent value="daily" className="space-y-6">
          {dailyLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Carregando análise diária...</p>
              </div>
            </div>
          )}

          {!dailyLoading && (
            <>
              {/* Comparações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dailyData.comparisons.map((comparison: ComparisonData, index: number) => (
                  <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900 dark:text-white">{comparison.period}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Seguidores</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${
                            comparison.followers_change > 0 ? 'text-green-600 dark:text-green-400' :
                            comparison.followers_change < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {comparison.followers_change > 0 ? '+' : ''}{comparison.followers_change}
                          </span>
                          <span className={`text-sm ${
                            comparison.followers_percent > 0 ? 'text-green-600 dark:text-green-400' :
                            comparison.followers_percent < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            ({comparison.followers_percent > 0 ? '+' : ''}{comparison.followers_percent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Alcance</span>
                        <span className={`text-lg font-bold ${
                          comparison.reach_change > 0 ? 'text-green-600 dark:text-green-400' :
                          comparison.reach_change < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {comparison.reach_change > 0 ? '+' : ''}{formatNumber(comparison.reach_change)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Engajamento</span>
                        <span className={`text-lg font-bold ${
                          comparison.engagement_change > 0 ? 'text-green-600 dark:text-green-400' :
                          comparison.engagement_change < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {comparison.engagement_change > 0 ? '+' : ''}{comparison.engagement_change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Histórico dos Últimos Dias */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>Histórico dos Últimos Dias</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Evolução diária dos principais indicadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Data</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Facebook</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Instagram</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Total</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Alcance</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Engajamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.days.slice(0, 7).map((day: DailyData) => (
                          <tr key={day.date} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                              {new Date(day.date).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: 'short' 
                              })}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {formatNumber(day.followers)}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {formatNumber(day.engagement)}
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-gray-900 dark:text-white">
                              {formatNumber(day.followers + day.engagement)}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {formatNumber(day.reach)}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {day.posts}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tendências e Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="text-center">
                    <CardTitle className="text-gray-900 dark:text-white flex items-center justify-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span>Seguidores</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      dailyData.trends.followers_trend === 'up' ? 'text-green-600 dark:text-green-400' :
                      dailyData.trends.followers_trend === 'down' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {dailyData.trends.followers_trend === 'up' ? '📈' : 
                       dailyData.trends.followers_trend === 'down' ? '📉' : '➡️'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dailyData.trends.followers_trend === 'up' ? 'Crescimento' : 
                       dailyData.trends.followers_trend === 'down' ? 'Declínio' : 'Estável'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="text-center">
                    <CardTitle className="text-gray-900 dark:text-white flex items-center justify-center space-x-2">
                      <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      <span>Engajamento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      dailyData.trends.engagement_trend === 'up' ? 'text-green-600 dark:text-green-400' :
                      dailyData.trends.engagement_trend === 'down' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {dailyData.trends.engagement_trend === 'up' ? '💚' : 
                       dailyData.trends.engagement_trend === 'down' ? '💔' : '💛'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dailyData.trends.engagement_trend === 'up' ? 'Aumentando' : 
                       dailyData.trends.engagement_trend === 'down' ? 'Diminuindo' : 'Estável'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="text-center">
                    <CardTitle className="text-gray-900 dark:text-white flex items-center justify-center space-x-2">
                      <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span>Alcance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      dailyData.trends.reach_trend === 'up' ? 'text-green-600 dark:text-green-400' :
                      dailyData.trends.reach_trend === 'down' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {dailyData.trends.reach_trend === 'up' ? '🚀' : 
                       dailyData.trends.reach_trend === 'down' ? '📉' : '🔄'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dailyData.trends.reach_trend === 'up' ? 'Expandindo' : 
                       dailyData.trends.reach_trend === 'down' ? 'Contraindo' : 'Estável'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 
