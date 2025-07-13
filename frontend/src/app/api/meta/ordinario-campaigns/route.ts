import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Buscando campanhas ESPECÍFICAS do Ordinário...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada' 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    
    // CONTA ESPECÍFICA DO ORDINÁRIO que vimos no Ads Manager
    const ordinarioAdAccountId = 'act_1153081576486761'

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      ad_account: ordinarioAdAccountId,
      campaigns: [],
      insights: {},
      summary: {}
    } as any

    console.log(`🎯 Buscando campanhas da conta específica: ${ordinarioAdAccountId}`)

    // 1. BUSCAR CAMPANHAS DA CONTA ORDINÁRIO
    const campaignsUrl = `https://graph.facebook.com/v18.0/${ordinarioAdAccountId}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`
    
    console.log('📊 URL das campanhas:', campaignsUrl)
    
    const campaignsResponse = await fetch(campaignsUrl)
    const campaignsData = await campaignsResponse.json()

    if (!campaignsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar campanhas do Ordinário',
        details: campaignsData,
        debug: {
          account_id: ordinarioAdAccountId,
          response_status: campaignsResponse.status,
          url_used: campaignsUrl
        }
      }, { status: 400 })
    }

    results.campaigns = campaignsData.data || []
    console.log(`✅ Encontradas ${results.campaigns.length} campanhas do Ordinário`)

    // 2. BUSCAR INSIGHTS DAS CAMPANHAS (últimos 30 dias)
    if (results.campaigns.length > 0) {
      console.log('📈 Buscando insights das campanhas...')
      
      const insightsUrl = `https://graph.facebook.com/v18.0/${ordinarioAdAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,reach,spend,ctr,cpc,cpm,actions,cost_per_action_type,frequency&date_preset=last_30d&level=campaign&access_token=${accessToken}`
      
      const insightsResponse = await fetch(insightsUrl)
      const insightsData = await insightsResponse.json()

      if (insightsResponse.ok) {
        results.insights = {
          data: insightsData.data || [],
          total_records: insightsData.data?.length || 0
        }
        console.log(`📊 Insights coletados: ${results.insights.total_records} campanhas com dados`)
      } else {
        results.insights = {
          error: insightsData,
          note: 'Erro ao buscar insights - pode ser problema de permissões'
        }
      }
    }

    // 3. CALCULAR RESUMO
    const activeCampaigns = results.campaigns.filter((c: any) => c.effective_status === 'ACTIVE')
    const pausedCampaigns = results.campaigns.filter((c: any) => c.effective_status === 'PAUSED')
    
    // Calcular totais dos insights
    let totalSpend = 0
    let totalImpressions = 0
    let totalClicks = 0
    let totalReach = 0

    if (results.insights.data) {
      for (const insight of results.insights.data) {
        totalSpend += parseFloat(insight.spend || 0)
        totalImpressions += parseInt(insight.impressions || 0)
        totalClicks += parseInt(insight.clicks || 0)
        totalReach += parseInt(insight.reach || 0)
      }
    }

    results.summary = {
      total_campaigns: results.campaigns.length,
      active_campaigns: activeCampaigns.length,
      paused_campaigns: pausedCampaigns.length,
      total_spend_30d: totalSpend,
      total_impressions_30d: totalImpressions,
      total_clicks_30d: totalClicks,
      total_reach_30d: totalReach,
      avg_ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
      avg_cpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : 0,
      cost_per_thousand_impressions: totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : 0
    }

    console.log('📋 Resumo das campanhas Ordinário:', results.summary)

    // 4. CAMPANHAS DESTACADAS
    if (results.campaigns.length > 0) {
      results.highlighted_campaigns = {
        most_recent: results.campaigns.sort((a: any, b: any) => 
          new Date(b.created_time).getTime() - new Date(a.created_time).getTime())[0],
        highest_budget: results.campaigns
          .filter((c: any) => c.daily_budget || c.lifetime_budget)
          .sort((a: any, b: any) => 
            (parseFloat(b.daily_budget || b.lifetime_budget || 0)) - 
            (parseFloat(a.daily_budget || a.lifetime_budget || 0)))[0]
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao buscar campanhas do Ordinário:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao buscar campanhas do Ordinário',
      details: error.message 
    }, { status: 500 })
  }
} 