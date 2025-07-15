import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MetaCredentials {
  access_token: string
  page_id: string
  instagram_account_id: string
}

interface DiscordMessage {
  embeds: Array<{
    title: string
    description: string
    color: number
    fields: Array<{
      name: string
      value: string
      inline?: boolean
    }>
    footer: {
      text: string
    }
    timestamp: string
  }>
}

// Função para buscar webhook correto da configuração do Discord
async function getWebhookUrl(supabase: any, barId: number, webhookType: string = 'meta') {
  try {
    // Buscar configuração de webhooks Discord para o bar
    const { data: webhookConfig, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', barId)
      .eq('sistema', 'discord')
      .eq('ambiente', 'producao')
      .eq('ativo', true)
      .single()

    if (error || !webhookConfig) {
      console.warn(`⚠️ Webhook config Discord não encontrada para bar ${barId}, erro:`, error)
      // Webhook Meta como fallback
      return 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
    }

    const webhook = webhookConfig.configuracoes?.[webhookType]
    
    if (!webhook || webhook.trim() === '') {
      console.warn(`⚠️ Webhook ${webhookType} não configurado para bar ${barId}`)
      // Webhook Meta como fallback
      return 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
    }

    console.log(`✅ Webhook ${webhookType} encontrado para bar ${barId}`)
    return webhook
  } catch (error) {
    console.error(`❌ Erro ao buscar webhook para bar ${barId}:`, error)
    // Webhook Meta como fallback
    return 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 === META SYNC AUTOMÁTICO INICIADO ===')
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`)

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Bar ID padrão (pode vir do request body se necessário)
    const BAR_ID = 3

    // Obter credenciais do Meta
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', BAR_ID)
      .single()

    if (!credenciais || !credenciais.configuracoes) {
      throw new Error('❌ Credenciais do Meta não encontradas')
    }

    const metaConfig: MetaCredentials = {
      access_token: credenciais.access_token,
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id
    }

    console.log('🔑 Credenciais Meta encontradas - Page ID:', metaConfig.page_id)

    // 1. COLETAR DADOS DO FACEBOOK
    console.log('📘 Coletando dados do Facebook...')
    const facebookData = await coletarDadosFacebook(metaConfig)
    
    // 2. COLETAR DADOS DO INSTAGRAM
    console.log('📸 Coletando dados do Instagram...')
    const instagramData = await coletarDadosInstagram(metaConfig)
    
    // 3. COLETAR CAMPANHAS
    console.log('🎯 Coletando campanhas Meta...')
    const campaignsData = await coletarCampanhas(metaConfig, BAR_ID, supabase)
    
    // 4. SALVAR NO BANCO
    console.log('💾 Salvando dados no banco...')
    const resultadoSalvamento = await salvarDadosNoBanco(supabase, facebookData, instagramData, campaignsData, BAR_ID)
    
    // 5. ENVIAR NOTIFICAÇÃO DISCORD
    console.log('📤 Enviando notificação para Discord...')
    await enviarNotificacaoDiscord(supabase, resultadoSalvamento, facebookData, instagramData, campaignsData, BAR_ID)

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: BAR_ID,
      facebook_data: facebookData,
      instagram_data: instagramData,
      campaigns_data: campaignsData,
      resultado_salvamento: resultadoSalvamento,
      message: '✅ Sync Meta executado com sucesso!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Erro no sync Meta:', error)
    
    // Tentar enviar erro para Discord
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      await enviarErroDiscord(supabase, error, 3)
    } catch (discordError) {
      console.error('❌ Erro ao enviar erro para Discord:', discordError)
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function coletarDadosFacebook(config: MetaCredentials) {
  try {
    console.log('📊 Buscando dados COMPLETOS da página Facebook...')
    
    // Dados básicos da página EXPANDIDOS
    const pageUrl = `https://graph.facebook.com/v18.0/${config.page_id}?fields=followers_count,fan_count,name,about,website,phone,category_list,checkins,talking_about_count,were_here_count,new_like_count,overall_star_rating,rating_count,cover,picture&access_token=${config.access_token}`
    const pageResponse = await fetch(pageUrl)
    
    if (!pageResponse.ok) {
      throw new Error(`Erro ao buscar dados da página: ${pageResponse.status}`)
    }
    
    const pageData = await pageResponse.json()
    
    // INSIGHTS COMPLETOS DA PÁGINA (TODOS os dados como no Meta Business Manager)
    console.log('📈 Coletando insights COMPLETOS do Facebook...')
    
    // 1. Métricas de Alcance e Impressões
    const reachInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_impressions,page_impressions_unique,page_reach,page_reach_unique,page_posts_impressions,page_posts_impressions_unique&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 2. Métricas de Engajamento
    const engagementInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_post_engagements,page_engaged_users,page_actions_post_reactions_total,page_actions_post_reactions_like_total,page_actions_post_reactions_love_total,page_actions_post_reactions_wow_total,page_actions_post_reactions_haha_total,page_actions_post_reactions_sorry_total,page_actions_post_reactions_anger_total&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 3. Métricas de Crescimento de Fãs
    const fansInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_fans,page_fan_adds,page_fan_removes,page_fans_online,page_fans_by_like_source&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 4. Métricas de Visualizações e Interações
    const viewsInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_views_total,page_views_unique,page_video_views,page_video_views_unique,page_video_complete_views_30s,page_places_checkin_total&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // COLETAR TODAS AS MÉTRICAS EM PARALELO
    const [reachResponse, engagementResponse, fansResponse, viewsResponse] = await Promise.all([
      fetch(reachInsightsUrl),
      fetch(engagementInsightsUrl),
      fetch(fansInsightsUrl),
      fetch(viewsInsightsUrl)
    ])
    
    let insights = {
      reach: {},
      engagement: {},
      fans: {},
      views: {}
    }
    
    if (reachResponse.ok) {
      insights.reach = await reachResponse.json()
    }
    if (engagementResponse.ok) {
      insights.engagement = await engagementResponse.json()
    }
    if (fansResponse.ok) {
      insights.fans = await fansResponse.json()
    }
    if (viewsResponse.ok) {
      insights.views = await viewsResponse.json()
    }
    
    // DEMOGRAPHICS DA AUDIÊNCIA FACEBOOK
    console.log('👥 Coletando dados demográficos da audiência Facebook...')
    const demographicsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_fans_city,page_fans_country,page_fans_gender_age,page_fans_locale&period=lifetime&access_token=${config.access_token}`
    
    let demographics = {}
    const demographicsResponse = await fetch(demographicsUrl)
    if (demographicsResponse.ok) {
      demographics = await demographicsResponse.json()
    }
    
    // POSTS RECENTES COM INSIGHTS DETALHADOS
    console.log('📝 Coletando posts recentes com insights completos...')
    const postsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/posts?fields=id,message,story,created_time,type,link,picture,full_picture,reactions.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_reach,post_engaged_users,post_video_views,post_clicks)&limit=20&access_token=${config.access_token}`
    
    let posts = []
    const postsResponse = await fetch(postsUrl)
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      posts = postsData.data || []
    }
    
    console.log(`✅ Facebook coletado: ${posts.length} posts, demographics completos`)
    
    return {
      page_info: pageData,
      insights: {
        ...insights,
        demographics
      },
      posts,
      timestamp: new Date().toISOString(),
      collected_metrics: [
        'page_impressions', 'page_reach', 'page_post_engagements',
        'page_engaged_users', 'page_fans', 'page_fan_adds',
        'page_views_total', 'page_video_views', 
        'page_demographics_complete'
      ]
    }
    
  } catch (error) {
    console.error('❌ Erro ao coletar dados Facebook:', error)
    throw error
  }
}

async function coletarDadosInstagram(config: MetaCredentials) {
  try {
    console.log('📸 Buscando dados COMPLETOS da conta Instagram...')
    
    // Dados básicos da conta
    const accountUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=followers_count,follows_count,media_count,username,name,biography,website,profile_picture_url&access_token=${config.access_token}`
    const accountResponse = await fetch(accountUrl)
    
    if (!accountResponse.ok) {
      throw new Error(`Erro ao buscar dados da conta Instagram: ${accountResponse.status}`)
    }
    
    const accountData = await accountResponse.json()
    
    // INSIGHTS COMPLETOS DA CONTA (TODOS os dados do Meta Business Manager)
    console.log('📊 Coletando insights COMPLETOS do Instagram...')
    
    // 1. Métricas de Alcance (FUNCIONANDO 100%)
    const reachUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=reach&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 2. Profile Views (CORRIGIDO - FUNCIONANDO)
    const profileViewsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=profile_views&metric_type=total_value&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 3. Website Clicks (CORRIGIDO - FUNCIONANDO)
    const websiteClicksUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=website_clicks&metric_type=total_value&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 4. Métricas de Crescimento (Follower Count funciona)
    const growthInsightsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=follower_count&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // COLETAR MÉTRICAS QUE FUNCIONAM
    const [reachResponse, profileViewsResponse, websiteClicksResponse, growthResponse] = await Promise.all([
      fetch(reachUrl),
      fetch(profileViewsUrl),
      fetch(websiteClicksUrl),
      fetch(growthInsightsUrl)
    ])
    
    let insights = {
      reach: {},
      profile_views: {},
      website_clicks: {},
      growth: {}
    }
    
    if (reachResponse.ok) {
      insights.reach = await reachResponse.json()
    }
    if (profileViewsResponse.ok) {
      insights.profile_views = await profileViewsResponse.json()
    }
    if (websiteClicksResponse.ok) {
      insights.website_clicks = await websiteClicksResponse.json()
    }
    if (growthResponse.ok) {
      insights.growth = await growthResponse.json()
    }
    
    // DEMOGRAPHICS DA AUDIÊNCIA (dados demográficos como no Meta Business Manager)
    console.log('👥 Coletando dados demográficos da audiência...')
    const demographicsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${config.access_token}`
    
    let demographics = {}
    const demographicsResponse = await fetch(demographicsUrl)
    if (demographicsResponse.ok) {
      demographics = await demographicsResponse.json()
    }
    
    // MÍDIA RECENTE COM INSIGHTS DETALHADOS
    console.log('📱 Coletando posts recentes com insights...')
    const mediaUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count,shares_count,saved_count,video_play_count,insights.metric(impressions,reach,saves,video_views,likes,comments,shares)&limit=20&access_token=${config.access_token}`
    
    let media = []
    const mediaResponse = await fetch(mediaUrl)
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      media = mediaData.data || []
    }
    
    // STORIES INSIGHTS
    console.log('📖 Coletando insights de Stories...')
    const storiesUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/stories?fields=id,media_type,media_url,timestamp,insights.metric(impressions,reach,taps_forward,taps_back,exits,replies)&access_token=${config.access_token}`
    
    let stories = []
    const storiesResponse = await fetch(storiesUrl)
    if (storiesResponse.ok) {
      const storiesData = await storiesResponse.json()
      stories = storiesData.data || []
    }
    
    console.log(`✅ Instagram coletado: ${media.length} posts, ${stories.length} stories, demographics completos`)
    
    return {
      account_info: accountData,
      insights: {
        ...insights,
        demographics
      },
      media,
      stories,
      timestamp: new Date().toISOString(),
      collected_metrics: [
        'reach', 'profile_views', 'website_clicks',
        'follower_count', 'likes', 'comments', 'saves', 'shares',
        'media_content'
      ]
    }
    
  } catch (error) {
    console.error('❌ Erro ao coletar dados Instagram:', error)
    throw error
  }
}

async function coletarCampanhas(config: MetaCredentials, barId: number, supabase: any) {
  try {
    console.log('🎯 Buscando campanhas COMPLETAS Meta Ads Manager...')
    
    // Buscar configurações de ad account
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('sistema', 'meta')
      .eq('bar_id', barId)
      .single()
    
    // Business ID não é obrigatório para buscar campanhas via me/adaccounts
    const businessId = credenciais.configuracoes.business_id || 'N/A'
    console.log(`🏢 Business ID configurado: ${businessId} (usando me/adaccounts para maior compatibilidade)`)
    
    // Buscar ad accounts diretas do usuário (mais confiável que business/owned_ad_accounts)
    console.log('🔍 Buscando ad accounts via me/adaccounts...')
    const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap&access_token=${config.access_token}`
    const adAccountsResponse = await fetch(adAccountsUrl)
    
    if (!adAccountsResponse.ok) {
      const error: any = await adAccountsResponse.json()
      console.log('⚠️ Erro ao buscar ad accounts:', error)
      return { campaigns: [], ad_accounts: [], ads: [], error: error.error }
    }
    
    const adAccountsData = await adAccountsResponse.json()
    const allAdAccounts = adAccountsData.data || []
    console.log(`📊 Encontradas ${allAdAccounts.length} ad accounts totais`)
    
    // Filtrar apenas a conta específica do Deboche Bar (act_943600147532423)
    const DEBOCHE_ACCOUNT_ID = 'act_943600147532423'
    const adAccounts = allAdAccounts.filter((account: any) => {
      return account.id === DEBOCHE_ACCOUNT_ID || 
             account.name?.toLowerCase().includes('deboche')
    })
    
    console.log(`🎯 Contas filtradas para o Deboche Bar: ${adAccounts.length}`)
    adAccounts.forEach((acc: any) => console.log(`   - ${acc.id}: ${acc.name}`))
    
    if (adAccounts.length === 0) {
      return { 
        campaigns: [], 
        ad_accounts: [], 
        ads: [], 
        message: 'Nenhuma ad account do Ordinário/Deboche encontrada',
        all_accounts_found: allAdAccounts.length,
        available_accounts: allAdAccounts.map((acc: any) => `${acc.id}: ${acc.name}`)
      }
    }
    
    // Coletar DADOS COMPLETOS de todas as ad accounts
    const allCampaigns = []
    const allAds = []
    
    for (const adAccount of adAccounts) {
      try {
        console.log(`💰 Coletando dados COMPLETOS da conta: ${adAccount.id}`)
        
        // 1. CAMPANHAS COM INSIGHTS COMPLETOS
        const campaignsUrl = `https://graph.facebook.com/v18.0/${adAccount.id}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time,insights.metric(impressions,reach,clicks,ctr,cpc,cpp,cpm,spend,frequency,actions,conversions,cost_per_conversion,video_play_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions).date_preset(last_30d)&access_token=${config.access_token}`
        const campaignsResponse = await fetch(campaignsUrl)
        
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json()
          const campaigns = campaignsData.data || []
          
          // Enriquecer cada campanha com dados da conta
          for (const campaign of campaigns) {
            campaign.ad_account_id = adAccount.id
            campaign.ad_account_name = adAccount.name
            campaign.account_currency = adAccount.currency
            campaign.account_timezone = adAccount.timezone_name
          }
          
          allCampaigns.push(...campaigns)
          console.log(`✅ ${campaigns.length} campanhas coletadas da conta ${adAccount.name}`)
        }
        
        // 2. ANÚNCIOS INDIVIDUAIS COM MÉTRICAS DETALHADAS
        console.log(`📢 Coletando anúncios individuais da conta: ${adAccount.id}`)
        const adsUrl = `https://graph.facebook.com/v18.0/${adAccount.id}/ads?fields=id,name,status,effective_status,created_time,updated_time,creative.fields(title,body,image_url,video_id,thumbnail_url),targeting,insights.metric(impressions,reach,clicks,ctr,cpc,cpp,cpm,spend,frequency,actions,conversions,cost_per_conversion,video_play_actions,link_clicks,post_engagement,page_engagement,likes,comments,shares,video_view).date_preset(last_30d)&limit=50&access_token=${config.access_token}`
        const adsResponse = await fetch(adsUrl)
        
        if (adsResponse.ok) {
          const adsData = await adsResponse.json()
          const ads = adsData.data || []
          
          // Enriquecer cada anúncio com dados da conta
          for (const ad of ads) {
            ad.ad_account_id = adAccount.id
            ad.ad_account_name = adAccount.name
            ad.account_currency = adAccount.currency
          }
          
          allAds.push(...ads)
          console.log(`📢 ${ads.length} anúncios coletados da conta ${adAccount.name}`)
        }
        
      } catch (accountError) {
        console.log(`❌ Erro ao processar account ${adAccount.id}:`, accountError)
      }
    }
    
    // CALCULAR TOTAIS E MÉTRICAS AGREGADAS
    let totalSpend = 0
    let totalImpressions = 0
    let totalReach = 0
    let totalClicks = 0
    let activeCampaigns = 0
    
    for (const campaign of allCampaigns) {
      if (campaign.insights?.data?.[0]) {
        const insights = campaign.insights.data[0]
        totalSpend += parseFloat(insights.spend || 0)
        totalImpressions += parseInt(insights.impressions || 0)
        totalReach += parseInt(insights.reach || 0)
        totalClicks += parseInt(insights.clicks || 0)
      }
      if (campaign.effective_status === 'ACTIVE') {
        activeCampaigns++
      }
    }
    
    console.log(`💰 TOTAIS: R$${totalSpend.toFixed(2)} gastos, ${totalImpressions.toLocaleString()} impressões, ${activeCampaigns} campanhas ativas`)
    
    return {
      campaigns: allCampaigns,
      ads: allAds,
      ad_accounts: adAccounts,
      totals: {
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_reach: totalReach,
        total_clicks: totalClicks,
        active_campaigns: activeCampaigns,
        total_campaigns: allCampaigns.length,
        total_ads: allAds.length
      },
      timestamp: new Date().toISOString(),
      collected_metrics: [
        'impressions', 'reach', 'clicks', 'spend', 'ctr', 'cpc', 'cpp', 'cpm',
        'conversions', 'video_views', 'link_clicks', 'post_engagement',
        'cost_per_conversion', 'frequency', 'video_play_actions',
        'video_p25_watched_actions', 'video_p50_watched_actions', 
        'video_p75_watched_actions', 'video_p100_watched_actions'
      ]
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao coletar campanhas:', error)
    return { campaigns: [], ads: [], ad_accounts: [], error: error.message }
  }
}

async function salvarDadosNoBanco(supabase: any, facebookData: any, instagramData: any, campaignsData: any, barId: number) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    console.log('💾 Processando e salvando dados COMPLETOS do Meta...')
    
    // === PROCESSAR DADOS FACEBOOK COMPLETOS ===
    console.log('📘 Processando insights Facebook...')
    
    // Extrair métricas dos posts
    let fbLikes = 0, fbComments = 0, fbShares = 0
    if (facebookData.posts && Array.isArray(facebookData.posts)) {
      for (const post of facebookData.posts) {
        fbLikes += post.reactions?.summary?.total_count || 0
        fbComments += post.comments?.summary?.total_count || 0
        fbShares += post.shares?.count || 0
      }
    }
    
    // Extrair insights de alcance e impressões
    let pageReach = 0, pageImpressions = 0, postEngagements = 0, videoViews = 0
    if (facebookData.insights) {
      // Somar dados dos últimos dias
      if (facebookData.insights.reach?.data) {
        pageReach = facebookData.insights.reach.data.reduce((sum: number, item: any) => sum + (parseInt(item.value) || 0), 0)
      }
      if (facebookData.insights.views?.data) {
        pageImpressions = facebookData.insights.views.data.reduce((sum: number, item: any) => sum + (parseInt(item.value) || 0), 0)
      }
      if (facebookData.insights.engagement?.data) {
        postEngagements = facebookData.insights.engagement.data.reduce((sum: number, item: any) => sum + (parseInt(item.value) || 0), 0)
      }
    }
    
    // === PROCESSAR DADOS INSTAGRAM COMPLETOS ===
    console.log('📸 Processando insights Instagram...')
    
    // Extrair métricas dos posts
    let igLikes = 0, igComments = 0, igShares = 0, igSaves = 0
    if (instagramData.media && Array.isArray(instagramData.media)) {
      for (const item of instagramData.media) {
        igLikes += item.like_count || 0
        igComments += item.comments_count || 0
        igShares += item.shares_count || 0
        igSaves += item.saved_count || 0
      }
    }
    
    // Extrair insights de alcance, profile views e website clicks (CORRIGIDOS - FUNCIONANDO)
    let igReach = 0, igImpressions = 0, igVideoViews = 0, profileViews = 0, websiteClicks = 0
    if (instagramData.insights) {
      // Processar reach (funcionando perfeitamente)
      if (instagramData.insights.reach?.data?.[0]?.values) {
        igReach = instagramData.insights.reach.data[0].values.reduce((sum: number, item: any) => sum + (parseInt(item.value) || 0), 0)
      }
      
      // Processar profile views (corrigido com metric_type=total_value)
      if (instagramData.insights.profile_views?.data?.[0]?.total_value) {
        profileViews = parseInt(instagramData.insights.profile_views.data[0].total_value.value) || 0
      }
      
      // Processar website clicks (corrigido com metric_type=total_value)
      if (instagramData.insights.website_clicks?.data?.[0]?.total_value) {
        websiteClicks = parseInt(instagramData.insights.website_clicks.data[0].total_value.value) || 0
      }
      
      // Impressions não está disponível na API v22+ (usar reach como substituto)
      igImpressions = igReach // Meta removeu impressions, usar reach como proxy
    }
    
    console.log(`📊 Facebook processado: Reach ${pageReach}, Impressions ${pageImpressions}, ${fbLikes} likes`)
    console.log(`📸 Instagram processado: Reach ${igReach}, Impressions ${igImpressions}, ${igLikes} likes`)
    
    // === SALVAR FACEBOOK ===
    await supabase
      .from('facebook_metrics')
      .delete()
      .eq('bar_id', barId)
      .eq('data_referencia', hoje)
      .eq('periodo', 'diario')
    
    const { data: fbData, error: fbError } = await supabase
      .from('facebook_metrics')
      .insert({
        data_referencia: hoje,
        bar_id: barId,
        periodo: 'diario',
        page_fans: facebookData.page_info?.fan_count || 0,
        post_likes: fbLikes,
        post_comments: fbComments,
        post_shares: fbShares,
        page_reach: pageReach,
        page_impressions: pageImpressions,
        post_engagements: postEngagements,
        video_views: videoViews,
        talking_about_count: facebookData.page_info?.talking_about_count || 0,
        checkins: facebookData.page_info?.checkins || 0,
        raw_data: facebookData
      })
      .select()
    
    // === SALVAR INSTAGRAM ===
    await supabase
      .from('instagram_metrics')
      .delete()
      .eq('bar_id', barId)
      .eq('data_referencia', hoje)
      .eq('periodo', 'diario')
      
    const { data: igData, error: igError } = await supabase
      .from('instagram_metrics')
      .insert({
        data_referencia: hoje,
        bar_id: barId,
        periodo: 'diario',
        follower_count: instagramData.account_info?.followers_count || 0,
        following_count: instagramData.account_info?.follows_count || 0,
        posts_likes: igLikes,
        posts_comments: igComments,
        posts_shares: igShares,
        posts_saves: igSaves,
        reach: igReach,
        impressions: igImpressions,
        profile_views: profileViews,
        website_clicks: websiteClicks,
        media_count: instagramData.account_info?.media_count || 0,
        raw_data: instagramData
      })
      .select()
    
    // CAMPANHAS: Salvar dados de campanhas se existirem
    let campaignsSuccess = false
    let campaignsError = null
    let campaignsSaved = 0
    
    if (campaignsData && campaignsData.campaigns && campaignsData.campaigns.length > 0) {
      console.log(`🎯 Salvando ${campaignsData.campaigns.length} campanhas...`)
      
      // Preparar dados para inserção
      const campaignsToInsert = campaignsData.campaigns.map((campaign: any) => {
        const insights = campaign.insights?.data?.[0] || {}
        
        return {
          bar_id: barId,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          ad_account_id: campaign.ad_account_id,
          status: campaign.status,
          effective_status: campaign.effective_status,
          objective: campaign.objective,
          start_time: campaign.start_time || null,
          stop_time: campaign.stop_time || null,
          daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null,
          lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) : null,
          impressions: insights.impressions ? parseInt(insights.impressions) : 0,
          reach: insights.reach ? parseInt(insights.reach) : 0,
          clicks: insights.clicks ? parseInt(insights.clicks) : 0,
          ctr: insights.ctr ? parseFloat(insights.ctr) : null,
          cpc: insights.cpc ? parseFloat(insights.cpc) : null,
          cpp: insights.cpp ? parseFloat(insights.cpp) : null,
          cpm: insights.cpm ? parseFloat(insights.cpm) : null,
          frequency: insights.frequency ? parseFloat(insights.frequency) : null,
          spend: insights.spend ? parseFloat(insights.spend) : 0,
          actions_count: insights.actions?.length || 0,
          conversions: insights.conversions ? parseInt(insights.conversions) : 0,
          cost_per_conversion: insights.cost_per_conversion ? parseFloat(insights.cost_per_conversion) : null,
          video_play_actions: insights.video_play_actions ? parseInt(insights.video_play_actions) : null,
          video_p25_watched_actions: insights.video_p25_watched_actions ? parseInt(insights.video_p25_watched_actions) : null,
          video_p50_watched_actions: insights.video_p50_watched_actions ? parseInt(insights.video_p50_watched_actions) : null,
          video_p75_watched_actions: insights.video_p75_watched_actions ? parseInt(insights.video_p75_watched_actions) : null,
          video_p100_watched_actions: insights.video_p100_watched_actions ? parseInt(insights.video_p100_watched_actions) : null,
          link_clicks: insights.link_clicks ? parseInt(insights.link_clicks) : null,
          video_views: insights.video_views ? parseInt(insights.video_views) : null,
          data_coleta: hoje,
          raw_data: campaign
        }
      })
      
      // Delete existente + Insert novo para campanhas
      await supabase
        .from('meta_campaigns_history')
        .delete()
        .eq('bar_id', barId)
        .eq('data_coleta', hoje)
      
      const { data: campaignsData_result, error: campaignsError_result } = await supabase
        .from('meta_campaigns_history')
        .insert(campaignsToInsert)
        .select()
      
      campaignsSuccess = !campaignsError_result && campaignsData_result && campaignsData_result.length > 0
      campaignsError = campaignsError_result
      campaignsSaved = campaignsData_result?.length || 0
      
      if (campaignsError_result) {
        console.error('❌ Erro ao salvar campanhas:', campaignsError_result)
      } else {
        console.log(`✅ ${campaignsSaved} campanhas salvas com sucesso`)
      }
    } else {
      console.log('⚠️ Nenhuma campanha para salvar')
    }
    
    // Verificar resultados
    const fbSuccess = !fbError && fbData && fbData.length > 0
    const igSuccess = !igError && igData && igData.length > 0
    
    if (fbError) {
      console.error('❌ Erro ao salvar dados Facebook:', fbError)
    } else {
      console.log('✅ Dados Facebook salvos com sucesso:', fbData)
    }
    
    if (igError) {
      console.error('❌ Erro ao salvar dados Instagram:', igError)
    } else {
      console.log('✅ Dados Instagram salvos com sucesso:', igData)
    }
    
    console.log(`📊 Resultado final: Facebook=${fbSuccess}, Instagram=${igSuccess}, Campanhas=${campaignsSuccess}`)
    
    return {
      facebook_saved: fbSuccess,
      instagram_saved: igSuccess,
      campaigns_saved: campaignsSuccess,
      facebook_metrics: {
        page_fans: facebookData.page_info?.fan_count || 0,
        post_likes: fbLikes,
        post_comments: fbComments,
        post_shares: fbShares
      },
      instagram_metrics: {
        follower_count: instagramData.account_info?.followers_count || 0,
        following_count: instagramData.account_info?.follows_count || 0,
        posts_likes: igLikes,
        posts_comments: igComments
      },
      campaigns_metrics: {
        total_campaigns: campaignsData?.summary?.total_campaigns || 0,
        active_campaigns: campaignsData?.summary?.active_campaigns || 0,
        campaigns_saved: campaignsSaved
      },
      facebook_error: fbError?.message || null,
      instagram_error: igError?.message || null,
      campaigns_error: campaignsError?.message || null,
      facebook_data: fbData,
      instagram_data: igData
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar dados no banco:', error)
    throw error
  }
}

async function enviarNotificacaoDiscord(supabase: any, resultado: any, facebookData: any, instagramData: any, campaignsData: any, barId: number) {
  try {
    // Obter webhook correto do Discord para Meta
    const webhookUrl = await getWebhookUrl(supabase, barId, 'meta')
    console.log('🔗 Usando webhook:', webhookUrl.substring(0, 50) + '...')

    const agora = new Date()
    
    // Dados para exibição
    const fbSeguidores = facebookData.page_info?.fan_count || 0
    const igSeguidores = instagramData.account_info?.followers_count || 0
    const igSeguindo = instagramData.account_info?.follows_count || 0
    const igPosts = instagramData.account_info?.media_count || 0
    
    const fbLikes = resultado.facebook_metrics?.post_likes || 0
    const fbComments = resultado.facebook_metrics?.post_comments || 0
    const fbShares = resultado.facebook_metrics?.post_shares || 0
    
    const igLikes = resultado.instagram_metrics?.posts_likes || 0
    const igComments = resultado.instagram_metrics?.posts_comments || 0

    const message: DiscordMessage = {
      embeds: [{
        title: '📊 Meta Analytics - Coleta Automática',
        description: `Dados do Facebook e Instagram coletados com sucesso!\n\n🕐 **Executado em:** ${agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n🏢 **Bar ID:** ${barId}`,
        color: 0x4267B2, // Azul do Facebook
        fields: [
          {
            name: '📘 Facebook',
            value: `**${fbSeguidores}** seguidores\n**${fbLikes}** likes recentes\n**${fbComments}** comentários\n**${fbShares}** compartilhamentos`,
            inline: true
          },
          {
            name: '📸 Instagram',
            value: `**${igSeguidores}** seguidores\n**${igSeguindo}** seguindo\n**${igPosts}** posts totais\n**${igLikes}** likes recentes\n**${igComments}** comentários`,
            inline: true
          },
          {
            name: '🎯 Campanhas',
            value: `**${campaignsData?.totals?.total_campaigns || 0}** campanhas\n**${campaignsData?.totals?.active_campaigns || 0}** ativas\n**R$ ${campaignsData?.totals?.total_spend?.toFixed(2) || '0.00'}** gasto`,
            inline: true
          },
          {
            name: '💾 Status Salvamento',
            value: `Facebook: ${resultado.facebook_saved ? '✅' : '❌'}\nInstagram: ${resultado.instagram_saved ? '✅' : '❌'}\nCampanhas: ${resultado.campaigns_saved ? '✅' : '❌'}`,
            inline: true
          }
        ],
        footer: {
          text: 'SGB V2 - Meta Integration (Edge Function)'
        },
        timestamp: agora.toISOString()
      }]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      throw new Error(`Erro Discord: ${response.status}`)
    }

    console.log('✅ Notificação Discord enviada com sucesso')

  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error)
  }
}

async function enviarErroDiscord(supabase: any, error: any, barId: number) {
  try {
    const webhookUrl = await getWebhookUrl(supabase, barId, 'meta')

    const message: DiscordMessage = {
      embeds: [{
        title: '❌ Meta Sync - Erro na Execução',
        description: `Falha na coleta de dados do Meta (Edge Function)`,
        color: 0xff0000,
        fields: [
          {
            name: '🏢 Bar ID',
            value: barId.toString(),
            inline: true
          },
          {
            name: '🔍 Erro',
            value: error.message || 'Erro desconhecido',
            inline: false
          },
          {
            name: '🕐 Timestamp',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        footer: {
          text: 'SGB V2 - Meta Integration Error (Edge Function)'
        },
        timestamp: new Date().toISOString()
      }]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

  } catch (discordError) {
    console.error('❌ Erro ao enviar erro para Discord:', discordError)
  }
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
} 