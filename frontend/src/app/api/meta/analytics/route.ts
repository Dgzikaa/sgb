import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const barId = 3
    const hoje = new Date().toISOString().split('T')[0]
    
    // 1. DADOS FACEBOOK MAIS RECENTES
    const { data: facebookData, error: fbError } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // 2. DADOS INSTAGRAM MAIS RECENTES
    const { data: instagramData, error: igError } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // 3. CAMPANHAS ATIVAS E TOTAIS
    const { data: campaigns, error: campaignsError } = await supabase
      .from('meta_campaigns_history')
      .select('*')
      .eq('bar_id', barId)
      .eq('data_coleta', hoje)
      .order('spend', { ascending: false })
    
    // 4. ESTATÍSTICAS DE CAMPANHAS
    const campaignStats = campaigns ? {
      total_campaigns: campaigns.length,
      active_campaigns: campaigns.filter(c => c.effective_status === 'ACTIVE').length,
      total_spend: campaigns.reduce((sum, c) => sum + (parseFloat(c.spend || 0)), 0),
      total_impressions: campaigns.reduce((sum, c) => sum + (parseInt(c.impressions || 0)), 0),
      total_reach: campaigns.reduce((sum, c) => sum + (parseInt(c.reach || 0)), 0),
      total_clicks: campaigns.reduce((sum, c) => sum + (parseInt(c.clicks || 0)), 0),
      top_campaigns: campaigns.slice(0, 5).map(c => ({
        name: c.campaign_name,
        spend: parseFloat(c.spend || 0),
        impressions: parseInt(c.impressions || 0),
        reach: parseInt(c.reach || 0),
        clicks: parseInt(c.clicks || 0),
        ctr: parseFloat(c.ctr || 0),
        cpc: parseFloat(c.cpc || 0),
        status: c.effective_status
      }))
    } : null
    
    // 5. DADOS HISTÓRICOS (ÚLTIMOS 30 DIAS)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: facebookHistory } = await supabase
      .from('facebook_metrics')
      .select('data_referencia, page_fans, post_likes, post_comments, page_reach, page_impressions')
      .eq('bar_id', barId)
      .gte('data_referencia', thirtyDaysAgo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: true })
    
    const { data: instagramHistory } = await supabase
      .from('instagram_metrics')
      .select('data_referencia, follower_count, posts_likes, posts_comments, reach, impressions, profile_views')
      .eq('bar_id', barId)
      .gte('data_referencia', thirtyDaysAgo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: true })
    
    return NextResponse.json({
      success: true,
      data: {
        facebook: {
          current: facebookData,
          history: facebookHistory || [],
          error: fbError
        },
        instagram: {
          current: instagramData,
          history: instagramHistory || [],
          error: igError
        },
        campaigns: {
          list: campaigns || [],
          stats: campaignStats,
          error: campaignsError
        },
        last_update: facebookData?.created_at || instagramData?.created_at || null
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar dados analytics:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 