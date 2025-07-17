import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 📱 GET /api/meta/post-management
// Buscar posts recentes para gestão
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('📱 Gestão de posts Meta...')

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
        console.log('📘 Buscando posts do Facebook para gestão...')
        
        const facebookPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,type,story,link,picture,full_picture,likes.summary(true),comments.limit(10){id,message,created_time,from,parent},shares,reactions.summary(true),is_published&limit=20&access_token=${accessToken}`
        )
        const facebookPostsData = await facebookPostsResponse.json()

        if (facebookPostsResponse.ok && facebookPostsData.data) {
          managementData.facebook_posts = facebookPostsData.data.map((post: any) => {
            const comments = post.comments?.data || []
            const pendingComments = comments.filter((comment: any) => !comment.parent)

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
              comments: comments.slice(0, 5).map((comment: any) => ({
                id: comment.id,
                message: comment.message,
                created_time: comment.created_time,
                from: comment.from,
                has_response: !!comment.parent,
                needs_response: !comment.parent && comment.message.includes('?')
              })),
              engagement_level: comments.length > 10 ? 'high' : comments.length > 3 ? 'medium' : 'low',
              needs_attention: pendingComments.some((c: any) => c.message.includes('?') || c.message.includes('dúvida') || c.message.includes('problema'))
            }
          })
        }
      }

      // 2. BUSCAR POSTS RECENTES DO INSTAGRAM
      if (instagramId) {
        console.log('📷 Buscando posts do Instagram para gestão...')
        
        const instagramPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,comments.limit(10){id,text,timestamp,from,replies},insights.metric(impressions,reach,engagement)&limit=20&access_token=${accessToken}`
        )
        const instagramPostsData = await instagramPostsResponse.json()

        if (instagramPostsResponse.ok && instagramPostsData.data) {
          managementData.instagram_posts = instagramPostsData.data.map((post: any) => {
            const comments = post.comments?.data || []
            const insights = post.insights?.data || []
            const impressions = insights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0
            const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0
            const engagement = insights.find((i: any) => i.name === 'engagement')?.values?.[0]?.value || 0

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
              comments: comments.slice(0, 5).map((comment: any) => ({
                id: comment.id,
                text: comment.text,
                timestamp: comment.timestamp,
                from: comment.from,
                has_replies: comment.replies?.data?.length > 0,
                needs_response: comment.text.includes('?') || comment.text.includes('@')
              })),
              engagement_level: engagement > 100 ? 'high' : engagement > 30 ? 'medium' : 'low',
              needs_attention: comments.some((c: any) => c.text.includes('?') && !c.has_replies)
            }
          })
        }
      }

      // 3. CONSOLIDAR COMENTÁRIOS PENDENTES
      const allPosts = [...managementData.facebook_posts, ...managementData.instagram_posts]
      
      allPosts.forEach((post: any) => {
        post.comments?.forEach((comment: any) => {
          if ((comment.needs_response && !comment.has_response && !comment.has_replies) || 
              comment.message?.includes('dúvida') || comment.text?.includes('dúvida')) {
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

      // 4. BUSCAR COMENTÁRIOS RECENTES GERAIS
      managementData.recent_comments = allPosts
        .flatMap(post => post.comments.map((comment: any) => ({
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

      // 6. GERAR INSIGHTS DE GESTÃO
      const managementInsights = [] as any[]

      if (managementData.pending_responses.length > 5) {
        managementInsights.push({
          type: 'urgent',
          title: 'Muitos Comentários Pendentes',
          description: `${managementData.pending_responses.length} comentários aguardando resposta`,
          action: 'Priorize responder comentários com perguntas e menções'
        })
      }

      const highEngagementPosts = allPosts.filter((post: any) => post.engagement_level === 'high')
      if (highEngagementPosts.length > 0) {
        managementInsights.push({
          type: 'opportunity',
          title: 'Posts com Alto Engajamento',
          description: `${highEngagementPosts.length} posts com alto engajamento merecem atenção`,
          action: 'Responda comentários e impulsione a conversa'
        })
      }

      const postsNeedingAttention = allPosts.filter((post: any) => post.needs_attention)
      if (postsNeedingAttention.length > 0) {
        managementInsights.push({
          type: 'attention',
          title: 'Posts Precisam de Atenção',
          description: `${postsNeedingAttention.length} posts têm comentários importantes`,
          action: 'Verifique comentários com dúvidas ou problemas'
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

    } catch (metaError: any) {
      console.log(`⚠️ Erro ao buscar dados de gestão: ${metaError.message}`)
      
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
          note: 'Para gestão de posts, é necessário ter posts recentes e permissões de comentários.'
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('❌ Erro na gestão de posts:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro na gestão de posts',
      details: error.message
    }, { status: 500 })
  }
}

// ========================================
// 💬 POST /api/meta/post-management
// Responder comentário
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('💬 Respondendo comentário Meta...')

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

    const { comment_id, response_text, platform } = await request.json()

    if (!comment_id || !response_text) {
      return NextResponse.json({
        success: false,
        error: 'ID do comentário e texto da resposta são obrigatórios'
      }, { status: 400 })
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
        error: 'Configuração Meta não encontrada'
      }, { status: 404 })
    }

    const accessToken = config.access_token

    try {
      let responseResult

      if (platform === 'facebook') {
        // Responder comentário do Facebook
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
        // Responder comentário do Instagram
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
        throw new Error('Plataforma não suportada')
      }

      // Log da resposta enviada
      console.log(`✅ Resposta enviada para ${platform}:`, {
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

    } catch (metaError: any) {
      console.error(`❌ Erro ao responder comentário: ${metaError.message}`)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar resposta',
        details: metaError.message,
        note: 'Verifique se você tem permissões para responder comentários nesta plataforma.'
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar resposta:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao processar resposta',
      details: error.message
    }, { status: 500 })
  }
} 
