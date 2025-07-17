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

// Fun·ß·£o para buscar webhook correto da configura·ß·£o do Discord
async function getWebhookUrl(supabase, barId: number, webhookType: string = 'meta') {
  try {
    // Buscar configura·ß·£o de webhooks Discord para o bar
    const { data: webhookConfig, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', barId)
      .eq('sistema', 'discord')
      .eq('ambiente', 'producao')
      .eq('ativo', true)
      .single()

    if (error || !webhookConfig) {
      console.warn(`ö†Ô∏è Webhook config Discord n·£o encontrada para bar ${barId}, erro:`, error)
      // Webhook Meta como fallback
      return CONFIG.FALLBACK_WEBHOOK
    }

    const webhook = webhookConfig.configuracoes?.[webhookType]
    
    if (!webhook || webhook.trim() === '') {
      console.warn(`ö†Ô∏è Webhook ${webhookType} n·£o configurado para bar ${barId}`)
      // Webhook Meta como fallback
      return CONFIG.FALLBACK_WEBHOOK
    }

    console.log(`úÖ Webhook ${webhookType} encontrado para bar ${barId}`)
    return webhook
  } catch (error) {
    console.error(`ùå Erro ao buscar webhook para bar ${barId}:`, error)
    // Webhook Meta como fallback
    return CONFIG.FALLBACK_WEBHOOK
  }
}

// === CONSTANTES E CONFIGURA·á·ïES ===
const CONFIG = {
  BAR_ID: 3,
  TARGET_ACCOUNT_ID: 'act_1153081576486761', // Conta publicit·°ria correta do Ads Manager
  FALLBACK_WEBHOOK: 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75',
  FACEBOOK_API_VERSION: 'v18.0',
  INSIGHTS_DAYS: 30
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
    console.log('üîç === META SYNC AUTOM·ÅTICO INICIADO ===')
    console.log(`è∞ Timestamp: ${new Date().toISOString()}`)

    // Bar ID padr·£o (pode vir do request body se necess·°rio)
    const BAR_ID = CONFIG.BAR_ID

    // URL do endpoint centralizado de coleta
    const collectUrl = `${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3001'}/api/meta/collect`
    console.log('üåê Disparando coleta centralizada via:', collectUrl)

    // Disparar PATCH para o endpoint de coleta
    const response = await fetch(collectUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-meta-cron-2025'
      },
      body: JSON.stringify({ bar_id: BAR_ID })
    })

    const result = await response.json()
    console.log('úÖ Resultado da coleta centralizada:', result)

    // === CHAMAR EDGE FUNCTION DE PROCESSAMENTO ===
    try {
      const processUrl = `${Deno.env.get('SUPABASE_URL') || 'https://uqtgsvujwcbymjmvkjhy.supabase.co'}/functions/v1/meta-process`;
      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ bar_id: BAR_ID, data_coleta: result?.result?.data_coleta || new Date().toISOString().split('T')[0] })
      });
      const processResult = await processResponse.json();
      console.log('úÖ Resultado do processamento autom·°tico:', processResult);
    } catch (procError) {
      console.error('ùå Erro ao chamar processamento autom·°tico:', procError);
    }

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.ok ? 200 : 500
    })
  } catch (error) {
    console.error('ùå Erro no sync Meta:', error)
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
    console.log('üìä Buscando dados COMPLETOS da p·°gina Facebook...')
    console.log(`üéØ Page ID: ${config.page_id}`)
    console.log(`üîë Token length: ${config.access_token.length}`)
    
    // Dados b·°sicos da p·°gina EXPANDIDOS
    const pageUrl = `https://graph.facebook.com/${CONFIG.FACEBOOK_API_VERSION}/${config.page_id}?fields=followers_count,fan_count,name,about,website,phone,category_list,checkins,talking_about_count,were_here_count,new_like_count,overall_star_rating,rating_count,cover,picture&access_token=${config.access_token}`
    console.log(`üì° Request URL: ${pageUrl.replace(config.access_token, 'TOKEN_HIDDEN')}`)
    
    const pageResponse = await fetch(pageUrl)
    console.log(`üìä Response status: ${pageResponse.status}`)
    
    if (!pageResponse.ok) {
      const errorText = await pageResponse.text()
      console.log(`ùå Error response: ${errorText}`)
      throw new Error(`Erro ao buscar dados da p·°gina: ${pageResponse.status} - ${errorText}`)
    }
    
    const pageData = await pageResponse.json()
    
    // INSIGHTS COMPLETOS DA P·ÅGINA (TODOS os dados como no Meta Business Manager)
    console.log('üìà Coletando insights COMPLETOS do Facebook...')
    
    // 1. M·©tricas de Alcance e Impress·µes
    const reachInsightsUrl = `https://graph.facebook.com/${CONFIG.FACEBOOK_API_VERSION}/${config.page_id}/insights?metric=page_impressions,page_impressions_unique,page_reach,page_reach_unique,page_posts_impressions,page_posts_impressions_unique&period=day&since=${getDateDaysAgo(CONFIG.INSIGHTS_DAYS)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 2. M·©tricas de Engajamento
    const engagementInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_post_engagements,page_engaged_users,page_actions_post_reactions_total,page_actions_post_reactions_like_total,page_actions_post_reactions_love_total,page_actions_post_reactions_wow_total,page_actions_post_reactions_haha_total,page_actions_post_reactions_sorry_total,page_actions_post_reactions_anger_total&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 3. M·©tricas de Crescimento de F·£s
    const fansInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_fans,page_fan_adds,page_fan_removes,page_fans_online,page_fans_by_like_source&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 4. M·©tricas de Visualiza·ß·µes e Intera·ß·µes
    const viewsInsightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_views_total,page_views_unique,page_video_views,page_video_views_unique,page_video_complete_views_30s,page_places_checkin_total&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // COLETAR TODAS AS M·âTRICAS EM PARALELO
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
    
    // DEMOGRAPHICS DA AUDI·äNCIA FACEBOOK
    console.log('üë• Coletando dados demogr·°ficos da audi·™ncia Facebook...')
    const demographicsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_fans_city,page_fans_country,page_fans_gender_age,page_fans_locale&period=lifetime&access_token=${config.access_token}`
    
    let demographics = {}
    const demographicsResponse = await fetch(demographicsUrl)
    if (demographicsResponse.ok) {
      demographics = await demographicsResponse.json()
    }
    
    // POSTS RECENTES COM INSIGHTS DETALHADOS
    console.log('üìù Coletando posts recentes com insights completos...')
    const postsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/posts?fields=id,message,story,created_time,type,link,picture,full_picture,reactions.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_reach,post_engaged_users,post_video_views,post_clicks)&limit=20&access_token=${config.access_token}`
    
    let posts = []
    const postsResponse = await fetch(postsUrl)
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      posts = postsData.data || []
    }
    
    console.log(`úÖ Facebook coletado: ${posts.length} posts, demographics completos`)
    
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
    console.error('ùå Erro ao coletar dados Facebook:', error)
    throw error
  }
}

async function coletarDadosInstagram(config: MetaCredentials) {
  try {
    console.log('üì∏ Buscando dados COMPLETOS da conta Instagram...')
    
    // Dados b·°sicos da conta
    const accountUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=followers_count,follows_count,media_count,username,name,biography,website,profile_picture_url&access_token=${config.access_token}`
    const accountResponse = await fetch(accountUrl)
    
    if (!accountResponse.ok) {
      throw new Error(`Erro ao buscar dados da conta Instagram: ${accountResponse.status}`)
    }
    
    const accountData = await accountResponse.json()
    
    // INSIGHTS COMPLETOS DA CONTA (TODOS os dados do Meta Business Manager)
    console.log('üìä Coletando insights COMPLETOS do Instagram...')
    
    // 1. M·©tricas de Alcance (FUNCIONANDO 100%)
    const reachUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=reach&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 2. Profile Views (CORRIGIDO - FUNCIONANDO)
    const profileVisitsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=profile_visits&metric_type=total_value&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 3. Website Clicks (CORRIGIDO - FUNCIONANDO)
    const websiteClicksUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=website_clicks&metric_type=total_value&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // 4. M·©tricas de Crescimento (Follower Count funciona)
    const growthInsightsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=follower_count&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    
    // COLETAR M·âTRICAS QUE FUNCIONAM
    const [reachResponse, profileVisitsResponse, websiteClicksResponse, growthResponse] = await Promise.all([
      fetch(reachUrl),
      fetch(profileVisitsUrl),
      fetch(websiteClicksUrl),
      fetch(growthInsightsUrl)
    ])
    
    let insights = {
      reach: {},
      profile_visits: {},
      website_clicks: {},
      growth: {}
    }
    
    if (reachResponse.ok) {
      insights.reach = await reachResponse.json()
    }
    if (profileVisitsResponse.ok) {
      insights.profile_visits = await profileVisitsResponse.json()
    }
    if (websiteClicksResponse.ok) {
      insights.website_clicks = await websiteClicksResponse.json()
    }
    if (growthResponse.ok) {
      insights.growth = await growthResponse.json()
    }
    
    // DEMOGRAPHICS DA AUDI·äNCIA (dados demogr·°ficos como no Meta Business Manager)
    console.log('üë• Coletando dados demogr·°ficos da audi·™ncia...')
    const demographicsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${config.access_token}`
    
    let demographics = {}
    const demographicsResponse = await fetch(demographicsUrl)
    if (demographicsResponse.ok) {
      demographics = await demographicsResponse.json()
    }
    
    // M·çDIA RECENTE COM INSIGHTS DETALHADOS
    console.log('üì± Coletando posts recentes com insights...')
    const mediaUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count,shares_count,saved_count,video_play_count,insights.metric(impressions,reach,saves,video_views,likes,comments,shares)&limit=20&access_token=${config.access_token}`
    
    let media = []
    const mediaResponse = await fetch(mediaUrl)
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      media = mediaData.data || []
    }
    
    // STORIES INSIGHTS
    console.log('üìñ Coletando insights de Stories...')
    const storiesUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/stories?fields=id,media_type,media_url,timestamp,insights.metric(impressions,reach,taps_forward,taps_back,exits,replies)&access_token=${config.access_token}`
    
    let stories = []
    const storiesResponse = await fetch(storiesUrl)
    if (storiesResponse.ok) {
      const storiesData = await storiesResponse.json()
      stories = storiesData.data || []
    }
    
    console.log(`úÖ Instagram coletado: ${media.length} posts, ${stories.length} stories, demographics completos`)
    
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
        'reach', 'profile_visits', 'website_clicks',
        'follower_count', 'likes', 'comments', 'saves', 'shares',
        'media_content'
      ]
    }
    
  } catch (error) {
    console.error('ùå Erro ao coletar dados Instagram:', error)
    throw error
  }
}

async function coletarCampanhas(config: MetaCredentials & { ad_account_id?: string }, barId: number, supabase) {
  try {
    const adAccountId = config.ad_account_id
    if (!adAccountId) throw new Error('Ad Account ID n·£o encontrado nas credenciais')
    console.log('üéØ Buscando campanhas COMPLETAS Meta Ads Manager...')
    
    // Buscar configura·ß·µes de ad account
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('sistema', 'meta')
      .eq('bar_id', barId)
      .single()
    
    // Usar ad_account_id direto da configura·ß·£o
    const businessId = credenciais.configuracoes.business_id || 'N/A'
    console.log(`üéØ Ad Account ID configurado: ${adAccountId}`)
    console.log(`üè¢ Business ID configurado: ${businessId}`)
    
    // Verificar se a ad account existe e est·° acess·≠vel
    console.log('üîç Verificando acesso ·† ad account...')
    const accountInfoUrl = `https://graph.facebook.com/v18.0/${adAccountId}?fields=id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap&access_token=${config.access_token}`
    const accountInfoResponse = await fetch(accountInfoUrl)
    
    if (!accountInfoResponse.ok) {
      const error: any = await accountInfoResponse.json()
      console.log('ö†Ô∏è Erro ao acessar ad account:', error)
      
      // Buscar todas as ad accounts como fallback
      console.log('üîç Buscando todas as ad accounts como fallback...')
      const allAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${config.access_token}`
      const allAccountsResponse = await fetch(allAccountsUrl)
      
      if (allAccountsResponse.ok) {
        const allAccountsData = await allAccountsResponse.json()
        const allAdAccounts = allAccountsData.data || []
        console.log(`üìä Ad accounts dispon·≠veis:`)
        allAdAccounts.forEach((acc) => console.log(`   - ${acc.id}: ${acc.name}`))
        
        return { 
          campaigns: [], 
          ad_accounts: [], 
          ads: [], 
          error: `Ad account ${adAccountId} n·£o acess·≠vel`,
          available_accounts: allAdAccounts.map((acc) => `${acc.id}: ${acc.name}`)
        }
      }
      
      return { campaigns: [], ad_accounts: [], ads: [], error: error.error }
    }
    
    const accountInfo = await accountInfoResponse.json()
    console.log(`úÖ Ad account acess·≠vel: ${accountInfo.id} - ${accountInfo.name}`)
    
    const adAccounts = [accountInfo] // Usar apenas a account configurada
    
    // Coletar DADOS COMPLETOS de todas as ad accounts
    const allCampaigns = []
    const allAds = []
    
    for (const adAccount of adAccounts) {
      try {
        console.log(`üí∞ Coletando dados COMPLETOS da conta: ${adAccount.id}`)
        
        // 1. BUSCAR CAMPANHAS B·ÅSICAS PRIMEIRO
        console.log(`üéØ Buscando campanhas b·°sicas da conta: ${adAccount.id}`)
        const campaignsUrl = `https://graph.facebook.com/${CONFIG.FACEBOOK_API_VERSION}/${adAccount.id}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time&limit=100&access_token=${config.access_token}`
        const campaignsResponse = await fetch(campaignsUrl)
        
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json()
          const campaigns = campaignsData.data || []
          console.log(`üìä Encontradas ${campaigns.length} campanhas para processar`)
          
          // 2. BUSCAR INSIGHTS DE CADA CAMPANHA INDIVIDUALMENTE
          console.log(`üìà Coletando insights detalhados de cada campanha...`)
          for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i]
            console.log(`   ${i + 1}/${campaigns.length}: ${campaign.name}`)
            
            try {
              // Buscar insights da campanha espec·≠fica
              // Insights da campanha (CAMPOS CORRIGIDOS - EXATO DA API TEST QUE FUNCIONA)
              const adsManagerFields = [
                'campaign_name',           // Campaign
                'impressions',             // Impressions  
                'reach',                   // Reach
                'spend',                   // Amount spent
                'actions',                 // Results (conversions, clicks, etc)
                'conversions',             // Results espec·≠ficos
                'cost_per_action_type',    // Cost per result
                'cost_per_conversion',     // Cost per result espec·≠fico
                'clicks',                  // Para calcular CTR
                'ctr',                     // Click-through rate
                'cpc',                     // Cost per click
                'cpm',                     // Cost per mille
                'date_start',              // Data in·≠cio dos insights
                'date_stop'                // Data fim dos insights
              ].join(',')
              const insightsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=${adsManagerFields}&date_preset=last_30d&access_token=${config.access_token}`
              const insightsResponse = await fetch(insightsUrl)
              
              if (insightsResponse.ok) {
                const insightsData = await insightsResponse.json()
                campaign.insights = insightsData
                console.log(`      úÖ Insights coletados: ${insightsData.data?.length || 0} registros`)
              } else {
                console.log(`      ö†Ô∏è Erro nos insights: ${insightsResponse.status}`)
                campaign.insights = { data: [] }
              }
              
              // Buscar ad sets da campanha
              const adSetsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,targeting&access_token=${config.access_token}`
              const adSetsResponse = await fetch(adSetsUrl)
              
              if (adSetsResponse.ok) {
                const adSetsData = await adSetsResponse.json()
                campaign.adsets = adSetsData.data || []
                console.log(`      üì¢ Ad sets: ${campaign.adsets.length}`)
              } else {
                campaign.adsets = []
              }
              
              // Buscar an·∫ncios da campanha
              const campaignAdsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/ads?fields=id,name,status,effective_status,creative&limit=50&access_token=${config.access_token}`
              const campaignAdsResponse = await fetch(campaignAdsUrl)
              
              if (campaignAdsResponse.ok) {
                const campaignAdsData = await campaignAdsResponse.json()
                campaign.ads = campaignAdsData.data || []
                console.log(`      üé® An·∫ncios: ${campaign.ads.length}`)
              } else {
                campaign.ads = []
              }
              
            } catch (campaignError) {
              console.log(`      ùå Erro ao processar campanha ${campaign.name}:`, campaignError)
              campaign.insights = { data: [] }
              campaign.adsets = []
              campaign.ads = []
            }
            
            // Enriquecer com dados da conta
            campaign.ad_account_id = adAccount.id
            campaign.ad_account_name = adAccount.name
            campaign.account_currency = adAccount.currency
            campaign.account_timezone = adAccount.timezone_name
          }
          
          allCampaigns.push(...campaigns)
          console.log(`úÖ ${campaigns.length} campanhas processadas completamente da conta ${adAccount.name}`)
        } else {
          console.log(`ùå Erro ao buscar campanhas: ${campaignsResponse.status}`)
        }
        
        // 2. AN·öNCIOS INDIVIDUAIS COM M·âTRICAS DETALHADAS
        console.log(`üì¢ Coletando an·∫ncios individuais da conta: ${adAccount.id}`)
        const adsUrl = `https://graph.facebook.com/v18.0/${adAccount.id}/ads?fields=id,name,status,effective_status,created_time,updated_time,creative.fields(title,body,image_url,video_id,thumbnail_url),targeting,insights.metric(impressions,reach,clicks,ctr,cpc,cpp,cpm,spend,frequency,actions,conversions,cost_per_conversion,video_play_actions,link_clicks,post_engagement,page_engagement,likes,comments,shares,video_view).date_preset(last_30d)&limit=50&access_token=${config.access_token}`
        const adsResponse = await fetch(adsUrl)
        
        if (adsResponse.ok) {
          const adsData = await adsResponse.json()
          const ads = adsData.data || []
          
          // Enriquecer cada an·∫ncio com dados da conta
          for (const ad of ads) {
            ad.ad_account_id = adAccount.id
            ad.ad_account_name = adAccount.name
            ad.account_currency = adAccount.currency
          }
          
          allAds.push(...ads)
          console.log(`üì¢ ${ads.length} an·∫ncios coletados da conta ${adAccount.name}`)
        }
        
      } catch (accountError) {
        console.log(`ùå Erro ao processar account ${adAccount.id}:`, accountError)
      }
    }
    
    // CALCULAR TOTAIS E M·âTRICAS AGREGADAS DETALHADAS
    console.log(`üìä Calculando totais de ${allCampaigns.length} campanhas...`)
    let totalSpend = 0
    let totalImpressions = 0
    let totalReach = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalVideoViews = 0
    let activeCampaigns = 0
    let campaignsWithData = 0
    
    for (const campaign of allCampaigns) {
      // Contar campanhas ativas
      if (campaign.effective_status === 'ACTIVE') {
        activeCampaigns++
      }
      
      // Processar insights detalhados
      if (campaign.insights?.data?.[0]) {
        const insights = campaign.insights.data[0]
        const spend = parseFloat(insights.spend || 0)
        const impressions = parseInt(insights.impressions || 0)
        const reach = parseInt(insights.reach || 0)
        const clicks = parseInt(insights.clicks || 0)
        const conversions = parseInt(insights.conversions || 0)
        const videoViews = parseInt(insights.video_views || 0)
        
        totalSpend += spend
        totalImpressions += impressions
        totalReach += reach
        totalClicks += clicks
        totalConversions += conversions
        totalVideoViews += videoViews
        
        if (spend > 0 || impressions > 0) {
          campaignsWithData++
        }
        
        console.log(`   ${campaign.name}: R$${spend.toFixed(2)}, ${impressions.toLocaleString()} imp, ${clicks} clicks`)
      } else {
        console.log(`   ${campaign.name}: sem dados de insights`)
      }
    }
    
    console.log(`üí∞ TOTAIS FINAIS:`)
    console.log(`   üíµ Gasto: R$${totalSpend.toFixed(2)}`)
    console.log(`   üëÅÔ∏è Impress·µes: ${totalImpressions.toLocaleString()}`)
    console.log(`   üéØ Alcance: ${totalReach.toLocaleString()}`)
    console.log(`   üñ±Ô∏è Cliques: ${totalClicks.toLocaleString()}`)
    console.log(`   úÖ Convers·µes: ${totalConversions}`)
    console.log(`   üìπ Visualiza·ß·µes de v·≠deo: ${totalVideoViews.toLocaleString()}`)
    console.log(`   üìä Campanhas ativas: ${activeCampaigns}/${allCampaigns.length}`)
    console.log(`   üìà Campanhas com dados: ${campaignsWithData}/${allCampaigns.length}`)
    
    return {
      campaigns: allCampaigns,
      ads: allAds,
      ad_accounts: adAccounts,
      totals: {
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_reach: totalReach,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_video_views: totalVideoViews,
        active_campaigns: activeCampaigns,
        total_campaigns: allCampaigns.length,
        campaigns_with_data: campaignsWithData,
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
    
  } catch (error) {
    console.error('ùå Erro ao coletar campanhas:', error)
    return { campaigns: [], ads: [], ad_accounts: [], error: error.message }
  }
}

async function salvarDadosNoBanco(supabase, facebookData, instagramData, campaignsData, barId: number) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    console.log('üíæ Processando e salvando dados COMPLETOS do Meta...')
    
    // === PROCESSAR DADOS FACEBOOK COMPLETOS ===
    console.log('üìò Processando insights Facebook...')
    
    // Extrair m·©tricas dos posts
    let fbLikes = 0, fbComments = 0, fbShares = 0
    if (facebookData.posts && Array.isArray(facebookData.posts)) {
      for (const post of facebookData.posts) {
        fbLikes += post.reactions?.summary?.total_count || 0
        fbComments += post.comments?.summary?.total_count || 0
        fbShares += post.shares?.count || 0
      }
    }
    
    // Extrair insights de alcance e impress·µes
    let pageReach = 0, pageImpressions = 0, postEngagements = 0, videoViews = 0
    if (facebookData.insights) {
      // Somar dados dos ·∫ltimos dias
      if (facebookData.insights.reach?.data) {
        pageReach = facebookData.insights.reach.data.reduce((sum: number, item) => sum + (parseInt(item.value) || 0), 0)
      }
      if (facebookData.insights.views?.data) {
        pageImpressions = facebookData.insights.views.data.reduce((sum: number, item) => sum + (parseInt(item.value) || 0), 0)
      }
      if (facebookData.insights.engagement?.data) {
        postEngagements = facebookData.insights.engagement.data.reduce((sum: number, item) => sum + (parseInt(item.value) || 0), 0)
      }
    }
    
    // === PROCESSAR DADOS INSTAGRAM COMPLETOS ===
    console.log('üì∏ Processando insights Instagram...')
    
    // Extrair m·©tricas dos posts
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
        igReach = instagramData.insights.reach.data[0].values.reduce((sum: number, item) => sum + (parseInt(item.value) || 0), 0)
      }
      
      // Processar profile visits (corrigido - m·©trica v·°lida da API)
      if (instagramData.insights.profile_visits?.data?.[0]?.total_value) {
        profileViews = parseInt(instagramData.insights.profile_visits.data[0].total_value.value) || 0
      }
      
      // Processar website clicks (corrigido com metric_type=total_value)
      if (instagramData.insights.website_clicks?.data?.[0]?.total_value) {
        websiteClicks = parseInt(instagramData.insights.website_clicks.data[0].total_value.value) || 0
      }
      
      // Impressions n·£o est·° dispon·≠vel na API v22+ (usar reach como substituto)
      igImpressions = igReach // Meta removeu impressions, usar reach como proxy
    }
    
    console.log(`üìä Facebook processado: Reach ${pageReach}, Impressions ${pageImpressions}, ${fbLikes} likes`)
    console.log(`üì∏ Instagram processado: Reach ${igReach}, Impressions ${igImpressions}, ${igLikes} likes`)
    
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
        profile_visits: profileViews,
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
      console.log(`üéØ Salvando ${campaignsData.campaigns.length} campanhas...`)
      
      // Preparar dados para inser·ß·£o com dados detalhados
      const campaignsToInsert = campaignsData.campaigns.map((campaign) => {
        const insights = campaign.insights?.data?.[0] || {}
        
        console.log(`üíæ Preparando salvamento: ${campaign.name} - R$${insights.spend || 0}`)
        
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
          post_engagement: insights.post_engagement ? parseInt(insights.post_engagement) : null,
          page_engagement: insights.page_engagement ? parseInt(insights.page_engagement) : null,
          likes: insights.likes ? parseInt(insights.likes) : null,
          comments: insights.comments ? parseInt(insights.comments) : null,
          shares: insights.shares ? parseInt(insights.shares) : null,
          adsets_count: campaign.adsets?.length || 0,
          ads_count: campaign.ads?.length || 0,
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
        console.error('ùå Erro ao salvar campanhas:', campaignsError_result)
      } else {
        console.log(`úÖ ${campaignsSaved} campanhas salvas com sucesso`)
      }
    } else {
      console.log('ö†Ô∏è Nenhuma campanha para salvar')
    }
    
    // Verificar resultados
    const fbSuccess = !fbError && fbData && fbData.length > 0
    const igSuccess = !igError && igData && igData.length > 0
    
    if (fbError) {
      console.error('ùå Erro ao salvar dados Facebook:', fbError)
    } else {
      console.log('úÖ Dados Facebook salvos com sucesso:', fbData)
    }
    
    if (igError) {
      console.error('ùå Erro ao salvar dados Instagram:', igError)
    } else {
      console.log('úÖ Dados Instagram salvos com sucesso:', igData)
    }
    
    console.log(`üìä Resultado final: Facebook=${fbSuccess}, Instagram=${igSuccess}, Campanhas=${campaignsSuccess}`)
    
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
    console.error('ùå Erro ao salvar dados no banco:', error)
    throw error
  }
}

async function enviarNotificacaoDiscord(supabase, resultado, facebookData, instagramData, campaignsData, barId: number) {
  try {
    // Obter webhook correto do Discord para Meta
    const webhookUrl = await getWebhookUrl(supabase, barId, 'meta')
    console.log('üîó Usando webhook:', webhookUrl.substring(0, 50) + '...')

    const agora = new Date()
    
    // Dados para exibi·ß·£o
    const fbSeguidores = facebookData.page_info?.fan_count || 0
    const igSeguidores = instagramData.account_info?.followers_count || 0
    const igSeguindo = instagramData.account_info?.follows_count || 0
    const igPosts = instagramData.account_info?.media_count || 0
    
    const fbLikes = resultado.facebook_metrics?.post_likes || 0
    const fbComments = resultado.facebook_metrics?.post_comments || 0
    const fbShares = resultado.facebook_metrics?.post_shares || 0
    
    const igLikes = resultado.instagram_metrics?.posts_likes || 0
    const igComments = resultado.instagram_metrics?.posts_comments || 0

    // úÖ CORRIGIR CAMPANHAS - usar a estrutura correta
    console.log('üéØ Debug campanhas data:', JSON.stringify({
      exists: !!campaignsData,
      totals: campaignsData?.totals,
      campaigns_length: campaignsData?.campaigns?.length,
      campaigns_saved: resultado.campaigns_metrics?.campaigns_saved
    }))

    // Dados de campanhas corrigidos
    const totalCampanhas = campaignsData?.campaigns?.length || campaignsData?.totals?.total_campaigns || 0
    const campanhasAtivas = campaignsData?.totals?.active_campaigns || 
                           campaignsData?.campaigns?.filter((c) => c.effective_status === 'ACTIVE')?.length || 0
    const gastoTotal = campaignsData?.totals?.total_spend || 0

    console.log(`üéØ Campanhas para Discord: ${totalCampanhas} total, ${campanhasAtivas} ativas, R$ ${gastoTotal}`)

    const message: DiscordMessage = {
      embeds: [{
        title: 'üìä Meta Analytics - Coleta Autom·°tica',
        description: `Dados do Facebook e Instagram coletados com sucesso!\n\nüïê **Executado em:** ${agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\nüè¢ **Bar ID:** ${barId}`,
        color: 0x4267B2, // Azul do Facebook
        fields: [
          {
            name: 'üìò Facebook',
            value: `**${fbSeguidores}** seguidores\n**${fbLikes}** likes recentes\n**${fbComments}** coment·°rios\n**${fbShares}** compartilhamentos`,
            inline: true
          },
          {
            name: 'üì∏ Instagram',
            value: `**${igSeguidores}** seguidores\n**${igSeguindo}** seguindo\n**${igPosts}** posts totais\n**${igLikes}** likes recentes\n**${igComments}** coment·°rios`,
            inline: true
          },
          {
            name: 'üéØ Campanhas (Meta Ads)',
            value: `**${totalCampanhas}** total\n**${campanhasAtivas}** ativas\n**${campaignsData?.totals?.campaigns_with_data || 0}** com dados\n**R$ ${gastoTotal.toFixed(2)}** gasto\n**${campaignsData?.totals?.total_impressions?.toLocaleString() || 0}** impress·µes\n**${campaignsData?.totals?.total_clicks?.toLocaleString() || 0}** cliques`,
            inline: true
          },
          {
            name: 'üíæ Status Salvamento',
            value: `Facebook: ${resultado.facebook_saved ? 'úÖ' : 'ùå'}\nInstagram: ${resultado.instagram_saved ? 'úÖ' : 'ùå'}\nCampanhas: ${resultado.campaigns_saved ? 'úÖ' : 'ùå'}`,
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

    console.log('úÖ Notifica·ß·£o Discord enviada com sucesso')

  } catch (error) {
    console.error('ùå Erro ao enviar notifica·ß·£o Discord:', error)
  }
}

async function enviarErroDiscord(supabase, error, barId: number) {
  try {
    const webhookUrl = await getWebhookUrl(supabase, barId, 'meta')

    const message: DiscordMessage = {
      embeds: [{
        title: 'ùå Meta Sync - Erro na Execu·ß·£o',
        description: `Falha na coleta de dados do Meta (Edge Function)`,
        color: 0xff0000,
        fields: [
          {
            name: 'üè¢ Bar ID',
            value: barId.toString(),
            inline: true
          },
          {
            name: 'üîç Erro',
            value: error.message || 'Erro desconhecido',
            inline: false
          },
          {
            name: 'üïê Timestamp',
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
    console.error('ùå Erro ao enviar erro para Discord:', discordError)
  }
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

// Helper para construir URLs da API Facebook - ELIMINA REPETI·á·ÉO
function buildFacebookApiUrl(endpoint: string, params: Record<string, string>): string {
  const baseUrl = `https://graph.facebook.com/${CONFIG.FACEBOOK_API_VERSION}/${endpoint}`
  const searchParams = new URLSearchParams(params)
  return `${baseUrl}?${searchParams.toString()}`
} 
