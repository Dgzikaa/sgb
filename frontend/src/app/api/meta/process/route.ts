import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos auxiliares para dados de Facebook, Instagram, campanhas e valores
interface FacebookPost {
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
}

interface InstagramMedia {
  like_count?: number;
  comments_count?: number;
  saved_count?: number;
}

interface ReachValue {
  value: string;
}

interface Campaign {
  id?: string;
  name?: string;
  ad_account_id?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  platform?: string;
  start_time?: string;
  stop_time?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  budget_remaining?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  spend?: number;
  actions_count?: number;
  conversions?: number;
  cost_per_conversion?: number;
  post_engagements?: number;
  page_likes?: number;
  page_follows?: number;
  [key: string]: unknown;
}

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
      console.error('[meta-process] meta_raw nÃ¡Â£o encontrado:', rawError)
      return NextResponse.json({ success: false, error: 'meta_raw nÃ¡Â£o encontrado', details: rawError }, { status: 404 })
    }
    let rawJson: unknown;
    try {
      rawJson = typeof metaRaw.json_raw === 'string' ? JSON.parse(metaRaw.json_raw) as unknown : metaRaw.json_raw
    } catch (e: unknown) {
      console.error('[meta-process] Erro ao parsear json_raw:', e)
      return NextResponse.json({ success: false, error: 'Erro ao parsear json_raw', details: e }, { status: 500 })
    }

    // Processar e popular tabelas normalizadas
    try {
      const logs: Array<{ table: string; insertData?: Record<string, unknown>; error?: unknown; info?: string }> = [];
      // Facebook
      if (rawJson.facebook) {
        const fb = rawJson.facebook as {
          page_info?: {
            fan_count?: number;
            talking_about_count?: number;
            engaged_users?: number;
            page_views?: number;
            page_impressions?: number;
            checkins?: number;
            overall_star_rating?: number;
            rating_count?: number;
          };
          posts?: FacebookPost[];
        };
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
          total_likes: fb.posts?.reduce((sum: number, p: FacebookPost) => sum + (p.reactions?.summary?.total_count || 0), 0),
          total_comments: fb.posts?.reduce((sum: number, p: FacebookPost) => sum + (p.comments?.summary?.total_count || 0), 0),
          total_shares: fb.posts?.reduce((sum: number, p: FacebookPost) => sum + (p.shares?.count || 0), 0),
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
        const ig = rawJson.instagram as {
          account_info?: {
            followers_count?: number;
            follows_count?: number;
            media_count?: number;
          };
          media?: InstagramMedia[];
          insights?: {
            engagement?: number;
            reach?: { data?: Array<{ values?: ReachValue[] }> };
          };
        };
        const insertData = {
          bar_id,
          data_coleta,
          followers_count: ig.account_info?.followers_count || 0,
          follows_count: ig.account_info?.follows_count || 0,
          media_count: ig.account_info?.media_count || 0,
          total_posts: ig.media?.length || 0,
          total_likes: ig.media?.reduce((sum: number, m: InstagramMedia) => sum + (m.like_count || 0), 0),
          total_comments: ig.media?.reduce((sum: number, m: InstagramMedia) => sum + (m.comments_count || 0), 0),
          engagement: ig.insights?.engagement || 0,
          impressions: ig.insights?.reach?.data?.[0]?.values?.reduce((sum: number, v: ReachValue) => sum + (parseInt(v.value) || 0), 0),
          reach: ig.insights?.reach?.data?.[0]?.values?.reduce((sum: number, v: ReachValue) => sum + (parseInt(v.value) || 0), 0),
          saves: ig.media?.reduce((sum: number, m: InstagramMedia) => sum + (m.saved_count || 0), 0),
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
        for (const camp of (rawJson.campaigns.campaigns || []) as Campaign[]) {
          const insertData = {
            bar_id,
            data_coleta,
            criado_em: new Date(),
            campaign_id: camp.id as string,
            campaign_name: camp.name as string,
            ad_account_id: camp.ad_account_id as string,
            status: camp.status as string,
            effective_status: camp.effective_status as string,
            objective: camp.objective as string,
            platform: camp.platform as string,
            start_time: camp.start_time as string,
            stop_time: camp.stop_time as string,
            daily_budget: camp.daily_budget as number,
            lifetime_budget: camp.lifetime_budget as number,
            budget_remaining: camp.budget_remaining as number,
            impressions: camp.impressions as number,
            reach: camp.reach as number,
            clicks: camp.clicks as number,
            ctr: camp.ctr as number,
            cpc: camp.cpc as number,
            spend: camp.spend as number,
            actions_count: camp.actions_count as number,
            conversions: camp.conversions as number,
            cost_per_conversion: camp.cost_per_conversion as number,
            post_engagements: camp.post_engagements as number,
            page_likes: camp.page_likes as number,
            page_follows: camp.page_follows as number,
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
      return NextResponse.json({ success: true, message: 'Processamento concluÃ¡Â­do e tabelas populadas.', meta_raw_id: metaRaw.id, logs }, { status: 200 })
    } catch (procError) {
      console.error('[meta-process] Erro no processamento:', procError)
      const errorMsg = (procError && typeof procError === 'object' && 'message' in procError) ? (procError as unknown).message : JSON.stringify(procError)
      return NextResponse.json({ success: false, error: 'Erro no processamento', details: errorMsg }, { status: 500 })
    }

  } catch (e) {
    const errorMsg = (typeof e === 'object' && e !== null && 'message' in e) ? (e as { message: string }).message : String(e);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
} 

