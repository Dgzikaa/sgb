import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Verificando dados reais no banco...')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`👤 Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('⚠️ Erro ao parsear dados do usuário, usando bar_id padrão')
      }
    }

    // 1. Verificar configuração da Meta
    const { data: metaConfig, error: metaError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'meta')
      .eq('ativo', true)
      .single()

    // 2. Buscar dados do Instagram
    const { data: instagramData, error: igError } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(5)

    // 3. Buscar dados do Facebook
    const { data: facebookData, error: fbError } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(5)

    // 4. Buscar dados consolidados
    const { data: consolidatedData, error: consError } = await supabase
      .from('social_metrics_consolidated')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(5)

    // 5. Testar token da Meta se disponível
    let tokenTest = null
    if (metaConfig && metaConfig.access_token) {
      try {
        const testResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?access_token=${metaConfig.access_token}`
        )
        tokenTest = {
          status: testResponse.status,
          ok: testResponse.ok,
          data: testResponse.ok ? await testResponse.json() : await testResponse.text()
        }
      } catch (error: any) {
        tokenTest = {
          error: error.message
        }
      }
    }

    // 6. Analisar dados mais recentes
    const latestInstagram = instagramData?.[0]
    const latestFacebook = facebookData?.[0] 
    const latestConsolidated = consolidatedData?.[0]

    const analysis = {
      instagram: {
        has_data: !!latestInstagram,
        latest_date: latestInstagram?.data_referencia,
        follower_count: latestInstagram?.follower_count || 0,
        is_real_data: latestInstagram?.raw_data?.real_data || false,
        collection_type: latestInstagram?.raw_data?.collection_type,
        calculated_metrics: latestInstagram?.raw_data?.calculated_metrics
      },
      facebook: {
        has_data: !!latestFacebook,
        latest_date: latestFacebook?.data_referencia,
        fan_count: latestFacebook?.page_fans || 0,
        is_real_data: latestFacebook?.raw_data?.real_data || false,
        collection_type: latestFacebook?.raw_data?.collection_type
      },
      consolidated: {
        has_data: !!latestConsolidated,
        latest_date: latestConsolidated?.data_referencia,
        total_followers: latestConsolidated?.total_followers || 0,
        instagram_followers: latestConsolidated?.instagram_followers || 0,
        facebook_followers: latestConsolidated?.facebook_followers || 0
      }
    }

    const debug_info = {
      success: true,
      bar_id: barId,
      timestamp: new Date().toISOString(),
      
      // Configuração
      meta_config: {
        exists: !!metaConfig,
        has_token: !!(metaConfig?.access_token),
        token_length: metaConfig?.access_token?.length || 0,
        client_id: metaConfig?.client_id,
        configuracoes: metaConfig?.configuracoes,
        error: metaError?.message
      },

      // Teste do token
      token_test: tokenTest,

      // Dados no banco
      database_records: {
        instagram_records: instagramData?.length || 0,
        facebook_records: facebookData?.length || 0,
        consolidated_records: consolidatedData?.length || 0
      },

      // Análise dos dados
      data_analysis: analysis,

      // Dados brutos para debug
      raw_data: {
        latest_instagram: latestInstagram,
        latest_facebook: latestFacebook,
        latest_consolidated: latestConsolidated
      },

      // Possíveis problemas
      issues: [] as string[]
    }

    // Identificar problemas
    if (!metaConfig) {
      debug_info.issues.push('❌ Configuração Meta não encontrada')
    }
    if (!metaConfig?.access_token) {
      debug_info.issues.push('❌ Token de acesso Meta não configurado')
    }
    if (tokenTest && !tokenTest.ok) {
      debug_info.issues.push('❌ Token Meta inválido ou expirado')
    }
    if (!latestInstagram) {
      debug_info.issues.push('⚠️ Nenhum dado do Instagram encontrado')
    }
    if (!latestFacebook) {
      debug_info.issues.push('⚠️ Nenhum dado do Facebook encontrado')
    }
    if (latestInstagram && !latestInstagram.raw_data?.real_data) {
      debug_info.issues.push('⚠️ Dados do Instagram podem ser mockados/antigos')
    }
    if (latestFacebook && !latestFacebook.raw_data?.real_data) {
      debug_info.issues.push('⚠️ Dados do Facebook podem ser mockados/antigos')
    }

    console.log('🔍 DEBUG completo:', debug_info)

    return NextResponse.json(debug_info)

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao fazer debug dos dados',
      details: error.message 
    }, { status: 500 })
  }
} 