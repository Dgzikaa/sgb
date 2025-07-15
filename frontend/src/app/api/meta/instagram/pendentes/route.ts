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
    
    // Buscar posts pendentes do Instagram
    const { data: postsPendentes, error: postsError } = await supabase
      .from('meta_instagram_posts')
      .select('id, caption, status, agendado_para, created_at')
      .eq('bar_id', bar_id)
      .in('status', ['rascunho', 'agendado', 'pendente_aprovacao', 'erro'])

    if (postsError) {
      console.error('Erro ao buscar posts Instagram:', postsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar posts Instagram',
        posts_pendentes: 0 
      }, { status: 500 })
    }

    // Separar por status
    const rascunhos = postsPendentes?.filter((p: any) => p.status === 'rascunho') || []
    const agendados = postsPendentes?.filter((p: any) => p.status === 'agendado') || []
    const pendentesAprovacao = postsPendentes?.filter((p: any) => p.status === 'pendente_aprovacao') || []
    const comErro = postsPendentes?.filter((p: any) => p.status === 'erro') || []

    // Verificar posts agendados para hoje
    const hoje = new Date().toISOString().split('T')[0]
    const agendadosHoje = agendados.filter((p: any) => {
      if (!p.agendado_para) return false
      return p.agendado_para.startsWith(hoje)
    })

    // Verificar posts atrasados (agendados para antes de hoje)
    const agora = new Date()
    const atrasados = agendados.filter((p: any) => {
      if (!p.agendado_para) return false
      return new Date(p.agendado_para) < agora
    })

    // Buscar métricas de engajamento pendentes
    const { data: metricasPendentes, error: metricasError } = await supabase
      .from('meta_instagram_insights')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('processado', false)

    const totalPendentes = postsPendentes?.length || 0

    return NextResponse.json({
      success: true,
      posts_pendentes: totalPendentes,
      detalhes: {
        rascunhos: rascunhos.length,
        agendados: agendados.length,
        pendentes_aprovacao: pendentesAprovacao.length,
        com_erro: comErro.length,
        agendados_hoje: agendadosHoje.length,
        atrasados: atrasados.length,
        metricas_pendentes: metricasPendentes?.length || 0,
        total: totalPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API meta/instagram/pendentes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      posts_pendentes: 0 
    }, { status: 500 })
  }
} 