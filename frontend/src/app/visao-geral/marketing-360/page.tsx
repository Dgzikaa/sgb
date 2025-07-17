'use client'

import { useState, useEffect: any, useRef } from 'react'
import { Card, CardContent: any, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent: any, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { usePageTitle } from '@/contexts/PageTitleContext'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Target,
  DollarSign,
  BarChart3,
  RefreshCw,
  Instagram,
  Facebook,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Loader2,
  Activity,
  MousePointer,
  Globe,
  Sparkles,
  Brain,
  Gauge,
  Calendar,
  TrendingUpIcon
} from 'lucide-react'
// Remover import do DateRangePicker
// import { DateRangePicker } from '@/components/ui/date-range-picker'
import AdvancedCharts from '@/components/marketing/AdvancedCharts'
import { PostHighlightsCard, PostHighlight } from '@/components/marketing/AdvancedCharts'

interface MetaAnalytics {
  facebook: {
    current: any
    history: any[]
    error: any
  }
  instagram: {
    current: any
    history: any[]
    error: any
  }
  campaigns: {
    list: any[]
    stats: any
    error: any
  }
  consolidated: {
    total_reach: number
    total_impressions: number
    total_engagement: number
    total_followers: number
    website_clicks: number
  }
  last_update: string
}

interface DailySummary {
  summary: {
    total_followers: number
    total_engagement: number
    total_reach: number
    facebook_followers: number
    instagram_followers: number
    campaigns_active: number
    last_updated: string
  }
  variations: {
    followers_change_today: number
    engagement_change_today: number
    reach_change_today: number
    followers_change_percent: number
  }
  daily_data: any[]
  campaigns_summary: {
    total_campaigns: number
    active_campaigns: number
    total_spend: number
  }
}

interface AdvancedAnalytics {
  funil_conversao: any
  radar_oportunidades: any
  otimizacao_temporal: any
  customer_journey: any
  previsao_performance: any
}

export default function Marketing360Page() {
  const { toast } = useToast()
  const { setPageTitle } = usePageTitle()
  
  const [data, setData] = useState<MetaAnalytics | null>(null)
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [advancedData, setAdvancedData] = useState<AdvancedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [advancedLoading, setAdvancedLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [kpis, setKpis] = useState<any>(null)
  const [trendData, setTrendData] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any>({ stats: {}, list: [] })
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsPage, setCampaignsPage] = useState(1)
  const [campaignsTotal, setCampaignsTotal] = useState(0)
  const [campaignsSearch, setCampaignsSearch] = useState('')
  const campaignsPageSize = 10
  const [campaignsSort, setCampaignsSort] = useState<'data_coleta'|'spend'|'impressions'|'clicks'>('data_coleta')
  const [campaignsOrder, setCampaignsOrder] = useState<'asc'|'desc'>('desc')

  const [campaignsTable, setCampaignsTable] = useState<any[]>([])
  const [campaignsTableLoading, setCampaignsTableLoading] = useState(false)
  const [campaignsTablePage, setCampaignsTablePage] = useState(1)
  const [campaignsTableTotal, setCampaignsTableTotal] = useState(0)
  const [campaignsTableSearch, setCampaignsTableSearch] = useState('')
  const campaignsTablePageSize = 10
  const [campaignsTableSort, setCampaignsTableSort] = useState<'data_coleta'|'spend'|'impressions'|'clicks'>('data_coleta')
  const [campaignsTableOrder, setCampaignsTableOrder] = useState<'asc'|'desc'>('desc')

  const [postHighlights, setPostHighlights] = useState<PostHighlight[]>([])
  const [postHighlightsLoading, setPostHighlightsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('destaques')
  const advancedLoadedRef = useRef(false)

  useEffect(() => {
    setPageTitle('Marketing 360∞ - Vis·£o Geral')
    loadAnalytics()
    loadPostHighlights()
    return () => setPageTitle('')
  }, [setPageTitle])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Montar query params de data
      let params = ''
      if (dateRange[0] && dateRange[1]) {
        params = `?start=${dateRange[0].toISOString().slice(0: any,10)}&end=${dateRange[1].toISOString().slice(0: any,10)}`
      }
      // Buscar KPIs agregados
      const analyticsResponse = await fetch(`/api/meta/analytics${params}`)
      const analyticsResult = await analyticsResponse.json()
      if (analyticsResult.success) {
        setKpis(analyticsResult.data)
      } else {
        throw new Error(analyticsResult.error)
      }
      // Buscar dados di·°rios para gr·°ficos
      const trendRes = await fetch(`/api/meta/daily-summary${params}`)
      const trendJson = await trendRes.json()
      if (trendJson.success && Array.isArray(trendJson.data)) {
        setTrendData(trendJson.data)
      } else {
        setTrendData([])
      }
      // Carregar analytics principais e daily summary em paralelo
      const [dailyResponse] = await Promise.all([
        fetch(`/api/meta/daily-summary${params}`)
      ])
      
      const [dailyResult] = await Promise.all([
        dailyResponse.json()
      ])
      
      if (dailyResult.success) {
        setDailySummary(dailyResult.data)
        console.log('üìä Daily Summary carregado:', dailyResult.data)
      } else {
        console.warn('ö†Ô∏è Daily Summary n·£o dispon·≠vel:', dailyResult.error)
      }
      
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
      toast({
        title: 'ùå Erro',
        description: 'Falha ao carregar dados do Meta',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAdvancedAnalytics = async () => {
    try {
      setAdvancedLoading(true)
      
      // Simula·ß·£o de dados avan·ßados (implementar APIs espec·≠ficas depois)
      await new Promise(resolve => setTimeout(resolve: any, 1500))
      
      setAdvancedData({
        funil_conversao: {
          impressoes: data?.consolidated.total_impressions || 0,
          clicks: data?.consolidated.website_clicks || 0,
          leads: Math.floor((data?.consolidated.website_clicks || 0) * 0.15),
          conversoes: Math.floor((data?.consolidated.website_clicks || 0) * 0.03)
        },
        radar_oportunidades: {
          melhor_horario: '18:00-21:00',
          dias_otimos: ['Sexta', 'S·°bado'],
          publico_alvo: 'Jovens 25-35 anos',
          crescimento_potencial: '+25%'
        },
        otimizacao_temporal: {
          melhor_periodo: 'Final de semana',
          pico_engajamento: '19:30',
          economia_orcamento: '15%'
        },
        customer_journey: {
          descoberta: '45%',
          consideracao: '30%',
          conversao: '25%'
        },
        previsao_performance: {
          proximos_30_dias: {
            reach: Math.floor((data?.consolidated.total_reach || 0) * 1.2),
            engagement: Math.floor((data?.consolidated.total_engagement || 0) * 1.15),
            followers: Math.floor((data?.consolidated.total_followers || 0) * 1.05)
          }
        }
      })
    } catch (error) {
      toast({
        title: 'ùå Erro',
        description: 'Falha ao carregar analytics avan·ßados',
        variant: 'destructive'
      })
    } finally {
      setAdvancedLoading(false)
    }
  }

  const forceRefresh = async () => {
    try {
      setRefreshing(true)
      
      // For·ßar nova coleta via edge function
      const response = await fetch('/api/meta/force-sync', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'úÖ Sucesso',
          description: 'Dados atualizados com sucesso',
        })
        
        // Aguardar um pouco e recarregar dados
        setTimeout(() => {
          loadAnalytics()
          loadAdvancedAnalytics()
        }, 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'ùå Erro',
        description: 'Falha ao atualizar dados',
        variant: 'destructive'
      })
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString('pt-BR')
  }

  const formatPercent = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00'
    return num.toFixed(2)
  }

  const calculatePercent = (numerator: number, denominator: number) => {
    if (!denominator || denominator === 0) return 0
    return ((numerator / denominator) * 100)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const loadCampaigns = async () => {
    setCampaignsLoading(true)
    let params = ''
    if (dateRange[0] && dateRange[1]) {
      params += `&start=${dateRange[0].toISOString().slice(0: any,10)}&end=${dateRange[1].toISOString().slice(0: any,10)}`
    }
    if (campaignsSearch) {
      params += `&q=${encodeURIComponent(campaignsSearch)}`
    }
    params += `&sort=${campaignsSort}&order=${campaignsOrder}`
    params += `&limit=${campaignsPageSize}&offset=${(campaignsPage-1)*campaignsPageSize}`
    const res = await fetch(`/api/meta/campaigns?${params.slice(1)}`)
    const json = await res.json()
    if (json.success) {
      setCampaigns({ stats: json.stats || {}, list: json.data || [] })
      setCampaignsTotal(json.count || 0)
    } else {
      setCampaigns({ stats: {}, list: [] })
      setCampaignsTotal(0)
    }
    setCampaignsLoading(false)
  }

  const loadCampaignsTable = async () => {
    setCampaignsTableLoading(true)
    let params = ''
    if (dateRange[0] && dateRange[1]) {
      params += `&start=${dateRange[0].toISOString().slice(0: any,10)}&end=${dateRange[1].toISOString().slice(0: any,10)}`
    }
    if (campaignsTableSearch) {
      params += `&q=${encodeURIComponent(campaignsTableSearch)}`
    }
    params += `&sort=${campaignsTableSort}&order=${campaignsTableOrder}`
    params += `&limit=${campaignsTablePageSize}&offset=${(campaignsTablePage-1)*campaignsTablePageSize}`
    const res = await fetch(`/api/meta/campaigns?${params.slice(1)}`)
    const json = await res.json()
    if (json.success) {
      setCampaignsTable(json.data)
      setCampaignsTableTotal(json.count || 0)
    } else {
      setCampaignsTable([])
      setCampaignsTableTotal(0)
    }
    setCampaignsTableLoading(false)
  }

  const loadPostHighlights = async () => {
    setPostHighlightsLoading(true)
    try {
      const res = await fetch('/api/meta/post-management')
      const json = await res.json()
      if (json.success && json.management_data) {
        // Unir posts Instagram e Facebook, filtrar top 5 por engagement_rate
        const allPosts: PostHighlight[] = [
          ...(json.management_data.instagram_posts || []),
          ...(json.management_data.facebook_posts || [])
        ]
        // Ordenar por engagement_rate (desc), likes: any, impress·µes
        allPosts.sort((a: any, b: any) => {
          const erA = a.metrics.engagement_rate || 0
          const erB = b.metrics.engagement_rate || 0
          if (erB !== erA) return erB - erA
          const likesA = a.metrics.likes || 0
          const likesB = b.metrics.likes || 0
          if (likesB !== likesA) return likesB - likesA
          const impA = a.metrics.impressions || 0
          const impB = b.metrics.impressions || 0
          return impB - impA
        })
        setPostHighlights(allPosts.slice(0: any, 5))
      } else {
        setPostHighlights([])
      }
    } catch (e) {
      setPostHighlights([])
    } finally {
      setPostHighlightsLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
    loadCampaignsTable()
  }, [dateRange, campaignsPage: any, campaignsSearch, campaignsSort: any, campaignsOrder, campaignsTablePage: any, campaignsTableSearch, campaignsTableSort: any, campaignsTableOrder])

  // Carregamento autom·°tico ao trocar de aba
  useEffect(() => {
    if ((selectedTab === 'funnel' || selectedTab === 'optimization' || selectedTab === 'prediction') && !advancedData && !advancedLoading && !advancedLoadedRef.current) {
      loadAdvancedAnalytics()
      advancedLoadedRef.current = true
    }
    // Reset flag se sair dessas abas
    if (!(selectedTab === 'funnel' || selectedTab === 'optimization' || selectedTab === 'prediction')) {
      advancedLoadedRef.current = false
    }
  }, [selectedTab])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando analytics...</span>
          </div>
        </div>
      </div>
    )
  }

  const fb = data?.facebook.current
  const ig = data?.instagram.current
  const consolidated = data?.consolidated

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Substituir todas as TabsList/Tabs secund·°rias por uma ·∫nica Tabs principal no topo: */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6 mb-6">
          <TabsList className="grid w-full grid-cols-8 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-lg">
            <TabsTrigger value="destaques" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-800 data-[state=active]:to-purple-900 data-[state=active]:text-white data-[state=active]:shadow-md">
              ú® Destaques
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-800 data-[state=active]:to-purple-900 data-[state=active]:text-white data-[state=active]:shadow-md">
              üìä Vis·£o Geral
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-800 data-[state=active]:to-purple-900 data-[state=active]:text-white data-[state=active]:shadow-md">
              üéØ Campanhas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-800 data-[state=active]:to-purple-900 data-[state=active]:text-white data-[state=active]:shadow-md">
              üìà Analytics
            </TabsTrigger>
            <TabsTrigger value="funnel" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-700 data-[state=active]:to-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md">
              üîÑ Funil
            </TabsTrigger>
            <TabsTrigger value="optimization" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-900 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md">
              üöÄ Otimiza·ß·£o
            </TabsTrigger>
            <TabsTrigger value="prediction" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-800 data-[state=active]:to-pink-900 data-[state=active]:text-white data-[state=active]:shadow-md">
              üîÆ IA
            </TabsTrigger>
          </TabsList>

          {/* Tab Destaques: s·≥ cards de resumo premium */}
          <TabsContent value="destaques" className="space-y-6">
            <div className="rounded-2xl mb-6 p-6 bg-gradient-to-r from-purple-700 via-blue-700 to-blue-900 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-8 h-8 text-white drop-shadow-lg" />
                  <h1 className="text-3xl font-bold text-white">Marketing 360</h1>
                </div>
                <p className="text-base text-white/80">Vis·£o completa da performance em redes sociais e campanhas</p>
                <div className="flex gap-3 mt-1">
                  <span className="flex items-center gap-1 text-white/80 text-xs"><Instagram className="w-3 h-3" /> Instagram Analytics</span>
                  <span className="flex items-center gap-1 text-white/80 text-xs"><Facebook className="w-3 h-3" /> Facebook Insights</span>
                  <span className="flex items-center gap-1 text-white/80 text-xs"><BarChart3 className="w-3 h-3" /> Campanhas Meta</span>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-lg shadow transition text-sm" onClick={forceRefresh} disabled={refreshing}>
                <RefreshCw className={refreshing ? 'animate-spin mr-2' : 'mr-2'} /> Atualizar Dados
              </Button>
            </div>
            {/* Cards de resumo premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Seguidores Instagram */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Instagram className="w-7 h-7 text-pink-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">INSTAGRAM</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{formatNumber(ig?.follower_count || 0)}</div>
                  <p className="card-description-dark">Seguidores</p>
                  <div className="text-xs card-description-dark mt-1">Alcance: {formatNumber(ig?.reach || 0)}</div>
                </CardContent>
              </Card>
              {/* Seguidores Facebook */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Facebook className="w-7 h-7 text-blue-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">FACEBOOK</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{formatNumber(fb?.page_fans || 0)}</div>
                  <p className="card-description-dark">Seguidores</p>
                  <div className="text-xs card-description-dark mt-1">Alcance: {formatNumber(fb?.reach || 0)}</div>
                </CardContent>
              </Card>
              {/* Engajamento */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-7 h-7 text-pink-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">ENGAJAMENTO</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{kpis?.engagement_rate ? `${kpis.engagement_rate.toFixed(1)}%` : '-'}</div>
                  <p className="card-description-dark">Meta: 6%</p>
                </CardContent>
              </Card>
              {/* Alcance Semanal */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="w-7 h-7 text-green-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">ALCANCE</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{kpis?.total_reach ? formatNumber(kpis.total_reach) : '-'}</div>
                  <p className="card-description-dark">Meta: 50.0K</p>
                </CardContent>
              </Card>
              {/* Campanhas */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-7 h-7 text-green-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">CAMPANHAS</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{campaigns?.stats?.total_campaigns || 0}</div>
                  <p className="card-description-dark">Campanhas totais</p>
                  <div className="text-xs card-description-dark mt-1">Ativas: {campaigns?.stats?.active_campaigns || 0}</div>
                </CardContent>
              </Card>
              {/* Investimento */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-7 h-7 text-blue-500" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">INVESTIMENTO</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{formatCurrency(campaigns?.stats?.total_spend || 0)}</div>
                  <p className="card-description-dark">Gasto total (m·™s)</p>
                  <div className="text-xs card-description-dark mt-1">CPM: R$ {formatPercent(campaigns?.stats?.avg_cpm || 0)}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Vis·£o Geral: KPIs principais, gr·°ficos, cards: any, etc */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs PRINCIPAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Seguidores */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-7 h-7 text-blue-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">SEGUIDORES</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{kpis?.total_followers ?? '-'}</div>
                  <p className="card-description-dark">Meta: 10.0K <span className="ml-2 text-blue-500">{calculatePercent(kpis?.total_followers || 0, 10000).toFixed(0)}%</span></p>
                </CardContent>
              </Card>
              {/* Engajamento */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-7 h-7 text-pink-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">ENGAJAMENTO</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{kpis?.engagement_rate ? `${kpis.engagement_rate.toFixed(1)}%` : '-'}</div>
                  <p className="card-description-dark">Meta: 6% <span className="ml-2 text-pink-500">{calculatePercent(kpis?.engagement_rate || 0, 6).toFixed(0)}%</span></p>
                </CardContent>
              </Card>
              {/* Alcance Semanal */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="w-7 h-7 text-green-600" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">ALCANCE</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{kpis?.total_reach ? formatNumber(kpis.total_reach) : '-'}</div>
                  <p className="card-description-dark">Meta: 50.0K <span className="ml-2 text-green-500">{calculatePercent(kpis?.total_reach || 0, 50000).toFixed(0)}%</span></p>
                </CardContent>
              </Card>
              {/* ROI */}
              <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-7 h-7 text-blue-500" />
                    <span className="text-xs font-medium card-description-dark px-2 py-1 rounded-full">ROI ESTIMADO</span>
                  </div>
                  <div className="card-title-dark text-3xl mb-1">{kpis?.roi ? `${kpis.roi.toFixed(0)}%` : '-'}</div>
                  <p className="card-description-dark">Meta: 400% <span className="ml-2 text-blue-500">{calculatePercent(kpis?.roi || 0, 400).toFixed(0)}%</span></p>
                </CardContent>
              </Card>
            </div>
            {/* Gr·°ficos de evolu·ß·£o */}
            <div className="mb-8">
              <AdvancedCharts trendData={trendData} />
            </div>
            {/* Cards de Resumo das Redes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Facebook */}
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="card-title-dark">Facebook</CardTitle>
                  <Facebook className="h-6 w-6 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="card-title-dark text-2xl mb-1">{formatNumber(fb?.page_fans || 0)}</div>
                  <p className="card-description-dark">Seguidores</p>
                  <div className="flex items-center text-sm mt-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-blue-600">{fb?.talking_about_count || 0} falando sobre</span>
                  </div>
                </CardContent>
              </Card>

              {/* Instagram */}
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="card-title-dark">Instagram</CardTitle>
                  <Instagram className="h-6 w-6 text-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="card-title-dark text-2xl mb-1">{formatNumber(ig?.follower_count || 0)}</div>
                  <p className="card-description-dark">Seguidores</p>
                  <div className="flex items-center text-sm mt-2">
                    <Eye className="w-4 h-4 text-pink-600 mr-1" />
                    <span className="text-pink-600">{formatNumber(ig?.profile_views || 0)} visualiza·ß·µes do perfil</span>
                  </div>
                </CardContent>
              </Card>

              {/* Campanhas */}
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="card-title-dark">Campanhas</CardTitle>
                  <Target className="h-6 w-6 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="card-title-dark text-2xl mb-1">{campaigns?.stats?.total_campaigns || 0}</div>
                  <p className="card-description-dark">Campanhas totais</p>
                  <div className="flex items-center text-sm mt-2">
                    <Zap className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600">{campaigns?.stats?.active_campaigns || 0} ativas</span>
                  </div>
                </CardContent>
              </Card>

              {/* Investimento */}
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="card-title-dark">Investimento</CardTitle>
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="card-title-dark text-2xl mb-1">{formatCurrency(campaigns?.stats?.total_spend || 0)}</div>
                  <p className="card-description-dark">Gasto total (m·™s)</p>
                  <div className="flex items-center text-sm mt-2">
                    <BarChart3 className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-blue-500">CPM: R$ {formatPercent(campaigns?.stats?.avg_cpm || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Campanhas */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-transparent">
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Todas as Campanhas ({campaignsTableTotal})
                </CardTitle>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <input
                    type="text"
                    placeholder="Buscar campanha..."
                    value={campaignsTableSearch}
                    onChange={e => { setCampaignsTableSearch(e.target.value); setCampaignsTablePage(1); }}
                    className="input-dark px-3 py-2 rounded text-sm"
                  />
                  <Button className="btn-secondary-dark" onClick={() => loadCampaignsTable()}><RefreshCw className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="table-dark w-full">
                    <thead className="table-header-dark">
                      <tr>
                        <th className="py-4 px-6 cursor-pointer" onClick={() => { setCampaignsTableSort('data_coleta'); setCampaignsTableOrder(campaignsTableOrder === 'asc' ? 'desc' : 'asc'); }}>Data</th>
                        <th className="py-4 px-6">Nome</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 cursor-pointer" onClick={() => { setCampaignsTableSort('spend'); setCampaignsTableOrder(campaignsTableOrder === 'asc' ? 'desc' : 'asc'); }}>Gasto</th>
                        <th className="py-4 px-6 cursor-pointer" onClick={() => { setCampaignsTableSort('impressions'); setCampaignsTableOrder(campaignsTableOrder === 'asc' ? 'desc' : 'asc'); }}>Impress·µes</th>
                        <th className="py-4 px-6 cursor-pointer" onClick={() => { setCampaignsTableSort('clicks'); setCampaignsTableOrder(campaignsTableOrder === 'asc' ? 'desc' : 'asc'); }}>Cliques</th>
                        <th className="py-4 px-6">Objetivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignsTableLoading ? (
                        <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                      ) : campaignsTable.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-gray-500">Nenhuma campanha encontrada</td></tr>
                      ) : campaignsTable.map((c: any, idx: any) => (
                        <tr key={c.campaign_id+idx} className="table-row-dark">
                          <td className="table-cell-dark py-4 px-6 text-xs">{c.data_coleta}</td>
                          <td className="table-cell-dark py-4 px-6 font-medium">{c.campaign_name}</td>
                          <td className="table-cell-dark py-4 px-6">
                            {c.effective_status === 'ACTIVE' ? (
                              <Badge className="badge-success">úì Ativa</Badge>
                            ) : c.effective_status === 'PAUSED' ? (
                              <Badge className="badge-warning">è∏ Pausada</Badge>
                            ) : (
                              <Badge className="badge-secondary">{c.effective_status}</Badge>
                            )}
                          </td>
                          <td className="table-cell-dark py-4 px-6 text-right font-bold text-green-600">{c.spend ? parseFloat(c.spend).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                          <td className="table-cell-dark py-4 px-6 text-right">{c.impressions ? parseInt(c.impressions).toLocaleString('pt-BR') : '-'}</td>
                          <td className="table-cell-dark py-4 px-6 text-right">{c.clicks ? parseInt(c.clicks).toLocaleString('pt-BR') : '-'}</td>
                          <td className="table-cell-dark py-4 px-6">{c.objective}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagina·ß·£o */}
                <div className="flex justify-between items-center p-4">
                  <span className="text-xs card-description-dark">P·°gina {campaignsTablePage} de {Math.ceil(campaignsTableTotal/campaignsTablePageSize) || 1}</span>
                  <div className="flex gap-2">
                    <Button className="btn-secondary-dark px-3 py-1" disabled={campaignsTablePage===1} onClick={()=>setCampaignsTablePage(p=>p-1)}>Anterior</Button>
                    <Button className="btn-secondary-dark px-3 py-1" disabled={campaignsTablePage*campaignsTablePageSize>=campaignsTableTotal} onClick={()=>setCampaignsTablePage(p=>p+1)}>Pr·≥xima</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics Avan·ßados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Analytics Detalhados</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    An·°lises detalhadas de performance, hist·≥rico e comparativos.
                  </p>
                  <p className="text-sm text-purple-600">Em desenvolvimento - pr·≥xima atualiza·ß·£o</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Funil */}
          <TabsContent value="funnel" className="space-y-6">
            {advancedLoading ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p>Carregando an·°lise do funil de convers·£o...</p>
                </CardContent>
              </Card>
            ) : advancedData ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Funil de Convers·£o
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Impress·µes */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <div>
                        <div className="card-title-dark text-2xl mb-1">{formatNumber(advancedData.funil_conversao.impressoes)}</div>
                        <div className="card-description-dark">Impress·µes</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">100%</div>
                        <div className="text-xs text-blue-500">Base do funil</div>
                      </div>
                    </div>

                    {/* Cliques */}
                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                      <div>
                        <div className="card-title-dark text-2xl mb-1">{formatNumber(advancedData.funil_conversao.clicks)}</div>
                        <div className="card-description-dark">Cliques</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-purple-600">
                          {calculatePercent(advancedData.funil_conversao.clicks, advancedData.funil_conversao.impressoes).toFixed(1)}%
                        </div>
                        <div className="text-xs text-purple-500">Taxa de cliques</div>
                      </div>
                    </div>

                    {/* Leads */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <div>
                        <div className="card-title-dark text-2xl mb-1">{formatNumber(advancedData.funil_conversao.leads)}</div>
                        <div className="card-description-dark">Leads</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {calculatePercent(advancedData.funil_conversao.leads, advancedData.funil_conversao.clicks).toFixed(1)}%
                        </div>
                        <div className="text-xs text-blue-500">Taxa de convers·£o</div>
                      </div>
                    </div>

                    {/* Convers·µes */}
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                      <div>
                        <div className="card-title-dark text-2xl mb-1">{formatNumber(advancedData.funil_conversao.conversoes)}</div>
                        <div className="card-description-dark">Convers·µes</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {calculatePercent(advancedData.funil_conversao.conversoes, advancedData.funil_conversao.leads).toFixed(1)}%
                        </div>
                        <div className="text-xs text-green-500">Taxa final</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Activity className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Funil de Convers·£o</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    An·°lise completa do funil desde impress·µes at·© convers·µes.
                  </p>
                  {/* Bot·£o removido, agora carrega autom·°tico */}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Otimiza·ß·£o (unificada) */}
          <TabsContent value="optimization" className="space-y-6">
            {/* Juntar conte·∫do de Radar, Temporal e Journey aqui */}
            {advancedLoading ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p>Analisando oportunidades...</p>
                </CardContent>
              </Card>
            ) : advancedData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Oportunidades Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="font-semibold text-blue-800 dark:text-blue-200">üïò Melhor Hor·°rio</div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{advancedData.radar_oportunidades.melhor_horario}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Para m·°ximo engajamento</div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-semibold text-purple-800 dark:text-purple-200">üìÖ Dias ·ìtimos</div>
                        <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{advancedData.radar_oportunidades.dias_otimos.join(', ')}</div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">Melhor performance</div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-semibold text-purple-800 dark:text-purple-200">üéØ P·∫blico Alvo</div>
                        <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{advancedData.radar_oportunidades.publico_alvo}</div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">Segmento mais engajado</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Potencial de Crescimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-green-600 mb-2">{advancedData.radar_oportunidades.crescimento_potencial}</div>
                      <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">Crescimento Potencial</div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          Baseado na an·°lise de padr·µes de engajamento e otimiza·ß·µes identificadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Gauge className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Radar de Oportunidades</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Identifica oportunidades de otimiza·ß·£o e crescimento.
                  </p>
                  {/* Bot·£o removido, agora carrega autom·°tico */}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab IA */}
          <TabsContent value="prediction" className="space-y-6">
            {advancedLoading ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p>IA analisando padr·µes para previs·µes...</p>
                </CardContent>
              </Card>
            ) : advancedData ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Previs·µes com IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="text-sm text-purple-600 mb-2">Previs·£o para os pr·≥ximos 30 dias</div>
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-semibold">Baseado em IA e Machine Learning</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Eye className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                        <div className="card-title-dark text-2xl mb-1">
                          {formatNumber(advancedData.previsao_performance.proximos_30_dias.reach)}
                        </div>
                        <div className="card-description-dark">Alcance Previsto</div>
                        <div className="text-xs text-green-600 mt-1">+20% vs atual</div>
                      </div>
                      
                      <div className="text-center p-6 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                        <Heart className="w-12 h-12 text-pink-600 mx-auto mb-3" />
                        <div className="card-title-dark text-2xl mb-1">
                          {formatNumber(advancedData.previsao_performance.proximos_30_dias.engagement)}
                        </div>
                        <div className="card-description-dark">Engajamento Previsto</div>
                        <div className="text-xs text-green-600 mt-1">+15% vs atual</div>
                      </div>
                      
                      <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <div className="card-title-dark text-2xl mb-1">
                          {formatNumber(advancedData.previsao_performance.proximos_30_dias.followers)}
                        </div>
                        <div className="card-description-dark">Seguidores Previstos</div>
                        <div className="text-xs text-green-600 mt-1">+5% vs atual</div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900 dark:text-purple-100">Insights da IA</span>
                      </div>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        Com base nos padr·µes identificados, recomendamos focar em conte·∫do nos fins de semana 
                        entre 18h-21h para maximizar o engajamento. A otimiza·ß·£o temporal pode resultar em 
                        economia de 15% no or·ßamento de ads.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Previs·µes com IA</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Intelig·™ncia artificial para prever performance futura e otimiza·ß·µes.
                  </p>
                  {/* Bot·£o removido, agora carrega autom·°tico */}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
