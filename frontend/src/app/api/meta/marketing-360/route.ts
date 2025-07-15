import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Marketing 360° - Buscando dados consolidados Meta...')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento

    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`👤 Usando bar_id: ${barId}`)
      } catch (e) {
        console.log('⚠️ Erro ao parsear userData, usando barId padrão:', e)
      }
    }

    // Buscar dados Instagram recentes (últimos 30 dias)
    const { data: instagramData, error: instagramError } = await supabase
      .from('meta_instagram_posts')
      .select(`
        id, 
        caption,
        media_type,
        media_url,
        permalink,
        timestamp,
        like_count,
        comments_count,
        impressions_count,
        reach_count,
        saved_count,
        video_play_count,
        shares_count,
        profile_visits,
        follows,
        website_clicks,
        coletado_em
      `)
      .eq('bar_id', barId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (instagramError) {
      console.error('❌ Erro ao buscar dados Instagram:', instagramError)
    }

    // Buscar dados Facebook recentes (últimos 30 dias)
    const { data: facebookData, error: facebookError } = await supabase
      .from('meta_facebook_posts')
      .select(`
        id,
        message,
        story,
        created_time,
        type,
        link,
        picture,
        full_picture,
        reactions_count,
        comments_count,
        shares_count,
        impressions,
        reach,
        clicks,
        coletado_em
      `)
      .eq('bar_id', barId)
      .gte('created_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_time', { ascending: false })

    if (facebookError) {
      console.error('❌ Erro ao buscar dados Facebook:', facebookError)
    }

    // Buscar insights/métricas recentes
    const { data: insightsData, error: insightsError } = await supabase
      .from('meta_insights')
      .select('*')
      .eq('bar_id', barId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (insightsError) {
      console.error('❌ Erro ao buscar insights:', insightsError)
    }

    // Processar dados Instagram
    const instagramMetrics = {
      followers: 0, // Será preenchido pelos insights
      posts: instagramData?.length || 0,
      engagement: 0,
      reach: 0,
      total_likes: 0,
      total_comments: 0,
      total_shares: 0,
      impressions: 0
    }

    if (instagramData && instagramData.length > 0) {
      instagramMetrics.total_likes = instagramData.reduce((sum, post) => sum + (post.like_count || 0), 0)
      instagramMetrics.total_comments = instagramData.reduce((sum, post) => sum + (post.comments_count || 0), 0)
      instagramMetrics.total_shares = instagramData.reduce((sum, post) => sum + (post.shares_count || 0), 0)
      instagramMetrics.reach = instagramData.reduce((sum, post) => sum + (post.reach_count || 0), 0)
      instagramMetrics.impressions = instagramData.reduce((sum, post) => sum + (post.impressions_count || 0), 0)
      instagramMetrics.engagement = instagramMetrics.impressions > 0 
        ? ((instagramMetrics.total_likes + instagramMetrics.total_comments + instagramMetrics.total_shares) / instagramMetrics.impressions * 100)
        : 0
    }

    // Processar dados Facebook
    const facebookMetrics = {
      followers: 0, // Será preenchido pelos insights
      posts: facebookData?.length || 0,
      engagement: 0,
      reach: 0,
      total_reactions: 0,
      total_comments: 0,
      total_shares: 0,
      impressions: 0
    }

    if (facebookData && facebookData.length > 0) {
      facebookMetrics.total_reactions = facebookData.reduce((sum, post) => sum + (post.reactions_count || 0), 0)
      facebookMetrics.total_comments = facebookData.reduce((sum, post) => sum + (post.comments_count || 0), 0)
      facebookMetrics.total_shares = facebookData.reduce((sum, post) => sum + (post.shares_count || 0), 0)
      facebookMetrics.reach = facebookData.reduce((sum, post) => sum + (post.reach || 0), 0)
      facebookMetrics.impressions = facebookData.reduce((sum, post) => sum + (post.impressions || 0), 0)
      facebookMetrics.engagement = facebookMetrics.impressions > 0 
        ? ((facebookMetrics.total_reactions + facebookMetrics.total_comments + facebookMetrics.total_shares) / facebookMetrics.impressions * 100)
        : 0
    }

    // Buscar dados de seguidores mais recentes dos insights
    const latestInsights = insightsData?.[0]
    if (latestInsights) {
      // Extrair followers count dos insights (assumindo que estão armazenados como JSON)
      try {
        if (latestInsights.page_fans !== undefined) {
          facebookMetrics.followers = latestInsights.page_fans
        }
        if (latestInsights.followers_count !== undefined) {
          instagramMetrics.followers = latestInsights.followers_count
        }
      } catch (e) {
        console.log('⚠️ Erro ao extrair followers dos insights:', e)
      }
    }

    // Calcular métricas consolidadas
    const totalFollowers = instagramMetrics.followers + facebookMetrics.followers
    const totalReach = instagramMetrics.reach + facebookMetrics.reach
    const totalEngagement = instagramMetrics.impressions + facebookMetrics.impressions > 0
      ? ((instagramMetrics.total_likes + instagramMetrics.total_comments + instagramMetrics.total_shares + 
          facebookMetrics.total_reactions + facebookMetrics.total_comments + facebookMetrics.total_shares) / 
         (instagramMetrics.impressions + facebookMetrics.impressions) * 100)
      : 0

    // Estimar ROI baseado no engagement e alcance
    const roiEstimate = totalReach > 1000 ? Math.min(Math.round(totalReach / 100 + totalEngagement * 20), 500) : 0

    // Dados de campanhas (mockado por enquanto - pode ser implementado futuramente)
    const campaignMetrics = {
      active_campaigns: 2,
      total_spend: 850,
      total_clicks: Math.round(totalReach * 0.02), // 2% do alcance
      conversion_rate: totalEngagement > 3 ? 4.2 : 2.8
    }

    // Metas (configuráveis)
    const goals = {
      followers_target: 15000,
      engagement_target: 5.5,
      reach_target: 100000,
      roi_target: 400
    }

    const responseData = {
      success: true,
      data: {
        metrics: {
          total_followers: totalFollowers,
          engagement_rate: Math.round(totalEngagement * 10) / 10,
          weekly_reach: totalReach,
          roi_estimate: roiEstimate,
          facebook: {
            followers: facebookMetrics.followers,
            engagement: Math.round(facebookMetrics.engagement * 10) / 10,
            reach: facebookMetrics.reach,
            posts: facebookMetrics.posts
          },
          instagram: {
            followers: instagramMetrics.followers,
            engagement: Math.round(instagramMetrics.engagement * 10) / 10,
            reach: instagramMetrics.reach,
            posts: instagramMetrics.posts
          }
        },
        campaigns: campaignMetrics,
        goals: goals,
        last_updated: new Date().toISOString(),
        data_period: '30_days'
      },
      debug: {
        bar_id: barId,
        instagram_posts: instagramData?.length || 0,
        facebook_posts: facebookData?.length || 0,
        insights_records: insightsData?.length || 0
      }
    }

    console.log('✅ Marketing 360° - Dados processados com sucesso:', {
      total_followers: totalFollowers,
      instagram_posts: instagramData?.length || 0,
      facebook_posts: facebookData?.length || 0,
      total_engagement: Math.round(totalEngagement * 10) / 10
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Erro geral na API Marketing 360°:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 