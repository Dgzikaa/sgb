import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')
    const bar_id = searchParams.get('bar_id')

    if (!data_inicio || !data_fim || !bar_id) {
      return NextResponse.json(
        { success: false, error: 'Par·¢metros obrigat·≥rios: data_inicio, data_fim, bar_id' },
        { status: 400 }
      )
    }

    console.log('üçï API Produtos Per·≠odo - Par·¢metros recebidos:', {
      data_inicio,
      data_fim,
      bar_id
    })

    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.error('ùå Erro ao conectar com banco')
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    // Gerar array de datas do per·≠odo
    const inicioData = new Date(data_inicio + 'T00:00:00')
    const fimData = new Date(data_fim + 'T00:00:00')
    const diasPeriodo: string[] = []
    
    for (let d = new Date(inicioData); d <= fimData; d.setDate(d.getDate() + 1)) {
      diasPeriodo.push(d.toISOString().split('T')[0])
    }

    console.log('üìÖ Dias do per·≠odo:', diasPeriodo.join(', '))

    try {
      const produtosPorDia: { [key: string]: any } = {}

      // Inicializar estrutura para cada dia
      diasPeriodo.forEach(dia => {
        produtosPorDia[dia] = {
          contahub: [],
          yuzer: []
        }
      })

      // Buscar produtos da tabela analitico (ContaHub)
      console.log('üîç Buscando produtos ContaHub...')
      const { data: contahubData, error: contahubError } = await supabase
        .from('analitico')
        .select('vd_dtgerencial, prd_desc, qtd, valorfinal')
        .eq('bar_id', parseInt(bar_id))
        .gte('vd_dtgerencial', data_inicio)
        .lte('vd_dtgerencial', data_fim)
        .not('prd_desc', 'is', null)
        .gt('qtd', 0)

      if (contahubError) {
        console.error('ùå Erro ao buscar produtos ContaHub:', contahubError)
      } else if (contahubData && contahubData.length > 0) {
        console.log(`üìä Produtos ContaHub encontrados: ${contahubData.length}`)
        
        // Agrupar produtos ContaHub por dia
        contahubData.forEach((item) => {
          const dia = item.vd_dtgerencial
          if (produtosPorDia[dia]) {
            // Verificar se o produto j·° existe para este dia
            const produtoExistente = produtosPorDia[dia].contahub.find(
              (p) => p.produto === item.prd_desc
            )
            
            if (produtoExistente) {
              produtoExistente.quantidade += parseInt(item.qtd || '0')
              produtoExistente.valor += parseFloat(item.valorfinal || '0')
            } else {
              produtosPorDia[dia].contahub.push({
                produto: item.prd_desc,
                quantidade: parseInt(item.qtd || '0'),
                valor: parseFloat(item.valorfinal || '0')
              })
            }
          }
        })
      }

      // Buscar produtos da tabela yuzer_analitico (se existir)
      console.log('üîç Buscando produtos Yuzer...')
      const { data: yuzerData, error: yuzerError } = await supabase
        .from('yuzer_analitico')
        .select('dt_gerencial, produto, quantidade, valor_unitario, valor_total')
        .eq('bar_id', parseInt(bar_id))
        .gte('dt_gerencial', data_inicio)
        .lte('dt_gerencial', data_fim)
        .not('produto', 'is', null)
        .gt('quantidade', 0)

      if (yuzerError) {
        console.log('ö†Ô∏è Tabela yuzer_analitico n·£o encontrada ou sem dados:', yuzerError.message)
      } else if (yuzerData && yuzerData.length > 0) {
        console.log(`üìä Produtos Yuzer encontrados: ${yuzerData.length}`)
        
        // Agrupar produtos Yuzer por dia
        yuzerData.forEach((item) => {
          const dia = item.dt_gerencial
          if (produtosPorDia[dia]) {
            // Verificar se o produto j·° existe para este dia
            const produtoExistente = produtosPorDia[dia].yuzer.find(
              (p) => p.produto === item.produto
            )
            
            if (produtoExistente) {
              produtoExistente.quantidade += parseInt(item.quantidade || '0')
              produtoExistente.valor += parseFloat(item.valor_total || '0')
            } else {
              produtosPorDia[dia].yuzer.push({
                produto: item.produto,
                quantidade: parseInt(item.quantidade || '0'),
                valor: parseFloat(item.valor_total || '0')
              })
            }
          }
        })
      }

      // Ordenar produtos por quantidade em cada dia
      Object.keys(produtosPorDia).forEach(dia => {
        produtosPorDia[dia].contahub.sort((a, b) => b.quantidade - a.quantidade)
        produtosPorDia[dia].yuzer.sort((a, b) => b.quantidade - a.quantidade)
      })

      // Log resumo
      const totalDias = Object.keys(produtosPorDia).length
      const diasComDados = Object.keys(produtosPorDia).filter((dia) => 
        produtosPorDia[dia].contahub.length > 0 || produtosPorDia[dia].yuzer.length > 0
      ).length

      console.log('üìä Resumo dos produtos por per·≠odo:', {
        total_dias: totalDias,
        dias_com_dados: diasComDados,
        primeiro_dia_com_dados: diasComDados > 0 ? Object.keys(produtosPorDia).find((dia) => 
          produtosPorDia[dia].contahub.length > 0 || produtosPorDia[dia].yuzer.length > 0
        ) : null
      })

      return NextResponse.json({
        success: true,
        produtos: produtosPorDia,
        meta: {
          periodo: `${data_inicio} a ${data_fim}`,
          bar_id: parseInt(bar_id),
          total_dias: totalDias,
          dias_com_dados: diasComDados,
          fontes: ['analitico (ContaHub)', 'yuzer_analitico (Yuzer)']
        }
      })

    } catch (dbError) {
      console.error('ùå Erro ao buscar produtos do banco:', dbError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produtos: ' + (dbError as Error).message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('ùå Erro na API Produtos Per·≠odo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 
