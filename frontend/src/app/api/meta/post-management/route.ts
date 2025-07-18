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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// Ã°Å¸â€œÂ± GET /api/meta/post-management
// Buscar posts recentes para gestÃ¡Â£o
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€œÂ± GestÃ¡Â£o de posts Meta...')

    // Obter dados do usuÃ¡Â¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData) as unknown)
        barId = parsedUser.bar_id || 3
        console.log(`Ã°Å¸â€˜Â¤ Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('Å¡Â Ã¯Â¸Â Erro ao parsear dados do usuÃ¡Â¡rio, usando bar_id padrÃ¡Â£o')
      }
    }

    // Buscar configuraÃ¡Â§Ã¡Â£o da Meta
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
        error: 'ConfiguraÃ¡Â§Ã¡Â£o Meta nÃ¡Â£o encontrada',
        posts: []
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const configs = config.configuracoes || {}
    const pageId = configs.page_id
    const instagramId = configs.instagram_account_id

    try {
      const managementData = {
        facebook_posts: [] as unknown[],
        instagram_posts: [] as unknown[],
        recent_comments: [] as unknown[],
        pending_responses: [] as unknown[],
        engagement_summary: {
          total_posts: 0,
          total_comments: 0,
          pending_comments: 0,
          response_rate: 0
        }
      }

      // 1. BUSCAR POSTS RECENTES DO FACEBOOK
      if (pageId) {
        console.log('Ã°Å¸â€œËœ Buscando posts do Facebook para gestÃ¡Â£o...')
        
        const facebookPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,type,story,link,picture,full_picture,likes.summary(true),comments.limit(10){id,message,created_time,from,parent},shares,reactions.summary(true),is_published&limit=20&access_token=${accessToken}`
        )
        const facebookPostsData = await facebookPostsResponse.json()

        if (facebookPostsResponse.ok && facebookPostsData.data) {
          managementData.facebook_posts = facebookPostsData.data.map((post: FacebookPost) => {
            const comments: FacebookComment[] = post.comments?.data || []
            const pendingComments = comments.filter((comment: FacebookComment) => !comment.parent)

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
              comments: comments.slice(0, 5).map((comment: FacebookComment) => ({
                id: comment.id,
                message: comment.message,
                created_time: comment.created_time,
                from: comment.from,
                has_response: !!comment.parent,
                needs_response: !comment.parent && comment.message.includes('?')
              })),
              engagement_level: comments.length > 10 ? 'high' : comments.length > 3 ? 'medium' : 'low',
              needs_attention: pendingComments.some((c: FacebookComment) => c.message.includes('?') || c.message.includes('dÃºvida') || c.message.includes('problema'))
            }
          })
        }
      }

      // 2. BUSCAR POSTS RECENTES DO INSTAGRAM
      if (instagramId) {
        console.log('Ã°Å¸â€œÂ· Buscando posts do Instagram para gestÃ¡Â£o...')
        
        const instagramPostsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,comments.limit(10){id,text,timestamp,from,replies},insights.metric(impressions,reach,engagement)&limit=20&access_token=${accessToken}`
        )
        const instagramPostsData = await instagramPostsResponse.json()

        if (instagramPostsResponse.ok && instagramPostsData.data) {
          managementData.instagram_posts = instagramPostsData.data.map((post: InstagramPost) => {
            const comments: InstagramComment[] = post.comments?.data || []
            const insights = post.insights?.data || []
            const impressions = insights.find((i: { name: string; values: { value: number }[] }) => i.name === 'impressions')?.values?.[0]?.value || 0
            const reach = insights.find((i: { name: string; values: { value: number }[] }) => i.name === 'reach')?.values?.[0]?.value || 0
            const engagement = insights.find((i: { name: string; values: { value: number }[] }) => i.name === 'engagement')?.values?.[0]?.value || 0

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
              comments: comments.slice(0, 5).map((comment: InstagramComment) => ({
                id: comment.id,
                text: comment.text,
                timestamp: comment.timestamp,
                from: comment.from,
                has_replies: (comment.replies?.data?.length || 0) > 0,
                needs_response: comment.text.includes('?') || comment.text.includes('@')
              })),
              engagement_level: engagement > 100 ? 'high' : engagement > 30 ? 'medium' : 'low',
              needs_attention: comments.some((c: InstagramComment) => c.text.includes('?') && !c.has_replies)
            }
          })
        }
      }

      // 3. CONSOLIDAR COMENTÃ¡ÂRIOS PENDENTES
      const allPosts = [...managementData.facebook_posts, ...managementData.instagram_posts]
      
      allPosts.forEach((post: FacebookPost | InstagramPost) => {
        ((post.comments && Array.isArray(post.comments.data)) ? post.comments.data : []).forEach((comment: FacebookComment | InstagramComment) => {
          if (((comment as unknown).needs_response && !(comment as unknown).has_response && !(comment as unknown).has_replies) || 
              ((comment as unknown).message?.includes('dúvida') || (comment as unknown).text?.includes('dúvida'))) {
            managementData.pending_responses.push({
              post_id: post.id,
              post_platform: post.platform,
              post_preview: post.message?.substring(0, 50) || post.caption?.substring(0, 50) || '',
              comment_id: comment.id,
              comment_text: (comment as unknown).message || (comment as unknown).text,
              comment_from: (comment as unknown).from,
              comment_time: (comment as unknown).created_time || (comment as unknown).timestamp,
              priority: ((comment as unknown).message?.includes('problema') || (comment as unknown).text?.includes('problema')) ? 'high' : 'medium'
            })
          }
        })
      })

      // 4. BUSCAR COMENTÃ¡ÂRIOS RECENTES GERAIS
      managementData.recent_comments = allPosts
        .flatMap((post: unknown) => (post.comments?.data || []).map((comment: unknown) => ({
          ...comment,
          post_id: post.id,
          post_platform: post.platform,
          post_preview: post.message?.substring(0, 30) || post.caption?.substring(0, 30) || ''
        })))
        .sort((a: unknown, b: unknown) => {
          const aTime = (a.created_time || a.timestamp);
          const bTime = (b.created_time || b.timestamp);
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })
        .slice(0, 10)

      // 5. CALCULAR RESUMO DE ENGAJAMENTO
      managementData.engagement_summary = {
        total_posts: allPosts.length,
        total_comments: allPosts.reduce((sum: number, post: unknown) => sum + (post.comments?.data?.length || 0), 0),
        pending_comments: managementData.pending_responses.length,
        response_rate: managementData.pending_responses.length > 0 ? 
          ((managementData.engagement_summary.total_comments - managementData.pending_responses.length) / managementData.engagement_summary.total_comments) * 100 : 100
      }

      // 6. GERAR INSIGHTS DE GESTÃ¡Æ’O
      const managementInsights = [] as unknown[]

      if (managementData.pending_responses.length > 5) {
        managementInsights.push({
          type: 'urgent',
          title: 'Muitos ComentÃ¡Â¡rios Pendentes',
          description: `${managementData.pending_responses.length} comentÃ¡Â¡rios aguardando resposta`,
          action: 'Priorize responder comentÃ¡Â¡rios com perguntas e menÃ¡Â§Ã¡Âµes'
        })
      }

      const highEngagementPosts = allPosts.filter((post: FacebookPost | InstagramPost) => post.engagement_level === 'high')
      if (highEngagementPosts.length > 0) {
        managementInsights.push({
          type: 'opportunity',
          title: 'Posts com Alto Engajamento',
          description: `${highEngagementPosts.length} posts com alto engajamento merecem atenÃ¡Â§Ã¡Â£o`,
          action: 'Responda comentÃ¡Â¡rios e impulsione a conversa'
        })
      }

      const postsNeedingAttention = allPosts.filter((post: FacebookPost | InstagramPost) => post.needs_attention)
      if (postsNeedingAttention.length > 0) {
        managementInsights.push({
          type: 'attention',
          title: 'Posts Precisam de AtenÃ¡Â§Ã¡Â£o',
          description: `${postsNeedingAttention.length} posts tÃ¡Âªm comentÃ¡Â¡rios importantes`,
          action: 'Verifique comentÃ¡Â¡rios com dÃ¡Âºvidas ou problemas'
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
      console.log(`Å¡Â Ã¯Â¸Â Erro ao buscar dados de gestÃ¡Â£o: ${(metaError as unknown).message}`)
      
      return NextResponse.json({
        success: true,
        management_data: {
          facebook_posts: [] as unknown[],
          instagram_posts: [] as unknown[],
          recent_comments: [] as unknown[],
          pending_responses: [] as unknown[],
          engagement_summary: { total_posts: 0, total_comments: 0, pending_comments: 0, response_rate: 0 }
        },
        insights: [] as unknown[],
        metadata: {
          data_type: 'no_management_data',
          error: (metaError as unknown).message,
          note: 'Para gestÃ¡Â£o de posts, Ã¡Â© necessÃ¡Â¡rio ter posts recentes e permissÃ¡Âµes de comentÃ¡Â¡rios.'
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('ÂÅ’ Erro na gestÃ¡Â£o de posts:', (error as unknown).message)
    return NextResponse.json({ 
      success: false,
      error: 'Erro na gestÃ¡Â£o de posts',
      details: (error as unknown).message
    }, { status: 500 })
  }
}

// ========================================
// Ã°Å¸â€™Â¬ POST /api/meta/post-management
// Responder comentÃ¡Â¡rio
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€™Â¬ Respondendo comentÃ¡Â¡rio Meta...')

    // Obter dados do usuÃ¡Â¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData) as unknown)
        barId = parsedUser.bar_id || 3
        console.log(`Ã°Å¸â€˜Â¤ Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('Å¡Â Ã¯Â¸Â Erro ao parsear dados do usuÃ¡Â¡rio, usando bar_id padrÃ¡Â£o')
      }
    }

    const { comment_id, response_text, platform } = await request.json()

    if (!comment_id || !response_text) {
      return NextResponse.json({
        success: false,
        error: 'ID do comentÃ¡Â¡rio e texto da resposta sÃ¡Â£o obrigatÃ³rios'
      }, { status: 400 })
    }

    // Buscar configuraÃ¡Â§Ã¡Â£o da Meta
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
        error: 'ConfiguraÃ¡Â§Ã¡Â£o Meta nÃ¡Â£o encontrada'
      }, { status: 404 })
    }

    const accessToken = config.access_token

    try {
      let responseResult

      if (platform === 'facebook') {
        // Responder comentÃ¡Â¡rio do Facebook
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
          throw new Error(`Erro Facebook: ${(responseResult as unknown).error?.message}`)
        }
      } else if (platform === 'instagram') {
        // Responder comentÃ¡Â¡rio do Instagram
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
          throw new Error(`Erro Instagram: ${(responseResult as unknown).error?.message}`)
        }
      } else {
        throw new Error('Plataforma nÃ£o suportada')
      }

      // Log da resposta enviada
      console.log(`Å“â€¦ Resposta enviada para ${platform}:`, {
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
      console.error(`ÂÅ’ Erro ao responder comentÃ¡Â¡rio: ${(metaError as unknown).message}`)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar resposta',
        details: (metaError as unknown).message,
        note: 'Verifique se vocÃª tem permissÃµes para responder comentÃ¡Â¡rios nesta plataforma.'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('ÂÅ’ Erro ao processar resposta:', (error as unknown).message)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao processar resposta',
      details: (error as unknown).message
    }, { status: 500 })
  }
} 

// Tipos auxiliares para posts e comentÃ¡rios do Facebook e Instagram
interface FacebookComment {
  id: string;
  message: string;
  created_time: string;
  from: unknown;
  parent?: unknown;
  has_response?: boolean;
  needs_response?: boolean;
}

interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  type: string;
  link?: string;
  picture?: string;
  full_picture?: string;
  is_published: boolean;
  likes?: { summary: { total_count: number } };
  comments?: { data: FacebookComment[] };
  shares?: { count: number };
  reactions?: { summary: { total_count: number } };
  [key: string]: unknown;
}

interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  from: unknown;
  replies?: { data: InstagramComment[] };
  has_replies?: boolean;
  needs_response?: boolean;
}

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  comments?: { data: InstagramComment[] };
  insights?: { data: { name: string; values: { value: number }[] }[] };
  [key: string]: unknown;
} 

