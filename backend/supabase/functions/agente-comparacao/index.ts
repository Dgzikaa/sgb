import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ComparacaoRequest {
  action: 'eventos' | 'periodos' | 'dias_semana' | 'artistas' | 'ranking';
  barId?: number;
  params?: {
    evento1?: string;
    evento2?: string;
    periodo1?: { inicio: string; fim: string };
    periodo2?: { inicio: string; fim: string };
    metrica?: string;
    limite?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, barId = 3, params }: ComparacaoRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const hoje = new Date()
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

    switch (action) {
      case 'eventos': {
        // Comparar dois eventos específicos
        const { evento1, evento2 } = params || {}
        
        if (!evento1 || !evento2) {
          // Se não especificado, comparar últimos 2 eventos do mesmo dia da semana
          const { data: ultimosEventos } = await supabase
            .from('eventos_base')
            .select('*')
            .eq('bar_id', barId)
            .eq('ativo', true)
            .not('real_r', 'is', null)
            .order('data_evento', { ascending: false })
            .limit(10)

          // Agrupar por dia da semana e pegar 2 do mesmo dia
          const porDia: Record<string, any[]> = {}
          ultimosEventos?.forEach(e => {
            const dia = e.dia_semana
            if (!porDia[dia]) porDia[dia] = []
            porDia[dia].push(e)
          })

          // Encontrar dia com pelo menos 2 eventos
          let ev1, ev2
          for (const eventos of Object.values(porDia)) {
            if (eventos.length >= 2) {
              ev1 = eventos[0]
              ev2 = eventos[1]
              break
            }
          }

          if (!ev1 || !ev2) {
            return new Response(
              JSON.stringify({ success: false, error: 'Não há eventos suficientes para comparação' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Calcular comparação
          const metricas = [
            { nome: 'Faturamento', valor1: ev1.real_r, valor2: ev2.real_r, unidade: 'currency' },
            { nome: 'Público', valor1: ev1.cl_real, valor2: ev2.cl_real, unidade: 'number' },
            { nome: 'Ticket Médio', valor1: ev1.t_medio, valor2: ev2.t_medio, unidade: 'currency' },
            { nome: 'Ticket Entrada', valor1: ev1.te_real, valor2: ev2.te_real, unidade: 'currency' },
            { nome: 'Ticket Bar', valor1: ev1.tb_real, valor2: ev2.tb_real, unidade: 'currency' },
            { nome: 'Custo Artístico', valor1: ev1.c_art, valor2: ev2.c_art, unidade: 'currency' },
            { nome: '% Artístico', valor1: ev1.percent_art_fat, valor2: ev2.percent_art_fat, unidade: 'percent' }
          ].map(m => ({
            ...m,
            variacao: m.valor2 > 0 ? ((m.valor1 - m.valor2) / m.valor2 * 100) : 0,
            melhor: (m.valor1 || 0) > (m.valor2 || 0) ? 'evento1' : 'evento2'
          }))

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                evento1: {
                  data: ev1.data_evento,
                  nome: ev1.nome,
                  artista: ev1.artista,
                  diaSemana: ev1.dia_semana
                },
                evento2: {
                  data: ev2.data_evento,
                  nome: ev2.nome,
                  artista: ev2.artista,
                  diaSemana: ev2.dia_semana
                },
                metricas,
                vencedor: metricas.filter(m => m.melhor === 'evento1').length > metricas.length / 2 ? 'evento1' : 'evento2',
                insight: `${ev1.nome || ev1.data_evento} teve faturamento ${formatPercent(metricas[0].variacao)} comparado a ${ev2.nome || ev2.data_evento}`
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Buscar eventos específicos
        const { data: eventosData } = await supabase
          .from('eventos_base')
          .select('*')
          .eq('bar_id', barId)
          .in('data_evento', [evento1, evento2])

        // ... similar ao acima
        return new Response(
          JSON.stringify({ success: true, data: eventosData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'periodos': {
        // Comparar dois períodos
        const { periodo1, periodo2 } = params || {}
        
        // Padrão: mês atual vs mês anterior
        const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMesAtual = hoje
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)

        const p1 = periodo1 || { 
          inicio: inicioMesAtual.toISOString().split('T')[0], 
          fim: fimMesAtual.toISOString().split('T')[0] 
        }
        const p2 = periodo2 || { 
          inicio: inicioMesAnterior.toISOString().split('T')[0], 
          fim: fimMesAnterior.toISOString().split('T')[0] 
        }

        // Buscar dados dos dois períodos
        const { data: eventos1 } = await supabase
          .from('eventos_base')
          .select('real_r, cl_real, t_medio, te_real, tb_real, c_art')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', p1.inicio)
          .lte('data_evento', p1.fim)

        const { data: eventos2 } = await supabase
          .from('eventos_base')
          .select('real_r, cl_real, t_medio, te_real, tb_real, c_art')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', p2.inicio)
          .lte('data_evento', p2.fim)

        // Calcular totais
        const calcularTotais = (eventos: any[]) => ({
          faturamento: eventos.reduce((a, e) => a + (e.real_r || 0), 0),
          publico: eventos.reduce((a, e) => a + (e.cl_real || 0), 0),
          ticketMedio: eventos.reduce((a, e) => a + (e.t_medio || 0), 0) / eventos.length,
          custoArtistico: eventos.reduce((a, e) => a + (e.c_art || 0), 0),
          qtdEventos: eventos.length
        })

        const totais1 = calcularTotais(eventos1 || [])
        const totais2 = calcularTotais(eventos2 || [])

        const variacoes = {
          faturamento: totais2.faturamento > 0 ? ((totais1.faturamento - totais2.faturamento) / totais2.faturamento * 100) : 0,
          publico: totais2.publico > 0 ? ((totais1.publico - totais2.publico) / totais2.publico * 100) : 0,
          ticketMedio: totais2.ticketMedio > 0 ? ((totais1.ticketMedio - totais2.ticketMedio) / totais2.ticketMedio * 100) : 0,
          custoArtistico: totais2.custoArtistico > 0 ? ((totais1.custoArtistico - totais2.custoArtistico) / totais2.custoArtistico * 100) : 0
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              periodo1: { ...p1, ...totais1, label: 'Período Atual' },
              periodo2: { ...p2, ...totais2, label: 'Período Anterior' },
              variacoes,
              resumo: {
                melhorFaturamento: variacoes.faturamento > 0 ? 'periodo1' : 'periodo2',
                melhorPublico: variacoes.publico > 0 ? 'periodo1' : 'periodo2',
                melhorTicket: variacoes.ticketMedio > 0 ? 'periodo1' : 'periodo2'
              },
              insight: `Faturamento ${formatPercent(variacoes.faturamento)} | Público ${formatPercent(variacoes.publico)} | Ticket ${formatPercent(variacoes.ticketMedio)}`
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'dias_semana': {
        // Comparar performance por dia da semana
        const { data: eventos } = await supabase
          .from('eventos_base')
          .select('dia_semana, real_r, cl_real, t_medio, te_real, tb_real')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .not('real_r', 'is', null)
          .gte('data_evento', new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1).toISOString().split('T')[0])

        // Agrupar por dia
        const porDia: Record<string, {
          dia: string;
          eventos: number;
          faturamentoTotal: number;
          faturamentoMedio: number;
          publicoTotal: number;
          publicoMedio: number;
          ticketMedio: number;
        }> = {}

        eventos?.forEach(e => {
          const dia = e.dia_semana || 'Outro'
          if (!porDia[dia]) {
            porDia[dia] = { 
              dia, eventos: 0, faturamentoTotal: 0, faturamentoMedio: 0,
              publicoTotal: 0, publicoMedio: 0, ticketMedio: 0 
            }
          }
          porDia[dia].eventos++
          porDia[dia].faturamentoTotal += e.real_r || 0
          porDia[dia].publicoTotal += e.cl_real || 0
          porDia[dia].ticketMedio += e.t_medio || 0
        })

        // Calcular médias
        Object.values(porDia).forEach(d => {
          d.faturamentoMedio = d.faturamentoTotal / d.eventos
          d.publicoMedio = d.publicoTotal / d.eventos
          d.ticketMedio = d.ticketMedio / d.eventos
        })

        // Ordenar por faturamento médio
        const ranking = Object.values(porDia).sort((a, b) => b.faturamentoMedio - a.faturamentoMedio)

        // Identificar melhor e pior dia
        const melhorDia = ranking[0]
        const piorDia = ranking[ranking.length - 1]

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              ranking,
              destaque: {
                melhorDia: {
                  ...melhorDia,
                  badge: '🥇 Campeão'
                },
                piorDia: {
                  ...piorDia,
                  badge: '📉 Oportunidade'
                },
                diferencaFaturamento: melhorDia.faturamentoMedio - piorDia.faturamentoMedio,
                diferencaPublico: melhorDia.publicoMedio - piorDia.publicoMedio
              },
              insights: [
                `${melhorDia.dia} fatura em média ${formatCurrency(melhorDia.faturamentoMedio)} por evento`,
                `${piorDia.dia} tem potencial de crescimento de ${formatPercent((melhorDia.faturamentoMedio / piorDia.faturamentoMedio - 1) * 100)}`,
                ranking.length >= 3 && `Top 3: ${ranking.slice(0, 3).map(d => d.dia).join(', ')}`
              ].filter(Boolean)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'artistas': {
        // Comparar performance por artista
        const { limite = 10 } = params || {}

        const { data: eventos } = await supabase
          .from('eventos_base')
          .select('artista, genero, real_r, m1_r, cl_real, t_medio, c_art')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .not('real_r', 'is', null)
          .not('artista', 'is', null)
          .gte('data_evento', new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1).toISOString().split('T')[0])

        // Agrupar por artista
        const porArtista: Record<string, {
          artista: string;
          genero: string;
          shows: number;
          faturamentoTotal: number;
          faturamentoMedio: number;
          publicoTotal: number;
          publicoMedio: number;
          ticketMedio: number;
          custoMedio: number;
          roi: number;
          atingimentoMeta: number;
        }> = {}

        eventos?.forEach(e => {
          const artista = e.artista || 'Sem Artista'
          if (!porArtista[artista]) {
            porArtista[artista] = {
              artista, genero: e.genero || '-',
              shows: 0, faturamentoTotal: 0, faturamentoMedio: 0,
              publicoTotal: 0, publicoMedio: 0, ticketMedio: 0,
              custoMedio: 0, roi: 0, atingimentoMeta: 0
            }
          }
          porArtista[artista].shows++
          porArtista[artista].faturamentoTotal += e.real_r || 0
          porArtista[artista].publicoTotal += e.cl_real || 0
          porArtista[artista].ticketMedio += e.t_medio || 0
          porArtista[artista].custoMedio += e.c_art || 0
          porArtista[artista].atingimentoMeta += (e.m1_r && e.real_r) ? (e.real_r / e.m1_r * 100) : 0
        })

        // Calcular médias e ROI
        Object.values(porArtista).forEach(a => {
          a.faturamentoMedio = a.faturamentoTotal / a.shows
          a.publicoMedio = a.publicoTotal / a.shows
          a.ticketMedio = a.ticketMedio / a.shows
          a.custoMedio = a.custoMedio / a.shows
          a.roi = a.custoMedio > 0 ? ((a.faturamentoMedio - a.custoMedio) / a.custoMedio * 100) : 0
          a.atingimentoMeta = a.atingimentoMeta / a.shows
        })

        // Rankings
        const porFaturamento = Object.values(porArtista)
          .filter(a => a.shows >= 2) // Mínimo 2 shows
          .sort((a, b) => b.faturamentoMedio - a.faturamentoMedio)
          .slice(0, limite)

        const porROI = Object.values(porArtista)
          .filter(a => a.shows >= 2)
          .sort((a, b) => b.roi - a.roi)
          .slice(0, limite)

        const porPublico = Object.values(porArtista)
          .filter(a => a.shows >= 2)
          .sort((a, b) => b.publicoMedio - a.publicoMedio)
          .slice(0, limite)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              totalArtistas: Object.keys(porArtista).length,
              rankings: {
                porFaturamento,
                porROI,
                porPublico
              },
              destaque: {
                maiorFaturamento: porFaturamento[0],
                melhorROI: porROI[0],
                maiorPublico: porPublico[0]
              },
              insights: [
                porFaturamento[0] && `🏆 ${porFaturamento[0].artista}: ${formatCurrency(porFaturamento[0].faturamentoMedio)}/show`,
                porROI[0] && `💰 Melhor ROI: ${porROI[0].artista} (${porROI[0].roi.toFixed(0)}%)`,
                porPublico[0] && `👥 Maior público: ${porPublico[0].artista} (~${Math.round(porPublico[0].publicoMedio)} pessoas)`
              ].filter(Boolean)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'ranking': {
        // Ranking geral de eventos
        const { metrica = 'faturamento', limite = 20 } = params || {}

        const { data: eventos } = await supabase
          .from('eventos_base')
          .select('data_evento, nome, artista, dia_semana, real_r, m1_r, cl_real, t_medio, te_real, tb_real, c_art, percent_art_fat')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .not('real_r', 'is', null)
          .order('data_evento', { ascending: false })
          .limit(100)

        // Ordenar por métrica escolhida
        const ordenado = eventos?.sort((a, b) => {
          switch (metrica) {
            case 'faturamento': return (b.real_r || 0) - (a.real_r || 0)
            case 'publico': return (b.cl_real || 0) - (a.cl_real || 0)
            case 'ticket': return (b.t_medio || 0) - (a.t_medio || 0)
            case 'atingimento': return ((b.real_r || 0) / (b.m1_r || 1)) - ((a.real_r || 0) / (a.m1_r || 1))
            default: return (b.real_r || 0) - (a.real_r || 0)
          }
        }).slice(0, limite) || []

        // Adicionar posição e calcular atingimento
        const rankingFinal = ordenado.map((e, idx) => ({
          posicao: idx + 1,
          data: e.data_evento,
          nome: e.nome,
          artista: e.artista,
          diaSemana: e.dia_semana,
          faturamento: e.real_r,
          meta: e.m1_r,
          atingimento: e.m1_r > 0 ? ((e.real_r || 0) / e.m1_r * 100) : 0,
          publico: e.cl_real,
          ticketMedio: e.t_medio,
          custoArtistico: e.c_art,
          percentualArtistico: e.percent_art_fat,
          badge: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
        }))

        // Estatísticas do ranking
        const estatisticas = {
          mediaFaturamento: rankingFinal.reduce((a, e) => a + (e.faturamento || 0), 0) / rankingFinal.length,
          mediaPublico: rankingFinal.reduce((a, e) => a + (e.publico || 0), 0) / rankingFinal.length,
          mediaTicket: rankingFinal.reduce((a, e) => a + (e.ticketMedio || 0), 0) / rankingFinal.length,
          melhorEvento: rankingFinal[0],
          diasMaisFrequentes: rankingFinal.slice(0, 10)
            .reduce((acc: Record<string, number>, e) => {
              acc[e.diaSemana] = (acc[e.diaSemana] || 0) + 1
              return acc
            }, {})
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              metricaOrdenacao: metrica,
              ranking: rankingFinal,
              estatisticas,
              insights: [
                `Top 1: ${rankingFinal[0]?.nome || rankingFinal[0]?.data} com ${formatCurrency(rankingFinal[0]?.faturamento || 0)}`,
                `Média do top ${limite}: ${formatCurrency(estatisticas.mediaFaturamento)}`,
                `Dia mais frequente no top 10: ${Object.entries(estatisticas.diasMaisFrequentes).sort((a, b) => b[1] - a[1])[0]?.[0]}`
              ]
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro no agente de comparação:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
