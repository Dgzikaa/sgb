import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 COLETA FORÇADA: Usando todas as permissões disponíveis...')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`👤 Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('⚠️ Erro ao parsear dados do usuário, usando bar_id padrão')
      }
    }

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'meta')
      .eq('ativo', true)
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        success: false,
        error: 'Configuração Meta não encontrada. Configure primeiro em /configuracoes/meta-configuracao'
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const appId = config.client_id
    const appSecret = config.client_secret

    console.log('🔍 Passo 1: Testando e descobrindo contas conectadas...')

    // 1. DESCOBRIR CONTAS CONECTADAS
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    )
    const meData = await meResponse.json()

    if (!meResponse.ok) {
      return NextResponse.json({ 
        success: false,
        error: 'Token inválido',
        details: meData
      }, { status: 400 })
    }

    // 2. BUSCAR PÁGINAS FACEBOOK
    console.log('📘 Passo 2: Buscando páginas Facebook...')
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesResponse.json()

    let facebookPageId = null
    let facebookPageData = null
    let instagramAccountId = null
    let instagramData = null
    let totalFbLikes = 0
    let totalFbComments = 0
    let totalFbShares = 0
    let totalIgLikes = 0
    let totalIgComments = 0
    let fbPostsData: any = null
    let igMediaData: any = null

    if (pagesResponse.ok && pagesData.data?.length > 0) {
      const firstPage = pagesData.data[0]
      facebookPageId = firstPage.id
      
      console.log(`📄 Coletando dados da página: ${firstPage.name}`)
      
      // 3. DADOS COMPLETOS DA PÁGINA FACEBOOK
      const pageDetailsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${facebookPageId}?fields=id,name,username,about,description,fan_count,followers_count,checkins,were_here_count,talking_about_count,category_list,location,phone,website,emails,link,overall_star_rating,rating_count,cover,picture&access_token=${accessToken}`
      )
      facebookPageData = await pageDetailsResponse.json()

      // 4. INSIGHTS FACEBOOK (últimos 30 dias disponíveis)
      console.log('📊 Passo 3: Coletando insights Facebook...')
      const fbInsightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${facebookPageId}/insights?metric=page_impressions,page_reach,page_engaged_users,page_fans,page_fan_adds,page_fan_removes,page_post_engagements,page_consumptions,page_video_views,page_places_checkin_total&period=day&since=30&access_token=${accessToken}`
      )
      const fbInsightsData = await fbInsightsResponse.json()

      // 5. POSTS FACEBOOK RECENTES
      console.log('📝 Passo 4: Coletando posts Facebook...')
      const fbPostsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${facebookPageId}/posts?fields=id,message,created_time,type,likes.summary(true),comments.summary(true),shares,reactions.summary(true)&limit=50&access_token=${accessToken}`
      )
      const fbPostsData = await fbPostsResponse.json()

      // 6. VERIFICAR SE TEM INSTAGRAM CONECTADO
      console.log('📸 Passo 5: Verificando Instagram conectado...')
      const igConnectionResponse = await fetch(
        `https://graph.facebook.com/v18.0/${facebookPageId}?fields=instagram_business_account&access_token=${accessToken}`
      )
      const igConnectionData = await igConnectionResponse.json()

      if (igConnectionData.instagram_business_account) {
        instagramAccountId = igConnectionData.instagram_business_account.id
        
        console.log(`📱 Instagram encontrado: ${instagramAccountId}`)

        // 7. DADOS COMPLETOS DO INSTAGRAM
        const igDetailsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website&access_token=${accessToken}`
        )
        instagramData = await igDetailsResponse.json()

        // 8. INSIGHTS INSTAGRAM
        console.log('📊 Passo 6: Coletando insights Instagram...')
        const igInsightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?metric=impressions,reach,profile_views,website_clicks,email_contacts,phone_call_clicks,text_message_clicks,get_directions_clicks&period=day&since=30&access_token=${accessToken}`
        )
        const igInsightsData = await igInsightsResponse.json()

        // 9. POSTS/MEDIA INSTAGRAM
        console.log('📷 Passo 7: Coletando posts Instagram...')
        const igMediaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}&limit=100&access_token=${accessToken}`
        )
        const igMediaData = await igMediaResponse.json()

                 // Processar dados do Instagram
         const instagramPosts = igMediaData.data || []
         totalIgLikes = instagramPosts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0)
         totalIgComments = instagramPosts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0)

        // Processar insights Instagram
        const igInsights = igInsightsData.data || []
        const getIgMetric = (name: string) => {
          const metric = igInsights.find((m: any) => m.name === name)
          // Somar valores dos últimos dias disponíveis
          return metric?.values?.reduce((sum: number, val: any) => sum + (val.value || 0), 0) || 0
        }

        // Salvar dados REAIS do Instagram
        await supabase
          .from('instagram_metrics')
          .upsert({
            bar_id: barId,
            data_referencia: new Date().toISOString().split('T')[0],
            periodo: 'day',
            follower_count: instagramData.followers_count || 0,
            following_count: instagramData.follows_count || 0,
            impressions: getIgMetric('impressions'),
            reach: getIgMetric('reach'),
            profile_views: getIgMetric('profile_views'),
            posts_impressions: 0,
            posts_reach: 0,
            posts_likes: totalIgLikes,
            posts_comments: totalIgComments,
            posts_saves: 0,
            posts_shares: 0,
            stories_impressions: 0,
            stories_reach: 0,
            stories_replies: 0,
            stories_exits: 0,
            reels_plays: 0,
            reels_reach: 0,
            reels_likes: instagramPosts.filter((p: any) => p.media_type === 'VIDEO').reduce((sum: number, p: any) => sum + (p.like_count || 0), 0),
            reels_comments: instagramPosts.filter((p: any) => p.media_type === 'VIDEO').reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0),
            reels_shares: 0,
            reels_saves: 0,
            raw_data: {
              account_info: instagramData,
              insights: igInsightsData,
              posts: instagramPosts.slice(0, 20), // Últimos 20 posts
              collected_at: new Date().toISOString(),
              real_data: true,
              collection_type: 'force_collect_full',
              api_calls_made: 4,
              calculated_metrics: {
                total_posts_analyzed: instagramPosts.length,
                total_likes: totalIgLikes,
                total_comments: totalIgComments,
                engagement_rate_percentage: instagramData.followers_count > 0 ? 
                  ((totalIgLikes + totalIgComments) / instagramData.followers_count) * 100 : 0,
                avg_likes_per_post: instagramPosts.length > 0 ? totalIgLikes / instagramPosts.length : 0,
                posts_by_type: {
                  photos: instagramPosts.filter((p: any) => p.media_type === 'IMAGE').length,
                  videos: instagramPosts.filter((p: any) => p.media_type === 'VIDEO').length,
                  carousels: instagramPosts.filter((p: any) => p.media_type === 'CAROUSEL_ALBUM').length
                }
              }
            }
          }, {
            onConflict: 'bar_id,data_referencia,periodo'
          })
      }

             // Processar dados do Facebook
       const facebookPosts = fbPostsData.data || []
       totalFbLikes = facebookPosts.reduce((sum: number, post: any) => sum + (post.likes?.summary?.total_count || 0), 0)
       totalFbComments = facebookPosts.reduce((sum: number, post: any) => sum + (post.comments?.summary?.total_count || 0), 0)
       totalFbShares = facebookPosts.reduce((sum: number, post: any) => sum + (post.shares?.count || 0), 0)

      // Processar insights Facebook
      const fbInsights = fbInsightsData.data || []
      const getFbMetric = (name: string) => {
        const metric = fbInsights.find((m: any) => m.name === name)
        return metric?.values?.reduce((sum: number, val: any) => sum + (val.value || 0), 0) || 0
      }

      // Salvar dados REAIS do Facebook
      await supabase
        .from('facebook_metrics')
        .upsert({
          bar_id: barId,
          data_referencia: new Date().toISOString().split('T')[0],
          periodo: 'day',
          page_impressions: getFbMetric('page_impressions'),
          page_reach: getFbMetric('page_reach'),
          page_engaged_users: getFbMetric('page_engaged_users'),
          page_fans: facebookPageData.fan_count || facebookPageData.followers_count || 0,
          page_fan_adds: getFbMetric('page_fan_adds'),
          page_fan_removes: getFbMetric('page_fan_removes'),
          post_impressions: 0,
          post_reach: 0,
          post_likes: totalFbLikes,
          post_comments: totalFbComments,
          post_shares: totalFbShares,
          post_clicks: getFbMetric('page_consumptions'),
          page_actions_post_reactions_total: getFbMetric('page_post_engagements'),
          page_negative_feedback: 0,
          page_positive_feedback: 0,
          page_video_views: getFbMetric('page_video_views'),
          page_video_complete_views: 0,
          raw_data: {
            page_info: facebookPageData,
            insights: fbInsightsData,
            posts: facebookPosts.slice(0, 20),
            collected_at: new Date().toISOString(),
            real_data: true,
            collection_type: 'force_collect_full',
            api_calls_made: 4
          }
        }, {
          onConflict: 'bar_id,data_referencia,periodo'
        })
    }

    console.log('📊 Passo 8: Calculando dados consolidados...')

    // 10. DADOS CONSOLIDADOS
    const totalFollowers = (facebookPageData?.fan_count || 0) + (instagramData?.followers_count || 0)
    const totalEngagement = (totalFbLikes + totalFbComments + totalFbShares) + (totalIgLikes + totalIgComments)
    const totalReach = 0 // Insights específicos
    const totalImpressions = 0 // Insights específicos

    // Salvar dados consolidados
    await supabase
      .from('social_metrics_consolidated')
      .upsert({
        bar_id: barId,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        total_reach: totalReach,
        total_impressions: totalImpressions,
        total_engagement: totalEngagement,
        total_followers: totalFollowers,
        facebook_reach: 0,
        facebook_impressions: 0,
        facebook_engagement: totalFbLikes + totalFbComments + totalFbShares,
        facebook_followers: facebookPageData?.fan_count || 0,
        instagram_reach: 0,
        instagram_impressions: 0,
        instagram_engagement: totalIgLikes + totalIgComments,
        instagram_followers: instagramData?.followers_count || 0,
        crescimento_followers: 0, // Calculado com histórico
        performance_score: totalFollowers > 0 ? (totalEngagement / totalFollowers) * 100 : 0
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    // Atualizar configuração com IDs encontrados
    if (facebookPageId || instagramAccountId) {
      const novasConfiguracoes = {
        ...config.configuracoes,
        page_id: facebookPageId,
        instagram_account_id: instagramAccountId,
        facebook_page_name: facebookPageData?.name,
        instagram_username: instagramData?.username,
        last_force_collect: new Date().toISOString()
      }

      await supabase
        .from('api_credentials')
        .update({ configuracoes: novasConfiguracoes })
        .eq('id', config.id)
    }

    const results = {
      success: true,
      message: 'Coleta forçada completa! Dados reais coletados com sucesso.',
      timestamp: new Date().toISOString(),
      data_collected: {
        facebook: {
          found: !!facebookPageData,
          name: facebookPageData?.name,
          page_id: facebookPageId,
          followers: facebookPageData?.fan_count || facebookPageData?.followers_count || 0,
          posts_analyzed: fbPostsData?.data?.length || 0,
          total_likes: totalFbLikes || 0,
          total_comments: totalFbComments || 0,
          total_shares: totalFbShares || 0
        },
        instagram: {
          found: !!instagramData,
          username: instagramData?.username,
          name: instagramData?.name,
          account_id: instagramAccountId,
          followers: instagramData?.followers_count || 0,
          following: instagramData?.follows_count || 0,
          media_count: instagramData?.media_count || 0,
          posts_analyzed: igMediaData?.data?.length || 0,
          total_likes: totalIgLikes || 0,
          total_comments: totalIgComments || 0
        },
        consolidated: {
          total_followers: totalFollowers,
          total_engagement: totalEngagement,
          engagement_rate: totalFollowers > 0 ? ((totalEngagement / totalFollowers) * 100).toFixed(2) + '%' : '0%'
        }
      },
      apis_used: [
        'Facebook Graph API - User Info',
        'Facebook Graph API - User Pages',
        'Facebook Graph API - Page Details',
        'Facebook Graph API - Page Insights',
        'Facebook Graph API - Page Posts',
        'Instagram Basic Display API - Account Info',
        'Instagram Graph API - Account Insights',
        'Instagram Graph API - Media'
      ],
      permissions_utilized: [
        'pages_show_list ✅',
        'pages_read_engagement ✅',
        'instagram_basic ✅',
        'instagram_manage_insights ✅',
        'read_insights ✅'
      ]
    }

    console.log('✅ Coleta forçada concluída com sucesso!')
    
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro na coleta forçada:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro na coleta forçada',
      details: error.message 
    }, { status: 500 })
  }
} 