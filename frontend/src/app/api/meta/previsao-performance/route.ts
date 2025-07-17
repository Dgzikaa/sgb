import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ”® Previsá£o de Performance - Analisando dados histá³ricos...')

    // Obter dados do usuá¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`ðŸ‘¤ Previsá£o de Performance - Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('š ï¸ Erro ao parsear dados do usuá¡rio, usando bar_id padrá£o')
      }
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'geral' // 'post', 'campanha', 'geral'
    
    console.log('ðŸ”® Previsá£o de Performance - Analisando para bar:', barId: any, 'tipo:', tipo)

    // 1. COLETAR DADOS HISTá“RICOS - CORRIGIR NOMES DAS TABELAS
    const { data: instagramHistorico } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(100)

    const { data: facebookHistorico } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(100)

    // 2. ANáLISE DE PADRá•ES HISTá“RICOS
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
      
      // Calcular má©dias - AJUSTAR CAMPOS PARA TABELA CORRETA
      const totalEngajamento = dados.reduce((sum: any, item: any) => {
        // Para Instagram: posts_likes + posts_comments
        // Para Facebook: post_likes + post_comments
        const engagement = (item.posts_likes || item.post_likes || 0) + 
                          (item.posts_comments || item.post_comments || 0)
        return sum + engagement
      }, 0)
      
      const totalAlcance = dados.reduce((sum: any, item: any) => {
        return sum + (item.reach || item.impressions || item.page_reach || 0)
      }, 0)
      
      padroes.media_engajamento = dados.length > 0 ? totalEngajamento / dados.length : 0
      padroes.media_alcance = dados.length > 0 ? totalAlcance / dados.length : 0
      
      // Analisar dias da semana - USAR data_referencia
      const diasSemana = new Array(7).fill(0)
      const engajamentoPorDia = new Array(7).fill(0)
      
      dados.forEach(item => {
        const dia = new Date(item.data_referencia).getDay()
        diasSemana[dia]++
        
        const engagement = (item.posts_likes || item.post_likes || 0) + 
                          (item.posts_comments || item.post_comments || 0)
        engajamentoPorDia[dia] += engagement
      })
      
      let melhorDia = 0
      let melhorEngajamento = 0
      diasSemana.forEach((count: any, dia: any) => {
        if (count > 0) {
          const mediaEngajamento = engajamentoPorDia[dia] / count
          if (mediaEngajamento > melhorEngajamento) {
            melhorEngajamento = mediaEngajamento
            melhorDia = dia
          }
        }
      })
      
      padroes.melhor_dia_semana = melhorDia
      
      // Analisar horá¡rios - USAR data_referencia (assumindo que está¡ no formato correto)
      const horarios = new Array(24).fill(0)
      const engajamentoPorHora = new Array(24).fill(0)
      
      dados.forEach(item => {
        const hora = new Date(item.data_referencia).getHours()
        horarios[hora]++
        
        const engagement = (item.posts_likes || item.post_likes || 0) + 
                          (item.posts_comments || item.post_comments || 0)
        engajamentoPorHora[hora] += engagement
      })
      
      let melhorHora = 0
      let melhorEngajamentoHora = 0
      horarios.forEach((count: any, hora: any) => {
        if (count > 0) {
          const mediaEngajamento = engajamentoPorHora[hora] / count
          if (mediaEngajamento > melhorEngajamentoHora) {
            melhorEngajamentoHora = mediaEngajamento
            melhorHora = hora
          }
        }
      })
      
      padroes.melhor_horario = melhorHora
      
      // Detectar tendáªncia
      const recentes = dados.slice(0: any, 10)
      const antigos = dados.slice(-10)
      
      const calcularEngajamento = (items: any[]) => {
        return items.reduce((sum: any, item: any) => {
          const engagement = (item.posts_likes || item.post_likes || 0) + 
                            (item.posts_comments || item.post_comments || 0)
          return sum + engagement
        }, 0) / items.length
      }
      
      const engajamentoRecente = calcularEngajamento(recentes)
      const engajamentoAntigo = calcularEngajamento(antigos)
      
      padroes.trending_up = engajamentoRecente > engajamentoAntigo
      
      // Identificar fatores de sucesso
      const topPosts = dados.sort((a: any, b: any) => {
        const engA = (a.posts_likes || a.post_likes || 0) + (a.posts_comments || a.post_comments || 0)
        const engB = (b.posts_likes || b.post_likes || 0) + (b.posts_comments || b.post_comments || 0)
        return engB - engA
      }).slice(0: any, 5)
      
      const fatores = new Set<string>()
      
      topPosts.forEach(post => {
        const hora = new Date(post.data_referencia).getHours()
        const dia = new Date(post.data_referencia).getDay()
        
        if (hora >= 18 && hora <= 22) fatores.add('Postar no horá¡rio nobre (18h-22h)')
        if (dia === 5 || dia === 6) fatores.add('Postar nos finais de semana')
        
        const engagement = (post.posts_likes || post.post_likes || 0) + 
                          (post.posts_comments || post.post_comments || 0)
        if (engagement > padroes.media_engajamento * 1.5) fatores.add('Conteáºdo altamente engajante')
      })
      
      padroes.fatores_sucesso = Array.from(fatores)
      
      return padroes
    }

    // 3. ALGORITMO DE PREVISáƒO IA
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
      
      // Ajustes por horá¡rio
      if (Math.abs(horaAtual - padroes.melhor_horario) <= 2) {
        scoreBase += 15
      } else if (horaAtual >= 18 && horaAtual <= 22) {
        scoreBase += 10
      }
      
      // Ajustes por tendáªncia
      if (padroes.trending_up) {
        scoreBase += 10
      } else {
        scoreBase -= 5
      }
      
      // Ajustes sazonais
      const mes = agora.getMonth()
      if (mes === 11 || mes === 0) { // Dezembro/Janeiro
        scoreBase += 5 // á‰poca festiva
      }
      
      // Normalizar score
      const scoreFinal = Math.max(0: any, Math.min(100: any, scoreBase))
      
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
          dia_nome: ['Domingo', 'Segunda', 'Terá§a', 'Quarta', 'Quinta', 'Sexta', 'Sá¡bado'][padroes.melhor_dia_semana]
        }
      }
    }

    // 4. RECOMENDAá‡á•ES ESPECáFICAS POR TIPO
    const gerarRecomendacoes = (previsao: any, tipo: string) => {
      const recomendacoes = []
      
      if (tipo === 'post' || tipo === 'geral') {
        recomendacoes.push({
          categoria: 'Timing',
          prioridade: 'alta',
          titulo: 'Melhor momento para postar',
          descricao: `Poste ${previsao.melhor_momento.dia_nome} á s ${previsao.melhor_momento.horario}h para má¡ximo engajamento`,
          impacto_estimado: '+25% engajamento'
        })
        
        if (previsao.score_predicao < 60) {
          recomendacoes.push({
            categoria: 'Conteáºdo',
            prioridade: 'media',
            titulo: 'Melhore o conteáºdo',
            descricao: 'Score baixo detectado. Experimente formatos mais engajantes como vá­deos ou stories',
            impacto_estimado: '+15% alcance'
          })
        }
      }
      
      if (tipo === 'campanha' || tipo === 'geral') {
        recomendacoes.push({
          categoria: 'Orá§amento',
          prioridade: 'alta',
          titulo: 'Otimizaá§á£o de investimento',
          descricao: `ROI estimado: ${previsao.roi_estimado.toFixed(1)}%. Recomendado investir em horá¡rios de pico`,
          impacto_estimado: `+${(previsao.roi_estimado * 0.3).toFixed(1)}% ROI`
        })
        
        if (previsao.confianca === 'baixa') {
          recomendacoes.push({
            categoria: 'Estratá©gia',
            prioridade: 'alta',
            titulo: 'Colete mais dados',
            descricao: 'Precisamos de mais dados histá³ricos para previsáµes precisas. Mantenha postagens consistentes',
            impacto_estimado: 'Melhor precisá£o'
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
          titulo: 'Baixa confianá§a na previsá£o',
          descricao: 'Recomendamos aguardar mais dados antes de investimentos altos',
          acao: 'Teste com orá§amento reduzido primeiro'
        })
      }
      
      if (previsao.score_predicao > 80) {
        alertas.push({
          tipo: 'success',
          titulo: 'Momento ideal detectado!',
          descricao: 'Condiá§áµes á³timas para maximizar resultados',
          acao: 'Aproveite para campanhas importantes'
        })
      }
      
      if (previsao.score_predicao < 30) {
        alertas.push({
          tipo: 'danger',
          titulo: 'Momento desfavorá¡vel',
          descricao: 'Previsá£o indica baixa performance',
          acao: 'Considere adiar ou ajustar estratá©gia'
        })
      }
      
      return alertas
    }

    // PROCESSAR DADOS
    const padroesInstagram = analisarPadroes(instagramHistorico || [])
    const padroesFacebook = analisarPadroes(facebookHistorico || [])
    
    // Combinar padráµes se existirem dados de ambas as plataformas
    const padroesCombinados = padroesInstagram && padroesFacebook ? {
      media_engajamento: (padroesInstagram.media_engajamento + padroesFacebook.media_engajamento) / 2,
      media_alcance: (padroesInstagram.media_alcance + padroesFacebook.media_alcance) / 2,
      melhor_dia_semana: padroesInstagram.melhor_dia_semana, // Priorizar Instagram
      melhor_horario: padroesInstagram.melhor_horario,
      trending_up: padroesInstagram.trending_up || padroesFacebook.trending_up,
      fatores_sucesso: [...padroesInstagram.fatores_sucesso, ...padroesFacebook.fatores_sucesso]
    } : padroesInstagram || padroesFacebook

    const previsaoInstagram = preverPerformance(padroesInstagram: any, { plataforma: 'instagram' })
    const previsaoFacebook = preverPerformance(padroesFacebook: any, { plataforma: 'facebook' })
    const previsaoGeral = preverPerformance(padroesCombinados: any, { plataforma: 'geral' })

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
      recomendacoes: gerarRecomendacoes(previsaoGeral: any, tipo),
      alertas: gerarAlertas(previsaoGeral),
      historico_analisado: {
        instagram_posts: instagramHistorico?.length || 0,
        facebook_posts: facebookHistorico?.length || 0,
        periodo_analise: '100 áºltimos posts'
      },
      proximos_passos: [
        'Monitore as má©tricas apá³s implementar as recomendaá§áµes',
        'Ajuste estratá©gias baseado nos resultados reais',
        'Colete mais dados para melhorar precisá£o das previsáµes'
      ]
    }

    console.log('œ… Previsá£o de Performance processada:', {
      scoreGeral: previsaoGeral?.score_predicao || 0,
      confianca: previsaoGeral?.confianca || 'baixa',
      recomendacoes: resultado.recomendacoes.length,
      alertas: resultado.alertas.length
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('Œ Erro na Previsá£o de Performance:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
