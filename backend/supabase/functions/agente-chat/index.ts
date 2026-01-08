import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

interface ChatRequest {
  bar_id: number
  usuario_id: string
  mensagem: string
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { bar_id, usuario_id, mensagem }: ChatRequest = await req.json()
    const startTime = Date.now()

    // 1. Buscar contexto do bar
    const { data: bar } = await supabaseClient
      .from('bars')
      .select('*')
      .eq('id', bar_id)
      .single()

    // 2. Buscar últimas conversas (histórico)
    const { data: historicoConversas } = await supabaseClient
      .from('agente_conversas')
      .select('mensagem, resposta')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(5)

    // 3. Buscar memórias relevantes
    const { data: memorias } = await supabaseClient
      .from('agente_memoria_vetorial')
      .select('*')
      .eq('bar_id', bar_id)
      .order('relevancia', { ascending: false })
      .limit(15)

    // 4. Buscar padrões e regras
    const { data: padroes } = await supabaseClient
      .from('agente_padroes_detectados')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('status', 'confirmado')

    const { data: regras } = await supabaseClient
      .from('agente_regras_dinamicas')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ativa', true)

    // 5. Buscar dados recentes do bar
    const { data: ultimoScan } = await supabaseClient
      .from('agente_scans')
      .select('*')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 6. Montar prompt com contexto completo
    const prompt = `
Você é o assistente inteligente do SGB (Sistema de Gestão de Bares).
Seu nome é "Agente Zykor" e você ajuda gestores a tomar decisões estratégicas.

# INFORMAÇÕES DO BAR
Nome: ${bar?.nome || 'Não disponível'}
ID: ${bar_id}

# DADOS RECENTES
${ultimoScan ? JSON.stringify(ultimoScan.dados, null, 2) : 'Nenhum scan recente'}

# MEMÓRIA (Aprendizados anteriores)
${memorias?.map(m => `- ${m.conteudo} (relevância: ${m.relevancia})`).join('\n') || 'Nenhuma memória ainda'}

# PADRÕES DETECTADOS
${padroes?.map(p => `- ${p.descricao} (confiança: ${(p.confianca * 100).toFixed(0)}%)`).join('\n') || 'Nenhum padrão detectado'}

# REGRAS ATIVAS
${regras?.map(r => `- ${r.nome}: ${r.descricao}`).join('\n') || 'Nenhuma regra customizada'}

# HISTÓRICO DA CONVERSA ATUAL
${historicoConversas?.reverse().map(c => `Usuário: ${c.mensagem}\nAgente: ${c.resposta}`).join('\n\n') || 'Primeira interação'}

# MENSAGEM DO USUÁRIO
${mensagem}

# SUAS DIRETRIZES
1. Seja direto, objetivo e estratégico
2. Use os dados e padrões para embasar suas respostas
3. Se o usuário ensinar algo novo (regra, preferência), confirme o aprendizado
4. Se detectar intenção de criar regra/alerta, estruture em JSON no final
5. Sempre forneça insights acionáveis
6. Se não souber algo, seja honesto

# FORMATO DE RESPOSTA
Responda em JSON:
{
  "resposta": "Sua resposta em texto natural, amigável mas profissional",
  "aprendizado": {
    "detectado": boolean,
    "tipo": "regra|preferencia|padrao|null",
    "conteudo": "string ou null",
    "estrutura": {} // Se for regra, estruture aqui
  },
  "acao_sugerida": "string ou null",
  "dados_relevantes": {} // Dados específicos que usou para responder
}
`

    // 7. Chamar Gemini
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
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

    // 8. Parsear resposta
    let chatResponse
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      chatResponse = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch (e) {
      // Se não for JSON, usar resposta direta
      chatResponse = {
        resposta: responseText,
        aprendizado: { detectado: false, tipo: null, conteudo: null },
        acao_sugerida: null,
        dados_relevantes: {}
      }
    }

    // 9. Salvar aprendizado se detectado
    if (chatResponse.aprendizado?.detectado) {
      const { tipo, conteudo, estrutura } = chatResponse.aprendizado

      // Salvar na memória vetorial
      await supabaseClient
        .from('agente_memoria_vetorial')
        .insert({
          bar_id,
          tipo: tipo,
          conteudo: conteudo,
          contexto: { mensagem_original: mensagem, estrutura },
          relevancia: 1.0,
          aprendido_de: 'conversa'
        })

      // Se for regra, criar regra dinâmica
      if (tipo === 'regra' && estrutura) {
        await supabaseClient
          .from('agente_regras_dinamicas')
          .insert({
            bar_id,
            nome: estrutura.nome || conteudo.substring(0, 100),
            descricao: conteudo,
            condicao: estrutura.condicao || {},
            acao: estrutura.acao || {},
            prioridade: estrutura.prioridade || 'media',
            origem: 'conversa',
            ativa: true
          })
      }
    }

    // 10. Salvar conversa
    const tokensInput = Math.ceil(prompt.length / 4)
    const tokensOutput = Math.ceil(responseText.length / 4)

    await supabaseClient
      .from('agente_conversas')
      .insert({
        bar_id,
        usuario_id,
        mensagem,
        resposta: chatResponse.resposta,
        contexto_usado: {
          memorias_usadas: memorias?.length || 0,
          padroes_usados: padroes?.length || 0,
          regras_usadas: regras?.length || 0
        },
        tokens_usados: tokensInput + tokensOutput,
        modelo: GEMINI_MODEL,
        gerou_aprendizado: chatResponse.aprendizado?.detectado || false
      })

    // 11. Salvar métricas
    const tempoResposta = Date.now() - startTime
    const custoEstimado = (tokensInput * 0.00000125) + (tokensOutput * 0.000005)

    await supabaseClient
      .from('agente_ia_metricas')
      .insert({
        bar_id,
        tipo_operacao: 'chat',
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        custo_estimado: custoEstimado,
        tempo_resposta: tempoResposta,
        modelo: GEMINI_MODEL,
        sucesso: true
      })

    return new Response(
      JSON.stringify({
        success: true,
        resposta: chatResponse.resposta,
        aprendizado_detectado: chatResponse.aprendizado?.detectado || false,
        acao_sugerida: chatResponse.acao_sugerida,
        metrics: {
          tempo_resposta_ms: tempoResposta,
          tokens_usados: tokensInput + tokensOutput,
          custo_estimado_usd: custoEstimado
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
    console.error('Erro no agente-chat:', error)
    
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
