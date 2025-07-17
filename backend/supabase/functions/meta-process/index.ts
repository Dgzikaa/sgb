// Edge Function: meta-process
// Processa o JSON bruto salvo em meta_raw e popula as tabelas diá¡rias
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json().catch(() => ({}));
    const bar_id = 3;
    const hoje = new Date().toISOString().split('T')[0];
    const data_coleta = body.data_coleta || hoje;
    console.log(`[meta-process] Iniciando processamento para bar_id=${bar_id}, data_coleta=${data_coleta}`);

    // 1. NáƒO limpar tabelas de destino (precisamos manter dados histá³ricos)

    // 2. Buscar JSON bruto de meta_raw
    const { data: metaRaw, error: rawError } = await supabase
      .from('meta_raw')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('data_coleta', data_coleta)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();
    if (rawError || !metaRaw) {
      console.error('[meta-process] meta_raw ná£o encontrado:', rawError);
      return new Response(JSON.stringify({ success: false, error: 'meta_raw ná£o encontrado', details: rawError }), { status: 404 });
    }
    console.log('[meta-process] meta_raw encontrado:', metaRaw.id);

    // 3. Processar e popular tabelas normalizadas
    try {
      const raw = typeof metaRaw.json === 'string' ? JSON.parse(metaRaw.json) : metaRaw.json;
      // Facebook
      if (raw.facebook) {
        const fb = raw.facebook;
        const { error: fbError } = await supabase.from('facebook_daily').insert({
          bar_id,
          data_coleta,
          page_fans: fb.page_info?.fan_count || 0,
          post_likes: fb.posts?.reduce((sum: number, p) => sum + (p.reactions?.summary?.total_count || 0), 0),
          post_comments: fb.posts?.reduce((sum: number, p) => sum + (p.comments?.summary?.total_count || 0), 0),
          post_shares: fb.posts?.reduce((sum: number, p) => sum + (p.shares?.count || 0), 0),
          page_reach: fb.insights?.reach?.data?.reduce((sum: number, i) => sum + (parseInt(i.value) || 0), 0),
          page_impressions: fb.insights?.views?.data?.reduce((sum: number, i) => sum + (parseInt(i.value) || 0), 0),
          post_engagements: fb.insights?.engagement?.data?.reduce((sum: number, i) => sum + (parseInt(i.value) || 0), 0),
          video_views: fb.insights?.views?.data?.reduce((sum: number, i) => sum + (parseInt(i.value) || 0), 0),
          raw_data: fb
        });
        if (fbError) console.error('[meta-process] Erro insert facebook_daily:', fbError);
        else console.log('[meta-process] facebook_daily inserido.');
      }
      // Instagram
      if (raw.instagram) {
        const ig = raw.instagram;
        const { error: igError } = await supabase.from('instagram_daily').insert({
          bar_id,
          data_coleta,
          follower_count: ig.account_info?.followers_count || 0,
          following_count: ig.account_info?.follows_count || 0,
          posts_likes: ig.media?.reduce((sum: number, m) => sum + (m.like_count || 0), 0),
          posts_comments: ig.media?.reduce((sum: number, m) => sum + (m.comments_count || 0), 0),
          posts_shares: ig.media?.reduce((sum: number, m) => sum + (m.shares_count || 0), 0),
          posts_saves: ig.media?.reduce((sum: number, m) => sum + (m.saved_count || 0), 0),
          reach: ig.insights?.reach?.data?.[0]?.values?.reduce((sum: number, v) => sum + (parseInt(v.value) || 0), 0),
          impressions: ig.insights?.reach?.data?.[0]?.values?.reduce((sum: number, v) => sum + (parseInt(v.value) || 0), 0),
          profile_visits: ig.insights?.profile_visits?.data?.[0]?.total_value?.value || 0,
          website_clicks: ig.insights?.website_clicks?.data?.[0]?.total_value?.value || 0,
          media_count: ig.account_info?.media_count || 0,
          raw_data: ig
        });
        if (igError) console.error('[meta-process] Erro insert instagram_daily:', igError);
        else console.log('[meta-process] instagram_daily inserido.');
      }
      // Meta Campaigns
      if (raw.campaigns) {
        for (const camp of raw.campaigns.campaigns || []) {
          const { error: campError } = await supabase.from('meta_campaigns_history').insert({
            bar_id,
            data_coleta,
            campaign_id: camp.id,
            campaign_name: camp.name,
            status: camp.status,
            effective_status: camp.effective_status,
            objective: camp.objective,
            start_time: camp.start_time,
            stop_time: camp.stop_time,
            daily_budget: camp.daily_budget,
            lifetime_budget: camp.lifetime_budget,
            spend: camp.insights?.data?.[0]?.spend || 0,
            impressions: camp.insights?.data?.[0]?.impressions || 0,
            reach: camp.insights?.data?.[0]?.reach || 0,
            clicks: camp.insights?.data?.[0]?.clicks || 0,
            ctr: camp.insights?.data?.[0]?.ctr || 0,
            cpc: camp.insights?.data?.[0]?.cpc || 0,
            cpm: camp.insights?.data?.[0]?.cpm || 0,
            conversions: camp.insights?.data?.[0]?.conversions || 0,
            cost_per_conversion: camp.insights?.data?.[0]?.cost_per_conversion || 0,
            raw_data: camp
          });
          if (campError) console.error('[meta-process] Erro insert meta_campaigns_history:', campError);
        }
        console.log('[meta-process] meta_campaigns_history inserido.');
      }
      // Meta Daily Summary (opcional, pode ser ajustado)
      const { error: sumError } = await supabase.from('meta_daily_summary').insert({
        bar_id,
        data_coleta,
        facebook_fans: raw.facebook?.page_info?.fan_count || 0,
        instagram_followers: raw.instagram?.account_info?.followers_count || 0,
        total_campaigns: raw.campaigns?.campaigns?.length || 0,
        total_ads: raw.campaigns?.ads?.length || 0,
        total_spend: raw.campaigns?.totals?.total_spend || 0,
        total_impressions: raw.campaigns?.totals?.total_impressions || 0,
        total_reach: raw.campaigns?.totals?.total_reach || 0,
        total_clicks: raw.campaigns?.totals?.total_clicks || 0,
        total_conversions: raw.campaigns?.totals?.total_conversions || 0,
        raw_data: raw
      });
      if (sumError) console.error('[meta-process] Erro insert meta_daily_summary:', sumError);
      else console.log('[meta-process] meta_daily_summary inserido.');
    } catch (procError) {
      console.error('[meta-process] Erro no processamento:', procError);
      return new Response(JSON.stringify({ success: false, error: 'Erro no processamento', details: procError }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Processamento concluá­do e tabelas populadas.', meta_raw_id: metaRaw.id }), { status: 200 });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error('[meta-process] Erro geral:', errorMsg);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), { status: 500 });
  }
}) 
