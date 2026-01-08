import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertConfig {
  barId: number;
  webhookUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { barId = 3, webhookUrl }: AlertConfig = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const discordWebhook = webhookUrl || Deno.env.get('DISCORD_ALERTAS_WEBHOOK')
    if (!discordWebhook) {
      throw new Error('Webhook do Discord não configurado')
    }

    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    const alertas: { tipo: string; severidade: 'info' | 'warning' | 'critical'; mensagem: string; valor?: string }[] = []

    // ===== 1. Verificar meta mensal =====
    console.log('🔍 Verificando meta mensal...')
    const { data: eventosMes } = await supabase
      .from('eventos_base')
      .select('real_r, m1_r')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .gte('data_evento', inicioMes.toISOString().split('T')[0])

    const fatMes = eventosMes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
    const metaMes = eventosMes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0
    const diasPassados = hoje.getDate()
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
    const diasRestantes = diasNoMes - diasPassados
    const atingimentoMeta = metaMes > 0 ? (fatMes / metaMes * 100) : 0

    // Projeção de meta
    const mediaDiaria = diasPassados > 0 ? fatMes / diasPassados : 0
    const projecaoFimMes = mediaDiaria * diasNoMes
    const projecaoAtingimento = metaMes > 0 ? (projecaoFimMes / metaMes * 100) : 0

    if (projecaoAtingimento < 80 && diasPassados > 10) {
      alertas.push({
        tipo: 'meta',
        severidade: 'warning',
        mensagem: `Projeção de meta baixa: ${projecaoAtingimento.toFixed(1)}%`,
        valor: `Necessário R$ ${((metaMes - fatMes) / diasRestantes).toFixed(0)}/dia`
      })
    } else if (atingimentoMeta >= 100) {
      alertas.push({
        tipo: 'meta',
        severidade: 'info',
        mensagem: '🎉 Meta do mês batida!',
        valor: `${atingimentoMeta.toFixed(1)}% atingido`
      })
    }

    // ===== 2. Verificar CMV =====
    console.log('🔍 Verificando CMV...')
    const { data: cmvData } = await supabase
      .from('cmv_semanal')
      .select('cmv_percentual')
      .eq('bar_id', barId)
      .order('data_inicio', { ascending: false })
      .limit(1)

    const cmvAtual = cmvData?.[0]?.cmv_percentual || 0
    if (cmvAtual > 36) {
      alertas.push({
        tipo: 'cmv',
        severidade: 'critical',
        mensagem: `CMV crítico: ${cmvAtual.toFixed(1)}%`,
        valor: 'Meta: < 34%'
      })
    } else if (cmvAtual > 34) {
      alertas.push({
        tipo: 'cmv',
        severidade: 'warning',
        mensagem: `CMV acima da meta: ${cmvAtual.toFixed(1)}%`,
        valor: 'Meta: < 34%'
      })
    }

    // ===== 3. Verificar faturamento de ontem =====
    console.log('🔍 Verificando faturamento de ontem...')
    const { data: eventoOntem } = await supabase
      .from('eventos_base')
      .select('real_r, m1_r, nome')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .eq('data_evento', ontem.toISOString().split('T')[0])
      .single()

    if (eventoOntem) {
      const fatOntem = eventoOntem.real_r || 0
      const metaOntem = eventoOntem.m1_r || 0
      const atingOntem = metaOntem > 0 ? (fatOntem / metaOntem * 100) : 0

      if (atingOntem < 70) {
        alertas.push({
          tipo: 'faturamento',
          severidade: 'warning',
          mensagem: `${eventoOntem.nome}: ${atingOntem.toFixed(0)}% da meta`,
          valor: `R$ ${fatOntem.toLocaleString('pt-BR')} / R$ ${metaOntem.toLocaleString('pt-BR')}`
        })
      } else if (atingOntem >= 120) {
        alertas.push({
          tipo: 'faturamento',
          severidade: 'info',
          mensagem: `🔥 ${eventoOntem.nome}: ${atingOntem.toFixed(0)}% da meta!`,
          valor: `R$ ${fatOntem.toLocaleString('pt-BR')}`
        })
      }
    }

    // ===== 4. Verificar dados faltantes =====
    console.log('🔍 Verificando dados faltantes...')
    const { data: eventosSemDados } = await supabase
      .from('eventos_base')
      .select('data_evento, nome')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .is('real_r', null)
      .lt('data_evento', hoje.toISOString().split('T')[0])
      .gte('data_evento', inicioSemana.toISOString().split('T')[0])

    if (eventosSemDados && eventosSemDados.length > 0) {
      alertas.push({
        tipo: 'dados',
        severidade: 'warning',
        mensagem: `${eventosSemDados.length} evento(s) sem faturamento registrado`,
        valor: eventosSemDados.map(e => e.nome || e.data_evento).slice(0, 3).join(', ')
      })
    }

    // ===== 5. Verificar ticket médio anômalo =====
    console.log('🔍 Verificando ticket médio...')
    const { data: eventosRecentes } = await supabase
      .from('eventos_base')
      .select('real_r, cl_real, nome, data_evento')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .not('real_r', 'is', null)
      .not('cl_real', 'is', null)
      .gte('data_evento', inicioSemana.toISOString().split('T')[0])

    if (eventosRecentes && eventosRecentes.length > 0) {
      const tickets = eventosRecentes.map(e => ({
        ...e,
        ticket: e.cl_real > 0 ? e.real_r / e.cl_real : 0
      }))

      const ticketMedio = tickets.reduce((acc, t) => acc + t.ticket, 0) / tickets.length
      const ticketsBaixos = tickets.filter(t => t.ticket > 0 && t.ticket < ticketMedio * 0.6)

      if (ticketsBaixos.length > 0) {
        alertas.push({
          tipo: 'ticket',
          severidade: 'info',
          mensagem: `Ticket abaixo da média em ${ticketsBaixos.length} evento(s)`,
          valor: `Média: R$ ${ticketMedio.toFixed(0)}`
        })
      }
    }

    // ===== Enviar alertas para Discord =====
    if (alertas.length > 0) {
      console.log(`📤 Enviando ${alertas.length} alertas para Discord...`)

      // Agrupar por severidade
      const critical = alertas.filter(a => a.severidade === 'critical')
      const warnings = alertas.filter(a => a.severidade === 'warning')
      const infos = alertas.filter(a => a.severidade === 'info')

      const fields = []

      if (critical.length > 0) {
        fields.push({
          name: '🚨 CRÍTICOS',
          value: critical.map(a => `**${a.mensagem}**\n${a.valor || ''}`).join('\n'),
          inline: false
        })
      }

      if (warnings.length > 0) {
        fields.push({
          name: '⚠️ ATENÇÃO',
          value: warnings.map(a => `${a.mensagem}\n${a.valor || ''}`).join('\n'),
          inline: false
        })
      }

      if (infos.length > 0) {
        fields.push({
          name: '💡 DESTAQUES',
          value: infos.map(a => `${a.mensagem}\n${a.valor || ''}`).join('\n'),
          inline: false
        })
      }

      const embed = {
        title: `🔔 Alertas Proativos - ${hoje.toLocaleDateString('pt-BR')}`,
        description: `${alertas.length} alerta(s) identificado(s) pela análise automática.`,
        color: critical.length > 0 ? 15158332 : warnings.length > 0 ? 16776960 : 3066993,
        fields,
        footer: { text: '🤖 Zykor Agent - Análise Proativa' },
        timestamp: new Date().toISOString()
      }

      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      })
    }

    // Salvar alertas no banco para histórico
    for (const alerta of alertas) {
      await supabase.from('agente_insights').insert({
        bar_id: barId,
        categoria: alerta.tipo,
        insight: alerta.mensagem,
        prioridade: alerta.severidade === 'critical' ? 1 : alerta.severidade === 'warning' ? 2 : 3,
        metadata: { valor: alerta.valor, severidade: alerta.severidade }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        alertas_gerados: alertas.length,
        alertas,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro nos alertas proativos:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
