import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzerInput {
  scan_id: string
  bar_id: number
  dados: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { scan_id, bar_id, dados }: AnalyzerInput = await req.json()

    const insights: any[] = []
    const alertas: any[] = []
    const metricas: any[] = []

    // ANÁLISE OPERACIONAL
    if (dados.operacional) {
      const op = dados.operacional

      // Insight: Checklists pendentes
      if (op.checklistsPendentes > 5) {
        insights.push({
          scan_id,
          bar_id,
          tipo: 'alerta',
          categoria: 'operacional',
          titulo: 'Alto número de checklists pendentes',
          descricao: `Existem ${op.checklistsPendentes} checklists pendentes. Isso pode indicar sobrecarga da equipe ou falta de priorização.`,
          impacto: op.checklistsPendentes > 10 ? 'alto' : 'medio',
          dados_suporte: { checklistsPendentes: op.checklistsPendentes },
          acao_sugerida: 'Revisar prioridades e redistribuir tarefas entre a equipe',
          prioridade: op.checklistsPendentes > 10 ? 90 : 70
        })
      }

      // Insight: Taxa de conclusão baixa
      if (op.taxaConclusao < 80) {
        insights.push({
          scan_id,
          bar_id,
          tipo: 'alerta',
          categoria: 'operacional',
          titulo: 'Taxa de conclusão de checklists abaixo do ideal',
          descricao: `A taxa de conclusão está em ${op.taxaConclusao}%, abaixo dos 80% recomendados.`,
          impacto: op.taxaConclusao < 60 ? 'critico' : 'alto',
          dados_suporte: { taxaConclusao: op.taxaConclusao },
          acao_sugerida: 'Investigar motivos de não conclusão e fornecer suporte à equipe',
          prioridade: op.taxaConclusao < 60 ? 95 : 80
        })

        // Alerta crítico se muito baixo
        if (op.taxaConclusao < 60) {
          alertas.push({
            bar_id,
            tipo_alerta: 'taxa_conclusao_critica',
            severidade: 'critical',
            mensagem: `Taxa de conclusão crítica: ${op.taxaConclusao}%`
          })
        }
      }

      // Métrica operacional
      metricas.push({
        bar_id,
        categoria: 'operacional',
        metrica: 'taxa_conclusao_checklists',
        valor: op.taxaConclusao,
        periodo_referencia: 'ultimos_7_dias',
        metadata: { checklistsPendentes: op.checklistsPendentes, execucoes: op.execucoesRecentes }
      })
    }

    // ANÁLISE FINANCEIRA
    if (dados.financeiro) {
      const fin = dados.financeiro

      // Insight: Desempenho semanal
      if (fin.desempenhoSemanal && fin.desempenhoSemanal.length >= 2) {
        const ultimaSemana = fin.desempenhoSemanal[0]
        const penultimaSemana = fin.desempenhoSemanal[1]
        
        if (ultimaSemana.variacao < -10) {
          insights.push({
            scan_id,
            bar_id,
            tipo: 'alerta',
            categoria: 'financeiro',
            titulo: 'Queda significativa no faturamento',
            descricao: `O faturamento caiu ${Math.abs(ultimaSemana.variacao).toFixed(1)}% em relação à semana anterior.`,
            impacto: 'alto',
            dados_suporte: { 
              faturamentoAtual: ultimaSemana.faturamento,
              faturamentoAnterior: penultimaSemana.faturamento,
              variacao: ultimaSemana.variacao
            },
            acao_sugerida: 'Analisar causas da queda: eventos cancelados, problemas operacionais, sazonalidade',
            prioridade: 85
          })

          alertas.push({
            bar_id,
            tipo_alerta: 'queda_faturamento',
            severidade: 'warning',
            mensagem: `Faturamento caiu ${Math.abs(ultimaSemana.variacao).toFixed(1)}%`
          })
        } else if (ultimaSemana.variacao > 20) {
          insights.push({
            scan_id,
            bar_id,
            tipo: 'oportunidade',
            categoria: 'financeiro',
            titulo: 'Crescimento expressivo no faturamento',
            descricao: `O faturamento cresceu ${ultimaSemana.variacao.toFixed(1)}% em relação à semana anterior!`,
            impacto: 'alto',
            dados_suporte: { 
              faturamentoAtual: ultimaSemana.faturamento,
              variacao: ultimaSemana.variacao
            },
            acao_sugerida: 'Identificar fatores de sucesso e replicar estratégias',
            prioridade: 70
          })
        }
      }

      // Insight: Ticket médio
      if (fin.ticketMedio > 0) {
        insights.push({
          scan_id,
          bar_id,
          tipo: 'tendencia',
          categoria: 'financeiro',
          titulo: 'Análise de ticket médio',
          descricao: `Ticket médio atual: R$ ${fin.ticketMedio.toFixed(2)}`,
          impacto: 'medio',
          dados_suporte: { ticketMedio: fin.ticketMedio },
          acao_sugerida: 'Comparar com períodos anteriores e buscar oportunidades de upsell',
          prioridade: 50
        })
      }

      // Métricas financeiras
      metricas.push(
        {
          bar_id,
          categoria: 'financeiro',
          metrica: 'total_vendas',
          valor: fin.totalVendas,
          periodo_referencia: `ultimos_${fin.diasAnalisados}_dias`
        },
        {
          bar_id,
          categoria: 'financeiro',
          metrica: 'ticket_medio',
          valor: fin.ticketMedio,
          periodo_referencia: `ultimos_${fin.diasAnalisados}_dias`
        }
      )
    }

    // ANÁLISE EXPERIÊNCIA DO CLIENTE
    if (dados.experiencia) {
      const exp = dados.experiencia

      // Insight: NPS
      if (exp.npsScore !== null) {
        const nps = parseFloat(exp.npsScore)
        let tipo = 'tendencia'
        let impacto = 'medio'
        let titulo = ''
        let descricao = ''

        if (nps >= 75) {
          tipo = 'oportunidade'
          impacto = 'alto'
          titulo = 'NPS Excelente!'
          descricao = `Seu NPS está em ${nps}%, na zona de excelência! Clientes promotores são maioria.`
        } else if (nps >= 50) {
          titulo = 'NPS em nível bom'
          descricao = `NPS em ${nps}%. Há margem para melhorias na experiência do cliente.`
        } else if (nps >= 0) {
          tipo = 'alerta'
          impacto = 'alto'
          titulo = 'NPS precisa de atenção'
          descricao = `NPS em ${nps}%. É necessário trabalhar na satisfação dos clientes.`
        } else {
          tipo = 'alerta'
          impacto = 'critico'
          titulo = 'NPS crítico'
          descricao = `NPS em ${nps}%. Clientes detratores são maioria. Ação urgente necessária.`
        }

        insights.push({
          scan_id,
          bar_id,
          tipo,
          categoria: 'experiencia',
          titulo,
          descricao,
          impacto,
          dados_suporte: { npsScore: nps, totalAvaliacoes: exp.totalAvaliacoes },
          acao_sugerida: nps < 50 
            ? 'Analisar feedbacks negativos e implementar melhorias urgentes'
            : 'Continuar monitorando e buscar feedback ativo',
          prioridade: nps < 0 ? 95 : (nps < 50 ? 80 : 60)
        })

        if (nps < 0) {
          alertas.push({
            bar_id,
            tipo_alerta: 'nps_critico',
            severidade: 'critical',
            mensagem: `NPS crítico: ${nps}%`
          })
        }
      }

      // Métrica experiência
      if (exp.npsScore !== null) {
        metricas.push({
          bar_id,
          categoria: 'experiencia',
          metrica: 'nps_score',
          valor: exp.npsScore,
          periodo_referencia: 'ultimos_7_dias',
          metadata: { totalAvaliacoes: exp.totalAvaliacoes }
        })
      }
    }

    // ANÁLISE EQUIPE
    if (dados.equipe) {
      const equipe = dados.equipe

      // Insight: Produtividade da equipe
      const mediaExec = parseFloat(equipe.mediaExecucoesPorFuncionario)
      if (mediaExec < 5) {
        insights.push({
          scan_id,
          bar_id,
          tipo: 'alerta',
          categoria: 'equipe',
          titulo: 'Baixa produtividade da equipe',
          descricao: `Média de ${mediaExec} execuções por funcionário nos últimos 7 dias.`,
          impacto: 'medio',
          dados_suporte: { 
            mediaExecucoes: mediaExec,
            totalFuncionarios: equipe.totalFuncionarios
          },
          acao_sugerida: 'Verificar se há sobrecarga ou falta de engajamento',
          prioridade: 65
        })
      }

      metricas.push({
        bar_id,
        categoria: 'equipe',
        metrica: 'media_execucoes_funcionario',
        valor: mediaExec,
        periodo_referencia: 'ultimos_7_dias'
      })
    }

    // SALVAR INSIGHTS
    let insightsInseridos = 0
    if (insights.length > 0) {
      const { data: insightsData, error: insightsError } = await supabase
        .from('agente_insights')
        .insert(insights)
        .select()

      if (!insightsError) {
        insightsInseridos = insightsData.length

        // Criar alertas vinculados aos insights
        const alertasComInsight = alertas.map((alerta, index) => ({
          ...alerta,
          insight_id: insightsData[index]?.id || insightsData[0]?.id
        }))

        if (alertasComInsight.length > 0) {
          await supabase.from('agente_alertas').insert(alertasComInsight)
        }
      }
    }

    // SALVAR MÉTRICAS
    if (metricas.length > 0) {
      await supabase.from('agente_metricas').insert(metricas)
    }

    // ATUALIZAR SCAN
    await supabase
      .from('agente_scans')
      .update({
        insights_encontrados: insightsInseridos,
        alertas_gerados: alertas.length
      })
      .eq('id', scan_id)

    // REGISTRAR APRENDIZADO
    await supabase.from('agente_aprendizado').insert({
      bar_id,
      tipo_evento: 'analise_completa',
      contexto: { scan_id, insights: insightsInseridos, alertas: alertas.length },
      resultado: { sucesso: true },
      score: insightsInseridos * 10 + alertas.length * 5
    })

    return new Response(
      JSON.stringify({
        success: true,
        insights_gerados: insightsInseridos,
        alertas_gerados: alertas.length,
        metricas_salvas: metricas.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no agente-analyzer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
