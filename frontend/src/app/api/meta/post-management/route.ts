import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// üì± GET /api/meta/post-management
// Buscar posts recentes para gest·£o
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('üì± Gest·£o de posts Meta...')

    // Obter dados do usu·°rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`üë§ Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('ö†Ô∏è Erro ao parsear dados do usu·°rio, usando bar_id padr·£o')
      }
    }

    // Buscar configura·ß·£o da Meta
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
        error: 'Configura·ß·£o Meta n·£o encontrada',
        posts: []
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const configs = config.configuracoes || {}
    const pageId = configs.page_id
    const instagramId = configs.instagram_account_id

    try {
      const managementData = {
        facebook_posts: [] as any[],
        instagram_posts: [] as any[],
        recent_comments: [] as any[],
        pending_responses: [] as any[],
        engagement_summary: {
          total_posts: 0,
          total_comments: 0,
          pending_comments: 0,
          response_rate: 0
        }
      }

      // 1. BUSCAR POSTS RECENTES DO FACEBOOK
      if (pageId) {
        console.log('üìò Buscando posts do Facebook para gest·£o...')
        
        const facebookPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,type,story,link,picture,full_picture,likes.summary(true),comments.limit(10){id,message,created_time,from,parent},shares,reactions.summary(true),is_published&limit=20&access_token=${accessToken}`
        )
        const facebookPostsData = await facebookPostsResponse.json()

        if (facebookPostsResponse.ok && facebookPostsData.data) {
          managementData.facebook_posts = facebookPostsData.data.map((post) => {
            const comments = post.comments?.data || []
            const pendingComments = comments.filter((comment) => !comment.parent)

            return {
              id: post.id,
              platform: 'facebook',
              message: post.message || post.story || '',
              created_time: post.created_time,
              type: post.type,
              link: post.link,
              picture: post.picture,
              is_published: post.is_published,
              metrics: {
                likes: post.likes?.summary?.total_count || 0,
                comments: comments.length,
                shares: post.shares?.count || 0,
                reactions: post.reactions?.summary?.total_count || 0
              },
              comments: comments.slice(0, 5).map((comment) => ({
                id: comment.id,
                message: comment.message,
                created_time: comment.created_time,
                from: comment.from,
                has_response: !!comment.parent,
                needs_response: !comment.parent && comment.message.includes('?')
              })),
              engagement_level: comments.length > 10 ? 'high' : comments.length > 3 ? 'medium' : 'low',
              needs_attention: pendingComments.some((c) => c.message.includes('?') || c.message.includes('d·∫vida') || c.message.includes('problema'))
            }
          })
        }
      }

      // 2. BUSCAR POSTS RECENTES DO INSTAGRAM
      if (instagramId) {
        console.log('üì∑ Buscando posts do Instagram para gest·£o...')
        
        const instagramPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,comments.limit(10){id,text,timestamp,from,replies},insights.metric(impressions,reach,engagement)&limit=20&access_token=${accessToken}`
        )
        const instagramPostsData = await instagramPostsResponse.json()

        if (instagramPostsResponse.ok && instagramPostsData.data) {
          managementData.instagram_posts = instagramPostsData.data.map((post) => {
            const comments = post.comments?.data || []
            const insights = post.insights?.data || []
            const impressions = insights.find((i) => i.name === 'impressions')?.values?.[0]?.value || 0
            const reach = insights.find((i) => i.name === 'reach')?.values?.[0]?.value || 0
            const engagement = insights.find((i) => i.name === 'engagement')?.values?.[0]?.value || 0

            return {
              id: post.id,
              platform: 'instagram',
              caption: post.caption || '',
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
                engagement_rate: impressions > 0 ? (engagement / impressions) * 100 : 0
              },
              comments: comments.slice(0, 5).map((comment) => ({
                id: comment.id,
                text: comment.text,
                timestamp: comment.timestamp,
                from: comment.from,
                has_replies: comment.replies?.data?.length > 0,
                needs_response: comment.text.includes('?') || comment.text.includes('@')
              })),
              engagement_level: engagement > 100 ? 'high' : engagement > 30 ? 'medium' : 'low',
              needs_attention: comments.some((c) => c.text.includes('?') && !c.has_replies)
            }
          })
        }
      }

      // 3. CONSOLIDAR COMENT·ÅRIOS PENDENTES
      const allPosts = [...managementData.facebook_posts, ...managementData.instagram_posts]
      
      allPosts.forEach((post) => {
        post.comments?.forEach((comment) => {
          if ((comment.needs_response && !comment.has_response && !comment.has_replies) || 
              comment.message?.includes('d·∫vida') || comment.text?.includes('d·∫vida')) {
            managementData.pending_responses.push({
              post_id: post.id,
              post_platform: post.platform,
              post_preview: post.message?.substring(0, 50) || post.caption?.substring(0, 50) || '',
              comment_id: comment.id,
              comment_text: comment.message || comment.text,
              comment_from: comment.from,
              comment_time: comment.created_time || comment.timestamp,
              priority: comment.message?.includes('problema') || comment.text?.includes('problema') ? 'high' : 'medium'
            })
          }
        })
      })

      // 4. BUSCAR COMENT·ÅRIOS RECENTES GERAIS
      managementData.recent_comments = allPosts
        .flatMap(post => post.comments.map((comment) => ({
          ...comment,
          post_id: post.id,
          post_platform: post.platform,
          post_preview: post.message?.substring(0, 30) || post.caption?.substring(0, 30) || ''
        })))
        .sort((a, b) => new Date(b.created_time || b.timestamp).getTime() - new Date(a.created_time || a.timestamp).getTime())
        .slice(0, 10)

      // 5. CALCULAR RESUMO DE ENGAJAMENTO
      managementData.engagement_summary = {
        total_posts: allPosts.length,
        total_comments: allPosts.reduce((sum, post) => sum + post.comments.length, 0),
        pending_comments: managementData.pending_responses.length,
        response_rate: managementData.pending_responses.length > 0 ? 
          ((managementData.engagement_summary.total_comments - managementData.pending_responses.length) / managementData.engagement_summary.total_comments) * 100 : 100
      }

      // 6. GERAR INSIGHTS DE GEST·ÉO
      const managementInsights = [] as any[]

      if (managementData.pending_responses.length > 5) {
        managementInsights.push({
          type: 'urgent',
          title: 'Muitos Coment·°rios Pendentes',
          description: `${managementData.pending_responses.length} coment·°rios aguardando resposta`,
          action: 'Priorize responder coment·°rios com perguntas e men·ß·µes'
        })
      }

      const highEngagementPosts = allPosts.filter((post) => post.engagement_level === 'high')
      if (highEngagementPosts.length > 0) {
        managementInsights.push({
          type: 'opportunity',
          title: 'Posts com Alto Engajamento',
          description: `${highEngagementPosts.length} posts com alto engajamento merecem aten·ß·£o`,
          action: 'Responda coment·°rios e impulsione a conversa'
        })
      }

      const postsNeedingAttention = allPosts.filter((post) => post.needs_attention)
      if (postsNeedingAttention.length > 0) {
        managementInsights.push({
          type: 'attention',
          title: 'Posts Precisam de Aten·ß·£o',
          description: `${postsNeedingAttention.length} posts t·™m coment·°rios importantes`,
          action: 'Verifique coment·°rios com d·∫vidas ou problemas'
        })
      }

      return NextResponse.json({
        success: true,
        management_data: managementData,
        insights: managementInsights,
        summary: {
          facebook_posts: managementData.facebook_posts.length,
          instagram_posts: managementData.instagram_posts.length,
          pending_responses: managementData.pending_responses.length,
          high_engagement_posts: highEngagementPosts.length
        },
        timestamp: new Date().toISOString()
      })

    } catch (metaError) {
      console.log(`ö†Ô∏è Erro ao buscar dados de gest·£o: ${metaError.message}`)
      
      return NextResponse.json({
        success: true,
        management_data: {
          facebook_posts: [] as any[],
          instagram_posts: [] as any[],
          recent_comments: [] as any[],
          pending_responses: [] as any[],
          engagement_summary: { total_posts: 0, total_comments: 0, pending_comments: 0, response_rate: 0 }
        },
        insights: [] as any[],
        metadata: {
          data_type: 'no_management_data',
          error: metaError.message,
          note: 'Para gest·£o de posts, ·© necess·°rio ter posts recentes e permiss·µes de coment·°rios.'
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('ùå Erro na gest·£o de posts:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro na gest·£o de posts',
      details: error.message
    }, { status: 500 })
  }
}

// ========================================
// üí¨ POST /api/meta/post-management
// Responder coment·°rio
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('üí¨ Respondendo coment·°rio Meta...')

    // Obter dados do usu·°rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`üë§ Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('ö†Ô∏è Erro ao parsear dados do usu·°rio, usando bar_id padr·£o')
      }
    }

    const { comment_id, response_text, platform } = await request.json()

    if (!comment_id || !response_text) {
      return NextResponse.json({
        success: false,
        error: 'ID do coment·°rio e texto da resposta s·£o obrigat·≥rios'
      }, { status: 400 })
    }

    // Buscar configura·ß·£o da Meta
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
        error: 'Configura·ß·£o Meta n·£o encontrada'
      }, { status: 404 })
    }

    const accessToken = config.access_token

    try {
      let responseResult

      if (platform === 'facebook') {
        // Responder coment·°rio do Facebook
        const facebookResponse = await fetch(
          `https://graph.facebook.com/v18.0/${comment_id}/comments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: response_text,
              access_token: accessToken
            })
          }
        )
        responseResult = await facebookResponse.json()

        if (!facebookResponse.ok) {
          throw new Error(`Erro Facebook: ${responseResult.error?.message}`)
        }
      } else if (platform === 'instagram') {
        // Responder coment·°rio do Instagram
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${comment_id}/replies`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: response_text,
              access_token: accessToken
            })
          }
        )
        responseResult = await instagramResponse.json()

        if (!instagramResponse.ok) {
          throw new Error(`Erro Instagram: ${responseResult.error?.message}`)
        }
      } else {
        throw new Error('Plataforma n·£o suportada')
      }

      // Log da resposta enviada
      console.log(`úÖ Resposta enviada para ${platform}:`, {
        comment_id,
        response_id: responseResult.id,
        response_text: response_text.substring(0, 50) + '...'
      })

      return NextResponse.json({
        success: true,
        response_id: responseResult.id,
        message: 'Resposta enviada com sucesso!',
        platform,
        timestamp: new Date().toISOString()
      })

    } catch (metaError) {
      console.error(`ùå Erro ao responder coment·°rio: ${metaError.message}`)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar resposta',
        details: metaError.message,
        note: 'Verifique se voc·™ tem permiss·µes para responder coment·°rios nesta plataforma.'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('ùå Erro ao processar resposta:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao processar resposta',
      details: error.message
    }, { status: 500 })
  }
} 
