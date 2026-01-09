import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DadosDia {
  data: string
  dia_semana: string
  faturamento_bruto: number
  faturamento_liquido: number
  ticket_medio: number
  total_vendas: number
  pax_estimado: number
  cmv_percentual: number
  custo_artistico: number
  custo_producao: number
  reservas: number
  nome_evento: string
}

// Função para buscar dados de um dia específico
async function buscarDadosDia(supabase: any, barId: number, data: string): Promise<DadosDia | null> {
  console.log(`📊 Buscando dados para ${data}...`)
  
  // Buscar dados do ContaHub (analitico)
  const { data: contahub } = await supabase
    .from('contahub_analitico')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_movimento', data)
    .single()

  // Buscar dados de eventos (Yuzer)
  const { data: evento } = await supabase
    .from('eventos_base')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_evento', data)
    .single()

  // Buscar dados Nibo (custos)
  const { data: custos } = await supabase
    .from('nibo_agendamentos')
    .select('valor, categoria_nome')
    .eq('bar_id', barId)
    .gte('data_vencimento', data)
    .lte('data_vencimento', data)

  // Buscar reservas (GetIn)
  const { data: reservas } = await supabase
    .from('getin_reservas')
    .select('id')
    .eq('bar_id', barId)
    .eq('data_reserva', data)

  if (!contahub && !evento) {
    console.log(`⚠️ Sem dados para ${data}`)
    return null
  }

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dataObj = new Date(data + 'T12:00:00Z')
  
  // Calcular custos por categoria
  const custoArtistico = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('atra') || 
    c.categoria_nome?.toLowerCase().includes('artista')
  ).reduce((sum: number, c: any) => sum + (c.valor || 0), 0) || 0

  const custoProducao = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('produ')
  ).reduce((sum: number, c: any) => sum + (c.valor || 0), 0) || 0

  return {
    data,
    dia_semana: diasSemana[dataObj.getDay()],
    faturamento_bruto: evento?.real_r || contahub?.faturamento_bruto || 0,
    faturamento_liquido: evento?.real_r_liq || contahub?.faturamento_liquido || 0,
    ticket_medio: evento?.te_r || contahub?.ticket_medio || 0,
    total_vendas: contahub?.total_vendas || evento?.clientes_r || 0,
    pax_estimado: evento?.clientes_r || contahub?.pax_estimado || 0,
    cmv_percentual: contahub?.cmv_percentual || 0,
    custo_artistico: custoArtistico,
    custo_producao: custoProducao,
    reservas: reservas?.length || 0,
    nome_evento: evento?.nome || 'Operação Normal'
  }
}

// Função para gerar análise comparativa
function gerarAnaliseComparativa(ontem: DadosDia, semanaPassada: DadosDia | null): string {
  const linhas: string[] = []
  
  linhas.push(`📊 **ANÁLISE DIÁRIA - ${ontem.dia_semana} ${ontem.data}**`)
  linhas.push(`🎭 Evento: ${ontem.nome_evento}`)
  linhas.push('')
  
  // Métricas do dia
  linhas.push(`💰 **Faturamento Bruto:** R$ ${ontem.faturamento_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`💵 **Faturamento Líquido:** R$ ${ontem.faturamento_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`🎫 **Ticket Médio:** R$ ${ontem.ticket_medio.toFixed(2)}`)
  linhas.push(`👥 **PAX Estimado:** ${ontem.pax_estimado}`)
  linhas.push(`📋 **Reservas:** ${ontem.reservas}`)
  
  if (ontem.cmv_percentual > 0) {
    linhas.push(`📦 **CMV:** ${ontem.cmv_percentual.toFixed(1)}%`)
  }
  
  if (ontem.custo_artistico > 0) {
    const percentArt = ontem.faturamento_bruto > 0 
      ? ((ontem.custo_artistico / ontem.faturamento_bruto) * 100).toFixed(1)
      : '0'
    linhas.push(`🎤 **Custo Artístico:** R$ ${ontem.custo_artistico.toLocaleString('pt-BR')} (${percentArt}% do fat.)`)
  }
  
  // Comparação com semana passada
  if (semanaPassada) {
    linhas.push('')
    linhas.push(`📈 **COMPARAÇÃO COM ${semanaPassada.dia_semana.toUpperCase()} PASSADA (${semanaPassada.data}):**`)
    
    const varFat = semanaPassada.faturamento_bruto > 0 
      ? ((ontem.faturamento_bruto - semanaPassada.faturamento_bruto) / semanaPassada.faturamento_bruto * 100)
      : 0
    const varPax = semanaPassada.pax_estimado > 0 
      ? ((ontem.pax_estimado - semanaPassada.pax_estimado) / semanaPassada.pax_estimado * 100)
      : 0
    const varTicket = semanaPassada.ticket_medio > 0 
      ? ((ontem.ticket_medio - semanaPassada.ticket_medio) / semanaPassada.ticket_medio * 100)
      : 0
    
    const emojiVar = (v: number) => v >= 0 ? '📈' : '📉'
    const sinalVar = (v: number) => v >= 0 ? '+' : ''
    
    linhas.push(`${emojiVar(varFat)} Faturamento: ${sinalVar(varFat)}${varFat.toFixed(1)}% (era R$ ${semanaPassada.faturamento_bruto.toLocaleString('pt-BR')})`)
    linhas.push(`${emojiVar(varPax)} PAX: ${sinalVar(varPax)}${varPax.toFixed(1)}% (eram ${semanaPassada.pax_estimado} pessoas)`)
    linhas.push(`${emojiVar(varTicket)} Ticket: ${sinalVar(varTicket)}${varTicket.toFixed(1)}% (era R$ ${semanaPassada.ticket_medio.toFixed(2)})`)
    
    // Análise automática
    linhas.push('')
    if (varFat < -10) {
      linhas.push(`⚠️ **ALERTA:** Faturamento caiu ${Math.abs(varFat).toFixed(1)}% em relação à semana passada`)
      if (varPax < -5) {
        linhas.push(`   → Menos pessoas vieram (${Math.abs(varPax).toFixed(1)}% menos PAX)`)
      }
      if (varTicket < -5) {
        linhas.push(`   → Pessoas gastaram menos (${Math.abs(varTicket).toFixed(1)}% menos por pessoa)`)
      }
    } else if (varFat > 10) {
      linhas.push(`✅ **DESTAQUE:** Faturamento subiu ${varFat.toFixed(1)}% em relação à semana passada!`)
      if (varPax > 5) {
        linhas.push(`   → Mais pessoas vieram (+${varPax.toFixed(1)}% PAX)`)
      }
      if (varTicket > 5) {
        linhas.push(`   → Pessoas gastaram mais (+${varTicket.toFixed(1)}% por pessoa)`)
      }
    }
  } else {
    linhas.push('')
    linhas.push(`ℹ️ Sem dados da ${ontem.dia_semana} passada para comparar`)
  }
  
  return linhas.join('\n')
}

// Função para enviar ao Discord
async function enviarDiscord(mensagem: string, webhookType: string = 'contahub') {
  try {
    const webhookUrl = webhookType === 'contahub' 
      ? Deno.env.get('DISCORD_CONTAHUB_WEBHOOK')
      : Deno.env.get('DISCORD_EVENTOS_WEBHOOK')
    
    if (!webhookUrl) {
      console.log('⚠️ Discord webhook não configurado')
      return false
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🤖 Análise Diária Automática',
          description: mensagem,
          color: 3447003, // Azul
          timestamp: new Date().toISOString(),
          footer: { text: 'SGB Agente IA' }
        }]
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('❌ Erro ao enviar Discord:', error)
    return false
  }
}

// Função para chamar Gemini para insights mais profundos
async function gerarInsightsIA(ontem: DadosDia, semanaPassada: DadosDia | null, supabase: any, barId: number): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.log('⚠️ GEMINI_API_KEY não configurada, pulando análise IA')
    return ''
  }
  
  try {
    // Buscar histórico das últimas 4 semanas do mesmo dia
    const dataOntem = new Date(ontem.data + 'T12:00:00Z')
    const historicoPromises = []
    for (let i = 1; i <= 4; i++) {
      const dataHistorico = new Date(dataOntem)
      dataHistorico.setDate(dataHistorico.getDate() - (i * 7))
      historicoPromises.push(buscarDadosDia(supabase, barId, dataHistorico.toISOString().split('T')[0]))
    }
    const historico = await Promise.all(historicoPromises)
    
    const prompt = `Você é um analista de bares especialista. Analise os dados e dê 2-3 insights CURTOS e ACIONÁVEIS.

DADOS DE ONTEM (${ontem.dia_semana} ${ontem.data}):
- Faturamento: R$ ${ontem.faturamento_bruto.toFixed(2)}
- PAX: ${ontem.pax_estimado}
- Ticket Médio: R$ ${ontem.ticket_medio.toFixed(2)}
- Reservas: ${ontem.reservas}
- Evento: ${ontem.nome_evento}

${semanaPassada ? `SEMANA PASSADA (${semanaPassada.data}):
- Faturamento: R$ ${semanaPassada.faturamento_bruto.toFixed(2)}
- PAX: ${semanaPassada.pax_estimado}
- Ticket Médio: R$ ${semanaPassada.ticket_medio.toFixed(2)}` : 'Sem dados da semana passada.'}

HISTÓRICO DAS ÚLTIMAS 4 ${ontem.dia_semana.toUpperCase()}S:
${historico.filter(h => h).map(h => `- ${h!.data}: R$ ${h!.faturamento_bruto.toFixed(2)}, ${h!.pax_estimado} PAX`).join('\n')}

Responda em português, formato:
💡 **Insight 1:** [texto curto]
💡 **Insight 2:** [texto curto]
🎯 **Ação recomendada:** [uma ação específica]`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    )
    
    if (!response.ok) {
      console.error('❌ Erro Gemini:', await response.text())
      return ''
    }
    
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (error) {
    console.error('❌ Erro ao gerar insights IA:', error)
    return ''
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bar_id, data_analise } = await req.json()
    
    const barId = bar_id || 3
    
    // Calcular datas
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3) // Ajuste para Brasília
    
    const ontem = data_analise 
      ? new Date(data_analise + 'T12:00:00Z')
      : new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    
    const semanaPassada = new Date(ontem.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const dataOntem = ontem.toISOString().split('T')[0]
    const dataSemanaPassada = semanaPassada.toISOString().split('T')[0]
    
    console.log(`🎯 Análise diária para bar_id=${barId}`)
    console.log(`📅 Analisando: ${dataOntem} vs ${dataSemanaPassada}`)
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Buscar dados
    const dadosOntem = await buscarDadosDia(supabase, barId, dataOntem)
    const dadosSemanaPassada = await buscarDadosDia(supabase, barId, dataSemanaPassada)
    
    if (!dadosOntem) {
      const mensagemErro = `⚠️ Sem dados disponíveis para ${dataOntem}`
      console.log(mensagemErro)
      
      return new Response(JSON.stringify({
        success: false,
        message: mensagemErro
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    // Gerar análise comparativa
    let mensagem = gerarAnaliseComparativa(dadosOntem, dadosSemanaPassada)
    
    // Gerar insights com IA (se disponível)
    const insightsIA = await gerarInsightsIA(dadosOntem, dadosSemanaPassada, supabase, barId)
    if (insightsIA) {
      mensagem += '\n\n' + '─'.repeat(30) + '\n'
      mensagem += '🤖 **INSIGHTS IA:**\n' + insightsIA
    }
    
    // Enviar para Discord
    const discordOk = await enviarDiscord(mensagem)
    
    // Salvar análise no banco
    await supabase.from('agente_insights').insert({
      bar_id: barId,
      tipo: 'analise_diaria',
      titulo: `Análise ${dadosOntem.dia_semana} ${dataOntem}`,
      descricao: mensagem,
      criticidade: 'baixa',
      dados: { ontem: dadosOntem, semana_passada: dadosSemanaPassada },
      origem_ia: !!insightsIA
    })
    
    console.log('✅ Análise diária concluída')
    console.log(`📢 Discord: ${discordOk ? 'Enviado' : 'Falhou'}`)
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        ontem: dadosOntem,
        semana_passada: dadosSemanaPassada,
        mensagem_discord: discordOk,
        insights_ia: !!insightsIA
      }
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('❌ Erro na análise diária:', error)
    
    // Enviar erro para Discord
    const errorMsg = `❌ **Erro na Análise Diária**\n\n${error instanceof Error ? error.message : String(error)}`
    await enviarDiscord(errorMsg)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
