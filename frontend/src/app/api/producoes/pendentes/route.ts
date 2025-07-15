import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

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
    
    // Buscar receitas em produção (status pendente/em andamento)
    const { data: receitasPendentes, error: receitasError } = await supabase
      .from('producoes')
      .select('id, status')
      .eq('bar_id', bar_id)
      .in('status', ['pendente', 'em_andamento', 'preparando'])

    if (receitasError) {
      console.error('Erro ao buscar receitas pendentes:', receitasError)
      // Retornar 0 em caso de erro
      return NextResponse.json({ 
        success: true,
        receitas_pendentes: 0 
      })
    }

    // Separar por status
    const pendentes = receitasPendentes?.filter((r: any) => r.status_producao === 'pendente') || []
    const emAndamento = receitasPendentes?.filter((r: any) => r.status_producao === 'em_andamento') || []
    const preparando = receitasPendentes?.filter((r: any) => r.status_producao === 'preparando') || []

    // Calcular receitas atrasadas (tempo estimado ultrapassado)
    const agora = new Date()
    const atrasadas = emAndamento.filter((r: any) => {
      if (!r.iniciado_em || !r.tempo_estimado) return false
      const iniciadoEm = new Date(r.iniciado_em)
      const tempoDecorrido = Math.floor((agora.getTime() - iniciadoEm.getTime()) / (1000 * 60)) // em minutos
      return tempoDecorrido > r.tempo_estimado
    })

    const totalPendentes = receitasPendentes?.length || 0

    return NextResponse.json({
      success: true,
      receitas_pendentes: totalPendentes,
      detalhes: {
        pendentes: pendentes.length,
        em_andamento: emAndamento.length,
        preparando: preparando.length,
        atrasadas: atrasadas.length,
        total: totalPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API producoes/pendentes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      receitas_pendentes: 0 
    }, { status: 500 })
  }
} 