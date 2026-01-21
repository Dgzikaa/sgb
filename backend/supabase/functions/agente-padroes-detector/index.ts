import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * AGENTE DETECTOR DE PADRÕES
 * 
 * Analisa dados históricos e detecta padrões como:
 * - Tendências de faturamento por dia da semana
 * - Atrações de alta/baixa performance
 * - Sazonalidade mensal
 * - Correlações entre variáveis
 * - Anomalias e outliers
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bar_id = 3 } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log(`🔍 Iniciando detecção de padrões para bar_id=${bar_id}`)
    
    const padroesDetectados: any[] = []
    
    // ==========================================================
    // 1. PADRÃO: Tendência por dia da semana
    // ==========================================================
    const { data: eventosPorDia } = await supabase
      .from('eventos_base')
      .select('dia_semana, real_r, cl_real, data_evento')
      .eq('bar_id', bar_id)
      .gt('real_r', 1000)
      .gte('data_evento', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('data_evento', { ascending: false })
    
    if (eventosPorDia) {
      const diasAgrupados = new Map<string, number[]>()
      
      for (const evento of eventosPorDia) {
        const dia = evento.dia_semana
        if (!diasAgrupados.has(dia)) {
          diasAgrupados.set(dia, [])
        }
        diasAgrupados.get(dia)!.push(parseFloat(evento.real_r) || 0)
      }
      
      for (const [dia, valores] of diasAgrupados) {
        if (valores.length >= 4) {
          // Calcular tendência (primeiras vs últimas semanas)
          const metade = Math.floor(valores.length / 2)
          const mediaRecente = valores.slice(0, metade).reduce((a, b) => a + b, 0) / metade
          const mediaAntiga = valores.slice(metade).reduce((a, b) => a + b, 0) / (valores.length - metade)
          const variacao = ((mediaRecente - mediaAntiga) / mediaAntiga) * 100
          
          if (Math.abs(variacao) > 15) {
            padroesDetectados.push({
              bar_id,
              tipo: 'tendencia_dia_semana',
              descricao: `${dia}: tendência de ${variacao > 0 ? 'crescimento' : 'queda'} de ${Math.abs(variacao).toFixed(1)}% nos últimos 3 meses`,
              dados_suporte: {
                dia_semana: dia,
                media_recente: mediaRecente,
                media_antiga: mediaAntiga,
                variacao_percentual: variacao,
                amostras: valores.length
              },
              confianca: valores.length >= 8 ? 0.9 : 0.7,
              ocorrencias: valores.length,
              status: 'ativo'
            })
          }
        }
      }
    }
    
    // ==========================================================
    // 2. PADRÃO: Atrações de alta performance
    // ==========================================================
    const { data: eventosComAtracao } = await supabase
      .from('eventos_base')
      .select('nome, real_r, cl_real, c_art, data_evento')
      .eq('bar_id', bar_id)
      .gt('real_r', 1000)
      .gte('data_evento', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    if (eventosComAtracao) {
      // Extrair padrões de nomes de atrações
      const atracoes = ['Breno Alves', 'Benzadeus', 'Bonsai', 'Pé no Chão', 'STZ', 'Sambadona', 'Doze', '7naRoda']
      
      for (const atracao of atracoes) {
        const eventosAtracao = eventosComAtracao.filter(e => 
          e.nome?.toLowerCase().includes(atracao.toLowerCase())
        )
        
        if (eventosAtracao.length >= 3) {
          const fatTotal = eventosAtracao.reduce((sum, e) => sum + (parseFloat(e.real_r) || 0), 0)
          const custoTotal = eventosAtracao.reduce((sum, e) => sum + (parseFloat(e.c_art) || 0), 0)
          const publicoTotal = eventosAtracao.reduce((sum, e) => sum + (e.cl_real || 0), 0)
          
          const fatMedio = fatTotal / eventosAtracao.length
          const custoMedio = custoTotal / eventosAtracao.length
          const publicoMedio = publicoTotal / eventosAtracao.length
          const roi = custoTotal > 0 ? ((fatTotal - custoTotal) / custoTotal) * 100 : null
          
          // Detectar se é alta ou baixa performance
          if (roi !== null && roi > 400) {
            padroesDetectados.push({
              bar_id,
              tipo: 'atracao_alta_performance',
              descricao: `${atracao} é uma atração de ALTA PERFORMANCE com ROI médio de ${roi.toFixed(0)}%`,
              dados_suporte: {
                atracao,
                shows: eventosAtracao.length,
                faturamento_total: fatTotal,
                faturamento_medio: fatMedio,
                custo_medio: custoMedio,
                publico_medio: publicoMedio,
                roi
              },
              confianca: eventosAtracao.length >= 5 ? 0.95 : 0.8,
              ocorrencias: eventosAtracao.length,
              status: 'ativo'
            })
          } else if (roi !== null && roi < 100 && custoMedio > 5000) {
            padroesDetectados.push({
              bar_id,
              tipo: 'atracao_baixa_performance',
              descricao: `${atracao} tem ROI baixo (${roi.toFixed(0)}%) - avaliar custo-benefício`,
              dados_suporte: {
                atracao,
                shows: eventosAtracao.length,
                faturamento_medio: fatMedio,
                custo_medio: custoMedio,
                roi
              },
              confianca: 0.85,
              ocorrencias: eventosAtracao.length,
              status: 'atencao'
            })
          }
        }
      }
    }
    
    // ==========================================================
    // 3. PADRÃO: Sazonalidade mensal
    // ==========================================================
    const { data: eventosPorMes } = await supabase
      .from('eventos_base')
      .select('data_evento, real_r')
      .eq('bar_id', bar_id)
      .gt('real_r', 1000)
      .gte('data_evento', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    if (eventosPorMes && eventosPorMes.length > 50) {
      const mesesAgrupados = new Map<string, number[]>()
      
      for (const evento of eventosPorMes) {
        const mes = evento.data_evento.substring(5, 7)
        if (!mesesAgrupados.has(mes)) {
          mesesAgrupados.set(mes, [])
        }
        mesesAgrupados.get(mes)!.push(parseFloat(evento.real_r) || 0)
      }
      
      const mediaPorMes = new Map<string, number>()
      for (const [mes, valores] of mesesAgrupados) {
        mediaPorMes.set(mes, valores.reduce((a, b) => a + b, 0) / valores.length)
      }
      
      const mediaGeral = Array.from(mediaPorMes.values()).reduce((a, b) => a + b, 0) / mediaPorMes.size
      
      // Identificar meses fortes e fracos
      const mesesFortes: string[] = []
      const mesesFracos: string[] = []
      
      for (const [mes, media] of mediaPorMes) {
        const variacao = ((media - mediaGeral) / mediaGeral) * 100
        if (variacao > 20) mesesFortes.push(mes)
        if (variacao < -20) mesesFracos.push(mes)
      }
      
      if (mesesFortes.length > 0 || mesesFracos.length > 0) {
        padroesDetectados.push({
          bar_id,
          tipo: 'sazonalidade_mensal',
          descricao: `Sazonalidade identificada: meses fortes ${mesesFortes.join(', ') || 'nenhum'}, meses fracos ${mesesFracos.join(', ') || 'nenhum'}`,
          dados_suporte: {
            meses_fortes: mesesFortes,
            meses_fracos: mesesFracos,
            media_por_mes: Object.fromEntries(mediaPorMes),
            media_geral: mediaGeral
          },
          confianca: 0.85,
          ocorrencias: eventosPorMes.length,
          status: 'ativo'
        })
      }
    }
    
    // ==========================================================
    // 4. PADRÃO: Ticket médio por faixa de público
    // ==========================================================
    const { data: eventosTicket } = await supabase
      .from('eventos_base')
      .select('cl_real, t_medio, real_r')
      .eq('bar_id', bar_id)
      .gt('real_r', 1000)
      .gt('cl_real', 0)
      .gte('data_evento', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    if (eventosTicket && eventosTicket.length > 20) {
      // Dividir em faixas de público
      const faixas = [
        { min: 0, max: 300, nome: 'Baixo', eventos: [] as any[] },
        { min: 300, max: 600, nome: 'Médio', eventos: [] as any[] },
        { min: 600, max: 900, nome: 'Alto', eventos: [] as any[] },
        { min: 900, max: 9999, nome: 'Lotado', eventos: [] as any[] }
      ]
      
      for (const evento of eventosTicket) {
        for (const faixa of faixas) {
          if (evento.cl_real >= faixa.min && evento.cl_real < faixa.max) {
            faixa.eventos.push(evento)
            break
          }
        }
      }
      
      const resultadosFaixas = faixas
        .filter(f => f.eventos.length >= 3)
        .map(f => ({
          faixa: f.nome,
          publico_range: `${f.min}-${f.max}`,
          ticket_medio: f.eventos.reduce((sum, e) => sum + (parseFloat(e.t_medio) || 0), 0) / f.eventos.length,
          eventos: f.eventos.length
        }))
      
      if (resultadosFaixas.length >= 2) {
        padroesDetectados.push({
          bar_id,
          tipo: 'ticket_por_publico',
          descricao: `Correlação identificada entre tamanho do público e ticket médio`,
          dados_suporte: {
            faixas: resultadosFaixas
          },
          confianca: 0.8,
          ocorrencias: eventosTicket.length,
          status: 'informativo'
        })
      }
    }
    
    // ==========================================================
    // SALVAR PADRÕES NO BANCO
    // ==========================================================
    
    console.log(`📊 ${padroesDetectados.length} padrões detectados`)
    
    if (padroesDetectados.length > 0) {
      // Limpar padrões antigos do mesmo tipo
      const tiposDetectados = [...new Set(padroesDetectados.map(p => p.tipo))]
      
      await supabase
        .from('agente_padroes_detectados')
        .delete()
        .eq('bar_id', bar_id)
        .in('tipo', tiposDetectados)
      
      // Inserir novos padrões
      const { error } = await supabase
        .from('agente_padroes_detectados')
        .insert(padroesDetectados)
      
      if (error) {
        console.error('Erro ao salvar padrões:', error)
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      padroes_detectados: padroesDetectados.length,
      padroes: padroesDetectados
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('Erro no detector de padrões:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
