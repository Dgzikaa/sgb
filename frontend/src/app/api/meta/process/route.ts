import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bar_id = body.bar_id || 3
    const data_coleta = body.data_coleta || new Date().toISOString().split('T')[0]

    // Buscar JSON bruto de meta_raw
    const { data: metaRaw, error: rawError } = await supabase
      .from('meta_raw')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('data_coleta', data_coleta)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single()
    if (rawError || !metaRaw) {
      console.error('[meta-process] meta_raw não encontrado:', rawError)
      return NextResponse.json({ success: false, error: 'meta_raw não encontrado', details: rawError }, { status: 404 })
    }
    let rawJson: any
    try {
      rawJson = typeof metaRaw.json_raw === 'string' ? JSON.parse(metaRaw.json_raw) : metaRaw.json_raw
    } catch (e) {
      console.error('[meta-process] Erro ao parsear json_raw:', e)
      return NextResponse.json({ success: false, error: 'Erro ao parsear json_raw', details: e }, { status: 500 })
    }

    // Processar e popular tabelas normalizadas
    try {
      const logs: any[] = []
      // Facebook
      if (rawJson.facebook) {
        const fb = rawJson.facebook
        const insertData = {
          bar_id,
          data_coleta,
          fan_count: fb.page_info?.fan_count || 0,
          talking_about_count: fb.page_info?.talking_about_count || 0,
          engaged_users: fb.page_info?.engaged_users || 0,
          page_views: fb.page_info?.page_views || 0,
          page_impressions: fb.page_info?.page_impressions || 0,
          checkins: fb.page_info?.checkins || 0,
          overall_star_rating: fb.page_info?.overall_star_rating || 0,
          rating_count: fb.page_info?.rating_count || 0,
          total_posts: fb.posts?.length || 0,
          total_likes: fb.posts?.reduce((sum: number, p: any) => sum + (p.reactions?.summary?.total_count || 0), 0),
          total_comments: fb.posts?.reduce((sum: number, p: any) => sum + (p.comments?.summary?.total_count || 0), 0),
          total_shares: fb.posts?.reduce((sum: number, p: any) => sum + (p.shares?.count || 0), 0),
          raw_json: fb
        }
        logs.push({ table: 'facebook_daily', insertData })
        const { error: fbError } = await supabase.from('facebook_daily').insert(insertData)
        if (fbError) logs.push({ table: 'facebook_daily', error: fbError })
      } else {
        logs.push({ table: 'facebook_daily', info: 'rawJson.facebook ausente' })
      }
      // Instagram
      if (rawJson.instagram) {
        const ig = rawJson.instagram
        const insertData = {
          bar_id,
          data_coleta,
          followers_count: ig.account_info?.followers_count || 0,
          follows_count: ig.account_info?.follows_count || 0,
          media_count: ig.account_info?.media_count || 0,
          total_posts: ig.media?.length || 0,
          total_likes: ig.media?.reduce((sum: number, m: any) => sum + (m.like_count || 0), 0),
          total_comments: ig.media?.reduce((sum: number, m: any) => sum + (m.comments_count || 0), 0),
          engagement: ig.insights?.engagement || 0,
          impressions: ig.insights?.reach?.data?.[0]?.values?.reduce((sum: number, v: any) => sum + (parseInt(v.value) || 0), 0),
          reach: ig.insights?.reach?.data?.[0]?.values?.reduce((sum: number, v: any) => sum + (parseInt(v.value) || 0), 0),
          saves: ig.media?.reduce((sum: number, m: any) => sum + (m.saved_count || 0), 0),
          raw_json: ig
        }
        logs.push({ table: 'instagram_daily', insertData })
        const { error: igError } = await supabase.from('instagram_daily').insert(insertData)
        if (igError) logs.push({ table: 'instagram_daily', error: igError })
      } else {
        logs.push({ table: 'instagram_daily', info: 'rawJson.instagram ausente' })
      }
      // Meta Campaigns
      if (rawJson.campaigns) {
        for (const camp of rawJson.campaigns.campaigns || []) {
          const insertData = {
            bar_id,
            data_coleta,
            criado_em: new Date(),
            campaign_id: camp.id,
            campaign_name: camp.name,
            ad_account_id: camp.ad_account_id,
            status: camp.status,
            effective_status: camp.effective_status,
            objective: camp.objective,
            platform: camp.platform,
            start_time: camp.start_time,
            stop_time: camp.stop_time,
            daily_budget: camp.daily_budget,
            lifetime_budget: camp.lifetime_budget,
            budget_remaining: camp.budget_remaining,
            impressions: camp.impressions,
            reach: camp.reach,
            clicks: camp.clicks,
            ctr: camp.ctr,
            cpc: camp.cpc,
            spend: camp.spend,
            actions_count: camp.actions_count,
            conversions: camp.conversions,
            cost_per_conversion: camp.cost_per_conversion,
            post_engagements: camp.post_engagements,
            page_likes: camp.page_likes,
            page_follows: camp.page_follows,
            raw_data: camp
          }
          logs.push({ table: 'meta_campaigns_history', insertData })
          const { error: campError } = await supabase.from('meta_campaigns_history').insert(insertData)
          if (campError) logs.push({ table: 'meta_campaigns_history', error: campError })
        }
      } else {
        logs.push({ table: 'meta_campaigns_history', info: 'rawJson.campaigns ausente' })
      }
      // Meta Daily Summary
      const insertSummary = {
        bar_id,
        data_coleta,
        data_referencia: data_coleta,
        coletado_em: new Date(),
        atualizado_em: new Date(),
        facebook_fans: rawJson.facebook?.page_info?.fan_count || 0,
        instagram_followers: rawJson.instagram?.account_info?.followers_count || 0,
        total_campaigns: rawJson.campaigns?.campaigns?.length || 0,
        total_ads: rawJson.campaigns?.ads?.length || 0,
        total_spend: rawJson.campaigns?.totals?.total_spend || 0,
        total_impressions: rawJson.campaigns?.totals?.total_impressions || 0,
        total_clicks: rawJson.campaigns?.totals?.total_clicks || 0,
        total_conversions: rawJson.campaigns?.totals?.total_conversions || 0,
        raw_data: rawJson
      }
      logs.push({ table: 'meta_daily_summary', insertData: insertSummary })
      const { error: sumError } = await supabase.from('meta_daily_summary').insert(insertSummary)
      if (sumError) logs.push({ table: 'meta_daily_summary', error: sumError })
      // Resposta final com logs detalhados
      return NextResponse.json({ success: true, message: 'Processamento concluído e tabelas populadas.', meta_raw_id: metaRaw.id, logs }, { status: 200 })
    } catch (procError) {
      console.error('[meta-process] Erro no processamento:', procError)
      const errorMsg = (procError && typeof procError === 'object' && 'message' in procError) ? (procError as any).message : JSON.stringify(procError)
      return NextResponse.json({ success: false, error: 'Erro no processamento', details: errorMsg }, { status: 500 })
    }

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 })
  }
} 