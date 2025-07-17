import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { barId, action = 'configure' } = await request.json()

    if (!barId) {
      return NextResponse.json({ error: 'barId ·© obrigat·≥rio' }, { status: 400 })
    }

    console.log(`ü§ñ Configurando pgcron META - Bar: ${barId}, A·ß·£o: ${action}`)

    switch (action) {
      case 'configure':
        return await configurarCronJobMeta(barId)
      case 'status':
        return await verificarStatusMeta(barId)
      case 'remove':
        return await removerCronJobMeta(barId)
      case 'test':
        return await testarColetaMeta(barId)
      default:
        return NextResponse.json({ error: 'A·ß·£o n·£o reconhecida' }, { status: 400 })
    }

  } catch (error) {
    console.error('ùå Erro na configura·ß·£o pgcron META:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }, { status: 500 })
  }
}

async function configurarCronJobMeta(barId: string) {
  try {
    console.log(`üîß Configurando cron job META para bar ${barId}`)

    // 1. Remover jobs existentes
    const jobName = `meta_sync_bar_${barId}`
    const { error: removeError } = await supabase.rpc('cron_unschedule_by_name', {
      job_name: jobName
    })

    if (removeError) {
      console.warn('ö†Ô∏è Job anterior n·£o encontrado ou j·° removido:', removeError)
    }

    // 2. Criar novo job - executa 2x por dia (8h e 20h) para economia de recursos
    const cronExpression = '0 8,20 * * *'  // 8h e 20h todos os dias
    
    // 3. Comando SQL que chama a API de coleta autom·°tica
    const comando = `
    SELECT net.http_post(
      url := '${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/meta/auto-collect',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sgb-meta-cron-2025'
      ),
      body := jsonb_build_object(
        'automatic', true,
        'source', 'pgcron',
        'bar_id', ${barId},
        'timestamp', now()
      )
    );`

    const { data, error } = await supabase.rpc('cron_schedule', {
      jobname: jobName,
      schedule: cronExpression,
      command: comando
    })

    if (error) {
      throw new Error(`Erro ao criar cron job META: ${error.message}`)
    }

    console.log(`úÖ Cron job META criado: ${jobName}`)

    // 4. Verificar se existem credenciais Meta ativas
    const { data: metaConfig, error: metaError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'meta')
      .eq('ativo', true)
      .single()

    const hasValidConfig = !metaError && metaConfig && metaConfig.access_token

    return NextResponse.json({
      success: true,
      message: 'Cron job META configurado com sucesso',
      jobName,
      schedule: cronExpression,
      schedule_description: 'Executa 2x por dia: 8h e 20h (manh·£ e noite)',
      api_calls_per_day: 10, // 2 execu·ß·µes ·ó 5 calls cada
      next_runs: [
        'Pr·≥xima execu·ß·£o: 8:00 (manh·£) e 20:00 (noite)',
        'Timezone: UTC (ajustar conforme necess·°rio)'
      ],
      meta_config_status: hasValidConfig ? 'Configurado' : 'Pendente',
      warning: hasValidConfig ? null : 'Configure primeiro as credenciais Meta em /configuracoes/meta-configuracao'
    })

  } catch (error) {
    throw error
  }
}

async function verificarStatusMeta(barId: string) {
  try {
    console.log(`üîç Verificando status do cron job META para bar ${barId}`)

    const jobName = `meta_sync_bar_${barId}`

    // Verificar se job existe
    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('jobname', jobName)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Job n·£o encontrado',
        hasActiveJob: false
      })
    }

    // Verificar ·∫ltimas execu·ß·µes
    const { data: lastRuns } = await supabase
      .from('cron_job_run_details')
      .select('*')
      .eq('job_name', jobName)
      .order('start_time', { ascending: false })
      .limit(5)

    // Verificar configura·ß·£o Meta
    const { data: metaConfig } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'meta')
      .eq('ativo', true)
      .single()

    return NextResponse.json({
      success: true,
      hasActiveJob: true,
      jobDetails: {
        name: jobs.jobname,
        schedule: jobs.schedule,
        command: jobs.command,
        active: jobs.active,
        database: jobs.database
      },
      lastRuns: lastRuns || [],
      metaConfigStatus: metaConfig ? 'Configurado' : 'Pendente',
      nextExecution: getNextExecutionTime()
    })

  } catch (error) {
    throw error
  }
}

async function removerCronJobMeta(barId: string) {
  try {
    console.log(`üóëÔ∏è Removendo cron job META para bar ${barId}`)

    const jobName = `meta_sync_bar_${barId}`

    const { error } = await supabase.rpc('cron_unschedule_by_name', {
      job_name: jobName
    })

    if (error) {
      throw new Error(`Erro ao remover cron job META: ${error.message}`)
    }

    console.log(`úÖ Cron job META removido: ${jobName}`)

    return NextResponse.json({
      success: true,
      message: 'Cron job META removido com sucesso'
    })

  } catch (error) {
    throw error
  }
}

async function testarColetaMeta(barId: string) {
  try {
    console.log(`üß™ Testando coleta META para bar ${barId}`)

    // Chamar a API de coleta manualmente
    const response = await fetch('https://sgbv2.vercel.app/api/meta/auto-collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-meta-cron-2025'
      },
      body: JSON.stringify({
        automatic: false,
        source: 'test_manual',
        bar_id: parseInt(barId),
        timestamp: new Date().toISOString()
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Erro no teste: ${result.error || 'Erro desconhecido'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de coleta META executado com sucesso',
      result: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    throw error
  }
}

function getNextExecutionTime() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Pr·≥ximas execu·ß·µes: 8h e 20h
  const morning = new Date(today.getTime() + 8 * 60 * 60 * 1000) // 8h
  const evening = new Date(today.getTime() + 20 * 60 * 60 * 1000) // 20h
  
  if (now < morning) {
    return morning.toISOString()
  } else if (now < evening) {
    return evening.toISOString()
  } else {
    // Pr·≥xima execu·ß·£o ·© amanh·£ ·†s 8h
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    return new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000).toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint para verificar status geral do pgcron META
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    if (!barId) {
      return NextResponse.json({ error: 'bar_id ·© obrigat·≥rio' }, { status: 400 })
    }

    return await verificarStatusMeta(barId)

  } catch (error) {
    console.error('ùå Erro na verifica·ß·£o de status META:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }, { status: 500 })
  }
} 
