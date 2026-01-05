import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanConfig {
  bar_id: number
  tipo_scan: 'operacional' | 'financeiro' | 'experiencia' | 'equipe' | 'completo'
  periodo_dias?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { bar_id, tipo_scan = 'completo', periodo_dias = 7 }: ScanConfig = await req.json()

    if (!bar_id) {
      throw new Error('bar_id é obrigatório')
    }

    const startTime = Date.now()

    // Criar registro de scan
    const { data: scanData, error: scanError } = await supabase
      .from('agente_scans')
      .insert({
        bar_id,
        tipo_scan,
        status: 'processing'
      })
      .select()
      .single()

    if (scanError) throw scanError

    const scanId = scanData.id

    // COLETA DE DADOS POR TIPO DE SCAN
    const dadosColetados: any = {}

    try {
      // 1. SCAN OPERACIONAL
      if (tipo_scan === 'operacional' || tipo_scan === 'completo') {
        // Checklists pendentes
        const { data: checklistsPendentes } = await supabase
          .from('checklist_agendamentos')
          .select('*, checklists(*)')
          .eq('bar_id', bar_id)
          .eq('status', 'pendente')
          .gte('data_agendada', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())

        // Execuções de checklists recentes
        const { data: execucoesRecentes } = await supabase
          .from('checklist_executions')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('data_execucao', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())
          .order('data_execucao', { ascending: false })

        // Taxa de conclusão
        const taxaConclusao = execucoesRecentes 
          ? (execucoesRecentes.filter(e => e.status === 'concluido').length / execucoesRecentes.length * 100).toFixed(1)
          : 0

        dadosColetados.operacional = {
          checklistsPendentes: checklistsPendentes?.length || 0,
          execucoesRecentes: execucoesRecentes?.length || 0,
          taxaConclusao,
          detalhes: {
            pendentes: checklistsPendentes,
            execucoes: execucoesRecentes?.slice(0, 10) // Últimas 10
          }
        }
      }

      // 2. SCAN FINANCEIRO
      if (tipo_scan === 'financeiro' || tipo_scan === 'completo') {
        const dataInicio = new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        // Dados ContaHub
        const { data: contahubPeriodo } = await supabase
          .from('contahub_periodo')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('data', dataInicio)
          .order('data', { ascending: false })

        const { data: contahubPagamentos } = await supabase
          .from('contahub_pagamentos')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('data', dataInicio)

        // Calcular métricas financeiras
        const totalVendas = contahubPeriodo?.reduce((sum, p) => sum + (p.total_vendido || 0), 0) || 0
        const ticketMedio = contahubPeriodo?.reduce((sum, p) => sum + (p.ticket_medio || 0), 0) / (contahubPeriodo?.length || 1) || 0
        const totalPagamentos = contahubPagamentos?.reduce((sum, p) => sum + (p.valor || 0), 0) || 0

        // Desempenho semanal
        const { data: desempenhoSemanal } = await supabase
          .from('desempenho_semanal')
          .select('*')
          .eq('bar_id', bar_id)
          .order('semana', { ascending: false })
          .limit(4)

        dadosColetados.financeiro = {
          totalVendas,
          ticketMedio,
          totalPagamentos,
          diasAnalisados: periodo_dias,
          desempenhoSemanal: desempenhoSemanal?.map(d => ({
            semana: d.semana,
            faturamento: d.faturamento_total,
            variacao: d.variacao_semana_anterior
          }))
        }
      }

      // 3. SCAN EXPERIÊNCIA DO CLIENTE
      if (tipo_scan === 'experiencia' || tipo_scan === 'completo') {
        // NPS
        const { data: npsData } = await supabase
          .from('nps')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('created_at', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())

        const npsScore = npsData?.length 
          ? (npsData.filter(n => n.nota >= 9).length / npsData.length * 100 - 
             npsData.filter(n => n.nota <= 6).length / npsData.length * 100).toFixed(1)
          : null

        // Pesquisa de felicidade
        const { data: felicidadeData } = await supabase
          .from('pesquisa_felicidade')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('created_at', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())

        const mediaFelicidade = felicidadeData?.length
          ? (felicidadeData.reduce((sum, f) => sum + (f.nota || 0), 0) / felicidadeData.length).toFixed(1)
          : null

        dadosColetados.experiencia = {
          npsScore,
          totalAvaliacoes: npsData?.length || 0,
          mediaFelicidade,
          totalPesquisas: felicidadeData?.length || 0
        }
      }

      // 4. SCAN DESEMPENHO DE EQUIPE
      if (tipo_scan === 'equipe' || tipo_scan === 'completo') {
        // Funcionários ativos
        const { data: funcionarios } = await supabase
          .from('usuarios_bar')
          .select('user_id, role')
          .eq('bar_id', bar_id)
          .eq('ativo', true)

        // Execuções de checklist por funcionário
        const { data: execucoesFuncionario } = await supabase
          .from('checklist_funcionario')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('created_at', new Date(Date.now() - periodo_dias * 24 * 60 * 60 * 1000).toISOString())

        dadosColetados.equipe = {
          totalFuncionarios: funcionarios?.length || 0,
          execucoesRealizadas: execucoesFuncionario?.length || 0,
          mediaExecucoesPorFuncionario: funcionarios?.length 
            ? ((execucoesFuncionario?.length || 0) / funcionarios.length).toFixed(1)
            : 0
        }
      }

      // Atualizar scan com dados coletados
      const tempoExecucao = Date.now() - startTime

      await supabase
        .from('agente_scans')
        .update({
          status: 'completed',
          dados_coletados: dadosColetados,
          tempo_execucao_ms: tempoExecucao
        })
        .eq('id', scanId)

      // Chamar analyzer para processar dados
      const analyzerUrl = `${supabaseUrl}/functions/v1/agente-analyzer`
      await fetch(analyzerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scan_id: scanId,
          bar_id,
          dados: dadosColetados
        })
      })

      return new Response(
        JSON.stringify({
          success: true,
          scan_id: scanId,
          dados_coletados: dadosColetados,
          tempo_execucao_ms: tempoExecucao
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      // Atualizar scan com erro
      await supabase
        .from('agente_scans')
        .update({
          status: 'failed',
          erro: error.message
        })
        .eq('id', scanId)

      throw error
    }

  } catch (error) {
    console.error('Erro no agente-scanner:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
