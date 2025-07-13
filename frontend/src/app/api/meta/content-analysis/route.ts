import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📱 Análise AVANÇADA de conteúdo Meta...')

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
        error: 'Configuração Meta não encontrada',
        posts: []
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const configs = config.configuracoes || {}
    const pageId = configs.page_id
    const instagramId = configs.instagram_account_id

    try {
      const contentAnalysis = {
        instagram: {
          posts: [],
          stories: [],
          reels: [],
          metrics: {
            total_posts: 0,
            avg_engagement_rate: 0,
            best_performing_post: null,
            worst_performing_post: null,
            engagement_by_type: {},
            posting_frequency: 0
          }
        },
        facebook: {
          posts: [],
          metrics: {
            total_posts: 0,
            avg_engagement_rate: 0,
            best_performing_post: null,
            worst_performing_post: null,
            engagement_by_type: {},
            posting_frequency: 0
          }
        },
        insights: {
          optimal_posting_times: [] as Array<{ hour: number; avg_engagement: number; posts_count: number }>,
          content_type_performance: {},
          hashtag_performance: [] as Array<{ tag: string; usage_count: number; avg_engagement: number }>,
          audience_demographics: {},
          growth_trends: [] as Array<any>
        }
      }

      // 1. ANÁLISE DE POSTS DO INSTAGRAM
      if (instagramId) {
        console.log('📷 Analisando posts do Instagram...')
        
        const instagramPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saves,video_views)&limit=50&access_token=${accessToken}`
        )
        const instagramPostsData = await instagramPostsResponse.json()

        if (instagramPostsResponse.ok && instagramPostsData.data) {
          const posts = instagramPostsData.data.map((post: any) => {
            const insights = post.insights?.data || []
            const impressions = insights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0
            const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0
            const engagement = insights.find((i: any) => i.name === 'engagement')?.values?.[0]?.value || 0
            const saves = insights.find((i: any) => i.name === 'saves')?.values?.[0]?.value || 0
            const videoViews = insights.find((i: any) => i.name === 'video_views')?.values?.[0]?.value || 0

            const engagementRate = impressions > 0 ? (engagement / impressions) * 100 : 0
            const saveRate = impressions > 0 ? (saves / impressions) * 100 : 0
            
            // Análise de hashtags
            const hashtags = post.caption ? (post.caption.match(/#\w+/g) || []) : []
            
            // Análise de horário
            const postDate = new Date(post.timestamp)
            const hourOfDay = postDate.getHours()
            const dayOfWeek = postDate.getDay()

            return {
              id: post.id,
              caption: post.caption,
              media_type: post.media_type,
              media_url: post.media_url,
              thumbnail_url: post.thumbnail_url,
              permalink: post.permalink,
              timestamp: post.timestamp,
              metrics: {
                likes: post.like_count || 0,
                comments: post.comments_count || 0,
                impressions,
                reach,
                engagement,
                saves,
                video_views: videoViews,
                engagement_rate: engagementRate,
                save_rate: saveRate
              },
              analysis: {
                hashtags,
                hashtag_count: hashtags.length,
                hour_posted: hourOfDay,
                day_of_week: dayOfWeek,
                performance_score: (engagementRate * 0.6) + (saveRate * 0.4)
              }
            }
          })

          contentAnalysis.instagram.posts = posts

          // Calcular métricas agregadas
          if (posts.length > 0) {
            contentAnalysis.instagram.metrics.total_posts = posts.length
            contentAnalysis.instagram.metrics.avg_engagement_rate = 
              posts.reduce((sum: number, post: any) => sum + post.metrics.engagement_rate, 0) / posts.length

            // Melhor e pior post
            contentAnalysis.instagram.metrics.best_performing_post = 
              posts.reduce((best: any, current: any) => 
                current.analysis.performance_score > best.analysis.performance_score ? current : best)

            contentAnalysis.instagram.metrics.worst_performing_post = 
              posts.reduce((worst: any, current: any) => 
                current.analysis.performance_score < worst.analysis.performance_score ? current : worst)

            // Análise por tipo de conteúdo
            const typePerformance: any = {}
            posts.forEach((post: any) => {
              if (!typePerformance[post.media_type]) {
                typePerformance[post.media_type] = {
                  count: 0,
                  total_engagement: 0,
                  avg_engagement: 0
                }
              }
              typePerformance[post.media_type].count++
              typePerformance[post.media_type].total_engagement += post.metrics.engagement_rate
            })

            Object.keys(typePerformance).forEach(type => {
              typePerformance[type].avg_engagement = 
                typePerformance[type].total_engagement / typePerformance[type].count
            })

            contentAnalysis.instagram.metrics.engagement_by_type = typePerformance

            // Análise de horários ótimos
            const hourPerformance: any = {}
            posts.forEach((post: any) => {
              const hour = post.analysis.hour_posted
              if (!hourPerformance[hour]) {
                hourPerformance[hour] = {
                  count: 0,
                  total_engagement: 0,
                  avg_engagement: 0
                }
              }
              hourPerformance[hour].count++
              hourPerformance[hour].total_engagement += post.metrics.engagement_rate
            })

            Object.keys(hourPerformance).forEach(hour => {
              hourPerformance[hour].avg_engagement = 
                hourPerformance[hour].total_engagement / hourPerformance[hour].count
            })

            // Top 3 horários
            contentAnalysis.insights.optimal_posting_times = Object.entries(hourPerformance)
              .sort(([,a]: any, [,b]: any) => b.avg_engagement - a.avg_engagement)
              .slice(0, 3)
              .map(([hour, data]: any) => ({
                hour: parseInt(hour),
                avg_engagement: data.avg_engagement,
                posts_count: data.count
              }))

            // Análise de hashtags
            const hashtagPerformance: any = {}
            posts.forEach((post: any) => {
              post.analysis.hashtags.forEach((hashtag: string) => {
                if (!hashtagPerformance[hashtag]) {
                  hashtagPerformance[hashtag] = {
                    count: 0,
                    total_engagement: 0,
                    avg_engagement: 0
                  }
                }
                hashtagPerformance[hashtag].count++
                hashtagPerformance[hashtag].total_engagement += post.metrics.engagement_rate
              })
            })

            Object.keys(hashtagPerformance).forEach(hashtag => {
              hashtagPerformance[hashtag].avg_engagement = 
                hashtagPerformance[hashtag].total_engagement / hashtagPerformance[hashtag].count
            })

            // Top 10 hashtags
            contentAnalysis.insights.hashtag_performance = Object.entries(hashtagPerformance)
              .sort(([,a]: any, [,b]: any) => b.avg_engagement - a.avg_engagement)
              .slice(0, 10)
              .map(([hashtag, data]: any) => ({
                tag: hashtag,
                avg_engagement: data.avg_engagement,
                usage_count: data.count
              }))
          }
        }

        // 2. BUSCAR STORIES (últimas 24h)
        try {
          console.log('📖 Analisando Instagram Stories...')
          const storiesResponse = await fetch(
            `https://graph.facebook.com/v18.0/${instagramId}/stories?fields=id,media_type,media_url,timestamp,insights.metric(impressions,reach,replies,exits)&access_token=${accessToken}`
          )
          const storiesData = await storiesResponse.json()

          if (storiesResponse.ok && storiesData.data) {
            contentAnalysis.instagram.stories = storiesData.data.map((story: any) => {
              const insights = story.insights?.data || []
              const impressions = insights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0
              const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0
              const replies = insights.find((i: any) => i.name === 'replies')?.values?.[0]?.value || 0
              const exits = insights.find((i: any) => i.name === 'exits')?.values?.[0]?.value || 0

              return {
                id: story.id,
                media_type: story.media_type,
                media_url: story.media_url,
                timestamp: story.timestamp,
                metrics: {
                  impressions,
                  reach,
                  replies,
                  exits,
                  completion_rate: impressions > 0 ? ((impressions - exits) / impressions) * 100 : 0
                }
              }
            })
          }
        } catch (storiesError) {
          console.warn('⚠️ Erro ao buscar stories:', storiesError)
        }
      }

      // 3. ANÁLISE DE POSTS DO FACEBOOK
      if (pageId) {
        console.log('📘 Analisando posts do Facebook...')
        
        const facebookPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,type,link,picture,full_picture,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total)&limit=50&access_token=${accessToken}`
        )
        const facebookPostsData = await facebookPostsResponse.json()

        if (facebookPostsResponse.ok && facebookPostsData.data) {
          const posts = facebookPostsData.data.map((post: any) => {
            const insights = post.insights?.data || []
            const impressions = insights.find((i: any) => i.name === 'post_impressions')?.values?.[0]?.value || 0
            const engagedUsers = insights.find((i: any) => i.name === 'post_engaged_users')?.values?.[0]?.value || 0
            const clicks = insights.find((i: any) => i.name === 'post_clicks')?.values?.[0]?.value || 0

            const likes = post.likes?.summary?.total_count || 0
            const comments = post.comments?.summary?.total_count || 0
            const shares = post.shares?.count || 0

            const engagementRate = impressions > 0 ? (engagedUsers / impressions) * 100 : 0

            return {
              id: post.id,
              message: post.message,
              created_time: post.created_time,
              type: post.type,
              link: post.link,
              picture: post.picture,
              metrics: {
                likes,
                comments,
                shares,
                impressions,
                engaged_users: engagedUsers,
                clicks,
                engagement_rate: engagementRate,
                total_interactions: likes + comments + shares
              }
            }
          })

          contentAnalysis.facebook.posts = posts

          // Calcular métricas agregadas do Facebook
          if (posts.length > 0) {
            contentAnalysis.facebook.metrics.total_posts = posts.length
            contentAnalysis.facebook.metrics.avg_engagement_rate = 
              posts.reduce((sum: number, post: any) => sum + post.metrics.engagement_rate, 0) / posts.length

            contentAnalysis.facebook.metrics.best_performing_post = 
              posts.reduce((best: any, current: any) => 
                current.metrics.engagement_rate > best.metrics.engagement_rate ? current : best)

            contentAnalysis.facebook.metrics.worst_performing_post = 
              posts.reduce((worst: any, current: any) => 
                current.metrics.engagement_rate < worst.metrics.engagement_rate ? current : worst)
          }
        }
      }

      // 4. RECOMENDAÇÕES BASEADAS EM IA
      const recommendations = []

      if (contentAnalysis.instagram.metrics.avg_engagement_rate < 3) {
        recommendations.push({
          type: 'content',
          priority: 'high',
          title: 'Baixo Engajamento no Instagram',
          description: 'Taxa de engajamento abaixo de 3%. Melhore a qualidade do conteúdo.',
          action: 'Poste mais reels, use trending sounds e hashtags relevantes'
        })
      }

      if (contentAnalysis.insights.optimal_posting_times.length > 0) {
        const bestTime = contentAnalysis.insights.optimal_posting_times[0]
        recommendations.push({
          type: 'timing',
          priority: 'medium',
          title: 'Horário Ótimo Identificado',
          description: `Poste às ${bestTime.hour}h para melhor engajamento`,
          action: `Agende posts para ${bestTime.hour}:00 - ${bestTime.hour + 1}:00`
        })
      }

      if (contentAnalysis.instagram.metrics.engagement_by_type) {
        const topType = Object.entries(contentAnalysis.instagram.metrics.engagement_by_type)
          .sort(([,a]: any, [,b]: any) => b.avg_engagement - a.avg_engagement)[0]
        
        if (topType) {
          recommendations.push({
            type: 'content_type',
            priority: 'medium',
            title: `${topType[0]} Performance Melhor`,
            description: `Posts do tipo ${topType[0]} têm melhor engajamento`,
            action: `Crie mais conteúdo do tipo ${topType[0]}`
          })
        }
      }

      return NextResponse.json({
        success: true,
        content_analysis: contentAnalysis,
        recommendations,
        summary: {
          total_instagram_posts: contentAnalysis.instagram.metrics.total_posts,
          total_facebook_posts: contentAnalysis.facebook.metrics.total_posts,
          avg_instagram_engagement: contentAnalysis.instagram.metrics.avg_engagement_rate,
          avg_facebook_engagement: contentAnalysis.facebook.metrics.avg_engagement_rate,
          top_hashtags: contentAnalysis.insights.hashtag_performance.slice(0, 3),
          optimal_times: contentAnalysis.insights.optimal_posting_times
        },
        timestamp: new Date().toISOString()
      })

    } catch (metaError: any) {
      console.log(`⚠️ Erro ao analisar conteúdo: ${metaError.message}`)
      
      return NextResponse.json({
        success: true,
        content_analysis: {
          instagram: { posts: [], stories: [], reels: [], metrics: {} },
          facebook: { posts: [], metrics: {} },
          insights: {}
        },
        recommendations: [],
        metadata: {
          data_type: 'no_content_data',
          error: metaError.message,
          note: 'Para análise de conteúdo, é necessário ter posts publicados nas últimas semanas.'
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('❌ Erro ao analisar conteúdo:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao analisar conteúdo',
      details: error.message
    }, { status: 500 })
  }
} 