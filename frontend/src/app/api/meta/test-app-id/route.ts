import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando App ID específico onde usuário é admin full...')

    const { access_token, app_id, app_secret } = await request.json()

    if (!access_token) {
      return NextResponse.json({
        error: 'access_token é obrigatório'
      }, { status: 400 })
    }

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      app_id: app_id || '717268057929085',
      tests: []
    }

    // Teste 1: Verificar token e usuário
    console.log('👤 Teste 1: Verificando token e usuário...')
    try {
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${access_token}`
      )
      const userData = await userResponse.json()

      results.tests.push({
        test: 'Usuário conectado',
        success: userResponse.ok,
        data: userData,
        status: userResponse.status
      })

      if (userResponse.ok) {
        console.log('✅ Usuário:', userData.name)
      }
    } catch (error) {
      console.error('❌ Erro no teste de usuário:', error)
    }

    // Teste 2: Verificar permissões do token
    console.log('🔑 Teste 2: Verificando permissões...')
    try {
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${access_token}`
      )
      const permissionsData = await permissionsResponse.json()

      const grantedPermissions = permissionsData.data?.filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission) || []

      results.tests.push({
        test: 'Permissões do token',
        success: permissionsResponse.ok,
        granted_permissions: grantedPermissions,
        has_ads_read: grantedPermissions.includes('ads_read'),
        has_ads_management: grantedPermissions.includes('ads_management'),
        total_permissions: grantedPermissions.length
      })

      console.log('✅ Permissões concedidas:', grantedPermissions.length)
    } catch (error) {
      console.error('❌ Erro no teste de permissões:', error)
    }

    // Teste 3: Listar Business Managers
    console.log('🏢 Teste 3: Verificando Business Managers...')
    try {
      const businessResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,primary_page&access_token=${access_token}`
      )
      const businessData = await businessResponse.json()

      results.tests.push({
        test: 'Business Managers',
        success: businessResponse.ok,
        businesses: businessData.data || [],
        count: businessData.data?.length || 0
      })

      console.log('✅ Business Managers encontrados:', businessData.data?.length || 0)
    } catch (error) {
      console.error('❌ Erro no teste de Business Managers:', error)
    }

    // Teste 4: Listar TODAS as contas de anúncios acessíveis
    console.log('💼 Teste 4: Listando TODAS as contas de anúncios...')
    try {
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,business,business_name,owner&access_token=${access_token}`
      )
      const adAccountsData = await adAccountsResponse.json()

      const accounts = adAccountsData.data || []
      
      // Procurar especificamente pela conta do Ordinário
              const ordinarioAccount = accounts.find((account: any) =>
          account.id === 'act_1153081576486761' ||
          account.name.toLowerCase().includes('ordinário') ||
          account.name.toLowerCase().includes('ordinario')
        )

      results.tests.push({
        test: 'Contas de anúncios',
        success: adAccountsResponse.ok,
        total_accounts: accounts.length,
        all_accounts: accounts,
        ordinario_found: !!ordinarioAccount,
        ordinario_account: ordinarioAccount || null
      })

      console.log('✅ Contas encontradas:', accounts.length)
      if (ordinarioAccount) {
        console.log('🎯 ORDINÁRIO ENCONTRADO!', ordinarioAccount.name)
      }
    } catch (error) {
      console.error('❌ Erro no teste de contas:', error)
    }

    // Teste 5: Tentar acessar conta específica do Ordinário
    console.log('🎯 Teste 5: Testando acesso direto à conta Ordinário...')
    const ordinarioAccountId = 'act_1153081576486761'
    
    try {
      const specificAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${ordinarioAccountId}?fields=id,name,account_status,business,business_name,currency&access_token=${access_token}`
      )
      const specificAccountData = await specificAccountResponse.json()

      results.tests.push({
        test: 'Acesso direto conta Ordinário',
        account_id: ordinarioAccountId,
        success: specificAccountResponse.ok,
        data: specificAccountData,
        status: specificAccountResponse.status
      })

      if (specificAccountResponse.ok) {
        console.log('🎉 SUCESSO! Acesso à conta Ordinário:', specificAccountData.name)
      } else {
        console.log('❌ Ainda sem acesso:', specificAccountData.error?.message)
      }
    } catch (error) {
      console.error('❌ Erro no teste de acesso direto:', error)
    }

    // Teste 6: Se conseguiu acessar, testar campanhas
    const ordinarioTest = results.tests.find((t: any) => t.test === 'Acesso direto conta Ordinário')
    if (ordinarioTest && ordinarioTest.success) {
      console.log('📢 Teste 6: Testando acesso às campanhas...')
      
      try {
        const campaignsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${ordinarioAccountId}/campaigns?fields=id,name,status,objective,effective_status&limit=5&access_token=${access_token}`
        )
        const campaignsData = await campaignsResponse.json()

        results.tests.push({
          test: 'Campanhas do Ordinário',
          success: campaignsResponse.ok,
          campaigns: campaignsData.data || [],
          campaign_count: campaignsData.data?.length || 0,
          status: campaignsResponse.status
        })

        if (campaignsResponse.ok) {
          console.log('🎉 CAMPANHAS ACESSÍVEIS!', campaignsData.data?.length || 0)
        }
      } catch (error) {
        console.error('❌ Erro no teste de campanhas:', error)
      }

      // Teste 7: Testar insights se campanhas funcionaram
      const campaignsTest = results.tests.find((t: any) => t.test === 'Campanhas do Ordinário')
      if (campaignsTest && campaignsTest.success && campaignsTest.campaign_count > 0) {
        console.log('📊 Teste 7: Testando insights das campanhas...')
        
        try {
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${ordinarioAccountId}/insights?fields=impressions,clicks,spend,reach,ctr,cpc&time_range={"since":"2025-01-01","until":"2025-01-13"}&access_token=${access_token}`
          )
          const insightsData = await insightsResponse.json()

          results.tests.push({
            test: 'Insights da conta',
            success: insightsResponse.ok,
            insights: insightsData.data || [],
            status: insightsResponse.status
          })

          if (insightsResponse.ok) {
            console.log('🎉 INSIGHTS ACESSÍVEIS!', insightsData.data?.length || 0, 'períodos')
          }
        } catch (error) {
          console.error('❌ Erro no teste de insights:', error)
        }
      }
    }

    // Resumo final
    results.summary = {
      token_valid: results.tests.some((t: any) => t.test === 'Usuário conectado' && t.success),
      has_ads_permissions: results.tests.some((t: any) => t.test === 'Permissões do token' && (t.has_ads_read || t.has_ads_management)),
      ordinario_accessible: results.tests.some((t: any) => t.test === 'Acesso direto conta Ordinário' && t.success),
      campaigns_accessible: results.tests.some((t: any) => t.test === 'Campanhas do Ordinário' && t.success),
      insights_accessible: results.tests.some((t: any) => t.test === 'Insights da conta' && t.success),
      
      next_action: null
    }

    if (results.summary.ordinario_accessible) {
      results.summary.next_action = 'CONFIGURAR ESTE TOKEN NO SISTEMA - Ele tem acesso aos dados!'
    } else if (results.summary.has_ads_permissions) {
      results.summary.next_action = 'Solicitar acesso à conta Ordinário no Business Manager'
    } else {
      results.summary.next_action = 'Regenerar token com permissões ads_read e ads_management'
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao testar App ID:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 