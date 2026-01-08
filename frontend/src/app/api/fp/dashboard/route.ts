import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes') || new Date().toISOString().slice(0, 7) // YYYY-MM
    const ano = searchParams.get('ano') || new Date().getFullYear().toString()

    // Buscar CPF do usuário
    const { data: userData } = await supabase
      .from('usuarios')
      .select('cpf')
      .eq('id', session.user.id)
      .single()

    if (!userData?.cpf) {
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 })
    }

    // Buscar todas as contas
    const { data: contas } = await supabase
      .from('fp_contas')
      .select('id, nome, banco, saldo_atual, tipo')
      .eq('usuario_cpf', userData.cpf)
      .eq('ativa', true)

    const saldoTotal = contas?.reduce((acc, c) => acc + parseFloat(c.saldo_atual || 0), 0) || 0

    // Buscar transações do mês
    const inicioMes = `${mes}-01`
    const fimMes = `${mes}-31`

    const { data: transacoes } = await supabase
      .from('fp_transacoes')
      .select(`
        *,
        categoria:fp_categorias(nome, cor, icone)
      `)
      .eq('usuario_cpf', userData.cpf)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .eq('status', 'confirmada')

    // Calcular receitas e despesas do mês
    const receitas = transacoes?.filter(t => t.tipo === 'receita') || []
    const despesas = transacoes?.filter(t => t.tipo === 'despesa') || []

    const totalReceitas = receitas.reduce((acc, t) => acc + parseFloat(t.valor), 0)
    const totalDespesas = despesas.reduce((acc, t) => acc + parseFloat(t.valor), 0)
    const saldo = totalReceitas - totalDespesas

    // Agrupar despesas por categoria
    const despesasPorCategoria: { [key: string]: { nome: string; total: number; cor: string; icone: string } } = {}
    
    despesas.forEach(d => {
      const categoriaNome = d.categoria?.nome || 'Sem Categoria'
      const categoriaCor = d.categoria?.cor || '#6B7280'
      const categoriaIcone = d.categoria?.icone || 'tag'
      
      if (!despesasPorCategoria[categoriaNome]) {
        despesasPorCategoria[categoriaNome] = {
          nome: categoriaNome,
          total: 0,
          cor: categoriaCor,
          icone: categoriaIcone
        }
      }
      despesasPorCategoria[categoriaNome].total += parseFloat(d.valor)
    })

    const topCategorias = Object.values(despesasPorCategoria)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Buscar transações do ano para gráfico mensal
    const inicioAno = `${ano}-01-01`
    const fimAno = `${ano}-12-31`

    const { data: transacoesAno } = await supabase
      .from('fp_transacoes')
      .select('tipo, valor, data')
      .eq('usuario_cpf', userData.cpf)
      .gte('data', inicioAno)
      .lte('data', fimAno)
      .eq('status', 'confirmada')

    // Agrupar por mês
    const mesesDoAno = Array.from({ length: 12 }, (_, i) => {
      const mesNum = (i + 1).toString().padStart(2, '0')
      return {
        mes: mesNum,
        nome: new Date(parseInt(ano), i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: 0,
        despesas: 0
      }
    })

    transacoesAno?.forEach(t => {
      const mesIndex = parseInt(t.data.slice(5, 7)) - 1
      if (mesIndex >= 0 && mesIndex < 12) {
        if (t.tipo === 'receita') {
          mesesDoAno[mesIndex].receitas += parseFloat(t.valor)
        } else if (t.tipo === 'despesa') {
          mesesDoAno[mesIndex].despesas += parseFloat(t.valor)
        }
      }
    })

    // Transações recentes (últimas 10)
    const { data: transacoesRecentes } = await supabase
      .from('fp_transacoes')
      .select(`
        *,
        conta:fp_contas(nome, banco),
        categoria:fp_categorias(nome, cor, icone)
      `)
      .eq('usuario_cpf', userData.cpf)
      .order('data', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        resumo: {
          saldoTotal,
          totalReceitas,
          totalDespesas,
          saldo,
          mes,
          ano
        },
        contas: contas || [],
        topCategorias,
        graficoMensal: mesesDoAno,
        transacoesRecentes: transacoesRecentes || []
      }
    })
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
