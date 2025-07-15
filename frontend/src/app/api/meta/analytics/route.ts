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
    
    // 3. CAMPANHAS ATIVAS E TOTAIS (CORRIGIDO - dados de hoje)
    const { data: campaigns, error: campaignsError } = await supabase
      .from('meta_campaigns_history')
      .select('*')
      .eq('bar_id', barId)
      .eq('data_coleta', hoje)
      .order('spend', { ascending: false })
    
    // 4. ESTATÍSTICAS DE CAMPANHAS (CORRIGIDAS)
    const campaignStats = campaigns ? {
      total_campaigns: campaigns.length,
      active_campaigns: campaigns.filter(c => c.effective_status === 'ACTIVE').length,
      total_spend: campaigns.reduce((sum, c) => sum + (parseFloat(c.spend || 0)), 0),
      total_impressions: campaigns.reduce((sum, c) => sum + (parseInt(c.impressions || 0)), 0),
      total_reach: campaigns.reduce((sum, c) => sum + (parseInt(c.reach || 0)), 0),
      total_clicks: campaigns.reduce((sum, c) => sum + (parseInt(c.clicks || 0)), 0),
      // CPM médio calculado
      avg_cpm: campaigns.length > 0 ? 
        campaigns.reduce((sum, c) => sum + (parseFloat(c.cpm || 0)), 0) / campaigns.length : 0,
      // Top campanhas com dados disponíveis
      top_campaigns: campaigns.slice(0, 5).map(c => ({
        name: c.campaign_name,
        spend: parseFloat(c.spend || 0),
        impressions: parseInt(c.impressions || 0),
        reach: parseInt(c.reach || 0) || 'N/A',
        clicks: parseInt(c.clicks || 0) || 'N/A',
        ctr: parseFloat(c.ctr || 0) || 'N/A',
        cpc: parseFloat(c.cpc || 0) || 'N/A',
        status: c.effective_status,
        objective: c.objective
      }))
    } : null
    
    // 5. DADOS HISTÓRICOS (ÚLTIMOS 30 DIAS)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: facebookHistory } = await supabase
      .from('facebook_metrics')
      .select('data_referencia, page_fans, post_likes, post_comments, page_reach, page_impressions, created_at')
      .eq('bar_id', barId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
    
    const { data: instagramHistory } = await supabase
      .from('instagram_metrics')
      .select('data_referencia, follower_count, posts_likes, posts_comments, reach, impressions, profile_views, website_clicks, created_at')
      .eq('bar_id', barId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // 6. DADOS CORRIGIDOS DO FACEBOOK (usando campos corretos)
    const facebookCurrent = facebookData ? {
      page_fans: facebookData.page_fans || 0,
      talking_about_count: facebookData.talking_about_count || 0,
      page_reach: facebookData.page_reach || 0,
      page_impressions: facebookData.page_impressions || 0,
      post_likes: facebookData.post_likes || 0,
      post_comments: facebookData.post_comments || 0,
      checkins: facebookData.checkins || 7 // valor fixo conhecido
    } : null

    // 7. DADOS CORRIGIDOS DO INSTAGRAM (usando campos corretos)
    const instagramCurrent = instagramData ? {
      follower_count: instagramData.follower_count || 0,
      following_count: instagramData.following_count || 0,
      posts_likes: instagramData.posts_likes || 0,
      posts_comments: instagramData.posts_comments || 0,
      reach: instagramData.reach || 0,
      impressions: instagramData.impressions || 0,
      profile_views: instagramData.profile_views || 0, // campo correto no banco
      website_clicks: instagramData.website_clicks || 0,
      media_count: instagramData.media_count || 0
    } : null

    return NextResponse.json({
      success: true,
      data: {
        facebook: {
          current: facebookCurrent,
          history: facebookHistory || [],
          error: fbError
        },
        instagram: {
          current: instagramCurrent,
          history: instagramHistory || [],
          error: igError
        },
        campaigns: {
          list: campaigns || [],
          stats: campaignStats,
          error: campaignsError
        },
        last_update: facebookData?.created_at || instagramData?.created_at || null,
        // Métricas consolidadas para Performance Geral
        consolidated: {
          total_reach: (instagramCurrent?.reach || 0) + (facebookCurrent?.page_reach || 0),
          total_impressions: (instagramCurrent?.impressions || 0) + (facebookCurrent?.page_impressions || 0),
          total_engagement: (instagramCurrent?.posts_likes || 0) + (facebookCurrent?.post_likes || 0),
          total_followers: (instagramCurrent?.follower_count || 0) + (facebookCurrent?.page_fans || 0),
          website_clicks: instagramCurrent?.website_clicks || 0
        }
      }
    })
    
  } catch (error: any) {
    console.error('Erro na API de analytics:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 