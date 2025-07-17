// Edge Function: meta-collect
// Coleta dados do Instagram, Facebook (curtidas) e Ads, salva em meta_raw e chama a funá§á£o de processamento
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req)=>{
  try {
    // Supabase client para Deno
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const bar_id = 3; // Pode ser parametrizado futuramente
    const hoje = new Date().toISOString().split('T')[0];
    // Buscar credenciais do Meta
    const { data: credenciais, error: credError } = await supabase.from('api_credentials').select('*').eq('sistema', 'meta').eq('bar_id', bar_id).single();
    if (credError || !credenciais || !credenciais.configuracoes) {
      console.error('[meta-collect] Credenciais do Meta ná£o encontradas', credError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciais do Meta ná£o encontradas',
        credError
      }), { status: 400 });
    }
    const metaConfig = {
      access_token: credenciais.access_token,
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id,
      ad_account_id: credenciais.configuracoes.ad_account_id
    };
    // --- Instagram ---
    let instagramProfileData = null;
    let instagramInsightsData: Record<string, any> = {};
    let instagramPostsData: any[] = [];
    let instagramStoriesData: any[] = [];
    let instagramReelsData: any[] = [];
    let estimativasData = {
      engagement_total: 0,
      views_total: 0
    };
    let limitacoesData = [
      'Ná£o há¡ variaá§á£o de seguidores por perá­odo',
      'Ná£o há¡ segmentaá§á£o seguidores/ná£o seguidores',
      'Stories expiram em 24h',
      'Views agregados de stories sá³ disponá­veis se coletar logo apá³s publicaá§á£o',
      'Stories e reels sá³ aparecem se disponá­veis via API no momento da coleta'
    ];
    try {
      const urlProfile = `https://graph.facebook.com/v19.0/${metaConfig.instagram_account_id}?fields=username,followers_count,follows_count,media_count&access_token=${metaConfig.access_token}`;
      const resProfile = await fetch(urlProfile);
      const profileJson = await resProfile.json();
      instagramProfileData = {
        follower_count: profileJson.followers_count,
        follows_count: profileJson.follows_count,
        media_count: profileJson.media_count,
        username: profileJson.username
      };
      // Insights Instagram
      const urlInsights = `https://graph.facebook.com/v19.0/${metaConfig.instagram_account_id}/insights?metric=impressions,reach,profile_views,website_clicks&period=day&access_token=${metaConfig.access_token}`;
      const resInsights = await fetch(urlInsights);
      const insightsJson = await resInsights.json();
      instagramInsightsData = {};
      if (insightsJson.data && Array.isArray(insightsJson.data)) {
        for (const metric of insightsJson.data){
          instagramInsightsData[metric.name] = metric.values;
        }
      }
      // Paginaá§á£o de má­dias Instagram
      let nextMediaUrl = `https://graph.facebook.com/v19.0/${metaConfig.instagram_account_id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${metaConfig.access_token}`;
      while (nextMediaUrl) {
        const resMedia = await fetch(nextMediaUrl);
        const mediaList = await resMedia.json();
        if (mediaList.data && Array.isArray(mediaList.data)) {
          for (const media of mediaList.data) {
            const isStory = media.media_type === 'STORY';
            const isReel = media.media_type === 'REEL';
            const isVideo = media.media_type === 'VIDEO';
            let metrics = 'impressions,reach,engagement,saved';
            if (isVideo || isReel) metrics += ',video_views';
            const urlPostInsights = `https://graph.facebook.com/v19.0/${media.id}/insights?metric=${metrics}&access_token=${metaConfig.access_token}`;
            let postInsights: Record<string, any> = {};
            try {
              const resPostInsights = await fetch(urlPostInsights);
              const postInsightsJson = await resPostInsights.json();
              if (postInsightsJson.data && Array.isArray(postInsightsJson.data)) {
                for (const metric of postInsightsJson.data) {
                  postInsights[metric.name] = metric.values?.[0]?.value ?? null;
                  if (metric.name === 'engagement') estimativasData.engagement_total += Number(metric.values?.[0]?.value || 0);
                  if (metric.name === 'impressions') estimativasData.views_total += Number(metric.values?.[0]?.value || 0);
                  if (metric.name === 'video_views') estimativasData.views_total += Number(metric.values?.[0]?.value || 0);
                }
              }
            } catch (e) {
              console.error('[meta-collect] Erro ao coletar insights do post:', e);
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
        nextMediaUrl = mediaList.paging?.next || null;
      }
    } catch (e) {
      console.error('[meta-collect] Erro na coleta Instagram:', e);
      limitacoesData.push('[Instagram] Erro na coleta: ' + (e instanceof Error ? e.message : String(e)));
    }
    // --- Facebook (apenas curtidas) ---
    let facebookFanCount = null;
    try {
      const url = `https://graph.facebook.com/v18.0/${metaConfig.page_id}?fields=fan_count&access_token=${metaConfig.access_token}`;
      const res = await fetch(url);
      const fbJson = await res.json();
      facebookFanCount = fbJson.fan_count || null;
    } catch (e) {
      console.error('[meta-collect] Erro na coleta Facebook:', e);
      facebookFanCount = null;
      limitacoesData.push('[Facebook] Erro na coleta de curtidas: ' + (e instanceof Error ? e.message : String(e)));
    }
    // --- Ads ---
    let adsData: { campaigns: any[]; [key: string]: any } = { campaigns: [] };
    try {
      let nextAdsUrl = `https://graph.facebook.com/v19.0/${metaConfig.ad_account_id}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time&access_token=${metaConfig.access_token}`;
      let allCampaigns: any[] = [];
      while (nextAdsUrl) {
        const resAds = await fetch(nextAdsUrl);
        const adsJson = await resAds.json();
        if (adsJson.data && Array.isArray(adsJson.data)) {
          allCampaigns.push(...adsJson.data);
        }
        nextAdsUrl = adsJson.paging?.next || null;
      }
      adsData.campaigns = allCampaigns;
      // Para cada campanha, buscar insights resumidos
      adsData.campaigns = await Promise.all(adsData.campaigns.map(async (camp) => {
        try {
          const urlInsights = `https://graph.facebook.com/v19.0/${camp.id}/insights?fields=impressions,reach,spend,clicks,cpc,cpm,cpp,ctr,actions,cost_per_action_type&access_token=${metaConfig.access_token}`;
          const resCamp = await fetch(urlInsights);
          const insights = await resCamp.json();
          camp.insights = insights.data?.[0] || {};
        } catch (e) {
          console.error('[meta-collect] Erro ao coletar insights da campanha:', e);
          camp.insights = {};
        }
        return camp;
      }));
    } catch (e) {
      console.error('[meta-collect] Erro na coleta Ads:', e);
      adsData = {
        campaigns: [],
        error: e instanceof Error ? e.message : String(e)
      };
      limitacoesData.push('[Ads] Erro na coleta: ' + (e instanceof Error ? e.message : String(e)));
    }
    // Montar JSON bruto
    const jsonBruto = {
      data_coleta: hoje,
      instagram_profile: instagramProfileData,
      instagram_insights: instagramInsightsData,
      instagram_posts: instagramPostsData,
      instagram_stories: instagramStoriesData,
      instagram_reels: instagramReelsData,
      estimativas: estimativasData,
      limitacoes: limitacoesData,
      facebook: {
        fan_count: facebookFanCount
      },
      ads: adsData
    };
    // Salvar no banco (meta_raw)
    try {
      await supabase.from('meta_raw').insert([
        {
          bar_id,
          data_coleta: hoje,
          tipo: 'instagram_full',
          json_raw: jsonBruto
        }
      ]);
    } catch (e) {
      console.error('[meta-collect] Erro ao salvar em meta_raw:', e);
    }
    // Chamar a API de processamento em produá§á£o (Vercel)
    try {
      const processUrl = 'https://sgbv2.vercel.app/api/meta/process';
      await fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_coleta: jsonBruto.data_coleta
        })
      });
    } catch (e) {
      console.error('[meta-collect] Erro ao chamar API de processamento:', e);
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Coleta e trigger de processamento iniciadas.'
    }), {
      status: 200
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error('[meta-collect] Erro geral:', errorMsg);
    return new Response(JSON.stringify({
      success: false,
      error: errorMsg
    }), {
      status: 500
    });
  }
}); 
