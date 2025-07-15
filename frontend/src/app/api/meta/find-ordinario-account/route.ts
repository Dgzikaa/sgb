import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 ENCONTRANDO CONTA DO ORDINÁRIO BAR...')

    // Buscar configuração Meta
    const { data: config } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuração Meta não encontrada'
      })
    }

    const accessToken = config.access_token
    const pageId = config.configuracoes?.page_id // 517416481460390

    console.log(`🔑 Page ID do Ordinário: ${pageId}`)

    // Buscar todas as ad accounts
    const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,amount_spent,business&access_token=${accessToken}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro na Meta API',
        response_data: data
      })
    }

    const allAccounts = data.data || []
    console.log(`📊 Total de contas encontradas: ${allAccounts.length}`)

    // Procurar contas que contenham "ordinario", "bar" ou sejam relacionadas
    const ordinarioAccounts = allAccounts.filter((account: any) => {
      const name = account.name?.toLowerCase() || ''
      return (
        name.includes('ordinario') || 
        name.includes('ordinário') || 
        name.includes('bar') ||
        name.includes('musica') ||
        name.includes('música') ||
        account.business?.name?.toLowerCase().includes('ordinario') ||
        account.business?.name?.toLowerCase().includes('ordinário')
      )
    })

    // Se não encontrou por nome, testar campanhas em cada conta para ver qual tem dados
    let accountsWithCampaigns = []
    
    for (const account of allAccounts) {
      try {
        const campaignsUrl = `https://graph.facebook.com/v18.0/${account.id}/campaigns?fields=id,name&limit=5&access_token=${accessToken}`
        const campaignsResponse = await fetch(campaignsUrl)
        const campaignsData = await campaignsResponse.json()
        
        if (campaignsResponse.ok && campaignsData.data?.length > 0) {
          accountsWithCampaigns.push({
            ...account,
            campaigns_count: campaignsData.data.length,
            sample_campaigns: campaignsData.data.slice(0, 3).map((c: any) => c.name)
          })
        }
      } catch (error) {
        console.log(`⚠️ Erro ao testar campanhas da conta ${account.id}`)
      }
    }

    // Resultado da análise
    const result = {
      total_accounts: allAccounts.length,
      ordinario_candidates: ordinarioAccounts,
      accounts_with_campaigns: accountsWithCampaigns,
      all_accounts: allAccounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        status: acc.account_status,
        currency: acc.currency,
        amount_spent: acc.amount_spent,
        business_name: acc.business?.name || 'N/A'
      })),
      recommended_account: ordinarioAccounts[0] || accountsWithCampaigns[0] || null,
      page_id: pageId
    }

    return NextResponse.json({
      success: true,
      message: `Análise de ${allAccounts.length} contas concluída`,
      data: result
    })

  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 