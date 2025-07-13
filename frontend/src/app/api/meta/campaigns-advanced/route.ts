import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📢 Análise AVANÇADA de campanhas publicitárias Meta...')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`👤 Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('⚠️ Erro ao parsear dados do usuário, usando bar_id padrão')
      }
    }

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'meta')
      .eq('ativo', true)
      .single()

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        error: 'Configuração Meta não encontrada',
        campaigns: []
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const ordinarioAccountId = 'act_1153081576486761' // ID correto do Ordinário

    try {
      console.log(`🎯 Análise avançada da conta específica: ${ordinarioAccountId}`)
      
      // Buscar campanhas da conta do Ordinário
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${ordinarioAccountId}/campaigns?fields=id,name,status,objective,buying_type,created_time,updated_time,start_time,stop_time,daily_budget,lifetime_budget&limit=100&access_token=${accessToken}`
      )
      const campaignsData = await campaignsResponse.json()

      if (!campaignsResponse.ok) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsData.error?.message}`)
      }

      const campaigns = campaignsData.data || []
      const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE')
      const allCampaignsCount = campaigns.length
      const activeCampaignsCount = activeCampaigns.length
      
      console.log(`✅ Encontradas ${allCampaignsCount} campanhas do Ordinário (${activeCampaignsCount} ativas)`)

      const allCampaigns = []
      const campaignMetrics = []

      // Ordenar campanhas: ativas primeiro, depois por data de atualização
      const sortedCampaigns = campaigns.sort((a: any, b: any) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1
        return new Date(b.updated_time).getTime() - new Date(a.updated_time).getTime()
      })

      // Para cada campanha, buscar insights
      for (const campaign of sortedCampaigns) { // TODAS as campanhas, ordenadas
        try {
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,reach,clicks,ctr,cpc,cpp,cpm,spend,actions,cost_per_action_type&date_preset=last_30d&access_token=${accessToken}`
          )
          const insightsData = await insightsResponse.json()

          if (insightsResponse.ok && insightsData.data && insightsData.data.length > 0) {
            const insights = insightsData.data[0]
            
            // Calcular métricas avançadas
            const impressions = parseInt(insights.impressions) || 0
            const reach = parseInt(insights.reach) || 0
            const clicks = parseInt(insights.clicks) || 0
            const spend = parseFloat(insights.spend) || 0
            const ctr = parseFloat(insights.ctr) || 0
            const cpc = parseFloat(insights.cpc) || 0
            const cpm = parseFloat(insights.cpm) || 0

            // Extrair conversões dos actions
            let conversions = 0
            let leads = 0
            let purchases = 0

            if (insights.actions) {
              insights.actions.forEach((action: any) => {
                if (action.action_type === 'lead') leads += parseInt(action.value) || 0
                if (action.action_type === 'purchase') purchases += parseInt(action.value) || 0
                if (action.action_type.includes('conversion')) conversions += parseInt(action.value) || 0
              })
            }

            const campaignData = {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              account_name: 'Ordinário - CA',
              account_id: ordinarioAccountId,
              created_time: campaign.created_time,
              daily_budget: campaign.daily_budget,
              lifetime_budget: campaign.lifetime_budget,
              metrics: {
                impressions,
                reach,
                clicks,
                spend,
                ctr,
                cpc,
                cpm,
                conversions: parseInt(conversions.toString()),
                leads: parseInt(leads.toString()),
                purchases: parseInt(purchases.toString()),
                frequency: reach > 0 ? impressions / reach : 0,
                roi: purchases > 0 ? ((purchases * 25) - spend) / spend * 100 : 0, // Assumindo R$25 por conversão
                cost_per_conversion: conversions > 0 ? spend / conversions : 0,
                engagement_rate: clicks > 0 ? (clicks / impressions) * 100 : 0
              }
            }

            allCampaigns.push(campaignData)
            campaignMetrics.push(campaignData.metrics)
          }
        } catch (campaignError) {
          console.warn(`⚠️ Erro ao buscar insights da campanha ${campaign.name}:`, campaignError)
        }
      }

      // Calcular métricas consolidadas
      const totalMetrics = campaignMetrics.reduce((acc, metric) => ({
        total_impressions: acc.total_impressions + metric.impressions,
        total_reach: acc.total_reach + metric.reach,
        total_clicks: acc.total_clicks + metric.clicks,
        total_spend: acc.total_spend + metric.spend,
        total_conversions: acc.total_conversions + metric.conversions,
        total_leads: acc.total_leads + metric.leads,
        total_purchases: acc.total_purchases + metric.purchases
      }), {
        total_impressions: 0,
        total_reach: 0,
        total_clicks: 0,
        total_spend: 0,
        total_conversions: 0,
        total_leads: 0,
        total_purchases: 0
      })

      // Análise de performance
      const performanceAnalysis = {
        best_performing_campaign: allCampaigns.length > 0 ? allCampaigns.reduce((best, current) => 
          current.metrics.roi > (best?.metrics?.roi || 0) ? current : best) : null,
        worst_performing_campaign: allCampaigns.length > 0 ? allCampaigns.reduce((worst, current) => 
          current.metrics.roi < (worst?.metrics?.roi || Infinity) ? current : worst) : null,
        average_metrics: {
          avg_ctr: campaignMetrics.length > 0 ? campaignMetrics.reduce((sum, m) => sum + m.ctr, 0) / campaignMetrics.length : 0,
          avg_cpc: campaignMetrics.length > 0 ? campaignMetrics.reduce((sum, m) => sum + m.cpc, 0) / campaignMetrics.length : 0,
          avg_cpm: campaignMetrics.length > 0 ? campaignMetrics.reduce((sum, m) => sum + m.cpm, 0) / campaignMetrics.length : 0,
          avg_roi: campaignMetrics.length > 0 ? campaignMetrics.reduce((sum, m) => sum + m.roi, 0) / campaignMetrics.length : 0
        }
      }

      // Recomendações baseadas em IA
      const recommendations = []
      
      if (performanceAnalysis.average_metrics.avg_ctr < 1.0) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          title: 'Baixa Taxa de Cliques',
          description: 'CTR abaixo de 1%. Considere melhorar criativos e segmentação.',
          action: 'Teste novos criativos visuais e ajuste audiências'
        })
      }

      if (performanceAnalysis.average_metrics.avg_roi < 100) {
        recommendations.push({
          type: 'budget',
          priority: 'medium',
          title: 'ROI Baixo',
          description: 'Retorno sobre investimento pode ser melhorado.',
          action: 'Redirecione orçamento para campanhas com melhor performance'
        })
      }

      return NextResponse.json({
        success: true,
        summary: {
          total_ad_accounts: 1,
          total_campaigns: allCampaignsCount,
          active_campaigns: activeCampaignsCount,
          paused_campaigns: allCampaignsCount - activeCampaignsCount,
          total_spend_30d: totalMetrics.total_spend,
          total_conversions_30d: totalMetrics.total_conversions,
          total_clicks_30d: totalMetrics.total_clicks,
          total_impressions_30d: totalMetrics.total_impressions,
          overall_roi: totalMetrics.total_spend > 0 ? ((totalMetrics.total_purchases * 25) - totalMetrics.total_spend) / totalMetrics.total_spend * 100 : 0
        },
        campaigns: allCampaigns,
        performance_analysis: performanceAnalysis,
        recommendations,
        metrics_breakdown: totalMetrics,
        data_period: 'last_30_days',
        timestamp: new Date().toISOString()
      })

    } catch (apiError: any) {
      console.error('❌ Erro ao buscar campanhas avançadas:', apiError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar campanhas avançadas',
        details: apiError.message,
        campaigns: []
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Erro geral ao buscar campanhas avançadas:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 