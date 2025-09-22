import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Regras de negócio para eventos
const EVENTOS_RULES = {
  // Médias M1 por dia da semana (segunda = 0, domingo = 6)
  MEDIA_M1_POR_DIA: {
    0: 4742.88,  // Segunda
    1: 0.00,     // Terça
    2: 33200.17, // Quarta
    3: 18971.53, // Quinta
    4: 58811.74, // Sexta
    5: 47428.82, // Sábado
    6: 58811.74  // Domingo
  } as Record<number, number>,

  // Ticket médio planejado por dia da semana
  TE_PLAN_POR_DIA: {
    0: 18.00,    // Segunda
    1: 21.00,    // Terça
    2: 21.00,    // Quarta
    3: 21.00,    // Quinta
    4: 21.00,    // Sexta
    5: 21.00,    // Sábado
    6: 21.00     // Domingo
  } as Record<number, number>,

  // Ticket bebida planejado por dia da semana
  TB_PLAN_POR_DIA: {
    0: 82.50,    // Segunda
    1: 75.00,    // Terça
    2: 75.00,    // Quarta
    3: 75.00,    // Quinta
    4: 82.50,    // Sexta
    5: 82.50,    // Sábado
    6: 87.50     // Domingo
  } as Record<number, number>,

  // Categorias Nibo para custos
  NIBO_CATEGORIAS: {
    PRODUCAO_EVENTOS: 'Produção Eventos',
    ATRACOES_PROGRAMACAO: 'Atrações Programação'
  },

  // Padrões de data para busca na descrição
  DATA_PATTERNS: [
    /(\d{1,2})\/(\d{1,2})/,  // 13/07
    /(\d{1,2})\.(\d{1,2})/   // 13.07
  ]
}

// Função para obter dia da semana (0 = segunda, 6 = domingo)
function getDiaSemana(data: Date): number {
  const dia = data.getDay()
  return dia === 0 ? 6 : dia - 1 // Converte domingo de 0 para 6
}

// Função para obter média M1 baseada na data
function getMediaM1(data: Date): number {
  const diaSemana = getDiaSemana(data)
  return EVENTOS_RULES.MEDIA_M1_POR_DIA[diaSemana] || 0
}

// Função para obter ticket médio planejado baseado na data
function getTePlan(data: Date): number {
  const diaSemana = getDiaSemana(data)
  return EVENTOS_RULES.TE_PLAN_POR_DIA[diaSemana] || 21.00
}

// Função para obter ticket bebida planejado baseado na data
function getTbPlan(data: Date): number {
  const diaSemana = getDiaSemana(data)
  return EVENTOS_RULES.TB_PLAN_POR_DIA[diaSemana] || 75.00
}

// Função para extrair data da descrição
function extrairDataDaDescricao(descricao: string): Date | null {
  for (const pattern of EVENTOS_RULES.DATA_PATTERNS) {
    const match = descricao.match(pattern)
    if (match) {
      const dia = parseInt(match[1])
      const mes = parseInt(match[2])
      
      // Assumindo ano atual
      const ano = new Date().getFullYear()
      const data = new Date(ano, mes - 1, dia)
      
      // Se a data já passou, assume próximo ano
      if (data < new Date()) {
        data.setFullYear(ano + 1)
      }
      
      return data
    }
  }
  return null
}

// Função para calcular percentual artista sobre faturamento
function calcularPercentArtFat(custoArtistico: number, custoProducao: number, faturamentoReal: number): number {
  if (faturamentoReal <= 0) return 0
  
  // CORREÇÃO: Considerar apenas custo artístico (não produção) para o percentual
  // A produção faz parte dos custos operacionais, não do custo do artista sobre faturamento
  return (custoArtistico / faturamentoReal) * 100
}

// Função para buscar custos no Nibo
async function buscarCustosNibo(supabase: any, dataEvento: Date, barId: number): Promise<{custoArtistico: number, custoProducao: number}> {
  // CORREÇÃO: Usar data_competencia em vez de buscar na descrição
  const dataCompetencia = dataEvento.toISOString().split('T')[0] // YYYY-MM-DD
  
  // Buscar custos de produção
  const { data: producaoData } = await supabase
    .from('nibo_agendamentos')
    .select('valor')
    .eq('bar_id', barId)
    .eq('categoria_nome', EVENTOS_RULES.NIBO_CATEGORIAS.PRODUCAO_EVENTOS)
    .eq('data_competencia', dataCompetencia)

  // Buscar custos artísticos
  const { data: atracoesData } = await supabase
    .from('nibo_agendamentos')
    .select('valor')
    .eq('bar_id', barId)
    .eq('categoria_nome', EVENTOS_RULES.NIBO_CATEGORIAS.ATRACOES_PROGRAMACAO)
    .eq('data_competencia', dataCompetencia)

  const custoProducao = producaoData?.reduce((sum: number, item: any) => sum + (item.valor || 0), 0) || 0
  const custoArtistico = atracoesData?.reduce((sum: number, item: any) => sum + (item.valor || 0), 0) || 0

  return {
    custoArtistico,
    custoProducao
  }
}

serve(async (req) => {
  try {
    // Configurar CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { barId, dataInicio, dataFim } = await req.json()

    if (!barId) {
      return new Response(
        JSON.stringify({ error: 'barId é obrigatório' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Buscar eventos no período
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_evento', dataInicio || new Date().toISOString().split('T')[0])
      .lte('data_evento', dataFim || new Date().toISOString().split('T')[0])
      .order('data_evento')

    if (eventosError) {
      console.error('Erro ao buscar eventos:', eventosError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar eventos' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    const eventosAtualizados: any[] = []

    // Processar cada evento
    for (const evento of eventos || []) {
      const dataEvento = new Date(evento.data_evento)
      
      // Aplicar regras de negócio
      const m1_r = getMediaM1(dataEvento)
      const te_plan = getTePlan(dataEvento)
      const tb_plan = getTbPlan(dataEvento)
      
      // Buscar custos no Nibo
      const custos = await buscarCustosNibo(supabase, dataEvento, barId)
      
      // Calcular percentual artista sobre faturamento
      const percent_art_fat = calcularPercentArtFat(
        custos.custoArtistico,
        custos.custoProducao,
        evento.real_r || 0
      )

      // Preparar dados para atualização
      const dadosAtualizados = {
        m1_r,
        te_plan,
        tb_plan,
        c_art: custos.custoArtistico,
        c_prod: custos.custoProducao,
        percent_art_fat,
        atualizado_em: new Date().toISOString()
      }

      // Atualizar evento
      const { error: updateError } = await supabase
        .from('eventos')
        .update(dadosAtualizados)
        .eq('id', evento.id)

      if (updateError) {
        console.error(`Erro ao atualizar evento ${evento.id}:`, updateError)
        continue
      }

      eventosAtualizados.push({
        id: evento.id,
        nome: evento.nome,
        data_evento: evento.data_evento,
        ...dadosAtualizados
      })
    }

    // 🚀 CHAMAR DISCORD NOTIFICATION para EVENTOS (Sync)
    try {
      const discordResponse = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          title: '✅ Sync Eventos Concluído',
          webhook_type: 'eventos',
          processed_records: eventosAtualizados.length,
          bar_id: barId,
          execution_time: 'N/A',
          custom_message: `🔄 **Sincronização de eventos finalizada!**\n\n📊 **Resultados:**\n• **Eventos atualizados:** ${eventosAtualizados.length}\n• **Bar ID:** ${barId}\n• **Período:** ${dataInicio || 'Hoje'} até ${dataFim || 'Hoje'}\n\n💾 **Dados atualizados:** Métricas de performance e custos NIBO\n⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}`
        })
      });

      if (!discordResponse.ok) {
        console.error('❌ Erro ao enviar notificação Discord Sync-Eventos:', discordResponse.status);
      } else {
        console.log('📢 Notificação Discord Sync-Eventos enviada');
      }
    } catch (discordError) {
      console.error('❌ Erro ao enviar notificação Discord Sync-Eventos:', discordError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${eventosAtualizados.length} eventos atualizados com sucesso`,
        eventos_atualizados: eventosAtualizados
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Erro na sincronização de eventos:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
}) 