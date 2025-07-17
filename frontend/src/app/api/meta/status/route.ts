import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const userDataHeader = request.headers.get('x-user-data')
    
    if (!userDataHeader) {
      return NextResponse.json({ error: 'Dados do usuário não encontrados' }, { status: 401 })
    }

    const { bar_id } = JSON.parse(userDataHeader)

    // 1. Verificar credenciais Meta
    const { data: credenciais } = await supabase
      .from('credenciais_integracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('sistema', 'meta')
      .single()

    if (!credenciais) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Credenciais Meta não encontradas'
      })
    }

    // 2. Verificar se token está válido
    const hasValidToken = !!credenciais.access_token

    // 3. Verificar dados coletados
    const { data: instagramPosts, count: instagramCount } = await supabase
      .from('meta_instagram_posts')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', bar_id)

    const { data: facebookPosts, count: facebookCount } = await supabase
      .from('meta_facebook_posts')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', bar_id)

    const { data: instagramInsights, count: insightsCount } = await supabase
      .from('meta_instagram_insights')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', bar_id)

    // 4. Última coleta
    const { data: ultimaColeta } = await supabase
      .from('meta_coletas_log')
      .select('*')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 5. Verificar PgCron Meta
    const { data: pgcronJobs } = await supabase
      .rpc('get_cron_jobs')

    const metaJob = pgcronJobs?.find((job: any) => 
      job.jobname?.includes(`meta_sync_bar_${bar_id}`)
    )

    // 6. Estatísticas recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentInstagramPosts } = await supabase
      .from('meta_instagram_posts')
      .select('engagement_rate, likes_count, comments_count')
      .eq('bar_id', bar_id)
      .gte('created_time', thirtyDaysAgo.toISOString())

    const { data: recentFacebookPosts } = await supabase
      .from('meta_facebook_posts')
      .select('engagement_rate, likes_count, comments_count, shares_count')
      .eq('bar_id', bar_id)
      .gte('created_time', thirtyDaysAgo.toISOString())

    // 7. Calcular métricas
    const totalEngagement = [
      ...(recentInstagramPosts || []),
      ...(recentFacebookPosts || [])
    ].reduce((sum, post) => sum + (post.engagement_rate || 0), 0)

    const totalLikes = [
      ...(recentInstagramPosts || []),
      ...(recentFacebookPosts || [])
    ].reduce((sum, post) => sum + (post.likes_count || 0), 0)

    const totalComments = [
      ...(recentInstagramPosts || []),
      ...(recentFacebookPosts || [])
    ].reduce((sum, post) => sum + (post.comments_count || 0), 0)

    const totalPosts = (recentInstagramPosts?.length || 0) + (recentFacebookPosts?.length || 0)
    const averageEngagement = totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(2) : '0'

    // 8. Informações das páginas configuradas
    let pageInfo = {}
    if (credenciais.configuracao_json) {
      try {
        const config = JSON.parse(credenciais.configuracao_json)
        pageInfo = {
          facebookPageId: config.facebook_page_id,
          instagramAccountId: config.instagram_account_id,
          appId: config.app_id
        }
      } catch (e) {
        console.warn('Erro ao parsear configuração Meta:', e)
      }
    }

    return NextResponse.json({
      success: true,
      connected: hasValidToken,
      credentials: {
        hasCredentials: !!credenciais,
        hasValidToken,
        lastUpdate: credenciais.updated_at,
        expiresAt: credenciais.expires_at,
        pageInfo
      },
      database: {
        instagramPosts: instagramCount || 0,
        facebookPosts: facebookCount || 0,
        insights: insightsCount || 0,
        totalDataPoints: (instagramCount || 0) + (facebookCount || 0) + (insightsCount || 0)
      },
      lastCollection: {
        date: ultimaColeta?.created_at,
        success: ultimaColeta?.success || false,
        instagram_posts: ultimaColeta?.instagram_posts || 0,
        facebook_posts: ultimaColeta?.facebook_posts || 0,
        insights_collected: ultimaColeta?.insights_collected || 0,
        error: ultimaColeta?.error_message
      },
      pgcron: {
        configured: !!metaJob,
        jobName: metaJob?.jobname,
        schedule: metaJob?.schedule || 'A cada 6 horas',
        nextRun: metaJob?.next_run,
        lastRun: metaJob?.last_run
      },
      statistics: {
        period: 'Últimos 30 dias',
        totalPosts,
        totalLikes,
        totalComments,
        averageEngagement: `${averageEngagement}%`,
        instagramPostsRecent: recentInstagramPosts?.length || 0,
        facebookPostsRecent: recentFacebookPosts?.length || 0
      },
      api: {
        baseUrl: 'https://graph.facebook.com',
        version: 'v18.0',
        dataTypes: ['posts', 'insights', 'engagement', 'reach']
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar status Meta:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 
