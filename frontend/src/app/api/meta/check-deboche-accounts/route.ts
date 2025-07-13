import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando contas no Business Manager "Deboche Bar"...')

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

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      business_managers: [],
      deboche_accounts: [],
      all_accessible_accounts: []
    }

    // 1. Listar todos os Business Managers
    console.log('🏢 Listando Business Managers...')
    try {
      const businessResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`
      )
      const businessData = await businessResponse.json()
      
      if (businessResponse.ok && businessData.data) {
        results.business_managers = businessData.data
        console.log('✅ Business Managers encontrados:', businessData.data.length)
      }
    } catch (error) {
      console.error('❌ Erro ao listar Business Managers:', error)
    }

    // 2. Listar todas as contas de anúncios acessíveis
    console.log('💼 Listando todas as contas de anúncios...')
    try {
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,business,business_name,owner&access_token=${accessToken}`
      )
      const adAccountsData = await adAccountsResponse.json()
      
      if (adAccountsResponse.ok && adAccountsData.data) {
        results.all_accessible_accounts = adAccountsData.data
        console.log('✅ Contas acessíveis:', adAccountsData.data.length)
        
        // Filtrar contas que podem ser do Deboche Bar ou Ordinário
        results.deboche_accounts = adAccountsData.data.filter((account: any) => 
          account.name.toLowerCase().includes('deboche') ||
          account.name.toLowerCase().includes('ordinário') ||
          account.name.toLowerCase().includes('ordinario') ||
          account.business_name?.toLowerCase().includes('deboche')
        )
      }
    } catch (error) {
      console.error('❌ Erro ao listar contas:', error)
    }

    // 3. Para cada Business Manager, tentar acessar suas contas
    for (const business of results.business_managers) {
      console.log(`🔍 Verificando contas do ${business.name}...`)
      try {
        const businessAccountsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${business.id}/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
        )
        const businessAccountsData = await businessAccountsResponse.json()
        
        if (businessAccountsResponse.ok && businessAccountsData.data) {
          business.ad_accounts = businessAccountsData.data
          business.account_count = businessAccountsData.data.length
          console.log(`✅ ${business.name}: ${businessAccountsData.data.length} contas`)
        } else {
          business.ad_accounts = []
          business.account_count = 0
          business.error = businessAccountsData.error?.message || 'Sem acesso'
        }
      } catch (error) {
        console.error(`❌ Erro ao acessar contas do ${business.name}:`, error)
        business.error = 'Erro de acesso'
      }
    }

    // 4. Buscar especificamente por "Deboche Bar"
    const debocheBusiness = results.business_managers.find((b: any) => 
      b.name.toLowerCase().includes('deboche')
    )

    if (debocheBusiness) {
      results.deboche_business = {
        found: true,
        id: debocheBusiness.id,
        name: debocheBusiness.name,
        accounts: debocheBusiness.ad_accounts || [],
        account_count: debocheBusiness.account_count || 0
      }
    } else {
      results.deboche_business = {
        found: false,
        message: 'Business Manager "Deboche Bar" não encontrado no token atual'
      }
    }

    // 5. Procurar pela conta específica do Ordinário em qualquer lugar
    const ordinarioAccount = results.all_accessible_accounts.find((account: any) =>
      account.id === 'act_1153081576486761' || 
      account.name.toLowerCase().includes('ordinário') ||
      account.name.toLowerCase().includes('ordinario')
    )

    if (ordinarioAccount) {
      results.ordinario_found = {
        accessible: true,
        account: ordinarioAccount,
        business_manager: ordinarioAccount.business_name
      }
    } else {
      results.ordinario_found = {
        accessible: false,
        message: 'Conta Ordinário não acessível com token atual'
      }
    }

    // 6. Diagnóstico e recomendações
    results.diagnosis = {
      token_connected_to: results.business_managers.map((b: any) => b.name),
      deboche_accessible: !!debocheBusiness,
      ordinario_accessible: !!ordinarioAccount,
      
      recommendations: []
    }

    if (!debocheBusiness) {
      results.diagnosis.recommendations.push({
        issue: 'Token não tem acesso ao "Deboche Bar"',
        solution: 'Gerar novo token conectado à página do Deboche Bar',
        action: 'Conectar app Meta à página Facebook do Deboche Bar'
      })
    }

    if (!ordinarioAccount) {
      results.diagnosis.recommendations.push({
        issue: 'Conta "Ordinário - CA" não acessível',
        solution: 'Admin do "Bem Dito" precisa dar acesso',
        action: 'Solicitar permissão no Business Manager "Bem Dito"'
      })
    }

    if (debocheBusiness && debocheBusiness.account_count > 0) {
      results.diagnosis.recommendations.push({
        opportunity: 'Existem contas no Deboche Bar',
        action: 'Verificar se alguma é do Ordinário com nome diferente'
      })
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao verificar contas Deboche:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 