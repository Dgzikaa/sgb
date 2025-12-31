import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Helper para buscar dados com paginação (corrigido)
    async function fetchAllData(table: string, filters: any = {}, orderBy?: string) {
      let allData: any[] = []
      let from = 0
      const limit = 1000
      const MAX_ITERATIONS = 100
      let iterations = 0

      while (iterations < MAX_ITERATIONS) {
        iterations++

        let query = supabase
          .from(table)
          .select('*')
          .range(from, from + limit - 1)

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (key.startsWith('gte_')) {
            query = query.gte(key.replace('gte_', ''), value)
          } else if (key.startsWith('lt_')) {
            query = query.lt(key.replace('lt_', ''), value)
          } else if (key.startsWith('lte_')) {
            query = query.lte(key.replace('lte_', ''), value)
          } else if (key.startsWith('eq_')) {
            query = query.eq(key.replace('eq_', ''), value)
          } else if (key.startsWith('not_null_')) {
            const col = key.replace('not_null_', '')
            query = query.not(col, 'is', null)
          } else if (key.startsWith('not_')) {
            const col = key.replace('not_', '')
            query = query.not(col, 'is', value)
          }
        })

        if (orderBy) {
          query = query.order(orderBy, { ascending: true })
        }

        const { data, error } = await query

        if (error) {
          console.error(`❌ Erro na paginação da tabela ${table}:`, error)
          throw error
        }

        if (!data || data.length === 0) {
          break
        }

        allData = [...allData, ...data]

        if (data.length < limit) {
          break
        }

        from += limit
      }

      console.log(`✅ ${table}: ${allData.length} registros buscados`)
      return allData
    }

    console.log('🔍 Iniciando busca de dados da retrospectiva 2025...')

    // 1. DADOS FINANCEIROS CONSOLIDADOS 2025 (com paginação)
    console.log('📈 Buscando desempenho semanal...')
    const desempenhoData = await fetchAllData('desempenho_semanal', {
      gte_data_inicio: '2025-01-01',
      lte_data_inicio: '2025-12-31'
    }, 'data_inicio')
    console.log(`✅ Desempenho: ${desempenhoData.length} semanas`)

    // 2. CLIENTES ATIVOS 2025 - Usar RPC para calcular
    let clientesAtivosMedia = 0
    let recorrenciaMedia = 0
    
    try {
      console.log('👥 Calculando clientes ativos...')
      
      // Usar SQL direto para evitar ambiguidade de tipos (date vs text)
      const { data: baseAtivaResult, error: baseAtivaError } = await supabase
        .from('contahub_analitico')
        .select('*', { count: 'exact', head: true })
      
      // Calcular clientes ativos usando SQL direto para evitar conflito de tipos
      const { data: countResult, error: countError } = await supabase.rpc('get_count_base_ativa', {
        p_bar_id: 3,
        p_data_inicio: new Date('2025-10-02'),
        p_data_fim: new Date('2025-12-31')
      })
      
      if (countError) {
        // Fallback: usar dados do desempenho_semanal (pegar o último valor válido)
        console.log('⚠️ RPC falhou, usando dados do desempenho_semanal...')
        const clientesAtivosValidos = desempenhoData
          ?.filter((d: any) => d.clientes_ativos && d.clientes_ativos > 0)
          ?.sort((a: any, b: any) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime())
        
        if (clientesAtivosValidos && clientesAtivosValidos.length > 0) {
          clientesAtivosMedia = clientesAtivosValidos[0].clientes_ativos
        }
      } else if (countResult !== null) {
        clientesAtivosMedia = typeof countResult === 'number' ? countResult : Number(countResult)
      }
      console.log(`✅ Clientes ativos: ${clientesAtivosMedia}`)

      // Calcular recorrência usando dados do desempenho_semanal
      console.log('🔄 Calculando recorrência...')
      
      // Usar os dados já disponíveis de desempenho_semanal
      if (desempenhoData && desempenhoData.length > 0) {
        const totalNovos = desempenhoData.reduce((acc: number, curr: any) => {
          const percNovos = curr.perc_clientes_novos || 0
          const clientes = curr.clientes_atendidos || 0
          return acc + (clientes * percNovos / 100)
        }, 0)
        
        const totalClientes = desempenhoData.reduce((acc: number, curr: any) => 
          acc + (curr.clientes_atendidos || 0), 0)
        
        if (totalClientes > 0) {
          const percNovos = totalNovos / totalClientes
          recorrenciaMedia = 1 - percNovos // Recorrência = 1 - % de novos
          console.log(`✅ Recorrência: ${(recorrenciaMedia * 100).toFixed(1)}%`)
        }
      }
      
    } catch (error) {
      console.error('⚠️ Erro ao calcular clientes ativos:', error)
    }

    // 3. DADOS ANALÍTICOS CONTAHUB (com paginação)
    console.log('💰 Buscando dados analíticos...')
    const analiticoData = await fetchAllData('contahub_analitico', {
      eq_bar_id: 3,
      gte_trn_dtgerencial: '2025-01-01',
      lte_trn_dtgerencial: '2025-12-31'
    })
    console.log(`✅ Analítico: ${analiticoData.length} transações`)

    // 4. METAS E VISÃO ESTRATÉGICA - Buscar TODOS os organizadores de 2025
    console.log('🎯 Buscando visão estratégica...')
    const { data: visaoData, error: visaoError } = await supabase
      .from('organizador_visao')
      .select('*')
      .eq('ano', 2025)
      .order('trimestre', { ascending: true, nullsFirst: true })
    
    if (visaoError) {
      console.error('❌ Erro ao buscar visão:', visaoError)
    } else {
      console.log(`✅ Visão: ${visaoData?.length || 0} registros`)
    }
    
    // Pegar a visão anual (sem trimestre) como principal
    const visaoAnual = visaoData?.find(v => !v.trimestre) || visaoData?.[0] || null

    // 5. OKRs E CONQUISTAS - Buscar OKRs de TODOS os organizadores de 2025
    console.log('🎯 Buscando OKRs...')
    const organizadorIds = visaoData?.map(v => v.id) || []
    
    const { data: okrsData, error: okrsError } = organizadorIds.length > 0
      ? await supabase
          .from('organizador_okrs')
          .select('*')
          .in('organizador_id', organizadorIds)
          .order('ordem', { ascending: true })
      : { data: null, error: null }
    
    if (okrsError) {
      console.error('❌ Erro ao buscar OKRs:', okrsError)
    } else {
      console.log(`✅ OKRs: ${okrsData?.length || 0} registros`)
    }

    // 6. NPS E FELICIDADE (com paginação)
    console.log('😊 Buscando NPS e Felicidade...')
    const npsData = await fetchAllData('nps', {
      gte_data_pesquisa: '2025-01-01',
      lte_data_pesquisa: '2025-12-31'
    })

    const felicidadeData = await fetchAllData('pesquisa_felicidade', {
      gte_data_pesquisa: '2025-01-01',
      lte_data_pesquisa: '2025-12-31'
    })

    // 7. EVENTOS (com paginação)
    console.log('🎉 Buscando eventos...')
    const symplaEventos = await fetchAllData('sympla_eventos', {
      gte_data_inicio: '2025-01-01',
      lte_data_inicio: '2025-12-31'
    })

    const yuzerEventos = await fetchAllData('yuzer_eventos', {
      gte_data_inicio: '2025-01-01',
      lte_data_inicio: '2025-12-31'
    })

    // 8. MARKETING E REDES SOCIAIS (com paginação)
    console.log('📱 Buscando dados do Instagram...')
    const instagramData = await fetchAllData('windsor_instagram_followers_daily', {
      gte_date: '2025-01-01',
      lte_date: '2025-12-31'
    }, 'date')

    // 9. VENDAS POR CATEGORIA (usar dados já buscados acima)
    // Filtrar por qtd > 0 e grupos válidos localmente
    const analiticoFiltradoValido = analiticoData.filter((item: any) => 
      item.qtd > 0 && 
      !['Insumos', 'Mercadorias- Compras', 'Uso Interno'].includes(item.grp_desc)
    )

    // Categorizar no backend
    const vendasCategoria = (analiticoFiltradoValido || []).reduce((acc: any[], item: any) => {
      let categoria = 'OUTROS'
      
      // CERVEJAS
      if ((item.loc_desc === 'Chopp' || item.loc_desc === 'Baldes') && 
          ['Cervejas', 'Baldes', 'Happy Hour'].includes(item.grp_desc)) {
        categoria = 'CERVEJAS'
      } else if (item.loc_desc === 'Bar' && ['Cervejas', 'Baldes'].includes(item.grp_desc)) {
        categoria = 'CERVEJAS'
      }
      // NÃO ALCOÓLICOS
      else if (item.loc_desc === 'Bar' && item.grp_desc === 'Bebidas Não Alcoólicas') {
        categoria = 'NÃO ALCOÓLICOS'
      } else if (item.grp_desc === 'Drinks sem Álcool') {
        categoria = 'NÃO ALCOÓLICOS'
      }
      // DRINKS
      else if (['Montados', 'Batidos', 'Preshh', 'Mexido', 'Shot e Dose'].includes(item.loc_desc)) {
        categoria = 'DRINKS'
      } else if (item.loc_desc === 'Bar' && [
        'Drinks Autorais', 'Drinks Classicos', 'Drinks Clássicos', 'Drinks Prontos',
        'Dose Dupla', 'Doses', 'Combos', 'Vinhos', 'Bebidas Prontas', 'Happy Hour', 'Fest Moscow'
      ].includes(item.grp_desc)) {
        categoria = 'DRINKS'
      }
      // COMIDAS
      else if (['Cozinha 1', 'Cozinha 2'].includes(item.loc_desc)) {
        categoria = 'COMIDAS'
      }
      
      // Agregar por categoria
      const existing = acc.find((c: any) => c.categoria === categoria)
      if (existing) {
        existing.quantidade_total += parseFloat(item.qtd || 0)
        existing.faturamento_total += parseFloat(item.valorfinal || 0)
        existing.num_vendas += 1
      } else {
        acc.push({
          categoria,
          quantidade_total: parseFloat(item.qtd || 0),
          faturamento_total: parseFloat(item.valorfinal || 0),
          num_vendas: 1
        })
      }
      
      return acc
    }, []).filter((c: any) => ['DRINKS', 'CERVEJAS', 'COMIDAS', 'NÃO ALCOÓLICOS'].includes(c.categoria))
      .sort((a: any, b: any) => b.quantidade_total - a.quantidade_total)

    console.log('📊 Calculando indicadores avançados...')

    // Calcular totais para percentuais corretos
    const faturamentoTotal = desempenhoData?.reduce((acc: number, curr: any) => acc + (curr.faturamento_total || 0), 0) || 0
    const cmoTotal = desempenhoData?.reduce((acc: number, curr: any) => acc + (curr.cmo || 0), 0) || 0
    const cmvLimpoTotal = desempenhoData?.reduce((acc: number, curr: any) => acc + (curr.cmv_limpo || 0), 0) || 0
    const artisticaTotal = desempenhoData?.reduce((acc: number, curr: any) => acc + (curr.custo_atracao_faturamento || 0), 0) || 0

    // CMO como percentual do faturamento
    const cmoMedio = faturamentoTotal > 0 ? cmoTotal / faturamentoTotal : 0

    // % Artística como percentual do faturamento
    const percentualArtisticaMedio = faturamentoTotal > 0 ? artisticaTotal / faturamentoTotal : 0

    // CMV Limpo como percentual do faturamento
    const cmvLimpoMedio = faturamentoTotal > 0 ? cmvLimpoTotal / faturamentoTotal : 0

    // CONSOLIDAÇÃO DOS DADOS
    const consolidado = {
      // FINANCEIRO
      financeiro: {
        faturamentoTotal: faturamentoTotal,
        faturamentoBebidas: analiticoData?.filter((p: any) => p.categoria?.toLowerCase().includes('bebida')).reduce((acc: number, curr: any) => acc + (curr.venda_liquida || 0), 0) || 0,
        faturamentoComida: analiticoData?.filter((p: any) => p.categoria?.toLowerCase().includes('comida') || p.categoria?.toLowerCase().includes('food')).reduce((acc: number, curr: any) => acc + (curr.venda_liquida || 0), 0) || 0,
        ticketMedio: desempenhoData && desempenhoData.length > 0 
          ? desempenhoData.reduce((acc: number, curr: any) => acc + (curr.ticket_medio || 0), 0) / desempenhoData.length 
          : 0,
        clientesAtivos: Math.round(clientesAtivosMedia),
        totalClientes: desempenhoData?.reduce((acc: number, curr: any) => acc + (curr.clientes_atendidos || 0), 0) || 0,
        recorrenciaMedia: recorrenciaMedia,
        cmvLimpoMedio: cmvLimpoMedio,
        cmoMedio: cmoMedio,
        percentualArtisticaMedio: percentualArtisticaMedio,
      },

      // OPERACIONAL
      operacional: {
        totalSemanas: desempenhoData?.length || 0,
        totalEventos: (symplaEventos?.length || 0) + (yuzerEventos?.length || 0),
        ticketsVendidos: symplaEventos?.reduce((acc: number, curr: any) => acc + (curr.total_ingressos || 0), 0) || 0,
      },

      // PROBLEMAS E MELHORIAS (baseado nos trimestres)
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

      // PESSOAS E CULTURA
      pessoasCultura: {
        npsMedia: npsData && npsData.length > 0
          ? npsData.reduce((acc: number, curr: any) => acc + (curr.nps_geral || 0), 0) / npsData.length
          : 0,
        felicidadeMedia: felicidadeData && felicidadeData.length > 0
          ? felicidadeData.reduce((acc: number, curr: any) => acc + (curr.media_geral || 0), 0) / felicidadeData.length
          : 0,
        totalRespostasNPS: npsData?.length || 0,
        totalRespostasFelicidade: felicidadeData?.length || 0,
      },

      // MARKETING
      // Pegar o primeiro e último registros válidos (com followers > 0)
      marketing: (() => {
        const validInstagramData = (instagramData || []).filter((d: any) => d.follower_count_1d > 0)
        const primeiro = validInstagramData[0]?.follower_count_1d || 0
        const ultimo = validInstagramData[validInstagramData.length - 1]?.follower_count_1d || primeiro
        return {
          crescimentoInstagram: ultimo - primeiro,
          seguidoresInicio: primeiro,
          seguidoresFinal: ultimo,
        }
      })(),

      // METAS E CONQUISTAS
      metas: {
        visaoGeral: visaoAnual,
        visaoCompleta: visaoData || [],
        okrs: okrsData?.map(okr => ({
          ...okr,
          // Mapear status para progresso %
          progresso: okr.status === 'verde' ? 100 
                   : okr.status === 'amarelo' ? 60 
                   : okr.status === 'vermelho' ? 30 
                   : 0
        })) || [],
        okrsConcluidos: okrsData?.filter(okr => okr.status === 'verde').length || 0,
        okrsTotal: okrsData?.length || 0,
      },

      // DADOS DETALHADOS POR MÊS
      evolucaoMensal: desempenhoData?.reduce((acc: any[], curr: any) => {
        const mes = new Date(curr.data_inicio).getMonth() + 1
        const existente = acc.find(item => item.mes === mes)
        
        if (existente) {
          existente.faturamento += curr.faturamento_total || 0
          existente.clientes += curr.clientes_atendidos || 0
          existente.semanas += 1
        } else {
          acc.push({
            mes,
            mesNome: new Date(curr.data_inicio).toLocaleDateString('pt-BR', { month: 'long' }),
            faturamento: curr.faturamento_total || 0,
            clientes: curr.clientes_atendidos || 0,
            semanas: 1,
          })
        }
        
        return acc
      }, []) || [],

      // TOP PRODUTOS
      topProdutos: analiticoData
        ?.reduce((acc: any[], curr: any) => {
          const existente = acc.find((p: any) => p.nome === curr.nome_produto)
          if (existente) {
            existente.vendaLiquida += curr.venda_liquida || 0
            existente.quantidade += curr.quantidade || 0
          } else {
            acc.push({
              nome: curr.nome_produto,
              vendaLiquida: curr.venda_liquida || 0,
              quantidade: curr.quantidade || 0,
              categoria: curr.categoria,
            })
          }
          return acc
        }, [])
        .sort((a: any, b: any) => b.vendaLiquida - a.vendaLiquida)
        .slice(0, 10) || [],

      // VENDAS POR CATEGORIA
      vendasPorCategoria: vendasCategoria || [],
      
      // VENDAS INDIVIDUAIS (para cards)
      vendas: {
        cervejas: vendasCategoria?.find((v: any) => v.categoria === 'CERVEJAS')?.quantidade_total || 0,
        faturamentoCervejas: vendasCategoria?.find((v: any) => v.categoria === 'CERVEJAS')?.faturamento_total || 0,
        drinks: vendasCategoria?.find((v: any) => v.categoria === 'DRINKS')?.quantidade_total || 0,
        faturamentoDrinks: vendasCategoria?.find((v: any) => v.categoria === 'DRINKS')?.faturamento_total || 0,
        naoAlcoolicos: vendasCategoria?.find((v: any) => v.categoria === 'NÃO ALCOÓLICOS')?.quantidade_total || 0,
        faturamentoNaoAlcoolicos: vendasCategoria?.find((v: any) => v.categoria === 'NÃO ALCOÓLICOS')?.faturamento_total || 0,
        comidas: vendasCategoria?.find((v: any) => v.categoria === 'COMIDAS')?.quantidade_total || 0,
        faturamentoComidas: vendasCategoria?.find((v: any) => v.categoria === 'COMIDAS')?.faturamento_total || 0,
      },
    }

    console.log('🎉 Dados consolidados com sucesso!')
    console.log(`💰 Faturamento Total: R$ ${consolidado.financeiro.faturamentoTotal.toLocaleString('pt-BR')}`)
    console.log(`👥 Total Clientes: ${consolidado.financeiro.totalClientes}`)
    console.log(`🎯 Clientes Ativos: ${consolidado.financeiro.clientesAtivos}`)
    console.log(`🔄 Recorrência: ${(consolidado.financeiro.recorrenciaMedia * 100).toFixed(1)}%`)
    
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
