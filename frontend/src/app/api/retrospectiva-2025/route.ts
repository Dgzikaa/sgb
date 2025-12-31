import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cache simples em memória (válido por 5 minutos)
let cache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
// Reset cache on deploy - v11 (insights extras - 17 categorias adicionais)
const CACHE_VERSION = 11

export async function GET(request: NextRequest) {
  try {
    // Verificar cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      console.log('📦 Retornando dados do cache')
      return NextResponse.json({ success: true, data: cache.data, cached: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const startTime = Date.now()

    console.log('🔍 Iniciando busca de dados da retrospectiva 2025 (OTIMIZADA)...')

    // ============================================
    // USAR STORED PROCEDURES OTIMIZADAS
    // ============================================

    // 1. Dados principais (financeiro, operacional, cultura, marketing)
    const { data: dadosPrincipais, error: erroPrincipal } = await supabase
      .rpc('get_retrospectiva_2025', { p_bar_id: 3 })

    if (erroPrincipal) {
      console.error('❌ Erro ao buscar dados principais:', erroPrincipal)
      throw erroPrincipal
    }

    console.log(`✅ Dados principais carregados`)

    // 2. Evolução mensal
    const { data: evolucaoMensal, error: erroEvolucao } = await supabase
      .rpc('get_retrospectiva_evolucao_mensal', { p_bar_id: 3 })

    if (erroEvolucao) {
      console.error('❌ Erro ao buscar evolução mensal:', erroEvolucao)
    }

    // 3. Clientes por mês
    const { data: clientesMes, error: erroClientes } = await supabase
      .rpc('get_retrospectiva_clientes_mes', { p_bar_id: 3 })

    if (erroClientes) {
      console.error('❌ Erro ao buscar clientes por mês:', erroClientes)
    }

    // 4. Top produtos
    const { data: topProdutos, error: erroProdutos } = await supabase
      .rpc('get_retrospectiva_top_produtos', { p_bar_id: 3, p_limit: 15 })

    if (erroProdutos) {
      console.error('❌ Erro ao buscar top produtos:', erroProdutos)
    }

    // 5. Vendas por categoria
    const { data: vendasCategoria, error: erroCategorias } = await supabase
      .rpc('get_retrospectiva_vendas_categoria', { p_bar_id: 3 })

    if (erroCategorias) {
      console.error('❌ Erro ao buscar vendas por categoria:', erroCategorias)
    }

    // 6. INSIGHTS ESTRATÉGICOS COMPLETOS 360° (recordes, tops, clientes, tempos, etc)
    const { data: insightsData, error: erroInsights } = await supabase
      .rpc('get_retrospectiva_completa', { p_bar_id: 3 })

    if (erroInsights) {
      console.error('❌ Erro ao buscar insights estratégicos:', erroInsights)
    }

    console.log(`✅ Insights estratégicos 360° carregados`)

    // 6b. MEGA INSIGHTS 360° (25 categorias de análise)
    const { data: megaInsightsData, error: erroMegaInsights } = await supabase
      .rpc('get_mega_insights_360', { p_bar_id: 3 })

    if (erroMegaInsights) {
      console.error('❌ Erro ao buscar mega insights:', erroMegaInsights)
    }

    console.log(`✅ Mega insights 360° carregados (25 categorias)`)

    // 6c. INSIGHTS DE OPORTUNIDADES (ações estratégicas 2026)
    const { data: oportunidadesData, error: erroOportunidades } = await supabase
      .rpc('get_insights_oportunidades', { p_bar_id: 3 })

    if (erroOportunidades) {
      console.error('❌ Erro ao buscar oportunidades:', erroOportunidades)
    }

    console.log(`✅ Insights de oportunidades carregados`)

    // 6d. INSIGHTS ADICIONAIS (google, reservas, categorias, etc)
    const { data: adicionaisData, error: erroAdicionais } = await supabase
      .rpc('get_insights_adicionais', { p_bar_id: 3 })

    if (erroAdicionais) {
      console.error('❌ Erro ao buscar insights adicionais:', erroAdicionais)
    }

    console.log(`✅ Insights adicionais carregados`)

    // 6e. ULTRA INSIGHTS (24 categorias de análise avançada)
    const { data: ultraInsightsData, error: erroUltraInsights } = await supabase
      .rpc('get_ultra_insights', { p_bar_id: 3 })

    if (erroUltraInsights) {
      console.error('❌ Erro ao buscar ultra insights:', erroUltraInsights)
    }

    console.log(`✅ Ultra insights carregados (24 categorias)`)

    // 6f. INSIGHTS EXTRAS (17 categorias: vendedores, dormentes, sazonalidade, etc)
    const { data: extrasData, error: erroExtras } = await supabase
      .rpc('get_insights_extras', { p_bar_id: 3 })

    if (erroExtras) {
      console.error('❌ Erro ao buscar insights extras:', erroExtras)
    }

    console.log(`✅ Insights extras carregados (17 categorias)`)

    // 7. Metas e OKRs (busca simples, poucos registros)
    const { data: visaoData } = await supabase
      .from('organizador_visao')
      .select('*')
      .eq('ano', 2025)
      .order('trimestre', { ascending: true, nullsFirst: true })

    const organizadorIds = visaoData?.map(v => v.id) || []
    
    const { data: okrsData } = organizadorIds.length > 0
      ? await supabase
          .from('organizador_okrs')
          .select('*')
          .in('organizador_id', organizadorIds)
          .order('ordem', { ascending: true })
      : { data: null }

    // ============================================
    // CONSOLIDAR DADOS
    // ============================================
    
    // Mesclar evolução mensal com clientes
    const evolucaoCompleta = (evolucaoMensal || []).map((mes: any) => {
      const clientesMesData = (clientesMes || []).find((c: any) => c.mes === mes.mes)
      return {
        ...mes,
        clientes: clientesMesData?.clientes || 0
      }
    })

    // Extrair vendas individuais
    const vendasCat = vendasCategoria || []
    const vendas = {
      cervejas: vendasCat.find((v: any) => v.categoria === 'CERVEJAS')?.quantidade_total || 0,
      faturamentoCervejas: vendasCat.find((v: any) => v.categoria === 'CERVEJAS')?.faturamento_total || 0,
      drinks: vendasCat.find((v: any) => v.categoria === 'DRINKS')?.quantidade_total || 0,
      faturamentoDrinks: vendasCat.find((v: any) => v.categoria === 'DRINKS')?.faturamento_total || 0,
      naoAlcoolicos: vendasCat.find((v: any) => v.categoria === 'NÃO ALCOÓLICOS')?.quantidade_total || 0,
      faturamentoNaoAlcoolicos: vendasCat.find((v: any) => v.categoria === 'NÃO ALCOÓLICOS')?.faturamento_total || 0,
      comidas: vendasCat.find((v: any) => v.categoria === 'COMIDAS')?.quantidade_total || 0,
      faturamentoComidas: vendasCat.find((v: any) => v.categoria === 'COMIDAS')?.faturamento_total || 0,
    }

    // Calcular faturamento bebidas e comida
    const faturamentoBebidas = (vendas.faturamentoCervejas || 0) + (vendas.faturamentoDrinks || 0) + (vendas.faturamentoNaoAlcoolicos || 0)
    const faturamentoComida = vendas.faturamentoComidas || 0

    const consolidado = {
      // FINANCEIRO (dados da stored procedure)
      financeiro: {
        ...dadosPrincipais.financeiro,
        faturamentoBebidas,
        faturamentoComida,
        // Renomear para compatibilidade
        cmvLimpoMedio: dadosPrincipais.financeiro.cmvMedio,
        percentualArtisticaMedio: dadosPrincipais.financeiro.artisticaMedio,
      },

      // OPERACIONAL
      operacional: {
        ...dadosPrincipais.operacional,
        ticketsVendidos: dadosPrincipais.operacional.totalIngressos || 0,
      },

      // PESSOAS E CULTURA
      pessoasCultura: dadosPrincipais.pessoasCultura,

      // MARKETING
      marketing: dadosPrincipais.marketing,

      // METAS E CONQUISTAS
      metas: {
        visaoGeral: visaoData?.find(v => !v.trimestre) || visaoData?.[0] || null,
        visaoCompleta: visaoData || [],
        okrs: okrsData?.map(okr => ({
          ...okr,
          progresso: okr.status === 'verde' ? 100 
                   : okr.status === 'amarelo' ? 60 
                   : okr.status === 'vermelho' ? 30 
                   : 0
        })) || [],
        okrsConcluidos: okrsData?.filter(okr => okr.status === 'verde').length || 0,
        okrsTotal: okrsData?.length || 0,
      },

      // PROBLEMAS E MELHORIAS
      problemasEMelhorias: visaoData?.map((v: any) => ({
        trimestre: v.trimestre || 'Anual',
        ano: v.ano,
        problemas: v.principais_problemas || [],
        metasDefinidas: {
          faturamento: v.faturamento_meta,
          clientes: v.meta_clientes_ativos,
          cmv: v.meta_cmv_limpo,
          cmo: v.meta_cmo,
          artistica: v.meta_artistica,
        },
        imagemObjetivo: v.imagem_1_ano || v.imagem_3_anos || null
      })) || [],

      // EVOLUÇÃO MENSAL
      evolucaoMensal: evolucaoCompleta,

      // TOP PRODUTOS
      topProdutos: topProdutos || [],

      // VENDAS POR CATEGORIA
      vendasPorCategoria: vendasCategoria || [],

      // VENDAS INDIVIDUAIS
      vendas,

      // INSIGHTS ESTRATÉGICOS COMPLETOS 360°
      insights: insightsData || {
        recordes: null,
        topClientesGasto: [],
        clientesMaisFieis: [],
        topEventos: [],
        performanceDiaSemana: [],
        topArtistas: [],
        topProdutos: [],
        topDrinks: [],
        topComidas: [],
        horariosPico: [],
        datasChave: [],
        tempoProducao: null,
        estatisticas: null,
      },

      // MEGA INSIGHTS 360° (25 categorias)
      megaInsights: megaInsightsData || null,

      // OPORTUNIDADES E AÇÕES ESTRATÉGICAS 2026
      oportunidades: oportunidadesData || null,

      // INSIGHTS ADICIONAIS (google, reservas, categorias, etc)
      insightsAdicionais: adicionaisData || null,

      // ULTRA INSIGHTS (24 categorias de análise avançada)
      ultraInsights: ultraInsightsData || null,

      // INSIGHTS EXTRAS (17 categorias: vendedores, dormentes, sazonalidade, etc)
      insightsExtras: extrasData || null,

      // METADADOS
      _meta: {
        ...dadosPrincipais._meta,
        tempoCarregamento: `${Date.now() - startTime}ms`,
        otimizado: true,
        versao: CACHE_VERSION, // v10 - Ultra Insights 24 categorias
      }
    }

    // Salvar no cache
    cache = {
      data: consolidado,
      timestamp: Date.now()
    }

    const tempoTotal = Date.now() - startTime
    console.log('🎉 Dados consolidados com sucesso!')
    console.log(`⏱️ Tempo de carregamento: ${tempoTotal}ms`)
    console.log(`💰 Faturamento Total: R$ ${consolidado.financeiro.faturamentoTotal?.toLocaleString('pt-BR')}`)
    console.log(`💵 Ticket Médio: R$ ${consolidado.financeiro.ticketMedio?.toFixed(2)}`)
    console.log(`📊 CMV: ${(consolidado.financeiro.cmvMedio * 100).toFixed(1)}%`)
    console.log(`📊 CMO: ${(consolidado.financeiro.cmoMedio * 100).toFixed(1)}%`)
    console.log(`🎨 Artística: ${(consolidado.financeiro.artisticaMedio * 100).toFixed(1)}%`)
    
    return NextResponse.json({ success: true, data: consolidado })
  } catch (error: any) {
    console.error('❌❌❌ ERRO CRÍTICO na retrospectiva:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido', stack: error.stack },
      { status: 500 }
    )
  }
}
