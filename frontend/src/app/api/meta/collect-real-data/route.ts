import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Desabilitar durante build para evitar chamadas automáticas
    return NextResponse.json({ 
      error: 'API temporariamente desabilitada durante build',
      message: 'Esta API está desabilitada para evitar chamadas durante a geração estática'
    }, { status: 503 })
    
    // console.log('🔍 Iniciando coleta de dados REAIS da Meta API...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('meta_configuracoes')
      .select('*')
      .eq('bar_id', 3)
      .eq('ativo', true)
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada',
        details: configError?.message 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const pageId = config.page_id
    const instagramId = config.instagram_account_id

    console.log('📘 Buscando dados reais do Facebook...')
    
    // 1. Buscar dados da página Facebook
    const facebookResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,followers_count,fan_count,about,website,phone,category_list&access_token=${accessToken}`
    )
    const facebookData = await facebookResponse.json()

    if (!facebookResponse.ok) {
      console.error('❌ Erro Facebook:', facebookData)
      return NextResponse.json({ error: 'Erro ao buscar dados Facebook', details: facebookData }, { status: 400 })
    }

    // 2. Buscar insights Facebook
    const facebookInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users,page_fans,page_fan_adds,page_fan_removes,page_views_total,page_actions_post_reactions_total&period=day&access_token=${accessToken}`
    )
    const facebookInsights = await facebookInsightsResponse.json()

    console.log('📷 Buscando dados reais do Instagram...')
    
    // 3. Buscar dados da conta Instagram
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`
    )
    const instagramData = await instagramResponse.json()

    if (!instagramResponse.ok) {
      console.error('❌ Erro Instagram:', instagramData)
      return NextResponse.json({ error: 'Erro ao buscar dados Instagram', details: instagramData }, { status: 400 })
    }

    // 4. Buscar insights Instagram
    const instagramInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramId}/insights?metric=impressions,reach,profile_views,website_clicks,email_contacts&period=day&access_token=${accessToken}`
    )
    const instagramInsights = await instagramInsightsResponse.json()

    // 5. Buscar posts recentes do Instagram
    const instagramMediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=10&access_token=${accessToken}`
    )
    const instagramMedia = await instagramMediaResponse.json()

    console.log('📊 Processando dados reais...')

    // Processar insights Facebook
    const fbInsightsData = facebookInsights.data || []
    const getMetricValue = (metricName: string) => {
      const metric = fbInsightsData.find((m: any) => m.name === metricName)
      return metric?.values?.[0]?.value || 0
    }

    // Processar insights Instagram
    const igInsightsData = instagramInsights.data || []
    const getIGMetricValue = (metricName: string) => {
      const metric = igInsightsData.find((m: any) => m.name === metricName)
      return metric?.values?.[0]?.value || 0
    }

    // Calcular métricas dos posts recentes
    const recentPosts = instagramMedia.data || []
    const totalLikes = recentPosts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0)
    const totalComments = recentPosts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0)

    console.log('💾 Inserindo dados REAIS no banco...')

    // Inserir dados REAIS do Facebook
    await supabase
      .from('facebook_metrics')
      .upsert({
        bar_id: 3,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        page_impressions: getMetricValue('page_impressions'),
        page_reach: getMetricValue('page_reach'),
        page_engaged_users: getMetricValue('page_engaged_users'),
        page_fans: facebookData.fan_count || facebookData.followers_count || 0,
        page_fan_adds: getMetricValue('page_fan_adds'),
        page_fan_removes: getMetricValue('page_fan_removes'),
        post_impressions: 0, // Precisaria buscar posts individuais
        post_reach: 0,
        post_likes: 0,
        post_comments: 0,
        post_shares: 0,
        post_clicks: 0,
        page_actions_post_reactions_total: getMetricValue('page_actions_post_reactions_total'),
        page_negative_feedback: 0,
        page_positive_feedback: 0,
        page_video_views: 0,
        page_video_complete_views: 0,
        raw_data: {
          page_info: facebookData,
          insights: facebookInsights,
          collected_at: new Date().toISOString(),
          real_data: true
        }
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    // Inserir dados REAIS do Instagram
    await supabase
      .from('instagram_metrics')
      .upsert({
        bar_id: 3,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        follower_count: instagramData.followers_count || 0,
        following_count: instagramData.follows_count || 0,
        impressions: getIGMetricValue('impressions'),
        reach: getIGMetricValue('reach'),
        profile_views: getIGMetricValue('profile_views'),
        posts_impressions: 0, // Soma dos posts individuais
        posts_reach: 0,
        posts_likes: totalLikes,
        posts_comments: totalComments,
        posts_saves: 0,
        posts_shares: 0,
        stories_impressions: 0,
        stories_reach: 0,
        stories_replies: 0,
        stories_exits: 0,
        reels_plays: 0,
        reels_reach: 0,
        reels_likes: 0,
        reels_comments: 0,
        reels_shares: 0,
        reels_saves: 0,
        raw_data: {
          account_info: instagramData,
          insights: instagramInsights,
          recent_media: instagramMedia,
          collected_at: new Date().toISOString(),
          real_data: true
        }
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    // Calcular e inserir métricas consolidadas REAIS
    const totalFollowers = (facebookData.fan_count || 0) + (instagramData.followers_count || 0)
    const totalReach = getMetricValue('page_reach') + getIGMetricValue('reach')
    const totalImpressions = getMetricValue('page_impressions') + getIGMetricValue('impressions')
    const totalEngagement = getMetricValue('page_engaged_users') + totalLikes + totalComments

    await supabase
      .from('social_metrics_consolidated')
      .upsert({
        bar_id: 3,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        total_reach: totalReach,
        total_impressions: totalImpressions,
        total_engagement: totalEngagement,
        total_followers: totalFollowers,
        facebook_reach: getMetricValue('page_reach'),
        facebook_impressions: getMetricValue('page_impressions'),
        facebook_engagement: getMetricValue('page_engaged_users'),
        facebook_followers: facebookData.fan_count || 0,
        instagram_reach: getIGMetricValue('reach'),
        instagram_impressions: getIGMetricValue('impressions'),
        instagram_engagement: totalLikes + totalComments,
        instagram_followers: instagramData.followers_count || 0,
        crescimento_followers: 0, // Calculado com dados históricos
        performance_score: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    const results = {
      success: true,
      message: 'Dados REAIS coletados com sucesso!',
      timestamp: new Date().toISOString(),
      data: {
        facebook: {
          name: facebookData.name,
          followers: facebookData.fan_count || facebookData.followers_count,
          reach: getMetricValue('page_reach'),
          impressions: getMetricValue('page_impressions'),
          engagement: getMetricValue('page_engaged_users')
        },
        instagram: {
          username: instagramData.username,
          name: instagramData.name,
          followers: instagramData.followers_count,
          following: instagramData.follows_count,
          media_count: instagramData.media_count,
          reach: getIGMetricValue('reach'),
          impressions: getIGMetricValue('impressions'),
          profile_views: getIGMetricValue('profile_views'),
          recent_posts_likes: totalLikes,
          recent_posts_comments: totalComments
        },
        consolidated: {
          total_followers: totalFollowers,
          total_reach: totalReach,
          total_impressions: totalImpressions,
          total_engagement: totalEngagement,
          engagement_rate: totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) + '%' : '0%'
        }
      }
    }

    console.log('✅ Coleta de dados REAIS concluída!')
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao coletar dados reais:', error)
    return NextResponse.json({ 
      error: 'Erro ao coletar dados reais',
      details: error.message 
    }, { status: 500 })
  }
} 