import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📢 Buscando campanhas publicitárias Meta...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (configError || !config) {
      console.log('⚠️ Configuração Meta não encontrada, retornando dados básicos')
      return NextResponse.json({
        success: true,
        campaigns: {
          active_campaigns: 0,
          campaign_reach: 0,
          campaign_clicks: 0,
          cost_per_click: 0,
          conversion_rate: 0,
          roi: 0
        },
        message: 'Nenhuma configuração Meta encontrada'
      })
    }

    // Por enquanto, retornar dados estimados baseados no desempenho orgânico
    // Futuramente pode integrar com Meta Ads API
    
    // Buscar dados de engajamento para estimar ROI
    const { data: consolidatedData } = await supabase
      .from('social_metrics_consolidated')
      .select('*')
      .eq('bar_id', 3)
      .order('data_referencia', { ascending: false })
      .limit(1)

    const engagement = consolidatedData?.[0]?.total_engagement || 0
    const followers = consolidatedData?.[0]?.total_followers || 0
    const performanceScore = consolidatedData?.[0]?.performance_score || 0

    // Calcular estimativas baseadas no engajamento orgânico
    const estimatedCampaignData = {
      active_campaigns: followers > 30000 ? 2 : followers > 10000 ? 1 : 0,
      campaign_reach: Math.round(followers * 0.1), // 10% do total de seguidores
      campaign_clicks: Math.round(engagement * 0.05), // 5% do engajamento orgânico
      cost_per_click: followers > 30000 ? 0.45 : followers > 10000 ? 0.65 : 1.20, // CPC estimado
      conversion_rate: performanceScore > 50 ? 3.2 : performanceScore > 20 ? 2.1 : 1.5, // % conversão
      roi: performanceScore > 50 ? 420 : performanceScore > 20 ? 280 : 150 // % ROI
    }

    console.log('📊 Dados de campanha estimados:', estimatedCampaignData)

    return NextResponse.json({
      success: true,
      campaigns: estimatedCampaignData,
      metadata: {
        data_type: 'estimated_from_organic',
        based_on: 'engagement_metrics',
        followers_count: followers,
        performance_score: performanceScore,
        note: 'Dados estimados baseados no desempenho orgânico. Para dados reais de campanhas pagas, conecte a Meta Ads API.'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar campanhas:', error)
    return NextResponse.json({ 
      success: false,
      campaigns: {
        active_campaigns: 0,
        campaign_reach: 0,
        campaign_clicks: 0,
        cost_per_click: 0,
        conversion_rate: 0,
        roi: 0
      },
      error: 'Erro ao buscar dados de campanhas',
      details: error.message
    }, { status: 500 })
  }
} 