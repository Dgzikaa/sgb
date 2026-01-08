import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetasRequest {
  action: 'status' | 'projecao' | 'sugestoes' | 'historico';
  barId?: number;
  periodo?: 'dia' | 'semana' | 'mes' | 'trimestre';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, barId = 3, periodo = 'mes' }: MetasRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    const diasNoMes = fimMes.getDate()
    const diasPassados = hoje.getDate()
    const diasRestantes = diasNoMes - diasPassados

    // Formatação
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    switch (action) {
      case 'status': {
        // Status atual da meta mensal
        const { data: eventosMes } = await supabase
          .from('eventos_base')
          .select('data_evento, real_r, m1_r, cl_real, nome')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', inicioMes.toISOString().split('T')[0])
          .order('data_evento', { ascending: true })

        const faturamento = eventosMes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
        const metaTotal = eventosMes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0
        const clientes = eventosMes?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0
        const atingimento = metaTotal > 0 ? (faturamento / metaTotal * 100) : 0
        const faltaParaMeta = Math.max(0, metaTotal - faturamento)
        const necessarioPorDia = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0
        const mediaDiaria = diasPassados > 0 ? faturamento / diasPassados : 0
        const projecaoFimMes = mediaDiaria * diasNoMes

        // Calcular por semana
        const semanas: { semana: number; faturamento: number; meta: number; atingimento: number }[] = []
        eventosMes?.forEach(e => {
          const dataEvento = new Date(e.data_evento + 'T12:00:00')
          const semanaDoMes = Math.ceil((dataEvento.getDate() + inicioMes.getDay()) / 7)
          
          if (!semanas[semanaDoMes]) {
            semanas[semanaDoMes] = { semana: semanaDoMes, faturamento: 0, meta: 0, atingimento: 0 }
          }
          semanas[semanaDoMes].faturamento += e.real_r || 0
          semanas[semanaDoMes].meta += e.m1_r || 0
        })

        // Calcular atingimento por semana
        semanas.forEach(s => {
          if (s && s.meta > 0) {
            s.atingimento = (s.faturamento / s.meta * 100)
          }
        })

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              resumo: {
                faturamento,
                metaTotal,
                atingimento,
                faltaParaMeta,
                clientes,
                ticketMedio: clientes > 0 ? faturamento / clientes : 0,
                diasPassados,
                diasRestantes,
                necessarioPorDia,
                mediaDiaria,
                projecaoFimMes,
                vaiAtingir: projecaoFimMes >= metaTotal
              },
              porSemana: semanas.filter(Boolean),
              ultimosEventos: eventosMes?.slice(-5).reverse().map(e => ({
                data: e.data_evento,
                nome: e.nome,
                faturamento: e.real_r,
                meta: e.m1_r,
                atingimento: e.m1_r > 0 ? ((e.real_r || 0) / e.m1_r * 100) : 0
              }))
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'projecao': {
        // Projeção detalhada
        const { data: eventosMes } = await supabase
          .from('eventos_base')
          .select('real_r, m1_r')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', inicioMes.toISOString().split('T')[0])

        const faturamento = eventosMes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
        const metaTotal = eventosMes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0

        // Buscar média histórica
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        
        const { data: eventosMesAnterior } = await supabase
          .from('eventos_base')
          .select('real_r')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', mesAnterior.toISOString().split('T')[0])
          .lte('data_evento', fimMesAnterior.toISOString().split('T')[0])

        const fatMesAnterior = eventosMesAnterior?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
        const mediaDiaria = diasPassados > 0 ? faturamento / diasPassados : 0

        // Cenários
        const cenarioPessimista = mediaDiaria * 0.85 * diasRestantes + faturamento
        const cenarioRealista = mediaDiaria * diasRestantes + faturamento
        const cenarioOtimista = mediaDiaria * 1.15 * diasRestantes + faturamento

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              atual: {
                faturamento,
                meta: metaTotal,
                atingimento: metaTotal > 0 ? (faturamento / metaTotal * 100) : 0
              },
              mesAnterior: {
                faturamento: fatMesAnterior,
                variacao: fatMesAnterior > 0 ? ((faturamento - fatMesAnterior) / fatMesAnterior * 100) : 0
              },
              projecoes: {
                pessimista: { valor: cenarioPessimista, atingimento: metaTotal > 0 ? (cenarioPessimista / metaTotal * 100) : 0 },
                realista: { valor: cenarioRealista, atingimento: metaTotal > 0 ? (cenarioRealista / metaTotal * 100) : 0 },
                otimista: { valor: cenarioOtimista, atingimento: metaTotal > 0 ? (cenarioOtimista / metaTotal * 100) : 0 }
              },
              mediaDiaria,
              diasRestantes
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sugestoes': {
        // Sugestões para atingir a meta
        const { data: eventosMes } = await supabase
          .from('eventos_base')
          .select('real_r, m1_r, data_evento, nome')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', inicioMes.toISOString().split('T')[0])

        const faturamento = eventosMes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
        const metaTotal = eventosMes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0
        const faltaParaMeta = Math.max(0, metaTotal - faturamento)
        const necessarioPorDia = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0
        const mediaDiaria = diasPassados > 0 ? faturamento / diasPassados : 0

        const sugestoes: string[] = []

        if (faltaParaMeta <= 0) {
          sugestoes.push('🎉 Parabéns! Meta já atingida! Foque em superar o objetivo.')
          sugestoes.push('💡 Considere aumentar o ticket médio nos eventos restantes.')
          sugestoes.push('📊 Analise quais estratégias funcionaram melhor este mês.')
        } else {
          if (necessarioPorDia > mediaDiaria * 1.5) {
            sugestoes.push(`⚠️ Necessário acelerar: ${formatCurrency(necessarioPorDia)}/dia (${((necessarioPorDia / mediaDiaria - 1) * 100).toFixed(0)}% acima da média)`)
            sugestoes.push('💡 Considere promoções especiais para aumentar público.')
            sugestoes.push('🎯 Foque nos dias de maior movimento (sexta/sábado).')
          } else if (necessarioPorDia > mediaDiaria) {
            sugestoes.push(`📈 Meta alcançável: precisa de ${formatCurrency(necessarioPorDia)}/dia`)
            sugestoes.push('💡 Mantenha o ritmo e intensifique ações nos finais de semana.')
            sugestoes.push('🎟️ Considere aumentar o ticket médio com upselling.')
          } else {
            sugestoes.push('✅ No caminho certo! Continue assim.')
            sugestoes.push(`💪 Necessário apenas ${formatCurrency(necessarioPorDia)}/dia para bater a meta.`)
          }

          // Sugestões baseadas em dados
          const eventosBaixos = eventosMes?.filter(e => e.m1_r && e.real_r && (e.real_r / e.m1_r) < 0.7) || []
          if (eventosBaixos.length > 2) {
            sugestoes.push(`📉 ${eventosBaixos.length} eventos ficaram abaixo de 70% da meta. Analise padrões.`)
          }

          const diasSemDados = eventosMes?.filter(e => !e.real_r) || []
          if (diasSemDados.length > 0) {
            sugestoes.push(`⚠️ ${diasSemDados.length} dia(s) sem dados de faturamento. Atualize os registros.`)
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: faltaParaMeta <= 0 ? 'atingida' : necessarioPorDia > mediaDiaria * 1.2 ? 'dificil' : 'alcancavel',
              sugestoes,
              numeros: {
                faltaParaMeta,
                necessarioPorDia,
                mediaDiaria,
                diasRestantes
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'historico': {
        // Histórico de metas dos últimos meses
        const historico: { mes: string; faturamento: number; meta: number; atingimento: number }[] = []
        
        for (let i = 0; i < 6; i++) {
          const mesRef = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
          const fimMesRef = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0)
          
          const { data: eventosMesRef } = await supabase
            .from('eventos_base')
            .select('real_r, m1_r')
            .eq('bar_id', barId)
            .eq('ativo', true)
            .gte('data_evento', mesRef.toISOString().split('T')[0])
            .lte('data_evento', fimMesRef.toISOString().split('T')[0])

          const fat = eventosMesRef?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
          const meta = eventosMesRef?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0

          historico.push({
            mes: mesRef.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            faturamento: fat,
            meta,
            atingimento: meta > 0 ? (fat / meta * 100) : 0
          })
        }

        // Calcular tendência
        const ultimosTres = historico.slice(0, 3)
        const mediaUltimosTres = ultimosTres.reduce((acc, m) => acc + m.atingimento, 0) / 3
        const tendencia = mediaUltimosTres >= 100 ? 'positiva' : mediaUltimosTres >= 85 ? 'estavel' : 'negativa'

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              historico: historico.reverse(),
              tendencia,
              mediaAtingimento: mediaUltimosTres,
              melhorMes: historico.reduce((best, m) => m.atingimento > best.atingimento ? m : best, historico[0]),
              totalFaturado: historico.reduce((acc, m) => acc + m.faturamento, 0)
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
    console.error('Erro no agente de metas:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
