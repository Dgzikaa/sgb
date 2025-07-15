import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getAdminClient()
    
    // Buscar receitas pendentes específicas
    const { data: receitasPendentes, error: receitasError } = await supabase
      .from('receitas')
      .select('id, nome, status, tempo_preparo, dificuldade, ingredientes_faltando')
      .eq('bar_id', bar_id)
      .in('status', ['pendente', 'preparando', 'ingredientes_faltando'])

    if (receitasError) {
      console.error('Erro ao buscar receitas pendentes:', receitasError)
      return NextResponse.json({ 
        error: 'Erro ao buscar receitas pendentes',
        receitas_pendentes: 0 
      }, { status: 500 })
    }

    // Separar por status
    const pendentes = receitasPendentes?.filter((r: any) => r.status === 'pendente') || []
    const preparando = receitasPendentes?.filter((r: any) => r.status === 'preparando') || []
    const ingredientesFaltando = receitasPendentes?.filter((r: any) => r.status === 'ingredientes_faltando') || []

    // Buscar pedidos aguardando receitas
    const { data: pedidosAguardando, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, receita_id')
      .eq('bar_id', bar_id)
      .eq('status', 'aguardando_producao')

    const totalPendentes = receitasPendentes?.length || 0

    return NextResponse.json({
      success: true,
      receitas_pendentes: totalPendentes,
      detalhes: {
        pendentes: pendentes.length,
        preparando: preparando.length,
        ingredientes_faltando: ingredientesFaltando.length,
        pedidos_aguardando: pedidosAguardando?.length || 0,
        total: totalPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API producoes/receitas/pendentes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      receitas_pendentes: 0 
    }, { status: 500 })
  }
} 