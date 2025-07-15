import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 === TESTE INSIGHTS DISPONÍVEIS ===')
    
    const BAR_ID = 3
    
    // Obter credenciais
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', BAR_ID)
      .eq('ativo', true)
      .single()

    if (!credenciais?.configuracoes) {
      return NextResponse.json({ error: 'Credenciais não encontradas' }, { status: 400 })
    }

    const config = {
      access_token: credenciais.access_token,
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id
    }

    const results = {
      access_token_length: config.access_token?.length,
      page_id: config.page_id,
      instagram_id: config.instagram_account_id,
      tests: {} as any
    }

    // TESTE 1: Verificar permissões do token
    console.log('🔑 Testando permissões do token...')
    try {
      const permissionsUrl = `https://graph.facebook.com/v18.0/me/permissions?access_token=${config.access_token}`
      const permResponse = await fetch(permissionsUrl)
      if (permResponse.ok) {
        const permissions = await permResponse.json()
        results.tests.permissions = {
          success: true,
          data: permissions.data || []
        }
      } else {
        results.tests.permissions = {
          success: false,
          error: await permResponse.text()
        }
      }
    } catch (error: any) {
      results.tests.permissions = { success: false, error: error.message }
    }

    // TESTE 2: Métricas disponíveis do Instagram
    console.log('📸 Testando métricas Instagram disponíveis...')
    const instagramMetrics = [
      'impressions', 
      'reach', 
      'profile_views',
      'website_clicks',
      'follower_count',
      'accounts_engaged'
    ]

    for (const metric of instagramMetrics) {
      try {
        const url = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=${metric}&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          results.tests[`instagram_${metric}`] = {
            success: true,
            has_data: !!(data.data && data.data.length > 0),
            sample_data: data.data?.[0] || null
          }
        } else {
          const errorText = await response.text()
          results.tests[`instagram_${metric}`] = {
            success: false,
            error: errorText
          }
        }
      } catch (error: any) {
        results.tests[`instagram_${metric}`] = {
          success: false,
          error: error.message
        }
      }
    }

    // TESTE 3: Métricas disponíveis do Facebook
    console.log('📘 Testando métricas Facebook disponíveis...')
    const facebookMetrics = [
      'page_impressions',
      'page_reach', 
      'page_post_engagements',
      'page_fans'
    ]

    for (const metric of facebookMetrics) {
      try {
        const url = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=${metric}&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          results.tests[`facebook_${metric}`] = {
            success: true,
            has_data: !!(data.data && data.data.length > 0),
            sample_data: data.data?.[0] || null
          }
        } else {
          const errorText = await response.text()
          results.tests[`facebook_${metric}`] = {
            success: false,
            error: errorText
          }
        }
      } catch (error: any) {
        results.tests[`facebook_${metric}`] = {
          success: false,
          error: error.message
        }
      }
    }

    // TESTE 4: Verificar se é conta Business/Creator
    console.log('🏢 Verificando tipo de conta Instagram...')
    try {
      const accountUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=account_type,is_business_account&access_token=${config.access_token}`
      const accountResponse = await fetch(accountUrl)
      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        results.tests.account_type = {
          success: true,
          data: accountData
        }
      } else {
        results.tests.account_type = {
          success: false,
          error: await accountResponse.text()
        }
      }
    } catch (error: any) {
      results.tests.account_type = { success: false, error: error.message }
    }

    // RESUMO
    const summary = {
      total_tests: Object.keys(results.tests).length,
      successful_tests: Object.values(results.tests).filter((t: any) => t.success).length,
      failed_tests: Object.values(results.tests).filter((t: any) => !t.success).length,
      insights_available: Object.keys(results.tests).filter(key => 
        key.includes('instagram_') || key.includes('facebook_')
      ).filter(key => results.tests[key].success && results.tests[key].has_data).length
    }

    console.log('📊 RESUMO:', summary)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      detailed_results: results
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 