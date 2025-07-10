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
    
    // console.log('🔍 Iniciando coleta COMPLETA do Facebook...')

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
    const pageId = config.page_id

    console.log('📘 1. Buscando informações COMPLETAS da página Facebook...')
    
    // 1. INFORMAÇÕES GERAIS DA PÁGINA (todos os campos disponíveis)
    const pageInfoUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=about,category,fan_count,followers_count,name,username,link,location,phone,website,cover,picture,checkins,were_here_count,talking_about_count,new_like_count,description,general_info,hours,parking,payment_options,price_range,restaurant_services,restaurant_specialties,founded,mission,products,overall_star_rating,rating_count,single_line_address,unread_message_count,unread_notif_count,unseen_message_count,verification_status&access_token=${accessToken}`
    
    const pageInfoResponse = await fetch(pageInfoUrl)
    const pageInfoData = await pageInfoResponse.json()

    console.log('📊 2. Buscando insights/métricas de desempenho...')
    
    // 2. INSIGHTS DA PÁGINA (métricas de desempenho)
    const insightsUrl = `https://graph.facebook.com/v18.0/${pageId}/insights?metric=page_impressions,page_views_total,page_engaged_users,page_fan_adds,page_fan_removes,page_post_engagements,page_consumptions,page_video_views,page_fans_online,page_places_checkin_total,page_negative_feedback,page_positive_feedback&period=day&access_token=${accessToken}`
    
    const insightsResponse = await fetch(insightsUrl)
    const insightsData = await insightsResponse.json()

    console.log('📝 3. Buscando posts recentes...')
    
    // 3. POSTS DA PÁGINA (conteúdo publicado)
    const postsUrl = `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,permalink_url,attachments,type,status_type,likes.summary(true),comments.summary(true),shares,reactions.summary(true),insights&limit=10&access_token=${accessToken}`
    
    const postsResponse = await fetch(postsUrl)
    const postsData = await postsResponse.json()

    console.log('📷 4. Buscando fotos da página...')
    
    // 4. MÍDIAS - FOTOS
    const photosUrl = `https://graph.facebook.com/v18.0/${pageId}/photos?fields=id,name,created_time,picture,source,likes.summary(true),comments.summary(true)&limit=10&access_token=${accessToken}`
    
    const photosResponse = await fetch(photosUrl)
    const photosData = await photosResponse.json()

    console.log('🎥 5. Buscando vídeos da página...')
    
    // 5. MÍDIAS - VÍDEOS
    const videosUrl = `https://graph.facebook.com/v18.0/${pageId}/videos?fields=id,title,description,created_time,picture,source,views,likes.summary(true),comments.summary(true)&limit=5&access_token=${accessToken}`
    
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()

    console.log('⭐ 6. Buscando avaliações da página...')
    
    // 6. AVALIAÇÕES E RATINGS
    const ratingsUrl = `https://graph.facebook.com/v18.0/${pageId}/ratings?fields=reviewer,created_time,rating,review_text,recommendation_type&limit=10&access_token=${accessToken}`
    
    const ratingsResponse = await fetch(ratingsUrl)
    const ratingsData = await ratingsResponse.json()

    console.log('📧 7. Buscando eventos da página...')
    
    // 7. EVENTOS
    const eventsUrl = `https://graph.facebook.com/v18.0/${pageId}/events?fields=id,name,start_time,end_time,place,description,attending_count,interested_count&limit=10&access_token=${accessToken}`
    
    const eventsResponse = await fetch(eventsUrl)
    const eventsData = await eventsResponse.json()

    console.log('🔧 Processando todos os dados coletados...')

    // Processar insights
    const insights = insightsData.data || []
    const getMetric = (name: string) => {
      const metric = insights.find((m: any) => m.name === name)
      return metric?.values?.[0]?.value || 0
    }

    // Processar posts para calcular engajamento
    const posts = postsData.data || []
    const totalPostLikes = posts.reduce((sum: number, post: any) => sum + (post.likes?.summary?.total_count || 0), 0)
    const totalPostComments = posts.reduce((sum: number, post: any) => sum + (post.comments?.summary?.total_count || 0), 0)
    const totalPostShares = posts.reduce((sum: number, post: any) => sum + (post.shares?.count || 0), 0)

    // Processar fotos
    const photos = photosData.data || []
    const totalPhotoLikes = photos.reduce((sum: number, photo: any) => sum + (photo.likes?.summary?.total_count || 0), 0)
    const totalPhotoComments = photos.reduce((sum: number, photo: any) => sum + (photo.comments?.summary?.total_count || 0), 0)

    // Processar vídeos
    const videos = videosData.data || []
    const totalVideoViews = videos.reduce((sum: number, video: any) => sum + (video.views || 0), 0)
    const totalVideoLikes = videos.reduce((sum: number, video: any) => sum + (video.likes?.summary?.total_count || 0), 0)

    // Processar avaliações
    const ratings = ratingsData.data || []
    const averageRating = ratings.length > 0 ? 
      ratings.reduce((sum: number, rating: any) => sum + (rating.rating || 0), 0) / ratings.length : 0

    console.log('💾 Inserindo dados COMPLETOS no banco...')

    // Inserir dados COMPLETOS do Facebook
    await supabase
      .from('facebook_metrics')
      .upsert({
        bar_id: 3,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        page_impressions: getMetric('page_impressions'),
        page_reach: getMetric('page_views_total'),
        page_engaged_users: getMetric('page_engaged_users'),
        page_fans: pageInfoData.fan_count || 0,
        page_fan_adds: getMetric('page_fan_adds'),
        page_fan_removes: getMetric('page_fan_removes'),
        post_impressions: 0,
        post_reach: 0,
        post_likes: totalPostLikes,
        post_comments: totalPostComments,
        post_shares: totalPostShares,
        post_clicks: getMetric('page_consumptions'),
        page_actions_post_reactions_total: getMetric('page_post_engagements'),
        page_negative_feedback: getMetric('page_negative_feedback'),
        page_positive_feedback: getMetric('page_positive_feedback'),
        page_video_views: getMetric('page_video_views') + totalVideoViews,
        page_video_complete_views: totalVideoViews,
        raw_data: {
          // Dados completos da página
          page_info: pageInfoData,
          insights: insightsData,
          posts: postsData,
          photos: photosData,
          videos: videosData,
          ratings: ratingsData,
          events: eventsData,
          
          // Métricas calculadas
          calculated_metrics: {
            total_post_likes: totalPostLikes,
            total_post_comments: totalPostComments,
            total_post_shares: totalPostShares,
            total_photo_likes: totalPhotoLikes,
            total_photo_comments: totalPhotoComments,
            total_video_views: totalVideoViews,
            total_video_likes: totalVideoLikes,
            average_rating: averageRating,
            total_ratings: ratings.length
          },
          
          collected_at: new Date().toISOString(),
          collection_type: 'complete_facebook_data',
          real_data: true
        }
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    const results = {
      success: true,
      message: 'Dados COMPLETOS do Facebook coletados!',
      timestamp: new Date().toISOString(),
      data: {
        page_info: {
          name: pageInfoData.name,
          username: pageInfoData.username,
          about: pageInfoData.about,
          category: pageInfoData.category,
          fan_count: pageInfoData.fan_count,
          followers_count: pageInfoData.followers_count,
          checkins: pageInfoData.checkins,
          were_here_count: pageInfoData.were_here_count,
          talking_about_count: pageInfoData.talking_about_count,
          overall_star_rating: pageInfoData.overall_star_rating,
          rating_count: pageInfoData.rating_count,
          phone: pageInfoData.phone,
          website: pageInfoData.website,
          location: pageInfoData.location,
          price_range: pageInfoData.price_range
        },
        insights: {
          page_impressions: getMetric('page_impressions'),
          page_views: getMetric('page_views_total'),
          engaged_users: getMetric('page_engaged_users'),
          fan_adds: getMetric('page_fan_adds'),
          fan_removes: getMetric('page_fan_removes'),
          post_engagements: getMetric('page_post_engagements'),
          video_views: getMetric('page_video_views')
        },
        content: {
          recent_posts: posts.length,
          total_post_likes: totalPostLikes,
          total_post_comments: totalPostComments,
          total_post_shares: totalPostShares,
          recent_photos: photos.length,
          total_photo_likes: totalPhotoLikes,
          recent_videos: videos.length,
          total_video_views: totalVideoViews
        },
        ratings: {
          total_ratings: ratings.length,
          average_rating: averageRating.toFixed(1),
          recent_reviews: ratings.slice(0, 3).map((r: any) => ({
            rating: r.rating,
            review: r.review_text,
            date: r.created_time
          }))
        },
        events: {
          upcoming_events: eventsData.data?.length || 0,
          events: eventsData.data?.slice(0, 3) || []
        }
      }
    }

    console.log('✅ Coleta COMPLETA do Facebook concluída!')
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao coletar dados completos:', error)
    return NextResponse.json({ 
      error: 'Erro ao coletar dados completos',
      details: error.message 
    }, { status: 500 })
  }
} 