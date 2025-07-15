import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO COLETA DE CAMPANHAS META...')

    // 1. Buscar configuração Meta
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

    console.log('✅ Configuração Meta encontrada')
    console.log('🔑 Access Token:', config.access_token?.substring(0, 20) + '...')
    console.log('📋 Configurações:', config.configuracoes)

    // 2. Verificar se tem business_id configurado
    const businessId = config.configuracoes?.business_id
    
    if (!businessId) {
      console.log('❌ Business ID não encontrado, tentando descobrir automaticamente...')
      
      // Tentar buscar business accounts do usuário
      const businessUrl = `https://graph.facebook.com/v18.0/me/businesses?access_token=${config.access_token}`
      
      try {
        const businessResponse = await fetch(businessUrl)
        const businessData = await businessResponse.json()
        
        console.log('🏢 Businesses encontrados:', businessData)
        
        if (businessData.data && businessData.data.length > 0) {
          const foundBusinessId = businessData.data[0].id
          console.log(`✅ Business ID encontrado automaticamente: ${foundBusinessId}`)
          
          // Atualizar configuração com business_id
          await supabase
            .from('api_credentials')
            .update({
              configuracoes: {
                ...config.configuracoes,
                business_id: foundBusinessId
              }
            })
            .eq('id', config.id)
          
          console.log('💾 Business ID salvo na configuração')
        }
      } catch (businessError) {
        console.log('⚠️ Erro ao buscar businesses:', businessError)
      }
    } else {
      console.log(`✅ Business ID configurado: ${businessId}`)
    }

    // 3. Testar coleta de ad accounts
    const testBusinessId = businessId || config.configuracoes?.business_id
    
    if (testBusinessId) {
      console.log(`🔍 Testando coleta de ad accounts para business: ${testBusinessId}`)
      
      const adAccountsUrl = `https://graph.facebook.com/v18.0/${testBusinessId}/owned_ad_accounts?fields=id,name,account_status,currency,balance,amount_spent&access_token=${config.access_token}`
      
      const adAccountsResponse = await fetch(adAccountsUrl)
      const adAccountsData = await adAccountsResponse.json()
      
      console.log('📊 Ad Accounts encontradas:', adAccountsData)
      
      if (adAccountsData.error) {
        return NextResponse.json({
          success: false,
          error: `Erro da Meta API: ${adAccountsData.error.message}`,
          details: adAccountsData.error,
          business_id: testBusinessId,
          config_found: true
        })
      }
      
      if (adAccountsData.data && adAccountsData.data.length > 0) {
        // 4. Testar coleta de campanhas da primeira ad account
        const firstAccount = adAccountsData.data[0]
        console.log(`🎯 Testando campanhas da conta: ${firstAccount.id}`)
        
        const campaignsUrl = `https://graph.facebook.com/v18.0/${firstAccount.id}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget,insights.metric(impressions,reach,clicks,spend,ctr,cpc,cpm).date_preset(last_7d)&access_token=${config.access_token}`
        
        const campaignsResponse = await fetch(campaignsUrl)
        const campaignsData = await campaignsResponse.json()
        
        console.log('🚀 Campanhas encontradas:', campaignsData)
        
        return NextResponse.json({
          success: true,
          message: 'Teste de coleta concluído',
          data: {
            config_found: true,
            business_id: testBusinessId,
            ad_accounts: adAccountsData.data,
            campaigns: campaignsData.data || [],
            total_ad_accounts: adAccountsData.data.length,
            total_campaigns: campaignsData.data?.length || 0
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Nenhuma ad account encontrada',
          business_id: testBusinessId,
          ad_accounts_response: adAccountsData
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Business ID não encontrado nem pode ser descoberto automaticamente'
      })
    }

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
} 