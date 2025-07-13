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
    
    // 3. SALVAR NO BANCO
    console.log('💾 Salvando dados no banco...')
    const resultadoSalvamento = await salvarDadosNoBanco(supabase, facebookData, instagramData, BAR_ID)
    
    // 4. ENVIAR NOTIFICAÇÃO DISCORD
    console.log('📤 Enviando notificação para Discord...')
    await enviarNotificacaoDiscord(supabase, resultadoSalvamento, facebookData, instagramData, BAR_ID)

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: BAR_ID,
      facebook_data: facebookData,
      instagram_data: instagramData,
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
    console.log('📊 Buscando dados da página Facebook...')
    
    // Dados básicos da página
    const pageUrl = `https://graph.facebook.com/v18.0/${config.page_id}?fields=followers_count,fan_count,name,about&access_token=${config.access_token}`
    const pageResponse = await fetch(pageUrl)
    
    if (!pageResponse.ok) {
      throw new Error(`Erro ao buscar dados da página: ${pageResponse.status}`)
    }
    
    const pageData = await pageResponse.json()
    
    // Insights da página (últimos 30 dias)
    const insightsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_post_engagements,page_posts_impressions,page_video_views&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    const insightsResponse = await fetch(insightsUrl)
    
    let insights = {}
    if (insightsResponse.ok) {
      insights = await insightsResponse.json()
    }
    
    // Posts recentes (últimos 10)
    const postsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/posts?fields=id,message,created_time,reactions.summary(true),comments.summary(true),shares&limit=10&access_token=${config.access_token}`
    const postsResponse = await fetch(postsUrl)
    
    let posts = []
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      posts = postsData.data || []
    }
    
    return {
      page_info: pageData,
      insights,
      posts,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Erro ao coletar dados Facebook:', error)
    throw error
  }
}

async function coletarDadosInstagram(config: MetaCredentials) {
  try {
    console.log('📸 Buscando dados da conta Instagram...')
    
    // Dados básicos da conta
    const accountUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=followers_count,follows_count,media_count,username,name,biography&access_token=${config.access_token}`
    const accountResponse = await fetch(accountUrl)
    
    if (!accountResponse.ok) {
      throw new Error(`Erro ao buscar dados da conta Instagram: ${accountResponse.status}`)
    }
    
    const accountData = await accountResponse.json()
    
    // Insights da conta (últimos 30 dias)
    const insightsUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=follower_count,impressions,reach,profile_views&period=day&since=${getDateDaysAgo(30)}&until=${getDateDaysAgo(1)}&access_token=${config.access_token}`
    const insightsResponse = await fetch(insightsUrl)
    
    let insights = {}
    if (insightsResponse.ok) {
      insights = await insightsResponse.json()
    }
    
    // Mídia recente (últimos 10 posts)
    const mediaUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=10&access_token=${config.access_token}`
    const mediaResponse = await fetch(mediaUrl)
    
    let media = []
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      media = mediaData.data || []
    }
    
    return {
      account_info: accountData,
      insights,
      media,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Erro ao coletar dados Instagram:', error)
    throw error
  }
}

async function salvarDadosNoBanco(supabase: any, facebookData: any, instagramData: any, barId: number) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    
    // Calcular dados do Facebook
    let fbLikes = 0, fbComments = 0, fbShares = 0
    if (facebookData.posts && Array.isArray(facebookData.posts)) {
      for (const post of facebookData.posts) {
        fbLikes += post.reactions?.summary?.total_count || 0
        fbComments += post.comments?.summary?.total_count || 0
        fbShares += post.shares?.count || 0
      }
    }
    
    // Calcular dados do Instagram
    let igLikes = 0, igComments = 0
    if (instagramData.media && Array.isArray(instagramData.media)) {
      for (const item of instagramData.media) {
        igLikes += item.like_count || 0
        igComments += item.comments_count || 0
      }
    }
    
    console.log('💾 Salvando com DELETE + INSERT...')
    
    // FACEBOOK: Delete existente + Insert novo
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
        page_reach: 0,
        page_impressions: 0,
        raw_data: facebookData
      })
      .select()
    
    // INSTAGRAM: Delete existente + Insert novo
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
        reach: 0,
        impressions: 0,
        raw_data: instagramData
      })
      .select()
    
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
    
    console.log(`📊 Resultado final: Facebook=${fbSuccess}, Instagram=${igSuccess}`)
    
    return {
      facebook_saved: fbSuccess,
      instagram_saved: igSuccess,
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
      facebook_error: fbError?.message || null,
      instagram_error: igError?.message || null,
      facebook_data: fbData,
      instagram_data: igData
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar dados no banco:', error)
    throw error
  }
}

async function enviarNotificacaoDiscord(supabase: any, resultado: any, facebookData: any, instagramData: any, barId: number) {
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
            name: '💾 Status Salvamento',
            value: `Facebook: ${resultado.facebook_saved ? '✅' : '❌'}\nInstagram: ${resultado.instagram_saved ? '✅' : '❌'}`,
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