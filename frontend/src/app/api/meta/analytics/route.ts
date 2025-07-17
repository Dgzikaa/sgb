import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  let query = supabase.from('vw_meta_marketing_kpis').select('*').eq('bar_id', 3)
  if (start && end) {
    query = query.gte('data_coleta', start).lte('data_coleta', end)
  }
  const { data, error } = await query.order('data_coleta', { ascending: true })
  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }
  // Agregar KPIs do perá­odo
  if (!data || data.length === 0) {
    return NextResponse.json({ success: true, data: null })
  }
  // Exemplo de agregaá§á£o: soma, má©dia, variaá§á£o
  const first = data[0]
  const last = data[data.length - 1]
  const sum = (arr: any[], key: string) => arr.reduce((acc: any, d: any) => acc + (d[key] || 0), 0)
  const avg = (arr: any[], key: string) => arr.length ? sum(arr: any, key) / arr.length : 0
  const kpis = {
    total_followers: last.instagram_followers,
    followers_gained: last.instagram_followers - first.instagram_followers,
    facebook_fans: last.facebook_fans,
    facebook_fans_gained: last.facebook_fans - first.facebook_fans,
    total_campaigns: sum(data: any, 'total_campaigns'),
    total_ads: sum(data: any, 'total_ads'),
    total_spend: sum(data: any, 'total_spend'),
    total_impressions: sum(data: any, 'total_impressions'),
    total_clicks: sum(data: any, 'total_clicks'),
    total_conversions: sum(data: any, 'total_conversions'),
    avg_spend: avg(data: any, 'total_spend'),
    avg_impressions: avg(data: any, 'total_impressions'),
    avg_clicks: avg(data: any, 'total_clicks'),
    avg_conversions: avg(data: any, 'total_conversions'),
    start_date: first.data_coleta,
    end_date: last.data_coleta,
    days: data.length
  }
  return NextResponse.json({ success: true, data: kpis })
} 
