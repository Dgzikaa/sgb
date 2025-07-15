import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO ENDPOINTS DE AD ACCOUNTS...')

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

    console.log(`🔑 Testing with Business ID: ${businessId}`)
    console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`)

    const results = {
      business_id: businessId,
      endpoints_tested: [],
      successful_endpoints: [],
      errors: []
    }

    // 1. Testar owned_ad_accounts (atual)
    console.log('🔍 1. Testando owned_ad_accounts...')
    try {
      const url1 = `https://graph.facebook.com/v18.0/${businessId}/owned_ad_accounts?fields=id,name,account_status,currency&access_token=${accessToken}`
      const response1 = await fetch(url1)
      const data1 = await response1.json()
      
      results.endpoints_tested.push({
        name: 'owned_ad_accounts',
        url: url1.replace(accessToken, 'TOKEN_HIDDEN'),
        status: response1.status,
        data: data1,
        count: data1.data?.length || 0
      })

      if (response1.ok && data1.data?.length > 0) {
        results.successful_endpoints.push('owned_ad_accounts')
      }
    } catch (error: any) {
      results.errors.push({ endpoint: 'owned_ad_accounts', error: error.message })
    }

    // 2. Testar client_ad_accounts  
    console.log('🔍 2. Testando client_ad_accounts...')
    try {
      const url2 = `https://graph.facebook.com/v18.0/${businessId}/client_ad_accounts?fields=id,name,account_status,currency&access_token=${accessToken}`
      const response2 = await fetch(url2)
      const data2 = await response2.json()
      
      results.endpoints_tested.push({
        name: 'client_ad_accounts',
        url: url2.replace(accessToken, 'TOKEN_HIDDEN'),
        status: response2.status,
        data: data2,
        count: data2.data?.length || 0
      })

      if (response2.ok && data2.data?.length > 0) {
        results.successful_endpoints.push('client_ad_accounts')
      }
    } catch (error: any) {
      results.errors.push({ endpoint: 'client_ad_accounts', error: error.message })
    }

    // 3. Testar ad_accounts (geral)
    console.log('🔍 3. Testando ad_accounts...')
    try {
      const url3 = `https://graph.facebook.com/v18.0/${businessId}/ad_accounts?fields=id,name,account_status,currency&access_token=${accessToken}`
      const response3 = await fetch(url3)
      const data3 = await response3.json()
      
      results.endpoints_tested.push({
        name: 'ad_accounts',
        url: url3.replace(accessToken, 'TOKEN_HIDDEN'),
        status: response3.status,
        data: data3,
        count: data3.data?.length || 0
      })

      if (response3.ok && data3.data?.length > 0) {
        results.successful_endpoints.push('ad_accounts')
      }
    } catch (error: any) {
      results.errors.push({ endpoint: 'ad_accounts', error: error.message })
    }

    // 4. Testar me/adaccounts (contas diretas do usuário)
    console.log('🔍 4. Testando me/adaccounts...')
    try {
      const url4 = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`
      const response4 = await fetch(url4)
      const data4 = await response4.json()
      
      results.endpoints_tested.push({
        name: 'me/adaccounts',
        url: url4.replace(accessToken, 'TOKEN_HIDDEN'),
        status: response4.status,
        data: data4,
        count: data4.data?.length || 0
      })

      if (response4.ok && data4.data?.length > 0) {
        results.successful_endpoints.push('me/adaccounts')
      }
    } catch (error: any) {
      results.errors.push({ endpoint: 'me/adaccounts', error: error.message })
    }

    // 5. Testar permissões do token
    console.log('🔍 5. Verificando permissões do token...')
    try {
      const url5 = `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      const response5 = await fetch(url5)
      const data5 = await response5.json()
      
      results.endpoints_tested.push({
        name: 'me/permissions',
        url: url5.replace(accessToken, 'TOKEN_HIDDEN'),
        status: response5.status,
        data: data5,
        permissions: data5.data?.map((p: any) => `${p.permission}:${p.status}`) || []
      })
    } catch (error: any) {
      results.errors.push({ endpoint: 'me/permissions', error: error.message })
    }

    const summary = {
      total_endpoints_tested: results.endpoints_tested.length,
      successful_endpoints: results.successful_endpoints,
      total_ad_accounts_found: results.endpoints_tested.reduce((sum, ep) => sum + (ep.count || 0), 0),
      recommended_endpoint: results.successful_endpoints[0] || 'me/adaccounts',
      business_id: businessId
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de endpoints de ad accounts concluído',
      results,
      summary
    })

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
} 