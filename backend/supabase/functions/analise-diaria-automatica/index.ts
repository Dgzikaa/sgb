import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-flash'

interface AnaliseRequest {
  bar_id: number
  data_analise?: string // Data a analisar (padrão: ontem)
  enviar_discord?: boolean
}

interface DadosDia {
  data: string
  dia_semana: string
  faturamento: number
  meta: number
  clientes: number
  ticket_entrada: number
  ticket_bar: number
  ticket_medio: number
  atingimento_meta: number
}

interface ComparacaoDados {
  ontem: DadosDia | null
  semana_passada: DadosDia | null
  mesmo_dia_mes_anterior: DadosDia | null
  media_ultimas_4_semanas: {
    faturamento_medio: number
    clientes_medio: number
    ticket_medio: number
  }
}

// Formatar moeda brasileira
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Formatar porcentagem
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// Formatar variação com emoji
function formatVariacao(atual: number, anterior: number): string {
  if (anterior === 0) return '➖ N/A (sem dados anteriores)'
  
  const variacao = ((atual - anterior) / anterior) * 100
  const emoji = variacao > 5 ? '📈' : variacao < -5 ? '📉' : '➡️'
  const sinal = variacao > 0 ? '+' : ''
  
  return `${emoji} ${sinal}${variacao.toFixed(1)}%`
}

// Buscar dados do dia
async function buscarDadosDia(supabase: any, barId: number, data: string): Promise<DadosDia | null> {
  const { data: evento, error } = await supabase
    .from('eventos_base')
    .select('data_evento, dia_semana, real_r, m1_r, cl_real, te_real, tb_real, t_medio')
    .eq('bar_id', barId)
    .eq('data_evento', data)
    .single()

  if (error || !evento) return null
  if (evento.real_r === 0 && evento.cl_real === 0) return null

  return {
    data: evento.data_evento,
    dia_semana: evento.dia_semana,
    faturamento: parseFloat(evento.real_r) || 0,
    meta: parseFloat(evento.m1_r) || 0,
    clientes: evento.cl_real || 0,
    ticket_entrada: parseFloat(evento.te_real) || 0,
    ticket_bar: parseFloat(evento.tb_real) || 0,
    ticket_medio: parseFloat(evento.t_medio) || 0,
    atingimento_meta: evento.m1_r > 0 ? (evento.real_r / evento.m1_r * 100) : 0
  }
}

// Buscar média das últimas 4 semanas (mesmo dia da semana)
async function buscarMedia4Semanas(supabase: any, barId: number, diaSemana: string): Promise<{ faturamento_medio: number, clientes_medio: number, ticket_medio: number }> {
  const { data: eventos } = await supabase
    .from('eventos_base')
    .select('real_r, cl_real, t_medio')
    .eq('bar_id', barId)
    .eq('dia_semana', diaSemana)
    .gt('real_r', 0)
    .gte('data_evento', new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('data_evento', { ascending: false })
    .limit(4)

  if (!eventos || eventos.length === 0) {
    return { faturamento_medio: 0, clientes_medio: 0, ticket_medio: 0 }
  }

  const faturamentoTotal = eventos.reduce((acc: number, e: any) => acc + (parseFloat(e.real_r) || 0), 0)
  const clientesTotal = eventos.reduce((acc: number, e: any) => acc + (e.cl_real || 0), 0)
  const ticketTotal = eventos.reduce((acc: number, e: any) => acc + (parseFloat(e.t_medio) || 0), 0)

  return {
    faturamento_medio: faturamentoTotal / eventos.length,
    clientes_medio: clientesTotal / eventos.length,
    ticket_medio: ticketTotal / eventos.length
  }
}

// Buscar dados de CMV e produtos mais vendidos
async function buscarDadosDetalhados(supabase: any, barId: number, data: string) {
  // CMV do dia
  const { data: analitico } = await supabase
    .from('contahub_analitico')
    .select('valorfinal, custo, qtd, prd_desc, grp_desc')
    .eq('bar_id', barId)
    .eq('trn_dtgerencial', data)

  if (!analitico || analitico.length === 0) {
    return { cmv: 0, produtosMaisVendidos: [], categoriasMaisVendidas: [] }
  }

  const faturamentoTotal = analitico.reduce((acc: number, a: any) => acc + (parseFloat(a.valorfinal) || 0), 0)
  const custoTotal = analitico.reduce((acc: number, a: any) => acc + (parseFloat(a.custo) || 0), 0)
  const cmv = faturamentoTotal > 0 ? (custoTotal / faturamentoTotal * 100) : 0

  // Agrupar por produto
  const produtosMap = new Map<string, { nome: string, valor: number, qtd: number }>()
  analitico.forEach((item: any) => {
    const nome = item.prd_desc || 'Sem nome'
    const existing = produtosMap.get(nome) || { nome, valor: 0, qtd: 0 }
    existing.valor += parseFloat(item.valorfinal) || 0
    existing.qtd += parseFloat(item.qtd) || 0
    produtosMap.set(nome, existing)
  })

  const produtosMaisVendidos = Array.from(produtosMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)

  // Agrupar por categoria
  const categoriasMap = new Map<string, { nome: string, valor: number }>()
  analitico.forEach((item: any) => {
    const nome = item.grp_desc || 'Sem categoria'
    const existing = categoriasMap.get(nome) || { nome, valor: 0 }
    existing.valor += parseFloat(item.valorfinal) || 0
    categoriasMap.set(nome, existing)
  })

  const categoriasMaisVendidas = Array.from(categoriasMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3)

  return { cmv, produtosMaisVendidos, categoriasMaisVendidas }
}

// Buscar forma de pagamento
async function buscarPagamentos(supabase: any, barId: number, data: string) {
  const { data: pagamentos } = await supabase
    .from('contahub_pagamentos')
    .select('meio, valor')
    .eq('bar_id', barId)
    .eq('dt_gerencial', data)

  if (!pagamentos || pagamentos.length === 0) return []

  const pagamentosMap = new Map<string, number>()
  pagamentos.forEach((p: any) => {
    const meio = p.meio || 'Outros'
    pagamentosMap.set(meio, (pagamentosMap.get(meio) || 0) + (parseFloat(p.valor) || 0))
  })

  return Array.from(pagamentosMap.entries())
    .map(([meio, valor]) => ({ meio, valor }))
    .sort((a, b) => b.valor - a.valor)
}

// Gerar análise com IA
async function gerarAnaliseIA(dados: ComparacaoDados, detalhes: any): Promise<string> {
  if (!GEMINI_API_KEY) {
    return gerarAnaliseSimples(dados, detalhes)
  }

  const prompt = `
Você é um analista de negócios especializado em bares e restaurantes. Analise os dados abaixo e gere um briefing executivo CURTO E DIRETO.

## DADOS DO DIA ANTERIOR
${JSON.stringify(dados.ontem, null, 2)}

## COMPARAÇÃO COM SEMANA PASSADA (MESMO DIA DA SEMANA)
${JSON.stringify(dados.semana_passada, null, 2)}

## MÉDIA DAS ÚLTIMAS 4 SEMANAS (MESMO DIA)
${JSON.stringify(dados.media_ultimas_4_semanas, null, 2)}

## DETALHES ADICIONAIS
- CMV: ${detalhes.cmv?.toFixed(1)}%
- Top 3 Categorias: ${detalhes.categoriasMaisVendidas?.map((c: any) => c.nome).join(', ')}

## SUAS INSTRUÇÕES
1. Faça uma análise em no MÁXIMO 200 palavras
2. Destaque os PRINCIPAIS pontos (positivos e negativos)
3. Compare com a meta e com a semana passada
4. Dê 1-2 recomendações práticas para hoje
5. Use emojis para facilitar a leitura
6. Seja DIRETO e OBJETIVO

Responda APENAS com a análise, sem introduções.
`

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
            maxOutputTokens: 1024,
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Erro Gemini:', await response.text())
      return gerarAnaliseSimples(dados, detalhes)
    }

    const result = await response.json()
    return result.candidates[0]?.content?.parts[0]?.text || gerarAnaliseSimples(dados, detalhes)
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error)
    return gerarAnaliseSimples(dados, detalhes)
  }
}

// Análise simples (fallback sem IA)
function gerarAnaliseSimples(dados: ComparacaoDados, detalhes: any): string {
  const ontem = dados.ontem
  if (!ontem) return '❌ Sem dados para análise'

  const lines: string[] = []

  // Status da meta
  if (ontem.atingimento_meta >= 100) {
    lines.push(`✅ **Meta batida!** Atingimento de ${formatPercent(ontem.atingimento_meta)}`)
  } else if (ontem.atingimento_meta >= 80) {
    lines.push(`⚠️ **Perto da meta!** Atingimento de ${formatPercent(ontem.atingimento_meta)}`)
  } else {
    lines.push(`❌ **Meta não atingida:** ${formatPercent(ontem.atingimento_meta)}`)
  }

  // Comparação com semana passada
  if (dados.semana_passada && dados.semana_passada.faturamento > 0) {
    const variacao = formatVariacao(ontem.faturamento, dados.semana_passada.faturamento)
    lines.push(`📊 **vs Semana Passada:** ${variacao}`)
  }

  // Comparação com média
  if (dados.media_ultimas_4_semanas.faturamento_medio > 0) {
    const variacao = formatVariacao(ontem.faturamento, dados.media_ultimas_4_semanas.faturamento_medio)
    lines.push(`📈 **vs Média 4 semanas:** ${variacao}`)
  }

  // CMV
  if (detalhes.cmv) {
    const cmvEmoji = detalhes.cmv > 35 ? '🔴' : detalhes.cmv > 30 ? '🟡' : '🟢'
    lines.push(`${cmvEmoji} **CMV:** ${detalhes.cmv.toFixed(1)}%`)
  }

  return lines.join('\n')
}

// Enviar para Discord
async function enviarDiscord(dados: ComparacaoDados, analise: string, detalhes: any, barId: number): Promise<boolean> {
  const webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK')
  if (!webhookUrl) {
    console.log('Webhook Discord não configurado')
    return false
  }

  const ontem = dados.ontem
  if (!ontem) return false

  // Determinar cor do embed
  let color = 3066993 // Verde
  if (ontem.atingimento_meta < 80) {
    color = 15158332 // Vermelho
  } else if (ontem.atingimento_meta < 100) {
    color = 16776960 // Amarelo
  }

  // Criar fields
  const fields: any[] = [
    {
      name: '💰 Faturamento',
      value: `${formatCurrency(ontem.faturamento)}\nMeta: ${formatCurrency(ontem.meta)}`,
      inline: true
    },
    {
      name: '📊 Atingimento',
      value: `${formatPercent(ontem.atingimento_meta)}`,
      inline: true
    },
    {
      name: '👥 Clientes',
      value: `${ontem.clientes}`,
      inline: true
    },
    {
      name: '🎫 Ticket Médio',
      value: `${formatCurrency(ontem.ticket_medio)}`,
      inline: true
    },
    {
      name: '🍺 Ticket Bar',
      value: `${formatCurrency(ontem.ticket_bar)}`,
      inline: true
    },
    {
      name: '📉 CMV',
      value: `${detalhes.cmv?.toFixed(1) || 'N/A'}%`,
      inline: true
    }
  ]

  // Comparações
  if (dados.semana_passada && dados.semana_passada.faturamento > 0) {
    fields.push({
      name: '📅 vs Semana Passada',
      value: `Fat: ${formatVariacao(ontem.faturamento, dados.semana_passada.faturamento)}\nClientes: ${formatVariacao(ontem.clientes, dados.semana_passada.clientes)}`,
      inline: false
    })
  }

  if (dados.media_ultimas_4_semanas.faturamento_medio > 0) {
    fields.push({
      name: '📈 vs Média 4 Semanas',
      value: `Fat: ${formatVariacao(ontem.faturamento, dados.media_ultimas_4_semanas.faturamento_medio)}\nClientes: ${formatVariacao(ontem.clientes, dados.media_ultimas_4_semanas.clientes_medio)}`,
      inline: false
    })
  }

  // Análise IA
  fields.push({
    name: '🤖 Análise do Agente Zykor',
    value: analise.substring(0, 1000),
    inline: false
  })

  // Top categorias
  if (detalhes.categoriasMaisVendidas && detalhes.categoriasMaisVendidas.length > 0) {
    const topCategorias = detalhes.categoriasMaisVendidas
      .map((c: any, i: number) => `${i + 1}. ${c.nome}: ${formatCurrency(c.valor)}`)
      .join('\n')
    fields.push({
      name: '🏆 Top Categorias',
      value: topCategorias,
      inline: true
    })
  }

  const embed = {
    title: `📊 Análise Diária - ${ontem.dia_semana} ${new Date(ontem.data).toLocaleDateString('pt-BR')}`,
    color,
    fields,
    footer: {
      text: '🤖 Zykor Agent - Análise Automática Diária'
    },
    timestamp: new Date().toISOString()
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    })

    return response.ok
  } catch (error) {
    console.error('Erro ao enviar Discord:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bar_id = 3, data_analise, enviar_discord = true }: AnaliseRequest = await req.json()

    // Data a analisar (padrão: ontem)
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3) // Ajuste São Paulo
    const dataOntem = data_analise || new Date(hoje.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    console.log(`🔍 Iniciando análise diária para bar_id=${bar_id}, data=${dataOntem}`)

    // Conectar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar dados de ontem
    const dadosOntem = await buscarDadosDia(supabase, bar_id, dataOntem)
    if (!dadosOntem) {
      console.log('⚠️ Sem dados para o dia analisado')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Sem dados para análise nesta data',
          data: dataOntem 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Buscar dados da semana passada (mesmo dia)
    const dataSemanaPassada = new Date(new Date(dataOntem).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dadosSemanaPassada = await buscarDadosDia(supabase, bar_id, dataSemanaPassada)

    // 3. Buscar média das últimas 4 semanas
    const media4Semanas = await buscarMedia4Semanas(supabase, bar_id, dadosOntem.dia_semana)

    // 4. Buscar detalhes (CMV, produtos, pagamentos)
    const detalhes = await buscarDadosDetalhados(supabase, bar_id, dataOntem)
    const pagamentos = await buscarPagamentos(supabase, bar_id, dataOntem)

    // Montar objeto de comparação
    const comparacao: ComparacaoDados = {
      ontem: dadosOntem,
      semana_passada: dadosSemanaPassada,
      mesmo_dia_mes_anterior: null, // Pode ser implementado depois
      media_ultimas_4_semanas: media4Semanas
    }

    // 5. Gerar análise com IA
    const analise = await gerarAnaliseIA(comparacao, { ...detalhes, pagamentos })

    // 6. Enviar para Discord
    let discordEnviado = false
    if (enviar_discord) {
      discordEnviado = await enviarDiscord(comparacao, analise, detalhes, bar_id)
      console.log(discordEnviado ? '📢 Discord enviado com sucesso' : '⚠️ Falha ao enviar Discord')
    }

    // 7. Salvar no banco para histórico
    await supabase
      .from('agente_insights')
      .insert({
        bar_id,
        tipo: 'analise_diaria',
        titulo: `Análise ${dadosOntem.dia_semana} ${dataOntem}`,
        descricao: analise,
        dados: {
          comparacao,
          detalhes,
          pagamentos
        },
        origem_ia: true
      })

    console.log('✅ Análise diária concluída')

    return new Response(
      JSON.stringify({
        success: true,
        data: dataOntem,
        comparacao,
        detalhes,
        analise,
        discord_enviado: discordEnviado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na análise diária:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
