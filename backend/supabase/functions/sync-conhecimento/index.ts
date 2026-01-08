import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  barId?: number;
  forceUpdate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { barId = 3, forceUpdate = false }: SyncRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔄 Iniciando sync de conhecimento...')

    const atualizacoes: string[] = []
    const hoje = new Date()

    // ===== 1. Atualizar métricas recentes =====
    console.log('📊 Atualizando métricas recentes...')

    // Última semana
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - 7)

    const { data: eventosRecentes } = await supabase
      .from('eventos_base')
      .select('real_r, m1_r, cl_real')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .gte('data_evento', inicioSemana.toISOString().split('T')[0])

    const fatSemana = eventosRecentes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
    const metaSemana = eventosRecentes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0
    const clientesSemana = eventosRecentes?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0
    const ticketMedio = clientesSemana > 0 ? fatSemana / clientesSemana : 0

    // Salvar ou atualizar regra dinâmica
    await supabase.from('agente_regras_dinamicas').upsert({
      id: 'metricas_semana',
      bar_id: barId,
      nome: 'Métricas da Semana',
      tipo: 'metricas',
      valor: JSON.stringify({
        faturamento: fatSemana,
        meta: metaSemana,
        atingimento: metaSemana > 0 ? (fatSemana / metaSemana * 100).toFixed(1) : 0,
        clientes: clientesSemana,
        ticketMedio: ticketMedio.toFixed(2)
      }),
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'id' })

    atualizacoes.push(`Métricas da semana: R$ ${fatSemana.toLocaleString('pt-BR')}`)

    // ===== 2. Atualizar produtos mais vendidos =====
    console.log('🏆 Atualizando top produtos...')

    const { data: produtosVendas } = await supabase
      .from('contahub_analitico')
      .select('prd_desc, grp_desc, qtd, valorfinal')
      .eq('bar_id', barId)
      .gte('trn_dtgerencial', inicioSemana.toISOString().split('T')[0])

    const produtosAgrupados: Record<string, { grp: string; qtd: number; valor: number }> = {}
    produtosVendas?.forEach(p => {
      if (!p.prd_desc) return
      if (!produtosAgrupados[p.prd_desc]) {
        produtosAgrupados[p.prd_desc] = { grp: p.grp_desc || '', qtd: 0, valor: 0 }
      }
      produtosAgrupados[p.prd_desc].qtd += p.qtd || 0
      produtosAgrupados[p.prd_desc].valor += p.valorfinal || 0
    })

    const top10Produtos = Object.entries(produtosAgrupados)
      .sort((a, b) => b[1].valor - a[1].valor)
      .slice(0, 10)
      .map(([nome, stats]) => ({ nome, ...stats }))

    await supabase.from('agente_regras_dinamicas').upsert({
      id: 'top_produtos',
      bar_id: barId,
      nome: 'Top 10 Produtos',
      tipo: 'produtos',
      valor: JSON.stringify(top10Produtos),
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'id' })

    atualizacoes.push(`Top produtos: ${top10Produtos.length} itens ranqueados`)

    // ===== 3. Atualizar CMV =====
    console.log('📦 Atualizando CMV...')

    const { data: cmvData } = await supabase
      .from('cmv_semanal')
      .select('cmv_percentual, custo_total, faturamento')
      .eq('bar_id', barId)
      .order('data_inicio', { ascending: false })
      .limit(4)

    if (cmvData && cmvData.length > 0) {
      const cmvAtual = cmvData[0]
      const cmvAnterior = cmvData[1]
      const tendenciaCMV = cmvAnterior 
        ? cmvAtual.cmv_percentual - cmvAnterior.cmv_percentual
        : 0

      await supabase.from('agente_regras_dinamicas').upsert({
        id: 'cmv_atual',
        bar_id: barId,
        nome: 'CMV Atual',
        tipo: 'custos',
        valor: JSON.stringify({
          cmv: cmvAtual.cmv_percentual,
          meta: 34,
          status: cmvAtual.cmv_percentual <= 34 ? 'ok' : cmvAtual.cmv_percentual <= 36 ? 'atencao' : 'critico',
          tendencia: tendenciaCMV > 0 ? 'subindo' : tendenciaCMV < 0 ? 'caindo' : 'estavel',
          variacao: tendenciaCMV.toFixed(2)
        }),
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'id' })

      atualizacoes.push(`CMV: ${cmvAtual.cmv_percentual.toFixed(1)}%`)
    }

    // ===== 4. Atualizar padrões de clientes =====
    console.log('👥 Analisando padrões de clientes...')

    const { data: eventosClientes } = await supabase
      .from('eventos_base')
      .select('data_evento, cl_real, real_r')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .not('cl_real', 'is', null)
      .order('data_evento', { ascending: false })
      .limit(30)

    if (eventosClientes && eventosClientes.length > 0) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const clientesPorDia: Record<string, { total: number; count: number }> = {}

      eventosClientes.forEach(e => {
        const dia = diasSemana[new Date(e.data_evento + 'T12:00:00').getDay()]
        if (!clientesPorDia[dia]) clientesPorDia[dia] = { total: 0, count: 0 }
        clientesPorDia[dia].total += e.cl_real || 0
        clientesPorDia[dia].count++
      })

      const mediaPorDia = Object.entries(clientesPorDia).map(([dia, stats]) => ({
        dia,
        media: stats.count > 0 ? Math.round(stats.total / stats.count) : 0
      })).sort((a, b) => b.media - a.media)

      const melhorDia = mediaPorDia[0]
      const piorDia = mediaPorDia[mediaPorDia.length - 1]

      await supabase.from('agente_regras_dinamicas').upsert({
        id: 'padroes_clientes',
        bar_id: barId,
        nome: 'Padrões de Clientes',
        tipo: 'clientes',
        valor: JSON.stringify({
          mediaPorDia,
          melhorDia: melhorDia.dia,
          mediamelhorDia: melhorDia.media,
          piorDia: piorDia.dia,
          mediaPiorDia: piorDia.media
        }),
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'id' })

      atualizacoes.push(`Padrões de clientes: ${melhorDia.dia} é o melhor dia (${melhorDia.media} clientes)`)
    }

    // ===== 5. Gerar insights automáticos =====
    console.log('💡 Gerando insights automáticos...')

    const insights: { categoria: string; insight: string; prioridade: number }[] = []

    // Insight de meta
    const atingimentoSemana = metaSemana > 0 ? (fatSemana / metaSemana * 100) : 0
    if (atingimentoSemana >= 100) {
      insights.push({
        categoria: 'meta',
        insight: `Meta da semana batida! Atingimento de ${atingimentoSemana.toFixed(1)}%.`,
        prioridade: 3
      })
    } else if (atingimentoSemana < 70) {
      insights.push({
        categoria: 'meta',
        insight: `Semana abaixo do esperado: ${atingimentoSemana.toFixed(1)}% da meta.`,
        prioridade: 1
      })
    }

    // Insight de CMV
    if (cmvData && cmvData[0]) {
      const cmv = cmvData[0].cmv_percentual
      if (cmv > 36) {
        insights.push({
          categoria: 'custos',
          insight: `CMV crítico em ${cmv.toFixed(1)}%. Revisar compras e desperdício.`,
          prioridade: 1
        })
      } else if (cmv <= 32) {
        insights.push({
          categoria: 'custos',
          insight: `CMV excelente em ${cmv.toFixed(1)}%! Bom controle de custos.`,
          prioridade: 3
        })
      }
    }

    // Insight de ticket
    if (ticketMedio > 120) {
      insights.push({
        categoria: 'vendas',
        insight: `Ticket médio alto: R$ ${ticketMedio.toFixed(0)}. Cliente está gastando bem!`,
        prioridade: 3
      })
    } else if (ticketMedio < 80 && clientesSemana > 0) {
      insights.push({
        categoria: 'vendas',
        insight: `Ticket médio baixo: R$ ${ticketMedio.toFixed(0)}. Considere estratégias de upselling.`,
        prioridade: 2
      })
    }

    // Salvar insights
    for (const insight of insights) {
      await supabase.from('agente_insights').insert({
        bar_id: barId,
        categoria: insight.categoria,
        insight: insight.insight,
        prioridade: insight.prioridade,
        metadata: { fonte: 'sync_automatico', data: hoje.toISOString() }
      })
    }

    atualizacoes.push(`${insights.length} novo(s) insight(s) gerado(s)`)

    // ===== 6. Registrar log do sync =====
    await supabase.from('agente_regras_dinamicas').upsert({
      id: 'ultimo_sync',
      bar_id: barId,
      nome: 'Último Sync',
      tipo: 'sistema',
      valor: JSON.stringify({
        data: hoje.toISOString(),
        atualizacoes,
        sucesso: true
      }),
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'id' })

    console.log('✅ Sync de conhecimento concluído!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conhecimento sincronizado com sucesso',
        atualizacoes,
        insights_gerados: insights.length,
        timestamp: hoje.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no sync de conhecimento:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
