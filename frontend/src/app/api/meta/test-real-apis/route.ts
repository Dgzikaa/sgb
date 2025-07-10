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
    
    // console.log('🔍 Testando APIs REAIS da Meta...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('meta_configuracoes')
      .select('*')
      .eq('bar_id', 3)
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada',
        details: configError?.message 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const instagramId = config.instagram_account_id
    const pageId = config.page_id

    console.log('📷 Testando API 1: Dados básicos do Instagram...')
    
    // API 1: Obter dados básicos da conta Instagram
    const instagramBasicUrl = `https://graph.facebook.com/v18.0/${instagramId}?fields=name,username,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`
    
    const instagramBasicResponse = await fetch(instagramBasicUrl)
    const instagramBasicData = await instagramBasicResponse.json()

    console.log('📊 Testando API 2: Insights do Instagram...')
    
    // API 2: Obter insights/métricas da conta
    const instagramInsightsUrl = `https://graph.facebook.com/v18.0/${instagramId}/insights?metric=impressions,reach,profile_views,website_clicks,email_contacts&period=day&access_token=${accessToken}`
    
    const instagramInsightsResponse = await fetch(instagramInsightsUrl)
    const instagramInsightsData = await instagramInsightsResponse.json()

    console.log('📱 Testando API 3: Posts do Instagram...')
    
    // API 3: Listar posts/media recentes
    const instagramMediaUrl = `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=5&access_token=${accessToken}`
    
    const instagramMediaResponse = await fetch(instagramMediaUrl)
    const instagramMediaData = await instagramMediaResponse.json()

    console.log('📘 Testando API 4: Dados do Facebook...')
    
    // API 4: Dados da página Facebook
    const facebookPageUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,followers_count,fan_count,about,website,phone&access_token=${accessToken}`
    
    const facebookPageResponse = await fetch(facebookPageUrl)
    const facebookPageData = await facebookPageResponse.json()

    console.log('📈 Testando API 5: Insights do Facebook...')
    
    // API 5: Insights da página Facebook
    const facebookInsightsUrl = `https://graph.facebook.com/v18.0/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users,page_fans&period=day&access_token=${accessToken}`
    
    const facebookInsightsResponse = await fetch(facebookInsightsUrl)
    const facebookInsightsData = await facebookInsightsResponse.json()

    console.log('✨ Processando resultados...')

    // Extrair insights do Instagram
    const igInsights = instagramInsightsData.data || []
    const getIGMetric = (name: string) => {
      const metric = igInsights.find((m: any) => m.name === name)
      return metric?.values?.[0]?.value || 0
    }

    // Extrair insights do Facebook
    const fbInsights = facebookInsightsData.data || []
    const getFBMetric = (name: string) => {
      const metric = fbInsights.find((m: any) => m.name === name)
      return metric?.values?.[0]?.value || 0
    }

    // Processar posts do Instagram
    const recentPosts = instagramMediaData.data || []
    const totalLikesRecentPosts = recentPosts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0)
    const totalCommentsRecentPosts = recentPosts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0)

    const results = {
      success: true,
      message: 'APIs testadas com sucesso!',
      timestamp: new Date().toISOString(),
      apis_tested: {
        instagram_basic: {
          success: instagramBasicResponse.ok,
          status: instagramBasicResponse.status,
          data: instagramBasicData
        },
        instagram_insights: {
          success: instagramInsightsResponse.ok,
          status: instagramInsightsResponse.status,
          data: instagramInsightsData
        },
        instagram_media: {
          success: instagramMediaResponse.ok,
          status: instagramMediaResponse.status,
          data: instagramMediaData
        },
        facebook_page: {
          success: facebookPageResponse.ok,
          status: facebookPageResponse.status,
          data: facebookPageData
        },
        facebook_insights: {
          success: facebookInsightsResponse.ok,
          status: facebookInsightsResponse.status,
          data: facebookInsightsData
        }
      },
      extracted_data: {
        instagram: {
          name: instagramBasicData.name,
          username: instagramBasicData.username,
          followers: instagramBasicData.followers_count,
          following: instagramBasicData.follows_count,
          media_count: instagramBasicData.media_count,
          biography: instagramBasicData.biography,
          impressions_today: getIGMetric('impressions'),
          reach_today: getIGMetric('reach'),
          profile_views_today: getIGMetric('profile_views'),
          website_clicks_today: getIGMetric('website_clicks'),
          recent_posts_likes: totalLikesRecentPosts,
          recent_posts_comments: totalCommentsRecentPosts,
          recent_posts_count: recentPosts.length
        },
        facebook: {
          name: facebookPageData.name,
          fan_count: facebookPageData.fan_count,
          followers_count: facebookPageData.followers_count,
          about: facebookPageData.about,
          website: facebookPageData.website,
          phone: facebookPageData.phone,
          impressions_today: getFBMetric('page_impressions'),
          reach_today: getFBMetric('page_reach'),
          engaged_users_today: getFBMetric('page_engaged_users'),
          fans_today: getFBMetric('page_fans')
        },
        consolidated: {
          total_followers: (instagramBasicData.followers_count || 0) + (facebookPageData.fan_count || 0),
          total_reach_today: getIGMetric('reach') + getFBMetric('page_reach'),
          total_impressions_today: getIGMetric('impressions') + getFBMetric('page_impressions'),
          total_engagement_today: getIGMetric('profile_views') + getFBMetric('page_engaged_users') + totalLikesRecentPosts + totalCommentsRecentPosts
        }
      }
    }

    console.log('🎉 Teste das APIs concluído!')
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao testar APIs:', error)
    return NextResponse.json({ 
      error: 'Erro ao testar APIs',
      details: error.message 
    }, { status: 500 })
  }
} 