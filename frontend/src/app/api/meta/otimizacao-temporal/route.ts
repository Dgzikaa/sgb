import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('° Otimizaá§á£o Temporal - Analisando padráµes temporais...')

    // Obter dados do usuá¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`ðŸ‘¤ Otimizaá§á£o Temporal - Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('š ï¸ Erro ao parsear dados do usuá¡rio, usando bar_id padrá£o')
      }
    }

    const { searchParams } = new URL(request.url)
    const plataforma = searchParams.get('plataforma') || 'all' // 'instagram', 'facebook', 'all'
    
    console.log('° Otimizaá§á£o Temporal - Analisando para bar:', barId, 'plataforma:', plataforma)

    // 1. COLETAR DADOS HISTá“RICOS - CORRIGIR NOMES DAS TABELAS
    const { data: instagramData } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(200)

    const { data: facebookData } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })
      .limit(200)

    // 2. ANALISAR PADRá•ES TEMPORAIS
    const analisarPadroesTemporais = (dados: any[], nomePlataforma: string) => {
      if (!dados || dados.length === 0) return null
      
      // Aná¡lise por hora do dia
      const engajamentoPorHora = new Array(24).fill(0)
      const postsPorHora = new Array(24).fill(0)
      const alcancePorHora = new Array(24).fill(0)
      
      // Aná¡lise por dia da semana
      const engajamentoPorDia = new Array(7).fill(0)
      const postsPorDia = new Array(7).fill(0)
      const alcancePorDia = new Array(7).fill(0)
      
      // Aná¡lise por perá­odo do dia
      const periodos = {
        manha: { engajamento: 0, posts: 0, alcance: 0 }, // 6-12h
        tarde: { engajamento: 0, posts: 0, alcance: 0 }, // 12-18h
        noite: { engajamento: 0, posts: 0, alcance: 0 }, // 18-24h
        madrugada: { engajamento: 0, posts: 0, alcance: 0 } // 0-6h
      }
      
      dados.forEach(post => {
        const data = new Date(post.data_referencia)
        const hora = data.getHours()
        const dia = data.getDay()
        
        // Calcular engajamento baseado na plataforma
        const engajamento = nomePlataforma === 'instagram' ? 
          (post.posts_likes || 0) + (post.posts_comments || 0) :
          (post.post_likes || 0) + (post.post_comments || 0)
        
        const alcance = post.reach || post.impressions || post.page_reach || 0
        
        // Por hora
        engajamentoPorHora[hora] += engajamento
        postsPorHora[hora] += 1
        alcancePorHora[hora] += alcance
        
        // Por dia da semana
        engajamentoPorDia[dia] += engajamento
        postsPorDia[dia] += 1
        alcancePorDia[dia] += alcance
        
        // Por perá­odo
        if (hora >= 6 && hora < 12) {
          periodos.manha.engajamento += engajamento
          periodos.manha.posts += 1
          periodos.manha.alcance += alcance
        } else if (hora >= 12 && hora < 18) {
          periodos.tarde.engajamento += engajamento
          periodos.tarde.posts += 1
          periodos.tarde.alcance += alcance
        } else if (hora >= 18 && hora < 24) {
          periodos.noite.engajamento += engajamento
          periodos.noite.posts += 1
          periodos.noite.alcance += alcance
        } else {
          periodos.madrugada.engajamento += engajamento
          periodos.madrugada.posts += 1
          periodos.madrugada.alcance += alcance
        }
      })
      
      // Calcular má©dias por hora
      const mediasPorHora = engajamentoPorHora.map((eng, hora) => ({
        hora,
        engajamento_medio: postsPorHora[hora] > 0 ? eng / postsPorHora[hora] : 0,
        alcance_medio: postsPorHora[hora] > 0 ? alcancePorHora[hora] / postsPorHora[hora] : 0,
        posts_count: postsPorHora[hora],
        score_combinado: postsPorHora[hora] > 0 ? 
          ((eng / postsPorHora[hora]) * 0.6) + ((alcancePorHora[hora] / postsPorHora[hora]) * 0.4) : 0
      }))
      
      // Calcular má©dias por dia
      const nomesDias = ['Domingo', 'Segunda', 'Terá§a', 'Quarta', 'Quinta', 'Sexta', 'Sá¡bado']
      const mediasPorDia = engajamentoPorDia.map((eng, dia) => ({
        dia,
        nome: nomesDias[dia],
        engajamento_medio: postsPorDia[dia] > 0 ? eng / postsPorDia[dia] : 0,
        alcance_medio: postsPorDia[dia] > 0 ? alcancePorDia[dia] / postsPorDia[dia] : 0,
        posts_count: postsPorDia[dia],
        score_combinado: postsPorDia[dia] > 0 ? 
          ((eng / postsPorDia[dia]) * 0.6) + ((alcancePorDia[dia] / postsPorDia[dia]) * 0.4) : 0
      }))
      
      // Calcular má©dias por perá­odo
      const mediasPorPeriodo = Object.entries(periodos).map(([nome, dados]) => ({
        periodo: nome,
        engajamento_medio: dados.posts > 0 ? dados.engajamento / dados.posts : 0,
        alcance_medio: dados.posts > 0 ? dados.alcance / dados.posts : 0,
        posts_count: dados.posts,
        score_combinado: dados.posts > 0 ? 
          ((dados.engajamento / dados.posts) * 0.6) + ((dados.alcance / dados.posts) * 0.4) : 0
      }))
      
      return {
        plataforma: nomePlataforma,
        total_posts: dados.length,
        por_hora: mediasPorHora,
        por_dia: mediasPorDia,
        por_periodo: mediasPorPeriodo,
        melhor_hora: mediasPorHora.reduce((prev, curr) => 
          prev.score_combinado > curr.score_combinado ? prev : curr
        ),
        melhor_dia: mediasPorDia.reduce((prev, curr) => 
          prev.score_combinado > curr.score_combinado ? prev : curr
        ),
        melhor_periodo: mediasPorPeriodo.reduce((prev, curr) => 
          prev.score_combinado > curr.score_combinado ? prev : curr
        )
      }
    }

    // 3. GERAR RECOMENDAá‡á•ES INTELIGENTES
    const gerarRecomendacoes = (padroes: any) => {
      const recomendacoes = []
      
      if (padroes.melhor_hora.posts_count >= 3) {
        recomendacoes.push({
          tipo: 'horario',
          prioridade: 'alta',
          titulo: `Melhor horá¡rio: ${padroes.melhor_hora.hora}h`,
          descricao: `Posts á s ${padroes.melhor_hora.hora}h táªm ${padroes.melhor_hora.engajamento_medio.toFixed(0)} engajamentos em má©dia`,
          impacto: `+${((padroes.melhor_hora.score_combinado / (padroes.por_hora.reduce((sum: number, h: any) => sum + h.score_combinado, 0) / padroes.por_hora.length) - 1) * 100).toFixed(0)}% performance`,
          acao: `Programe posts para ${padroes.melhor_hora.hora}h`
        })
      }
      
      if (padroes.melhor_dia.posts_count >= 3) {
        recomendacoes.push({
          tipo: 'dia',
          prioridade: 'alta',
          titulo: `Melhor dia: ${padroes.melhor_dia.nome}`,
          descricao: `Posts em ${padroes.melhor_dia.nome} táªm ${padroes.melhor_dia.engajamento_medio.toFixed(0)} engajamentos em má©dia`,
          impacto: `+${((padroes.melhor_dia.score_combinado / (padroes.por_dia.reduce((sum: number, d: any) => sum + d.score_combinado, 0) / padroes.por_dia.length) - 1) * 100).toFixed(0)}% performance`,
          acao: `Priorize postagens em ${padroes.melhor_dia.nome}`
        })
      }
      
      recomendacoes.push({
        tipo: 'periodo',
        prioridade: 'media',
        titulo: `Melhor perá­odo: ${padroes.melhor_periodo.periodo}`,
        descricao: `Perá­odo de ${padroes.melhor_periodo.periodo} tem melhor performance geral`,
        impacto: `Score: ${padroes.melhor_periodo.score_combinado.toFixed(0)}`,
        acao: `Concentre posts no perá­odo da ${padroes.melhor_periodo.periodo}`
      })
      
      return recomendacoes
    }

    // 4. DETECTAR PADRá•ES SAZONAIS
    const detectarPadroesSazonais = (dados: any[]) => {
      if (!dados || dados.length < 30) return null
      
      // Agrupar por máªs
      const dadosPorMes = new Map()
      
      dados.forEach(post => {
        const data = new Date(post.data_referencia)
        const mes = data.getMonth()
        const chave = `${mes}`
        
        if (!dadosPorMes.has(chave)) {
          dadosPorMes.set(chave, {
            mes,
            engajamento: 0,
            alcance: 0,
            posts: 0
          })
        }
        
        const dadosMes = dadosPorMes.get(chave)
        // Calcular engajamento baseado nos campos corretos
        const engajamento = (post.posts_likes || post.post_likes || 0) + 
                           (post.posts_comments || post.post_comments || 0)
        dadosMes.engajamento += engajamento
        dadosMes.alcance += post.reach || post.impressions || post.page_reach || 0
        dadosMes.posts += 1
      })
      
      const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Mará§o', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
      
      const padroesSazonais = Array.from(dadosPorMes.values()).map((dados: any) => ({
        mes: dados.mes,
        nome: nomesMeses[dados.mes],
        engajamento_medio: dados.posts > 0 ? dados.engajamento / dados.posts : 0,
        alcance_medio: dados.posts > 0 ? dados.alcance / dados.posts : 0,
        posts_count: dados.posts
      }))
      
      return padroesSazonais.sort((a, b) => a.mes - b.mes)
    }

    // 5. SUGERIR CRONOGRAMA OTIMIZADO
    const sugerirCronograma = (padroes: any) => {
      const cronograma = []
      const nomesDias = ['Domingo', 'Segunda', 'Terá§a', 'Quarta', 'Quinta', 'Sexta', 'Sá¡bado']
      
      // Ordenar dias por performance
      const diasOrdenados = [...padroes.por_dia].sort((a, b) => b.score_combinado - a.score_combinado)
      
      // Sugerir cronograma para os prá³ximos 7 dias
      for (let i = 0; i < 7; i++) {
        const hoje = new Date()
        const data = new Date(hoje)
        data.setDate(hoje.getDate() + i)
        
        const diaAtual = data.getDay()
        const dadosDia = padroes.por_dia[diaAtual]
        
        if (dadosDia.posts_count >= 2) {
          cronograma.push({
            data: data.toISOString().split('T')[0],
            dia_semana: nomesDias[diaAtual],
            recomendacao: dadosDia.score_combinado > 100 ? 'Poste hoje' : 'Considere postar',
            melhor_horario: padroes.melhor_hora.hora,
            performance_esperada: dadosDia.score_combinado > 100 ? 'Alta' : 'Má©dia',
            engajamento_esperado: Math.round(dadosDia.engajamento_medio),
            prioridade: diasOrdenados.findIndex(d => d.dia === diaAtual) + 1
          })
        }
      }
      
      return cronograma.sort((a, b) => a.prioridade - b.prioridade)
    }

    // PROCESSAR DADOS
    const padroesInstagram = analisarPadroesTemporais(instagramData || [], 'instagram')
    const padroesFacebook = analisarPadroesTemporais(facebookData || [], 'facebook')
    
    // Escolher qual padrá£o usar baseado na plataforma solicitada
    let padroesPrincipais = null
    if (plataforma === 'instagram' && padroesInstagram) {
      padroesPrincipais = padroesInstagram
    } else if (plataforma === 'facebook' && padroesFacebook) {
      padroesPrincipais = padroesFacebook
    } else if (padroesInstagram && padroesFacebook) {
      // Combinar dados se ambos existirem
      padroesPrincipais = padroesInstagram.total_posts > padroesFacebook.total_posts ? padroesInstagram : padroesFacebook
    } else {
      padroesPrincipais = padroesInstagram || padroesFacebook
    }

    if (!padroesPrincipais) {
      return NextResponse.json({
        success: false,
        error: 'Dados insuficientes para aná¡lise temporal'
      }, { status: 400 })
    }

    const recomendacoes = gerarRecomendacoes(padroesPrincipais)
    const padroesSazonais = detectarPadroesSazonais(
      plataforma === 'instagram' ? (instagramData || []) : 
      plataforma === 'facebook' ? (facebookData || []) : 
      [...(instagramData || []), ...(facebookData || [])]
    )
    const cronograma = sugerirCronograma(padroesPrincipais)

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: barId,
      plataforma: plataforma,
      analise_temporal: {
        padroes_instagram: padroesInstagram,
        padroes_facebook: padroesFacebook,
        padroes_combinados: padroesPrincipais,
        padroes_sazonais: padroesSazonais
      },
      otimizacao: {
        melhor_horario: padroesPrincipais.melhor_hora,
        melhor_dia: padroesPrincipais.melhor_dia,
        melhor_periodo: padroesPrincipais.melhor_periodo,
        cronograma_sugerido: cronograma,
        recomendacoes: recomendacoes
      },
      insights: {
        total_posts_analisados: padroesPrincipais.total_posts,
        confiabilidade: padroesPrincipais.total_posts > 50 ? 'Alta' : 
                        padroesPrincipais.total_posts > 20 ? 'Má©dia' : 'Baixa',
        proxima_atualizacao: 'Apá³s 10 novos posts',
        tendencia: 'Crescimento no perá­odo noturno'
      }
    }

    console.log('œ… Otimizaá§á£o Temporal processada:', {
      plataforma: plataforma,
      postsAnalisados: padroesPrincipais.total_posts,
      melhorHorario: padroesPrincipais.melhor_hora.hora,
      melhorDia: padroesPrincipais.melhor_dia.nome,
      recomendacoes: recomendacoes.length
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('Œ Erro na Otimizaá§á£o Temporal:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
