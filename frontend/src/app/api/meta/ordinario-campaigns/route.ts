import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos auxiliares para campanhas e insights
interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  start_time: string;
  stop_time: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
  [key: string]: unknown;
}

interface Insight {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  clicks: string;
  reach: string;
  spend: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<Record<string, unknown>>;
  cost_per_action_type?: Array<Record<string, unknown>>;
  frequency?: string;
  [key: string]: unknown;
}

// Substituir o uso de Record<string, unknown> por um tipo explÃ­cito para 'results'
interface Results {
  success: boolean;
  timestamp: string;
  ad_account: string;
  campaigns: Campaign[];
  insights: { data?: Insight[]; total_records?: number; error?: unknown; note?: string };
  summary: Record<string, unknown>;
  highlighted_campaigns?: {
    most_recent?: Campaign;
    highest_budget?: Campaign;
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸Å½Â¯ Buscando campanhas ESPECÃ¡ÂFICAS do OrdinÃ¡Â¡rio...')

    // Buscar configuraÃ¡Â§Ã¡Â£o da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'ConfiguraÃ¡Â§Ã¡Â£o Meta nÃ¡Â£o encontrada' 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    
    // CONTA ESPECÃ¡ÂFICA DO ORDINÃ¡ÂRIO que vimos no Ads Manager
    const ordinarioAdAccountId = 'act_1153081576486761'

    // Substituir 'as Record<string, unknown>' por 'as Results'
    const results: Results = {
      success: true,
      timestamp: new Date().toISOString(),
      ad_account: ordinarioAdAccountId,
      campaigns: [],
      insights: {},
      summary: {}
    };

    console.log(`Ã°Å¸Å½Â¯ Buscando campanhas da conta especÃ¡Â­fica: ${ordinarioAdAccountId}`)

    // 1. BUSCAR CAMPANHAS DA CONTA ORDINÃ¡ÂRIO
    const campaignsUrl = `https://graph.facebook.com/v18.0/${ordinarioAdAccountId}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`
    
    console.log('Ã°Å¸â€œÅ  URL das campanhas:', campaignsUrl)
    
    const campaignsResponse = await fetch(campaignsUrl)
    const campaignsData = await campaignsResponse.json()

    if (!campaignsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar campanhas do OrdinÃ¡Â¡rio',
        details: campaignsData,
        debug: {
          account_id: ordinarioAdAccountId,
          response_status: campaignsResponse.status,
          url_used: campaignsUrl
        }
      }, { status: 400 })
    }

    results.campaigns = campaignsData.data || []
    console.log(`Å“â€¦ Encontradas ${results.campaigns.length} campanhas do OrdinÃ¡Â¡rio`)

    // 2. BUSCAR INSIGHTS DAS CAMPANHAS (Ã¡Âºltimos 30 dias)
    if (results.campaigns.length > 0) {
      console.log('Ã°Å¸â€œË† Buscando insights das campanhas...')
      
      const insightsUrl = `https://graph.facebook.com/v18.0/${ordinarioAdAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,reach,spend,ctr,cpc,cpm,actions,cost_per_action_type,frequency&date_preset=last_30d&level=campaign&access_token=${accessToken}`
      
      const insightsResponse = await fetch(insightsUrl)
      const insightsData = await insightsResponse.json()

      if (insightsResponse.ok) {
        results.insights = {
          data: insightsData.data || [],
          total_records: insightsData.data?.length || 0
        }
        console.log(`Ã°Å¸â€œÅ  Insights coletados: ${results.insights.total_records} campanhas com dados`)
      } else {
        results.insights = {
          error: insightsData,
          note: 'Erro ao buscar insights - pode ser problema de permissÃ¡Âµes'
        }
      }
    }

    // 3. CALCULAR RESUMO
    // Tipar corretamente os mÃ©todos de array
    const activeCampaigns = results.campaigns.filter((c: Campaign) => (c ).effective_status === 'ACTIVE')
    const pausedCampaigns = results.campaigns.filter((c: Campaign) => (c ).effective_status === 'PAUSED')
    
    // Calcular totais dos insights
    let totalSpend = 0
    let totalImpressions = 0
    let totalClicks = 0
    let totalReach = 0

    if (results.insights.data) {
      for (const insight of results.insights.data ) {
        totalSpend += parseFloat(String(insight.spend ?? '0'));
        totalImpressions += parseInt(String(insight.impressions ?? '0'));
        totalClicks += parseInt(String(insight.clicks ?? '0'));
        totalReach += parseInt(String(insight.reach ?? '0'));
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

    console.log('Ã°Å¸â€œâ€¹ Resumo das campanhas OrdinÃ¡Â¡rio:', results.summary)

    // 4. CAMPANHAS DESTACADAS
    if (results.campaigns.length > 0) {
      results.highlighted_campaigns = {
        most_recent: results.campaigns.sort((a: Campaign, b: Campaign) => 
          new Date((a ).created_time).getTime() - new Date((b ).created_time).getTime())[0],
        highest_budget: results.campaigns
          .filter((c: Campaign) => (c ).daily_budget || (c ).lifetime_budget)
          .sort((a: Campaign, b: Campaign) => 
            (parseFloat(String((b ).daily_budget ?? (b ).lifetime_budget ?? '0'))) - 
            (parseFloat(String((a ).daily_budget ?? (a ).lifetime_budget ?? '0'))))[0]
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('ÂÅ’ Erro ao buscar campanhas do OrdinÃ¡Â¡rio:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao buscar campanhas do OrdinÃ¡Â¡rio',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 

