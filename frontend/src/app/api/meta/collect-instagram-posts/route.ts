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
    
    // console.log('📱 Coletando dados completos dos posts do Instagram...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada',
        details: configError?.message 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const configs = config.configuracoes || {}
    const instagramId = configs.instagram_account_id

    console.log('📷 1. Dados da conta Instagram...')
    
    // 1. DADOS DA CONTA
    const accountUrl = `https://graph.facebook.com/v18.0/${instagramId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website&access_token=${accessToken}`
    
    const accountResponse = await fetch(accountUrl)
    const accountData = await accountResponse.json()

    if (!accountResponse.ok) {
      return NextResponse.json({ error: 'Erro ao buscar dados da conta', details: accountData }, { status: 400 })
    }

    console.log('📱 2. Todos os posts com engajamento...')
    
    // 2. POSTS COM ENGAJAMENTO REAL - Usar API única como você mostrou
    const postsUrl = `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}&limit=100&access_token=${accessToken}`
    
    const postsResponse = await fetch(postsUrl)
    const postsData = await postsResponse.json()

    if (!postsResponse.ok) {
      return NextResponse.json({ error: 'Erro ao buscar posts', details: postsData }, { status: 400 })
    }

    console.log('🔧 3. Processando dados...')

    const posts = postsData.data || []
    
    // Calcular métricas dos posts
    let totalLikes = 0
    let totalComments = 0
    
    const processedPosts = posts.map((post: any) => {
      const likes = post.like_count || 0
      const comments = post.comments_count || 0
      
      totalLikes += likes
      totalComments += comments

      return {
        id: post.id,
        caption: post.caption,
        media_type: post.media_type,
        media_url: post.media_url,
        permalink: post.permalink,
        thumbnail_url: post.thumbnail_url,
        timestamp: post.timestamp,
        like_count: likes,
        comments_count: comments,
        total_engagement: likes + comments,
        children: post.children?.data || []
      }
    })

    // Categorizar posts por tipo
    const postsByType = {
      photo: posts.filter((p: any) => p.media_type === 'IMAGE').length,
      video: posts.filter((p: any) => p.media_type === 'VIDEO').length,
      carousel: posts.filter((p: any) => p.media_type === 'CAROUSEL_ALBUM').length
    }

    // Posts mais engajados
    const topPosts = processedPosts
      .sort((a: any, b: any) => b.total_engagement - a.total_engagement)
      .slice(0, 10)

    // Calcular médias
    const avgLikesPerPost = posts.length > 0 ? totalLikes / posts.length : 0
    const avgCommentsPerPost = posts.length > 0 ? totalComments / posts.length : 0
    const engagementRate = accountData.followers_count > 0 ? 
      ((totalLikes + totalComments) / accountData.followers_count) * 100 : 0

    console.log('💾 4. Salvando no banco...')

    // Atualizar Instagram metrics com dados reais
    await supabase
      .from('instagram_metrics')
      .upsert({
        bar_id: 3,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        follower_count: accountData.followers_count || 0,
        following_count: accountData.follows_count || 0,
        impressions: 0, // Não disponível
        reach: 0, // Não disponível 
        profile_views: 0, // Não disponível
        posts_impressions: 0, // Não disponível
        posts_reach: 0, // Não disponível
        posts_likes: totalLikes,
        posts_comments: totalComments,
        posts_saves: 0, // Não disponível
        posts_shares: 0, // Não disponível
        stories_impressions: 0,
        stories_reach: 0,
        stories_replies: 0,
        stories_exits: 0,
        reels_plays: 0,
        reels_reach: 0,
        reels_likes: posts.filter((p: any) => p.media_type === 'VIDEO').reduce((sum: number, p: any) => sum + (p.like_count || 0), 0),
        reels_comments: posts.filter((p: any) => p.media_type === 'VIDEO').reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0),
        reels_shares: 0,
        reels_saves: 0,
        raw_data: {
          account_info: accountData,
          posts_complete: processedPosts,
          calculated_metrics: {
            total_posts_analyzed: posts.length,
            total_likes: totalLikes,
            total_comments: totalComments,
            total_engagement: totalLikes + totalComments,
            avg_likes_per_post: avgLikesPerPost,
            avg_comments_per_post: avgCommentsPerPost,
            engagement_rate_percentage: engagementRate
          },
          posts_by_type: postsByType,
          top_posts: topPosts.slice(0, 5),
          collected_at: new Date().toISOString(),
          collection_type: 'instagram_posts_complete',
          api_version: 'v18.0',
          real_data: true
        }
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    // Atualizar métricas consolidadas
    const totalFollowers = (accountData.followers_count || 0) + 95 // Facebook
    const totalEngagement = totalLikes + totalComments

    await supabase
      .from('social_metrics_consolidated')
      .upsert({
        bar_id: 3,
        data_referencia: new Date().toISOString().split('T')[0],
        periodo: 'day',
        total_reach: 0,
        total_impressions: 0,
        total_engagement: totalEngagement,
        total_followers: totalFollowers,
        facebook_reach: 0,
        facebook_impressions: 0,
        facebook_engagement: 0,
        facebook_followers: 95,
        instagram_reach: 0,
        instagram_impressions: 0,
        instagram_engagement: totalEngagement,
        instagram_followers: accountData.followers_count || 0,
        crescimento_followers: 0,
        performance_score: engagementRate
      }, {
        onConflict: 'bar_id,data_referencia,periodo'
      })

    const results = {
      success: true,
      message: 'Posts do Instagram coletados com sucesso!',
      timestamp: new Date().toISOString(),
      data: {
        account: {
          username: accountData.username,
          name: accountData.name,
          biography: accountData.biography,
          followers: accountData.followers_count,
          following: accountData.follows_count,
          media_count: accountData.media_count,
          website: accountData.website
        },
        posts_analysis: {
          total_posts_analyzed: posts.length,
          total_likes: totalLikes,
          total_comments: totalComments,
          total_engagement: totalLikes + totalComments,
          avg_likes_per_post: Math.round(avgLikesPerPost),
          avg_comments_per_post: Math.round(avgCommentsPerPost * 10) / 10,
          engagement_rate: engagementRate.toFixed(2) + '%'
        },
        posts_by_type: postsByType,
        top_posts: topPosts.slice(0, 5).map((post: any) => ({
          id: post.id,
          media_type: post.media_type,
          likes: post.like_count,
          comments: post.comments_count,
          total_engagement: post.total_engagement,
          caption_preview: post.caption?.substring(0, 100) + '...' || 'Sem legenda',
          timestamp: post.timestamp
        }))
      }
    }

    console.log('✅ Coleta de posts concluída!')
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao coletar posts:', error)
    return NextResponse.json({ 
      error: 'Erro ao coletar posts do Instagram',
      details: error.message 
    }, { status: 500 })
  }
} 