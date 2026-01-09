import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'

interface AnalysisRequest {
  bar_id: number
  scan_data: any
  context?: string[]
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

    const { bar_id, scan_data, context }: AnalysisRequest = await req.json()
    const startTime = Date.now()

    // 0. Carregar base de conhecimento
    let conhecimentoBase = ''
    try {
      const conhecimentoPath = new URL('../_shared/conhecimento_base.md', import.meta.url)
      conhecimentoBase = await Deno.readTextFile(conhecimentoPath)
    } catch (e) {
      console.log('Base de conhecimento não encontrada, continuando sem ela')
    }

    // 1. Buscar memórias relevantes (RAG)
    const { data: memorias } = await supabaseClient
      .from('agente_memoria_vetorial')
      .select('*')
      .eq('bar_id', bar_id)
      .order('relevancia', { ascending: false })
      .limit(10)

    // 2. Buscar padrões confirmados
    const { data: padroes } = await supabaseClient
      .from('agente_padroes_detectados')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('status', 'confirmado')

    // 3. Buscar regras dinâmicas ativas
    const { data: regras } = await supabaseClient
      .from('agente_regras_dinamicas')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ativa', true)

    // 4. Montar prompt para Gemini
    const prompt = `
Você é um analista de negócios especializado em bares e restaurantes.

# BASE DE CONHECIMENTO (REGRAS E METAS DO NEGÓCIO)
${conhecimentoBase || 'Nenhuma base de conhecimento carregada'}

# CONTEXTO DO BAR (DADOS ATUAIS)
${JSON.stringify(scan_data, null, 2)}

# MEMÓRIA DO AGENTE (Aprendizados anteriores)
${memorias?.map(m => `- ${m.conteudo}`).join('\n') || 'Nenhuma memória ainda'}

# PADRÕES DETECTADOS
${padroes?.map(p => `- ${p.descricao} (confiança: ${p.confianca})`).join('\n') || 'Nenhum padrão confirmado'}

# REGRAS APRENDIDAS
${regras?.map(r => `- ${r.nome}: ${r.descricao}`).join('\n') || 'Nenhuma regra customizada'}

# SUA MISSÃO
Analise os dados e:
1. Identifique insights estratégicos e acionáveis
2. Detecte anomalias ou problemas potenciais
3. Sugira ações concretas
4. Compare com padrões históricos (se houver)
5. Avalie criticidade (baixa/media/alta/critica)

Responda em JSON:
{
  "insights": [
    {
      "titulo": "string",
      "descricao": "string",
      "categoria": "operacional|financeiro|estoque|equipe|cliente",
      "criticidade": "baixa|media|alta|critica",
      "acao_sugerida": "string",
      "dados_suporte": {}
    }
  ],
  "alertas": [
    {
      "tipo": "string",
      "mensagem": "string",
      "urgencia": "baixa|media|alta|critica",
      "acao_recomendada": "string"
    }
  ],
  "padroes_novos": [
    {
      "tipo": "temporal|correlacao|anomalia",
      "descricao": "string",
      "confianca": 0.0-1.0,
      "dados_suporte": {}
    }
  ],
  "resumo_executivo": "string"
}
`

    // 5. Chamar Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY || ''
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${await geminiResponse.text()}`)
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates[0].content.parts[0].text

    // 6. Extrair JSON da resposta
    let analysis
    try {
      // Gemini pode retornar com markdown ```json, remover se necessário
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch (e) {
      console.error('Erro ao parsear resposta Gemini:', responseText)
      throw new Error('Resposta da IA não está em formato JSON válido')
    }

    // 7. Salvar insights no BD
    if (analysis.insights?.length > 0) {
      for (const insight of analysis.insights) {
        await supabaseClient
          .from('agente_insights')
          .insert({
            bar_id,
            tipo: insight.categoria,
            titulo: insight.titulo,
            descricao: insight.descricao,
            criticidade: insight.criticidade,
            dados: insight.dados_suporte,
            origem_ia: true
          })
      }
    }

    // 8. Salvar alertas
    if (analysis.alertas?.length > 0) {
      for (const alerta of analysis.alertas) {
        await supabaseClient
          .from('agente_alertas')
          .insert({
            bar_id,
            tipo: alerta.tipo,
            mensagem: alerta.mensagem,
            urgencia: alerta.urgencia,
            acao_recomendada: alerta.acao_recomendada,
            origem_ia: true
          })
      }
    }

    // 9. Salvar novos padrões detectados
    if (analysis.padroes_novos?.length > 0) {
      for (const padrao of analysis.padroes_novos) {
        await supabaseClient
          .from('agente_padroes_detectados')
          .insert({
            bar_id,
            tipo: padrao.tipo,
            descricao: padrao.descricao,
            confianca: padrao.confianca,
            dados_suporte: padrao.dados_suporte,
            status: padrao.confianca > 0.7 ? 'confirmado' : 'observando'
          })
      }
    }

    // 10. Salvar métricas de uso
    const tempoResposta = Date.now() - startTime
    const tokensInput = Math.ceil(prompt.length / 4)
    const tokensOutput = Math.ceil(responseText.length / 4)
    const custoEstimado = (tokensInput * 0.00000125) + (tokensOutput * 0.000005)

    await supabaseClient
      .from('agente_ia_metricas')
      .insert({
        bar_id,
        tipo_operacao: 'analise',
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
        analysis,
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
    console.error('Erro no agente-ia-analyzer:', error)
    
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
