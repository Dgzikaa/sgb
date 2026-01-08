import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

const SUPABASE_FUNCTIONS_URL = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co/functions/v1')

interface SupervisorRequest {
  bar_id: number
  tarefa: string
  usuario_id?: string
}

interface AgenteDisponivel {
  nome: string
  especialidade: string
  endpoint: string
  quando_usar: string[]
}

// Contexto de negócio para decisões mais inteligentes
const CONTEXTO_ZYKOR = `
O Zykor é um sistema de gestão para bares e casas noturnas.
Principais métricas: Faturamento (real_r), CMV, CMO, Ticket Médio, Público (PAX).
Cada dia é um "evento". Semanas são consolidadas em desempenho_semanal.
O principal cliente é o Ordinário Bar (bar_id = 3).
`

const AGENTES: AgenteDisponivel[] = [
  {
    nome: 'agente-sql-expert',
    especialidade: 'Consultas ao banco de dados e extração de dados',
    endpoint: '/agente-sql-expert',
    quando_usar: [
      'faturamento',
      'quanto faturou',
      'quantos clientes',
      'ticket médio',
      'produtos mais vendidos',
      'top',
      'ranking',
      'comparar',
      'semana passada',
      'mês',
      'ontem',
      'hoje',
      'CMV',
      'custo',
      'consultar',
      'buscar dados',
      'relatório',
      'lista',
      'qual foi',
      'como foi',
      'como está'
    ]
  },
  {
    nome: 'agente-auditor',
    especialidade: 'Auditoria de dados, detecção de gaps, anomalias e inconsistências',
    endpoint: '/agente-auditor',
    quando_usar: [
      'auditar',
      'verificar dados',
      'consistência',
      'gaps',
      'faltando dados',
      'anomalia',
      'problema nos dados',
      'checar',
      'validar',
      'integridade',
      'qualidade dos dados',
      'erros'
    ]
  },
  {
    nome: 'agente-ia-analyzer',
    especialidade: 'Análise estratégica, insights e recomendações baseadas em dados',
    endpoint: '/agente-ia-analyzer',
    quando_usar: [
      'analisar',
      'insight',
      'tendência',
      'oportunidade',
      'problema',
      'sugestão',
      'recomendação',
      'o que fazer',
      'melhorar',
      'estratégia',
      'previsão',
      'projeção'
    ]
  },
  {
    nome: 'agente-alertas',
    especialidade: 'Monitoramento de alertas críticos e notificações',
    endpoint: '/alertas-inteligentes',
    quando_usar: [
      'alertas',
      'notificação',
      'avisos',
      'crítico',
      'urgente',
      'atenção',
      'monitorar',
      'discord'
    ]
  }
]

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { bar_id, tarefa, usuario_id }: SupervisorRequest = await req.json()
    const startTime = Date.now()

    console.log('🧠 Supervisor recebeu tarefa:', tarefa)

    // 1. USAR IA PARA DECIDIR QUAL AGENTE CHAMAR
    const dataAtual = new Date().toISOString().split('T')[0]
    const diaSemana = new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
    const hora = new Date().getHours()

    const prompt = `
Você é o SUPERVISOR INTELIGENTE do sistema Zykor (SGB - Sistema de Gestão de Bares).
Sua missão é entender a intenção do usuário e direcionar para o agente correto.

# CONTEXTO DO NEGÓCIO
${CONTEXTO_ZYKOR}

# DATA E HORA ATUAL
- Data: ${dataAtual}
- Dia da semana: ${diaSemana}
- Hora: ${hora}h
- Bar ID: ${bar_id}

# TAREFA DO USUÁRIO
"${tarefa}"

# AGENTES DISPONÍVEIS E QUANDO USAR

1. **agente-sql-expert** (MAIS COMUM - 80% dos casos)
   Use para: Consultas de dados, faturamento, clientes, produtos, métricas
   Exemplos: "Quanto faturou ontem?", "Top 10 produtos", "CMV da semana"
   
2. **agente-auditor** (DIAGNÓSTICO)
   Use para: Verificar qualidade dos dados, encontrar problemas, gaps
   Exemplos: "Tem dados faltando?", "Verificar inconsistências"
   
3. **agente-ia-analyzer** (INSIGHTS)
   Use para: Análises estratégicas, tendências, recomendações
   Exemplos: "O que pode melhorar?", "Qual a tendência?"
   
4. **agente-alertas** (MONITORAMENTO)
   Use para: Verificar alertas, problemas críticos, notificações
   Exemplos: "Tem alertas?", "Enviar para Discord"

# REGRAS DE DECISÃO

1. **Perguntas sobre dados/números** → agente-sql-expert
2. **"Como foi X?"** ou **"Qual foi X?"** → agente-sql-expert  
3. **Problemas ou diagnósticos** → agente-auditor
4. **"O que fazer?"** ou insights → agente-ia-analyzer
5. **Saudações simples** → responder_direto
6. **Dúvidas sobre o sistema** → responder_direto

# RESPONDA EM JSON
{
  "decisao": "chamar_agente" | "chamar_multiplos" | "responder_direto",
  "agentes_selecionados": ["nome-do-agente"],
  "ordem_execucao": [1],
  "razao": "Explicação curta da escolha",
  "resposta_direta": "Se responder direto, coloque aqui a resposta amigável. Senão, null",
  "contexto_extra": "Informação adicional para passar ao agente, se houver"
}

IMPORTANTE: Na maioria das vezes, usar agente-sql-expert é a escolha certa.
`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${await geminiResponse.text()}`)
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates[0].content.parts[0].text

    let decisao
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      decisao = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch (e) {
      console.error('Erro ao parsear decisão:', responseText)
      throw new Error('Erro ao processar decisão do supervisor')
    }

    console.log('🎯 Decisão do supervisor:', decisao)

    // 2. EXECUTAR DECISÃO
    const resultados: any[] = []

    if (decisao.decisao === 'responder_direto') {
      // Resposta direta, sem chamar agente
      return new Response(
        JSON.stringify({
          success: true,
          supervisor: {
            decisao: 'resposta_direta',
            razao: decisao.razao
          },
          resposta: decisao.resposta_direta,
          tempo_total_ms: Date.now() - startTime
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 3. CHAMAR AGENTE(S) SELECIONADO(S)
    for (const nomeAgente of decisao.agentes_selecionados) {
      const agente = AGENTES.find(a => a.nome === nomeAgente)
      
      if (!agente) {
        console.warn(`Agente ${nomeAgente} não encontrado`)
        continue
      }

      console.log(`📞 Chamando ${agente.nome}...`)

      try {
        // Preparar payload específico para cada agente
        let payload: any = { bar_id }

        if (agente.nome === 'agente-chat') {
          payload.usuario_id = usuario_id
          payload.mensagem = tarefa
        } else if (agente.nome === 'agente-auditor') {
          payload.tipo = 'rapida'
          payload.periodo_dias = 365
        } else if (agente.nome === 'agente-sql-expert') {
          payload.pergunta = tarefa
        } else if (agente.nome === 'agente-ia-analyzer') {
          // Buscar dados recentes para análise
          const { data: scan } = await supabaseClient
            .from('agente_scans')
            .select('dados')
            .eq('bar_id', bar_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          payload.scan_data = scan?.dados || {}
        }

        // Chamar agente
        const agenteResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}${agente.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify(payload)
        })

        if (agenteResponse.ok) {
          const agenteData = await agenteResponse.json()
          resultados.push({
            agente: agente.nome,
            sucesso: true,
            resultado: agenteData
          })
        } else {
          resultados.push({
            agente: agente.nome,
            sucesso: false,
            erro: await agenteResponse.text()
          })
        }

      } catch (error) {
        console.error(`Erro ao chamar ${agente.nome}:`, error)
        resultados.push({
          agente: agente.nome,
          sucesso: false,
          erro: error.message
        })
      }
    }

    // 4. CONSOLIDAR RESPOSTAS (se múltiplos agentes)
    let respostaFinal
    
    if (decisao.agentes_selecionados.length === 1) {
      respostaFinal = resultados[0]?.resultado
    } else {
      // Usar IA para consolidar múltiplas respostas
      const promptConsolidacao = `
Você recebeu respostas de múltiplos agentes especializados.
Consolide essas respostas em uma resposta única e coerente para o usuário.

# TAREFA ORIGINAL
"${tarefa}"

# RESPOSTAS DOS AGENTES
${JSON.stringify(resultados, null, 2)}

# SUA MISSÃO
Crie uma resposta consolidada que:
1. Integre as informações de todos os agentes
2. Seja clara e acionável
3. Destaque os pontos mais importantes
4. Mantenha contexto técnico se necessário

Responda em texto natural (não JSON).
`

      const consolidacaoResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptConsolidacao }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        }
      )

      if (consolidacaoResponse.ok) {
        const consolidacaoData = await consolidacaoResponse.json()
        respostaFinal = consolidacaoData.candidates[0].content.parts[0].text
      } else {
        respostaFinal = resultados
      }
    }

    const tempoTotal = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        supervisor: {
          decisao: decisao.decisao,
          agentes_chamados: decisao.agentes_selecionados,
          razao: decisao.razao
        },
        resposta: respostaFinal,
        resultados_agentes: resultados,
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
    console.error('Erro no agente-supervisor:', error)
    
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
