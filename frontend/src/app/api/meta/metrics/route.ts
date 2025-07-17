import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€œÅ  Buscando mÃ¡Â©tricas consolidadas Meta...')

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || 'all'
    const period = searchParams.get('period') || 'week'

    console.log(`Ã°Å¸Å½Â¯ ParÃ¡Â¢metros: platform=${platform}, period=${period}`)

    // Obter dados do usuÃ¡Â¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`Ã°Å¸â€˜Â¤ Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('Å¡Â Ã¯Â¸Â Erro ao parsear dados do usuÃ¡Â¡rio, usando bar_id padrÃ¡Â£o')
      }
    }

    // Buscar dados mais recentes do Instagram
    const { data: instagramData, error: instagramError } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(7) // Ã¡Å¡ltima semana

    // Buscar dados mais recentes do Facebook  
    const { data: facebookData, error: facebookError } = await supabase
        .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(7) // Ã¡Å¡ltima semana

    // Buscar dados consolidados
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('social_metrics_consolidated')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(7) // Ã¡Å¡ltima semana

    console.log('Ã°Å¸â€œÂ± Dados encontrados:', {
      instagram: instagramData?.length || 0,
      facebook: facebookData?.length || 0,
      consolidated: consolidatedData?.length || 0
    })

    // Processar dados do Instagram (estrutura que a pÃ¡Â¡gina espera)
    const instagramMetrics = instagramData && instagramData.length > 0 ? [{
      platform: 'instagram',
      follower_count: instagramData[0].follower_count || 0,
      following_count: instagramData[0].following_count || 0,
      reach: instagramData[0].reach || 0,
      impressions: instagramData[0].impressions || 0,
      posts_likes: instagramData[0].posts_likes || 0,
      posts_comments: instagramData[0].posts_comments || 0,
      media_count: instagramData[0].raw_data?.calculated_metrics?.total_posts_analyzed || 0,
      engagement_rate: instagramData[0].raw_data?.calculated_metrics?.engagement_rate_percentage || 0,
      growth_7d: instagramData.length > 1 ? 
        ((instagramData[0].follower_count - instagramData[instagramData.length - 1].follower_count) / instagramData[instagramData.length - 1].follower_count * 100) : 0,
      data_referencia: instagramData[0].data_referencia
    }] : []

    // Processar dados do Facebook (estrutura que a pÃ¡Â¡gina espera)
    const facebookMetrics = facebookData && facebookData.length > 0 ? [{
      platform: 'facebook',
      page_fans: facebookData[0].page_fans || facebookData[0].fan_count || 0,
      followers_count: facebookData[0].followers_count || 0,
      page_reach: facebookData[0].page_reach || 0,
      page_engaged_users: facebookData[0].page_engaged_users || 0,
      post_count: facebookData[0].raw_data?.posts_summary?.total_posts || 0,
      growth_7d: facebookData.length > 1 ? 
        ((facebookData[0].page_fans - facebookData[facebookData.length - 1].page_fans) / facebookData[facebookData.length - 1].page_fans * 100) : 0,
      data_referencia: facebookData[0].data_referencia
    }] : []

    // Dados consolidados
    const consolidatedMetrics = consolidatedData && consolidatedData.length > 0 ? {
      total_followers: consolidatedData[0].total_followers || 0,
      total_engagement: consolidatedData[0].total_engagement || 0,
      total_reach: consolidatedData[0].total_reach || 0,
      total_impressions: consolidatedData[0].total_impressions || 0,
      performance_score: consolidatedData[0].performance_score || 0,
      facebook_followers: consolidatedData[0].facebook_followers || 0,
      instagram_followers: consolidatedData[0].instagram_followers || 0,
      facebook_engagement: consolidatedData[0].facebook_engagement || 0,
      instagram_engagement: consolidatedData[0].instagram_engagement || 0,
      data_referencia: consolidatedData[0].data_referencia
    } : null

    // Preparar resposta baseada na plataforma solicitada
    let responseData: any[] = [];

    if (platform === 'all' || platform === 'instagram') {
      responseData = responseData.concat(instagramMetrics)
    }

    if (platform === 'all' || platform === 'facebook') {
      responseData = responseData.concat(facebookMetrics)
    }

    // Se nÃ¡Â£o hÃ¡Â¡ dados, retornar array vazio - SEM DADOS FALSOS
    if (responseData.length === 0) {
      console.log('Å¡Â Ã¯Â¸Â Nenhum dado REAL encontrado no banco. Retornando vazio.')
      responseData = []
    }

    const results = {
      success: true,
      data: responseData,
      consolidated: consolidatedMetrics,
      summary: {
        total_platforms: responseData.length,
        has_instagram: instagramMetrics.length > 0,
        has_facebook: facebookMetrics.length > 0,
        total_followers: consolidatedMetrics?.total_followers || 0,
        total_engagement: consolidatedMetrics?.total_engagement || 0,
        last_update: consolidatedMetrics?.data_referencia || new Date().toISOString().split('T')[0]
      },
      timestamp: new Date().toISOString()
    }

    console.log('Å“â€¦ MÃ¡Â©tricas consolidadas retornadas:', {
      platforms: results.summary.total_platforms,
      total_followers: results.summary.total_followers,
      has_data: responseData.length > 0
    })

    return NextResponse.json(results)

  } catch (error) {
    console.error('ðŸ•’ Erro ao buscar mÃ©tricas Meta:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao buscar mÃ©tricas Meta',
      details: error instanceof Error ? error.message : String(error),
      data: [],
      consolidated: null
    }, { status: 500 });
  }
} 

