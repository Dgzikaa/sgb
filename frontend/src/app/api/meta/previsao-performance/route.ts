import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || request.headers.get('x-bar-id')
    const tipo = searchParams.get('tipo') || 'geral' // 'post', 'campanha', 'geral'
    
    if (!barId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bar ID é obrigatório' 
      }, { status: 400 })
    }

    console.log('🔮 Previsão de Performance - Analisando histórico para bar:', barId)

    // 1. COLETAR DADOS HISTÓRICOS
    const { data: instagramHistorico } = await supabase
      .from('meta_instagram_insights')
      .select('*')
      .eq('bar_id', barId)
      .order('updated_at', { ascending: false })
      .limit(100)

    const { data: facebookHistorico } = await supabase
      .from('meta_facebook_insights')
      .select('*')
      .eq('bar_id', barId)
      .order('updated_at', { ascending: false })
      .limit(100)

    // 2. ANÁLISE DE PADRÕES HISTÓRICOS
    const analisarPadroes = (dados: any[]) => {
      if (!dados || dados.length === 0) return null
      
      const padroes = {
        media_engajamento: 0,
        media_alcance: 0,
        melhor_dia_semana: 0,
        melhor_horario: 0,
        trending_up: false,
        fatores_sucesso: [] as string[]
      }
      
      // Calcular médias
      const totalEngajamento = dados.reduce((sum, item) => sum + (item.engagement || 0), 0)
      const totalAlcance = dados.reduce((sum, item) => sum + (item.reach || item.impressions || 0), 0)
      
      padroes.media_engajamento = dados.length > 0 ? totalEngajamento / dados.length : 0
      padroes.media_alcance = dados.length > 0 ? totalAlcance / dados.length : 0
      
      // Analisar dias da semana
      const diasSemana = new Array(7).fill(0)
      const engajamentoPorDia = new Array(7).fill(0)
      
      dados.forEach(item => {
        const dia = new Date(item.updated_at).getDay()
        diasSemana[dia]++
        engajamentoPorDia[dia] += (item.engagement || 0)
      })
      
      let melhorDia = 0
      let melhorEngajamento = 0
      diasSemana.forEach((count, dia) => {
        if (count > 0) {
          const mediaEngajamento = engajamentoPorDia[dia] / count
          if (mediaEngajamento > melhorEngajamento) {
            melhorEngajamento = mediaEngajamento
            melhorDia = dia
          }
        }
      })
      
      padroes.melhor_dia_semana = melhorDia
      
      // Analisar horários
      const horarios = new Array(24).fill(0)
      const engajamentoPorHora = new Array(24).fill(0)
      
      dados.forEach(item => {
        const hora = new Date(item.updated_at).getHours()
        horarios[hora]++
        engajamentoPorHora[hora] += (item.engagement || 0)
      })
      
      let melhorHora = 0
      let melhorEngajamentoHora = 0
      horarios.forEach((count, hora) => {
        if (count > 0) {
          const mediaEngajamento = engajamentoPorHora[hora] / count
          if (mediaEngajamento > melhorEngajamentoHora) {
            melhorEngajamentoHora = mediaEngajamento
            melhorHora = hora
          }
        }
      })
      
      padroes.melhor_horario = melhorHora
      
      // Detectar tendência
      const recentes = dados.slice(0, 10)
      const antigos = dados.slice(-10)
      
      const engajamentoRecente = recentes.reduce((sum, item) => sum + (item.engagement || 0), 0) / recentes.length
      const engajamentoAntigo = antigos.reduce((sum, item) => sum + (item.engagement || 0), 0) / antigos.length
      
      padroes.trending_up = engajamentoRecente > engajamentoAntigo
      
      // Identificar fatores de sucesso
      const topPosts = dados.sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 5)
      const fatores = new Set<string>()
      
      topPosts.forEach(post => {
        const hora = new Date(post.updated_at).getHours()
        const dia = new Date(post.updated_at).getDay()
        
        if (hora >= 18 && hora <= 22) fatores.add('Postar no horário nobre (18h-22h)')
        if (dia === 5 || dia === 6) fatores.add('Postar nos finais de semana')
        if ((post.engagement || 0) > padroes.media_engajamento * 1.5) fatores.add('Conteúdo altamente engajante')
      })
      
      padroes.fatores_sucesso = Array.from(fatores)
      
      return padroes
    }

    // 3. ALGORITMO DE PREVISÃO IA
    const preverPerformance = (padroes: any, contexto: any) => {
      if (!padroes) return null
      
      const agora = new Date()
      const diaAtual = agora.getDay()
      const horaAtual = agora.getHours()
      
      // Score base
      let scoreBase = 50
      
      // Ajustes por dia da semana
      if (diaAtual === padroes.melhor_dia_semana) {
        scoreBase += 20
      } else if (diaAtual === 5 || diaAtual === 6) { // Fim de semana
        scoreBase += 10
      }
      
      // Ajustes por horário
      if (Math.abs(horaAtual - padroes.melhor_horario) <= 2) {
        scoreBase += 15
      } else if (horaAtual >= 18 && horaAtual <= 22) {
        scoreBase += 10
      }
      
      // Ajustes por tendência
      if (padroes.trending_up) {
        scoreBase += 10
      } else {
        scoreBase -= 5
      }
      
      // Ajustes sazonais
      const mes = agora.getMonth()
      if (mes === 11 || mes === 0) { // Dezembro/Janeiro
        scoreBase += 5 // Época festiva
      }
      
      // Normalizar score
      const scoreFinal = Math.max(0, Math.min(100, scoreBase))
      
      return {
        score_predicao: scoreFinal,
        confianca: scoreFinal > 70 ? 'alta' : scoreFinal > 40 ? 'media' : 'baixa',
        engajamento_esperado: Math.round(padroes.media_engajamento * (scoreFinal / 50)),
        alcance_esperado: Math.round(padroes.media_alcance * (scoreFinal / 50)),
        roi_estimado: (scoreFinal / 100) * 150, // ROI baseado no score
        fatores_positivos: padroes.fatores_sucesso,
        melhor_momento: {
          dia_semana: padroes.melhor_dia_semana,
          horario: padroes.melhor_horario,
          dia_nome: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][padroes.melhor_dia_semana]
        }
      }
    }

    // 4. RECOMENDAÇÕES ESPECÍFICAS POR TIPO
    const gerarRecomendacoes = (previsao: any, tipo: string) => {
      const recomendacoes = []
      
      if (tipo === 'post' || tipo === 'geral') {
        recomendacoes.push({
          categoria: 'Timing',
          prioridade: 'alta',
          titulo: 'Melhor momento para postar',
          descricao: `Poste ${previsao.melhor_momento.dia_nome} às ${previsao.melhor_momento.horario}h para máximo engajamento`,
          impacto_estimado: '+25% engajamento'
        })
        
        if (previsao.score_predicao < 60) {
          recomendacoes.push({
            categoria: 'Conteúdo',
            prioridade: 'media',
            titulo: 'Melhore o conteúdo',
            descricao: 'Score baixo detectado. Experimente formatos mais engajantes como vídeos ou stories',
            impacto_estimado: '+15% alcance'
          })
        }
      }
      
      if (tipo === 'campanha' || tipo === 'geral') {
        recomendacoes.push({
          categoria: 'Orçamento',
          prioridade: 'alta',
          titulo: 'Otimização de investimento',
          descricao: `ROI estimado: ${previsao.roi_estimado.toFixed(1)}%. Recomendado investir em horários de pico`,
          impacto_estimado: `+${(previsao.roi_estimado * 0.3).toFixed(1)}% ROI`
        })
        
        if (previsao.confianca === 'baixa') {
          recomendacoes.push({
            categoria: 'Estratégia',
            prioridade: 'alta',
            titulo: 'Colete mais dados',
            descricao: 'Precisamos de mais dados históricos para previsões precisas. Mantenha postagens consistentes',
            impacto_estimado: 'Melhor precisão'
          })
        }
      }
      
      return recomendacoes
    }

    // 5. ALERTAS INTELIGENTES
    const gerarAlertas = (previsao: any) => {
      const alertas = []
      
      if (previsao.confianca === 'baixa') {
        alertas.push({
          tipo: 'warning',
          titulo: 'Baixa confiança na previsão',
          descricao: 'Recomendamos aguardar mais dados antes de investimentos altos',
          acao: 'Teste com orçamento reduzido primeiro'
        })
      }
      
      if (previsao.score_predicao > 80) {
        alertas.push({
          tipo: 'success',
          titulo: 'Momento ideal detectado!',
          descricao: 'Condições ótimas para maximizar resultados',
          acao: 'Aproveite para campanhas importantes'
        })
      }
      
      if (previsao.score_predicao < 30) {
        alertas.push({
          tipo: 'danger',
          titulo: 'Momento desfavorável',
          descricao: 'Previsão indica baixa performance',
          acao: 'Considere adiar ou ajustar estratégia'
        })
      }
      
      return alertas
    }

    // PROCESSAR DADOS
    const padroesInstagram = analisarPadroes(instagramHistorico || [])
    const padroesFacebook = analisarPadroes(facebookHistorico || [])
    
    // Combinar padrões se existirem dados de ambas as plataformas
    const padroesCombinados = padroesInstagram && padroesFacebook ? {
      media_engajamento: (padroesInstagram.media_engajamento + padroesFacebook.media_engajamento) / 2,
      media_alcance: (padroesInstagram.media_alcance + padroesFacebook.media_alcance) / 2,
      melhor_dia_semana: padroesInstagram.melhor_dia_semana, // Priorizar Instagram
      melhor_horario: padroesInstagram.melhor_horario,
      trending_up: padroesInstagram.trending_up || padroesFacebook.trending_up,
      fatores_sucesso: [...padroesInstagram.fatores_sucesso, ...padroesFacebook.fatores_sucesso]
    } : padroesInstagram || padroesFacebook

    const previsaoInstagram = preverPerformance(padroesInstagram, { plataforma: 'instagram' })
    const previsaoFacebook = preverPerformance(padroesFacebook, { plataforma: 'facebook' })
    const previsaoGeral = preverPerformance(padroesCombinados, { plataforma: 'geral' })

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: barId,
      tipo_analise: tipo,
      previsoes: {
        instagram: previsaoInstagram,
        facebook: previsaoFacebook,
        geral: previsaoGeral
      },
      recomendacoes: gerarRecomendacoes(previsaoGeral, tipo),
      alertas: gerarAlertas(previsaoGeral),
      historico_analisado: {
        instagram_posts: instagramHistorico?.length || 0,
        facebook_posts: facebookHistorico?.length || 0,
        periodo_analise: '100 últimos posts'
      },
      proximos_passos: [
        'Monitore as métricas após implementar as recomendações',
        'Ajuste estratégias baseado nos resultados reais',
        'Colete mais dados para melhorar precisão das previsões'
      ]
    }

    console.log('✅ Previsão de Performance processada:', {
      scoreGeral: previsaoGeral?.score_predicao || 0,
      confianca: previsaoGeral?.confianca || 'baixa',
      recomendacoes: resultado.recomendacoes.length,
      alertas: resultado.alertas.length
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ Erro na Previsão de Performance:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 