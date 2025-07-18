import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { barId, action = 'configure' } = await request.json()

    if (!barId) {
      return NextResponse.json({ error: 'barId Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log(`Ã°Å¸Â¤â€“ Configurando pgcron V2 - Bar: ${barId}, AÃ¡Â§Ã¡Â£o: ${action}`)

    switch (action) {
      case 'configure':
        return await configurarCronJob(supabase, barId)
      case 'status':
        return await verificarStatus(supabase, barId)
      case 'remove':
        return await removerCronJob(supabase, barId)
      case 'test':
        return await testarSyncManual(supabase, barId)
      default:
        return NextResponse.json({ error: 'AÃ¡Â§Ã¡Â£o nÃ¡Â£o reconhecida' }, { status: 400 })
    }

  } catch (error) {
    console.error('ÂÅ’ Erro na configuraÃ¡Â§Ã¡Â£o pgcron V2:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }, { status: 500 })
  }
}

async function configurarCronJob(supabase: unknown, barId: string) {
  try {
    console.log(`Ã°Å¸â€Â§ Configurando cron job para bar ${barId}`)

    // 1. Remover jobs existentes
    const { error: removeError } = await supabase.rpc('cron_unschedule_by_name', {
      job_name: `contaazul_sync_bar_${barId}`
    })

    if (removeError) {
      console.warn('Å¡Â Ã¯Â¸Â Job anterior nÃ¡Â£o encontrado ou jÃ¡Â¡ removido:', removeError)
    }

    // 2. Criar novo job - executa a cada 4 horas (4h, 8h, 12h, 16h, 20h, 0h)
    const cronExpression = '0 0,4,8,12,16,20 * * *'  // A cada 4 horas
    const jobName = `contaazul_sync_bar_${barId}`

    // 3. Comando SQL que chama a edge function
    const comando = `
    SELECT net.http_post(
      url := '${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contaazul-sync-automatico',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}'
      ),
      body := jsonb_build_object(
        'barId', '${barId}',
        'source', 'pgcron'
      )
    );`

    const { data, error } = await supabase.rpc('cron_schedule', {
      jobname: jobName,
      schedule: cronExpression,
      command: comando
    })

    if (error) {
      throw new Error(`Erro ao criar cron job: ${error.message}`)
    }

    console.log(`Å“â€¦ Cron job criado: ${jobName}`)

    return NextResponse.json({
      success: true,
      message: 'Cron job configurado com sucesso',
      jobName,
      schedule: cronExpression,
      command: comando,
      nextRuns: [
        'PrÃ¡Â³xima execuÃ¡Â§Ã¡Â£o: conforme cronograma',
        'HorÃ¡Â¡rios: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00',
        'Timezone: UTC (ajustar conforme necessÃ¡Â¡rio)'
      ]
    })

  } catch (error) {
    throw error
  }
}

async function verificarStatus(supabase: unknown, barId: string) {
  try {
    console.log(`Ã°Å¸â€Â Verificando status para bar ${barId}`)

    // 1. Verificar jobs ativos
    const { data: jobs, error: jobsError } = await supabase
      .from('cron.job')
      .select('*')
      .ilike('jobname', `%contaazul_sync_bar_${barId}%`)

    if (jobsError) {
      console.warn('Å¡Â Ã¯Â¸Â Erro ao buscar jobs:', jobsError)
    }

    // 2. Verificar Ã¡Âºltimas execuÃ¡Â§Ã¡Âµes
    const { data: runs, error: runsError } = await supabase
      .from('cron.job_run_details')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(5)

    if (runsError) {
      console.warn('Å¡Â Ã¯Â¸Â Erro ao buscar execuÃ¡Â§Ã¡Âµes:', runsError)
    }

    // 3. Status da edge function
    const edgeFunctionStatus = await testarEdgeFunction(barId)

    return NextResponse.json({
      success: true,
      activeJobs: jobs || [],
      recentRuns: runs || [],
      hasActiveJob: jobs && jobs.length > 0,
      edgeFunction: edgeFunctionStatus,
      status: {
        configured: jobs && jobs.length > 0,
        lastRun: runs && runs.length > 0 ? runs[0].start_time : 'Nunca executado',
        nextRun: 'Conforme cronograma'
      }
    })

  } catch (error) {
    throw error
  }
}

async function removerCronJob(supabase: unknown, barId: string) {
  try {
    console.log(`Ã°Å¸â€”â€˜Ã¯Â¸Â Removendo cron job para bar ${barId}`)

    const jobName = `contaazul_sync_bar_${barId}`

    const { error } = await supabase.rpc('cron_unschedule_by_name', {
      job_name: jobName
    })

    if (error) {
      throw new Error(`Erro ao remover cron job: ${error.message}`)
    }

    console.log(`Å“â€¦ Cron job removido: ${jobName}`)

    return NextResponse.json({
      success: true,
      message: 'Cron job removido com sucesso',
      jobName
    })

  } catch (error) {
    throw error
  }
}

async function testarSyncManual(supabase: unknown, barId: string) {
  try {
    console.log(`Ã°Å¸Â§Âª Testando sync manual para bar ${barId}`)

    // Chamar edge function diretamente para teste
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contaazul-sync-automatico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        barId,
        source: 'teste_manual'
      })
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Teste executado com sucesso' : 'Erro no teste',
      result,
      status: response.status
    })

  } catch (error) {
    throw error
  }
}

async function testarEdgeFunction(barId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contaazul-sync-automatico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        barId,
        source: 'status_check'
      })
    })

    return {
      available: response.ok,
      status: response.status,
      message: response.ok ? 'Edge function funcionando' : 'Edge function com problemas'
    }
  } catch (error) {
    return {
      available: false,
      status: 500,
      message: 'Erro ao conectar com edge function'
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barId = searchParams.get('barId')
  const action = searchParams.get('action') || 'status'

  if (!barId) {
    return NextResponse.json({ error: 'barId Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 })
  }

  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ barId, action })
  }))
} 

