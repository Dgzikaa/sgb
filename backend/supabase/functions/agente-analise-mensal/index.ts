import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DadosMes {
  mes: number
  ano: number
  nome_mes: string
  faturamento_total: number
  faturamento_medio_dia: number
  ticket_medio: number
  pax_total: number
  dias_operados: number
  melhor_semana: { inicio: string, faturamento: number }
  pior_semana: { inicio: string, faturamento: number }
  custo_artistico_total: number
  cmv_medio: number
  top_3_dias: { data: string, faturamento: number }[]
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Função para buscar dados de um mês
async function buscarDadosMes(supabase: any, barId: number, ano: number, mes: number): Promise<DadosMes | null> {
  const mesStr = String(mes).padStart(2, '0')
  const dataInicio = `${ano}-${mesStr}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const dataFim = `${ano}-${mesStr}-${ultimoDia}`
  
  console.log(`📊 Buscando dados de ${MESES[mes-1]}/${ano}...`)
  
  // Buscar dados de eventos
  const { data: eventos } = await supabase
    .from('eventos_base')
    .select('*')
    .eq('bar_id', barId)
    .gte('data_evento', dataInicio)
    .lte('data_evento', dataFim)
    .order('data_evento')

  // Buscar dados ContaHub
  const { data: contahub } = await supabase
    .from('contahub_analitico')
    .select('*')
    .eq('bar_id', barId)
    .gte('data_movimento', dataInicio)
    .lte('data_movimento', dataFim)
    .order('data_movimento')

  // Buscar custos Nibo
  const { data: custos } = await supabase
    .from('nibo_agendamentos')
    .select('valor, categoria_nome')
    .eq('bar_id', barId)
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)

  const dadosPorDia = eventos?.length > 0 ? eventos : contahub
  
  if (!dadosPorDia || dadosPorDia.length === 0) {
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

  // Top 3 dias
  const top3 = [...faturamentos].sort((a, b) => b.faturamento - a.faturamento).slice(0, 3)

  // Agrupar por semana
  const semanas: { [key: string]: number } = {}
  faturamentos.forEach((f: any) => {
    const d = new Date(f.data)
    const inicioSemana = new Date(d)
    inicioSemana.setDate(d.getDate() - d.getDay() + 1)
    const key = inicioSemana.toISOString().split('T')[0]
    semanas[key] = (semanas[key] || 0) + f.faturamento
  })

  const semanasArray = Object.entries(semanas).map(([inicio, fat]) => ({ inicio, faturamento: fat as number }))
  const melhorSemana = semanasArray.reduce((best, s) => s.faturamento > (best?.faturamento || 0) ? s : best, { inicio: '', faturamento: 0 })
  const piorSemana = semanasArray.reduce((worst, s) => s.faturamento < (worst?.faturamento || Infinity) ? s : worst, { inicio: '', faturamento: Infinity })

  // Custos
  const custoArtistico = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('atra') || 
    c.categoria_nome?.toLowerCase().includes('artista')
  ).reduce((sum: number, c: any) => sum + (c.valor || 0), 0) || 0

  const cmvMedio = contahub?.filter((c: any) => c.cmv_percentual > 0)
    .reduce((sum: number, c: any, _: number, arr: any[]) => sum + c.cmv_percentual / arr.length, 0) || 0

  return {
    mes,
    ano,
    nome_mes: MESES[mes - 1],
    faturamento_total: faturamentoTotal,
    faturamento_medio_dia: faturamentos.length > 0 ? faturamentoTotal / faturamentos.length : 0,
    ticket_medio: ticketMedio,
    pax_total: paxTotal,
    dias_operados: faturamentos.length,
    melhor_semana: melhorSemana.inicio ? melhorSemana : { inicio: 'N/A', faturamento: 0 },
    pior_semana: piorSemana.faturamento < Infinity ? piorSemana : { inicio: 'N/A', faturamento: 0 },
    custo_artistico_total: custoArtistico,
    cmv_medio: cmvMedio,
    top_3_dias: top3
  }
}

// Função para gerar relatório mensal
function gerarRelatorioMensal(mesAtual: DadosMes, mesAnterior: DadosMes | null, mesAnoPassado: DadosMes | null): string {
  const linhas: string[] = []
  
  linhas.push(`📊 **RELATÓRIO MENSAL - ${mesAtual.nome_mes.toUpperCase()} ${mesAtual.ano}**`)
  linhas.push('')
  
  // Resumo geral
  linhas.push(`💰 **Faturamento Total:** R$ ${mesAtual.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`📈 **Média por Dia:** R$ ${mesAtual.faturamento_medio_dia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`🎫 **Ticket Médio:** R$ ${mesAtual.ticket_medio.toFixed(2)}`)
  linhas.push(`👥 **Total PAX:** ${mesAtual.pax_total.toLocaleString('pt-BR')}`)
  linhas.push(`📅 **Dias Operados:** ${mesAtual.dias_operados}`)
  
  if (mesAtual.custo_artistico_total > 0) {
    const percentArt = ((mesAtual.custo_artistico_total / mesAtual.faturamento_total) * 100).toFixed(1)
    linhas.push(`🎤 **Custo Artístico:** R$ ${mesAtual.custo_artistico_total.toLocaleString('pt-BR')} (${percentArt}%)`)
  }
  
  if (mesAtual.cmv_medio > 0) {
    linhas.push(`📦 **CMV Médio:** ${mesAtual.cmv_medio.toFixed(1)}%`)
  }
  
  // Destaques
  linhas.push('')
  linhas.push(`🏆 **TOP 3 DIAS:**`)
  mesAtual.top_3_dias.forEach((d, i) => {
    linhas.push(`   ${i + 1}. ${d.data} - R$ ${d.faturamento.toLocaleString('pt-BR')}`)
  })
  
  linhas.push('')
  linhas.push(`📈 **Melhor Semana:** ${mesAtual.melhor_semana.inicio} - R$ ${mesAtual.melhor_semana.faturamento.toLocaleString('pt-BR')}`)
  linhas.push(`📉 **Pior Semana:** ${mesAtual.pior_semana.inicio} - R$ ${mesAtual.pior_semana.faturamento.toLocaleString('pt-BR')}`)
  
  // Comparação com mês anterior
  if (mesAnterior) {
    linhas.push('')
    linhas.push(`📈 **VS ${mesAnterior.nome_mes.toUpperCase()} ${mesAnterior.ano}:**`)
    
    const varFat = ((mesAtual.faturamento_total - mesAnterior.faturamento_total) / mesAnterior.faturamento_total * 100)
    const varPax = mesAnterior.pax_total > 0 
      ? ((mesAtual.pax_total - mesAnterior.pax_total) / mesAnterior.pax_total * 100) : 0
    
    const emoji = (v: number) => v >= 0 ? '📈' : '📉'
    const sinal = (v: number) => v >= 0 ? '+' : ''
    
    linhas.push(`${emoji(varFat)} Faturamento: ${sinal(varFat)}${varFat.toFixed(1)}% (R$ ${mesAnterior.faturamento_total.toLocaleString('pt-BR')})`)
    linhas.push(`${emoji(varPax)} PAX: ${sinal(varPax)}${varPax.toFixed(1)}% (${mesAnterior.pax_total.toLocaleString('pt-BR')})`)
  }
  
  // Comparação com mesmo mês ano passado
  if (mesAnoPassado) {
    linhas.push('')
    linhas.push(`📊 **VS ${mesAnoPassado.nome_mes.toUpperCase()} ${mesAnoPassado.ano} (ANO PASSADO):**`)
    
    const varFat = ((mesAtual.faturamento_total - mesAnoPassado.faturamento_total) / mesAnoPassado.faturamento_total * 100)
    const varPax = mesAnoPassado.pax_total > 0 
      ? ((mesAtual.pax_total - mesAnoPassado.pax_total) / mesAnoPassado.pax_total * 100) : 0
    
    const emoji = (v: number) => v >= 0 ? '📈' : '📉'
    const sinal = (v: number) => v >= 0 ? '+' : ''
    
    linhas.push(`${emoji(varFat)} Faturamento: ${sinal(varFat)}${varFat.toFixed(1)}%`)
    linhas.push(`${emoji(varPax)} PAX: ${sinal(varPax)}${varPax.toFixed(1)}%`)
    
    if (varFat > 20) {
      linhas.push(`✅ **Crescimento expressivo** comparado ao ano passado!`)
    } else if (varFat < -20) {
      linhas.push(`⚠️ **Atenção:** Queda significativa vs ano passado`)
    }
  }
  
  return linhas.join('\n')
}

// Função para gerar insights com IA
async function gerarInsightsMensalIA(mesAtual: DadosMes, mesAnterior: DadosMes | null, mesAnoPassado: DadosMes | null): Promise<string> {
  if (!GEMINI_API_KEY) return ''
  
  try {
    const prompt = `Você é um analista de bares. Analise o resumo mensal e dê uma análise executiva CURTA.

${mesAtual.nome_mes.toUpperCase()} ${mesAtual.ano}:
- Faturamento Total: R$ ${mesAtual.faturamento_total.toFixed(2)}
- Média/Dia: R$ ${mesAtual.faturamento_medio_dia.toFixed(2)}
- PAX Total: ${mesAtual.pax_total}
- Ticket Médio: R$ ${mesAtual.ticket_medio.toFixed(2)}
- Dias Operados: ${mesAtual.dias_operados}
- Custo Artístico: R$ ${mesAtual.custo_artistico_total.toFixed(2)}
- Top 3 dias: ${mesAtual.top_3_dias.map(d => `${d.data}: R$ ${d.faturamento.toFixed(0)}`).join(', ')}

${mesAnterior ? `MÊS ANTERIOR (${mesAnterior.nome_mes}): R$ ${mesAnterior.faturamento_total.toFixed(2)}, ${mesAnterior.pax_total} PAX` : ''}
${mesAnoPassado ? `ANO PASSADO (${mesAnoPassado.nome_mes}/${mesAnoPassado.ano}): R$ ${mesAnoPassado.faturamento_total.toFixed(2)}, ${mesAnoPassado.pax_total} PAX` : ''}

Responda em português com:
📝 **Resumo Executivo:** [2-3 frases sobre o mês]
💡 **Principal Aprendizado:** [1 insight chave]
🎯 **Meta para o Próximo Mês:** [1 meta específica e atingível]`

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
          title: '📅 Relatório Mensal',
          description: mensagem,
          color: 10181046, // Roxo
          timestamp: new Date().toISOString(),
          footer: { text: 'SGB Agente IA - Análise Mensal' }
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
    const { bar_id, mes, ano } = await req.json().catch(() => ({}))
    const barId = bar_id || 3
    
    // Mês anterior por padrão
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3)
    
    const mesAnalise = mes || (hoje.getMonth() === 0 ? 12 : hoje.getMonth())
    const anoAnalise = ano || (hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear())
    
    // Mês anterior
    const mesAnteriorNum = mesAnalise === 1 ? 12 : mesAnalise - 1
    const anoMesAnterior = mesAnalise === 1 ? anoAnalise - 1 : anoAnalise
    
    // Mesmo mês ano passado
    const anoPassado = anoAnalise - 1
    
    console.log(`🎯 Análise mensal para bar_id=${barId}`)
    console.log(`📅 Analisando: ${MESES[mesAnalise-1]}/${anoAnalise}`)
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Buscar dados
    const mesAtual = await buscarDadosMes(supabase, barId, anoAnalise, mesAnalise)
    const mesAnterior = await buscarDadosMes(supabase, barId, anoMesAnterior, mesAnteriorNum)
    const mesAnoPassado = await buscarDadosMes(supabase, barId, anoPassado, mesAnalise)
    
    if (!mesAtual) {
      return new Response(JSON.stringify({
        success: false,
        message: `Sem dados para ${MESES[mesAnalise-1]}/${anoAnalise}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    // Gerar relatório
    let mensagem = gerarRelatorioMensal(mesAtual, mesAnterior, mesAnoPassado)
    
    // Gerar insights IA
    const insightsIA = await gerarInsightsMensalIA(mesAtual, mesAnterior, mesAnoPassado)
    if (insightsIA) {
      mensagem += '\n\n' + '─'.repeat(30) + '\n'
      mensagem += '🤖 **ANÁLISE IA:**\n' + insightsIA
    }
    
    // Enviar para Discord
    const discordOk = await enviarDiscord(mensagem)
    
    // Salvar análise
    await supabase.from('agente_insights').insert({
      bar_id: barId,
      tipo: 'analise_mensal',
      titulo: `${mesAtual.nome_mes} ${mesAtual.ano}`,
      descricao: mensagem,
      criticidade: 'baixa',
      dados: { mes_atual: mesAtual, mes_anterior: mesAnterior, mes_ano_passado: mesAnoPassado },
      origem_ia: !!insightsIA
    })
    
    console.log('✅ Análise mensal concluída')
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        mes_atual: mesAtual,
        mes_anterior: mesAnterior,
        mes_ano_passado: mesAnoPassado,
        discord_enviado: discordOk
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
  } catch (error) {
    console.error('❌ Erro na análise mensal:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
