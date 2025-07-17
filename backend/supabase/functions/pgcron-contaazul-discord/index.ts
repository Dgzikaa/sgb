import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, barId } = await req.json()

    if (!barId) {
      throw new Error('barId ·© obrigat·≥rio')
    }

    console.log(`ü§ñ PGCRON Manager - A·ß·£o: ${action}, Bar: ${barId}`)

    switch (action) {
      case 'configure':
        return await configurarCronJob(supabaseClient, barId)
      case 'status':
        return await verificarStatus(supabaseClient, barId)
      case 'remove':
        return await removerCronJob(supabaseClient, barId)
      default:
        throw new Error('A·ß·£o n·£o reconhecida: ' + action)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('ùå Erro no PGCRON Manager:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function configurarCronJob(supabaseClient, barId: string) {
  try {
    console.log(`üîß Configurando cron job para bar ${barId}`)

    // 1. Verificar se j·° existe um job para este bar
    const { data: existingJobs } = await supabaseClient.rpc('verificar_cron_jobs_contaazul', {
      target_bar_id: barId
    })

    if (existingJobs && existingJobs.length > 0) {
      console.log(`ö†Ô∏è Job j·° existe para bar ${barId}, removendo primeiro...`)
      await removerCronJobInternal(supabaseClient, barId)
    }

    // 2. Criar novo job - executa a cada 4 horas (8h, 12h, 16h, 20h, 0h, 4h)
    const cronExpression = '0 4,8,12,16,20,0 * * *'  // A cada 4 horas
    const jobName = `contaazul_sync_bar_${barId}`

    const { data, error } = await supabaseClient.rpc('criar_cron_job_contaazul', {
      job_name: jobName,
      schedule: cronExpression,
      bar_id: barId
    })

    if (error) {
      throw new Error(`Erro ao criar cron job: ${error.message}`)
    }

    console.log(`úÖ Cron job criado com sucesso: ${jobName}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cron job configurado com sucesso',
        jobName,
        schedule: cronExpression,
        nextRun: 'Pr·≥xima execu·ß·£o conforme cronograma'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('ùå Erro ao configurar cron job:', errorMessage)
    throw error
  }
}

async function verificarStatus(supabaseClient, barId: string) {
  try {
    console.log(`üîç Verificando status do cron job para bar ${barId}`)

    // Verificar jobs ativos do pgcron
    const { data: jobs, error } = await supabaseClient.rpc('verificar_cron_jobs_contaazul', {
      target_bar_id: barId
    })

    if (error) {
      throw new Error(`Erro ao verificar status: ${error.message}`)
    }

    // Verificar ·∫ltimas execu·ß·µes
    const { data: lastRuns } = await supabaseClient.rpc('verificar_ultimas_execucoes_contaazul', {
      target_bar_id: barId,
      limit_count: 5
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        activeJobs: jobs || [],
        lastRuns: lastRuns || [],
        hasActiveJob: jobs && jobs.length > 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('ùå Erro ao verificar status:', errorMessage)
    throw error
  }
}

async function removerCronJob(supabaseClient, barId: string) {
  try {
    await removerCronJobInternal(supabaseClient, barId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cron job removido com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('ùå Erro ao remover cron job:', errorMessage)
    throw error
  }
}

async function removerCronJobInternal(supabaseClient, barId: string) {
  console.log(`üóëÔ∏è Removendo cron job para bar ${barId}`)

  const jobName = `contaazul_sync_bar_${barId}`

  const { error } = await supabaseClient.rpc('remover_cron_job_contaazul', {
    job_name: jobName
  })

  if (error) {
    throw new Error(`Erro ao remover cron job: ${error.message}`)
  }

  console.log(`úÖ Cron job removido: ${jobName}`)
} 
