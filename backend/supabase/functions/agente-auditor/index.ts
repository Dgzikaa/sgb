import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

interface AuditoriaRequest {
  bar_id: number
  tipo: 'completa' | 'rapida' | 'especifica'
  tabela?: string
  periodo_dias?: number
}

interface ProblemaEncontrado {
  tipo: 'gap_temporal' | 'inconsistencia' | 'valor_anomalo' | 'duplicado' | 'ausente'
  severidade: 'baixa' | 'media' | 'alta' | 'critica'
  tabela: string
  descricao: string
  dados: any
  acao_sugerida: string
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

    const { bar_id, tipo = 'rapida', tabela, periodo_dias = 365 }: AuditoriaRequest = await req.json()
    const startTime = Date.now()

    const problemas: ProblemaEncontrado[] = []
    const estatisticas = {
      tabelas_verificadas: 0,
      registros_analisados: 0,
      tempo_execucao_ms: 0
    }

    console.log(`🔍 Iniciando auditoria ${tipo} para bar_id ${bar_id} (${periodo_dias} dias)`)

    // 1. AUDITORIA: Gaps Temporais (dias sem dados)
    console.log('🔍 Verificando gaps temporais...')
    
    // Verificar contahub_analitico
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - periodo_dias)
    
    const { data: faturamentoDiario } = await supabaseClient
      .from('contahub_analitico')
      .select('data, valor_bruto')
      .eq('bar_id', bar_id)
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: true })

    if (faturamentoDiario) {
      // Detectar gaps de mais de 1 dia
      for (let i = 1; i < faturamentoDiario.length; i++) {
        const dataAnterior = new Date(faturamentoDiario[i - 1].data)
        const dataAtual = new Date(faturamentoDiario[i].data)
        const diffDias = Math.floor((dataAtual.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDias > 1) {
          problemas.push({
            tipo: 'gap_temporal',
            severidade: diffDias > 7 ? 'alta' : 'media',
            tabela: 'contahub_analitico',
            descricao: `Gap de ${diffDias} dias entre ${faturamentoDiario[i-1].data} e ${faturamentoDiario[i].data}`,
            dados: {
              data_inicio: faturamentoDiario[i-1].data,
              data_fim: faturamentoDiario[i].data,
              dias_faltando: diffDias
            },
            acao_sugerida: 'Verificar se o bar estava fechado ou se houve falha na sincronização'
          })
        }
      }

      // Detectar dias com faturamento zero (suspeito)
      const diasZero = faturamentoDiario.filter(d => d.valor_bruto === 0 || d.valor_bruto === null)
      if (diasZero.length > 0) {
        problemas.push({
          tipo: 'valor_anomalo',
          severidade: 'media',
          tabela: 'contahub_analitico',
          descricao: `${diasZero.length} dias com faturamento zero ou nulo`,
          dados: {
            datas: diasZero.map(d => d.data).slice(0, 10), // Primeiros 10
            total_dias: diasZero.length
          },
          acao_sugerida: 'Verificar se eram dias de fechamento ou se há problema nos dados'
        })
      }
    }

    // 2. AUDITORIA: Desempenho Semanal
    console.log('🔍 Verificando desempenho_semanal...')
    
    const { data: desempenho } = await supabaseClient
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', bar_id)
      .order('data_inicio', { ascending: false })
      .limit(52) // Último ano

    if (desempenho) {
      // Verificar CMV impossíveis
      const cmvImpossiveis = desempenho.filter(d => 
        d.cmv_percentual < 0 || d.cmv_percentual > 100
      )
      if (cmvImpossiveis.length > 0) {
        problemas.push({
          tipo: 'inconsistencia',
          severidade: 'critica',
          tabela: 'desempenho_semanal',
          descricao: `${cmvImpossiveis.length} semanas com CMV impossível (< 0% ou > 100%)`,
          dados: {
            semanas: cmvImpossiveis.map(d => ({
              data_inicio: d.data_inicio,
              cmv: d.cmv_percentual
            }))
          },
          acao_sugerida: 'Recalcular CMV dessas semanas ou investigar dados fonte'
        })
      }

      // Verificar semanas sem dados
      const semanasSemDados = desempenho.filter(d => 
        !d.faturamento_bruto || d.faturamento_bruto === 0
      )
      if (semanasSemDados.length > 0) {
        problemas.push({
          tipo: 'ausente',
          severidade: 'alta',
          tabela: 'desempenho_semanal',
          descricao: `${semanasSemDados.length} semanas sem faturamento registrado`,
          dados: {
            semanas: semanasSemDados.map(d => d.data_inicio).slice(0, 10)
          },
          acao_sugerida: 'Sincronizar dados faltantes do ContaHub'
        })
      }
    }

    // 3. AUDITORIA: Checklists
    console.log('🔍 Verificando checklists...')
    
    const { data: checklists } = await supabaseClient
      .from('checklist_executions')
      .select('*')
      .eq('bar_id', bar_id)
      .gte('created_at', dataInicio.toISOString())

    if (checklists) {
      // Verificar taxa de conclusão
      const total = checklists.length
      const concluidos = checklists.filter(c => c.status === 'concluido').length
      const taxaConclusao = total > 0 ? (concluidos / total) * 100 : 0

      if (taxaConclusao < 70) {
        problemas.push({
          tipo: 'inconsistencia',
          severidade: 'alta',
          tabela: 'checklist_executions',
          descricao: `Taxa de conclusão de checklists muito baixa: ${taxaConclusao.toFixed(1)}%`,
          dados: {
            total,
            concluidos,
            taxa: taxaConclusao.toFixed(1)
          },
          acao_sugerida: 'Revisar processo de checklists ou treinar equipe'
        })
      }
    }

    // 4. AUDITORIA: Estoque
    console.log('🔍 Verificando estoque...')
    
    const { data: estoque } = await supabaseClient
      .from('estoque_insumos')
      .select('*')
      .eq('bar_id', bar_id)

    if (estoque) {
      // Verificar quantidades negativas
      const negativos = estoque.filter(e => e.quantidade < 0)
      if (negativos.length > 0) {
        problemas.push({
          tipo: 'inconsistencia',
          severidade: 'critica',
          tabela: 'estoque_insumos',
          descricao: `${negativos.length} produtos com estoque negativo`,
          dados: {
            produtos: negativos.map(e => ({
              produto: e.produto,
              quantidade: e.quantidade
            }))
          },
          acao_sugerida: 'Corrigir estoque desses produtos imediatamente'
        })
      }
    }

    // 5. AUDITORIA: Eventos sem dados de faturamento
    console.log('🔍 Verificando eventos sem faturamento...')
    
    const { data: eventosSemFat } = await supabaseClient
      .from('eventos_base')
      .select('data_evento, nome, real_r, m1_r')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .is('real_r', null)
      .gte('data_evento', dataInicio.toISOString().split('T')[0])
      .lt('data_evento', new Date().toISOString().split('T')[0])

    if (eventosSemFat && eventosSemFat.length > 0) {
      problemas.push({
        tipo: 'ausente',
        severidade: 'alta',
        tabela: 'eventos_base',
        descricao: `${eventosSemFat.length} eventos passados sem faturamento registrado`,
        dados: {
          eventos: eventosSemFat.slice(0, 10).map(e => ({
            data: e.data_evento,
            nome: e.nome,
            meta: e.m1_r
          }))
        },
        acao_sugerida: 'Executar sync do ContaHub ou inserir dados manualmente'
      })
    }

    // 6. AUDITORIA: Ticket médio anômalo
    console.log('🔍 Verificando tickets anômalos...')
    
    const { data: ticketsAnomalos } = await supabaseClient
      .from('eventos_base')
      .select('data_evento, nome, t_medio, cl_real, real_r')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .not('t_medio', 'is', null)
      .or('t_medio.lt.30,t_medio.gt.300')
      .gte('data_evento', dataInicio.toISOString().split('T')[0])

    if (ticketsAnomalos && ticketsAnomalos.length > 0) {
      problemas.push({
        tipo: 'valor_anomalo',
        severidade: 'media',
        tabela: 'eventos_base',
        descricao: `${ticketsAnomalos.length} eventos com ticket médio fora do padrão (<R$30 ou >R$300)`,
        dados: {
          eventos: ticketsAnomalos.slice(0, 5).map(e => ({
            data: e.data_evento,
            ticket: e.t_medio,
            clientes: e.cl_real,
            faturamento: e.real_r
          }))
        },
        acao_sugerida: 'Verificar se os dados de clientes e faturamento estão corretos'
      })
    }

    estatisticas.tabelas_verificadas = 5
    estatisticas.registros_analisados = (faturamentoDiario?.length || 0) + 
      (desempenho?.length || 0) + (checklists?.length || 0) + (estoque?.length || 0)

    // 7. USAR IA PARA ANÁLISE AVANÇADA
    console.log('🤖 Analisando com IA...')
    
    const prompt = `
Você é o AUDITOR DE DADOS do sistema Zykor (SGB - Sistema de Gestão de Bares).
Seu papel é identificar problemas nos dados e sugerir ações corretivas.

# CONTEXTO DO NEGÓCIO
- Sistema de gestão para bares e casas noturnas
- Principais fontes: ContaHub (PDV), NIBO (Financeiro), GetIn (Reservas)
- Bar analisado: Ordinário Bar (bar_id = ${bar_id})
- Metas: CMV < 34%, CMO < 20%, Ticket Médio > R$100

# PROBLEMAS ENCONTRADOS (${problemas.length} total)
${JSON.stringify(problemas, null, 2)}

# DADOS GERAIS
- Período analisado: ${periodo_dias} dias
- Tabelas verificadas: ${estatisticas.tabelas_verificadas}
- Registros analisados: ${estatisticas.registros_analisados}

# SUA MISSÃO
1. Classifique os problemas por impacto no negócio
2. Identifique a causa raiz provável
3. Sugira plano de ação prático e priorizado
4. Calcule o "score de saúde" dos dados (0-100)

# CRITÉRIOS DE SCORE
- 90-100: Excelente, poucos ajustes
- 70-89: Bom, alguns problemas a corrigir
- 50-69: Regular, atenção necessária
- 30-49: Ruim, ação urgente
- 0-29: Crítico, dados comprometidos

Responda em JSON:
{
  "resumo_executivo": "Síntese em 2-3 linhas",
  "score_saude_dados": 0-100,
  "problemas_prioritarios": [
    {
      "problema": "Descrição clara",
      "causa_provavel": "Por que aconteceu",
      "impacto_estimado": "R$ ou % afetado",
      "urgencia": "baixa|media|alta|critica",
      "passos_correcao": ["Passo 1", "Passo 2"]
    }
  ],
  "padroes_identificados": ["Padrão 1", "Padrão 2"],
  "recomendacoes_gerais": ["Rec 1", "Rec 2"],
  "proxima_auditoria_sugerida": "Em X dias"
}
`

    let analiseIA = null
    if (GEMINI_API_KEY) {
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
              maxOutputTokens: 4096,
            }
          })
        }
      )

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json()
        const responseText = geminiData.candidates[0].content.parts[0].text
        
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          analiseIA = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
        } catch (e) {
          console.error('Erro ao parsear resposta IA:', e)
        }
      }
    }

    const tempoTotal = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        auditoria: {
          bar_id,
          periodo_dias,
          tipo_auditoria: tipo,
          timestamp: new Date().toISOString(),
          tempo_execucao_ms: tempoTotal
        },
        problemas_encontrados: problemas,
        total_problemas: problemas.length,
        analise_ia: analiseIA,
        estatisticas: {
          criticos: problemas.filter(p => p.severidade === 'critica').length,
          altos: problemas.filter(p => p.severidade === 'alta').length,
          medios: problemas.filter(p => p.severidade === 'media').length,
          baixos: problemas.filter(p => p.severidade === 'baixa').length
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
    console.error('Erro no agente-auditor:', error)
    
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
