import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// FunÃ¡Â§Ã¡Â£o para buscar todos os dados com paginaÃ¡Â§Ã¡Â£o
async function buscarTodosEventosFinanceiros(supabase: any, barId: number) {
  const todosEventos: any[] = []
  let pagina = 0
  const LIMITE_POR_PAGINA = 1000

  while (true) {
    console.log(`Ã°Å¸â€â€ž Buscando pÃ¡Â¡gina ${pagina + 1} dos eventos financeiros...`)
    
    const { data: eventosPagina, error } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('tipo, valor, categoria_id, evento_id, descricao, data_competencia, status')
      .eq('bar_id', barId)
      .gte('data_competencia', '2025-01-01')
      .lte('data_competencia', '2025-12-31')
      .not('categoria_id', 'is', null)
      .order('data_competencia', { ascending: false })
      .range(pagina * LIMITE_POR_PAGINA, (pagina + 1) * LIMITE_POR_PAGINA - 1)

    if (error) {
      console.error(`ÂÅ’ Erro na pÃ¡Â¡gina ${pagina + 1}:`, error)
      throw error
    }

    if (!eventosPagina || eventosPagina.length === 0) {
      console.log(`Å“â€¦ Busca finalizada. Total de eventos: ${todosEventos.length}`)
      break
    }

    todosEventos.push(...eventosPagina)
    console.log(`Ã°Å¸â€œâ€ž PÃ¡Â¡gina ${pagina + 1}: ${eventosPagina.length} eventos (Total acumulado: ${todosEventos.length})`)

    // Se a pÃ¡Â¡gina retornou menos que o limite, Ã¡Â© a Ã¡Âºltima pÃ¡Â¡gina
    if (eventosPagina.length < LIMITE_POR_PAGINA) {
      console.log(`Å“â€¦ Ã¡Å¡ltima pÃ¡Â¡gina atingida. Total final: ${todosEventos.length} eventos`)
      break
    }

    pagina++
  }

  return todosEventos
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    console.log(`Ã°Å¸â€™Â° BUSCANDO DADOS FINANCEIROS PARA BAR ${barId} - 2025 (COM PAGINAÃ¡â€¡Ã¡Æ’O)`)

    // 1. BUSCAR TODOS OS EVENTOS COM PAGINAÃ¡â€¡Ã¡Æ’O
    const todosEventos = await buscarTodosEventosFinanceiros(supabase, parseInt(barId))

    // 2. BUSCAR CATEGORIAS
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contaazul_categorias')
      .select('id, nome, tipo')
      .eq('bar_id', parseInt(barId))

    if (errorCategorias) {
      console.error('ÂÅ’ Erro ao buscar categorias:', errorCategorias)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // 3. CALCULAR TOTAIS
    const totalReceitas = todosEventos.filter((e: any) => e.tipo === 'receita').reduce((sum: number, e: any) => sum + (parseFloat(e.valor) || 0), 0)
    const totalDespesas = todosEventos.filter((e: any) => e.tipo === 'despesa').reduce((sum: number, e: any) => sum + (parseFloat(e.valor) || 0), 0)
    const saldoLiquido = totalReceitas - totalDespesas

    // 4. MAPEAR CATEGORIAS
    const mapaCategorias = categorias?.reduce((acc: any, categoria: any) => {
      acc[categoria.id] = categoria
      return acc
    }, {}) || {}

    // 5. AGRUPAR EVENTOS POR CATEGORIA
    const receitasAgrupadas: any = {}
    const despesasAgrupadas: any = {}

    todosEventos.forEach((evento: any) => {
      const categoria = (mapaCategorias as any)[evento.categoria_id]
      if (!categoria) return

      const valor = parseFloat(evento.valor) || 0
      const categoriaNome = categoria.nome

      if (evento.tipo === 'receita') {
        if (!receitasAgrupadas[categoriaNome]) {
          receitasAgrupadas[categoriaNome] = {
            categoria: categoriaNome,
            total: 0,
            tipo: categoria.tipo
          }
        }
        receitasAgrupadas[categoriaNome].total += valor
      } else if (evento.tipo === 'despesa') {
        if (!despesasAgrupadas[categoriaNome]) {
          despesasAgrupadas[categoriaNome] = {
            categoria: categoriaNome,
            total: 0,
            tipo: categoria.tipo
          }
        }
        despesasAgrupadas[categoriaNome].total += valor
      }
    })

    // 6. TRANSFORMAR EM ARRAYS E ORDENAR
    const topReceitas = Object.values(receitasAgrupadas)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)

    const topDespesas = Object.values(despesasAgrupadas)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)

    // 7. TRANSAÃ¡â€¡Ã¡â€¢ES RECENTES (primeiras 20)
    const transacoesRecentes = todosEventos.slice(0, 20).map((evento: any) => {
      const categoria = (mapaCategorias as any)[evento.categoria_id]
      return {
        id: evento.evento_id,
        tipo: evento.tipo,
        descricao: evento.descricao || 'Sem descriÃ¡Â§Ã¡Â£o',
        valor: parseFloat(evento.valor) || 0,
        data: evento.data_competencia,
        status: evento.status || 'N/A',
        categoria: categoria?.nome || 'Sem categoria'
      }
    })

    const resultado = {
      timestamp: new Date().toISOString(),
      barId: parseInt(barId),
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo_liquido: saldoLiquido,
        total_transacoes: todosEventos.length
      },
      receitas_por_categoria: topReceitas,
      despesas_por_categoria: topDespesas,
      transacoes_recentes: transacoesRecentes,
      estatisticas: {
        categorias_com_receitas: Object.keys(receitasAgrupadas).length,
        categorias_com_despesas: Object.keys(despesasAgrupadas).length,
        receitas_categorizadas: todosEventos.filter((e) => e.tipo === 'receita').length,
        despesas_categorizadas: todosEventos.filter((e) => e.tipo === 'despesa').length
      }
    }

    console.log(`Ã°Å¸â€™Â° Dados financeiros carregados (TODOS OS DADOS):`)
    console.log(`   Ã°Å¸â€œÅ  Total de eventos processados: ${todosEventos.length}`)
    console.log(`   Ã°Å¸â€œË† Receitas: R$ ${totalReceitas.toFixed(2)}`)
    console.log(`   Ã°Å¸â€œâ€° Despesas: R$ ${totalDespesas.toFixed(2)}`)
    console.log(`   Ã°Å¸â€™Â° Saldo: R$ ${saldoLiquido.toFixed(2)}`)

    return NextResponse.json(resultado)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('ÂÅ’ Erro ao buscar dados financeiros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados financeiros: ' + errorMessage },
      { status: 500 }
    )
  }
} 

