import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FeedbackRequest {
  bar_id: number
  tipo: 'insight' | 'alerta' | 'sugestao'
  referencia_id: number
  feedback: 'util' | 'neutro' | 'inutil'
  comentario?: string
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

    const { bar_id, tipo, referencia_id, feedback, comentario }: FeedbackRequest = await req.json()

    // 1. Salvar feedback
    const { data: feedbackData, error: feedbackError } = await supabaseClient
      .from('agente_feedbacks')
      .insert({
        bar_id,
        tipo,
        referencia_id,
        feedback,
        comentario,
        aplicado: false
      })
      .select()
      .single()

    if (feedbackError) {
      throw new Error(`Erro ao salvar feedback: ${feedbackError.message}`)
    }

    // 2. Processar feedback e ajustar comportamento
    
    // 2.1. Buscar o item original (insight ou alerta)
    const tabela = tipo === 'insight' ? 'agente_insights' : tipo === 'alerta' ? 'agente_alertas' : null
    
    if (tabela) {
      const { data: itemOriginal } = await supabaseClient
        .from(tabela)
        .select('*')
        .eq('id', referencia_id)
        .single()

      if (itemOriginal) {
        // 2.2. Se feedback foi negativo (inutil), ajustar relevância
        if (feedback === 'inutil') {
          
          // Reduzir relevância de memórias similares
          const { data: memoriasSimilares } = await supabaseClient
            .from('agente_memoria_vetorial')
            .select('*')
            .eq('bar_id', bar_id)
            .eq('tipo', itemOriginal.tipo)
            .gt('relevancia', 0.3)

          if (memoriasSimilares && memoriasSimilares.length > 0) {
            for (const memoria of memoriasSimilares) {
              await supabaseClient
                .from('agente_memoria_vetorial')
                .update({
                  relevancia: Math.max(0.1, memoria.relevancia - 0.2)
                })
                .eq('id', memoria.id)
            }
          }

          // Criar memória negativa para evitar repetição
          await supabaseClient
            .from('agente_memoria_vetorial')
            .insert({
              bar_id,
              tipo: 'feedback_negativo',
              conteudo: `Evitar alertas sobre: ${itemOriginal.tipo} - ${itemOriginal.titulo || itemOriginal.mensagem}`,
              contexto: {
                item_original: itemOriginal,
                motivo: comentario || 'Sem motivo especificado'
              },
              relevancia: 1.0,
              aprendido_de: 'feedback'
            })
        }

        // 2.3. Se feedback foi positivo (util), aumentar relevância
        if (feedback === 'util') {
          
          // Aumentar relevância de memórias relacionadas
          const { data: memoriasRelacionadas } = await supabaseClient
            .from('agente_memoria_vetorial')
            .select('*')
            .eq('bar_id', bar_id)
            .eq('tipo', itemOriginal.tipo)
            .lt('relevancia', 1.5)

          if (memoriasRelacionadas && memoriasRelacionadas.length > 0) {
            for (const memoria of memoriasRelacionadas) {
              await supabaseClient
                .from('agente_memoria_vetorial')
                .update({
                  relevancia: Math.min(2.0, memoria.relevancia + 0.3),
                  confirmacoes: (memoria.confirmacoes || 0) + 1
                })
                .eq('id', memoria.id)
            }
          }

          // Criar memória positiva
          await supabaseClient
            .from('agente_memoria_vetorial')
            .insert({
              bar_id,
              tipo: 'feedback_positivo',
              conteudo: `Priorizar alertas sobre: ${itemOriginal.tipo} - ${itemOriginal.titulo || itemOriginal.mensagem}`,
              contexto: {
                item_original: itemOriginal,
                motivo: comentario || 'Usuario achou útil'
              },
              relevancia: 1.5,
              aprendido_de: 'feedback',
              confirmacoes: 1
            })

          // Se há padrão relacionado, confirmar
          const { data: padraoRelacionado } = await supabaseClient
            .from('agente_padroes_detectados')
            .select('*')
            .eq('bar_id', bar_id)
            .ilike('descricao', `%${itemOriginal.tipo}%`)
            .single()

          if (padraoRelacionado) {
            await supabaseClient
              .from('agente_padroes_detectados')
              .update({
                ocorrencias: (padraoRelacionado.ocorrencias || 0) + 1,
                confianca: Math.min(1.0, (padraoRelacionado.confianca || 0.5) + 0.1),
                status: 'confirmado',
                ultima_confirmacao: new Date().toISOString()
              })
              .eq('id', padraoRelacionado.id)
          }
        }

        // 2.4. Atualizar taxa de sucesso de regras relacionadas
        if (tipo === 'alerta') {
          const { data: regraDinamica } = await supabaseClient
            .from('agente_regras_dinamicas')
            .select('*')
            .eq('bar_id', bar_id)
            .eq('ativa', true)

          // Calcular taxa de sucesso baseada em feedbacks
          for (const regra of regraDinamica || []) {
            const { data: feedbacksRegra } = await supabaseClient
              .from('agente_feedbacks')
              .select('feedback')
              .eq('bar_id', bar_id)
              .eq('tipo', 'alerta')

            if (feedbacksRegra && feedbacksRegra.length > 0) {
              const positivos = feedbacksRegra.filter(f => f.feedback === 'util').length
              const taxa = positivos / feedbacksRegra.length

              await supabaseClient
                .from('agente_regras_dinamicas')
                .update({ taxa_sucesso: taxa })
                .eq('id', regra.id)

              // Desativar regra se taxa < 20%
              if (taxa < 0.2 && feedbacksRegra.length >= 5) {
                await supabaseClient
                  .from('agente_regras_dinamicas')
                  .update({ ativa: false })
                  .eq('id', regra.id)
              }
            }
          }
        }
      }
    }

    // 3. Marcar feedback como aplicado
    await supabaseClient
      .from('agente_feedbacks')
      .update({ aplicado: true })
      .eq('id', feedbackData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Feedback processado e comportamento ajustado',
        aprendizado: {
          memoria_criada: true,
          relevancia_ajustada: true,
          padroes_atualizados: true
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
    console.error('Erro no agente-feedback:', error)
    
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
