import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('üìä Meta Daily Analysis - Iniciando an·°lise di·°ria...')

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || 'all' // all, instagram, facebook
    const days = parseInt(searchParams.get('days') || '30') // quantos dias analisar

    // Obter dados do usu·°rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento

    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`üë§ Usando bar_id: ${barId}`)
      } catch (e) {
        console.log('ö†Ô∏è Erro ao parsear userData, usando barId padr·£o:', e)
      }
    }

    // Calcular datas
    const hoje = new Date()
    const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    const inicioAnalise = new Date(hoje.getTime() - days * 24 * 60 * 60 * 1000)

    console.log(`üìÖ Analisando per·≠odo: ${inicioAnalise.toISOString().split('T')[0]} at·© ${hoje.toISOString().split('T')[0]}`)

    // 1. BUSCAR DADOS INSTAGRAM POR DIA
    let instagramAnalysis: any = null
    if (platform === 'all' || platform === 'instagram') {
      const { data: instagramData, error: instagramError } = await supabase
        .from('meta_instagram_posts')
        .select(`
          id,
          timestamp,
          like_count,
          comments_count,
          impressions_count,
          reach_count,
          saved_count,
          shares_count,
          profile_visits,
          follows,
          website_clicks,
          coletado_em
        `)
        .eq('bar_id', barId)
        .gte('timestamp', inicioAnalise.toISOString())
        .order('timestamp', { ascending: false })

      if (instagramError) {
        console.error('ùå Erro ao buscar Instagram:', instagramError)
      } else {
        instagramAnalysis = processInstagramDailyData(instagramData || [])
      }
    }

    // 2. BUSCAR DADOS FACEBOOK POR DIA
    let facebookAnalysis: any = null
    if (platform === 'all' || platform === 'facebook') {
      const { data: facebookData, error: facebookError } = await supabase
        .from('meta_facebook_posts')
        .select(`
          id,
          created_time,
          reactions_count,
          comments_count,
          shares_count,
          impressions,
          reach,
          clicks,
          coletado_em
        `)
        .eq('bar_id', barId)
        .gte('created_time', inicioAnalise.toISOString())
        .order('created_time', { ascending: false })

      if (facebookError) {
        console.error('ùå Erro ao buscar Facebook:', facebookError)
      } else {
        facebookAnalysis = processFacebookDailyData(facebookData || [])
      }
    }

    // 3. BUSCAR INSIGHTS DI·ÅRIOS (m·©tricas de seguidores)
    const { data: insightsData, error: insightsError } = await supabase
      .from('meta_insights')
      .select('*')
      .eq('bar_id', barId)
      .gte('date', inicioAnalise.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (insightsError) {
      console.error('ùå Erro ao buscar insights:', insightsError)
    }

    const insightsAnalysis = processInsightsDailyData(insightsData || [])

    // 4. CALCULAR VARIA·á·ïES GERAIS
    const dailyVariations = calculateDailyVariations({
      instagram: instagramAnalysis,
      facebook: facebookAnalysis,
      insights: insightsAnalysis
    })

    // 5. IDENTIFICAR TEND·äNCIAS E INSIGHTS
    const trends = identifyTrends(dailyVariations, days)

    const responseData = {
      success: true,
      data: {
        period: {
          start_date: inicioAnalise.toISOString().split('T')[0],
          end_date: hoje.toISOString().split('T')[0],
          days_analyzed: days
        },
        daily_variations: dailyVariations,
        platform_analysis: {
          instagram: instagramAnalysis,
          facebook: facebookAnalysis,
          insights: insightsAnalysis
        },
        trends_and_insights: trends,
        summary: {
          total_posts_period: (instagramAnalysis?.total_posts || 0) + (facebookAnalysis?.total_posts || 0),
          avg_daily_engagement: dailyVariations.avg_daily_engagement,
          follower_growth: dailyVariations.follower_growth_total,
          best_performing_day: dailyVariations.best_day,
          worst_performing_day: dailyVariations.worst_day
        }
      },
      debug: {
        bar_id: barId,
        platform,
        days_requested: days,
        instagram_posts_found: instagramAnalysis?.total_posts || 0,
        facebook_posts_found: facebookAnalysis?.total_posts || 0,
        insights_records: insightsData?.length || 0
      }
    }

    console.log('úÖ Meta Daily Analysis - An·°lise conclu·≠da:', {
      days_analyzed: days,
      variations_calculated: Object.keys(dailyVariations).length,
      trends_identified: trends.length
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('ùå Erro na an·°lise di·°ria Meta:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Processar dados Instagram agrupados por dia
function processInstagramDailyData(data: any[]) {
  const dailyMetrics: Record<string, any> = {}
  
  data.forEach(post => {
    const date = post.timestamp.split('T')[0]
    
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        posts_count: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        total_impressions: 0,
        total_reach: 0,
        total_saves: 0,
        total_profile_visits: 0,
        total_follows: 0,
        total_website_clicks: 0
      }
    }
    
    dailyMetrics[date].posts_count++
    dailyMetrics[date].total_likes += post.like_count || 0
    dailyMetrics[date].total_comments += post.comments_count || 0
    dailyMetrics[date].total_shares += post.shares_count || 0
    dailyMetrics[date].total_impressions += post.impressions_count || 0
    dailyMetrics[date].total_reach += post.reach_count || 0
    dailyMetrics[date].total_saves += post.saved_count || 0
    dailyMetrics[date].total_profile_visits += post.profile_visits || 0
    dailyMetrics[date].total_follows += post.follows || 0
    dailyMetrics[date].total_website_clicks += post.website_clicks || 0
  })

  // Calcular engagement rate por dia
  Object.keys(dailyMetrics).forEach(date => {
    const day = dailyMetrics[date]
    day.engagement_rate = day.total_impressions > 0 
      ? ((day.total_likes + day.total_comments + day.total_shares) / day.total_impressions * 100)
      : 0
  })

  return {
    daily_metrics: dailyMetrics,
    total_posts: data.length,
    date_range: {
      first: data.length > 0 ? data[data.length - 1].timestamp.split('T')[0] : null,
      last: data.length > 0 ? data[0].timestamp.split('T')[0] : null
    }
  }
}

// Processar dados Facebook agrupados por dia
function processFacebookDailyData(data: any[]) {
  const dailyMetrics: Record<string, any> = {}
  
  data.forEach(post => {
    const date = post.created_time.split('T')[0]
    
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        posts_count: 0,
        total_reactions: 0,
        total_comments: 0,
        total_shares: 0,
        total_impressions: 0,
        total_reach: 0,
        total_clicks: 0
      }
    }
    
    dailyMetrics[date].posts_count++
    dailyMetrics[date].total_reactions += post.reactions_count || 0
    dailyMetrics[date].total_comments += post.comments_count || 0
    dailyMetrics[date].total_shares += post.shares_count || 0
    dailyMetrics[date].total_impressions += post.impressions || 0
    dailyMetrics[date].total_reach += post.reach || 0
    dailyMetrics[date].total_clicks += post.clicks || 0
  })

  // Calcular engagement rate por dia
  Object.keys(dailyMetrics).forEach(date => {
    const day = dailyMetrics[date]
    day.engagement_rate = day.total_impressions > 0 
      ? ((day.total_reactions + day.total_comments + day.total_shares) / day.total_impressions * 100)
      : 0
  })

  return {
    daily_metrics: dailyMetrics,
    total_posts: data.length,
    date_range: {
      first: data.length > 0 ? data[data.length - 1].created_time.split('T')[0] : null,
      last: data.length > 0 ? data[0].created_time.split('T')[0] : null
    }
  }
}

// Processar insights (dados de seguidores) por dia
function processInsightsDailyData(data: any[]) {
  const dailyInsights: Record<string, any> = {}
  
  data.forEach(insight => {
    const date = insight.date
    dailyInsights[date] = {
      followers_instagram: insight.followers_count || 0,
      followers_facebook: insight.page_fans || 0,
      impressions_instagram: insight.impressions || 0,
      reach_instagram: insight.reach || 0,
      profile_visits: insight.profile_visits || 0,
      website_clicks: insight.website_clicks || 0
    }
  })

  return {
    daily_insights: dailyInsights,
    total_records: data.length
  }
}

// Calcular varia·ß·µes di·°rias
function calculateDailyVariations(data: any) {
  const variations: any = {
    daily_changes: {},
    avg_daily_engagement: 0,
    follower_growth_total: 0,
    best_day: null,
    worst_day: null
  }

  // Combinar todas as datas dispon·≠veis
  const allDates = new Set<string>()
  
  if (data.instagram?.daily_metrics) {
    Object.keys(data.instagram.daily_metrics).forEach(date => allDates.add(date))
  }
  if (data.facebook?.daily_metrics) {
    Object.keys(data.facebook.daily_metrics).forEach(date => allDates.add(date))
  }
  if (data.insights?.daily_insights) {
    Object.keys(data.insights.daily_insights).forEach(date => allDates.add(date))
  }

  const sortedDates = Array.from(allDates).sort()

  // Calcular varia·ß·µes dia a dia
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i]
    const previousDate = sortedDates[i - 1]

    const currentDay: any = {
      date: currentDate,
      instagram: data.instagram?.daily_metrics?.[currentDate] || {},
      facebook: data.facebook?.daily_metrics?.[currentDate] || {},
      insights: data.insights?.daily_insights?.[currentDate] || {}
    }

    const previousDay: any = {
      instagram: data.instagram?.daily_metrics?.[previousDate] || {},
      facebook: data.facebook?.daily_metrics?.[previousDate] || {},
      insights: data.insights?.daily_insights?.[previousDate] || {}
    }

    // Calcular varia·ß·£o de seguidores
    const followerChange = {
      instagram: (currentDay.insights.followers_instagram || 0) - (previousDay.insights.followers_instagram || 0),
      facebook: (currentDay.insights.followers_facebook || 0) - (previousDay.insights.followers_facebook || 0)
    }

    // Calcular engagement total do dia
    const totalEngagement = (currentDay.instagram.engagement_rate || 0) + (currentDay.facebook.engagement_rate || 0)

    variations.daily_changes[currentDate] = {
      follower_change: followerChange,
      total_follower_change: followerChange.instagram + followerChange.facebook,
      engagement_rate: totalEngagement,
      posts_published: (currentDay.instagram.posts_count || 0) + (currentDay.facebook.posts_count || 0),
      total_interactions: (currentDay.instagram.total_likes || 0) + (currentDay.instagram.total_comments || 0) + 
                          (currentDay.facebook.total_reactions || 0) + (currentDay.facebook.total_comments || 0)
    }
  }

  // Calcular m·©tricas agregadas
  const dailyChanges = Object.values(variations.daily_changes) as any[]
  if (dailyChanges.length > 0) {
    variations.avg_daily_engagement = dailyChanges.reduce((sum: number, day: any) => sum + day.engagement_rate, 0) / dailyChanges.length
    variations.follower_growth_total = dailyChanges.reduce((sum: number, day: any) => sum + day.total_follower_change, 0)
    
    // Melhor e pior dia (baseado em engagement + intera·ß·µes)
    const sortedByPerformance = dailyChanges.sort((a, b) => 
      (b.engagement_rate + b.total_interactions) - (a.engagement_rate + a.total_interactions)
    )
    variations.best_day = sortedByPerformance[0]?.date
    variations.worst_day = sortedByPerformance[sortedByPerformance.length - 1]?.date
  }

  return variations
}

// Identificar tend·™ncias
function identifyTrends(variations: any, days: number): any[] {
  const trends = []

  // Tend·™ncia de crescimento de seguidores
  if (variations.follower_growth_total > 0) {
    trends.push({
      type: 'positive',
      category: 'followers',
      title: 'Crescimento de Seguidores',
      description: `Ganhou ${variations.follower_growth_total} seguidores nos ·∫ltimos ${days} dias`,
      value: variations.follower_growth_total,
      recommendation: 'Continue com a estrat·©gia atual de conte·∫do'
    })
  } else if (variations.follower_growth_total < 0) {
    trends.push({
      type: 'negative',
      category: 'followers',
      title: 'Perda de Seguidores',
      description: `Perdeu ${Math.abs(variations.follower_growth_total)} seguidores nos ·∫ltimos ${days} dias`,
      value: variations.follower_growth_total,
      recommendation: 'Revisar estrat·©gia de conte·∫do e engajamento'
    })
  }

  // Tend·™ncia de engagement
  if (variations.avg_daily_engagement > 4) {
    trends.push({
      type: 'positive',
      category: 'engagement',
      title: 'Alto Engajamento',
      description: `Taxa m·©dia de engajamento de ${variations.avg_daily_engagement.toFixed(1)}%`,
      value: variations.avg_daily_engagement,
      recommendation: 'Excelente! Mantenha o tipo de conte·∫do que est·° funcionando'
    })
  } else if (variations.avg_daily_engagement < 2) {
    trends.push({
      type: 'warning',
      category: 'engagement',
      title: 'Engajamento Baixo',
      description: `Taxa m·©dia de engajamento de apenas ${variations.avg_daily_engagement.toFixed(1)}%`,
      value: variations.avg_daily_engagement,
      recommendation: 'Considere variar tipos de conte·∫do e hor·°rios de postagem'
    })
  }

  return trends
} 
