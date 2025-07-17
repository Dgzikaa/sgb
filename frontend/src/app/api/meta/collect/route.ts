import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createMetaSocialService } from '@/lib/meta-social-service'
import { notifyMarketingUpdate } from '@/lib/discord-marketing-service'
import { z } from 'zod'

// Schema de validaÃ¡Â§Ã¡Â£o para parÃ¡Â¢metros
const CollectMetricsSchema = z.object({
  types: z.array(z.enum(['facebook', 'instagram', 'posts', 'all'])).optional().default(['all']),
  period: z.enum(['day', 'week', 'month']).optional().default('day'),
  limit: z.number().int().min(1).max(100).optional().default(25),
  since: z.string().optional(),
  until: z.string().optional()
})

// ========================================
// Ã°Å¸Å¡â‚¬ POST /api/meta/collect
// Coletar mÃ¡Â©tricas da Meta
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€â€ž SolicitaÃ¡Â§Ã¡Â£o de coleta manual via Marketing 360Â°...')

    const body = await request.json()
    const { types, period, limit } = body

    console.log('Ã°Å¸â€œÅ  ParÃ¡Â¢metros da coleta:', { types, period, limit })

    // Chamar o endpoint de coleta automÃ¡Â¡tica que jÃ¡Â¡ funciona
    const autoCollectResponse = await fetch('https://sgbv2.vercel.app/api/meta/auto-collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-meta-cron-2025'
      },
      body: JSON.stringify({
        automatic: false,
        source: 'marketing360_manual',
        types: types || ['all'],
        period: period || 'day'
      })
    })

    if (autoCollectResponse.ok) {
      const autoCollectResult = await autoCollectResponse.json()
      
      console.log('Å“â€¦ Coleta manual bem-sucedida')
      
      return NextResponse.json({
        success: true,
        message: 'Coleta manual executada com sucesso!',
        data: autoCollectResult,
        platforms_collected: autoCollectResult.results?.plataformas_coletadas || 0,
        api_calls_made: autoCollectResult.results?.api_calls_total || 0,
        duration_seconds: autoCollectResult.results?.duracao_segundos || 0,
        timestamp: new Date().toISOString()
      })
    } else {
      const errorText = await autoCollectResponse.text()
      console.log('ÂÅ’ Erro na coleta:', errorText)
      
      return NextResponse.json({
        success: false,
        message: 'Erro na coleta de dados',
        error: errorText
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erro crÃ¡Â­tico na coleta manual:', error)
    
    return NextResponse.json({ 
      success: false,
      message: 'Erro crÃ¡Â­tico na execuÃ¡Â§Ã¡Â£o da coleta',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// Ã°Å¸Å¡â‚¬ POST /api/meta/collect/raw
// Inserir JSON bruto na meta_raw (teste)
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, tipo, json_raw } = body

    if (!bar_id || !tipo || !json_raw) {
      return NextResponse.json({
        success: false,
        message: 'ParÃ¡Â¢metros obrigatÃ³rios: bar_id, tipo, json_raw'
      }, { status: 400 })
    }

    const supabase = await import('@supabase/supabase-js').then(m =>
      m.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    )

    const hoje = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('meta_raw')
      .insert({
        bar_id,
        data_coleta: hoje,
        tipo,
        json_raw
      })
      .select()

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// ========================================
// Ã°Å¸Å¡â‚¬ POST /api/meta/collect/raw-real
// Coletar dados reais do Meta e inserir JSON bruto na meta_raw (teste)
// ========================================
export async function PATCH(request: NextRequest) {
  const inserts: any[] = [];
  try {
    // Recebe bar_id (ou usa padrÃ£o)
    const body = await request.json()
    const bar_id = body.bar_id || 3
    const hoje = new Date().toISOString().split('T')[0]

    // Inicializa Supabase
    const supabase = await import('@supabase/supabase-js').then(m =>
      m.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    )

    // Busca credenciais do Meta
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', bar_id)
      .single()

    if (credError || !credenciais || !credenciais.configuracoes) {
      return NextResponse.json({ success: false, message: 'Credenciais do Meta nÃ£o encontradas', credError }, { status: 400 })
    }

    const metaConfig = {
      access_token: credenciais.access_token,
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id,
      ad_account_id: credenciais.configuracoes.ad_account_id
    }

    // FunÃ§Ãµes utilitÃ¡rias para datas
    function getDateDaysAgo(days: number): string {
      const date = new Date()
      date.setDate(date.getDate() - days)
      return date.toISOString().split('T')[0]
    }

    // 1. Instagram - Perfil
    let instagramProfile = null
    try {
      const url = `https://graph.facebook.com/v18.0/${metaConfig.instagram_account_id}?fields=followers_count,follows_count,media_count,username,name,biography,website,profile_picture_url&access_token=${metaConfig.access_token}`
      const res = await fetch(url)
      instagramProfile = await res.json()
    } catch (e) { instagramProfile = { error: e instanceof Error ? e.message : String(e) } }

    // 2. Instagram - Coleta estruturada expandida (posts, stories, reels)
    let instagramProfileData = null;
    let instagramInsightsData = null;
    const instagramPostsData: any[] = [];
    const instagramStoriesData: any[] = [];
    const instagramReelsData: any[] = [];
    const estimativasData = { engagement_total: 0, views_total: 0 };
    const limitacoesData: string[] = [
      'NÃ£o hÃ¡ variaÃ§Ã£o de seguidores por perÃ­odo',
      'NÃ£o hÃ¡ segmentaÃ§Ã£o seguidores/nÃ£o seguidores',
      'Stories expiram em 24h',
      'Views agregados de stories sÃ³ disponÃ­veis se coletar logo apÃ³s publicaÃ§Ã£o',
      'Stories e reels sÃ³ aparecem se disponÃ­veis via API no momento da coleta'
    ];
    try {
      // 1. Coleta do perfil
      const urlProfile = `https://graph.facebook.com/v19.0/${metaConfig.instagram_account_id}?fields=username,followers_count,follows_count,media_count&access_token=${metaConfig.access_token}`;
      const resProfile = await fetch(urlProfile);
      const profileJson = await resProfile.json();
      instagramProfileData = {
        follower_count: profileJson.followers_count,
        follows_count: profileJson.follows_count,
        media_count: profileJson.media_count,
        username: profileJson.username
      };
      // 2. Coleta de mÃ©tricas de perfil (impressions, reach, profile_views, website_clicks)
      const urlInsights = `https://graph.facebook.com/v19.0/${metaConfig.instagram_account_id}/insights?metric=impressions,reach,profile_views,website_clicks&period=day&access_token=${metaConfig.access_token}`;
      const resInsights = await fetch(urlInsights);
      const insightsJson = await resInsights.json();
      instagramInsightsData = {};
      if (insightsJson.data && Array.isArray(insightsJson.data)) {
        for (const metric of insightsJson.data) {
          (instagramInsightsData as any)[metric.name] = metric.values;
        }
      }
      // 3. Coleta de posts, stories e reels recentes (expandido)
      const urlMedia = `https://graph.facebook.com/v19.0/${metaConfig.instagram_account_id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=20&access_token=${metaConfig.access_token}`;
      const resMedia = await fetch(urlMedia);
      const mediaList = await resMedia.json();
      if (mediaList.data && Array.isArray(mediaList.data)) {
        for (const media of mediaList.data) {
          // Determinar tipo de conteÃºdo
          const isStory = media.media_type === 'STORY';
          const isReel = media.media_type === 'REEL';
          const isVideo = media.media_type === 'VIDEO';
          // Coleta de insights por post/story/reel
          let metrics = 'impressions,reach,engagement,saved';
          if (isVideo || isReel) metrics += ',video_views';
          const urlPostInsights = `https://graph.facebook.com/v19.0/${media.id}/insights?metric=${metrics}&access_token=${metaConfig.access_token}`;
          let postInsights: any = {};
          try {
            const resPostInsights = await fetch(urlPostInsights);
            const postInsightsJson = await resPostInsights.json();
            if (postInsightsJson.data && Array.isArray(postInsightsJson.data)) {
              for (const metric of postInsightsJson.data) {
                postInsights[(metric as any).name] = (metric as any).values?.[0]?.value ?? null;
                // Somar para estimativas
                if (metric.name === 'engagement') estimativasData.engagement_total += Number(metric.values?.[0]?.value || 0);
                if (metric.name === 'impressions') estimativasData.views_total += Number(metric.values?.[0]?.value || 0);
                if (metric.name === 'video_views') estimativasData.views_total += Number(metric.values?.[0]?.value || 0);
              }
            }
          } catch (e) {
            postInsights = {};
          }
          const mediaObj = {
            id: media.id,
            caption: media.caption,
            media_type: media.media_type,
            media_url: media.media_url,
            permalink: media.permalink,
            thumbnail_url: media.thumbnail_url,
            timestamp: media.timestamp,
            insights: postInsights
          };
          if (isStory) instagramStoriesData.push(mediaObj);
          else if (isReel) instagramReelsData.push(mediaObj);
          else instagramPostsData.push(mediaObj);
        }
      }
      // Montar JSON final estruturado
      const instagramFullJson = {
        data_coleta: hoje,
        instagram_profile: instagramProfileData,
        instagram_insights: instagramInsightsData,
        instagram_posts: instagramPostsData,
        instagram_stories: instagramStoriesData,
        instagram_reels: instagramReelsData,
        estimativas: estimativasData,
        limitacoes: limitacoesData
      };
      // Salvar no banco
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'instagram_full', json_raw: instagramFullJson });
      console.log('[Instagram] JSON estruturado expandido salvo em inserts:', JSON.stringify(instagramFullJson));
    } catch (e) {
      console.error('[Instagram] Erro na coleta estruturada expandida:', e);
    }

    // 4. Facebook - Perfil
    let facebookProfile = null
    try {
      const url = `https://graph.facebook.com/v18.0/${metaConfig.page_id}?fields=fan_count,about,category,checkins,talking_about_count,were_here_count,overall_star_rating,rating_count,cover,picture&access_token=${metaConfig.access_token}`
      console.log('[Facebook] Perfil URL:', url)
      const res = await fetch(url)
      facebookProfile = await res.json()
      if (facebookProfile.error) {
        console.error('[Facebook] Erro perfil:', facebookProfile.error)
      }
    } catch (e) { 
      let errorMsg = 'Erro desconhecido';
      if (e instanceof Error) errorMsg = e.message;
      facebookProfile = { error: errorMsg };
      console.error('[Facebook] ExceÃ§Ã£o perfil:', errorMsg);
    }

    // 5. Facebook - Insights da PÃ¡Â¡gina
    let facebookInsights = null
    try {
      const url = `https://graph.facebook.com/v18.0/${metaConfig.page_id}/insights?metric=page_impressions,page_engaged_users,page_views_total,page_fans,page_fan_adds,page_fan_removes&period=day&access_token=${metaConfig.access_token}`
      console.log('[Facebook] Insights URL:', url)
      const res = await fetch(url)
      facebookInsights = await res.json()
      if (facebookInsights.error) {
        console.error('[Facebook] Erro insights:', facebookInsights.error)
      }
    } catch (e) { 
      let errorMsg = 'Erro desconhecido';
      if (e instanceof Error) errorMsg = e.message;
      facebookInsights = { error: errorMsg };
      console.error('[Facebook] ExceÃ§Ã£o insights:', errorMsg);
    }

    // 6. Facebook - Posts
    let facebookPosts = null
    const facebookPostInsights = []
    try {
      const url = `https://graph.facebook.com/v18.0/${metaConfig.page_id}/posts?fields=id,message,created_time,permalink_url,full_picture,shares,comments.summary(true),likes.summary(true)&limit=10&access_token=${metaConfig.access_token}`
      console.log('[Facebook] Posts URL:', url)
      const res = await fetch(url)
      facebookPosts = await res.json()
      if (facebookPosts.error) {
        console.error('[Facebook] Erro posts:', facebookPosts.error)
      }
      if (facebookPosts.data && Array.isArray(facebookPosts.data)) {
        for (const post of facebookPosts.data) {
          try {
            const insightsUrl = `https://graph.facebook.com/v18.0/${post.id}/insights?metric=post_impressions,post_engaged_users,post_reactions_like_total,post_comments,post_shares&access_token=${metaConfig.access_token}`
            console.log('[Facebook] Post Insights URL:', insightsUrl)
            const insightsRes = await fetch(insightsUrl)
            const insightsJson = await insightsRes.json()
            if (insightsJson.error) {
              console.error('[Facebook] Erro post insights:', insightsJson.error)
            }
            facebookPostInsights.push({ post_id: post.id, insights: insightsJson.data || [] })
          } catch (e) {
            facebookPostInsights.push({ post_id: post.id, insights: [{ error: e instanceof Error ? e.message : String(e) }] })
            console.error('[Facebook] ExceÃ§Ã£o post insights:', e instanceof Error ? e.message : String(e))
          }
        }
      }
    } catch (e) { 
      let errorMsg = 'Erro desconhecido';
      if (e instanceof Error) errorMsg = e.message;
      facebookPosts = { error: errorMsg };
      console.error('[Facebook] ExceÃ§Ã£o posts:', errorMsg);
    }

    // 7. Ads - Campanhas e Insights (jÃ¡Â¡ estava avanÃ§ado)
    let adsData = null
    const adsDetailed = []
    try {
      const adAccountId = metaConfig.ad_account_id
      const campaignsUrl = `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time&limit=20&access_token=${metaConfig.access_token}`
      console.log('[Ads] Campanhas URL:', campaignsUrl)
      const campaignsResponse = await fetch(campaignsUrl)
      const campaignsJson = await campaignsResponse.json()
      adsData = campaignsJson
      if (adsData.error) {
        console.error('[Ads] Erro campanhas:', adsData.error)
      }
      if (campaignsJson.data && Array.isArray(campaignsJson.data)) {
        for (const campaign of campaignsJson.data) {
          try {
            const insightsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,reach,clicks,ctr,cpc,cpp,cpm,spend,actions,cost_per_action_type&date_preset=last_30d&access_token=${metaConfig.access_token}`
            console.log('[Ads] Insights campanha URL:', insightsUrl)
            const insightsResponse = await fetch(insightsUrl)
            const insightsJson = await insightsResponse.json()
            if (insightsJson.error) {
              console.error('[Ads] Erro insights campanha:', insightsJson.error)
            }
            adsDetailed.push({ ...campaign, insights: insightsJson.data?.[0] || null })
          } catch (e) {
            adsDetailed.push({ ...campaign, insights: { error: e instanceof Error ? e.message : String(e) } })
            console.error('[Ads] ExceÃ§Ã£o insights campanha:', e instanceof Error ? e.message : String(e))
          }
        }
      }
    } catch (e) { 
      let errorMsg = 'Erro desconhecido';
      if (e instanceof Error) errorMsg = e.message;
      adsData = { error: errorMsg };
      console.error('[Ads] ExceÃ§Ã£o campanhas:', errorMsg);
    }

    // Certificar que o array 'inserts' estÃ¡Â¡ declarado
    if (instagramProfile) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'instagram_profile', json_raw: instagramProfile })
    }
    // InserÃ§Ã£o dos dados coletados
    try {
      console.log('[Instagram] Salvando follower_count_day...');
      if (instagramProfileData?.follower_count) {
        inserts.push({ bar_id, data_coleta: hoje, tipo: 'instagram_follower_count_day', json_raw: { tipo: 'preciso', data: instagramProfileData.follower_count } });
        console.log('[Instagram] follower_count_day salvo.');
      }
      console.log('[Instagram] Salvando profile_views_website_clicks...');
      if ((instagramInsightsData as any)?.profile_views || (instagramInsightsData as any)?.website_clicks) {
        inserts.push({ bar_id, data_coleta: hoje, tipo: 'instagram_profile_views_website_clicks', json_raw: { tipo: 'preciso', data: { profile_views: (instagramInsightsData as any).profile_views, website_clicks: (instagramInsightsData as any).website_clicks } } });
        console.log('[Instagram] profile_views_website_clicks salvo.');
      }
      console.log('[Instagram] Salvando posts_summary...');
      if (instagramPostsData.length > 0) {
        inserts.push({ bar_id, data_coleta: hoje, tipo: 'instagram_posts_summary', json_raw: { tipo: 'estimado', data: { total_posts: instagramPostsData.length, estimativas: estimativasData } } });
        console.log('[Instagram] posts_summary salvo.');
      }
      console.log('[Instagram] Salvando limitations...');
      if (limitacoesData.length > 0) {
        inserts.push({ bar_id, data_coleta: hoje, tipo: 'instagram_limitations', json_raw: { tipo: 'inacessivel', data: limitacoesData } });
        console.log('[Instagram] limitations salvo.');
      }
    } catch (insertError) {
      console.error('[Instagram] Erro ao salvar dados:', insertError);
    }
    if (facebookProfile) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'facebook_profile', json_raw: facebookProfile })
    }
    if (facebookInsights) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'facebook_insights', json_raw: facebookInsights })
    }
    if (facebookPosts) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'facebook_posts', json_raw: facebookPosts })
    }
    if (facebookPostInsights.length > 0) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'facebook_post_insights', json_raw: facebookPostInsights })
    }
    if (adsData) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'ads', json_raw: adsData })
    }
    if (adsDetailed.length > 0) {
      inserts.push({ bar_id, data_coleta: hoje, tipo: 'ads_detailed', json_raw: adsDetailed })
    }

    const { data: inserted, error: insertError } = await supabase
      .from('meta_raw')
      .insert(inserts)
      .select()

    if (insertError) {
      return NextResponse.json({ success: false, insertError, inserts }, { status: 500 })
    }

    // Retornar resposta simples
    return NextResponse.json({ success: true });
  } catch (error) {
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€Â GET /api/meta/collect/status
// Verificar status da Ã¡Âºltima coleta
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ£o autenticado' }, { status: 401 })
    }

    const { bar_id } = JSON.parse(userData)

    // Buscar Ã¡Âºltimas coletas
    const supabase = await import('@supabase/supabase-js').then(m => 
      m.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    )

    const { data: coletas, error } = await supabase
      .from('meta_coletas_log')
      .select('*')
      .eq('bar_id', bar_id)
      .order('iniciada_em', { ascending: false })
      .limit(10)

    if (error) {
      console.error('ÂÅ’ Erro ao buscar status das coletas:', error)
      return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
    }

    // Agrupar por tipo
    const statusByType = coletas?.reduce((acc: any, coleta: any) => {
      if (!acc[coleta.tipo_coleta]) {
        acc[coleta.tipo_coleta] = []
      }
      acc[coleta.tipo_coleta].push(coleta)
      return acc
    }, {})

    // Resumo geral
    const ultimaColeta = coletas?.[0]
    const resumo = {
      ultima_coleta: ultimaColeta ? {
        data: ultimaColeta.iniciada_em,
        status: ultimaColeta.status,
        tipo: ultimaColeta.tipo_coleta,
        registros: ultimaColeta.registros_processados
      } : null,
      total_coletas_hoje: coletas?.filter((c: any) => 
        new Date(c.iniciada_em).toDateString() === new Date().toDateString()
      ).length || 0,
      por_tipo: statusByType,
      configuracao_ativa: true // TODO: verificar se config estÃ¡Â¡ ativa
    }

    return NextResponse.json(resumo)

  } catch (error) {
    console.error('ÂÅ’ Erro ao buscar status das coletas:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
} 

