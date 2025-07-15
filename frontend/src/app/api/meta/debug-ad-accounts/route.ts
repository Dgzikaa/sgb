import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 DEBUG AD ACCOUNTS...')

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

    const businessId = config.configuracoes?.business_id || '2164664530223231'
    const accessToken = config.access_token

    console.log(`🔑 Business ID: ${businessId}`)

    // Testar me/adaccounts (mais direto)
    console.log('🔍 Testando me/adaccounts...')
    
    const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,amount_spent&access_token=${accessToken}`
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('📊 Resposta:', data)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro na Meta API',
        status: response.status,
        response_data: data,
        business_id: businessId
      })
    }

    const adAccounts = data.data || []
    
    if (adAccounts.length === 0) {
      // Testar permissões do token
      const permUrl = `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      const permResponse = await fetch(permUrl)
      const permData = await permResponse.json()

      return NextResponse.json({
        success: false,
        message: 'Nenhuma ad account encontrada',
        business_id: businessId,
        ad_accounts_count: 0,
        permissions: permData.data?.map((p: any) => `${p.permission}:${p.status}`) || [],
        needs_permissions: ['ads_read', 'ads_management', 'business_management']
      })
    }

    // Se encontrou ad accounts, testar campanhas da primeira
    const firstAccount = adAccounts[0]
    console.log(`🎯 Testando campanhas da conta: ${firstAccount.id}`)
    
    const campaignsUrl = `https://graph.facebook.com/v18.0/${firstAccount.id}/campaigns?fields=id,name,status,effective_status,objective&limit=5&access_token=${accessToken}`
    const campaignsResponse = await fetch(campaignsUrl)
    const campaignsData = await campaignsResponse.json()

    return NextResponse.json({
      success: true,
      business_id: businessId,
      ad_accounts_found: adAccounts.length,
      ad_accounts: adAccounts,
      first_account: firstAccount,
      campaigns_test: {
        url: campaignsUrl.replace(accessToken, 'TOKEN_HIDDEN'),
        status: campaignsResponse.status,
        campaigns_found: campaignsData.data?.length || 0,
        campaigns: campaignsData.data || [],
        error: campaignsData.error || null
      }
    })

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 