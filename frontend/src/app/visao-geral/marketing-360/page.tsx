'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, TrendingUp, Users, Target, BarChart3, RefreshCw, Eye, Heart, MessageSquare, Share2, Calendar, Clock, Hash, Award, AlertTriangle, CheckCircle, DollarSign, Lightbulb, Facebook, Instagram } from 'lucide-react'
import { StandardPageLayout } from '@/components/layouts'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function Marketing360Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<any>({
    metrics: null,
    campaigns: null,
    content: null,
    debug: null
  })

  // Carregar dados automaticamente quando a página abrir
  useEffect(() => {
    console.log('🚀 Marketing 360° inicializando...')
    loadAllData()
  }, [])

  // Dados do estado para debug
  useEffect(() => {
    console.log('📊 Estado atual dos dados:', {
      hasMetrics: !!data.metrics,
      hasCampaigns: !!data.campaigns,
      hasCampaignsAdv: !!data.campaignsAdvanced,
      hasContent: !!data.contentAnalysis,
      hasDebug: !!data.debug,
      totalFollowers: data.metrics?.overall?.total_followers,
      facebookFollowers: data.metrics?.facebook?.followers,
      instagramFollowers: data.metrics?.instagram?.followers
    })
  }, [data])

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Carregando TODAS as funcionalidades avançadas...')
      
      // Buscar TODAS as APIs que implementamos
      const [
        metricsResponse, 
        campaignsResponse, 
        campaignsAdvResponse,
        contentResponse,
        debugResponse
      ] = await Promise.allSettled([
        fetch('/api/meta/metrics?platform=all&period=week'),
        fetch('/api/meta/campaigns'),
        fetch('/api/meta/campaigns-advanced'),
        fetch('/api/meta/content-analysis'),
        fetch('/api/meta/debug-data')
      ])

      let facebookData = { followers: 0, growth_7d: 0, reach: 0, engagement: 0, posts_today: 0, best_post_reach: 0 }
      let instagramData = { followers: 0, growth_7d: 0, reach: 0, engagement: 0, posts_today: 0, best_post_reach: 0 }
      let overallData = { total_followers: 0, weekly_growth: 0, engagement_rate: 0, reach_rate: 0, content_frequency: 0, roi_estimate: 0 }
      let campaignsData = { active_campaigns: 0, campaign_reach: 0, campaign_clicks: 0, cost_per_click: 0, conversion_rate: 0, roi: 0 }

      // 1. PROCESSAR MÉTRICAS BÁSICAS
      if (metricsResponse.status === 'fulfilled') {
        const metricsData = await metricsResponse.value.json()
        console.log('📊 Métricas básicas COMPLETAS:', JSON.stringify(metricsData, null, 2))
        
        if (metricsData.success && metricsData.data) {
          const instagramMetric = metricsData.data.find((m: any) => m.platform === 'instagram')
          const facebookMetric = metricsData.data.find((m: any) => m.platform === 'facebook')
          const consolidated = metricsData.consolidated
          
          if (instagramMetric) {
            console.log('📱 DADOS RAW INSTAGRAM:', JSON.stringify(instagramMetric, null, 2))
            instagramData = {
              followers: instagramMetric.follower_count || 0,
              growth_7d: instagramMetric.growth_7d || 0,
              reach: instagramMetric.reach || instagramMetric.impressions || 0,
              engagement: (instagramMetric.posts_likes || 0) + (instagramMetric.posts_comments || 0),
              posts_today: instagramMetric.media_count || 0,
              best_post_reach: instagramMetric.reach || instagramMetric.impressions || 0
            }
            console.log('📱 INSTAGRAM PROCESSADO:', JSON.stringify(instagramData, null, 2))
          }
          
          if (facebookMetric) {
            console.log('📘 DADOS RAW FACEBOOK:', JSON.stringify(facebookMetric, null, 2))
            facebookData = {
              followers: facebookMetric.page_fans || 0,
              growth_7d: facebookMetric.growth_7d || 0,
              reach: facebookMetric.page_reach || 0,
              engagement: facebookMetric.page_engaged_users || 0,
              posts_today: facebookMetric.post_count || 0,
              best_post_reach: facebookMetric.page_reach || 0
            }
            console.log('📘 FACEBOOK PROCESSADO:', JSON.stringify(facebookData, null, 2))
          }
          
          // Usar dados consolidados se disponíveis
          if (consolidated) {
            console.log('🔄 DADOS CONSOLIDADOS:', JSON.stringify(consolidated, null, 2))
            overallData = {
              total_followers: consolidated.total_followers || (facebookData.followers + instagramData.followers),
              weekly_growth: (facebookData.growth_7d + instagramData.growth_7d) / 2,
              engagement_rate: consolidated.total_reach > 0 ? 
                (consolidated.total_engagement / consolidated.total_reach * 100) : 
                (facebookData.followers + instagramData.followers) > 0 ? 
                  ((facebookData.engagement + instagramData.engagement) / (facebookData.followers + instagramData.followers) * 100) : 0,
              reach_rate: consolidated.total_followers > 0 ? 
                (consolidated.total_reach / consolidated.total_followers * 100) : 0,
              content_frequency: facebookData.posts_today + instagramData.posts_today,
              roi_estimate: 0
            }
          } else {
            // Calcular taxa de engajamento baseada nos seguidores, não no alcance
            const totalFollowers = facebookData.followers + instagramData.followers
            const totalEngagement = facebookData.engagement + instagramData.engagement
            const totalReach = facebookData.reach + instagramData.reach
            
            overallData = {
              total_followers: totalFollowers,
              weekly_growth: (facebookData.growth_7d + instagramData.growth_7d) / 2,
              engagement_rate: totalFollowers > 0 ? (totalEngagement / totalFollowers * 100) : 0,
              reach_rate: totalFollowers > 0 ? (totalReach / totalFollowers * 100) : 0,
              content_frequency: facebookData.posts_today + instagramData.posts_today,
              roi_estimate: 0
            }
          }
          
          console.log('🔢 CÁLCULOS FINAIS:', {
            totalFollowers: overallData.total_followers,
            totalEngagement: facebookData.engagement + instagramData.engagement,
            engagementRate: overallData.engagement_rate,
            totalReach: facebookData.reach + instagramData.reach,
            reachRate: overallData.reach_rate,
            // DETALHES PARA DEBUG
            facebook: { followers: facebookData.followers, engagement: facebookData.engagement, reach: facebookData.reach },
            instagram: { followers: instagramData.followers, engagement: instagramData.engagement, reach: instagramData.reach },
            overallCalculated: overallData
          })
        }
      }

      // 2. PROCESSAR CAMPANHAS BÁSICAS
      if (campaignsResponse.status === 'fulfilled') {
        const campaignsResult = await campaignsResponse.value.json()
        console.log('🎯 Campanhas básicas:', campaignsResult)
        
        if (campaignsResult.success && campaignsResult.campaigns) {
          campaignsData = campaignsResult.campaigns
          overallData.roi_estimate = campaignsData.roi
        }
      }

      // 3. PROCESSAR CAMPANHAS AVANÇADAS
      let campaignsAdvanced = null
      if (campaignsAdvResponse.status === 'fulfilled') {
        const campaignsAdvData = await campaignsAdvResponse.value.json()
        console.log('🚀 Campanhas avançadas RESPONSE:', campaignsAdvData)
        
        if (campaignsAdvData.success) {
          campaignsAdvanced = campaignsAdvData
          console.log('📊 CAMPANHAS PROCESSADAS:', {
            total: campaignsAdvanced.campaigns?.length || 0,
            primeiraCampanha: campaignsAdvanced.campaigns?.[0],
            metrics: campaignsAdvanced.campaigns?.[0]?.metrics
          })
        } else {
          console.warn('⚠️ Campanhas avançadas falharam:', campaignsAdvData.error)
        }
      } else {
        console.warn('⚠️ Erro na requisição de campanhas avançadas:', campaignsAdvResponse)
      }

      // 4. PROCESSAR ANÁLISE DE CONTEÚDO
      let contentAnalysis = null
      if (contentResponse.status === 'fulfilled') {
        const contentData = await contentResponse.value.json()
        console.log('📱 Análise de conteúdo:', contentData)
        
        if (contentData.success) {
          contentAnalysis = contentData
        }
      }

      // 5. PROCESSAR DEBUG
      let debugData = null
      if (debugResponse.status === 'fulfilled') {
        const debugResult = await debugResponse.value.json()
        console.log('🔍 Debug data:', debugResult)
        
        if (debugResult.success) {
          debugData = debugResult
        }
      }

      // CALCULAR ALCANCE INTELIGENTE 
      let smartReach = 0
      let reachSource = 'Nenhum dado'
      
      // 1. Prioridade: Alcance das campanhas ativas (últimos 30 dias)
      if (campaignsAdvanced && campaignsAdvanced.campaigns && campaignsAdvanced.campaigns.length > 0) {
        const activeCampaigns = campaignsAdvanced.campaigns.filter((c: any) => c.status === 'ACTIVE')
        const campaignReach = activeCampaigns.reduce((total: number, campaign: any) => {
          return total + (campaign.metrics?.reach || 0)
        }, 0)
        
        if (campaignReach > 0) {
          // Converter alcance mensal para semanal (aproximação)
          smartReach = Math.round(campaignReach / 4)
          reachSource = `Campanhas ativas (${activeCampaigns.length})`
        }
      }
      
      // 2. Fallback: Alcance orgânico (Facebook + Instagram)
      if (smartReach === 0) {
        const organicReach = (facebookData.reach || 0) + (instagramData.reach || 0)
        if (organicReach > 0) {
          smartReach = organicReach
          reachSource = 'Orgânico (Facebook + Instagram)'
        }
      }
      
      // 3. Adicionar ao overallData
      overallData = {
        ...overallData,
        weekly_reach: smartReach,
        reach_source: reachSource
      } as any

      console.log('📊 ALCANCE INTELIGENTE CALCULADO:', {
        smartReach,
        reachSource,
        campanhasAtivas: campaignsAdvanced?.campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0,
        alcanceOrganico: (facebookData.reach || 0) + (instagramData.reach || 0)
      })

      // CONSOLIDAR TODOS OS DADOS
      setData({
        metrics: { facebook: facebookData, instagram: instagramData, overall: overallData },
        campaigns: campaignsData,
        campaignsAdvanced,
        contentAnalysis,
        debug: debugData,
        insights: {
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
        },
        goals: {
          followers_target: 10000,
          engagement_target: 6.0,
          reach_target: 50000,
          monthly_posts_target: 60,
          roi_target: 400
        }
      })

      console.log('✅ TODOS os dados carregados:', {
        hasMetrics: !!facebookData.followers || !!instagramData.followers,
        hasCampaigns: !!campaignsData.active_campaigns,
        hasCampaignsAdv: !!campaignsAdvanced,
        hasContent: !!contentAnalysis,
        hasDebug: !!debugData,
        totalFollowers: overallData.total_followers,
        facebookFollowers: facebookData.followers,
        instagramFollowers: instagramData.followers,
        facebookReach: facebookData.reach,
        instagramReach: instagramData.reach,
        facebookEngagement: facebookData.engagement,
        instagramEngagement: instagramData.engagement,
        // DADOS FINAIS PARA INTERFACE
        finalData: {
          metrics: { facebook: facebookData, instagram: instagramData, overall: overallData },
          campaigns: campaignsData
        }
      })

      setIsLoading(false)

    } catch (error) {
      console.error('Erro ao carregar dados de marketing:', error)
      
      // Em caso de erro, usar valores zerados
      setData((prev: any) => ({
        ...prev,
        metrics: {
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
        }
      }))

      setData((prev: any) => ({
        ...prev,
        campaigns: {
          active_campaigns: 0,
          campaign_reach: 0,
          campaign_clicks: 0,
          cost_per_click: 0,
          conversion_rate: 0,
          roi: 0
        }
      }))

      setData((prev: any) => ({
        ...prev,
        goals: {
          followers_target: 10000,
          engagement_target: 6.0,
          reach_target: 50000,
          monthly_posts_target: 60,
          roi_target: 400
        }
      }))

      setIsLoading(false)
    }
  }

     const handleCollectMetrics = async () => {
     try {
       setIsLoading(true)
       console.log('🔄 Iniciando coleta forçada de dados...')
       
       // Usar a API correta para coleta forçada
       const collectResponse = await fetch('/api/meta/collect-real-data', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         }
       })

       if (collectResponse.ok) {
         const collectResult = await collectResponse.json()
         console.log('✅ Coleta de dados reais executada:', collectResult)
       } else {
         console.warn('⚠️ Erro na coleta:', await collectResponse.text())
       }
       
       // Aguardar processamento dos dados
       console.log('⏳ Aguardando processamento dos dados...')
       await new Promise(resolve => setTimeout(resolve, 5000))
       
       // Recarregar todos os dados
       console.log('🔄 Recarregando dados da interface...')
       await loadAllData()
     } catch (error) {
       console.error('❌ Erro ao coletar métricas:', error)
     } finally {
       setIsLoading(false)
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
    const progress = target ? Math.min((Number(value) / target) * 100, 100) : 0
    const isOnTarget = progress >= 80

    const formatValue = (val: string | number) => {
      const num = Number(val)
      if (format === 'percent') return `${num.toFixed(1)}%`
      if (format === 'currency') return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      return num.toLocaleString('pt-BR')
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
                    <TrendingUp className="w-4 h-4 text-red-500" />
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
                     <span className="font-medium">
                       {progress >= 1000 ? '🎯 Meta superada!' : `${progress.toFixed(0)}%`}
                     </span>
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

  // Função para formatação brasileira de moeda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Função para formatação brasileira de números
  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR')
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

  if (isLoading) {
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
      <ProtectedRoute requiredModule="18" errorMessage="sem_permissao_marketing">
        <StandardPageLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-600">
              Visão completa da estratégia de marketing e redes sociais
            </p>
            {data.metrics && data.metrics.overall.total_followers > 0 ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Dados reais da Meta API</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-amber-600 font-medium">
                  {isLoading ? 'Carregando dados...' : 'Aguardando dados da Meta API'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCollectMetrics}
              disabled={isLoading}
              className="minimal-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Coletando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Loading Profissional */}
        {isLoading ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-gray-200">
            <div className="text-center space-y-6">
              {/* Ícones Animados */}
              <div className="flex items-center justify-center space-x-4">
                <div className="animate-bounce delay-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="animate-bounce delay-150">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="animate-bounce delay-300">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="animate-bounce delay-450">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Spinner Central */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
              </div>

              {/* Texto Animado */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 animate-pulse">
                  Carregando Marketing 360°
                </h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <span className="animate-pulse">📊</span>
                  <span>Coletando métricas das campanhas</span>
                  <span className="animate-pulse">📱</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <span className="animate-pulse">🎯</span>
                  <span>Analisando performance das redes sociais</span>
                  <span className="animate-pulse">📈</span>
                </div>
              </div>

              {/* Barra de Progresso Animada */}
              <div className="w-80 max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Conectando com Meta API...</p>
              </div>

              {/* Cards de Preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 animate-pulse">
                  <div className="w-8 h-8 bg-blue-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 animate-pulse delay-75">
                  <div className="w-8 h-8 bg-purple-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 animate-pulse delay-150">
                  <div className="w-8 h-8 bg-green-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 animate-pulse delay-225">
                  <div className="w-8 h-8 bg-yellow-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            {data.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <MetricCard
               title="Total de Seguidores"
               value={data.metrics.overall.total_followers || 0}
               change={data.metrics.overall.weekly_growth || 0}
               target={data.goals?.followers_target}
               icon={Users}
               color="blue"
             />
                         <MetricCard
               title="Taxa de Engajamento"
               value={data.metrics.overall.engagement_rate || 0}
               target={data.goals?.engagement_target}
               icon={Heart}
               color="pink"
               format="percent"
             />
                         <MetricCard
               title="Alcance Semanal"
               value={data.metrics.overall.weekly_reach || 0}
               target={data.goals?.reach_target}
               icon={Eye}
               color="green"
             />
             <MetricCard
               title="ROI Estimado"
               value={data.metrics.overall.roi_estimate || 0}
               target={data.goals?.roi_target}
               icon={DollarSign}
               color="yellow"
               format="percent"
                          />
              </div>
            )}
          </>
        )}

        {/* Tabs de Conteúdo */}
         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           <TabsList className="grid grid-cols-6 w-full bg-white border border-gray-200 rounded-lg p-1">
             <TabsTrigger value="overview" className="text-sm font-medium">Geral</TabsTrigger>
             <TabsTrigger value="platforms" className="text-sm font-medium">Plataformas</TabsTrigger>
             <TabsTrigger value="campaigns" className="text-sm font-medium">Campanhas</TabsTrigger>
             <TabsTrigger value="campaignsadv" className="text-sm font-medium">Campanhas Avançadas</TabsTrigger>
             <TabsTrigger value="content" className="text-sm font-medium">Análise Conteúdo</TabsTrigger>
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
                  {data.metrics && (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Facebook className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Facebook</p>
                            <p className="text-sm text-gray-600">{data.metrics.facebook.followers.toLocaleString()} seguidores</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{data.metrics.facebook.engagement.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">engajamento</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                        <div className="flex items-center gap-3">
                          <Instagram className="w-6 h-6 text-pink-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Instagram</p>
                            <p className="text-sm text-gray-600">{data.metrics.instagram.followers.toLocaleString()} seguidores</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{data.metrics.instagram.engagement.toLocaleString()}</p>
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
                  {data.goals && data.metrics && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Seguidores</span>
                          <span>{data.metrics.overall.total_followers.toLocaleString()} / {data.goals.followers_target.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(data.metrics.overall.total_followers / data.goals.followers_target) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Engajamento</span>
                          <span>{(data.metrics.overall.engagement_rate || 0).toFixed(1)}% / {data.goals.engagement_target}%</span>
                        </div>
                        <Progress 
                          value={(data.metrics.overall.engagement_rate / data.goals.engagement_target) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Alcance Mensal</span>
                          <span>{((data.metrics.overall.weekly_reach || 0) * 4).toLocaleString()} / {data.goals.reach_target.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(((data.metrics.overall.weekly_reach || 0) * 4) / data.goals.reach_target) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          📊 Fonte: {data.metrics.overall.reach_source || 'Calculando...'}
                        </p>
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
                  {data.metrics && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{data.metrics.facebook.followers.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Seguidores</p>
                        <p className="text-xs text-emerald-600 font-medium">+{data.metrics.facebook.growth_7d.toFixed(1)}% esta semana</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{(data.metrics.facebook.reach || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Alcance Orgânico</p>
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
                  {data.metrics && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                        <p className="text-2xl font-bold text-pink-600">{data.metrics.instagram.followers.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Seguidores</p>
                        <p className="text-xs text-emerald-600 font-medium">+{data.metrics.instagram.growth_7d.toFixed(1)}% esta semana</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                        <p className="text-2xl font-bold text-pink-600">{(data.metrics.instagram.reach || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Alcance Orgânico</p>
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
                  {data.campaigns && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-600">{data.campaigns.active_campaigns}</p>
                        <p className="text-sm text-gray-600 font-medium">Campanhas Ativas</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-600">{data.campaigns.campaign_reach.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 font-medium">Alcance Total</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.campaigns.cost_per_click)}</p>
                        <p className="text-sm text-gray-600 font-medium">Custo por Clique</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <p className="text-2xl font-bold text-purple-600">{data.campaigns.roi.toFixed(1)}%</p>
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
                  {data.campaigns && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                        <span className="text-sm font-medium text-gray-700">Cliques Total</span>
                        <span className="text-lg font-bold text-amber-600">{data.campaigns.campaign_clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-gray-700">Taxa de Conversão</span>
                        <span className="text-lg font-bold text-green-600">{data.campaigns.conversion_rate.toFixed(1)}%</span>
                      </div>
                      {data.campaigns.active_campaigns === 0 && (
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

                     {/* Campanhas Avançadas */}
           <TabsContent value="campaignsadv" className="space-y-6">
             {data.campaignsAdvanced ? (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Total de Campanhas</h3>
                       <div className="flex items-baseline gap-2">
                         <p className="text-3xl font-bold text-blue-600">{data.campaignsAdvanced.summary?.total_campaigns || 0}</p>
                         <div className="text-xs text-gray-500">
                           <div>✅ {data.campaignsAdvanced.summary?.active_campaigns || 0} ativas</div>
                           <div>⏸️ {data.campaignsAdvanced.summary?.paused_campaigns || 0} pausadas</div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Gasto Total (30d)</h3>
                       <p className="text-3xl font-bold text-red-600">{formatCurrency(data.campaignsAdvanced.summary?.total_spend_30d || 0)}</p>
                       <p className="text-xs text-gray-500 mt-1">
                         {data.campaignsAdvanced.summary?.total_clicks_30d || 0} cliques
                       </p>
                     </CardContent>
                   </Card>
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Impressões (30d)</h3>
                       <p className="text-3xl font-bold text-purple-600">{formatNumber(data.campaignsAdvanced.summary?.total_impressions_30d || 0)}</p>
                       <p className="text-xs text-gray-500 mt-1">
                         {data.campaignsAdvanced.summary?.total_conversions_30d || 0} conversões
                       </p>
                     </CardContent>
                   </Card>
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">ROI Geral</h3>
                       <p className={`text-3xl font-bold ${(data.campaignsAdvanced.summary?.overall_roi || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {(data.campaignsAdvanced.summary?.overall_roi || 0).toFixed(1)}%
                       </p>
                       <p className="text-xs text-gray-500 mt-1">último mês</p>
                     </CardContent>
                   </Card>
                 </div>

                 {data.campaignsAdvanced.campaigns && data.campaignsAdvanced.campaigns.length > 0 && (
                   <Card className="minimal-card">
                     <CardHeader>
                       <CardTitle className="flex items-center justify-between">
                         <span>🚀 Campanhas Detalhadas</span>
                         <Badge variant="outline">
                           {data.campaignsAdvanced.campaigns.length} campanhas
                         </Badge>
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         {data.campaignsAdvanced.campaigns && data.campaignsAdvanced.campaigns.length > 0 ? (
                           data.campaignsAdvanced.campaigns.map((campaign: any) => (
                           <div key={campaign.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex-1">
                                 <h4 className="font-bold text-lg text-gray-900 mb-1">{campaign.name}</h4>
                                 <p className="text-sm text-gray-500">{campaign.account_name}</p>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                   {campaign.status === 'ACTIVE' ? '🟢 ATIVA' : '⏸️ PAUSADA'}
                                 </Badge>
                               </div>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">Impressões</p>
                                 <p className="text-lg font-bold text-gray-900">{formatNumber(campaign.metrics?.impressions || 0)}</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">Cliques</p>
                                 <p className="text-lg font-bold text-blue-600">{formatNumber(campaign.metrics?.clicks || 0)}</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">CTR</p>
                                 <p className="text-lg font-bold text-purple-600">{(campaign.metrics?.ctr || 0).toFixed(2)}%</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">CPC</p>
                                 <p className="text-lg font-bold text-orange-600">{formatCurrency(campaign.metrics?.cpc || 0)}</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">Gasto (30d)</p>
                                 <p className="text-lg font-bold text-red-600">{formatCurrency(campaign.metrics?.spend || 0)}</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">ROI</p>
                                 <p className={`text-lg font-bold ${(campaign.metrics?.roi || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                   {(campaign.metrics?.roi || 0).toFixed(1)}%
                                 </p>
                               </div>
                             </div>
                             
                             {/* Informações adicionais */}
                             <div className="mt-4 pt-4 border-t border-gray-200">
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                 <div className="flex items-center gap-2">
                                   <span className="text-gray-500">📊 Alcance:</span>
                                   <span className="font-semibold text-gray-900">{formatNumber(campaign.metrics?.reach || 0)}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <span className="text-gray-500">🎯 Objetivo:</span>
                                   <span className="font-semibold text-gray-900">{campaign.objective || 'N/A'}</span>
                                 </div>
                                 {(campaign.metrics?.conversions || 0) > 0 && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-gray-500">✅ Conversões:</span>
                                     <span className="font-semibold text-green-600">{campaign.metrics.conversions}</span>
                                   </div>
                                 )}
                                 {(campaign.metrics?.leads || 0) > 0 && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-gray-500">📧 Leads:</span>
                                     <span className="font-semibold text-blue-600">{campaign.metrics.leads}</span>
                                   </div>
                                 )}
                                 {campaign.daily_budget && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-gray-500">💰 Orçamento:</span>
                                     <span className="font-semibold text-purple-600">{formatCurrency(campaign.daily_budget / 100)}/dia</span>
                                   </div>
                                 )}
                                 <div className="flex items-center gap-2">
                                   <span className="text-gray-500">📅 Status:</span>
                                   <span className={`font-semibold ${campaign.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}`}>
                                     {campaign.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                                   </span>
                                 </div>
                               </div>
                             </div>
                           </div>
                           ))
                         ) : (
                           <div className="text-center py-8 text-gray-500">
                             <p>Nenhuma campanha encontrada</p>
                             <p className="text-sm mt-1">Verifique se há campanhas ativas no Meta Ads Manager</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {data.campaignsAdvanced.recommendations && data.campaignsAdvanced.recommendations.length > 0 && (
                   <Card className="minimal-card">
                     <CardHeader>
                       <CardTitle>🤖 Recomendações IA</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-3">
                         {data.campaignsAdvanced.recommendations.map((rec: any, index: number) => (
                           <div key={index} className="border-l-4 border-blue-500 pl-4">
                             <div className="flex items-center gap-2 mb-1">
                               <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                                 {rec.priority}
                               </Badge>
                               <h4 className="font-semibold">{rec.title}</h4>
                             </div>
                             <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                             <p className="text-sm font-medium">💡 {rec.action}</p>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}
               </div>
             ) : (
               <Card className="minimal-card">
                 <CardContent className="text-center py-8">
                   <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold mb-2">Campanhas Avançadas</h3>
                   <p className="text-gray-600">Para ver análises avançadas, conecte uma conta do Meta Business Manager</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

           {/* Análise de Conteúdo */}
           <TabsContent value="content" className="space-y-6">
             {data.contentAnalysis ? (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Posts Instagram</h3>
                       <p className="text-3xl font-bold text-pink-600">{data.contentAnalysis.summary?.total_instagram_posts || 0}</p>
                     </CardContent>
                   </Card>
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Posts Facebook</h3>
                       <p className="text-3xl font-bold text-blue-600">{data.contentAnalysis.summary?.total_facebook_posts || 0}</p>
                     </CardContent>
                   </Card>
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Engajamento IG</h3>
                       <p className="text-3xl font-bold text-red-600">{(data.contentAnalysis.summary?.avg_instagram_engagement || 0).toFixed(1)}%</p>
                     </CardContent>
                   </Card>
                   <Card className="minimal-card">
                     <CardContent className="p-6">
                       <h3 className="text-sm font-medium text-gray-600 mb-2">Top Hashtags</h3>
                       <p className="text-3xl font-bold text-purple-600">{data.contentAnalysis.summary?.top_hashtags?.length || 0}</p>
                     </CardContent>
                   </Card>
                 </div>

                 {data.contentAnalysis.summary?.optimal_times && data.contentAnalysis.summary.optimal_times.length > 0 && (
                   <Card className="minimal-card">
                     <CardHeader>
                       <CardTitle>⏰ Melhores Horários para Postar</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {data.contentAnalysis.summary.optimal_times.map((time: any, index: number) => (
                           <div key={index} className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                             <p className="text-2xl font-bold text-blue-600">{time.hour}:00</p>
                             <p className="text-sm text-gray-600">{time.avg_engagement.toFixed(1)}% engajamento</p>
                             <p className="text-xs text-gray-500">{time.posts_count} posts</p>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {data.contentAnalysis.summary?.top_hashtags && data.contentAnalysis.summary.top_hashtags.length > 0 && (
                   <Card className="minimal-card">
                     <CardHeader>
                       <CardTitle>🏷️ Top Hashtags Performance</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="flex flex-wrap gap-2">
                         {data.contentAnalysis.summary.top_hashtags.slice(0, 10).map((hashtag: any, index: number) => (
                           <Badge key={index} variant="outline" className="text-sm">
                             {hashtag.hashtag} ({hashtag.avg_engagement?.toFixed(1)}%)
                           </Badge>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {data.contentAnalysis.recommendations && data.contentAnalysis.recommendations.length > 0 && (
                   <Card className="minimal-card">
                     <CardHeader>
                       <CardTitle>📝 Recomendações de Conteúdo</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-3">
                         {data.contentAnalysis.recommendations.map((rec: any, index: number) => (
                           <div key={index} className="border-l-4 border-green-500 pl-4">
                             <div className="flex items-center gap-2 mb-1">
                               <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                                 {rec.priority}
                               </Badge>
                               <h4 className="font-semibold">{rec.title}</h4>
                             </div>
                             <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                             <p className="text-sm font-medium">💡 {rec.action}</p>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}
               </div>
             ) : (
               <Card className="minimal-card">
                 <CardContent className="text-center py-8">
                   <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold mb-2">Análise de Conteúdo</h3>
                   <p className="text-gray-600">Para ver análises de conteúdo, é necessário ter posts publicados</p>
                 </CardContent>
               </Card>
             )}
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
                   {data.insights?.content_gap_analysis.map((insight: any, index: number) => (
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
                   {data.insights?.recommended_actions.map((action: any, index: number) => (
                     <InsightCard 
                       key={index} 
                       insight={action} 
                       type="success" 
                     />
                   ))}
                 </CardContent>
               </Card>
             </div>

             {/* Debug Info */}
             {data.debug && (
               <Card className="minimal-card">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-gray-900">
                     <AlertCircle className="w-5 h-5 text-blue-600" />
                     Status dos Dados Coletados
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                       <h4 className="font-semibold text-green-800">📊 Configuração Meta</h4>
                       <p className="text-sm text-green-700">
                         {data.debug.meta_config?.exists ? '✅ Configurada' : '❌ Não configurada'}
                       </p>
                       <p className="text-xs text-green-600">
                         Token: {data.debug.meta_config?.has_token ? 'Ativo' : 'Inativo'}
                       </p>
                     </div>
                     <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                       <h4 className="font-semibold text-blue-800">📱 Registros Instagram</h4>
                       <p className="text-2xl font-bold text-blue-600">
                         {data.debug.database_records?.instagram_records || 0}
                       </p>
                       <p className="text-xs text-blue-600">registros no banco</p>
                     </div>
                     <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                       <h4 className="font-semibold text-purple-800">📘 Registros Facebook</h4>
                       <p className="text-2xl font-bold text-purple-600">
                         {data.debug.database_records?.facebook_records || 0}
                       </p>
                       <p className="text-xs text-purple-600">registros no banco</p>
                     </div>
                   </div>
                   {data.debug.raw_data?.latest_instagram?.real_data && (
                     <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                       <p className="text-sm text-green-800 font-medium">
                         ✅ Dados reais coletados da Meta API - Última coleta: {new Date(data.debug.timestamp).toLocaleString('pt-BR')}
                       </p>
                     </div>
                   )}
                 </CardContent>
               </Card>
             )}
           </TabsContent>
        </Tabs>
      </StandardPageLayout>
    </ProtectedRoute>
  )
} 