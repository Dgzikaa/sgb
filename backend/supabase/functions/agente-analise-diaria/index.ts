import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// TIPOS
// =============================================================================

interface DadosCompletosEvento {
  // Identificação
  data: string
  dia_semana: string
  nome_evento: string
  atracao_principal: string
  
  // Faturamento (ContaHub + Yuzer)
  faturamento_bruto: number
  faturamento_liquido: number
  faturamento_bar: number
  faturamento_entrada: number
  
  // Público
  pax_total: number
  pax_pagante: number
  pax_lista: number
  pax_reserva: number
  
  // Tickets
  ticket_medio: number
  ticket_bebida: number
  ticket_entrada: number
  
  // Custos
  custo_artistico: number
  custo_producao: number
  custo_total_evento: number
  
  // Métricas
  cmv_percentual: number
  margem_contribuicao: number
  percentual_art_sobre_fat: number
  
  // Horários
  hora_pico_faturamento: string
  faturamento_hora_pico: number
  
  // Pagamentos
  pix_percentual: number
  credito_percentual: number
  debito_percentual: number
  dinheiro_percentual: number
}

interface ContextoHistorico {
  media_mesmo_dia_4_semanas: number
  tendencia_mesmo_dia: 'subindo' | 'estavel' | 'caindo'
  melhor_dia_mes: { data: string, faturamento: number }
  pior_dia_mes: { data: string, faturamento: number }
  posicao_no_ranking_mes: number
  total_dias_mes: number
  comparacao_meta: number
  meta_diaria: number
}

// =============================================================================
// FUNÇÕES DE BUSCA DE DADOS
// =============================================================================

async function buscarDadosCompletosEvento(supabase: any, barId: number, data: string): Promise<DadosCompletosEvento | null> {
  console.log(`📊 Buscando dados completos para ${data}...`)
  
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dataObj = new Date(data + 'T12:00:00Z')
  const diaSemana = diasSemana[dataObj.getDay()]
  
  // 1. EVENTOS_BASE (Yuzer consolidado)
  const { data: eventoBase } = await supabase
    .from('eventos_base')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_evento', data)
    .single()
  
  // 2. CONTAHUB_ANALITICO
  const { data: contahub } = await supabase
    .from('contahub_analitico')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_movimento', data)
    .single()
  
  // 3. YUZER_PAGAMENTO (detalhes de pagamento)
  const { data: pagamento } = await supabase
    .from('yuzer_pagamento')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_evento', data)
    .single()
  
  // 4. YUZER_FATPORHORA (faturamento por hora)
  const { data: fatHora } = await supabase
    .from('yuzer_fatporhora')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_evento', data)
    .order('faturamento', { ascending: false })
    .limit(1)
  
  // 5. NIBO_AGENDAMENTOS (custos do dia)
  const dataFormatada = `${data.substring(8, 10)}/${data.substring(5, 7)}`
  const { data: custos } = await supabase
    .from('nibo_agendamentos')
    .select('valor, categoria_nome')
    .eq('bar_id', barId)
    .or(`descricao.ilike.%${dataFormatada}%,data_vencimento.eq.${data}`)
  
  // 6. GETIN_RESERVAS (reservas do dia)
  const { data: reservas } = await supabase
    .from('getin_reservas')
    .select('id, quantidade_pessoas')
    .eq('bar_id', barId)
    .eq('data_reserva', data)
  
  // Se não tem dados básicos, retorna null
  if (!eventoBase && !contahub) {
    console.log(`⚠️ Sem dados para ${data}`)
    return null
  }
  
  // Extrair nome da atração do evento
  const nomeEvento = eventoBase?.nome || contahub?.nome_evento || 'Operação Normal'
  const atracao = extrairAtracao(nomeEvento)
  
  // Calcular custos
  const custoArtistico = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('atra') || 
    c.categoria_nome?.toLowerCase().includes('artista') ||
    c.categoria_nome?.toLowerCase().includes('dj') ||
    c.categoria_nome?.toLowerCase().includes('banda')
  ).reduce((sum: number, c: any) => sum + Math.abs(c.valor || 0), 0) || eventoBase?.c_art || 0

  const custoProducao = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('produ')
  ).reduce((sum: number, c: any) => sum + Math.abs(c.valor || 0), 0) || eventoBase?.c_prod || 0
  
  // Calcular PAX
  const paxReserva = reservas?.reduce((sum: number, r: any) => sum + (r.quantidade_pessoas || 0), 0) || 0
  const paxTotal = eventoBase?.clientes_r || contahub?.pax_estimado || 0
  
  // Calcular pagamentos percentuais
  const fatBruto = pagamento?.faturamento_bruto || eventoBase?.real_r || contahub?.faturamento_bruto || 0
  const pixPerc = fatBruto > 0 ? ((pagamento?.pix || 0) / fatBruto * 100) : 0
  const creditoPerc = fatBruto > 0 ? ((pagamento?.credito || 0) / fatBruto * 100) : 0
  const debitoPerc = fatBruto > 0 ? ((pagamento?.debito || 0) / fatBruto * 100) : 0
  const dinheiroPerc = fatBruto > 0 ? ((pagamento?.dinheiro || 0) / fatBruto * 100) : 0
  
  // Calcular margem
  const custoTotal = custoArtistico + custoProducao
  const margemContrib = fatBruto > 0 ? ((fatBruto - custoTotal) / fatBruto * 100) : 0
  const percArtFat = fatBruto > 0 ? (custoArtistico / fatBruto * 100) : 0
  
  return {
    data,
    dia_semana: diaSemana,
    nome_evento: nomeEvento,
    atracao_principal: atracao,
    
    faturamento_bruto: fatBruto,
    faturamento_liquido: eventoBase?.real_r_liq || pagamento?.valor_liquido || 0,
    faturamento_bar: eventoBase?.bar_r || contahub?.faturamento_bar || 0,
    faturamento_entrada: eventoBase?.entrada_r || 0,
    
    pax_total: paxTotal,
    pax_pagante: eventoBase?.pag_r || 0,
    pax_lista: eventoBase?.lista_r || 0,
    pax_reserva: paxReserva,
    
    ticket_medio: eventoBase?.te_r || contahub?.ticket_medio || 0,
    ticket_bebida: eventoBase?.tb_r || 0,
    ticket_entrada: eventoBase?.tent_r || 0,
    
    custo_artistico: custoArtistico,
    custo_producao: custoProducao,
    custo_total_evento: custoTotal,
    
    cmv_percentual: contahub?.cmv_percentual || 0,
    margem_contribuicao: margemContrib,
    percentual_art_sobre_fat: percArtFat,
    
    hora_pico_faturamento: fatHora?.[0]?.hora_formatada || 'N/A',
    faturamento_hora_pico: fatHora?.[0]?.faturamento || 0,
    
    pix_percentual: pixPerc,
    credito_percentual: creditoPerc,
    debito_percentual: debitoPerc,
    dinheiro_percentual: dinheiroPerc
  }
}

function extrairAtracao(nomeEvento: string): string {
  // Remove prefixos comuns e extrai nome da atração
  const prefixos = [
    'Quarta de Bamba -', 'Quinta do Forró -', 'Sexta na Roça -', 
    'Sábado -', 'Domingo -', 'Pé no Ordi -', 'Happy Hour -',
    '-', 'com', 'feat.', 'feat', '&', 'e Dj', 'Dj'
  ]
  
  let atracao = nomeEvento
  for (const prefixo of prefixos) {
    if (atracao.includes(prefixo)) {
      const partes = atracao.split(prefixo)
      atracao = partes.length > 1 ? partes[1].trim() : partes[0].trim()
    }
  }
  
  return atracao || nomeEvento
}

async function buscarContextoHistorico(supabase: any, barId: number, data: string): Promise<ContextoHistorico> {
  console.log(`📈 Buscando contexto histórico...`)
  
  const dataObj = new Date(data + 'T12:00:00Z')
  const diaSemana = dataObj.getDay()
  
  // Últimas 4 semanas do mesmo dia da semana
  const datasHistorico: string[] = []
  for (let i = 1; i <= 4; i++) {
    const d = new Date(dataObj)
    d.setDate(d.getDate() - (i * 7))
    datasHistorico.push(d.toISOString().split('T')[0])
  }
  
  // Buscar dados históricos
  const { data: historico } = await supabase
    .from('eventos_base')
    .select('data_evento, real_r')
    .eq('bar_id', barId)
    .in('data_evento', datasHistorico)
    .gt('real_r', 0)
    .order('data_evento', { ascending: false })
  
  // Calcular média e tendência
  const valores = historico?.map((h: any) => h.real_r) || []
  const media = valores.length > 0 ? valores.reduce((a: number, b: number) => a + b, 0) / valores.length : 0
  
  let tendencia: 'subindo' | 'estavel' | 'caindo' = 'estavel'
  if (valores.length >= 2) {
    const diff = valores[0] - valores[valores.length - 1]
    if (diff > media * 0.1) tendencia = 'subindo'
    else if (diff < -media * 0.1) tendencia = 'caindo'
  }
  
  // Buscar melhor e pior dia do mês
  const inicioMes = `${data.substring(0, 7)}-01`
  const { data: diasMes } = await supabase
    .from('eventos_base')
    .select('data_evento, real_r')
    .eq('bar_id', barId)
    .gte('data_evento', inicioMes)
    .lte('data_evento', data)
    .gt('real_r', 0)
    .order('real_r', { ascending: false })
  
  const melhor = diasMes?.[0] || { data_evento: data, real_r: 0 }
  const pior = diasMes?.[diasMes.length - 1] || { data_evento: data, real_r: 0 }
  
  // Posição no ranking
  const posicao = diasMes?.findIndex((d: any) => d.data_evento === data) || 0
  
  // Meta diária (baseada em médias - ajustar conforme seu negócio)
  const metasPorDia: Record<number, number> = {
    0: 58000, // Domingo
    1: 5000,  // Segunda
    2: 0,     // Terça
    3: 35000, // Quarta
    4: 25000, // Quinta
    5: 70000, // Sexta
    6: 60000  // Sábado
  }
  const metaDiaria = metasPorDia[diaSemana] || 30000
  
  return {
    media_mesmo_dia_4_semanas: media,
    tendencia_mesmo_dia: tendencia,
    melhor_dia_mes: { data: melhor.data_evento, faturamento: melhor.real_r },
    pior_dia_mes: { data: pior.data_evento, faturamento: pior.real_r },
    posicao_no_ranking_mes: posicao + 1,
    total_dias_mes: diasMes?.length || 0,
    comparacao_meta: metaDiaria > 0 ? ((diasMes?.find((d: any) => d.data_evento === data)?.real_r || 0) - metaDiaria) / metaDiaria * 100 : 0,
    meta_diaria: metaDiaria
  }
}

async function buscarAtracoesAnteriores(supabase: any, barId: number, atracao: string): Promise<any[]> {
  // Buscar histórico da mesma atração
  const { data: historico } = await supabase
    .from('eventos_base')
    .select('data_evento, nome, real_r, clientes_r, te_r')
    .eq('bar_id', barId)
    .ilike('nome', `%${atracao}%`)
    .gt('real_r', 0)
    .order('data_evento', { ascending: false })
    .limit(5)
  
  return historico || []
}

// =============================================================================
// ANÁLISE COM IA (GEMINI)
// =============================================================================

async function gerarAnaliseInteligente(
  dados: DadosCompletosEvento, 
  contexto: ContextoHistorico,
  historicoAtracao: any[],
  dadosSemanaPassada: DadosCompletosEvento | null
): Promise<string> {
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não configurada!')
    return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada)
  }
  
  console.log('🤖 Gerando análise inteligente com Gemini...')
  
  const prompt = `Você é um consultor especialista em bares e casas noturnas no Brasil. Analise os dados abaixo e gere insights PROFUNDOS e ACIONÁVEIS.

## DADOS DO EVENTO (${dados.dia_semana} ${dados.data})

**Evento:** ${dados.nome_evento}
**Atração:** ${dados.atracao_principal}

**Faturamento:**
- Bruto: R$ ${dados.faturamento_bruto.toFixed(2)}
- Bar/Bebidas: R$ ${dados.faturamento_bar.toFixed(2)}
- Entrada: R$ ${dados.faturamento_entrada.toFixed(2)}
- Meta do dia: R$ ${contexto.meta_diaria.toFixed(2)} (${contexto.comparacao_meta > 0 ? '+' : ''}${contexto.comparacao_meta.toFixed(1)}% da meta)

**Público:**
- PAX Total: ${dados.pax_total}
- Pagantes: ${dados.pax_pagante}
- Lista: ${dados.pax_lista}
- Reservas: ${dados.pax_reserva}

**Tickets:**
- Médio: R$ ${dados.ticket_medio.toFixed(2)}
- Bebida: R$ ${dados.ticket_bebida.toFixed(2)}
- Entrada: R$ ${dados.ticket_entrada.toFixed(2)}

**Custos:**
- Artístico: R$ ${dados.custo_artistico.toFixed(2)} (${dados.percentual_art_sobre_fat.toFixed(1)}% do fat.)
- Produção: R$ ${dados.custo_producao.toFixed(2)}
- CMV: ${dados.cmv_percentual.toFixed(1)}%
- Margem: ${dados.margem_contribuicao.toFixed(1)}%

**Operação:**
- Hora pico: ${dados.hora_pico_faturamento} (R$ ${dados.faturamento_hora_pico.toFixed(2)})
- PIX: ${dados.pix_percentual.toFixed(1)}% | Crédito: ${dados.credito_percentual.toFixed(1)}% | Débito: ${dados.debito_percentual.toFixed(1)}%

## CONTEXTO HISTÓRICO

**Média das últimas 4 ${dados.dia_semana}s:** R$ ${contexto.media_mesmo_dia_4_semanas.toFixed(2)}
**Tendência:** ${contexto.tendencia_mesmo_dia === 'subindo' ? '📈 Subindo' : contexto.tendencia_mesmo_dia === 'caindo' ? '📉 Caindo' : '➡️ Estável'}
**Ranking no mês:** ${contexto.posicao_no_ranking_mes}º de ${contexto.total_dias_mes} dias
**Melhor dia do mês:** ${contexto.melhor_dia_mes.data} (R$ ${contexto.melhor_dia_mes.faturamento.toFixed(2)})

${dadosSemanaPassada ? `
## COMPARAÇÃO COM ${dadosSemanaPassada.dia_semana.toUpperCase()} PASSADA
- Faturamento: R$ ${dadosSemanaPassada.faturamento_bruto.toFixed(2)} → R$ ${dados.faturamento_bruto.toFixed(2)} (${((dados.faturamento_bruto - dadosSemanaPassada.faturamento_bruto) / dadosSemanaPassada.faturamento_bruto * 100).toFixed(1)}%)
- PAX: ${dadosSemanaPassada.pax_total} → ${dados.pax_total} (${dadosSemanaPassada.pax_total > 0 ? ((dados.pax_total - dadosSemanaPassada.pax_total) / dadosSemanaPassada.pax_total * 100).toFixed(1) : 0}%)
- Ticket: R$ ${dadosSemanaPassada.ticket_medio.toFixed(2)} → R$ ${dados.ticket_medio.toFixed(2)}
- Atração anterior: ${dadosSemanaPassada.atracao_principal}
` : ''}

${historicoAtracao.length > 0 ? `
## HISTÓRICO DESTA ATRAÇÃO (${dados.atracao_principal})
${historicoAtracao.map(h => `- ${h.data_evento}: R$ ${h.real_r?.toFixed(2) || 0}, ${h.clientes_r || 0} PAX`).join('\n')}
` : ''}

## SUA ANÁLISE

Responda em português brasileiro com:

1. **RESUMO EXECUTIVO** (2-3 frases diretas sobre o resultado do dia)

2. **3 INSIGHTS PRINCIPAIS** (cada um com:)
   - O que foi observado
   - Por que isso importa
   - O que fazer a respeito

3. **PONTO DE ATENÇÃO** (se houver algo preocupante)

4. **RECOMENDAÇÃO PARA PRÓXIMA ${dados.dia_semana.toUpperCase()}** (ação específica)

Seja DIRETO, ESPECÍFICO e ACIONÁVEL. Nada de frases genéricas.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 1500,
            topP: 0.9
          }
        })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro Gemini:', response.status, errorText)
      return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada)
    }
    
    const result = await response.json()
    const analise = result.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!analise) {
      console.error('❌ Resposta Gemini vazia')
      return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada)
    }
    
    console.log('✅ Análise Gemini gerada com sucesso')
    return analise
    
  } catch (error) {
    console.error('❌ Erro ao chamar Gemini:', error)
    return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada)
  }
}

function gerarAnaliseFallback(dados: DadosCompletosEvento, contexto: ContextoHistorico, semanaPassada: DadosCompletosEvento | null): string {
  const linhas: string[] = []
  
  linhas.push(`📊 **ANÁLISE ${dados.dia_semana.toUpperCase()} ${dados.data}**`)
  linhas.push(`🎭 ${dados.nome_evento}`)
  linhas.push('')
  
  // Resumo
  const varMeta = contexto.comparacao_meta
  if (varMeta >= 10) {
    linhas.push(`✅ **Dia ACIMA da meta** (+${varMeta.toFixed(1)}%)`)
  } else if (varMeta >= -10) {
    linhas.push(`➡️ **Dia na meta** (${varMeta >= 0 ? '+' : ''}${varMeta.toFixed(1)}%)`)
  } else {
    linhas.push(`⚠️ **Dia ABAIXO da meta** (${varMeta.toFixed(1)}%)`)
  }
  
  linhas.push('')
  linhas.push(`💰 **Faturamento:** R$ ${dados.faturamento_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`👥 **PAX:** ${dados.pax_total} (${dados.pax_pagante} pagantes, ${dados.pax_lista} lista)`)
  linhas.push(`🎫 **Ticket Médio:** R$ ${dados.ticket_medio.toFixed(2)}`)
  linhas.push(`🍺 **Ticket Bebida:** R$ ${dados.ticket_bebida.toFixed(2)}`)
  
  if (dados.custo_artistico > 0) {
    linhas.push(`🎤 **Custo Artístico:** R$ ${dados.custo_artistico.toLocaleString('pt-BR')} (${dados.percentual_art_sobre_fat.toFixed(1)}%)`)
  }
  
  linhas.push('')
  linhas.push(`📈 **Contexto:**`)
  linhas.push(`- Média últimas 4 ${dados.dia_semana}s: R$ ${contexto.media_mesmo_dia_4_semanas.toLocaleString('pt-BR')}`)
  linhas.push(`- Tendência: ${contexto.tendencia_mesmo_dia === 'subindo' ? '📈' : contexto.tendencia_mesmo_dia === 'caindo' ? '📉' : '➡️'}`)
  linhas.push(`- Ranking mês: ${contexto.posicao_no_ranking_mes}º/${contexto.total_dias_mes}`)
  
  if (semanaPassada) {
    const varFat = ((dados.faturamento_bruto - semanaPassada.faturamento_bruto) / semanaPassada.faturamento_bruto * 100)
    linhas.push('')
    linhas.push(`📊 **vs ${semanaPassada.dia_semana} passada:**`)
    linhas.push(`${varFat >= 0 ? '📈' : '📉'} Faturamento: ${varFat >= 0 ? '+' : ''}${varFat.toFixed(1)}%`)
  }
  
  return linhas.join('\n')
}

// =============================================================================
// ENVIAR PARA DISCORD
// =============================================================================

async function enviarDiscord(titulo: string, mensagem: string) {
  try {
    const webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK')
    if (!webhookUrl) {
      console.log('⚠️ Discord webhook não configurado')
      return false
    }
    
    // Dividir mensagem se for muito grande
    const maxLength = 4000
    let descricao = mensagem
    if (descricao.length > maxLength) {
      descricao = descricao.substring(0, maxLength) + '\n\n...(análise completa salva no banco)'
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: titulo,
          description: descricao,
          color: 3447003,
          timestamp: new Date().toISOString(),
          footer: { text: 'SGB Agente IA - Análise Diária Profunda' }
        }]
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('❌ Erro ao enviar Discord:', error)
    return false
  }
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bar_id, data_analise } = await req.json()
    
    const barId = bar_id || 3
    
    // Calcular data de ontem
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3) // Ajuste Brasília
    
    const ontem = data_analise 
      ? new Date(data_analise + 'T12:00:00Z')
      : new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    
    const dataOntem = ontem.toISOString().split('T')[0]
    
    // Data da semana passada (mesmo dia)
    const semanaPassada = new Date(ontem.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dataSemanaPassada = semanaPassada.toISOString().split('T')[0]
    
    console.log(`🎯 Análise profunda para bar_id=${barId}`)
    console.log(`📅 Data: ${dataOntem} | Comparação: ${dataSemanaPassada}`)
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Buscar dados completos do evento
    const dadosOntem = await buscarDadosCompletosEvento(supabase, barId, dataOntem)
    
    if (!dadosOntem) {
      const msg = `⚠️ Sem dados disponíveis para ${dataOntem}`
      console.log(msg)
      return new Response(JSON.stringify({ success: false, message: msg }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // 2. Buscar dados da semana passada
    const dadosSemanaPassada = await buscarDadosCompletosEvento(supabase, barId, dataSemanaPassada)
    
    // 3. Buscar contexto histórico
    const contexto = await buscarContextoHistorico(supabase, barId, dataOntem)
    
    // 4. Buscar histórico da atração
    const historicoAtracao = await buscarAtracoesAnteriores(supabase, barId, dadosOntem.atracao_principal)
    
    // 5. Gerar análise inteligente
    const analise = await gerarAnaliseInteligente(dadosOntem, contexto, historicoAtracao, dadosSemanaPassada)
    
    // 6. Enviar para Discord
    const titulo = `🤖 Análise ${dadosOntem.dia_semana} ${dataOntem}`
    const discordOk = await enviarDiscord(titulo, analise)
    
    // 7. Salvar no banco
    await supabase.from('agente_insights').insert({
      bar_id: barId,
      tipo: 'analise_diaria_profunda',
      titulo: `${dadosOntem.dia_semana} ${dataOntem} - ${dadosOntem.nome_evento}`,
      descricao: analise,
      criticidade: contexto.comparacao_meta < -20 ? 'alta' : contexto.comparacao_meta < -10 ? 'media' : 'baixa',
      dados: { 
        evento: dadosOntem, 
        contexto, 
        semana_passada: dadosSemanaPassada,
        historico_atracao: historicoAtracao
      },
      origem_ia: true
    })
    
    console.log('✅ Análise diária profunda concluída')
    console.log(`📢 Discord: ${discordOk ? 'Enviado' : 'Falhou'}`)
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        evento: dadosOntem,
        contexto,
        semana_passada: dadosSemanaPassada,
        analise_enviada: discordOk,
        insights_ia: true
      }
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('❌ Erro na análise diária:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
