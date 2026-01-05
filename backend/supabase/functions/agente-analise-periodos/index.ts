import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

interface PeriodoBar {
  data: string
  dia_semana: string
  deveria_estar_aberto: boolean
  tem_dados: boolean
  faturamento: number | null
  problema?: string
}

interface FalhaPorPeriodo {
  periodo: string
  total_dias: number
  dias_com_dados: number
  dias_sem_dados: number
  taxa_cobertura: number
  dias_problematicos: string[]
  impacto_estimado: string
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

    const { bar_id, dias_analisar = 365 } = await req.json()
    const startTime = Date.now()

    console.log(`📅 Analisando ${dias_analisar} dias do bar ${bar_id}...`)

    // 1. BUSCAR INFORMAÇÕES DO BAR
    const { data: bar } = await supabaseClient
      .from('bars')
      .select('nome, cidade, ativo, created_at')
      .eq('id', bar_id)
      .single()

    if (!bar) {
      throw new Error('Bar não encontrado')
    }

    // 2. BUSCAR DADOS DE FATURAMENTO DIÁRIO
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - dias_analisar)

    const { data: faturamentoDiario } = await supabaseClient
      .from('contahub_analitico')
      .select('data, valor_bruto')
      .eq('bar_id', bar_id)
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: true })

    // 3. MAPEAR TODOS OS DIAS DO PERÍODO
    const periodos: PeriodoBar[] = []
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    
    for (let i = 0; i < dias_analisar; i++) {
      const data = new Date()
      data.setDate(data.getDate() - (dias_analisar - i))
      const dataStr = data.toISOString().split('T')[0]
      const diaSemana = diasDaSemana[data.getDay()]

      // Verificar se tem dados para esse dia
      const dadoDia = faturamentoDiario?.find(f => f.data === dataStr)
      const temDados = !!dadoDia
      const faturamento = dadoDia?.valor_bruto || null

      // Determinar se deveria estar aberto
      // Regra: bares geralmente não abrem Segunda ou estão fechados se faturamento = 0 consistentemente
      let deveriaEstarAberto = true
      
      // Se é Segunda, pode estar fechado
      if (diaSemana === 'Segunda') {
        deveriaEstarAberto = faturamento !== null && faturamento > 0
      }

      // Detectar problema
      let problema = undefined
      if (deveriaEstarAberto && !temDados) {
        problema = 'Dia sem dados (bar deveria estar aberto)'
      } else if (deveriaEstarAberto && faturamento === 0) {
        problema = 'Faturamento zero (suspeito)'
      } else if (temDados && faturamento && faturamento < 100) {
        problema = 'Faturamento muito baixo (< R$ 100)'
      }

      periodos.push({
        data: dataStr,
        dia_semana: diaSemana,
        deveria_estar_aberto: deveriaEstarAberto,
        tem_dados: temDados,
        faturamento,
        problema
      })
    }

    // 4. AGRUPAR FALHAS POR PERÍODO (mensal)
    const falhasPorMes: Record<string, FalhaPorPeriodo> = {}
    
    periodos.forEach(p => {
      const mes = p.data.substring(0, 7) // YYYY-MM
      
      if (!falhasPorMes[mes]) {
        falhasPorMes[mes] = {
          periodo: mes,
          total_dias: 0,
          dias_com_dados: 0,
          dias_sem_dados: 0,
          taxa_cobertura: 0,
          dias_problematicos: [],
          impacto_estimado: ''
        }
      }

      falhasPorMes[mes].total_dias++
      
      if (p.tem_dados) {
        falhasPorMes[mes].dias_com_dados++
      } else if (p.deveria_estar_aberto) {
        falhasPorMes[mes].dias_sem_dados++
        falhasPorMes[mes].dias_problematicos.push(p.data)
      }

      if (p.problema) {
        falhasPorMes[mes].dias_problematicos.push(`${p.data}: ${p.problema}`)
      }
    })

    // Calcular taxa de cobertura e impacto
    Object.values(falhasPorMes).forEach(f => {
      f.taxa_cobertura = (f.dias_com_dados / f.total_dias) * 100
      
      if (f.taxa_cobertura < 50) {
        f.impacto_estimado = 'CRÍTICO - Mais de 50% dos dados faltando'
      } else if (f.taxa_cobertura < 80) {
        f.impacto_estimado = 'ALTO - Dados incompletos comprometem análises'
      } else if (f.taxa_cobertura < 95) {
        f.impacto_estimado = 'MÉDIO - Alguns gaps de dados'
      } else {
        f.impacto_estimado = 'BAIXO - Dados praticamente completos'
      }
    })

    // 5. ESTATÍSTICAS GERAIS
    const totalDiasAnalisados = periodos.length
    const diasComDados = periodos.filter(p => p.tem_dados).length
    const diasComProblema = periodos.filter(p => p.problema).length
    const taxaCoberturaGeral = (diasComDados / totalDiasAnalisados) * 100

    // 6. DETECTAR PADRÕES COM IA
    const analiseIA = await analisarPadroesComIA(bar, periodos, falhasPorMes)

    const tempoTotal = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        bar: {
          id: bar_id,
          nome: bar.nome,
          cidade: bar.cidade
        },
        resumo: {
          periodo_analisado: `${dataInicio.toISOString().split('T')[0]} até hoje`,
          total_dias: totalDiasAnalisados,
          dias_com_dados: diasComDados,
          dias_sem_dados: totalDiasAnalisados - diasComDados,
          dias_com_problema: diasComProblema,
          taxa_cobertura_geral: parseFloat(taxaCoberturaGeral.toFixed(2))
        },
        falhas_por_mes: Object.values(falhasPorMes),
        analise_ia: analiseIA,
        periodos_detalhados: periodos.filter(p => p.problema), // Apenas dias problemáticos
        tempo_execucao_ms: tempoTotal
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro na análise de períodos:', error)
    
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

async function analisarPadroesComIA(bar: any, periodos: PeriodoBar[], falhasPorMes: Record<string, FalhaPorPeriodo>) {
  if (!GEMINI_API_KEY) return null

  const prompt = `
Você é um especialista em análise de dados operacionais de bares.

# BAR
Nome: ${bar.nome}
Cidade: ${bar.cidade}

# DADOS ANALISADOS
Total de dias: ${periodos.length}
Dias com problemas: ${periodos.filter(p => p.problema).length}

# FALHAS POR MÊS
${JSON.stringify(Object.values(falhasPorMes), null, 2)}

# DIAS PROBLEMÁTICOS (Amostra)
${JSON.stringify(periodos.filter(p => p.problema).slice(0, 20), null, 2)}

# SUA MISSÃO
1. Identificar padrões nos dias sem dados (há um dia da semana recorrente?)
2. Detectar períodos críticos (meses inteiros com dados ruins)
3. Avaliar impacto nas análises de negócio
4. Sugerir ações corretivas

Responda em JSON:
{
  "padroes_detectados": [
    {"padrao": "string", "frequencia": "string", "impacto": "string"}
  ],
  "periodos_criticos": [
    {"periodo": "string", "problema": "string", "acao_sugerida": "string"}
  ],
  "impacto_geral": {
    "gravidade": "baixa|media|alta|critica",
    "analises_comprometidas": ["string"],
    "confiabilidade_dados": "0-100%"
  },
  "acoes_recomendadas": [
    {"acao": "string", "prioridade": "baixa|media|alta", "prazo": "string"}
  ]
}
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
            temperature: 0.3,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      const responseText = data.candidates[0].content.parts[0].text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      return JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    }
  } catch (error) {
    console.error('Erro na análise com IA:', error)
  }

  return null
}
