import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const userDataHeader = request.headers.get('x-user-data')
    
    if (!userDataHeader) {
      return NextResponse.json({ error: 'Dados do usuÃ¡Â¡rio nÃ¡Â£o encontrados' }, { status: 401 })
    }

    const { bar_id } = JSON.parse(userDataHeader)

    // 1. Verificar credenciais
    const { data: credenciais } = await supabase
      .from('credenciais_integracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('sistema', 'contaazul')
      .single()

    if (!credenciais) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Credenciais nÃ¡Â£o encontradas'
      })
    }

    // 2. Verificar se token estÃ¡Â¡ vÃ¡Â¡lido
    const tokenExpired = credenciais.expires_at && new Date(credenciais.expires_at) < new Date()

    // 3. Verificar dados nas tabelas
    const { data: categorias, count: categoriasCount } = await supabase
      .from('contaazul_categorias')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', bar_id)

    const { data: eventos, count: eventosCount } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', bar_id)

    // 4. Ã¡Å¡ltima sincronizaÃ¡Â§Ã¡Â£o
    const { data: ultimaSync } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('created_at')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 5. Verificar PgCron
    const { data: pgcronJobs } = await supabase
      .rpc('get_cron_jobs')

    const contaazulJob = pgcronJobs?.find((job: any) => 
      job.jobname?.includes(`contaazul_sync_bar_${bar_id}`)
    )

    // 6. EstatÃ¡Â­sticas do mÃ¡Âªs atual
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    
    const { data: statsReceitas } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('valor_total')
      .eq('bar_id', bar_id)
      .eq('tipo_evento', 'receita')
      .gte('competencia', `${currentMonth}-01`)
      .lt('competencia', `${currentMonth}-32`)

    const { data: statsDespesas } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('valor_total')
      .eq('bar_id', bar_id)
      .eq('tipo_evento', 'despesa')
      .gte('competencia', `${currentMonth}-01`)
      .lt('competencia', `${currentMonth}-32`)

    const totalReceitas = statsReceitas?.reduce((sum: any, item: any) => sum + (item.valor_total || 0), 0) || 0
    const totalDespesas = statsDespesas?.reduce((sum: any, item: any) => sum + (item.valor_total || 0), 0) || 0

    return NextResponse.json({
      success: true,
      connected: !tokenExpired,
      credentials: {
        hasCredentials: !!credenciais,
        tokenExpired,
        lastTokenRefresh: credenciais.updated_at,
        expiresAt: credenciais.expires_at
      },
      database: {
        categorias: categoriasCount || 0,
        eventos: eventosCount || 0,
        lastSync: ultimaSync?.created_at
      },
      pgcron: {
        configured: !!contaazulJob,
        jobName: contaazulJob?.jobname,
        schedule: contaazulJob?.schedule,
        nextRun: contaazulJob?.next_run,
        lastRun: contaazulJob?.last_run
      },
      statistics: {
        currentMonth,
        totalReceitas,
        totalDespesas,
        saldoMensal: totalReceitas - totalDespesas,
        transacoesCount: (statsReceitas?.length || 0) + (statsDespesas?.length || 0)
      },
      api: {
        baseUrl: 'https://api-v2.contaazul.com',
        version: 'v2'
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro ao buscar status ContaAzul:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 

