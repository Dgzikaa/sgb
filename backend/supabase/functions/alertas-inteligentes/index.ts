import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

interface Alerta {
  tipo: 'critico' | 'erro' | 'aviso' | 'info' | 'sucesso'
  categoria: string
  titulo: string
  mensagem: string
  dados?: Record<string, unknown>
  acoes_sugeridas?: string[]
}

interface AnaliseResultado {
  alertas: Alerta[]
  insights: string[]
  metricas: Record<string, number>
}

// ========================================
// 🧠 SERVIÇO DE ALERTAS INTELIGENTES
// ========================================
class AlertasInteligentesService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  // ========================================
  // 📊 ANÁLISE DE FATURAMENTO
  // ========================================
  async analisarFaturamento(barId: number): Promise<Alerta[]> {
    const alertas: Alerta[] = []
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    const ontemStr = ontem.toISOString().split('T')[0]
    
    // Buscar evento de ontem
    const { data: eventoOntem } = await this.supabase
      .from('eventos_base')
      .select('*')
      .eq('bar_id', barId)
      .eq('data_evento', ontemStr)
      .eq('ativo', true)
      .single()

    if (!eventoOntem) {
      return alertas
    }

    const faturamento = eventoOntem.real_r || 0
    const meta = eventoOntem.m1_r || 0
    const pax = eventoOntem.cl_real || 0

    // Verificar se bateu a meta
    if (meta > 0 && faturamento < meta * 0.8) {
      const percentual = ((faturamento / meta) * 100).toFixed(1)
      alertas.push({
        tipo: 'aviso',
        categoria: 'faturamento',
        titulo: '📉 Faturamento abaixo da meta',
        mensagem: `Ontem (${ontemStr}) o faturamento foi de R$ ${faturamento.toLocaleString('pt-BR')} (${percentual}% da meta de R$ ${meta.toLocaleString('pt-BR')})`,
        dados: { faturamento, meta, percentual: parseFloat(percentual), data: ontemStr },
        acoes_sugeridas: [
          'Revisar atração/evento do dia',
          'Verificar se houve problemas operacionais',
          'Comparar com mesma data do mês anterior'
        ]
      })
    } else if (meta > 0 && faturamento >= meta * 1.2) {
      const percentual = ((faturamento / meta) * 100).toFixed(1)
      alertas.push({
        tipo: 'sucesso',
        categoria: 'faturamento',
        titulo: '🎉 Meta superada!',
        mensagem: `Ontem (${ontemStr}) o faturamento foi de R$ ${faturamento.toLocaleString('pt-BR')} (${percentual}% da meta!)`,
        dados: { faturamento, meta, percentual: parseFloat(percentual), data: ontemStr }
      })
    }

    // Verificar ticket médio
    if (pax > 0) {
      const ticketMedio = faturamento / pax
      if (ticketMedio < 80) {
        alertas.push({
          tipo: 'aviso',
          categoria: 'ticket',
          titulo: '💰 Ticket médio baixo',
          mensagem: `Ticket médio de R$ ${ticketMedio.toFixed(2)} está abaixo do esperado (R$ 80+)`,
          dados: { ticketMedio, pax, faturamento },
          acoes_sugeridas: [
            'Revisar sugestive selling da equipe',
            'Verificar promoções que podem estar canibalizando',
            'Analisar mix de produtos vendidos'
          ]
        })
      }
    }

    return alertas
  }

  // ========================================
  // 📈 ANÁLISE DE CMV
  // ========================================
  async analisarCMV(barId: number): Promise<Alerta[]> {
    const alertas: Alerta[] = []
    
    // Buscar CMV da última semana
    const umaSemanaAtras = new Date()
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7)
    const dataInicio = umaSemanaAtras.toISOString().split('T')[0]

    const { data: cmvData } = await this.supabase
      .from('cmv_semanal')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_inicio', dataInicio)
      .order('data_inicio', { ascending: false })
      .limit(1)
      .single()

    if (cmvData) {
      const cmvPercentual = cmvData.cmv_percentual || 0
      
      if (cmvPercentual > 35) {
        alertas.push({
          tipo: 'critico',
          categoria: 'cmv',
          titulo: '🚨 CMV acima do limite',
          mensagem: `CMV semanal está em ${cmvPercentual.toFixed(1)}% (meta: < 34%)`,
          dados: { cmvPercentual, meta: 34 },
          acoes_sugeridas: [
            'Revisar precificação dos produtos',
            'Verificar desperdício na cozinha/bar',
            'Analisar produtos com maior custo'
          ]
        })
      } else if (cmvPercentual > 32) {
        alertas.push({
          tipo: 'aviso',
          categoria: 'cmv',
          titulo: '⚠️ CMV em zona de atenção',
          mensagem: `CMV semanal em ${cmvPercentual.toFixed(1)}% - próximo do limite`,
          dados: { cmvPercentual, meta: 34 }
        })
      }
    }

    return alertas
  }

  // ========================================
  // 👥 ANÁLISE DE CLIENTES
  // ========================================
  async analisarClientes(barId: number): Promise<Alerta[]> {
    const alertas: Alerta[] = []
    
    // Buscar clientes ativos nos últimos 7 dias vs 7 dias anteriores
    const hoje = new Date()
    const seteDiasAtras = new Date(hoje)
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
    const quatorzeDiasAtras = new Date(hoje)
    quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14)

    const { data: semanaAtual } = await this.supabase
      .from('contahub_periodo')
      .select('cli_telefone')
      .eq('bar_id', barId)
      .gte('dt_gerencial', seteDiasAtras.toISOString().split('T')[0])
      .not('cli_telefone', 'is', null)

    const { data: semanaAnterior } = await this.supabase
      .from('contahub_periodo')
      .select('cli_telefone')
      .eq('bar_id', barId)
      .gte('dt_gerencial', quatorzeDiasAtras.toISOString().split('T')[0])
      .lt('dt_gerencial', seteDiasAtras.toISOString().split('T')[0])
      .not('cli_telefone', 'is', null)

    const clientesAtual = new Set(semanaAtual?.map(c => c.cli_telefone) || []).size
    const clientesAnterior = new Set(semanaAnterior?.map(c => c.cli_telefone) || []).size

    if (clientesAnterior > 0) {
      const variacao = ((clientesAtual - clientesAnterior) / clientesAnterior) * 100

      if (variacao < -20) {
        alertas.push({
          tipo: 'aviso',
          categoria: 'clientes',
          titulo: '📉 Queda significativa de clientes',
          mensagem: `${Math.abs(variacao).toFixed(1)}% menos clientes esta semana (${clientesAtual}) vs anterior (${clientesAnterior})`,
          dados: { clientesAtual, clientesAnterior, variacao },
          acoes_sugeridas: [
            'Verificar calendário de eventos',
            'Revisar estratégia de marketing',
            'Checar se houve problemas operacionais'
          ]
        })
      } else if (variacao > 20) {
        alertas.push({
          tipo: 'sucesso',
          categoria: 'clientes',
          titulo: '📈 Crescimento de clientes!',
          mensagem: `+${variacao.toFixed(1)}% de clientes esta semana!`,
          dados: { clientesAtual, clientesAnterior, variacao }
        })
      }
    }

    return alertas
  }

  // ========================================
  // 🔄 ANÁLISE DE ESTOQUES
  // ========================================
  async analisarEstoques(barId: number): Promise<Alerta[]> {
    const alertas: Alerta[] = []

    // Buscar itens com estoque baixo
    const { data: estoques } = await this.supabase
      .from('contagens_estoque')
      .select('*')
      .eq('bar_id', barId)
      .eq('alerta_variacao', true)
      .order('data_contagem', { ascending: false })
      .limit(10)

    if (estoques && estoques.length > 3) {
      alertas.push({
        tipo: 'aviso',
        categoria: 'estoque',
        titulo: '📦 Múltiplos alertas de estoque',
        mensagem: `${estoques.length} itens com variação anormal de estoque detectados`,
        dados: { quantidade: estoques.length, itens: estoques.map(e => e.descricao) },
        acoes_sugeridas: [
          'Verificar possíveis perdas ou furtos',
          'Revisar processos de contagem',
          'Checar consumo vs vendas'
        ]
      })
    }

    // Buscar anomalias de contagem
    const { data: anomalias } = await this.supabase
      .from('contagens_estoque')
      .select('*')
      .eq('bar_id', barId)
      .eq('contagem_anomala', true)
      .order('data_contagem', { ascending: false })
      .limit(5)

    if (anomalias && anomalias.length > 0) {
      alertas.push({
        tipo: 'erro',
        categoria: 'estoque',
        titulo: '🚨 Anomalias de contagem detectadas',
        mensagem: `${anomalias.length} contagem(ns) anômala(s) requer(em) atenção`,
        dados: { anomalias: anomalias.map(a => ({ descricao: a.descricao, score: a.score_anomalia })) }
      })
    }

    return alertas
  }

  // ========================================
  // 🤖 ANÁLISE COM IA (Gemini)
  // ========================================
  async analisarComIA(dados: Record<string, unknown>): Promise<string[]> {
    if (!geminiApiKey) {
      console.log('Gemini API Key não configurada')
      return []
    }

    try {
      const prompt = `
Você é um analista de negócios de um bar/restaurante. Analise os dados abaixo e retorne até 3 insights relevantes.
Seja direto e objetivo. Foque em ações que podem ser tomadas.

Dados:
${JSON.stringify(dados, null, 2)}

Retorne APENAS um JSON array de strings com os insights, sem markdown:
["insight 1", "insight 2", "insight 3"]
`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500
            }
          })
        }
      )

      if (!response.ok) {
        console.error('Erro na API Gemini:', response.status)
        return []
      }

      const result = await response.json()
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      
      // Extrair JSON do texto
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return []
    } catch (error) {
      console.error('Erro ao analisar com IA:', error)
      return []
    }
  }

  // ========================================
  // 🔔 EXECUTAR ANÁLISE COMPLETA
  // ========================================
  async executarAnaliseCompleta(barId: number): Promise<AnaliseResultado> {
    console.log(`[Alertas Inteligentes] Iniciando análise para bar ${barId}`)

    // Executar todas as análises em paralelo
    const [alertasFaturamento, alertasCMV, alertasClientes, alertasEstoques] = await Promise.all([
      this.analisarFaturamento(barId),
      this.analisarCMV(barId),
      this.analisarClientes(barId),
      this.analisarEstoques(barId)
    ])

    const todosAlertas = [
      ...alertasFaturamento,
      ...alertasCMV,
      ...alertasClientes,
      ...alertasEstoques
    ]

    // Coletar métricas para análise IA
    const metricas: Record<string, number> = {}
    todosAlertas.forEach(a => {
      if (a.dados) {
        Object.entries(a.dados).forEach(([key, value]) => {
          if (typeof value === 'number') {
            metricas[`${a.categoria}_${key}`] = value
          }
        })
      }
    })

    // Gerar insights com IA (se houver dados)
    let insights: string[] = []
    if (Object.keys(metricas).length > 0) {
      insights = await this.analisarComIA({ metricas, alertas: todosAlertas.map(a => a.titulo) })
    }

    console.log(`[Alertas Inteligentes] Análise concluída: ${todosAlertas.length} alertas, ${insights.length} insights`)

    return {
      alertas: todosAlertas,
      insights,
      metricas
    }
  }

  // ========================================
  // 📤 ENVIAR PARA DISCORD
  // ========================================
  async enviarParaDiscord(barId: number, resultado: AnaliseResultado): Promise<boolean> {
    // Buscar webhook configurado
    const { data: webhook } = await this.supabase
      .from('discord_webhooks')
      .select('webhook_url')
      .eq('bar_id', barId)
      .eq('tipo', 'alertas')
      .eq('ativo', true)
      .single()

    if (!webhook?.webhook_url) {
      console.log('Webhook de alertas não configurado')
      return false
    }

    // Filtrar apenas alertas importantes (crítico, erro, aviso)
    const alertasImportantes = resultado.alertas.filter(a => 
      ['critico', 'erro', 'aviso'].includes(a.tipo)
    )

    if (alertasImportantes.length === 0 && resultado.insights.length === 0) {
      console.log('Nenhum alerta importante para enviar')
      return true
    }

    // Montar embed
    const fields = alertasImportantes.map(alerta => {
      const emoji = alerta.tipo === 'critico' ? '🚨' : 
                    alerta.tipo === 'erro' ? '❌' : 
                    alerta.tipo === 'aviso' ? '⚠️' : 'ℹ️'
      return {
        name: `${emoji} ${alerta.titulo}`,
        value: alerta.mensagem.substring(0, 200),
        inline: false
      }
    })

    // Adicionar insights
    if (resultado.insights.length > 0) {
      fields.push({
        name: '💡 Insights da IA',
        value: resultado.insights.map(i => `• ${i}`).join('\n').substring(0, 500),
        inline: false
      })
    }

    const color = resultado.alertas.some(a => a.tipo === 'critico') ? 0xff0000 :
                  resultado.alertas.some(a => a.tipo === 'erro') ? 0xff6600 :
                  resultado.alertas.some(a => a.tipo === 'aviso') ? 0xffcc00 : 0x00ff00

    const embed = {
      title: `🤖 Análise Inteligente - ${new Date().toLocaleDateString('pt-BR')}`,
      description: `Foram detectados **${alertasImportantes.length}** alertas e gerados **${resultado.insights.length}** insights.`,
      color,
      fields,
      footer: { text: 'SGB - Agente de Análise Automática' },
      timestamp: new Date().toISOString()
    }

    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao enviar para Discord:', error)
      return false
    }
  }

  // ========================================
  // 💾 SALVAR ALERTAS NO BANCO
  // ========================================
  async salvarAlertas(barId: number, alertas: Alerta[]): Promise<void> {
    for (const alerta of alertas) {
      await this.supabase
        .from('alertas_enviados')
        .insert({
          bar_id: barId,
          tipo: alerta.tipo,
          categoria: alerta.categoria,
          titulo: alerta.titulo,
          mensagem: alerta.mensagem,
          dados: alerta.dados || {},
          criado_em: new Date().toISOString()
        })
    }
  }
}

// ========================================
// 🚀 HANDLER PRINCIPAL
// ========================================
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const body = await req.json()
    const { action = 'analisar', barId = 3, enviarDiscord = true } = body

    const service = new AlertasInteligentesService()

    switch (action) {
      case 'analisar': {
        const resultado = await service.executarAnaliseCompleta(barId)
        
        // Salvar alertas
        if (resultado.alertas.length > 0) {
          await service.salvarAlertas(barId, resultado.alertas)
        }

        // Enviar para Discord se configurado
        if (enviarDiscord) {
          await service.enviarParaDiscord(barId, resultado)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            resultado,
            message: `Análise concluída: ${resultado.alertas.length} alertas detectados`
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      case 'faturamento': {
        const alertas = await service.analisarFaturamento(barId)
        return new Response(
          JSON.stringify({ success: true, alertas }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      case 'cmv': {
        const alertas = await service.analisarCMV(barId)
        return new Response(
          JSON.stringify({ success: true, alertas }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      case 'clientes': {
        const alertas = await service.analisarClientes(barId)
        return new Response(
          JSON.stringify({ success: true, alertas }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      case 'estoques': {
        const alertas = await service.analisarEstoques(barId)
        return new Response(
          JSON.stringify({ success: true, alertas }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Erro na Edge Function alertas-inteligentes:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
