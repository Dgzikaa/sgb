import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// GET: Buscar DRE anual consolidada (incluindo lançamentos manuais e subcategorias) - FILTRADO POR BAR_ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('year') || '2025')
    const barId = searchParams.get('bar_id')

    console.log(`🔍 [DRE-YEARLY-CONSOLIDATED] Buscando DRE anual consolidada para ${ano}${barId ? ` - Bar ID: ${barId}` : ' - TODOS OS BARES'}`)

    // Data início e fim do ano
    const dataInicio = `${ano}-01-01`
    const dataFim = `${ano + 1}-01-01`

    // Query direta na tabela nibo_agendamentos FILTRANDO POR BAR_ID
    let niboQuery = supabase
      .from('nibo_agendamentos')
      .select(`
        valor,
        tipo,
        categoria_nome,
        data_competencia
      `)
      .gte('data_competencia', dataInicio)
      .lt('data_competencia', dataFim)
      .or('deletado.is.null,deletado.eq.false')

    // Filtrar por bar_id se fornecido
    if (barId) {
      niboQuery = niboQuery.eq('bar_id', parseInt(barId))
    }

    const { data: niboData, error: niboError } = await niboQuery

    if (niboError) {
      console.error('❌ [DRE-YEARLY-CONSOLIDATED] Erro ao buscar dados do Nibo:', niboError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do Nibo', details: niboError.message },
        { status: 500 }
      )
    }

    // Buscar mapeamento de categorias
    const { data: categoriasMapeamento } = await supabase
      .from('nibo_categorias')
      .select('categoria_nome, categoria_macro')

    const mapCategoria = new Map(
      categoriasMapeamento?.map(c => [c.categoria_nome, c.categoria_macro]) || []
    )

    // Criar dados detalhados a partir do nibo_agendamentos
    const dadosDetalhados = niboData?.map(item => ({
      categoria_macro: mapCategoria.get(item.categoria_nome) || 'Outras Despesas',
      categoria_nome: item.categoria_nome,
      valor: item.tipo === 'Debit' ? -Math.abs(parseFloat(item.valor) || 0) : parseFloat(item.valor) || 0
    })) || []

    console.log(`📊 [DRE-YEARLY-CONSOLIDATED] Dados do Nibo: ${niboData?.length || 0} registros`)

    // Mapear configuração de macro-categorias
    const MACRO_CATEGORIAS_MAP: Record<string, { tipo: string; icon: string; color: string }> = {
      'Receita': { tipo: 'entrada', icon: 'TrendingUp', color: 'green' },
      'Custos Variáveis': { tipo: 'saida', icon: 'TrendingDown', color: 'red' },
      'Custo insumos (CMV)': { tipo: 'saida', icon: 'ShoppingCart', color: 'orange' },
      'Mão-de-Obra': { tipo: 'saida', icon: 'Users', color: 'blue' },
      'Despesas Comerciais': { tipo: 'saida', icon: 'Building2', color: 'purple' },
      'Despesas Administrativas': { tipo: 'saida', icon: 'Wrench', color: 'indigo' },
      'Despesas Operacionais': { tipo: 'saida', icon: 'Activity', color: 'pink' },
      'Despesas de Ocupação (Contas)': { tipo: 'saida', icon: 'Home', color: 'gray' },
      'Não Operacionais': { tipo: 'entrada', icon: 'FileText', color: 'yellow' },
      'Investimentos': { tipo: 'saida', icon: 'Zap', color: 'cyan' },
      'Sócios': { tipo: 'saida', icon: 'Users', color: 'violet' },
      'Outras Despesas': { tipo: 'saida', icon: 'BarChart3', color: 'gray' }
    }

    // Agrupar por macro-categoria e consolidar subcategorias
    const macroMap = new Map<string, {
      nome: string;
      tipo: string;
      total_entradas: number;
      total_saidas: number;
      categorias: Array<{ nome: string; entradas: number; saidas: number }>;
    }>()

    // Processar cada linha dos dados detalhados
    dadosDetalhados?.forEach((item: any) => {
      const macroNome = item.categoria_macro || 'Outras Despesas'
      const catNome = item.categoria_nome || 'Outros'
      const valor = parseFloat(item.valor) || 0
      
      const config = MACRO_CATEGORIAS_MAP[macroNome] || { tipo: 'saida', icon: 'BarChart3', color: 'gray' }
      
      if (!macroMap.has(macroNome)) {
        macroMap.set(macroNome, {
          nome: macroNome,
          tipo: config.tipo,
          total_entradas: 0,
          total_saidas: 0,
          categorias: []
        })
      }
      
      const macro = macroMap.get(macroNome)!
      
      // Somar ao total da macro-categoria
      if (valor > 0) {
        macro.total_entradas += valor
      } else {
        macro.total_saidas += Math.abs(valor)
      }
      
      // Adicionar ou atualizar subcategoria
      let subcat = macro.categorias.find(c => c.nome === catNome)
      if (!subcat) {
        subcat = { nome: catNome, entradas: 0, saidas: 0 }
        macro.categorias.push(subcat)
      }
      
      if (valor > 0) {
        subcat.entradas += valor
      } else {
        subcat.saidas += Math.abs(valor)
      }
    })

    // Converter Map para array e ordenar subcategorias por valor
    const macroCategorias = Array.from(macroMap.values()).map(macro => ({
      ...macro,
      categorias: macro.categorias.sort((a, b) => {
        const valorA = macro.tipo === 'entrada' ? b.entradas - a.entradas : b.saidas - a.saidas
        return valorA
      })
    }))

    // Ordem específica das macro-categorias
    const ordemMacros = [
      'Receita', 'Custos Variáveis', 'Custo insumos (CMV)', 'Mão-de-Obra',
      'Despesas Comerciais', 'Despesas Administrativas', 'Despesas Operacionais',
      'Despesas de Ocupação (Contas)', 'Não Operacionais', 'Investimentos', 'Sócios', 'Outras Despesas'
    ]
    
    macroCategorias.sort((a, b) => {
      const indexA = ordemMacros.indexOf(a.nome)
      const indexB = ordemMacros.indexOf(b.nome)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })

    // Calcular totais (excluindo Investimentos e Sócios do EBITDA)
    const entradasTotais = macroCategorias
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.total_entradas, 0)

    const saidasTotais = macroCategorias
      .filter(m => m.tipo === 'saida' && m.nome !== 'Investimentos' && m.nome !== 'Sócios')
      .reduce((sum, m) => sum + m.total_saidas, 0)

    const saldo = entradasTotais - saidasTotais
    const ebitda = saldo

    // Totais de investimento e sócios
    const totalInvestimentos = macroCategorias.find(m => m.nome === 'Investimentos')?.total_saidas || 0
    const totalSocios = macroCategorias.find(m => m.nome === 'Sócios')?.total_saidas || 0

    // Buscar total de lançamentos manuais do ano
    const { data: totalManuais } = await supabase
      .from('dre_manual')
      .select('id')
      .gte('data_competencia', `${ano}-01-01`)
      .lt('data_competencia', `${ano + 1}-01-01`)

    const resultado = {
      macroCategorias,
      entradasTotais,
      saidasTotais,
      saldo,
      ebitda,
      year: ano,
      atividades: {
        operacional: {
          entradas: entradasTotais,
          saidas: saidasTotais,
          resultado: ebitda
        },
        investimento: {
          total: totalInvestimentos
        },
        financiamento: {
          total: totalSocios
        }
      },
      estatisticas: {
        total_categorias: macroCategorias.length,
        total_subcategorias: macroCategorias.reduce((sum, m) => sum + m.categorias.length, 0),
        total_lancamentos_manuais: totalManuais?.length || 0
      }
    }

    console.log(`✅ [DRE-YEARLY-CONSOLIDATED] DRE anual consolidada retornada:`, {
      ano,
      macroCategorias: resultado.macroCategorias.length,
      subcategorias: resultado.estatisticas.total_subcategorias,
      entradas: resultado.entradasTotais,
      saidas: resultado.saidasTotais,
      ebitda: resultado.ebitda
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ [DRE-YEARLY-CONSOLIDATED] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
