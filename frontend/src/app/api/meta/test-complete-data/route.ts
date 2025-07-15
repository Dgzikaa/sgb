import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface MetaCredentials {
  access_token: string
  page_id: string
  instagram_account_id: string
  ad_account_id: string
  business_id: string
}

export async function GET() {
  try {
    console.log('🧪 === TESTE COMPLETO META + INSTAGRAM ===')
    
    // Inicializar Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar credenciais
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', 3)
      .single()

    if (!credenciais) {
      throw new Error('Credenciais Meta não encontradas')
    }

    const metaConfig: MetaCredentials = {
      access_token: credenciais.access_token,
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id,
      ad_account_id: credenciais.configuracoes.ad_account_id,
      business_id: credenciais.configuracoes.business_id
    }

    console.log('🔑 Credenciais:', {
      page_id: metaConfig.page_id,
      instagram_account_id: metaConfig.instagram_account_id,
      ad_account_id: metaConfig.ad_account_id,
      token_length: metaConfig.access_token.length
    })

    // ========== TESTE 1: CAMPANHAS COMPLETAS ==========
    console.log('🎯 === TESTANDO CAMPANHAS COMPLETAS ===')
    const campaignsResult = await testarCampanhasCompletas(metaConfig)

    // ========== TESTE 2: INSTAGRAM COMPLETO ==========
    console.log('📸 === TESTANDO INSTAGRAM COMPLETO ===')
    const instagramResult = await testarInstagramCompleto(metaConfig)

    // ========== TESTE 3: FACEBOOK COMPLETO ==========
    console.log('📘 === TESTANDO FACEBOOK COMPLETO ===')
    const facebookResult = await testarFacebookCompleto(metaConfig)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      meta_config: {
        page_id: metaConfig.page_id,
        instagram_account_id: metaConfig.instagram_account_id,
        ad_account_id: metaConfig.ad_account_id,
        business_id: metaConfig.business_id
      },
      results: {
        campaigns: campaignsResult,
        instagram: instagramResult,
        facebook: facebookResult
      },
      summary: {
        total_campaigns: campaignsResult.campaigns?.length || 0,
        campaigns_with_insights: campaignsResult.campaigns?.filter((c: any) => c.insights?.data?.length > 0)?.length || 0,
        total_spend: campaignsResult.totals?.total_spend || 0,
        instagram_followers: instagramResult.account_info?.followers_count || 0,
        facebook_fans: facebookResult.page_info?.fan_count || 0
      }
    })

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function testarCampanhasCompletas(config: MetaCredentials) {
  try {
    console.log('🎯 Testando campanhas da ad account:', config.ad_account_id)

    // 1. VERIFICAR ACESSO À AD ACCOUNT
    const accountUrl = `https://graph.facebook.com/v18.0/${config.ad_account_id}?fields=id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap&access_token=${config.access_token}`
    const accountResponse = await fetch(accountUrl)
    
    if (!accountResponse.ok) {
      const error: any = await accountResponse.json()
      return { error: `Erro ao acessar ad account: ${accountResponse.status}`, details: error }
    }

    const accountInfo = await accountResponse.json()
    console.log('✅ Ad account acessível:', accountInfo.name)

    // 2. BUSCAR CAMPANHAS BÁSICAS
    const campaignsUrl = `https://graph.facebook.com/v18.0/${config.ad_account_id}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time&limit=100&access_token=${config.access_token}`
    const campaignsResponse = await fetch(campaignsUrl)
    
    if (!campaignsResponse.ok) {
      const error: any = await campaignsResponse.json()
      return { error: `Erro ao buscar campanhas: ${campaignsResponse.status}`, details: error }
    }

    const campaignsData = await campaignsResponse.json()
    const campaigns = campaignsData.data || []
    console.log(`📊 Encontradas ${campaigns.length} campanhas`)

    // 3. BUSCAR INSIGHTS DETALHADOS DE CADA CAMPANHA
    for (let i = 0; i < Math.min(campaigns.length, 5); i++) { // Limitar a 5 para teste
      const campaign = campaigns[i]
      console.log(`📈 ${i + 1}: Coletando insights de "${campaign.name}"`)

      try {
        // Insights da campanha (CAMPOS DO ADS MANAGER + DATAS)
        // Baseado nas colunas do Facebook Ads Manager + informações de timing
        const adsManagerFields = [
          'campaign_name',           // Campaign
          'impressions',             // Impressions  
          'reach',                   // Reach
          'spend',                   // Amount spent
          'actions',                 // Results (conversions, clicks, etc)
          'conversions',             // Results específicos
          'cost_per_action_type',    // Cost per result
          'cost_per_conversion',     // Cost per result específico
          'clicks',                  // Para calcular CTR
          'ctr',                     // Click-through rate
          'cpc',                     // Cost per click
          'cpm',                     // Cost per mille
          'date_start',              // Data de início dos insights
          'date_stop'                // Data de fim dos insights
        ].join(',')
        
        const insightsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=${adsManagerFields}&date_preset=last_30d&access_token=${config.access_token}`
        console.log(`   🔗 URL: ${insightsUrl.substring(0, 120)}...`)
        
        const insightsResponse = await fetch(insightsUrl)
        
        if (insightsResponse.ok) {
          campaign.insights = await insightsResponse.json()
          console.log(`   ✅ Insights: ${campaign.insights.data?.length || 0} registros`)
          if (campaign.insights.data?.length > 0) {
            console.log(`      💰 Spend: $${campaign.insights.data[0].spend || 0}`)
          }
        } else {
          const errorData = await insightsResponse.json()
          campaign.insights = { data: [], error: errorData }
          console.log(`   ❌ Insights falhou: ${insightsResponse.status}`, errorData.error?.message || '')
        }

        // Ad sets
        const adSetsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,targeting&access_token=${config.access_token}`
        const adSetsResponse = await fetch(adSetsUrl)
        
        if (adSetsResponse.ok) {
          const adSetsData = await adSetsResponse.json()
          campaign.adsets = adSetsData.data || []
          console.log(`   📢 Ad sets: ${campaign.adsets.length}`)
        } else {
          campaign.adsets = []
        }

        // Anúncios
        const adsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/ads?fields=id,name,status,effective_status,creative&limit=10&access_token=${config.access_token}`
        const adsResponse = await fetch(adsUrl)
        
        if (adsResponse.ok) {
          const adsData = await adsResponse.json()
          campaign.ads = adsData.data || []
          console.log(`   🎨 Anúncios: ${campaign.ads.length}`)
        } else {
          campaign.ads = []
        }

      } catch (campaignError) {
        console.log(`   ❌ Erro na campanha ${campaign.name}:`, campaignError)
        campaign.insights = { data: [] }
        campaign.adsets = []
        campaign.ads = []
      }
    }

    // 4. CALCULAR TOTAIS
    let totalSpend = 0
    let totalImpressions = 0
    let totalReach = 0
    let totalClicks = 0
    let activeCampaigns = 0

    campaigns.forEach((campaign: any) => {
      if (campaign.effective_status === 'ACTIVE') activeCampaigns++
      
      if (campaign.insights?.data?.[0]) {
        const insights = campaign.insights.data[0]
        totalSpend += parseFloat(insights.spend || 0)
        totalImpressions += parseInt(insights.impressions || 0)
        totalReach += parseInt(insights.reach || 0)
        totalClicks += parseInt(insights.clicks || 0)
      }
    })

    return {
      account_info: accountInfo,
      campaigns,
      totals: {
        total_campaigns: campaigns.length,
        active_campaigns: activeCampaigns,
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_reach: totalReach,
        total_clicks: totalClicks
      },
      sample_insights: campaigns.slice(0, 3).map((c: any) => ({
        name: c.name,
        status: c.effective_status,
        insights: c.insights?.data?.[0] || null,
        adsets_count: c.adsets?.length || 0,
        ads_count: c.ads?.length || 0
      }))
    }

  } catch (error) {
    console.error('❌ Erro nas campanhas:', error)
    return { error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

async function testarInstagramCompleto(config: MetaCredentials) {
  try {
    console.log('📸 Testando Instagram account:', config.instagram_account_id)

    // 1. DADOS BÁSICOS DA CONTA
    const accountUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=followers_count,follows_count,media_count,username,name,biography,website,profile_picture_url&access_token=${config.access_token}`
    const accountResponse = await fetch(accountUrl)
    
    if (!accountResponse.ok) {
      const error = await accountResponse.json()
      return { error: `Erro na conta Instagram: ${accountResponse.status}`, details: error }
    }

    const accountData = await accountResponse.json()
    console.log(`✅ Instagram: @${accountData.username}, ${accountData.followers_count} seguidores`)

    // 2. INSIGHTS DA CONTA (TODAS AS MÉTRICAS DISPONÍVEIS)
    const insightsFields = [
      'reach',                    // Alcance único
      'profile_visits',           // Visitas ao perfil  
      'impressions',              // Impressões totais
      'follows',                  // Novos seguidores
      'website_clicks',           // Cliques no link do site (EXISTE NA API!)
      'profile_activity',         // Ações do perfil (chamadas, emails, etc)
      'get_directions',           // Direções solicitadas
      'phone_call_clicks',        // Cliques para ligar
      'text_message_clicks',      // Cliques para mensagem
      'email_contacts'            // Contatos por email
    ]

    const insights: any = {}
    for (const metric of insightsFields) {
      try {
        const insightUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=${metric}&period=day&since=2025-06-15&until=2025-07-15&access_token=${config.access_token}`
        const insightResponse = await fetch(insightUrl)
        
        if (insightResponse.ok) {
          const insightData = await insightResponse.json()
          insights[metric] = insightData
          console.log(`   ✅ ${metric}: ${insightData.data?.length || 0} registros`)
        } else {
          console.log(`   ❌ ${metric}: erro ${insightResponse.status}`)
          insights[metric] = { data: [] }
        }
      } catch (e) {
        console.log(`   ❌ ${metric}: falha na requisição`)
        insights[metric] = { data: [] }
      }
    }

    // 3. MÍDIA RECENTE
    const mediaUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=10&access_token=${config.access_token}`
    const mediaResponse = await fetch(mediaUrl)
    
    let media = []
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      media = mediaData.data || []
      console.log(`📱 ${media.length} posts recentes coletados`)
    }

    // 4. INSIGHTS DOS POSTS (para alguns posts)
    for (let i = 0; i < Math.min(media.length, 3); i++) {
      const post = media[i]
      try {
        const postInsightsUrl = `https://graph.facebook.com/v18.0/${post.id}/insights?metric=impressions,reach,saves,video_views&access_token=${config.access_token}`
        const postInsightsResponse = await fetch(postInsightsUrl)
        
        if (postInsightsResponse.ok) {
          post.insights = await postInsightsResponse.json()
          console.log(`   📊 Post ${i + 1} insights: ${post.insights.data?.length || 0} métricas`)
        }
      } catch (e) {
        console.log(`   ❌ Post ${i + 1} insights: falha`)
      }
    }

    return {
      account_info: accountData,
      insights,
      media,
      summary: {
        followers: accountData.followers_count,
        following: accountData.follows_count,
        posts: accountData.media_count,
        recent_posts_collected: media.length,
        insights_available: Object.keys(insights).filter(k => insights[k].data?.length > 0)
      }
    }

  } catch (error) {
    console.error('❌ Erro no Instagram:', error)
    return { error: error.message }
  }
}

async function testarFacebookCompleto(config: MetaCredentials) {
  try {
    console.log('📘 Testando Facebook page:', config.page_id)

    // 1. DADOS BÁSICOS DA PÁGINA
    const pageUrl = `https://graph.facebook.com/v18.0/${config.page_id}?fields=followers_count,fan_count,name,about,website,phone,category_list,checkins,talking_about_count,were_here_count&access_token=${config.access_token}`
    const pageResponse = await fetch(pageUrl)
    
    if (!pageResponse.ok) {
      const error = await pageResponse.json()
      return { error: `Erro na página Facebook: ${pageResponse.status}`, details: error }
    }

    const pageData = await pageResponse.json()
    console.log(`✅ Facebook: ${pageData.name}, ${pageData.fan_count} fãs`)

    // 2. INSIGHTS DA PÁGINA
    const pageInsights = {}
    const insightsMetrics = [
      'page_impressions', 'page_reach', 'page_post_engagements', 
      'page_engaged_users', 'page_fans', 'page_views_total'
    ]

    for (const metric of insightsMetrics) {
      try {
        const insightUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=${metric}&period=day&since=2025-06-15&until=2025-07-15&access_token=${config.access_token}`
        const insightResponse = await fetch(insightUrl)
        
        if (insightResponse.ok) {
          const insightData = await insightResponse.json()
          pageInsights[metric] = insightData
          console.log(`   ✅ ${metric}: ${insightData.data?.length || 0} registros`)
        } else {
          console.log(`   ❌ ${metric}: erro ${insightResponse.status}`)
          pageInsights[metric] = { data: [] }
        }
      } catch (e) {
        console.log(`   ❌ ${metric}: falha na requisição`)
        pageInsights[metric] = { data: [] }
      }
    }

    // 3. POSTS RECENTES
    const postsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/posts?fields=id,message,story,created_time,type,link,reactions.summary(true),comments.summary(true),shares&limit=10&access_token=${config.access_token}`
    const postsResponse = await fetch(postsUrl)
    
    let posts = []
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      posts = postsData.data || []
      console.log(`📝 ${posts.length} posts recentes coletados`)
    }

    return {
      page_info: pageData,
      insights: pageInsights,
      posts,
      summary: {
        fans: pageData.fan_count,
        followers: pageData.followers_count,
        talking_about: pageData.talking_about_count,
        checkins: pageData.checkins,
        recent_posts_collected: posts.length,
        insights_available: Object.keys(pageInsights).filter(k => pageInsights[k].data?.length > 0)
      }
    }

  } catch (error) {
    console.error('❌ Erro no Facebook:', error)
    return { error: error.message }
  }
} 