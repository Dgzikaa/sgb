// ✅ EDGE FUNCTION - Cron Job ContaAzul (4 em 4 horas)
// Executa sincronização automática para todos os bares ativos
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CronResponse {
  success: boolean
  message: string
  execucoes: Array<{
    bar_id: number
    resultado: 'sucesso' | 'erro' | 'ja_sincronizado'
    detalhes?: string
    tempo_ms?: number
  }>
  total_bares: number
  sucessos: number
  erros: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('⏰ CRON JOB: ContaAzul Sync iniciado...')

    // Configuração do Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const inicioExecucao = Date.now()
    
    // Buscar todos os bares com ContaAzul ativo
    const { data: configsAtivas } = await supabaseClient
      .from('contaazul_config')
      .select('bar_id')
      .eq('sincronizacao_ativa', true)

    if (!configsAtivas || configsAtivas.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhum bar com sincronização ativa',
        execucoes: [],
        total_bares: 0,
        sucessos: 0,
        erros: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`📊 Encontrados ${configsAtivas.length} bares com sincronização ativa`)

    const execucoes: Array<{
      bar_id: number
      resultado: 'sucesso' | 'erro' | 'ja_sincronizado'
      detalhes?: string
      tempo_ms?: number
    }> = []
    let sucessos = 0
    let erros = 0

    // Executar sincronização para cada bar
    for (const config of configsAtivas) {
      const barId = config.bar_id
      const inicioBar = Date.now()

      try {
        console.log(`🏪 Processando bar_id: ${barId}`)

        // Verificar se já foi sincronizado nas últimas 4 horas
        const quatroHorasAtras = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        
        const { data: ultimaSync } = await supabaseClient
          .from('contaazul_sync_log')
          .select('*')
          .eq('bar_id', barId)
          .eq('tipo_operacao', 'COLETA_DETALHES')
          .gte('iniciado_em', quatroHorasAtras)
          .order('iniciado_em', { ascending: false })
          .limit(1)
          .single()

        if (ultimaSync) {
          console.log(`⏭️ Bar ${barId} já sincronizado recentemente`)
          execucoes.push({
            bar_id: barId,
            resultado: 'ja_sincronizado',
            detalhes: `Última sincronização: ${ultimaSync.iniciado_em}`,
            tempo_ms: Date.now() - inicioBar
          })
          continue
        }

        // Verificar se tem credenciais válidas
        const { data: credentials } = await supabaseClient
          .from('api_credentials')
          .select('access_token, expires_at')
          .eq('bar_id', barId)
          .single()

        if (!credentials?.access_token) {
          console.log(`❌ Bar ${barId} sem credenciais válidas`)
          execucoes.push({
            bar_id: barId,
            resultado: 'erro',
            detalhes: 'Credenciais não encontradas',
            tempo_ms: Date.now() - inicioBar
          })
          erros++
          continue
        }

        // Verificar se token não expirou
        if (credentials.expires_at && new Date(credentials.expires_at) < new Date()) {
          console.log(`❌ Bar ${barId} com token expirado`)
          execucoes.push({
            bar_id: barId,
            resultado: 'erro',
            detalhes: 'Token expirado',
            tempo_ms: Date.now() - inicioBar
          })
          erros++
          continue
        }

        // Chamar Edge Function de sincronização
        const syncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/contaazul-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bar_id: barId,
            // Sincronizar mês atual
            data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            data_fim: new Date().toISOString().split('T')[0]
          })
        })

        const syncData = await syncResponse.json()

        if (syncResponse.ok && syncData.success) {
          console.log(`✅ Bar ${barId} sincronizado com sucesso`)
          execucoes.push({
            bar_id: barId,
            resultado: 'sucesso',
            detalhes: `${syncData.resultado.receitas.processadas} receitas, ${syncData.resultado.despesas.processadas} despesas`,
            tempo_ms: Date.now() - inicioBar
          })
          sucessos++
        } else {
          console.log(`❌ Erro na sincronização do bar ${barId}:`, syncData.erro)
          execucoes.push({
            bar_id: barId,
            resultado: 'erro',
            detalhes: syncData.erro || 'Erro na sincronização',
            tempo_ms: Date.now() - inicioBar
          })
          erros++
        }

      } catch (error) {
        console.error(`❌ Erro ao processar bar ${barId}:`, error)
        execucoes.push({
          bar_id: barId,
          resultado: 'erro',
          detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
          tempo_ms: Date.now() - inicioBar
        })
        erros++
      }

      // Pequena pausa entre bares para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const tempoTotal = Date.now() - inicioExecucao

    console.log(`🎯 CRON JOB CONCLUÍDO: ${sucessos} sucessos, ${erros} erros em ${tempoTotal}ms`)

    const response: CronResponse = {
      success: true,
      message: `Cron job concluído: ${sucessos} sucessos, ${erros} erros`,
      execucoes,
      total_bares: configsAtivas.length,
      sucessos,
      erros
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Erro no cron job:', error)
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro no cron job',
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      execucoes: [],
      total_bares: 0,
      sucessos: 0,
      erros: 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 