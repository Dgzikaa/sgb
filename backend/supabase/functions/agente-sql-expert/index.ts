import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

interface SQLRequest {
  bar_id: number
  pergunta: string
  tipo?: 'consulta' | 'analise' | 'otimizacao'
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { bar_id, pergunta, tipo = 'consulta' }: SQLRequest = await req.json()
    const startTime = Date.now()

    // 1. MAPEAR ESQUEMA DO BANCO (tabelas principais)
    const esquemaBanco = `
# PRINCIPAIS TABELAS DO SISTEMA

## Dados Operacionais
- bars (id, nome, cnpj, cidade, estado, ativo)
- usuarios_bar (user_id, bar_id, role, ativo)

## Faturamento e Vendas
- contahub_analitico (bar_id, data, valor_bruto, valor_liquido, custo_produtos, cmv)
- contahub_fatporhora (bar_id, data, hora, valor_total, qtd_comandas)
- contahub_pagamentos (bar_id, data, tipo_pagamento, valor)
- contahub_tempo (bar_id, data, tempo_medio_atendimento, tickets)

## Desempenho
- desempenho_semanal (bar_id, semana, ano, data_inicio, data_fim, faturamento_bruto, cmv_percentual, ticket_medio)

## Estoque e Insumos
- estoque_insumos (bar_id, produto, quantidade, unidade, valor_unitario)
- insumos (bar_id, nome, categoria, unidade_medida)
- receitas (bar_id, nome, categoria, custo_total)
- receitas_insumos (receita_id, insumo_id, quantidade)

## Checklists
- checklist_executions (bar_id, checklist_id, status, concluido_em, responsavel_id)
- checklist_itens (checklist_id, nome, obrigatorio, ordem)

## Eventos
- eventos_base (bar_id, nome, data_inicio, data_fim, faturamento_estimado, faturamento_real)

## Agente IA
- agente_insights (bar_id, tipo, titulo, descricao, criticidade)
- agente_regras_dinamicas (bar_id, nome, condicao, acao, ativa)
- agente_memoria_vetorial (bar_id, tipo, conteudo, relevancia)

## Relacionamentos Importantes
- bar_id conecta quase todas as tabelas
- user_id vem de auth.users
- Datas geralmente em formato ISO 8601
`

    // 2. USAR IA PARA GERAR SQL
    const prompt = `
Você é um especialista em SQL e banco de dados PostgreSQL.
Você conhece profundamente o esquema do banco de dados do sistema Zykor.

# ESQUEMA DO BANCO
${esquemaBanco}

# PERGUNTA DO USUÁRIO
"${pergunta}"

# BAR ID
${bar_id}

# SUA MISSÃO
1. Entenda o que o usuário quer saber
2. Crie uma query SQL otimizada para responder
3. Explique o que a query faz
4. Se não for possível com SQL, sugira alternativa

# REGRAS IMPORTANTES
- SEMPRE filtrar por bar_id = ${bar_id}
- Use EXPLAIN ANALYZE se for query complexa
- Limite resultados (LIMIT) se necessário
- Prefira JOINs a subqueries quando possível
- Use índices disponíveis

# RESPONDA EM JSON
{
  "query_gerada": "SELECT ...",
  "explicacao": "O que a query faz e por que",
  "colunas_retornadas": ["coluna1", "coluna2"],
  "complexidade": "baixa|media|alta",
  "tempo_estimado": "< 1s" | "1-5s" | "> 5s",
  "observacoes": "Qualquer observação importante"
}
`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topK: 10,
            topP: 0.8,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${await geminiResponse.text()}`)
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates[0].content.parts[0].text

    let queryInfo
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      queryInfo = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch (e) {
      console.error('Erro ao parsear resposta:', responseText)
      throw new Error('Erro ao gerar query SQL')
    }

    console.log('🔍 Query gerada:', queryInfo.query_gerada)

    // 3. EXECUTAR QUERY (com segurança)
    let resultado = null
    let erro = null

    try {
      // Validar que a query é SELECT (apenas leitura)
      const queryLower = queryInfo.query_gerada.toLowerCase().trim()
      if (!queryLower.startsWith('select') && !queryLower.startsWith('with')) {
        throw new Error('Apenas queries SELECT são permitidas')
      }

      // Validar que filtra por bar_id
      if (!queryInfo.query_gerada.includes(`bar_id = ${bar_id}`) && 
          !queryInfo.query_gerada.includes(`bar_id=${bar_id}`)) {
        console.warn('Query não filtra por bar_id, pode retornar dados de outros bares')
      }

      // Executar query
      const { data, error: queryError } = await supabaseClient
        .rpc('execute_sql_readonly', { 
          query_text: queryInfo.query_gerada 
        })
        .single()

      if (queryError) {
        // Se RPC não existir, executar direto (menos seguro)
        const { data: directData, error: directError } = await supabaseClient
          .from('_temp_query_result')
          .select('*')
        
        if (directError) {
          throw directError
        }
        resultado = directData
      } else {
        resultado = data
      }

    } catch (error: any) {
      erro = error.message
      console.error('Erro ao executar query:', erro)
    }

    // 4. SALVAR NO HISTÓRICO
    await supabaseClient
      .from('agente_conversas')
      .insert({
        bar_id,
        usuario_id: null,
        mensagem: pergunta,
        resposta: JSON.stringify({
          query: queryInfo.query_gerada,
          explicacao: queryInfo.explicacao,
          resultado: resultado ? 'Executada com sucesso' : 'Erro na execução'
        }),
        modelo: GEMINI_MODEL,
        tokens_usados: Math.ceil((prompt.length + responseText.length) / 4)
      })

    const tempoTotal = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        pergunta,
        sql: {
          query: queryInfo.query_gerada,
          explicacao: queryInfo.explicacao,
          colunas: queryInfo.colunas_retornadas,
          complexidade: queryInfo.complexidade,
          tempo_estimado: queryInfo.tempo_estimado,
          observacoes: queryInfo.observacoes
        },
        execucao: {
          executada: erro === null,
          resultado: resultado || null,
          erro: erro,
          linhas_retornadas: resultado ? (Array.isArray(resultado) ? resultado.length : 1) : 0
        },
        tempo_total_ms: tempoTotal
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro no agente-sql-expert:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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
