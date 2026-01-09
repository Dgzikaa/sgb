import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

interface PlanejamentoRequest {
  action: 'simular' | 'whatif' | 'otimizar_mix' | 'sugestao_evento';
  barId?: number;
  cenario?: {
    faturamentoAlvo?: number;
    publicoAlvo?: number;
    ticketMedio?: number;
    cmvAlvo?: number;
    diasEvento?: number[];
    tipoEvento?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, barId = 3, cenario }: PlanejamentoRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const hoje = new Date()
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    switch (action) {
      case 'simular': {
        // Simulação de cenário completo
        const { faturamentoAlvo = 100000, publicoAlvo, cmvAlvo = 34 } = cenario || {}

        // Buscar médias históricas
        const { data: historico } = await supabase
          .from('desempenho_semanal')
          .select('*')
          .eq('bar_id', barId)
          .order('ano', { ascending: false })
          .order('numero_semana', { ascending: false })
          .limit(12)

        const mediaTicket = historico?.reduce((a, h) => a + (h.ticket_medio || 0), 0) / (historico?.length || 1)
        const mediaCMV = historico?.reduce((a, h) => a + (h.cmv_global_real || 0), 0) / (historico?.length || 1)
        const mediaCMO = historico?.reduce((a, h) => a + (h.cmo || 0), 0) / (historico?.length || 1)
        const mediaArtistico = historico?.reduce((a, h) => a + (h.custo_atracao_faturamento || 0), 0) / (historico?.length || 1)

        // Calcular público necessário
        const publicoNecessario = publicoAlvo || Math.ceil(faturamentoAlvo / mediaTicket)
        
        // Calcular custos
        const cmvReais = faturamentoAlvo * (cmvAlvo / 100)
        const cmoReais = faturamentoAlvo * (mediaCMO / 100)
        const artisticoReais = faturamentoAlvo * (mediaArtistico / 100)
        const impostos = faturamentoAlvo * 0.06 // ~6% impostos
        const taxasCartao = faturamentoAlvo * 0.03 // ~3% taxas
        
        // Calcular resultado
        const custosVariaveis = cmvReais + cmoReais + artisticoReais + impostos + taxasCartao
        const margemContribuicao = faturamentoAlvo - custosVariaveis
        const margemPercent = (margemContribuicao / faturamentoAlvo) * 100

        // Simular por dia da semana
        const { data: eventosPorDia } = await supabase
          .from('eventos_base')
          .select('dia_semana, real_r, cl_real')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .not('real_r', 'is', null)
          .gte('data_evento', new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1).toISOString().split('T')[0])

        // Agrupar por dia
        const porDia: Record<string, { total: number; eventos: number; media: number }> = {}
        eventosPorDia?.forEach(e => {
          const dia = e.dia_semana || 'Outro'
          if (!porDia[dia]) porDia[dia] = { total: 0, eventos: 0, media: 0 }
          porDia[dia].total += e.real_r || 0
          porDia[dia].eventos++
        })
        Object.values(porDia).forEach(d => d.media = d.total / d.eventos)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              cenario: {
                faturamentoAlvo,
                publicoNecessario,
                ticketMedioNecessario: faturamentoAlvo / publicoNecessario
              },
              custos: {
                cmv: { valor: cmvReais, percentual: cmvAlvo },
                cmo: { valor: cmoReais, percentual: mediaCMO },
                artistico: { valor: artisticoReais, percentual: mediaArtistico },
                impostos: { valor: impostos, percentual: 6 },
                taxasCartao: { valor: taxasCartao, percentual: 3 }
              },
              resultado: {
                faturamentoBruto: faturamentoAlvo,
                custosVariaveis,
                margemContribuicao,
                margemPercent,
                pontoEquilibrio: custosVariaveis / (margemPercent / 100)
              },
              distribuicaoPorDia: Object.entries(porDia)
                .map(([dia, dados]) => ({ dia, ...dados }))
                .sort((a, b) => b.media - a.media),
              viabilidade: margemPercent >= 30 ? 'alta' : margemPercent >= 20 ? 'media' : 'baixa'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'whatif': {
        // Análise "E se..."
        const baseHistorica = await supabase
          .from('desempenho_semanal')
          .select('faturamento_total, ticket_medio, clientes_atendidos, cmv_global_real')
          .eq('bar_id', barId)
          .order('ano', { ascending: false })
          .order('numero_semana', { ascending: false })
          .limit(4)

        const mediaFat = baseHistorica.data?.reduce((a, h) => a + (h.faturamento_total || 0), 0) / (baseHistorica.data?.length || 1)
        const mediaTicket = baseHistorica.data?.reduce((a, h) => a + (h.ticket_medio || 0), 0) / (baseHistorica.data?.length || 1)
        const mediaClientes = baseHistorica.data?.reduce((a, h) => a + (h.clientes_atendidos || 0), 0) / (baseHistorica.data?.length || 1)
        const mediaCMV = baseHistorica.data?.reduce((a, h) => a + (h.cmv_global_real || 0), 0) / (baseHistorica.data?.length || 1)

        // Cenários What-If
        const cenarios = [
          {
            nome: 'Aumentar Ticket em 10%',
            mudanca: 'ticket +10%',
            impacto: {
              novoTicket: mediaTicket * 1.1,
              novoFaturamento: mediaClientes * (mediaTicket * 1.1),
              diferenca: mediaClientes * mediaTicket * 0.1,
              percentualGanho: 10
            },
            comoFazer: [
              'Treinar equipe para sugerir combos',
              'Oferecer opções premium visíveis',
              'Criar experiências exclusivas'
            ]
          },
          {
            nome: 'Aumentar Público em 15%',
            mudanca: 'público +15%',
            impacto: {
              novoPublico: Math.ceil(mediaClientes * 1.15),
              novoFaturamento: (mediaClientes * 1.15) * mediaTicket,
              diferenca: mediaClientes * 0.15 * mediaTicket,
              percentualGanho: 15
            },
            comoFazer: [
              'Investir em atrações diferenciadas',
              'Parcerias com influenciadores',
              'Promoções em dias de menor movimento'
            ]
          },
          {
            nome: 'Reduzir CMV em 3pp',
            mudanca: 'CMV -3pp',
            impacto: {
              novoCMV: mediaCMV - 3,
              economia: mediaFat * 0.03,
              novaMargemContribuicao: ((100 - (mediaCMV - 3)) / 100) * mediaFat
            },
            comoFazer: [
              'Renegociar com fornecedores principais',
              'Revisar fichas técnicas',
              'Implementar controle de desperdício'
            ]
          },
          {
            nome: 'Combo: Ticket +5% e Público +10%',
            mudanca: 'ticket +5%, público +10%',
            impacto: {
              novoTicket: mediaTicket * 1.05,
              novoPublico: Math.ceil(mediaClientes * 1.1),
              novoFaturamento: (mediaClientes * 1.1) * (mediaTicket * 1.05),
              diferenca: (mediaClientes * 1.1) * (mediaTicket * 1.05) - mediaFat,
              percentualGanho: ((1.1 * 1.05) - 1) * 100
            },
            comoFazer: [
              'Estratégia integrada de marketing',
              'Eventos especiais mensais',
              'Programa de fidelidade'
            ]
          }
        ]

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              baseAtual: {
                faturamentoMedio: mediaFat,
                ticketMedio: mediaTicket,
                clientesMedio: mediaClientes,
                cmv: mediaCMV
              },
              cenarios,
              melhorCenario: cenarios.reduce((best, c) => 
                (c.impacto.diferenca || 0) > (best.impacto.diferenca || 0) ? c : best
              )
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'otimizar_mix': {
        // Otimização do mix de produtos
        const { data: produtos } = await supabase
          .from('contahub_analitico')
          .select('prd_desc, grp_desc, qtd, valorfinal, custo')
          .eq('bar_id', barId)
          .gte('trn_dtgerencial', new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0])

        // Análise ABC
        const produtosAnalise = produtos
          ?.reduce((acc: Record<string, any>, p) => {
            if (!acc[p.prd_desc]) {
              acc[p.prd_desc] = {
                produto: p.prd_desc,
                categoria: p.grp_desc,
                qtdTotal: 0,
                faturamento: 0,
                custo: 0
              }
            }
            acc[p.prd_desc].qtdTotal += p.qtd || 0
            acc[p.prd_desc].faturamento += p.valorfinal || 0
            acc[p.prd_desc].custo += (p.custo || 0) * (p.qtd || 1)
            return acc
          }, {})

        const lista = Object.values(produtosAnalise || {})
          .map((p: any) => ({
            ...p,
            margem: p.faturamento > 0 ? ((p.faturamento - p.custo) / p.faturamento * 100) : 0,
            lucroBruto: p.faturamento - p.custo
          }))
          .sort((a: any, b: any) => b.faturamento - a.faturamento)

        // Classificação ABC
        const totalFat = lista.reduce((a: number, p: any) => a + p.faturamento, 0)
        let acumulado = 0
        lista.forEach((p: any) => {
          acumulado += p.faturamento
          const percentAcumulado = (acumulado / totalFat) * 100
          p.classificacao = percentAcumulado <= 80 ? 'A' : percentAcumulado <= 95 ? 'B' : 'C'
        })

        // Matriz BCG (Estrela, Vaca, Interrogação, Abacaxi)
        const mediaQtd = lista.reduce((a: number, p: any) => a + p.qtdTotal, 0) / lista.length
        const mediaMargem = lista.reduce((a: number, p: any) => a + p.margem, 0) / lista.length

        lista.forEach((p: any) => {
          const altoGiro = p.qtdTotal > mediaQtd
          const altaMargem = p.margem > mediaMargem
          
          if (altoGiro && altaMargem) p.bcg = 'estrela'
          else if (altoGiro && !altaMargem) p.bcg = 'vaca'
          else if (!altoGiro && altaMargem) p.bcg = 'interrogacao'
          else p.bcg = 'abacaxi'
        })

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              analiseABC: {
                A: lista.filter((p: any) => p.classificacao === 'A').slice(0, 10),
                B: lista.filter((p: any) => p.classificacao === 'B').slice(0, 10),
                C: lista.filter((p: any) => p.classificacao === 'C').slice(0, 10)
              },
              matrizBCG: {
                estrelas: lista.filter((p: any) => p.bcg === 'estrela').slice(0, 5),
                vacas: lista.filter((p: any) => p.bcg === 'vaca').slice(0, 5),
                interrogacao: lista.filter((p: any) => p.bcg === 'interrogacao').slice(0, 5),
                abacaxis: lista.filter((p: any) => p.bcg === 'abacaxi').slice(0, 5)
              },
              recomendacoes: [
                `Foque na venda dos ${lista.filter((p: any) => p.bcg === 'estrela').length} produtos estrela`,
                'Produtos "Vaca" garantem volume - mantenha disponibilidade',
                `Avalie retirar ${lista.filter((p: any) => p.bcg === 'abacaxi').length} produtos "abacaxi"`,
                'Produtos "Interrogação" precisam de mais promoção'
              ],
              estatisticas: {
                totalProdutos: lista.length,
                faturamentoTotal: totalFat,
                produtosA: lista.filter((p: any) => p.classificacao === 'A').length,
                produtosC: lista.filter((p: any) => p.classificacao === 'C').length
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sugestao_evento': {
        // Sugestão para próximo evento
        const { tipoEvento = 'normal', diasEvento = [5, 6] } = cenario || {} // 5=Sexta, 6=Sábado

        // Buscar dados históricos do mesmo dia da semana
        const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        const diasFiltro = diasEvento.map(d => diasNomes[d])

        const { data: eventosHistoricos } = await supabase
          .from('eventos_base')
          .select('*')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .in('dia_semana', diasFiltro)
          .not('real_r', 'is', null)
          .order('data_evento', { ascending: false })
          .limit(20)

        // Calcular médias
        const mediaFat = eventosHistoricos?.reduce((a, e) => a + (e.real_r || 0), 0) / (eventosHistoricos?.length || 1)
        const mediaPublico = eventosHistoricos?.reduce((a, e) => a + (e.cl_real || 0), 0) / (eventosHistoricos?.length || 1)
        const mediaTicketE = eventosHistoricos?.reduce((a, e) => a + (e.te_real || 0), 0) / (eventosHistoricos?.length || 1)
        const mediaTicketB = eventosHistoricos?.reduce((a, e) => a + (e.tb_real || 0), 0) / (eventosHistoricos?.length || 1)
        const mediaArtistico = eventosHistoricos?.reduce((a, e) => a + (e.c_art || 0), 0) / (eventosHistoricos?.length || 1)

        // Buscar top artistas
        const artistasStats: Record<string, { nome: string; eventos: number; mediaFat: number; mediaPublico: number }> = {}
        eventosHistoricos?.forEach(e => {
          const artista = e.artista || 'Sem Artista'
          if (!artistasStats[artista]) {
            artistasStats[artista] = { nome: artista, eventos: 0, mediaFat: 0, mediaPublico: 0 }
          }
          artistasStats[artista].eventos++
          artistasStats[artista].mediaFat += e.real_r || 0
          artistasStats[artista].mediaPublico += e.cl_real || 0
        })
        
        Object.values(artistasStats).forEach(a => {
          a.mediaFat = a.mediaFat / a.eventos
          a.mediaPublico = a.mediaPublico / a.eventos
        })

        const topArtistas = Object.values(artistasStats)
          .sort((a, b) => b.mediaFat - a.mediaFat)
          .slice(0, 5)

        // Sugestões de meta
        const metaSugerida = Math.round(mediaFat * 1.1 / 1000) * 1000 // Arredonda para milhares
        const publicoSugerido = Math.ceil(metaSugerida / (mediaTicketE + mediaTicketB))

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              basadoEm: `${eventosHistoricos?.length} eventos em ${diasFiltro.join(', ')}`,
              mediasHistoricas: {
                faturamento: mediaFat,
                publico: Math.round(mediaPublico),
                ticketEntrada: mediaTicketE,
                ticketBebida: mediaTicketB,
                custoArtistico: mediaArtistico,
                percentualArtistico: (mediaArtistico / mediaFat * 100) || 0
              },
              sugestaoEvento: {
                metaFaturamento: metaSugerida,
                publicoAlvo: publicoSugerido,
                ticketMedioAlvo: metaSugerida / publicoSugerido,
                orcamentoArtistico: metaSugerida * 0.12, // 12% do faturamento
                custosEstimados: {
                  cmv: metaSugerida * 0.34,
                  cmo: metaSugerida * 0.18,
                  artistico: metaSugerida * 0.12,
                  outros: metaSugerida * 0.10
                },
                margemEstimada: metaSugerida * 0.26 // ~26% sobra
              },
              topArtistas,
              dicas: [
                `Para ${diasFiltro.join('/')}: foco em atração forte`,
                topArtistas[0] && `${topArtistas[0].nome} tem histórico de ${formatCurrency(topArtistas[0].mediaFat)} de faturamento`,
                'Reserve ingressos antecipados para garantir público base',
                'Mantenha estoque de produtos estrela abastecido'
              ].filter(Boolean)
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
    console.error('Erro no agente de planejamento:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
