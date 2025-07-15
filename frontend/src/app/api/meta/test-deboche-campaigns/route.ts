import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO CAMPANHAS DA CONTA DEBOCHE BAR...')

    // Buscar configuração Meta
    const { data: config } = await supabase
      .from('api_credentials')
      .select('access_token')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (!config) {
      return NextResponse.json({ error: 'Configuração não encontrada' })
    }

    const accessToken = config.access_token

    // 1. Buscar a conta Deboche especificamente
    console.log('🔍 1. Buscando conta Deboche...')
    const accountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    const accountsResponse = await fetch(accountsUrl)
    const accountsData = await accountsResponse.json()

    if (!accountsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar contas',
        data: accountsData
      })
    }

    const debocheAccount = accountsData.data?.find((acc: any) => 
      acc.name?.toLowerCase().includes('deboche')
    )

    if (!debocheAccount) {
      return NextResponse.json({
        success: false,
        error: 'Conta Deboche não encontrada',
        available_accounts: accountsData.data?.map((acc: any) => `${acc.id}: ${acc.name}`)
      })
    }

    console.log(`✅ Conta Deboche encontrada: ${debocheAccount.id} - ${debocheAccount.name}`)

    // 2. Testar campanhas da conta Deboche
    console.log('🎯 2. Buscando campanhas da conta Deboche...')
    const campaignsUrl = `https://graph.facebook.com/v18.0/${debocheAccount.id}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`
    const campaignsResponse = await fetch(campaignsUrl)
    const campaignsData = await campaignsResponse.json()

    console.log('📊 Resposta campanhas:', campaignsData)

    if (!campaignsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar campanhas',
        account: debocheAccount,
        campaigns_error: campaignsData
      })
    }

    const campaigns = campaignsData.data || []

    // 3. Se tem campanhas, testar insights de uma delas
    let sampleInsights = null
    if (campaigns.length > 0) {
      console.log('📈 3. Testando insights da primeira campanha...')
      const firstCampaign = campaigns[0]
      
      const insightsUrl = `https://graph.facebook.com/v18.0/${firstCampaign.id}/insights?fields=spend,impressions,reach,clicks,ctr,cpc&date_preset=last_7d&access_token=${accessToken}`
      const insightsResponse = await fetch(insightsUrl)
      const insightsData = await insightsResponse.json()
      
      if (insightsResponse.ok) {
        sampleInsights = insightsData.data?.[0] || null
      } else {
        sampleInsights = { error: insightsData }
      }
    }

    return NextResponse.json({
      success: true,
      account: {
        id: debocheAccount.id,
        name: debocheAccount.name,
        status: debocheAccount.account_status === 1 ? 'ATIVA' : 'INATIVA'
      },
      campaigns: {
        total: campaigns.length,
        active: campaigns.filter((c: any) => c.effective_status === 'ACTIVE').length,
        paused: campaigns.filter((c: any) => c.effective_status === 'PAUSED').length,
        list: campaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.effective_status,
          objective: c.objective,
          daily_budget: c.daily_budget,
          lifetime_budget: c.lifetime_budget
        }))
      },
      sample_insights: sampleInsights,
      conclusion: campaigns.length > 0 ? 
        `✅ Conta tem ${campaigns.length} campanhas - Robô deve funcionar` :
        `❌ Conta não tem campanhas - Por isso o robô não salva nada`
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 