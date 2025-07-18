import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€œÅ  Meta Daily Analysis - Iniciando anÃ¡Â¡lise diÃ¡Â¡ria...')

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || 'all' // all, instagram, facebook
    const days = parseInt(searchParams.get('days') || '30') // quantos dias analisar

    // Obter dados do usuÃ¡Â¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento

    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData) as unknown)
        barId = parsedUser.bar_id || 3
        console.log(`Ã°Å¸â€˜Â¤ Usando bar_id: ${barId}`)
      } catch (e) {
        console.log('Å¡Â Ã¯Â¸Â Erro ao parsear userData, usando barId padrÃ¡Â£o:', e)
      }
    }

    // Calcular datas
    const hoje = new Date()
    const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    const inicioAnalise = new Date(hoje.getTime() - days * 24 * 60 * 60 * 1000)

    console.log(`Ã°Å¸â€œâ€¦ Analisando perÃ¡Â­odo: ${inicioAnalise.toISOString().split('T')[0]} atÃ¡Â© ${hoje.toISOString().split('T')[0]}`)

    // 1. BUSCAR DADOS INSTAGRAM POR DIA
    let instagramAnalysis: { daily_metrics: Record<string, InstagramDailyMetrics>; total_posts: number; date_range: { first: string | null; last: string | null } } = { daily_metrics: {}, total_posts: 0, date_range: { first: null, last: null } };
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
        console.error('ÂÅ’ Erro ao buscar Instagram:', instagramError)
      } else {
        instagramAnalysis = processInstagramDailyData(instagramData || [])
      }
    }

    // 2. BUSCAR DADOS FACEBOOK POR DIA
    let facebookAnalysis: { daily_metrics: Record<string, FacebookDailyMetrics>; total_posts: number; date_range: { first: string | null; last: string | null } } = { daily_metrics: {}, total_posts: 0, date_range: { first: null, last: null } };
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
        console.error('ÂÅ’ Erro ao buscar Facebook:', facebookError)
      } else {
        facebookAnalysis = processFacebookDailyData(facebookData || [])
      }
    }

    // 3. BUSCAR INSIGHTS DIÃ¡ÂRIOS (mÃ¡Â©tricas de seguidores)
    const { data: insightsData, error: insightsError } = await supabase
      .from('meta_insights')
      .select('*')
      .eq('bar_id', barId)
      .gte('date', inicioAnalise.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (insightsError) {
      console.error('ÂÅ’ Erro ao buscar insights:', insightsError)
    }

    const insightsAnalysis = processInsightsDailyData(insightsData || [])

    // 4. CALCULAR VARIAÃ¡â€¡Ã¡â€¢ES GERAIS
    const dailyVariations = calculateDailyVariations({
      instagram: instagramAnalysis,
      facebook: facebookAnalysis,
      insights: insightsAnalysis
    })

    // 5. IDENTIFICAR TENDÃ¡Å NCIAS E INSIGHTS
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

    console.log('Å“â€¦ Meta Daily Analysis - AnÃ¡Â¡lise concluÃ¡Â­da:', {
      days_analyzed: days,
      variations_calculated: Object.keys(dailyVariations).length,
      trends_identified: trends.length
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('ÂÅ’ Erro na anÃ¡Â¡lise diÃ¡Â¡ria Meta:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Tipos auxiliares para posts e insights
interface InstagramPost {
  id: number;
  timestamp: string;
  like_count: number;
  comments_count: number;
  impressions_count: number;
  reach_count: number;
  saved_count: number;
  shares_count: number;
  profile_visits: number;
  follows: number;
  website_clicks: number;
  coletado_em: string;
}

interface FacebookPost {
  id: number;
  created_time: string;
  reactions_count: number;
  comments_count: number;
  shares_count: number;
  impressions: number;
  reach: number;
  clicks: number;
  coletado_em: string;
}

interface Insight {
  date: string;
  followers_count: number;
  page_fans: number;
  impressions: number;
  reach: number;
  profile_visits: number;
  website_clicks: number;
}

interface InstagramDailyMetrics {
  posts_count: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_impressions: number;
  total_reach: number;
  total_saves: number;
  total_profile_visits: number;
  total_follows: number;
  total_website_clicks: number;
  engagement_rate?: number;
}

interface FacebookDailyMetrics {
  posts_count: number;
  total_reactions: number;
  total_comments: number;
  total_shares: number;
  total_impressions: number;
  total_reach: number;
  total_clicks: number;
  engagement_rate?: number;
}

interface DailyInsights {
  followers_instagram: number;
  followers_facebook: number;
  impressions_instagram: number;
  reach_instagram: number;
  profile_visits: number;
  website_clicks: number;
}

interface DailyVariation {
  follower_change: { instagram: number; facebook: number };
  total_follower_change: number;
  engagement_rate: number;
  posts_published: number;
  total_interactions: number;
  date?: string;
}

interface Variations {
  daily_changes: Record<string, DailyVariation>;
  avg_daily_engagement: number;
  follower_growth_total: number;
  best_day: string | null;
  worst_day: string | null;
}

// Processar dados Instagram agrupados por dia
function processInstagramDailyData(data: InstagramPost[]): {
  daily_metrics: Record<string, InstagramDailyMetrics>;
  total_posts: number;
  date_range: { first: string | null; last: string | null };
} {
  const dailyMetrics: Record<string, InstagramDailyMetrics> = {};
  data.forEach((post: InstagramPost) => {
    const date = post.timestamp.split('T')[0];
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
      };
    }
    dailyMetrics[date].posts_count++;
    dailyMetrics[date].total_likes += post.like_count || 0;
    dailyMetrics[date].total_comments += post.comments_count || 0;
    dailyMetrics[date].total_shares += post.shares_count || 0;
    dailyMetrics[date].total_impressions += post.impressions_count || 0;
    dailyMetrics[date].total_reach += post.reach_count || 0;
    dailyMetrics[date].total_saves += post.saved_count || 0;
    dailyMetrics[date].total_profile_visits += post.profile_visits || 0;
    dailyMetrics[date].total_follows += post.follows || 0;
    dailyMetrics[date].total_website_clicks += post.website_clicks || 0;
  });
  Object.keys(dailyMetrics).forEach(date => {
    const day: InstagramDailyMetrics = dailyMetrics[date];
    day.engagement_rate = day.total_impressions > 0
      ? ((day.total_likes + day.total_comments + day.total_shares) / day.total_impressions * 100)
      : 0;
  });
  return {
    daily_metrics: dailyMetrics,
    total_posts: data.length,
    date_range: {
      first: data.length > 0 ? data[data.length - 1].timestamp.split('T')[0] : null,
      last: data.length > 0 ? data[0].timestamp.split('T')[0] : null
    }
  };
}

// Processar dados Facebook agrupados por dia
function processFacebookDailyData(data: FacebookPost[]): {
  daily_metrics: Record<string, FacebookDailyMetrics>;
  total_posts: number;
  date_range: { first: string | null; last: string | null };
} {
  const dailyMetrics: Record<string, FacebookDailyMetrics> = {};
  data.forEach((post: FacebookPost) => {
    const date = post.created_time.split('T')[0];
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        posts_count: 0,
        total_reactions: 0,
        total_comments: 0,
        total_shares: 0,
        total_impressions: 0,
        total_reach: 0,
        total_clicks: 0
      };
    }
    dailyMetrics[date].posts_count++;
    dailyMetrics[date].total_reactions += post.reactions_count || 0;
    dailyMetrics[date].total_comments += post.comments_count || 0;
    dailyMetrics[date].total_shares += post.shares_count || 0;
    dailyMetrics[date].total_impressions += post.impressions || 0;
    dailyMetrics[date].total_reach += post.reach || 0;
    dailyMetrics[date].total_clicks += post.clicks || 0;
  });
  Object.keys(dailyMetrics).forEach(date => {
    const day: FacebookDailyMetrics = dailyMetrics[date];
    day.engagement_rate = day.total_impressions > 0
      ? ((day.total_reactions + day.total_comments + day.total_shares) / day.total_impressions * 100)
      : 0;
  });
  return {
    daily_metrics: dailyMetrics,
    total_posts: data.length,
    date_range: {
      first: data.length > 0 ? data[data.length - 1].created_time.split('T')[0] : null,
      last: data.length > 0 ? data[0].created_time.split('T')[0] : null
    }
  };
}

// Processar insights (dados de seguidores) por dia
function processInsightsDailyData(data: Insight[]): {
  daily_insights: Record<string, DailyInsights>;
  total_records: number;
} {
  const dailyInsights: Record<string, DailyInsights> = {};
  data.forEach((insight: Insight) => {
    const date = insight.date;
    dailyInsights[date] = {
      followers_instagram: insight.followers_count || 0,
      followers_facebook: insight.page_fans || 0,
      impressions_instagram: insight.impressions || 0,
      reach_instagram: insight.reach || 0,
      profile_visits: insight.profile_visits || 0,
      website_clicks: insight.website_clicks || 0
    };
  });
  return {
    daily_insights: dailyInsights,
    total_records: data.length
  };
}

// Calcular variaÃ¡Â§Ã¡Âµes diÃ¡Â¡rias
function calculateDailyVariations(data: {
  instagram?: { daily_metrics: Record<string, InstagramDailyMetrics> };
  facebook?: { daily_metrics: Record<string, FacebookDailyMetrics> };
  insights?: { daily_insights: Record<string, DailyInsights> };
}): Variations {
  const variations: Variations = {
    daily_changes: {},
    avg_daily_engagement: 0,
    follower_growth_total: 0,
    best_day: null,
    worst_day: null
  };
  const allDates = new Set<string>();
  if (data.instagram?.daily_metrics) {
    Object.keys(data.instagram.daily_metrics).forEach(date => allDates.add(date));
  }
  if (data.facebook?.daily_metrics) {
    Object.keys(data.facebook.daily_metrics).forEach(date => allDates.add(date));
  }
  if (data.insights?.daily_insights) {
    Object.keys(data.insights.daily_insights).forEach(date => allDates.add(date));
  }
  const sortedDates = Array.from(allDates).sort();
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    const previousDate = sortedDates[i - 1];
    const currentDay = {
      date: currentDate,
      instagram: (data.instagram?.daily_metrics?.[currentDate] ?? {}) as Partial<InstagramDailyMetrics>,
      facebook: (data.facebook?.daily_metrics?.[currentDate] ?? {}) as Partial<FacebookDailyMetrics>,
      insights: (data.insights?.daily_insights?.[currentDate] ?? {}) as Partial<DailyInsights>
    };
    const previousDay = {
      instagram: (data.instagram?.daily_metrics?.[previousDate] ?? {}) as Partial<InstagramDailyMetrics>,
      facebook: (data.facebook?.daily_metrics?.[previousDate] ?? {}) as Partial<FacebookDailyMetrics>,
      insights: (data.insights?.daily_insights?.[previousDate] ?? {}) as Partial<DailyInsights>
    };
    const followerChange = {
      instagram: (currentDay.insights.followers_instagram ?? 0) - (previousDay.insights.followers_instagram ?? 0),
      facebook: (currentDay.insights.followers_facebook ?? 0) - (previousDay.insights.followers_facebook ?? 0)
    };
    const totalEngagement = (currentDay.instagram.engagement_rate ?? 0) + (currentDay.facebook.engagement_rate ?? 0);
    variations.daily_changes[currentDate] = {
      follower_change: followerChange,
      total_follower_change: followerChange.instagram + followerChange.facebook,
      engagement_rate: totalEngagement,
      posts_published: (currentDay.instagram.posts_count ?? 0) + (currentDay.facebook.posts_count ?? 0),
      total_interactions: (currentDay.instagram.total_likes ?? 0) + (currentDay.instagram.total_comments ?? 0) +
        (currentDay.facebook.total_reactions ?? 0) + (currentDay.facebook.total_comments ?? 0),
      date: currentDate
    };
  }
  const dailyChanges: DailyVariation[] = Object.values(variations.daily_changes);
  if (dailyChanges.length > 0) {
    variations.avg_daily_engagement = dailyChanges.reduce((sum: number, day: DailyVariation) => sum + day.engagement_rate, 0) / dailyChanges.length;
    variations.follower_growth_total = dailyChanges.reduce((sum: number, day: DailyVariation) => sum + day.total_follower_change, 0);
    const sortedByPerformance = dailyChanges.slice().sort((a: DailyVariation, b: DailyVariation) =>
      (b.engagement_rate + b.total_interactions) - (a.engagement_rate + a.total_interactions)
    );
    variations.best_day = sortedByPerformance[0]?.date || null;
    variations.worst_day = sortedByPerformance[sortedByPerformance.length - 1]?.date || null;
  }
  return variations;
}

interface Trend {
  type: 'positive' | 'negative' | 'warning';
  category: string;
  title: string;
  description: string;
  value: number;
  recommendation: string;
}

function identifyTrends(variations: Variations, days: number): Trend[] {
  const trends: Trend[] = [];
  if (variations.follower_growth_total > 0) {
    trends.push({
      type: 'positive',
      category: 'followers',
      title: 'Crescimento de Seguidores',
      description: `Ganhou ${variations.follower_growth_total} seguidores nos Ãºltimos ${days} dias`,
      value: variations.follower_growth_total,
      recommendation: 'Continue com a estratÃ©gia atual de conteÃºdo'
    });
  } else if (variations.follower_growth_total < 0) {
    trends.push({
      type: 'negative',
      category: 'followers',
      title: 'Perda de Seguidores',
      description: `Perdeu ${Math.abs(variations.follower_growth_total)} seguidores nos Ãºltimos ${days} dias`,
      value: variations.follower_growth_total,
      recommendation: 'Revisar estratÃ©gia de conteÃºdo e engajamento'
    });
  }
  if (variations.avg_daily_engagement > 4) {
    trends.push({
      type: 'positive',
      category: 'engagement',
      title: 'Alto Engajamento',
      description: `Taxa mÃ©dia de engajamento de ${variations.avg_daily_engagement.toFixed(1)}%`,
      value: variations.avg_daily_engagement,
      recommendation: 'Excelente! Mantenha o tipo de conteÃºdo que estÃ¡ funcionando'
    });
  } else if (variations.avg_daily_engagement < 2) {
    trends.push({
      type: 'warning',
      category: 'engagement',
      title: 'Engajamento Baixo',
      description: `Taxa mÃ©dia de engajamento de apenas ${variations.avg_daily_engagement.toFixed(1)}%`,
      value: variations.avg_daily_engagement,
      recommendation: 'Considere variar tipos de conteÃºdo e horÃ¡rios de postagem'
    });
  }
  return trends;
} 

