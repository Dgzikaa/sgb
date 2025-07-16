import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    const days = parseInt(searchParams.get('days') || '7')

    // Buscar dados de meta_daily_summary
    const hoje = new Date()
    const inicioPeriodo = new Date(hoje.getTime() - days * 24 * 60 * 60 * 1000)
    const { data: dailySummary, error: summaryError } = await supabase
      .from('meta_daily_summary')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: false })

    if (summaryError) {
      return NextResponse.json({ success: false, error: summaryError }, { status: 500 })
    }

    if (!dailySummary || dailySummary.length === 0) {
      return NextResponse.json({ success: false, message: 'Nenhum dado encontrado em meta_daily_summary.' }, { status: 404 })
    }

    // Inserir em instagram_daily
    const instagramRows = dailySummary.map(day => ({
      bar_id: barId,
      data_coleta: day.data_referencia,
      followers_count: day.instagram_followers ?? null,
      follows_count: day.instagram_following ?? null,
      media_count: day.instagram_posts_count ?? null,
      username: null,
      name: null,
      biography: null,
      website: null,
      profile_picture_url: null,
      raw_json: day,
    }))

    const { data: igInserted, error: igError } = await supabase
      .from('instagram_daily')
      .insert(instagramRows)
      .select()

    // Inserir em ads_daily (1 registro por campanha por dia)
    let adsRows = []
    for (const day of dailySummary) {
      if (Array.isArray(day.campaigns)) {
        for (const camp of day.campaigns) {
          adsRows.push({
            bar_id: barId,
            data_coleta: day.data_referencia,
            campaign_id: camp.campaign_id ?? null,
            campaign_name: camp.campaign_name ?? null,
            status: camp.status ?? null,
            effective_status: camp.effective_status ?? null,
            objective: camp.objective ?? null,
            start_time: camp.start_time ? new Date(camp.start_time) : null,
            stop_time: camp.stop_time ? new Date(camp.stop_time) : null,
            daily_budget: camp.daily_budget ? parseFloat(camp.daily_budget) : null,
            lifetime_budget: camp.lifetime_budget ? parseFloat(camp.lifetime_budget) : null,
            raw_json: camp
          })
        }
      }
    }

    let adsInserted = null, adsError = null
    if (adsRows.length > 0) {
      const res = await supabase
        .from('ads_daily')
        .insert(adsRows)
        .select()
      adsInserted = res.data
      adsError = res.error
    }

    return NextResponse.json({
      success: true,
      instagram_inserted: igInserted?.length || 0,
      ads_inserted: adsInserted?.length || 0,
      instagram_error: igError,
      ads_error: adsError
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 