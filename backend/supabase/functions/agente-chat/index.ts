import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'

interface ChatRequest {
  bar_id: number
  usuario_id: string
  mensagem: string
}

// =============================================================================
// CATÁLOGO COMPLETO DE INDICADORES E TABELAS DO SISTEMA
// =============================================================================

const CATALOGO_SISTEMA = `
# CATÁLOGO DE DADOS DO SISTEMA SGB

## TABELA: eventos_base (Principal - dados de eventos/dias)
Campos principais:
- data_evento: Data do evento (DATE)
- dia_semana: Nome do dia (VARCHAR)
- nome: Nome completo do evento com artista (VARCHAR)
- artista: Nome do artista/atração (VARCHAR)
- genero: Gênero musical (VARCHAR)
- real_r: Faturamento total real (NUMERIC) - PRINCIPAL INDICADOR DE FATURAMENTO
- cl_real: Público real / Clientes (INTEGER) - QUANTIDADE DE PESSOAS
- t_medio: Ticket médio (NUMERIC)
- te_real: Ticket entrada real (NUMERIC)
- tb_real: Ticket bar real (NUMERIC)
- c_art: Custo artístico (NUMERIC)
- c_prod: Custo produção (NUMERIC)
- faturamento_bar: Faturamento do bar (NUMERIC)
- faturamento_couvert: Faturamento de couvert/entrada (NUMERIC)
- percent_art_fat: % custo artístico sobre faturamento
- percent_stockout: % de stockout
- res_tot: Total de reservas
- semana: Número da semana do ano
- bar_id: ID do bar (3 = Ordinário)

## TABELA: contahub_periodo (Dados detalhados por dia)
- dt_gerencial: Data (DATE)
- pessoas: Número de pessoas
- vr_pagamentos: Valor total de pagamentos
- vr_produtos: Valor de produtos
- vr_couvert: Valor de couvert
- vr_desconto: Valor de descontos

## TABELA: cliente_estatisticas (Estatísticas por cliente)
- telefone, nome: Identificação
- total_visitas: Total de visitas
- ultima_visita: Data última visita
- total_gasto: Total gasto
- ticket_medio: Ticket médio do cliente
- tempo_medio_minutos: Tempo médio de permanência

## TABELA: analytics_artistas (Performance de artistas)
- nome_artista: Nome
- total_shows, faturamento_total, faturamento_medio
- publico_total, publico_medio
- ticket_medio, roi_medio

## TABELA: desempenho_semanal (Resumo semanal)
- semana, ano
- faturamento_total, faturamento_bar, faturamento_couvert
- publico_total, ticket_medio, roi_medio

## TABELA: metas_anuais (Metas por dia da semana)
- dia_semana, meta_faturamento, meta_clientes

## INDICADORES CALCULADOS COMUNS:
- Ticket Médio = faturamento / público (ou real_r / cl_real)
- ROI = (faturamento - custo_artístico) / custo_artístico * 100
- % Meta = (faturamento / meta) * 100
- Faturamento por período = SUM(real_r) com filtros de data

## METAS POR DIA DA SEMANA (Ordinário - bar_id=3):
- Domingo: R$ 58.000
- Segunda: R$ 14.175,82
- Terça: R$ 14.175,82
- Quarta: R$ 35.000
- Quinta: R$ 25.000
- Sexta: R$ 70.000
- Sábado: R$ 60.000

## FILTROS DE DATA COMUNS:
- Hoje: CURRENT_DATE ou data específica
- Ontem: CURRENT_DATE - 1
- Esta semana: date_trunc('week', data_evento) = date_trunc('week', CURRENT_DATE)
- Este mês: EXTRACT(MONTH FROM data_evento) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM data_evento) = EXTRACT(YEAR FROM CURRENT_DATE)
- Mês específico: EXTRACT(MONTH FROM data_evento) = X AND EXTRACT(YEAR FROM data_evento) = Y
- Ano: EXTRACT(YEAR FROM data_evento) = X
`

// =============================================================================
// FUNÇÃO PARA GERAR SQL COM GEMINI
// =============================================================================

async function gerarQueryComGemini(mensagem: string, barId: number): Promise<{ sql: string; explicacao: string }> {
  const hoje = new Date()
  hoje.setHours(hoje.getHours() - 3)
  const dataHoje = hoje.toISOString().split('T')[0]
  
  const promptSQL = `
Você é um especialista em SQL PostgreSQL. Analise a pergunta do usuário e gere uma query SQL para responder.

${CATALOGO_SISTEMA}

# CONTEXTO
- Bar ID: ${barId}
- Data de hoje: ${dataHoje}
- Sempre use bar_id = ${barId} nos filtros
- A tabela principal é eventos_base

# PERGUNTA DO USUÁRIO
"${mensagem}"

# REGRAS IMPORTANTES
1. SEMPRE inclua bar_id = ${barId} no WHERE
2. Para faturamento use: SUM(real_r::numeric) ou real_r::numeric
3. Para público/clientes use: SUM(cl_real) ou cl_real  
4. Para ticket médio use: SUM(real_r::numeric) / NULLIF(SUM(cl_real), 0) ou t_medio
5. Para datas use o formato correto: '2025-02-01' para 1 de fevereiro de 2025
6. Para mês específico: EXTRACT(MONTH FROM data_evento) = X AND EXTRACT(YEAR FROM data_evento) = Y
7. Se pedir "melhor" ou "maior", use ORDER BY DESC LIMIT 1
8. Se pedir "pior" ou "menor", use ORDER BY ASC LIMIT 1
9. Sempre retorne campos úteis como data_evento, nome, artista quando relevante
10. Use COALESCE para evitar nulls: COALESCE(SUM(real_r::numeric), 0)
11. Arredonde valores monetários: ROUND(valor, 2)
12. Para períodos, agrupe adequadamente com GROUP BY

# EXEMPLOS DE QUERIES

Pergunta: "Qual foi o ticket médio de fevereiro de 2025?"
SQL: SELECT ROUND(SUM(real_r::numeric) / NULLIF(SUM(cl_real), 0), 2) as ticket_medio, SUM(real_r::numeric) as faturamento_total, SUM(cl_real) as clientes_total FROM eventos_base WHERE bar_id = ${barId} AND EXTRACT(MONTH FROM data_evento) = 2 AND EXTRACT(YEAR FROM data_evento) = 2025 AND real_r > 0

Pergunta: "Quantos clientes tivemos em janeiro?"
SQL: SELECT SUM(cl_real) as total_clientes, COUNT(*) as dias_operados FROM eventos_base WHERE bar_id = ${barId} AND EXTRACT(MONTH FROM data_evento) = 1 AND EXTRACT(YEAR FROM data_evento) = EXTRACT(YEAR FROM CURRENT_DATE) AND cl_real > 0

Pergunta: "Qual foi o melhor evento de dezembro?"
SQL: SELECT data_evento, nome, artista, real_r::numeric as faturamento, cl_real as publico, t_medio as ticket_medio FROM eventos_base WHERE bar_id = ${barId} AND EXTRACT(MONTH FROM data_evento) = 12 AND real_r > 0 ORDER BY real_r DESC LIMIT 1

Pergunta: "Qual dia teve o maior ticket médio?"
SQL: SELECT data_evento, nome, artista, t_medio as ticket_medio, real_r::numeric as faturamento, cl_real as publico FROM eventos_base WHERE bar_id = ${barId} AND t_medio > 0 AND real_r > 0 ORDER BY t_medio DESC LIMIT 1

Pergunta: "Faturamento dessa semana"
SQL: SELECT SUM(real_r::numeric) as faturamento_total, SUM(cl_real) as clientes_total, ROUND(SUM(real_r::numeric) / NULLIF(SUM(cl_real), 0), 2) as ticket_medio, COUNT(*) as dias FROM eventos_base WHERE bar_id = ${barId} AND data_evento >= date_trunc('week', CURRENT_DATE) AND real_r > 0

Pergunta: "Faturamento do dia 16/01/2026"
SQL: SELECT data_evento, nome, artista, real_r::numeric as faturamento, cl_real as clientes, t_medio as ticket_medio, faturamento_bar::numeric, faturamento_couvert::numeric, c_art::numeric as custo_artistico FROM eventos_base WHERE bar_id = ${barId} AND data_evento = '2026-01-16'

# RESPONDA EM JSON
{
  "sql": "A query SQL completa",
  "explicacao": "Breve explicação do que a query faz"
}
`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptSQL }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini error: ${await response.text()}`)
  }

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Erro ao parsear SQL:', e)
  }
  
  return { sql: '', explicacao: 'Não foi possível gerar a query' }
}

// =============================================================================
// FUNÇÃO PARA INTERPRETAR RESULTADOS
// =============================================================================

async function interpretarResultados(
  mensagem: string, 
  resultados: any[], 
  query: string,
  barId: number
): Promise<string> {
  const promptInterpretacao = `
Você é o Analista Financeiro do SGB. Interprete os resultados da query e responda ao usuário.

# PERGUNTA DO USUÁRIO
"${mensagem}"

# QUERY EXECUTADA
${query}

# RESULTADOS
${JSON.stringify(resultados, null, 2)}

# REGRAS DE RESPOSTA
1. Seja direto e objetivo
2. Sempre cite os números exatos com formatação brasileira (R$ X.XXX,XX)
3. Se for sobre um dia específico, mencione a data e o evento
4. Se for sobre período, mencione o período e totais
5. Adicione contexto útil (ticket médio, comparação com meta, etc)
6. Use emojis para destacar pontos importantes
7. Se não houver dados, diga claramente que não encontrou registros
8. Formate valores monetários corretamente
9. Se o resultado tiver artista/evento, mencione

# FORMATO
Responda de forma natural e profissional, como um analista falando com o gestor.
Não use JSON na resposta, apenas texto formatado.
`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptInterpretacao }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini error: ${await response.text()}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

// =============================================================================
// FALLBACK: BUSCAR DADOS MANUALMENTE
// =============================================================================

async function executarQueryFallback(supabase: any, mensagem: string, barId: number): Promise<any[]> {
  const msg = mensagem.toLowerCase()
  const hoje = new Date()
  hoje.setHours(hoje.getHours() - 3)
  
  // Extrair datas da mensagem
  const regexData = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/
  const matchData = msg.match(regexData)
  
  // Extrair mês/ano
  const mesesNome: Record<string, number> = {
    'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4,
    'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8, 'setembro': 9,
    'outubro': 10, 'novembro': 11, 'dezembro': 12
  }
  
  let mesAlvo: number | null = null
  let anoAlvo: number = hoje.getFullYear()
  
  for (const [nome, num] of Object.entries(mesesNome)) {
    if (msg.includes(nome)) {
      mesAlvo = num
      break
    }
  }
  
  // Extrair ano
  const regexAno = /\b(202\d)\b/
  const matchAno = msg.match(regexAno)
  if (matchAno) {
    anoAlvo = parseInt(matchAno[1])
  }
  
  // Construir query base
  let query = supabase
    .from('eventos_base')
    .select('data_evento, dia_semana, nome, artista, real_r, cl_real, t_medio, faturamento_bar, faturamento_couvert, c_art, te_real, tb_real, res_tot, percent_stockout')
    .eq('bar_id', barId)
    .gt('real_r', 0)
  
  // Aplicar filtros baseados na mensagem
  if (matchData) {
    // Data específica
    const dia = matchData[1].padStart(2, '0')
    const mes = matchData[2].padStart(2, '0')
    const ano = matchData[3] ? (matchData[3].length === 2 ? '20' + matchData[3] : matchData[3]) : hoje.getFullYear().toString()
    const dataStr = `${ano}-${mes}-${dia}`
    query = query.eq('data_evento', dataStr)
  } else if (mesAlvo) {
    // Mês específico
    const inicioMes = `${anoAlvo}-${String(mesAlvo).padStart(2, '0')}-01`
    const fimMes = `${anoAlvo}-${String(mesAlvo).padStart(2, '0')}-31`
    query = query.gte('data_evento', inicioMes).lte('data_evento', fimMes)
  } else if (msg.includes('semana') || msg.includes('essa semana')) {
    // Esta semana
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1)
    query = query.gte('data_evento', inicioSemana.toISOString().split('T')[0])
  } else if (msg.includes('ontem')) {
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    query = query.eq('data_evento', ontem.toISOString().split('T')[0])
  } else if (msg.includes('hoje')) {
    query = query.eq('data_evento', hoje.toISOString().split('T')[0])
  } else if (msg.includes('ano') || msg.includes('2025') || msg.includes('2026')) {
    // Ano inteiro
    const anoFiltro = msg.includes('2025') ? 2025 : msg.includes('2026') ? 2026 : anoAlvo
    query = query.gte('data_evento', `${anoFiltro}-01-01`).lte('data_evento', `${anoFiltro}-12-31`)
  }
  
  // Ordenação
  if (msg.includes('melhor') || msg.includes('maior')) {
    if (msg.includes('ticket')) {
      query = query.order('t_medio', { ascending: false }).limit(5)
    } else {
      query = query.order('real_r', { ascending: false }).limit(5)
    }
  } else if (msg.includes('pior') || msg.includes('menor')) {
    if (msg.includes('ticket')) {
      query = query.order('t_medio', { ascending: true }).limit(5)
    } else {
      query = query.order('real_r', { ascending: true }).limit(5)
    }
  } else {
    query = query.order('data_evento', { ascending: false }).limit(50)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Erro no fallback:', error)
    return []
  }
  
  return data || []
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bar_id, usuario_id, mensagem }: ChatRequest = await req.json()
    const startTime = Date.now()

    console.log(`📝 Mensagem recebida: "${mensagem}"`)
    console.log(`🏪 Bar ID: ${bar_id}`)

    // 1. Buscar contexto do bar
    const { data: bar } = await supabaseClient
      .from('bars')
      .select('nome')
      .eq('id', bar_id)
      .single()

    // 2. Gerar SQL com Gemini
    console.log('🤖 Gerando query SQL com Gemini...')
    const { sql, explicacao } = await gerarQueryComGemini(mensagem, bar_id)
    console.log(`📊 SQL gerado: ${sql}`)
    console.log(`💡 Explicação: ${explicacao}`)

    let resposta = ''
    let resultados: any[] = []

    if (sql && sql.trim()) {
      // 3. Executar a query via RPC
      console.log('🔍 Executando query via RPC...')
      
      try {
        const { data: queryResult, error: queryError } = await supabaseClient.rpc('execute_raw_sql', {
          query_text: sql
        })

        if (queryError) {
          console.error('❌ Erro RPC:', queryError.message)
          
          // Fallback: interpretar a pergunta manualmente
          const fallbackResult = await executarQueryFallback(supabaseClient, mensagem, bar_id)
          resultados = fallbackResult
          resposta = await interpretarResultados(mensagem, resultados, sql, bar_id)
        } else {
          // Parse do resultado JSONB
          resultados = Array.isArray(queryResult) ? queryResult : (queryResult ? [queryResult] : [])
          console.log(`✅ Query retornou ${resultados.length} resultados`)
          resposta = await interpretarResultados(mensagem, resultados, sql, bar_id)
        }
      } catch (rpcError) {
        console.error('❌ Exceção RPC:', rpcError)
        
        // Fallback
        const fallbackResult = await executarQueryFallback(supabaseClient, mensagem, bar_id)
        resultados = fallbackResult
        resposta = await interpretarResultados(mensagem, resultados, sql, bar_id)
      }
    } else {
      // Fallback: buscar dados gerais e interpretar
      console.log('⚠️ Não foi possível gerar SQL, usando fallback...')
      
      const { data: eventos } = await supabaseClient
        .from('eventos_base')
        .select('*')
        .eq('bar_id', bar_id)
        .gt('real_r', 0)
        .order('data_evento', { ascending: false })
        .limit(30)

      resultados = eventos || []
      resposta = await interpretarResultados(mensagem, resultados, 'SELECT * FROM eventos_base (fallback)', bar_id)
    }

    // 4. Salvar conversa
    const tokensUsados = Math.ceil((mensagem.length + resposta.length + sql.length) / 4)
    
    await supabaseClient.from('agente_conversas').insert({
      bar_id,
      usuario_id,
      mensagem,
      resposta,
      contexto_usado: { sql_gerado: sql, explicacao, resultados_count: resultados.length },
      tokens_usados: tokensUsados,
      modelo: GEMINI_MODEL,
      gerou_aprendizado: false
    })

    // 5. Salvar métricas
    const tempoResposta = Date.now() - startTime
    const custoEstimado = tokensUsados * 0.0000015

    await supabaseClient.from('agente_ia_metricas').insert({
      bar_id,
      tipo_operacao: 'chat_sql',
      tokens_input: Math.ceil(mensagem.length / 4),
      tokens_output: Math.ceil(resposta.length / 4),
      custo_estimado: custoEstimado,
      tempo_resposta: tempoResposta,
      modelo: GEMINI_MODEL,
      sucesso: true
    })

    console.log(`✅ Resposta gerada em ${tempoResposta}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        resposta,
        debug: {
          sql_gerado: sql,
          explicacao,
          resultados_count: resultados.length,
          tempo_ms: tempoResposta
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ Erro no agente-chat:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        resposta: `Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente reformular ou seja mais específico. Erro: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
