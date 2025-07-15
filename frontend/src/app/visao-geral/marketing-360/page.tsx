'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Loader2
} from 'lucide-react'

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
  last_update: string
}

export default function Marketing360Page() {
  const { toast } = useToast()
  const { setPageTitle } = usePageTitle()
  
  const [data, setData] = useState<MetaAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setPageTitle('Marketing 360° - Visão Geral')
    loadAnalytics()
    return () => setPageTitle('')
  }, [setPageTitle])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meta/analytics')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar dados do Meta',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const forceRefresh = async () => {
    try {
      setRefreshing(true)
      
      toast({
        title: '🔄 Atualizando...',
        description: 'Coletando dados mais recentes do Meta'
      })
      
      const response = await fetch('/api/meta/force-sync', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '✅ Atualizado!',
          description: result.message
        })
        
        // Aguardar um pouco e recarregar dados
        setTimeout(() => {
          loadAnalytics()
        }, 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Falha ao atualizar dados',
        variant: 'destructive'
      })
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString('pt-BR')
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
  const campaigns = data?.campaigns

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing 360°</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análise completa das suas redes sociais e campanhas publicitárias
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data?.last_update && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Atualizado: {new Date(data.last_update).toLocaleString('pt-BR')}</span>
              </div>
            )}
            <Button 
              onClick={forceRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {refreshing ? 'Atualizando...' : 'Forçar Atualização'}
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Facebook */}
          <Card className="card-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facebook</CardTitle>
              <Facebook className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(fb?.page_fans || 0)}</div>
              <p className="text-xs text-muted-foreground">Seguidores</p>
              <div className="flex items-center text-xs mt-2">
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-500">+{fb?.talking_about_count || 0} falando sobre</span>
              </div>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card className="card-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(ig?.follower_count || 0)}</div>
              <p className="text-xs text-muted-foreground">Seguidores</p>
              <div className="flex items-center text-xs mt-2">
                <Eye className="w-3 h-3 text-blue-500 mr-1" />
                <span className="text-blue-500">{formatNumber(ig?.profile_views || 0)} visualizações</span>
              </div>
            </CardContent>
          </Card>

          {/* Campanhas */}
          <Card className="card-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns?.stats?.total_campaigns || 0}</div>
              <p className="text-xs text-muted-foreground">Campanhas ativas</p>
              <div className="flex items-center text-xs mt-2">
                <Zap className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-500">{campaigns?.stats?.active_campaigns || 0} rodando</span>
              </div>
            </CardContent>
          </Card>

          {/* Investimento */}
          <Card className="card-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimento</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(campaigns?.stats?.total_spend || 0)}</div>
              <p className="text-xs text-muted-foreground">Gasto total (mês)</p>
              <div className="flex items-center text-xs mt-2">
                <BarChart3 className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-yellow-500">{formatNumber(campaigns?.stats?.total_impressions || 0)} impressões</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="tabs-list-dark">
            <TabsTrigger value="overview" className="tabs-trigger-dark">Visão Geral</TabsTrigger>
            <TabsTrigger value="campaigns" className="tabs-trigger-dark">Campanhas</TabsTrigger>
            <TabsTrigger value="social" className="tabs-trigger-dark">Redes Sociais</TabsTrigger>
            <TabsTrigger value="analytics" className="tabs-trigger-dark">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Geral */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">Performance Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Alcance Total</span>
                    <span className="font-medium">{formatNumber((ig?.reach || 0) + (fb?.page_reach || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Impressões</span>
                    <span className="font-medium">{formatNumber((ig?.impressions || 0) + (fb?.page_impressions || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engajamento</span>
                    <span className="font-medium">{formatNumber((ig?.posts_likes || 0) + (fb?.post_likes || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cliques no Site</span>
                    <span className="font-medium">{formatNumber(ig?.website_clicks || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Campanhas */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">Top 5 Campanhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns?.stats?.top_campaigns?.map((campaign: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{campaign.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>{formatNumber(campaign.impressions)} impressões</span>
                            <span>{campaign.clicks} cliques</span>
                            {campaign.status === 'ACTIVE' ? (
                              <Badge className="badge-success">Ativa</Badge>
                            ) : (
                              <Badge variant="secondary">Pausada</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(campaign.spend)}</p>
                          {campaign.cpc > 0 && (
                            <p className="text-xs text-gray-500">CPC: {formatCurrency(campaign.cpc)}</p>
                          )}
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">Nenhuma campanha encontrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campanhas */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Todas as Campanhas ({campaigns?.list?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nome</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Gasto</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Impressões</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Alcance</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Cliques</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">CTR</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">CPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns?.list?.map((campaign: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{campaign.campaign_name}</p>
                              <p className="text-xs text-gray-500">{campaign.objective}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {campaign.effective_status === 'ACTIVE' ? (
                              <Badge className="badge-success">Ativa</Badge>
                            ) : campaign.effective_status === 'PAUSED' ? (
                              <Badge className="badge-warning">Pausada</Badge>
                            ) : (
                              <Badge variant="secondary">{campaign.effective_status}</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(parseFloat(campaign.spend || 0))}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(parseInt(campaign.impressions || 0))}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(parseInt(campaign.reach || 0))}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(parseInt(campaign.clicks || 0))}</td>
                          <td className="py-3 px-4 text-right">{(parseFloat(campaign.ctr || 0)).toFixed(2)}%</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(parseFloat(campaign.cpc || 0))}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">
                            Nenhuma campanha encontrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redes Sociais */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facebook */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    Facebook
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Seguidores</p>
                      <p className="text-2xl font-bold">{formatNumber(fb?.page_fans || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Falando sobre</p>
                      <p className="text-2xl font-bold">{formatNumber(fb?.talking_about_count || 0)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Alcance da página</span>
                      <span className="font-medium">{formatNumber(fb?.page_reach || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Impressões</span>
                      <span className="font-medium">{formatNumber(fb?.page_impressions || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Likes nos posts</span>
                      <span className="font-medium">{formatNumber(fb?.post_likes || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Comentários</span>
                      <span className="font-medium">{formatNumber(fb?.post_comments || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Check-ins</span>
                      <span className="font-medium">{formatNumber(fb?.checkins || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instagram */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-600" />
                    Instagram
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Seguidores</p>
                      <p className="text-2xl font-bold">{formatNumber(ig?.follower_count || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                      <p className="text-2xl font-bold">{formatNumber(ig?.media_count || 0)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Alcance</span>
                      <span className="font-medium">{formatNumber(ig?.reach || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Impressões</span>
                      <span className="font-medium">{formatNumber(ig?.impressions || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Visualizações do perfil</span>
                      <span className="font-medium">{formatNumber(ig?.profile_views || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cliques no site</span>
                      <span className="font-medium">{formatNumber(ig?.website_clicks || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Likes nos posts</span>
                      <span className="font-medium">{formatNumber(ig?.posts_likes || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Métricas de Campanhas */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">Métricas de Campanhas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total de campanhas</span>
                    <span className="font-bold">{campaigns?.stats?.total_campaigns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Campanhas ativas</span>
                    <span className="font-bold text-green-600">{campaigns?.stats?.active_campaigns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Gasto total</span>
                    <span className="font-bold">{formatCurrency(campaigns?.stats?.total_spend || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Impressões totais</span>
                    <span className="font-bold">{formatNumber(campaigns?.stats?.total_impressions || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cliques totais</span>
                    <span className="font-bold">{formatNumber(campaigns?.stats?.total_clicks || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">CPM médio</span>
                    <span className="font-bold">
                      {campaigns?.stats?.total_impressions > 0 
                        ? formatCurrency((campaigns.stats.total_spend / campaigns.stats.total_impressions) * 1000)
                        : 'R$ 0,00'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Engajamento */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">Engajamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Likes (FB + IG)</span>
                    <span className="font-bold">{formatNumber((fb?.post_likes || 0) + (ig?.posts_likes || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Comentários (FB + IG)</span>
                    <span className="font-bold">{formatNumber((fb?.post_comments || 0) + (ig?.posts_comments || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compartilhamentos (FB)</span>
                    <span className="font-bold">{formatNumber(fb?.post_shares || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Saves (IG)</span>
                    <span className="font-bold">{formatNumber(ig?.posts_saves || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de engajamento</span>
                    <span className="font-bold">
                      {((fb?.post_likes || 0) + (ig?.posts_likes || 0) + (fb?.post_comments || 0) + (ig?.posts_comments || 0)) > 0 &&
                       ((fb?.page_fans || 0) + (ig?.follower_count || 0)) > 0
                        ? (((fb?.post_likes || 0) + (ig?.posts_likes || 0) + (fb?.post_comments || 0) + (ig?.posts_comments || 0)) / 
                           ((fb?.page_fans || 0) + (ig?.follower_count || 0)) * 100).toFixed(2) + '%'
                        : '0%'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Alcance e Impressões */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">Alcance & Impressões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Alcance Facebook</span>
                    <span className="font-bold">{formatNumber(fb?.page_reach || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Alcance Instagram</span>
                    <span className="font-bold">{formatNumber(ig?.reach || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Impressões Facebook</span>
                    <span className="font-bold">{formatNumber(fb?.page_impressions || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Impressões Instagram</span>
                    <span className="font-bold">{formatNumber(ig?.impressions || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Alcance das Campanhas</span>
                    <span className="font-bold">{formatNumber(campaigns?.stats?.total_reach || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Alcance Total</span>
                    <span className="font-bold text-blue-600">
                      {formatNumber((fb?.page_reach || 0) + (ig?.reach || 0) + (campaigns?.stats?.total_reach || 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 