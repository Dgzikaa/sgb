import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MetaCredentials {
  access_token: string
  page_id: string
  instagram_account_id: string
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

async function testCollectFacebook(config: MetaCredentials) {
  try {
    console.log('📊 TESTE: Coletando dados COMPLETOS do Facebook...')
    
    // Dados básicos da página EXPANDIDOS
    const pageUrl = `https://graph.facebook.com/v18.0/${config.page_id}?fields=followers_count,fan_count,name,about,website,phone,category_list,checkins,talking_about_count,were_here_count,new_like_count,overall_star_rating,rating_count,cover,picture&access_token=${config.access_token}`
    const pageResponse = await fetch(pageUrl)
    
    if (!pageResponse.ok) {
      const errorText = await pageResponse.text()
      throw new Error(`Erro ao buscar dados da página: ${pageResponse.status} - ${errorText}`)
    }
    
    const pageData = await pageResponse.json()
    console.log('✅ Dados básicos Facebook:', {
      name: pageData.name,
      fan_count: pageData.fan_count,
      followers_count: pageData.followers_count,
      talking_about_count: pageData.talking_about_count
    })
    
    // INSIGHTS COMPLETOS DA PÁGINA
    console.log('📈 TESTE: Coletando insights completos Facebook...')
    
    // 1. Métricas de Alcance e Impressões
    const reachInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_impressions,page_impressions_unique,page_reach,page_reach_unique,page_posts_impressions,page_posts_impressions_unique&period=day&since=${getDateDaysAgo(7)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    const reachResponse = await fetch(reachInsightsUrl)
    let reachInsights = {}
    if (reachResponse.ok) {
      reachInsights = await reachResponse.json()
      console.log('✅ Insights de alcance coletados:', reachInsights)
    } else {
      console.log('⚠️ Erro insights alcance:', await reachResponse.text())
    }
    
    // 2. Posts recentes com insights
    const postsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/posts?fields=id,message,created_time,reactions.summary(true),comments.summary(true),shares&limit=5&access_token=${config.access_token}`
    
    const postsResponse = await fetch(postsUrl)
    let posts = []
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      posts = postsData.data || []
      console.log('✅ Posts coletados:', posts.length)
    }
    
    return {
      page_info: pageData,
      insights: { reach: reachInsights },
      posts,
      success: true,
      collected_metrics: ['page_impressions', 'page_reach', 'fan_count', 'posts']
    }
    
  } catch (error) {
    console.error('❌ Erro no teste Facebook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      page_info: null,
      insights: {},
      posts: []
    }
  }
}

async function testCollectInstagram(config: MetaCredentials) {
  try {
    console.log('📸 TESTE: Coletando dados COMPLETOS do Instagram...')
    
    // Dados básicos da conta
    const accountUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=followers_count,follows_count,media_count,username,name,biography,website,profile_picture_url&access_token=${config.access_token}`
    const accountResponse = await fetch(accountUrl)
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      throw new Error(`Erro ao buscar dados Instagram: ${accountResponse.status} - ${errorText}`)
    }
    
    const accountData = await accountResponse.json()
    console.log('✅ Dados básicos Instagram:', {
      username: accountData.username,
      followers_count: accountData.followers_count,
      follows_count: accountData.follows_count,
      media_count: accountData.media_count
    })
    
    // INSIGHTS COMPLETOS (teste com métricas básicas primeiro)
    console.log('📊 TESTE: Coletando insights Instagram...')
    
    const basicInsightsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=impressions,reach,profile_views&period=day&since=${getDateDaysAgo(7)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    const insightsResponse = await fetch(basicInsightsUrl)
    let insights = {}
    if (insightsResponse.ok) {
      insights = await insightsResponse.json()
      console.log('✅ Insights básicos coletados:', insights)
    } else {
      const errorText = await insightsResponse.text()
      console.log('⚠️ Erro insights básicos:', errorText)
    }
    
    // MÍDIA RECENTE
    const mediaUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/media?fields=id,media_type,media_url,caption,timestamp,like_count,comments_count&limit=5&access_token=${config.access_token}`
    
    const mediaResponse = await fetch(mediaUrl)
    let media = []
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      media = mediaData.data || []
      console.log('✅ Mídia coletada:', media.length, 'posts')
    }
    
    return {
      account_info: accountData,
      insights,
      media,
      success: true,
      collected_metrics: ['impressions', 'reach', 'profile_views', 'followers_count', 'media']
    }
    
  } catch (error) {
    console.error('❌ Erro no teste Instagram:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      account_info: null,
      insights: {},
      media: []
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 === TESTE ENHANCED META COLLECT ===')
    
    const BAR_ID = 3
    
    // Obter credenciais do Meta
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', BAR_ID)
      .eq('ativo', true)
      .single()

    if (credError || !credenciais || !credenciais.configuracoes) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais do Meta não encontradas',
        details: credError?.message
      }, { status: 400 })
    }

    const metaConfig: MetaCredentials = {
      access_token: credenciais.access_token,
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id
    }

    console.log('🔑 Credenciais encontradas:', {
      page_id: metaConfig.page_id,
      instagram_id: metaConfig.instagram_account_id,
      access_token_length: metaConfig.access_token?.length
    })

    // TESTAR COLETA FACEBOOK
    console.log('\n📘 === TESTANDO FACEBOOK ===')
    const facebookResult = await testCollectFacebook(metaConfig)
    
    // TESTAR COLETA INSTAGRAM  
    console.log('\n📸 === TESTANDO INSTAGRAM ===')
    const instagramResult = await testCollectInstagram(metaConfig)
    
    // RESULTADOS
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: BAR_ID,
      credentials_status: 'OK',
      facebook: {
        success: facebookResult.success,
        error: facebookResult.error || null,
                 data_summary: facebookResult.success ? {
           page_name: facebookResult.page_info?.name,
           fan_count: facebookResult.page_info?.fan_count,
           posts_collected: facebookResult.posts?.length,
           insights_available: !!(facebookResult.insights?.reach as any)?.data
         } : null
      },
      instagram: {
        success: instagramResult.success,
        error: instagramResult.error || null,
                 data_summary: instagramResult.success ? {
           username: instagramResult.account_info?.username,
           followers_count: instagramResult.account_info?.followers_count,
           media_collected: instagramResult.media?.length,
           insights_available: !!(instagramResult.insights as any)?.data
         } : null
      },
      detailed_data: {
        facebook: facebookResult,
        instagram: instagramResult
      }
    }

    console.log('\n✅ === TESTE CONCLUÍDO ===')
    console.log('Facebook Success:', facebookResult.success)
    console.log('Instagram Success:', instagramResult.success)
    
    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 