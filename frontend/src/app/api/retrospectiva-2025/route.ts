import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. DADOS FINANCEIROS CONSOLIDADOS 2025
    const { data: desempenhoData, error: desempenhoError } = await supabase
      .from('desempenho_semanal')
      .select('*')
      .gte('data_inicio', '2025-01-01')
      .lt('data_inicio', '2026-01-01')
      .order('data_inicio', { ascending: true })

    if (desempenhoError) throw desempenhoError

    // 2. DADOS ANALÍTICOS CONTAHUB (BEBIDAS VS COMIDA)
    const { data: analiticoData, error: analiticoError } = await supabase
      .from('contahub_analitico')
      .select('*')
      .gte('trn_dtgerencial', '2025-01-01')
      .lt('trn_dtgerencial', '2026-01-01')

    if (analiticoError) throw analiticoError

    // 3. METAS E VISÃO ESTRATÉGICA
    const { data: visaoData, error: visaoError } = await supabase
      .from('organizador_visao')
      .select('*')
      .eq('ano', 2025)
      .single()

    // 4. OKRs E CONQUISTAS
    // Primeiro buscar o organizador_id de 2025
    const { data: visao2025 } = await supabase
      .from('organizador_visao')
      .select('id')
      .eq('ano', 2025)
      .single()
    
    const { data: okrsData, error: okrsError } = visao2025 
      ? await supabase
          .from('organizador_okrs')
          .select('*')
          .eq('organizador_id', visao2025.id)
      : { data: null, error: null }

    // 5. NPS E FELICIDADE
    const { data: npsData, error: npsError } = await supabase
      .from('nps')
      .select('*')
      .gte('data_pesquisa', '2025-01-01')
      .lt('data_pesquisa', '2026-01-01')

    const { data: felicidadeData, error: felicidadeError } = await supabase
      .from('pesquisa_felicidade')
      .select('*')
      .gte('data_resposta', '2025-01-01')
      .lt('data_resposta', '2026-01-01')

    // 6. EVENTOS (SYMPLA + YUZER)
    const { data: symplaEventos, error: symplaError } = await supabase
      .from('sympla_eventos')
      .select('*')
      .gte('data_inicio', '2025-01-01')
      .lt('data_inicio', '2026-01-01')

    const { data: yuzerEventos, error: yuzerError } = await supabase
      .from('yuzer_eventos')
      .select('*')
      .gte('data_evento', '2025-01-01')
      .lt('data_evento', '2026-01-01')

    // 7. MARKETING E REDES SOCIAIS
    const { data: instagramData, error: instagramError } = await supabase
      .from('windsor_instagram_followers_daily')
      .select('*')
      .gte('date', '2025-01-01')
      .lt('date', '2026-01-01')
      .order('date', { ascending: true })

    // 8. VENDAS POR CATEGORIA - Usar agregação direto no Supabase
    // Buscar dados analíticos filtrados
    const { data: analiticoFiltrado } = await supabase
      .from('contahub_analitico')
      .select('loc_desc, grp_desc, qtd, valorfinal')
      .eq('bar_id', 3)
      .gte('trn_dtgerencial', '2025-01-01')
      .lt('trn_dtgerencial', '2026-01-01')
      .gt('qtd', 0)
      .not('grp_desc', 'in', '("Insumos","Mercadorias- Compras","Uso Interno")')

    // Categorizar no backend
    const vendasCategoria = (analiticoFiltrado || []).reduce((acc: any[], item: any) => {
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

    // CONSOLIDAÇÃO DOS DADOS
    const consolidado = {
      // FINANCEIRO
      financeiro: {
        faturamentoTotal: desempenhoData?.reduce((acc, curr) => acc + (curr.faturamento_total || 0), 0) || 0,
        faturamentoBebidas: analiticoData?.filter(p => p.categoria?.toLowerCase().includes('bebida')).reduce((acc, curr) => acc + (curr.venda_liquida || 0), 0) || 0,
        faturamentoComida: analiticoData?.filter(p => p.categoria?.toLowerCase().includes('comida') || p.categoria?.toLowerCase().includes('food')).reduce((acc, curr) => acc + (curr.venda_liquida || 0), 0) || 0,
        ticketMedio: desempenhoData && desempenhoData.length > 0 
          ? desempenhoData.reduce((acc, curr) => acc + (curr.ticket_medio || 0), 0) / desempenhoData.length 
          : 0,
        totalClientes: desempenhoData?.reduce((acc, curr) => acc + (curr.total_clientes || 0), 0) || 0,
        cmvMedio: desempenhoData && desempenhoData.length > 0
          ? desempenhoData.reduce((acc, curr) => acc + (curr.cmv_percentual || 0), 0) / desempenhoData.length
          : 0,
        cmoMedio: desempenhoData && desempenhoData.length > 0
          ? desempenhoData.reduce((acc, curr) => acc + (curr.cmo_percentual || 0), 0) / desempenhoData.length
          : 0,
      },

      // OPERACIONAL
      operacional: {
        totalSemanas: desempenhoData?.length || 0,
        totalEventos: (symplaEventos?.length || 0) + (yuzerEventos?.length || 0),
        ticketsVendidos: symplaEventos?.reduce((acc, curr) => acc + (curr.total_ingressos || 0), 0) || 0,
      },

      // PESSOAS E CULTURA
      pessoasCultura: {
        npsMedia: npsData && npsData.length > 0
          ? npsData.reduce((acc, curr) => acc + (curr.nota || 0), 0) / npsData.length
          : 0,
        felicidadeMedia: felicidadeData && felicidadeData.length > 0
          ? felicidadeData.reduce((acc, curr) => acc + (curr.nota || 0), 0) / felicidadeData.length
          : 0,
        totalRespostasNPS: npsData?.length || 0,
        totalRespostasFelicidade: felicidadeData?.length || 0,
      },

      // MARKETING
      marketing: {
        crescimentoInstagram: instagramData && instagramData.length > 1
          ? ((instagramData[instagramData.length - 1]?.followers || 0) - (instagramData[0]?.followers || 0))
          : 0,
        seguidoresInicio: instagramData?.[0]?.followers || 0,
        seguidoresFinal: instagramData?.[instagramData.length - 1]?.followers || 0,
      },

      // METAS E CONQUISTAS
      metas: {
        visaoGeral: visaoData || null,
        okrs: okrsData || [],
        okrsConcluidos: okrsData?.filter(okr => okr.progresso >= 100).length || 0,
        okrsTotal: okrsData?.length || 0,
      },

      // DADOS DETALHADOS POR MÊS
      evolucaoMensal: desempenhoData?.reduce((acc: any[], curr) => {
        const mes = new Date(curr.data_inicio).getMonth() + 1
        const existente = acc.find(item => item.mes === mes)
        
        if (existente) {
          existente.faturamento += curr.faturamento_total || 0
          existente.clientes += curr.total_clientes || 0
          existente.semanas += 1
        } else {
          acc.push({
            mes,
            mesNome: new Date(curr.data_inicio).toLocaleDateString('pt-BR', { month: 'long' }),
            faturamento: curr.faturamento_total || 0,
            clientes: curr.total_clientes || 0,
            semanas: 1,
          })
        }
        
        return acc
      }, []) || [],

      // TOP PRODUTOS
      topProdutos: analiticoData
        ?.reduce((acc: any[], curr) => {
          const existente = acc.find(p => p.nome === curr.nome_produto)
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

    return NextResponse.json({ success: true, data: consolidado })
  } catch (error: any) {
    console.error('Erro ao buscar dados da retrospectiva:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
