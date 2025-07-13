import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando TODAS as contas em TODOS os Business Managers...')

    const { access_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({
        error: 'access_token é obrigatório'
      }, { status: 400 })
    }

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      all_businesses: [],
      ordinario_found_in: null,
      total_ad_accounts: 0
    }

    // 1. Listar TODOS os Business Managers
    console.log('🏢 Listando TODOS os Business Managers...')
    try {
      const businessResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,primary_page&access_token=${access_token}`
      )
      const businessData = await businessResponse.json()

      if (businessResponse.ok && businessData.data) {
        results.all_businesses = businessData.data
        console.log('✅ Business Managers encontrados:', businessData.data.length)

        // 2. Para CADA Business Manager, listar suas contas
        for (const business of results.all_businesses) {
          console.log(`🔍 Verificando contas do ${business.name}...`)
          
          try {
            const businessAccountsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${business.id}/adaccounts?fields=id,name,account_status,business_name&access_token=${access_token}`
            )
            const businessAccountsData = await businessAccountsResponse.json()

            if (businessAccountsResponse.ok && businessAccountsData.data) {
              business.ad_accounts = businessAccountsData.data
              business.account_count = businessAccountsData.data.length
              results.total_ad_accounts += businessAccountsData.data.length

              console.log(`✅ ${business.name}: ${businessAccountsData.data.length} contas`)

              // Procurar pela conta específica "Ordinário - CA"
              const ordinarioAccount = businessAccountsData.data.find((account: any) =>
                account.id === 'act_1153081576486761' ||
                account.name.toLowerCase().includes('ordinário') ||
                account.name.toLowerCase().includes('ordinario')
              )

              if (ordinarioAccount) {
                results.ordinario_found_in = {
                  business_manager: business.name,
                  business_id: business.id,
                  account: ordinarioAccount,
                  found: true
                }
                console.log(`🎯 ORDINÁRIO ENCONTRADO em ${business.name}!`)
              }

            } else {
              business.ad_accounts = []
              business.account_count = 0
              business.error = businessAccountsData.error?.message || 'Sem acesso'
              console.log(`❌ ${business.name}: ${business.error}`)
            }
          } catch (error) {
            console.error(`❌ Erro ao acessar contas do ${business.name}:`, error)
            business.error = 'Erro de conexão'
          }
        }

      } else {
        console.log('❌ Erro ao listar Business Managers:', businessData.error)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar Business Managers:', error)
    }

    // 3. Listar TODAS as contas acessíveis diretamente
    console.log('💼 Listando TODAS as contas via /me/adaccounts...')
    try {
      const allAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,business,business_name&access_token=${access_token}`
      )
      const allAccountsData = await allAccountsResponse.json()

      if (allAccountsResponse.ok && allAccountsData.data) {
        results.direct_accessible_accounts = allAccountsData.data
        console.log('✅ Contas acessíveis diretamente:', allAccountsData.data.length)

        // Verificar se Ordinário está na lista direta
        const directOrdinarioAccount = allAccountsData.data.find((account: any) =>
          account.id === 'act_1153081576486761' ||
          account.name.toLowerCase().includes('ordinário') ||
          account.name.toLowerCase().includes('ordinario')
        )

        if (directOrdinarioAccount && !results.ordinario_found_in) {
          results.ordinario_found_in = {
            business_manager: 'Acesso direto (fora de Business Manager)',
            business_id: null,
            account: directOrdinarioAccount,
            found: true
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao listar contas diretas:', error)
    }

    // 4. Teste específico na conta "Supersal - BM6" se existir
    const supersalBusiness = results.all_businesses.find((b: any) => 
      b.name.toLowerCase().includes('supersal') || 
      b.name.toLowerCase().includes('bm6')
    )

    if (supersalBusiness) {
      console.log('🎯 Testando especificamente no Supersal - BM6...')
      try {
        const supersalTestResponse = await fetch(
          `https://graph.facebook.com/v18.0/act_1153081576486761?fields=id,name,account_status,business,business_name&access_token=${access_token}`
        )
        const supersalTestData = await supersalTestResponse.json()

        results.supersal_direct_test = {
          success: supersalTestResponse.ok,
          data: supersalTestData,
          status: supersalTestResponse.status
        }

        if (supersalTestResponse.ok) {
          console.log('🎉 SUCESSO! Conta acessível via Supersal!')
        }
      } catch (error) {
        console.error('❌ Erro no teste Supersal:', error)
      }
    }

    // 5. Resumo e diagnóstico
    results.summary = {
      total_businesses: results.all_businesses.length,
      total_accounts: results.total_ad_accounts,
      ordinario_accessible: !!results.ordinario_found_in,
      location: results.ordinario_found_in?.business_manager || 'Não encontrado',
      
      recommendation: null
    }

    if (results.ordinario_found_in) {
      results.summary.recommendation = `Conta Ordinário encontrada em: ${results.ordinario_found_in.business_manager}. Configure o sistema para usar este Business Manager.`
    } else {
      results.summary.recommendation = 'Conta Ordinário não encontrada em nenhum Business Manager acessível. Verificar se a conta existe ou se as permissões estão corretas.'
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao verificar Business Managers:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 