import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando permissões necessárias para acessar dados do Ads Manager...')

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
      current_permissions: [],
      required_permissions: [
        'ads_management',
        'ads_read', 
        'business_management',
        'read_insights'
      ],
      ad_accounts: [],
      permission_issues: [],
      next_steps: []
    }

    // 1. Verificar permissões atuais do token
    console.log('🔑 Verificando permissões atuais do token...')
    try {
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      )
      const permissionsData = await permissionsResponse.json()
      
      if (permissionsData.data) {
        results.current_permissions = permissionsData.data
          .filter((p: any) => p.status === 'granted')
          .map((p: any) => p.permission)
        
        console.log('✅ Permissões atuais:', results.current_permissions)
      }
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error)
    }

    // 2. Tentar acessar contas de anúncios
    console.log('🏢 Verificando acesso a contas de anúncios...')
    try {
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,business,business_name,owner&access_token=${accessToken}`
      )
      const adAccountsData = await adAccountsResponse.json()
      
      if (adAccountsResponse.ok && adAccountsData.data) {
        results.ad_accounts = adAccountsData.data
        console.log('✅ Contas de anúncios encontradas:', adAccountsData.data.length)
      } else {
        results.permission_issues.push({
          issue: 'Não consegue acessar contas de anúncios',
          error: adAccountsData.error || 'Sem permissão para /me/adaccounts',
          solution: 'Token precisa da permissão ads_read ou ads_management'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao acessar contas de anúncios:', error)
    }

    // 3. Tentar acessar a conta específica do Ordinário
    const ordinarioAccountId = 'act_1153081576486761' // ID correto encontrado
    console.log('🎯 Testando acesso à conta específica do Ordinário...')
    
    try {
      const specificAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${ordinarioAccountId}?fields=id,name,account_status,business,business_name&access_token=${accessToken}`
      )
      const specificAccountData = await specificAccountResponse.json()
      
      if (specificAccountResponse.ok) {
        results.ordinario_account = {
          accessible: true,
          data: specificAccountData
        }
        console.log('✅ Conta do Ordinário acessível via API')
      } else {
        results.ordinario_account = {
          accessible: false,
          error: specificAccountData.error
        }
        results.permission_issues.push({
          issue: 'Não consegue acessar conta específica do Ordinário',
          account_id: ordinarioAccountId,
          error: specificAccountData.error?.message || 'Acesso negado',
          solution: 'Usuário precisa conceder permissão programática para esta conta'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao acessar conta do Ordinário:', error)
    }

    // 4. Tentar acessar campanhas da conta do Ordinário
    console.log('📢 Testando acesso às campanhas...')
    try {
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${ordinarioAccountId}/campaigns?fields=id,name,status,objective&access_token=${accessToken}`
      )
      const campaignsData = await campaignsResponse.json()
      
      if (campaignsResponse.ok) {
        results.campaigns_access = {
          accessible: true,
          count: campaignsData.data?.length || 0
        }
        console.log('✅ Campanhas acessíveis via API')
      } else {
        results.campaigns_access = {
          accessible: false,
          error: campaignsData.error
        }
        results.permission_issues.push({
          issue: 'Não consegue acessar campanhas',
          error: campaignsData.error?.message || 'Sem permissão para campanhas',
          solution: 'Token precisa de ads_management ou ads_read para esta conta específica'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao acessar campanhas:', error)
    }

    // 5. Verificar Business Manager
    console.log('🏢 Verificando Business Manager...')
    try {
      const businessResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`
      )
      const businessData = await businessResponse.json()
      
      if (businessResponse.ok) {
        results.businesses = businessData.data || []
        console.log('✅ Business Managers encontrados:', businessData.data?.length || 0)
      }
    } catch (error) {
      console.error('❌ Erro ao acessar Business Manager:', error)
    }

    // 6. Gerar instruções específicas
    results.next_steps = []

    if (!results.current_permissions.includes('ads_read') && !results.current_permissions.includes('ads_management')) {
      results.next_steps.push({
        step: 1,
        action: 'Adicionar permissões de ads',
        description: 'Regenerar token com permissões ads_read e ads_management',
        url: 'https://developers.facebook.com/tools/explorer/'
      })
    }

    if (results.permission_issues.length > 0) {
      results.next_steps.push({
        step: 2,
        action: 'Solicitar acesso à conta de anúncios',
        description: 'O dono da conta "Ordinário - CA" precisa dar acesso programático via Business Manager',
        instructions: [
          'Ir no Business Manager Settings',
          'Acessar "Ad Accounts"',
          'Selecionar a conta "Ordinário - CA"',
          'Adicionar seu usuário com permissão "Advertiser" ou "Admin"',
          'Confirmar que o app tem acesso à conta'
        ]
      })
    }

    results.next_steps.push({
      step: 3,
      action: 'Parâmetros necessários para API',
      parameters: {
        ad_account_id: 'act_1153081576486761',
        access_token: 'Token com permissões ads_read',
        fields_campaigns: 'id,name,status,objective,spend,impressions,clicks,ctr,cpc,reach',
        fields_insights: 'impressions,clicks,spend,reach,frequency,ctr,cpc,cpp,cost_per_action_type'
      }
    })

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao verificar permissões:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 