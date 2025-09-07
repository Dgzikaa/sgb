import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// GET: Buscar DRE anual consolidada (incluindo lançamentos manuais)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('year') || '2025')

    console.log(`🔍 [DRE-YEARLY-CONSOLIDATED] Buscando DRE anual consolidada para ${ano}`)

    // Buscar dados consolidados para todos os meses do ano
    const mesesPromises = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      return supabase.rpc('get_dre_consolidada', { 
        p_ano: ano, 
        p_mes: mes 
      })
    })

    const resultadosMeses = await Promise.all(mesesPromises)
    
    // Verificar erros
    const erros = resultadosMeses.filter(r => r.error)
    if (erros.length > 0) {
      console.error('❌ [DRE-YEARLY-CONSOLIDATED] Erros ao buscar dados:', erros)
      return NextResponse.json(
        { error: 'Erro ao buscar dados consolidados', details: erros },
        { status: 500 }
      )
    }

    // Consolidar dados de todos os meses
    const todosOsDados = resultadosMeses.flatMap(r => r.data || [])
    
    // Agrupar por categoria_dre e somar valores
    const categoriasConsolidadas = new Map()
    
    // Separar por atividade
    const operacionais = todosOsDados.filter(item => item.atividade === 'Operacional')
    const investimentos = todosOsDados.filter(item => item.atividade === 'Investimento')
    const financiamentos = todosOsDados.filter(item => item.atividade === 'Financiamento')

    // Processar apenas dados operacionais para o dashboard principal
    operacionais.forEach(item => {
      const categoria = item.categoria_dre
      if (!categoriasConsolidadas.has(categoria)) {
        categoriasConsolidadas.set(categoria, {
          nome: categoria,
          valor_automatico: 0,
          valor_manual: 0,
          valor_total: 0,
          origem: 'automatico',
          atividade: item.atividade
        })
      }
      
      const atual = categoriasConsolidadas.get(categoria)
      atual.valor_automatico += parseFloat(item.valor_automatico || '0')
      atual.valor_manual += parseFloat(item.valor_manual || '0')
      atual.valor_total += parseFloat(item.valor_total || '0')
      
      // Determinar origem
      if (atual.valor_manual !== 0 && atual.valor_automatico !== 0) {
        atual.origem = 'hibrido'
      } else if (atual.valor_manual !== 0) {
        atual.origem = 'manual'
      }
    })

    const categoriasArray = Array.from(categoriasConsolidadas.values())

    // Mapear para estrutura de macro-categorias
    const MACRO_CATEGORIAS_MAP = {
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
      'Sócios': { tipo: 'saida', icon: 'Users', color: 'violet' }
    }

    const macroCategorias = categoriasArray.map(cat => {
      const config = MACRO_CATEGORIAS_MAP[cat.nome] || { tipo: 'saida', icon: 'BarChart3', color: 'gray' }
      
      return {
        nome: cat.nome,
        tipo: config.tipo,
        total_entradas: config.tipo === 'entrada' ? Math.abs(cat.valor_total) : 0,
        total_saidas: config.tipo === 'saida' ? Math.abs(cat.valor_total) : 0,
        valor_automatico: cat.valor_automatico,
        valor_manual: cat.valor_manual,
        origem: cat.origem,
        categorias: [] // Será preenchido se necessário
      }
    })

    // Calcular totais
    const entradasTotais = macroCategorias
      .filter(macro => macro.tipo === 'entrada')
      .reduce((sum, macro) => sum + macro.total_entradas, 0)

    const saidasTotais = macroCategorias
      .filter(macro => macro.tipo === 'saida')
      .reduce((sum, macro) => sum + macro.total_saidas, 0)

    const saldo = entradasTotais - saidasTotais

    // Calcular totais de investimento e financiamento
    const totalInvestimentos = Math.abs(investimentos.reduce((sum, item) => sum + parseFloat(item.valor_total || '0'), 0))
    const totalFinanciamentos = Math.abs(financiamentos.reduce((sum, item) => sum + parseFloat(item.valor_total || '0'), 0))

    // Calcular EBITDA (apenas operacional)
    const ebitda = entradasTotais - saidasTotais

    // Buscar total de lançamentos manuais do ano
    const { data: totalManuais, error: manuaisError } = await supabase
      .from('dre_manual')
      .select('id')
      .gte('data_competencia', `${ano}-01-01`)
      .lt('data_competencia', `${ano + 1}-01-01`)

    const resultado = {
      macroCategorias,
      entradasTotais,
      saidasTotais: saidasTotais, // Apenas operacionais
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
          total: totalFinanciamentos
        }
      },
      estatisticas: {
        total_categorias: categoriasArray.length,
        categorias_com_manual: categoriasArray.filter(c => c.origem !== 'automatico').length,
        total_lancamentos_manuais: totalManuais?.length || 0
      }
    }

    console.log(`✅ [DRE-YEARLY-CONSOLIDATED] DRE anual consolidada retornada:`, {
      ano,
      categorias: resultado.macroCategorias.length,
      entradas: resultado.entradasTotais,
      saidas: resultado.saidasTotais,
      ebitda: resultado.ebitda,
      lancamentos_manuais: resultado.estatisticas.total_lancamentos_manuais
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
