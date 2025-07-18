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
    console.log('?? Meta Daily Summary - Buscando dados consolidados...')

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Obter dados do usuÃ¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento

    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData) as unknown)
        barId = parsedUser.bar_id || 3
        console.log(`?? Usando bar_id: ${barId}`)
      } catch (e) {
        console.log('?? Erro ao parsear userData, usando barId padrÃ¡o:', e)
      }
    }

    // Calcular datas
    const hoje = new Date()
    const inicioPeriodo = new Date(hoje.getTime() - days * 24 * 60 * 60 * 1000)

    console.log(`?? Buscando dados de ${inicioPeriodo.toISOString().split('T')[0]} atÃ© ${hoje.toISOString().split('T')[0]}`)

    // 1. BUSCAR DADOS CONSOLIDADOS DA TABELA meta_daily_summary
    const { data: dailySummary, error: summaryError } = await supabase
      .from('meta_daily_summary')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: false })

    if (summaryError) {
      console.error('? Erro ao buscar meta_daily_summary:', summaryError)
    }

    // 2. BUSCAR DADOS RECENTES DAS TABELAS EXISTENTES (fallback se meta_daily_summary estiver vazia)
    let fallbackData = null
    if (!dailySummary || dailySummary.length === 0) {
      console.log('?? meta_daily_summary vazia, usando fallback das tabelas originais')
      
      const hoje_str = hoje.toISOString().split('T')[0]
      
      // Facebook metrics
      const { data: facebookMetrics } = await supabase
        .from('facebook_metrics')
        .select('*')
        .eq('bar_id', barId)
        .eq('data_referencia', hoje_str)
        .single()

      // Instagram metrics  
      const { data: instagramMetrics } = await supabase
        .from('instagram_metrics')
        .select('*')
        .eq('bar_id', barId)
        .eq('data_referencia', hoje_str)
        .single()

      // Campanhas (se existirem)
      const { data: campaignsData } = await supabase
        .from('meta_campaigns_history')
        .select('*')
        .eq('bar_id', barId)
        .eq('data_coleta', hoje_str)

      fallbackData = {
        facebook: facebookMetrics,
        instagram: instagramMetrics,
        campaigns: campaignsData || []
      }
    }

    // 3. PROCESSAR DADOS E CALCULAR MÃ‰TRICAS
    const processedData = processDailySummaryData(dailySummary || [], fallbackData)

    // 4. BUSCAR TENDÃŠNCIAS (view meta_trends_analysis)
    const { data: trendsData, error: trendsError } = await supabase
      .from('meta_trends_analysis')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(7)

    if (trendsError) {
      console.error('? Erro ao buscar trends:', trendsError)
    }

    const responseData = {
      success: true,
      data: {
        period: {
          start_date: inicioPeriodo.toISOString().split('T')[0],
          end_date: hoje.toISOString().split('T')[0],
          days_requested: days
        },
        summary: processedData.summary,
        daily_data: processedData.daily_data,
        trends: processTrendsData(trendsData || []),
        variations: processedData.variations,
        campaigns_summary: processedData.campaigns_summary
      },
      meta: {
        source: dailySummary && dailySummary.length > 0 ? 'meta_daily_summary' : 'fallback',
        records_found: dailySummary?.length || 0,
        fallback_used: !dailySummary || dailySummary.length === 0
      },
      debug: {
        bar_id: barId,
        days_requested: days,
        summary_records: dailySummary?.length || 0,
        trends_records: trendsData?.length || 0
      }
    }

    console.log('? Meta Daily Summary - Dados processados:', {
      source: responseData.meta.source,
      records: responseData.meta.records_found,
      total_followers: processedData.summary.total_followers
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('? Erro na API Meta Daily Summary:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Processar dados da meta_daily_summary
function processDailySummaryData(summaryData: unknown[], fallbackData: unknown) {
  if (summaryData.length === 0 && fallbackData) {
    // Usar dados de fallback
    return {
      summary: {
        total_followers: (fallbackData.facebook?.page_fans || 0) + (fallbackData.instagram?.follower_count || 0),
        total_engagement: (fallbackData.facebook?.post_likes || 0) + (fallbackData.facebook?.post_comments || 0) + 
                          (fallbackData.instagram?.posts_likes || 0) + (fallbackData.instagram?.posts_comments || 0),
        facebook_followers: fallbackData.facebook?.page_fans || 0,
        instagram_followers: fallbackData.instagram?.follower_count || 0,
        campaigns_active: fallbackData.campaigns?.filter((c: unknown) => c.effective_status === 'ACTIVE').length || 0,
        total_reach: (fallbackData.facebook?.page_reach || 0) + (fallbackData.instagram?.reach || 0)
      },
      daily_data: [{
        date: new Date().toISOString().split('T')[0],
        facebook_followers: fallbackData.facebook?.page_fans || 0,
        instagram_followers: fallbackData.instagram?.follower_count || 0,
        total_engagement: (fallbackData.facebook?.post_likes || 0) + (fallbackData.instagram?.posts_likes || 0),
        campaigns_active: fallbackData.campaigns?.filter((c: unknown) => c.effective_status === 'ACTIVE').length || 0
      }],
      variations: {
        followers_change_today: 0,
        engagement_change_today: 0,
        campaigns_change_today: 0
      },
      campaigns_summary: {
        total_campaigns: fallbackData.campaigns?.length || 0,
        active_campaigns: fallbackData.campaigns?.filter((c: unknown) => c.effective_status === 'ACTIVE').length || 0,
        total_spend: fallbackData.campaigns?.reduce((sum: number, c: unknown) => sum + (c.spend || 0), 0) || 0
      }
    }
  }

  // Processar dados reais da meta_daily_summary
  const latestData = summaryData[0] // mais recente
  const previousData = summaryData[1] // dia anterior

  const summary = {
    total_followers: latestData?.total_followers || 0,
    total_engagement: latestData?.total_engagement || 0,
    total_reach: latestData?.total_reach || 0,
    facebook_followers: latestData?.facebook_followers || 0,
    instagram_followers: latestData?.instagram_followers || 0,
    campaigns_active: latestData?.campaigns_active || 0,
    last_updated: latestData?.atualizado_em || new Date().toISOString()
  }

  const variations = {
    followers_change_today: latestData?.followers_change || 0,
    engagement_change_today: latestData?.engagement_change || 0,
    reach_change_today: latestData?.reach_change || 0,
    followers_change_percent: previousData && previousData.total_followers > 0 
      ? ((latestData?.total_followers - previousData.total_followers) / previousData.total_followers * 100) 
      : 0
  }

  const campaigns_summary = {
    total_campaigns: latestData?.campaigns_active || 0,
    active_campaigns: latestData?.campaigns_active || 0,
    total_spend: latestData?.campaigns_total_spend || 0,
    total_impressions: latestData?.campaigns_total_impressions || 0,
    total_clicks: latestData?.campaigns_total_clicks || 0
  }

  const daily_data = summaryData.map((day: unknown) => ({
    date: day.data_referencia,
    facebook_followers: day.facebook_followers,
    instagram_followers: day.instagram_followers,
    total_followers: day.total_followers,
    total_engagement: day.total_engagement,
    total_reach: day.total_reach,
    followers_change: day.followers_change,
    engagement_change: day.engagement_change,
    reach_change: day.reach_change,
    campaigns_active: day.campaigns_active,
    campaigns_spend: day.campaigns_total_spend
  }))

  return {
    summary,
    daily_data,
    variations,
    campaigns_summary
  }
}

// Processar dados de tendÃªncias
function processTrendsData(trendsData: unknown[]) {
  if (trendsData.length === 0) {
    return {
      growth_rate_7d: 0,
      avg_daily_followers_change: 0,
      avg_daily_engagement_change: 0,
      trend_direction: 'stable'
    }
  }

  const latest = trendsData[0]
  
  return {
    growth_rate_7d: latest.growth_rate_7d_percent || 0,
    followers_growth_7d: latest.followers_growth_7d || 0,
    engagement_growth_7d: latest.engagement_growth_7d || 0,
    avg_daily_followers_change: latest.avg_daily_followers_change || 0,
    avg_daily_engagement_change: latest.avg_daily_engagement_change || 0,
    trend_direction: latest.avg_daily_followers_change > 0 ? 'growing' : 
                     latest.avg_daily_followers_change < 0 ? 'declining' : 'stable'
  }
} 

