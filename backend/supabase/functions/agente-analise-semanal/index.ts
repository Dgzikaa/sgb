import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DadosSemana {
  semana_inicio: string
  semana_fim: string
  faturamento_total: number
  faturamento_medio_dia: number
  ticket_medio: number
  pax_total: number
  melhor_dia: { data: string, faturamento: number }
  pior_dia: { data: string, faturamento: number }
  dias_operados: number
  custo_artistico_total: number
  cmv_medio: number
}

// Função para buscar dados de uma semana
async function buscarDadosSemana(supabase: any, barId: number, dataInicio: string, dataFim: string): Promise<DadosSemana | null> {
  console.log(`📊 Buscando dados de ${dataInicio} até ${dataFim}...`)
  
  // Buscar dados do ContaHub (analitico)
  const { data: contahub } = await supabase
    .from('contahub_analitico')
    .select('*')
    .eq('bar_id', barId)
    .gte('data_movimento', dataInicio)
    .lte('data_movimento', dataFim)
    .order('data_movimento')

  // Buscar dados de eventos
  const { data: eventos } = await supabase
    .from('eventos_base')
    .select('*')
    .eq('bar_id', barId)
    .gte('data_evento', dataInicio)
    .lte('data_evento', dataFim)
    .order('data_evento')

  // Buscar custos Nibo
  const { data: custos } = await supabase
    .from('nibo_agendamentos')
    .select('valor, categoria_nome')
    .eq('bar_id', barId)
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)

  // Usar eventos como fonte primária, ContaHub como fallback
  const dadosPorDia = eventos?.length > 0 ? eventos : contahub
  
  if (!dadosPorDia || dadosPorDia.length === 0) {
    console.log(`⚠️ Sem dados para a semana ${dataInicio} a ${dataFim}`)
    return null
  }

  // Calcular métricas
  const faturamentos = dadosPorDia.map((d: any) => ({
    data: d.data_evento || d.data_movimento,
    faturamento: d.real_r || d.faturamento_bruto || 0
  })).filter((d: any) => d.faturamento > 0)

  const faturamentoTotal = faturamentos.reduce((sum: number, d: any) => sum + d.faturamento, 0)
  const paxTotal = dadosPorDia.reduce((sum: number, d: any) => sum + (d.clientes_r || d.pax_estimado || 0), 0)
  const ticketMedio = paxTotal > 0 ? faturamentoTotal / paxTotal : 0

  const melhorDia = faturamentos.reduce((best: any, d: any) => 
    d.faturamento > (best?.faturamento || 0) ? d : best, { data: '', faturamento: 0 })
  const piorDia = faturamentos.reduce((worst: any, d: any) => 
    worst.faturamento === 0 || d.faturamento < worst.faturamento ? d : worst, { data: '', faturamento: Infinity })

  // Calcular custos
  const custoArtistico = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('atra') || 
    c.categoria_nome?.toLowerCase().includes('artista')
  ).reduce((sum: number, c: any) => sum + (c.valor || 0), 0) || 0

  const cmvMedio = contahub?.filter((c: any) => c.cmv_percentual > 0)
    .reduce((sum: number, c: any, _: number, arr: any[]) => sum + c.cmv_percentual / arr.length, 0) || 0

  return {
    semana_inicio: dataInicio,
    semana_fim: dataFim,
    faturamento_total: faturamentoTotal,
    faturamento_medio_dia: faturamentos.length > 0 ? faturamentoTotal / faturamentos.length : 0,
    ticket_medio: ticketMedio,
    pax_total: paxTotal,
    melhor_dia: melhorDia.data ? melhorDia : { data: 'N/A', faturamento: 0 },
    pior_dia: piorDia.faturamento < Infinity ? piorDia : { data: 'N/A', faturamento: 0 },
    dias_operados: faturamentos.length,
    custo_artistico_total: custoArtistico,
    cmv_medio: cmvMedio
  }
}

// Função para gerar relatório semanal
function gerarRelatorioSemanal(semanaAtual: DadosSemana, semanaAnterior: DadosSemana | null): string {
  const linhas: string[] = []
  
  linhas.push(`📊 **RELATÓRIO SEMANAL**`)
  linhas.push(`📅 Período: ${semanaAtual.semana_inicio} a ${semanaAtual.semana_fim}`)
  linhas.push('')
  
  // Resumo geral
  linhas.push(`💰 **Faturamento Total:** R$ ${semanaAtual.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`📈 **Média por Dia:** R$ ${semanaAtual.faturamento_medio_dia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`🎫 **Ticket Médio:** R$ ${semanaAtual.ticket_medio.toFixed(2)}`)
  linhas.push(`👥 **Total PAX:** ${semanaAtual.pax_total}`)
  linhas.push(`📅 **Dias Operados:** ${semanaAtual.dias_operados}`)
  
  if (semanaAtual.custo_artistico_total > 0) {
    const percentArt = semanaAtual.faturamento_total > 0 
      ? ((semanaAtual.custo_artistico_total / semanaAtual.faturamento_total) * 100).toFixed(1)
      : '0'
    linhas.push(`🎤 **Custo Artístico:** R$ ${semanaAtual.custo_artistico_total.toLocaleString('pt-BR')} (${percentArt}%)`)
  }
  
  if (semanaAtual.cmv_medio > 0) {
    linhas.push(`📦 **CMV Médio:** ${semanaAtual.cmv_medio.toFixed(1)}%`)
  }
  
  // Destaques
  linhas.push('')
  linhas.push(`🏆 **Melhor Dia:** ${semanaAtual.melhor_dia.data} - R$ ${semanaAtual.melhor_dia.faturamento.toLocaleString('pt-BR')}`)
  linhas.push(`📉 **Dia Mais Fraco:** ${semanaAtual.pior_dia.data} - R$ ${semanaAtual.pior_dia.faturamento.toLocaleString('pt-BR')}`)
  
  // Comparação com semana anterior
  if (semanaAnterior) {
    linhas.push('')
    linhas.push(`📈 **COMPARAÇÃO COM SEMANA ANTERIOR:**`)
    
    const varFat = semanaAnterior.faturamento_total > 0 
      ? ((semanaAtual.faturamento_total - semanaAnterior.faturamento_total) / semanaAnterior.faturamento_total * 100)
      : 0
    const varPax = semanaAnterior.pax_total > 0 
      ? ((semanaAtual.pax_total - semanaAnterior.pax_total) / semanaAnterior.pax_total * 100)
      : 0
    const varTicket = semanaAnterior.ticket_medio > 0 
      ? ((semanaAtual.ticket_medio - semanaAnterior.ticket_medio) / semanaAnterior.ticket_medio * 100)
      : 0
    
    const emojiVar = (v: number) => v >= 0 ? '📈' : '📉'
    const sinalVar = (v: number) => v >= 0 ? '+' : ''
    
    linhas.push(`${emojiVar(varFat)} Faturamento: ${sinalVar(varFat)}${varFat.toFixed(1)}%`)
    linhas.push(`${emojiVar(varPax)} PAX: ${sinalVar(varPax)}${varPax.toFixed(1)}%`)
    linhas.push(`${emojiVar(varTicket)} Ticket Médio: ${sinalVar(varTicket)}${varTicket.toFixed(1)}%`)
    
    // Análise automática
    linhas.push('')
    if (varFat >= 10) {
      linhas.push(`✅ **Excelente semana!** Crescimento de ${varFat.toFixed(1)}% no faturamento.`)
    } else if (varFat >= 0) {
      linhas.push(`✅ **Semana estável.** Manteve o faturamento (+${varFat.toFixed(1)}%).`)
    } else if (varFat >= -10) {
      linhas.push(`⚠️ **Leve queda** de ${Math.abs(varFat).toFixed(1)}% no faturamento.`)
    } else {
      linhas.push(`🚨 **Atenção!** Queda significativa de ${Math.abs(varFat).toFixed(1)}% no faturamento.`)
    }
  } else {
    linhas.push('')
    linhas.push(`ℹ️ Primeira semana com dados - sem comparação disponível.`)
  }
  
  return linhas.join('\n')
}

// Função para gerar insights com IA
async function gerarInsightsSemanalIA(semanaAtual: DadosSemana, semanaAnterior: DadosSemana | null): Promise<string> {
  if (!GEMINI_API_KEY) return ''
  
  try {
    const prompt = `Você é um analista de bares. Analise o resumo semanal e dê 3 insights estratégicos CURTOS.

SEMANA ATUAL (${semanaAtual.semana_inicio} a ${semanaAtual.semana_fim}):
- Faturamento Total: R$ ${semanaAtual.faturamento_total.toFixed(2)}
- Média/Dia: R$ ${semanaAtual.faturamento_medio_dia.toFixed(2)}
- PAX Total: ${semanaAtual.pax_total}
- Ticket Médio: R$ ${semanaAtual.ticket_medio.toFixed(2)}
- Dias Operados: ${semanaAtual.dias_operados}
- Melhor Dia: ${semanaAtual.melhor_dia.data} (R$ ${semanaAtual.melhor_dia.faturamento.toFixed(2)})
- Pior Dia: ${semanaAtual.pior_dia.data} (R$ ${semanaAtual.pior_dia.faturamento.toFixed(2)})
- Custo Artístico: R$ ${semanaAtual.custo_artistico_total.toFixed(2)}

${semanaAnterior ? `SEMANA ANTERIOR:
- Faturamento: R$ ${semanaAnterior.faturamento_total.toFixed(2)}
- PAX: ${semanaAnterior.pax_total}
- Ticket: R$ ${semanaAnterior.ticket_medio.toFixed(2)}` : 'Sem dados da semana anterior.'}

Responda em português, formato:
💡 **Insight 1:** [texto curto sobre performance]
💡 **Insight 2:** [texto curto sobre oportunidade]
💡 **Insight 3:** [texto curto sobre atenção]
🎯 **Foco para próxima semana:** [uma recomendação específica]`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      }
    )
    
    if (!response.ok) return ''
    
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (error) {
    console.error('❌ Erro ao gerar insights IA:', error)
    return ''
  }
}

// Função para enviar ao Discord
async function enviarDiscord(mensagem: string) {
  try {
    const webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK')
    if (!webhookUrl) return false
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '📅 Relatório Semanal',
          description: mensagem,
          color: 15105570, // Laranja
          timestamp: new Date().toISOString(),
          footer: { text: 'SGB Agente IA - Análise Semanal' }
        }]
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('❌ Erro ao enviar Discord:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bar_id } = await req.json().catch(() => ({}))
    const barId = bar_id || 3
    
    // Calcular semanas (segunda a domingo)
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3) // Ajuste Brasília
    
    // Semana passada (segunda a domingo)
    const diaSemana = hoje.getDay() || 7 // Domingo = 7
    const ultimoDomingo = new Date(hoje)
    ultimoDomingo.setDate(hoje.getDate() - diaSemana)
    
    const segundaPassada = new Date(ultimoDomingo)
    segundaPassada.setDate(ultimoDomingo.getDate() - 6)
    
    const segundaAnterior = new Date(segundaPassada)
    segundaAnterior.setDate(segundaPassada.getDate() - 7)
    const domingoAnterior = new Date(segundaPassada)
    domingoAnterior.setDate(segundaPassada.getDate() - 1)
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    
    console.log(`🎯 Análise semanal para bar_id=${barId}`)
    console.log(`📅 Semana atual: ${formatDate(segundaPassada)} a ${formatDate(ultimoDomingo)}`)
    console.log(`📅 Semana anterior: ${formatDate(segundaAnterior)} a ${formatDate(domingoAnterior)}`)
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Buscar dados das semanas
    const semanaAtual = await buscarDadosSemana(supabase, barId, formatDate(segundaPassada), formatDate(ultimoDomingo))
    const semanaAnterior = await buscarDadosSemana(supabase, barId, formatDate(segundaAnterior), formatDate(domingoAnterior))
    
    if (!semanaAtual) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Sem dados para a semana'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    // Gerar relatório
    let mensagem = gerarRelatorioSemanal(semanaAtual, semanaAnterior)
    
    // Gerar insights IA
    const insightsIA = await gerarInsightsSemanalIA(semanaAtual, semanaAnterior)
    if (insightsIA) {
      mensagem += '\n\n' + '─'.repeat(30) + '\n'
      mensagem += '🤖 **ANÁLISE IA:**\n' + insightsIA
    }
    
    // Enviar para Discord
    const discordOk = await enviarDiscord(mensagem)
    
    // Salvar análise
    await supabase.from('agente_insights').insert({
      bar_id: barId,
      tipo: 'analise_semanal',
      titulo: `Semana ${semanaAtual.semana_inicio} a ${semanaAtual.semana_fim}`,
      descricao: mensagem,
      criticidade: 'baixa',
      dados: { semana_atual: semanaAtual, semana_anterior: semanaAnterior },
      origem_ia: !!insightsIA
    })
    
    console.log('✅ Análise semanal concluída')
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        semana_atual: semanaAtual,
        semana_anterior: semanaAnterior,
        discord_enviado: discordOk
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
  } catch (error) {
    console.error('❌ Erro na análise semanal:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
