import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('üéØ Radar de Oportunidades - Analisando mercado...')

    // Obter dados do usu·°rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`üë§ Radar de Oportunidades - Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('ö†Ô∏è Erro ao parsear dados do usu·°rio, usando bar_id padr·£o')
      }
    }

    console.log('üéØ Radar de Oportunidades - Analisando mercado para bar:', barId)

    // 1. AN·ÅLISE DE ATIVIDADE ATUAL
    const { data: instagramData } = await supabase
      .from('meta_instagram_insights')
      .select('*')
      .eq('bar_id', barId)
      .order('updated_at', { ascending: false })
      .limit(30)

    const { data: facebookData } = await supabase
      .from('meta_facebook_insights')
      .select('*')
      .eq('bar_id', barId)
      .order('updated_at', { ascending: false })
      .limit(30)

    // 2. DETECTAR GAPS DE ATIVIDADE
    const detectarGapsAtividade = (dados[]) => {
      const agora = new Date()
      const gaps = []
      
      // Verificar ·∫ltimo post
      if (dados.length > 0) {
        const ultimoPost = new Date(dados[0].updated_at)
        const horasSemPost = (agora.getTime() - ultimoPost.getTime()) / (1000 * 60 * 60)
        
        if (horasSemPost > 24) {
          gaps.push({
            tipo: 'inatividade',
            urgencia: horasSemPost > 48 ? 'alta' : 'media',
            descricao: `${Math.floor(horasSemPost)} horas sem postagem`,
            acao: 'Publique conte·∫do para manter engajamento'
          })
        }
      }
      
      // Verificar padr·µes de hor·°rio
      const postsRecentes = dados.slice(0, 10)
      const horarios = postsRecentes.map((post) => {
        const hora = new Date(post.updated_at).getHours()
        return hora
      })
      
      const horariosPopulares = [18, 19, 20, 21, 22] // Prime time para bares
      const horariosUsados = new Set(horarios)
      const horariosLivres = horariosPopulares.filter((h) => !horariosUsados.has(h))
      
      if (horariosLivres.length > 0) {
        gaps.push({
          tipo: 'horario_otimo',
          urgencia: 'media',
          descricao: `Hor·°rios de alta audi·™ncia n·£o explorados: ${horariosLivres.join(', ')}h`,
          acao: `Poste entre ${horariosLivres[0]}h-${horariosLivres[0]+1}h para melhor alcance`
        })
      }
      
      return gaps
    }

    // 3. AN·ÅLISE DE CONCORR·äNCIA (SIMULADA)
    const analiseConcorrencia = () => {
      const concorrentes = [
        { nome: 'Bar A', atividade: 'baixa', ultima_campanha: '3 dias atr·°s' },
        { nome: 'Bar B', atividade: 'alta', ultima_campanha: '1 dia atr·°s' },
        { nome: 'Bar C', atividade: 'media', ultima_campanha: '2 dias atr·°s' }
      ]
      
      const oportunidades[] = []
      
      concorrentes.forEach(concorrente => {
        if (concorrente.atividade === 'baixa') {
          oportunidades.push({
            tipo: 'gap_concorrencia',
            urgencia: 'alta',
            descricao: `${concorrente.nome} com baixa atividade`,
            acao: 'Aproveite para aumentar sua presen·ßa no mercado'
          })
        }
      })
      
      return oportunidades
    }

    // 4. AN·ÅLISE TEMPORAL INTELIGENTE
    const analiseTemporal = () => {
      const agora = new Date()
      const diaSemana = agora.getDay()
      const hora = agora.getHours()
      
      const oportunidades[] = []
      
      // An·°lise por dia da semana
      if (diaSemana === 5 || diaSemana === 6) { // Sexta ou S·°bado
        oportunidades.push({
          tipo: 'momento_ideal',
          urgencia: 'alta',
          descricao: 'Final de semana - momento ideal para campanhas',
          acao: 'Ative campanhas promocionais para eventos noturnos'
        })
      }
      
      // An·°lise por hor·°rio
      if (hora >= 17 && hora <= 20) {
        oportunidades.push({
          tipo: 'horario_prime',
          urgencia: 'media',
          descricao: 'Hor·°rio de pico de audi·™ncia (17h-20h)',
          acao: 'Poste conte·∫do de happy hour e promo·ß·µes'
        })
      }
      
      return oportunidades
    }

    // 5. AN·ÅLISE DE TEND·äNCIAS
    const analiseTendencias = () => {
      const tendencias = [
        {
          tipo: 'tendencia_sazonal',
          urgencia: 'media',
          descricao: 'Janeiro - per·≠odo de "Dry January" e vida saud·°vel',
          acao: 'Promova drinks sem ·°lcool e op·ß·µes saud·°veis'
        },
        {
          tipo: 'tendencia_social',
          urgencia: 'baixa',
          descricao: 'Reels s·£o 67% mais engajados que posts normais',
          acao: 'Crie mais conte·∫do em formato de v·≠deo curto'
        }
      ]
      
      return tendencias
    }

    // 6. SCORE DE OPORTUNIDADE
    const calcularScore = (oportunidades[]) => {
      const pesos = { alta: 3, media: 2, baixa: 1 }
      const total = oportunidades.reduce((sum, opp) => sum + pesos[opp.urgencia as keyof typeof pesos], 0)
      const maximo = oportunidades.length * 3
      
      return maximo > 0 ? Math.round((total / maximo) * 100) : 0
    }

    // COMPILAR TODAS AS AN·ÅLISES
    const gapsInstagram = detectarGapsAtividade(instagramData || [])
    const gapsFacebook = detectarGapsAtividade(facebookData || [])
    const oportunidadesConcorrencia = analiseConcorrencia()
    const oportunidadesTemporal = analiseTemporal()
    const tendencias = analiseTendencias()
    
    const todasOportunidades = [
      ...gapsInstagram,
      ...gapsFacebook,
      ...oportunidadesConcorrencia,
      ...oportunidadesTemporal,
      ...tendencias
    ]

    const score = calcularScore(todasOportunidades)

    // 7. RECOMENDA·á·ïES PRIORIZADAS
    const recomendacoesPriorizadas = todasOportunidades
      .sort((a, b) => {
        const prioridade = { alta: 3, media: 2, baixa: 1 }
        return prioridade[b.urgencia as keyof typeof prioridade] - prioridade[a.urgencia as keyof typeof prioridade]
      })
      .slice(0, 5)

    // 8. ALERTAS CR·çTICOS
    const alertasCriticos = todasOportunidades
      .filter((opp) => opp.urgencia === 'alta')
      .map((opp) => ({
        titulo: opp.descricao,
        acao: opp.acao,
        prazo: '24h'
      }))

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: barId,
      radar: {
        score_oportunidade: score,
        status: score > 70 ? 'excelente' : score > 40 ? 'bom' : 'critico',
        total_oportunidades: todasOportunidades.length,
        oportunidades_alta: todasOportunidades.filter((o) => o.urgencia === 'alta').length,
        oportunidades_media: todasOportunidades.filter((o) => o.urgencia === 'media').length,
        oportunidades_baixa: todasOportunidades.filter((o) => o.urgencia === 'baixa').length
      },
      gaps_mercado: {
        atividade_propria: gapsInstagram.concat(gapsFacebook),
        concorrencia: oportunidadesConcorrencia,
        temporal: oportunidadesTemporal,
        tendencias: tendencias
      },
      recomendacoes_priorizadas: recomendacoesPriorizadas,
      alertas_criticos: alertasCriticos,
      proximas_acoes: [
        {
          prazo: 'Agora',
          acoes: alertasCriticos.map((a) => a.acao)
        },
        {
          prazo: '24h',
          acoes: todasOportunidades.filter((o) => o.urgencia === 'media').map((o) => o.acao)
        },
        {
          prazo: 'Esta semana',
          acoes: todasOportunidades.filter((o) => o.urgencia === 'baixa').map((o) => o.acao)
        }
      ]
    }

    console.log('úÖ Radar de Oportunidades processado:', {
      score: score,
      oportunidades: todasOportunidades.length,
      alertas: alertasCriticos.length
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('ùå Erro no Radar de Oportunidades:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
