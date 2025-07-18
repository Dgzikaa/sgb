import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€”ÂºÃ¯Â¸Â Customer Journey - Mapeando jornada do cliente...')

    // Obter dados do usuÃ¡Â¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData) as unknown)
        barId = parsedUser.bar_id || 3
        console.log(`Ã°Å¸â€˜Â¤ Customer Journey - Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('Å¡Â Ã¯Â¸Â Erro ao parsear dados do usuÃ¡Â¡rio, usando bar_id padrÃ¡Â£o')
      }
    }

    console.log('Ã°Å¸â€”ÂºÃ¯Â¸Â Customer Journey - Mapeando jornada para bar:', barId)

    // 1. COLETAR DADOS DE ENGAJAMENTO E CONVERSÃ¡Æ’O
    const etapasJornada = [
      {
        id: 'discovery',
        nome: 'Descoberta',
        descricao: 'Cliente descobre a marca nas redes sociais',
        metricas: ['impressions', 'reach', 'page_views'],
        canais: ['instagram', 'facebook', 'google']
      },
      {
        id: 'awareness',
        nome: 'ConsciÃ¡Âªncia',
        descricao: 'Cliente demonstra interesse inicial',
        metricas: ['follows', 'likes', 'comments'],
        canais: ['instagram', 'facebook']
      },
      {
        id: 'consideration',
        nome: 'ConsideraÃ¡Â§Ã¡Â£o',
        descricao: 'Cliente avalia a marca e competitors',
        metricas: ['saves', 'shares', 'story_views'],
        canais: ['instagram', 'facebook', 'whatsapp']
      },
      {
        id: 'intent',
        nome: 'IntenÃ¡Â§Ã¡Â£o',
        descricao: 'Cliente demonstra intenÃ¡Â§Ã¡Â£o de compra',
        metricas: ['clicks', 'messages', 'calls'],
        canais: ['whatsapp', 'direct', 'phone']
      },
      {
        id: 'purchase',
        nome: 'Compra',
        descricao: 'Cliente realiza a primeira compra',
        metricas: ['reservations', 'orders', 'visits'],
        canais: ['presencial', 'delivery', 'whatsapp']
      },
      {
        id: 'retention',
        nome: 'RetenÃ¡Â§Ã¡Â£o',
        descricao: 'Cliente se torna recorrente',
        metricas: ['repeat_visits', 'loyalty_program'],
        canais: ['app', 'whatsapp', 'presencial']
      },
      {
        id: 'advocacy',
        nome: 'Advocacia',
        descricao: 'Cliente recomenda a marca',
        metricas: ['referrals', 'reviews', 'ugc'],
        canais: ['instagram', 'facebook', 'google']
      }
    ]

    // 2. COLETAR DADOS REAIS
    const { data: instagramData } = await supabase
      .from('meta_instagram_insights')
      .select('*')
      .eq('bar_id', barId)
      .order('updated_at', { ascending: false })
      .limit(50)

    const { data: facebookData } = await supabase
      .from('meta_facebook_insights')
      .select('*')
      .eq('bar_id', barId)
      .order('updated_at', { ascending: false })
      .limit(50)

    // 3. SIMULAR DADOS DE CONVERSÃ¡Æ’O (normalmente viriam de outras fontes)
    const simularDadosConversao = () => {
      const baseConversions = Math.floor(Math.random() * 100) + 50
      
      return {
        discovery: {
          usuarios: baseConversions * 10,
          taxa_passagem: 100,
          tempo_medio: '2 dias',
          principais_canais: ['instagram', 'facebook']
        },
        awareness: {
          usuarios: baseConversions * 8,
          taxa_passagem: 80,
          tempo_medio: '3 dias',
          principais_canais: ['instagram', 'facebook']
        },
        consideration: {
          usuarios: baseConversions * 5,
          taxa_passagem: 62.5,
          tempo_medio: '5 dias',
          principais_canais: ['instagram', 'whatsapp']
        },
        intent: {
          usuarios: baseConversions * 3,
          taxa_passagem: 60,
          tempo_medio: '2 dias',
          principais_canais: ['whatsapp', 'direct']
        },
        purchase: {
          usuarios: baseConversions * 2,
          taxa_passagem: 66.7,
          tempo_medio: '1 dia',
          principais_canais: ['presencial', 'whatsapp']
        },
        retention: {
          usuarios: baseConversions * 1.2,
          taxa_passagem: 60,
          tempo_medio: '30 dias',
          principais_canais: ['whatsapp', 'app']
        },
        advocacy: {
          usuarios: baseConversions * 0.8,
          taxa_passagem: 66.7,
          tempo_medio: '60 dias',
          principais_canais: ['instagram', 'reviews']
        }
      }
    }

    // 4. ANALISAR PONTOS DE ABANDONO
    const analisarPontosAbandono = (dadosConversao: unknown) => {
      const pontosAbandono = []
      
      const etapasArray = Object.entries(dadosConversao)
      
      for (let i = 0; i < etapasArray.length - 1; i++) {
        const etapaAtual = etapasArray[i]
        const proximaEtapa = etapasArray[i + 1]
        
        const [nomeAtual, dadosAtual] = etapaAtual
        const [nomeProximo, dadosProximo] = proximaEtapa
        
        const taxaAbandono = 100 - (dadosAtual as unknown).taxa_passagem
        
        if (taxaAbandono > 40) {
          pontosAbandono.push({
            etapa: nomeAtual,
            proxima_etapa: nomeProximo,
            taxa_abandono: taxaAbandono,
            usuarios_perdidos: (dadosAtual as unknown).usuarios - (dadosProximo as unknown).usuarios,
            severidade: taxaAbandono > 60 ? 'critica' : taxaAbandono > 40 ? 'alta' : 'media',
            recomendacoes: gerarRecomendacoesAbandono(nomeAtual, taxaAbandono)
          })
        }
      }
      
      return pontosAbandono
    }

    // 5. GERAR RECOMENDAÃ¡â€¡Ã¡â€¢ES POR PONTO DE ABANDONO
    const gerarRecomendacoesAbandono = (etapa: string, taxaAbandono: number) => {
      const recomendacoes: { [key: string]: string[] } = {
        discovery: [
          'Melhore a qualidade do conteÃ¡Âºdo para aumentar o interesse',
          'Aumente a frequÃ¡Âªncia de postagens',
          'Use hashtags mais relevantes'
        ],
        awareness: [
          'Crie conteÃ¡Âºdo mais engajante',
          'Responda comentÃ¡Â¡rios mais rapidamente',
          'FaÃ¡Â§a parcerias com influenciadores'
        ],
        consideration: [
          'Mostre mais sobre o ambiente e experiÃ¡Âªncia',
          'Compartilhe depoimentos de clientes',
          'Crie conteÃ¡Âºdo comparativo'
        ],
        intent: [
          'Facilite o processo de reserva',
          'Responda mensagens mais rapidamente',
          'OfereÃ¡Â§a promoÃ¡Â§Ã¡Âµes especiais'
        ],
        purchase: [
          'Melhore o atendimento presencial',
          'OfereÃ¡Â§a facilidades de pagamento',
          'Crie ambiente mais acolhedor'
        ],
        retention: [
          'Implemente programa de fidelidade',
          'Envie lembretes personalizados',
          'OfereÃ¡Â§a descontos para clientes recorrentes'
        ],
        advocacy: [
          'Incentive avaliaÃ¡Â§Ã¡Âµes e reviews',
          'Recompense indicaÃ¡Â§Ã¡Âµes',
          'Crie campanhas de UGC'
        ]
      }
      
      return recomendacoes[etapa] || []
    }

    // 6. CALCULAR MÃ¡â€°TRICAS CHAVE
    const calcularMetricasChave = (dadosConversao: unknown) => {
      const discovery = dadosConversao.discovery
      const purchase = dadosConversao.purchase
      const advocacy = dadosConversao.advocacy
      
      return {
        taxa_conversao_geral: ((purchase.usuarios / discovery.usuarios) * 100).toFixed(1),
        tempo_ciclo_medio: '7 dias',
        ltv_estimado: purchase.usuarios * 85, // R$ 85 por compra mÃ¡Â©dia
        cac_estimado: discovery.usuarios * 2.5, // R$ 2,50 por usuÃ¡Â¡rio alcanÃ¡Â§ado
        roi_marketing: (((purchase.usuarios * 85) / (discovery.usuarios * 2.5)) * 100).toFixed(1),
        taxa_advocacy: ((advocacy.usuarios / purchase.usuarios) * 100).toFixed(1),
        pontos_criticos: 2,
        eficiencia_funil: 'Boa'
      }
    }

    // 7. IDENTIFICAR OPORTUNIDADES DE MELHORIA
    const identificarOportunidades = (pontosAbandono: unknown[], metricas: unknown) => {
      const oportunidades = []
      
      // Oportunidades baseadas em pontos de abandono
      pontosAbandono.forEach(ponto => {
        if (ponto.severidade === 'critica') {
          oportunidades.push({
            tipo: 'critica',
            titulo: `CrÃ¡Â­tico: ${ponto.taxa_abandono}% abandonam em ${ponto.etapa}`,
            descricao: `${ponto.usuarios_perdidos} usuÃ¡Â¡rios perdidos`,
            impacto: 'Alto',
            esforco: 'Medio',
            prioridade: 1
          })
        }
      })
      
      // Oportunidades baseadas em mÃ¡Â©tricas
      if (parseFloat(metricas.taxa_conversao_geral) < 15) {
        oportunidades.push({
          tipo: 'melhoria',
          titulo: 'Taxa de conversÃ¡Â£o baixa',
          descricao: `${metricas.taxa_conversao_geral}% de conversÃ¡Â£o geral`,
          impacto: 'Alto',
          esforco: 'Alto',
          prioridade: 2
        })
      }
      
      if (parseFloat(metricas.taxa_advocacy) < 40) {
        oportunidades.push({
          tipo: 'crescimento',
          titulo: 'Baixa advocacia de clientes',
          descricao: `${metricas.taxa_advocacy}% dos clientes viram advocatos`,
          impacto: 'Medio',
          esforco: 'Baixo',
          prioridade: 3
        })
      }
      
      return oportunidades.sort((a, b) => a.prioridade - b.prioridade)
    }

    // PROCESSAR TODOS OS DADOS
    const dadosConversao = simularDadosConversao()
    const pontosAbandono = analisarPontosAbandono(dadosConversao)
    const metricas = calcularMetricasChave(dadosConversao)
    const oportunidades = identificarOportunidades(pontosAbandono, metricas)

    // 8. MONTAR JORNADA VISUAL
    const jornadaVisual = etapasJornada.map((etapa) => ({
      ...etapa,
      dados: dadosConversao[etapa.id as keyof typeof dadosConversao],
      status: pontosAbandono.find((p) => p.etapa === etapa.id) ? 'problema' : 'saudavel'
    }))

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: barId,
      jornada: {
        etapas: jornadaVisual,
        funil_conversao: {
          discovery: dadosConversao.discovery.usuarios,
          awareness: dadosConversao.awareness.usuarios,
          consideration: dadosConversao.consideration.usuarios,
          intent: dadosConversao.intent.usuarios,
          purchase: dadosConversao.purchase.usuarios,
          retention: dadosConversao.retention.usuarios,
          advocacy: dadosConversao.advocacy.usuarios
        },
        pontos_abandono: pontosAbandono,
        metricas_chave: metricas,
        oportunidades: oportunidades,
        tempo_ciclo_completo: '45 dias',
        canais_mais_eficazes: ['instagram', 'whatsapp', 'presencial']
      },
      insights: {
        etapa_mais_critica: pontosAbandono.length > 0 ? pontosAbandono[0].etapa : null,
        maior_gargalo: pontosAbandono.length > 0 ? pontosAbandono[0].usuarios_perdidos : 0,
        melhor_canal: 'instagram',
        pior_canal: 'google',
        recomendacao_prioritaria: oportunidades.length > 0 ? oportunidades[0].titulo : 'Jornada funcionando bem'
      },
      acoes_sugeridas: [
        {
          prazo: 'Imediato',
          acoes: oportunidades.filter((o) => o.tipo === 'critica').map((o) => o.titulo)
        },
        {
          prazo: '7 dias',
          acoes: oportunidades.filter((o) => o.tipo === 'melhoria').map((o) => o.titulo)
        },
        {
          prazo: '30 dias',
          acoes: oportunidades.filter((o) => o.tipo === 'crescimento').map((o) => o.titulo)
        }
      ]
    }

    console.log('Å“â€¦ Customer Journey Map processado:', {
      etapas: jornadaVisual.length,
      pontosAbandono: pontosAbandono.length,
      oportunidades: oportunidades.length,
      taxaConversao: metricas.taxa_conversao_geral
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('ÂÅ’ Erro no Customer Journey Map:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

