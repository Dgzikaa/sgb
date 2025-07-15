import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 CONFIGURANDO BUSINESS ID PARA CAMPANHAS META...')

    // Buscar configuração atual
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

    console.log('✅ Configuração encontrada')

    // Verificar se já tem business_id
    if (config.configuracoes?.business_id) {
      console.log(`✅ Business ID já configurado: ${config.configuracoes.business_id}`)
      return NextResponse.json({
        success: true,
        message: 'Business ID já está configurado',
        business_id: config.configuracoes.business_id
      })
    }

    // Descobrir business_id automaticamente
    console.log('🔍 Descobrindo Business ID automaticamente...')
    
    const businessUrl = `https://graph.facebook.com/v18.0/me/businesses?access_token=${config.access_token}`
    const businessResponse = await fetch(businessUrl)
    
    if (!businessResponse.ok) {
      const error = await businessResponse.json()
      console.log('❌ Erro ao buscar businesses:', error)
      return NextResponse.json({
        success: false,
        error: `Erro da Meta API: ${error.error?.message || 'Falha na requisição'}`,
        details: error
      })
    }

    const businessData = await businessResponse.json()
    console.log('🏢 Businesses encontrados:', businessData)

    if (!businessData.data || businessData.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum Business Manager encontrado na conta Meta'
      })
    }

    // Pegar o primeiro business ID
    const businessId = businessData.data[0].id
    const businessName = businessData.data[0].name || 'Business Manager'
    
    console.log(`✅ Business ID encontrado: ${businessId} (${businessName})`)

    // Atualizar configuração
    const { error: updateError } = await supabase
      .from('api_credentials')
      .update({
        configuracoes: {
          ...config.configuracoes,
          business_id: businessId,
          business_name: businessName,
          business_configured_at: new Date().toISOString(),
          campaigns_enabled: true
        }
      })
      .eq('id', config.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar configuração:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar Business ID na configuração'
      })
    }

    console.log('💾 Business ID salvo na configuração')

    // Testar se consegue buscar ad accounts
    console.log('🧪 Testando acesso às ad accounts...')
    
    const adAccountsUrl = `https://graph.facebook.com/v18.0/${businessId}/owned_ad_accounts?fields=id,name,account_status&access_token=${config.access_token}`
    const adAccountsResponse = await fetch(adAccountsUrl)
    
    let adAccountsInfo = null
    if (adAccountsResponse.ok) {
      const adAccountsData = await adAccountsResponse.json()
      adAccountsInfo = {
        total_accounts: adAccountsData.data?.length || 0,
        active_accounts: adAccountsData.data?.filter((acc: any) => acc.account_status === 'ACTIVE').length || 0,
        accounts: adAccountsData.data || []
      }
      console.log(`✅ ${adAccountsInfo.total_accounts} ad accounts encontradas`)
    }

    return NextResponse.json({
      success: true,
      message: 'Business ID configurado com sucesso',
      business_id: businessId,
      business_name: businessName,
      ad_accounts: adAccountsInfo,
      next_steps: [
        'Business ID configurado automaticamente',
        'Robô meta-sync-automatico agora pode coletar campanhas',
        'Execute o robô manualmente ou aguarde a próxima execução automática'
      ]
    })

  } catch (error: any) {
    console.error('❌ Erro ao configurar Business ID:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
} 