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
  const q = searchParams.get('q')
  const sort = searchParams.get('sort') || 'data_coleta'
  const order = searchParams.get('order') || 'desc'
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  let query = supabase.from('vw_meta_campaigns_dashboard').select('*').eq('bar_id', 3)
  if (start && end) {
    query = query.gte('data_coleta', start).lte('data_coleta', end)
  }
  if (q) {
    query = query.ilike('campaign_name', `%${q}%`)
  }
  query = query.order(sort, { ascending: order === 'asc' })
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }
  return NextResponse.json({ success: true, data, count: data?.length })
} 
