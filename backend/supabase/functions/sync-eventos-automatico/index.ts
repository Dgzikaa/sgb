import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Iniciando sincronização automática de eventos - Nibo')

    // Calcular períodos: mês passado, atual e futuro
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    // Mês passado
    const mesPassado = mesAtual === 0 ? 11 : mesAtual - 1
    const anoMesPassado = mesAtual === 0 ? anoAtual - 1 : anoAtual
    const inicioMesPassado = new Date(anoMesPassado, mesPassado, 1)
    const fimMesPassado = new Date(anoAtual, mesAtual, 0)

    // Mês atual
    const inicioMesAtual = new Date(anoAtual, mesAtual, 1)
    const fimMesAtual = new Date(anoAtual, mesAtual + 1, 0)

    // Mês futuro
    const mesFuturo = mesAtual === 11 ? 0 : mesAtual + 1
    const anoMesFuturo = mesAtual === 11 ? anoAtual + 1 : anoAtual
    const inicioMesFuturo = new Date(anoMesFuturo, mesFuturo, 1)
    const fimMesFuturo = new Date(anoMesFuturo, mesFuturo + 1, 0)

    console.log(`📅 Períodos de sincronização:`)
    console.log(`   Mês passado: ${inicioMesPassado.toISOString().split('T')[0]} a ${fimMesPassado.toISOString().split('T')[0]}`)
    console.log(`   Mês atual: ${inicioMesAtual.toISOString().split('T')[0]} a ${fimMesAtual.toISOString().split('T')[0]}`)
    console.log(`   Mês futuro: ${inicioMesFuturo.toISOString().split('T')[0]} a ${fimMesFuturo.toISOString().split('T')[0]}`)

    // Buscar todos os eventos dos 3 meses
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos_base')
      .select('*')
      .eq('bar_id', 3)
      .gte('data_evento', inicioMesPassado.toISOString().split('T')[0])
      .lte('data_evento', fimMesFuturo.toISOString().split('T')[0])
      .order('data_evento')

    if (eventosError) {
      console.error('❌ Erro ao buscar eventos:', eventosError)
      throw eventosError
    }

    console.log(`📊 Encontrados ${eventos?.length || 0} eventos para sincronizar`)

    const resultados = {
      eventos_processados: 0,
      eventos_atualizados: 0,
      eventos_com_custos: 0,
      eventos_sem_custos: 0,
      erros: [] as string[]
    }

    // Processar cada evento
    for (const evento of eventos || []) {
      try {
        resultados.eventos_processados++
        
        const dataEvento = new Date(evento.data_evento)
        const dataCompetencia = dataEvento.toISOString().split('T')[0]

        // Buscar custos artísticos
        const { data: custosArtisticos } = await supabase
          .from('nibo_agendamentos')
          .select('valor')
          .eq('bar_id', 3)
          .eq('categoria_nome', 'Atrações Programação')
          .eq('data_competencia', dataCompetencia)

        // Buscar custos de produção
        const { data: custosProducao } = await supabase
          .from('nibo_agendamentos')
          .select('valor')
          .eq('bar_id', 3)
          .eq('categoria_nome', 'Produção Eventos')
          .eq('data_competencia', dataCompetencia)

        const custoArtistico = custosArtisticos?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0
        const custoProducao = custosProducao?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0

        // Calcular percentual artista sobre faturamento
        const percentArtFat = evento.real_r > 0 ? (custoArtistico / evento.real_r) * 100 : 0

        // Atualizar evento com os custos
        const { error: updateError } = await supabase
          .from('eventos_base')
          .update({
            c_art: custoArtistico,
            c_prod: custoProducao,
            percent_art_fat: percentArtFat,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', evento.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar evento ${evento.id}:`, updateError)
          resultados.erros.push(`Evento ${evento.id}: ${updateError.message}`)
          continue
        }

        resultados.eventos_atualizados++

        if (custoArtistico > 0 || custoProducao > 0) {
          resultados.eventos_com_custos++
          console.log(`✅ ${evento.nome} (${dataCompetencia}): C.Art: R$ ${custoArtistico.toFixed(2)}, C.Prod: R$ ${custoProducao.toFixed(2)}`)
        } else {
          resultados.eventos_sem_custos++
          console.log(`⚠️  ${evento.nome} (${dataCompetencia}): Sem custos encontrados`)
        }

      } catch (error) {
        console.error(`❌ Erro ao processar evento ${evento.id}:`, error)
        resultados.erros.push(`Evento ${evento.id}: ${error.message}`)
      }
    }

    // Chamar notificação Discord
    try {
      const discordResponse = await fetch(`${supabaseUrl}/functions/v1/discord-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          type: 'sync_eventos_automatico',
          data: {
            ...resultados,
            timestamp: new Date().toISOString(),
            horario_execucao: '10:00 (Horário de Brasília)'
          }
        })
      })

      if (!discordResponse.ok) {
        console.warn('⚠️ Falha ao enviar notificação Discord')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao enviar notificação Discord:', error)
    }

    console.log('🎉 Sincronização automática concluída!')
    console.log(`📊 Resumo:`)
    console.log(`   - Eventos processados: ${resultados.eventos_processados}`)
    console.log(`   - Eventos atualizados: ${resultados.eventos_atualizados}`)
    console.log(`   - Eventos com custos: ${resultados.eventos_com_custos}`)
    console.log(`   - Eventos sem custos: ${resultados.eventos_sem_custos}`)
    console.log(`   - Erros: ${resultados.erros.length}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Sincronização automática de eventos concluída com sucesso',
      resultados
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})
