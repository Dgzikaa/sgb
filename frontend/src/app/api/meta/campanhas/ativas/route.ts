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
    
    // Buscar campanhas ativas da Meta
    const { data: campanhasAtivas, error: campanhasError } = await supabase
      .from('meta_campanhas')
      .select('id, nome, status, budget_diario, data_inicio, data_fim, plataforma')
      .eq('bar_id', bar_id)
      .eq('ativa', true)
      .in('status', ['ativa', 'em_andamento', 'pausada'])

    if (campanhasError) {
      console.error('Erro ao buscar campanhas Meta:', campanhasError)
      return NextResponse.json({ 
        error: 'Erro ao buscar campanhas Meta',
        campanhas_ativas: 0 
      }, { status: 500 })
    }

    // Separar por status
    const ativas = campanhasAtivas?.filter((c: any) => c.status === 'ativa') || []
    const emAndamento = campanhasAtivas?.filter((c: any) => c.status === 'em_andamento') || []
    const pausadas = campanhasAtivas?.filter((c: any) => c.status === 'pausada') || []

    // Separar por plataforma
    const instagram = campanhasAtivas?.filter((c: any) => c.plataforma === 'instagram') || []
    const facebook = campanhasAtivas?.filter((c: any) => c.plataforma === 'facebook') || []
    const ambas = campanhasAtivas?.filter((c: any) => c.plataforma === 'ambas') || []

    // Calcular orçamento total diário
    const orcamentoTotal = campanhasAtivas?.reduce((total: number, c: any) => {
      return total + (c.budget_diario || 0)
    }, 0) || 0

    // Verificar campanhas que precisam de atenção
    const agora = new Date()
    const campanhasExpirandoSoon = campanhasAtivas?.filter((c: any) => {
      if (!c.data_fim) return false
      const dataFim = new Date(c.data_fim)
      const diasRestantes = Math.ceil((dataFim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
      return diasRestantes <= 7 && diasRestantes > 0
    }) || []

    const totalCampanhas = campanhasAtivas?.length || 0

    return NextResponse.json({
      success: true,
      campanhas_ativas: totalCampanhas,
      detalhes: {
        ativas: ativas.length,
        em_andamento: emAndamento.length,
        pausadas: pausadas.length,
        por_plataforma: {
          instagram: instagram.length,
          facebook: facebook.length,
          ambas: ambas.length
        },
        orcamento_total_diario: orcamentoTotal,
        expirando_em_7_dias: campanhasExpirandoSoon.length,
        total: totalCampanhas
      }
    })

  } catch (error) {
    console.error('Erro na API meta/campanhas/ativas:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      campanhas_ativas: 0 
    }, { status: 500 })
  }
} 