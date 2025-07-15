import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando dados faltantes do Meta...')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento

    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
      } catch (e) {
        console.log('⚠️ Usando barId padrão')
      }
    }

    // 1. VERIFICAR DADOS DO FACEBOOK
    const { data: facebookData } = await supabase
      .from('facebook_metrics')
      .select('data_referencia, page_fans, page_reach, page_impressions, page_engaged_users')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(7)

    // 2. VERIFICAR DADOS DO INSTAGRAM  
    const { data: instagramData } = await supabase
      .from('instagram_metrics')
      .select('data_referencia, follower_count, reach, impressions, profile_views')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(7)

    // 3. VERIFICAR CAMPANHAS
    const { data: campaignsData } = await supabase
      .from('meta_campaigns_history')
      .select('*')
      .eq('bar_id', barId)
      .order('data_coleta', { ascending: false })
      .limit(5)

    // 4. VERIFICAR CONFIGURAÇÃO DA META
    const { data: metaConfig } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'meta')
      .eq('ativo', true)
      .single()

    // ANÁLISE DOS DADOS
    const analysis = {
      facebook: {
        has_followers: facebookData?.some(d => d.page_fans > 0) || false,
        has_reach: facebookData?.some(d => d.page_reach > 0) || false,
        has_impressions: facebookData?.some(d => d.page_impressions > 0) || false,
        has_engagement: facebookData?.some(d => d.page_engaged_users > 0) || false,
        total_records: facebookData?.length || 0,
        latest_date: facebookData?.[0]?.data_referencia || null
      },
      instagram: {
        has_followers: instagramData?.some(d => d.follower_count > 0) || false,
        has_reach: instagramData?.some(d => d.reach > 0) || false,
        has_impressions: instagramData?.some(d => d.impressions > 0) || false,
        has_engagement: instagramData?.some(d => d.profile_views > 0) || false,
        total_records: instagramData?.length || 0,
        latest_date: instagramData?.[0]?.data_referencia || null
      },
      campaigns: {
        has_data: campaignsData && campaignsData.length > 0,
        total_records: campaignsData?.length || 0,
        latest_date: campaignsData?.[0]?.data_coleta || null
      },
      configuration: {
        has_meta_config: metaConfig !== null,
        has_access_token: metaConfig?.access_token ? true : false,
        has_instagram_id: metaConfig?.configuracoes?.instagram_account_id ? true : false,
        has_facebook_page: metaConfig?.configuracoes?.page_id ? true : false
      }
    }

    // DIAGNÓSTICO
    const missing = []
    const recommendations = []

    // Facebook
    if (!analysis.facebook.has_reach || !analysis.facebook.has_impressions) {
      missing.push('Dados de alcance/impressões do Facebook')
      recommendations.push('Executar coleta completa da API Facebook Insights')
    }

    // Instagram  
    if (!analysis.instagram.has_reach || !analysis.instagram.has_impressions) {
      missing.push('Dados de alcance/impressões do Instagram')
      recommendations.push('Executar coleta completa da API Instagram Insights')
    }

    // Campanhas
    if (!analysis.campaigns.has_data) {
      missing.push('Dados de campanhas publicitárias')
      recommendations.push('Executar coleta da API Facebook Ads')
    }

    // Configuração
    if (!analysis.configuration.has_meta_config) {
      missing.push('Configuração da Meta não encontrada')
      recommendations.push('Configurar credenciais da Meta em /configuracoes/integracoes')
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        missing,
        recommendations,
        summary: {
          total_missing: missing.length,
          has_basic_data: analysis.facebook.has_followers || analysis.instagram.has_followers,
          needs_full_collection: missing.length > 0
        }
      },
      meta: {
        source: 'missing-data-check',
        bar_id: barId,
        checked_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao verificar dados faltantes:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar dados faltantes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 