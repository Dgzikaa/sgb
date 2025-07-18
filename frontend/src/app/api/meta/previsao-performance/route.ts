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

// Tipos explÃ­citos para padroes, contexto e previsao
interface PadroesHistoricos {
  media_engajamento: number;
  media_alcance: number;
  melhor_dia_semana: number;
  melhor_horario: number;
  trending_up: boolean;
  fatores_sucesso: string[];
}

interface ContextoPrevisao {
  plataforma: string;
}

interface PrevisaoPerformance {
  score_predicao: number;
  confianca: 'alta' | 'media' | 'baixa';
  engajamento_esperado: number;
  alcance_esperado: number;
  roi_estimado: number;
  fatores_positivos: string[];
  melhor_momento: {
    dia_semana: number;
    horario: number;
    dia_nome: string;
  };
}

// Interface para dados histÃ³ricos de post
interface PostHistorico {
  data_referencia: string;
  posts_likes?: number;
  posts_comments?: number;
  post_likes?: number;
  post_comments?: number;
  reach?: number;
  impressions?: number;
  page_reach?: number;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€Â® PrevisÃ¡Â£o de Performance - Analisando dados histÃ¡Â³ricos...')

    // Obter dados do usuÃ¡Â¡rio para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData) as unknown)
        barId = parsedUser.bar_id || 3
        console.log(`Ã°Å¸â€˜Â¤ PrevisÃ¡Â£o de Performance - Usando bar_id: ${barId}`)
      } catch (e) {
        console.warn('Å¡Â Ã¯Â¸Â Erro ao parsear dados do usuÃ¡Â¡rio, usando bar_id padrÃ¡Â£o')
      }
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'geral' // 'post', 'campanha', 'geral'
    
    console.log('Ã°Å¸â€Â® PrevisÃ¡Â£o de Performance - Analisando para bar:', barId, 'tipo:', tipo)

    // 1. COLETAR DADOS HISTÃ¡â€œRICOS - CORRIGIR NOMES DAS TABELAS
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

    // 2. ANÃLISE DE PADRÃ•ES HISTÃ“RICOS
    const analisarPadroes = (dados: PostHistorico[]): PadroesHistoricos | null => {
      if (!dados || dados.length === 0) return null
      
      const padroes: PadroesHistoricos = {
        media_engajamento: 0,
        media_alcance: 0,
        melhor_dia_semana: 0,
        melhor_horario: 0,
        trending_up: false,
        fatores_sucesso: []
      }
      
      // Calcular mÃ©dias - AJUSTAR CAMPOS PARA TABELA CORRETA
      const totalEngajamento = dados.reduce((sum: number, item: PostHistorico) => {
        // Para Instagram: posts_likes + posts_comments
        // Para Facebook: post_likes + post_comments
        const engagement = (item.posts_likes || item.post_likes || 0) + 
                          (item.posts_comments || item.post_comments || 0)
        return sum + engagement
      }, 0)
      
      const totalAlcance = dados.reduce((sum: number, item: PostHistorico) => {
        return sum + (item.reach || item.impressions || item.page_reach || 0)
      }, 0)
      
      padroes.media_engajamento = dados.length > 0 ? totalEngajamento / dados.length : 0
      padroes.media_alcance = dados.length > 0 ? totalAlcance / dados.length : 0
      
      // Analisar dias da semana - USAR data_referencia
      const diasSemana = new Array(7).fill(0)
      const engajamentoPorDia = new Array(7).fill(0)
      
      dados.forEach((item: PostHistorico) => {
        const dia = new Date(item.data_referencia).getDay()
        diasSemana[dia]++
        
        const engagement = (item.posts_likes || item.post_likes || 0) + 
                          (item.posts_comments || item.post_comments || 0)
        engajamentoPorDia[dia] += engagement
      })
      
      let melhorDia = 0
      let melhorEngajamento = 0
      diasSemana.forEach((count: number, dia: number) => {
        if (count > 0) {
          const mediaEngajamento = engajamentoPorDia[dia] / count
          if (mediaEngajamento > melhorEngajamento) {
            melhorEngajamento = mediaEngajamento
            melhorDia = dia
          }
        }
      })
      
      padroes.melhor_dia_semana = melhorDia
      
      // Analisar horÃ¡Â¡rios - USAR data_referencia (assumindo que estÃ¡Â¡ no formato correto)
      const horarios = new Array(24).fill(0)
      const engajamentoPorHora = new Array(24).fill(0)
      
      dados.forEach((item: PostHistorico) => {
        const hora = new Date(item.data_referencia).getHours()
        horarios[hora]++
        
        const engagement = (item.posts_likes || item.post_likes || 0) + 
                          (item.posts_comments || item.post_comments || 0)
        engajamentoPorHora[hora] += engagement
      })
      
      let melhorHora = 0
      let melhorEngajamentoHora = 0
      horarios.forEach((count: number, hora: number) => {
        if (count > 0) {
          const mediaEngajamento = engajamentoPorHora[hora] / count
          if (mediaEngajamento > melhorEngajamentoHora) {
            melhorEngajamentoHora = mediaEngajamento
            melhorHora = hora
          }
        }
      })
      
      padroes.melhor_horario = melhorHora
      
      // Detectar tendÃ¡Âªncia
      const recentes = dados.slice(0, 10)
      const antigos = dados.slice(-10)
      
      const calcularEngajamento = (items: PostHistorico[]) => {
        return items.reduce((sum: number, item: PostHistorico) => {
          const engagement = (item.posts_likes || item.post_likes || 0) + 
                            (item.posts_comments || item.post_comments || 0)
          return sum + engagement
        }, 0) / items.length
      }
      
      const engajamentoRecente = calcularEngajamento(recentes)
      const engajamentoAntigo = calcularEngajamento(antigos)
      
      padroes.trending_up = engajamentoRecente > engajamentoAntigo
      
      // Identificar fatores de sucesso
      const topPosts = dados.sort((a: PostHistorico, b: PostHistorico) => {
        const engA = (a.posts_likes || a.post_likes || 0) + (a.posts_comments || a.post_comments || 0)
        const engB = (b.posts_likes || b.post_likes || 0) + (b.posts_comments || b.post_comments || 0)
        return engB - engA
      }).slice(0, 5)
      
      const fatores = new Set<string>()
      
      topPosts.forEach((post: PostHistorico) => {
        const hora = new Date(post.data_referencia).getHours()
        const dia = new Date(post.data_referencia).getDay()
        
        if (hora >= 18 && hora <= 22) fatores.add('Postar no horÃ¡rio nobre (18h-22h)')
        if (dia === 5 || dia === 6) fatores.add('Postar nos finais de semana')
        
        const engagement = (post.posts_likes || post.post_likes || 0) + 
                          (post.posts_comments || post.post_comments || 0)
        if (engagement > padroes.media_engajamento * 1.5) fatores.add('ConteÃºdo altamente engajante')
      })
      
      padroes.fatores_sucesso = Array.from(fatores)
      
      return padroes
    }

    // 3. ALGORITMO DE PREVISÃƒO IA
    const preverPerformance = (padroes: PadroesHistoricos | null, contexto: ContextoPrevisao): PrevisaoPerformance | null => {
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
      
      // Ajustes por horÃ¡Â¡rio
      if (Math.abs(horaAtual - padroes.melhor_horario) <= 2) {
        scoreBase += 15
      } else if (horaAtual >= 18 && horaAtual <= 22) {
        scoreBase += 10
      }
      
      // Ajustes por tendÃ¡Âªncia
      if (padroes.trending_up) {
        scoreBase += 10
      } else {
        scoreBase -= 5
      }
      
      // Ajustes sazonais
      const mes = agora.getMonth()
      if (mes === 11 || mes === 0) { // Dezembro/Janeiro
        scoreBase += 5 // Ã¡â€°poca festiva
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
          dia_nome: ['Domingo', 'Segunda', 'TerÃ¡Â§a', 'Quarta', 'Quinta', 'Sexta', 'SÃ¡Â¡bado'][padroes.melhor_dia_semana]
        }
      }
    }

    // 4. RECOMENDAÃ‡Ã•ES ESPECÃFICAS POR TIPO
    const gerarRecomendacoes = (previsao: PrevisaoPerformance, tipo: string): Array<{ categoria: string; prioridade: string; titulo: string; descricao: string; impacto_estimado: string }> => {
      const recomendacoes = []
      
      if (tipo === 'post' || tipo === 'geral') {
        recomendacoes.push({
          categoria: 'Timing',
          prioridade: 'alta',
          titulo: 'Melhor momento para postar',
          descricao: `Poste ${previsao.melhor_momento.dia_nome} Ã¡Â s ${previsao.melhor_momento.horario}h para mÃ¡ximo engajamento`,
          impacto_estimado: '+25% engajamento'
        })
        
        if (previsao.score_predicao < 60) {
          recomendacoes.push({
            categoria: 'ConteÃ¡Âºdo',
            prioridade: 'media',
            titulo: 'Melhore o conteÃ¡Âºdo',
            descricao: 'Score baixo detectado. Experimente formatos mais engajantes como vÃ¡Â­deos ou stories',
            impacto_estimado: '+15% alcance'
          })
        }
      }
      
      if (tipo === 'campanha' || tipo === 'geral') {
        recomendacoes.push({
          categoria: 'OrÃ¡Â§amento',
          prioridade: 'alta',
          titulo: 'OtimizaÃ¡Â§Ã¡Â£o de investimento',
          descricao: `ROI estimado: ${previsao.roi_estimado.toFixed(1)}%. Recomendado investir em horÃ¡Â¡rios de pico`,
          impacto_estimado: `+${(previsao.roi_estimado * 0.3).toFixed(1)}% ROI`
        })
        
        if (previsao.confianca === 'baixa') {
          recomendacoes.push({
            categoria: 'EstratÃ¡Â©gia',
            prioridade: 'alta',
            titulo: 'Colete mais dados',
            descricao: 'Precisamos de mais dados histÃ¡Â³ricos para previsÃ¡Âµes precisas. Mantenha postagens consistentes',
            impacto_estimado: 'Melhor precisÃ¡Â£o'
          })
        }
      }
      
      return recomendacoes
    }

    // 5. ALERTAS INTELIGENTES
    const gerarAlertas = (previsao: PrevisaoPerformance): Array<{ tipo: string; titulo: string; descricao: string; acao: string }> => {
      const alertas = []
      
      if (previsao.confianca === 'baixa') {
        alertas.push({
          tipo: 'warning',
          titulo: 'Baixa confianÃ¡Â§a na previsÃ¡Â£o',
          descricao: 'Recomendamos aguardar mais dados antes de investimentos altos',
          acao: 'Teste com orÃ¡Â§amento reduzido primeiro'
        })
      }
      
      if (previsao.score_predicao > 80) {
        alertas.push({
          tipo: 'success',
          titulo: 'Momento ideal detectado!',
          descricao: 'CondiÃ¡Â§Ã¡Âµes Ã¡Â³timas para maximizar resultados',
          acao: 'Aproveite para campanhas importantes'
        })
      }
      
      if (previsao.score_predicao < 30) {
        alertas.push({
          tipo: 'danger',
          titulo: 'Momento desfavorÃ¡Â¡vel',
          descricao: 'PrevisÃ¡Â£o indica baixa performance',
          acao: 'Considere adiar ou ajustar estratÃ¡Â©gia'
        })
      }
      
      return alertas
    }

    // PROCESSAR DADOS
    const padroesInstagram = analisarPadroes(instagramHistorico || [])
    const padroesFacebook = analisarPadroes(facebookHistorico || [])
    
    // Combinar padrÃ¡Âµes se existirem dados de ambas as plataformas
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
      recomendacoes: previsaoGeral ? gerarRecomendacoes(previsaoGeral, tipo) : [],
      alertas: previsaoGeral ? gerarAlertas(previsaoGeral) : [],
      historico_analisado: {
        instagram_posts: instagramHistorico?.length || 0,
        facebook_posts: facebookHistorico?.length || 0,
        periodo_analise: '100 Ã¡Âºltimos posts'
      },
      proximos_passos: [
        'Monitore as mÃ¡Â©tricas apÃ¡Â³s implementar as recomendaÃ¡Â§Ã¡Âµes',
        'Ajuste estratÃ¡Â©gias baseado nos resultados reais',
        'Colete mais dados para melhorar precisÃ¡Â£o das previsÃ¡Âµes'
      ]
    }

    console.log('Å“â€¦ PrevisÃ¡Â£o de Performance processada:', {
      scoreGeral: previsaoGeral?.score_predicao || 0,
      confianca: previsaoGeral?.confianca || 'baixa',
      recomendacoes: resultado.recomendacoes.length,
      alertas: resultado.alertas.length
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('ÂÅ’ Erro na PrevisÃ¡Â£o de Performance:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

