import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando credenciais Meta API...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('meta_configuracoes')
      .select('*')
      .eq('bar_id', 3)
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada',
        details: configError?.message 
      }, { status: 404 })
    }

    console.log('✅ Configuração encontrada:', {
      app_id: config.app_id,
      page_id: config.page_id,
      instagram_id: config.instagram_account_id,
      ativo: config.ativo
    })

    // Teste 1: Verificar token de acesso
    console.log('🔑 Testando token de acesso...')
    const testTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${config.access_token}`
    )
    const tokenData = await testTokenResponse.json()

    if (!testTokenResponse.ok) {
      return NextResponse.json({ 
        error: 'Token de acesso inválido',
        details: tokenData 
      }, { status: 400 })
    }

    console.log('✅ Token válido para usuário:', tokenData.name)

    // Teste 2: Buscar dados da página Facebook
    console.log('📘 Testando dados Facebook...')
    const facebookResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.page_id}?fields=id,name,followers_count,fan_count&access_token=${config.access_token}`
    )
    const facebookData = await facebookResponse.json()

    // Teste 3: Buscar insights básicos Facebook
    console.log('📊 Testando insights Facebook...')
    const facebookInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_followers,page_impressions&period=day&access_token=${config.access_token}`
    )
    const facebookInsights = await facebookInsightsResponse.json()

    // Teste 4: Buscar dados Instagram
    console.log('📷 Testando dados Instagram...')
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.instagram_account_id}?fields=id,username,followers_count,media_count&access_token=${config.access_token}`
    )
    const instagramData = await instagramResponse.json()

    // Teste 5: Buscar insights Instagram
    console.log('📊 Testando insights Instagram...')
    const instagramInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=impressions,reach,profile_views&period=day&access_token=${config.access_token}`
    )
    const instagramInsights = await instagramInsightsResponse.json()

    // Teste 6: Buscar campanhas publicitárias (se tiver acesso)
    console.log('📢 Testando campanhas publicitárias...')
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${config.configuracoes_adicionais?.business_id || 'unknown'}/campaigns?fields=id,name,status,objective&access_token=${config.access_token}`
    )
    const campaignsData = await campaignsResponse.json()

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      config: {
        app_id: config.app_id,
        page_id: config.page_id,
        instagram_id: config.instagram_account_id,
        ativo: config.ativo,
        business_id: config.configuracoes_adicionais?.business_id
      },
      tests: {
        token: {
          success: testTokenResponse.ok,
          data: tokenData
        },
        facebook_page: {
          success: facebookResponse.ok,
          data: facebookData
        },
        facebook_insights: {
          success: facebookInsightsResponse.ok,
          data: facebookInsights
        },
        instagram_account: {
          success: instagramResponse.ok,
          data: instagramData
        },
        instagram_insights: {
          success: instagramInsightsResponse.ok,
          data: instagramInsights
        },
        campaigns: {
          success: campaignsResponse.ok,
          data: campaignsData
        }
      }
    }

    console.log('🎉 Teste concluído!')
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao testar credenciais:', error)
    return NextResponse.json({ 
      error: 'Erro ao testar credenciais',
      details: error.message 
    }, { status: 500 })
  }
} 