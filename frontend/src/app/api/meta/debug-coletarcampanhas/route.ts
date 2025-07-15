import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 DEBUG DETALHADO - COLETARCAMPANHAS...')

    const debugSteps: any[] = []
    const BAR_ID = 3

    // PASSO 1: Buscar credenciais
    debugSteps.push({ step: 1, action: 'Buscando credenciais Meta...', status: 'running' })
    
    const { data: credenciais, error: credsError } = await supabase
      .from('api_credentials')
      .select('configuracoes, access_token')
      .eq('sistema', 'meta')
      .eq('bar_id', BAR_ID)
      .single()
    
    if (credsError || !credenciais) {
      debugSteps[0].status = 'error'
      debugSteps[0].error = credsError?.message || 'Credenciais não encontradas'
      return NextResponse.json({ success: false, error: 'Credenciais não encontradas', debug_steps: debugSteps })
    }
    
    debugSteps[0].status = 'success'
    debugSteps[0].result = {
      has_business_id: !!credenciais.configuracoes?.business_id,
      business_id: credenciais.configuracoes?.business_id,
      has_access_token: !!credenciais.access_token
    }

    const businessId = credenciais.configuracoes.business_id || 'N/A'
    const accessToken = credenciais.access_token

    // PASSO 2: Buscar ad accounts via me/adaccounts
    debugSteps.push({ step: 2, action: 'Buscando ad accounts via me/adaccounts...', status: 'running' })
    
    const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap&access_token=${accessToken}`
    
    try {
      const adAccountsResponse = await fetch(adAccountsUrl)
      const adAccountsData = await adAccountsResponse.json()
      
      if (!adAccountsResponse.ok) {
        debugSteps[1].status = 'error'
        debugSteps[1].error = adAccountsData
        return NextResponse.json({ success: false, error: 'Erro ao buscar ad accounts', debug_steps: debugSteps })
      }
      
      const allAdAccounts = adAccountsData.data || []
      debugSteps[1].status = 'success'
      debugSteps[1].result = {
        total_accounts: allAdAccounts.length,
        accounts: allAdAccounts.map((acc: any) => ({ id: acc.id, name: acc.name, status: acc.account_status }))
      }

      // PASSO 3: Filtrar conta Deboche
      debugSteps.push({ step: 3, action: 'Filtrando conta Deboche Bar...', status: 'running' })
      
      const DEBOCHE_ACCOUNT_ID = 'act_943600147532423'
      const adAccounts = allAdAccounts.filter((account: any) => {
        return account.id === DEBOCHE_ACCOUNT_ID || 
               account.name?.toLowerCase().includes('deboche')
      })
      
      debugSteps[2].status = 'success'
      debugSteps[2].result = {
        filtered_accounts: adAccounts.length,
        target_account_id: DEBOCHE_ACCOUNT_ID,
        found_accounts: adAccounts.map((acc: any) => ({ id: acc.id, name: acc.name }))
      }

      if (adAccounts.length === 0) {
        debugSteps[2].status = 'error'
        debugSteps[2].error = 'Nenhuma conta Deboche encontrada'
        return NextResponse.json({ success: false, error: 'Conta Deboche não encontrada', debug_steps: debugSteps })
      }

      // PASSO 4: Coletar campanhas da primeira conta filtrada
      debugSteps.push({ step: 4, action: 'Coletando campanhas da conta Deboche...', status: 'running' })
      
      const targetAccount = adAccounts[0]
      console.log(`🎯 Coletando campanhas da conta: ${targetAccount.id}`)
      
      const campaignsUrl = `https://graph.facebook.com/v18.0/${targetAccount.id}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget,lifetime_budget,created_time,updated_time,insights.metric(impressions,reach,clicks,ctr,cpc,cpp,cpm,spend,frequency,actions,conversions,cost_per_conversion).date_preset(last_30d)&access_token=${accessToken}`
      
      const campaignsResponse = await fetch(campaignsUrl)
      const campaignsData = await campaignsResponse.json()
      
      if (!campaignsResponse.ok) {
        debugSteps[3].status = 'error'
        debugSteps[3].error = campaignsData
        return NextResponse.json({ success: false, error: 'Erro ao buscar campanhas', debug_steps: debugSteps })
      }
      
      const campaigns = campaignsData.data || []
      debugSteps[3].status = 'success'
      debugSteps[3].result = {
        account_id: targetAccount.id,
        account_name: targetAccount.name,
        campaigns_found: campaigns.length,
        campaigns_preview: campaigns.slice(0, 3).map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.effective_status,
          has_insights: !!c.insights?.data?.[0]
        }))
      }

      // PASSO 5: Processar insights das campanhas
      debugSteps.push({ step: 5, action: 'Processando insights das campanhas...', status: 'running' })
      
      let totalSpend = 0
      let totalImpressions = 0
      let totalReach = 0
      let totalClicks = 0
      let activeCampaigns = 0
      let campaignsWithInsights = 0

      campaigns.forEach((campaign: any) => {
        if (campaign.insights?.data?.[0]) {
          campaignsWithInsights++
          const insights = campaign.insights.data[0]
          totalSpend += parseFloat(insights.spend || 0)
          totalImpressions += parseInt(insights.impressions || 0)
          totalReach += parseInt(insights.reach || 0)
          totalClicks += parseInt(insights.clicks || 0)
        }
        if (campaign.effective_status === 'ACTIVE') {
          activeCampaigns++
        }
      })

      debugSteps[4].status = 'success'
      debugSteps[4].result = {
        total_campaigns: campaigns.length,
        campaigns_with_insights: campaignsWithInsights,
        active_campaigns: activeCampaigns,
        totals: {
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_reach: totalReach,
          total_clicks: totalClicks
        }
      }

      // RESULTADO FINAL
      const finalResult = {
        campaigns: campaigns,
        ads: [], // Não coletamos ads neste debug
        ad_accounts: adAccounts,
        totals: {
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_reach: totalReach,
          total_clicks: totalClicks,
          active_campaigns: activeCampaigns,
          total_campaigns: campaigns.length,
          total_ads: 0
        },
        timestamp: new Date().toISOString(),
        collected_metrics: [
          'impressions', 'reach', 'clicks', 'spend', 'ctr', 'cpc', 'cpm',
          'conversions', 'frequency'
        ]
      }

      return NextResponse.json({
        success: true,
        message: `Debug concluído - ${campaigns.length} campanhas encontradas`,
        debug_steps: debugSteps,
        final_result: finalResult,
        should_save_to_database: campaigns.length > 0,
        next_action: campaigns.length > 0 ? 'Dados prontos para salvar no banco' : 'Nenhuma campanha para salvar'
      })

    } catch (fetchError: any) {
      debugSteps[1].status = 'error'
      debugSteps[1].error = fetchError.message
      return NextResponse.json({ success: false, error: fetchError.message, debug_steps: debugSteps })
    }

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
} 