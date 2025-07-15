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
    
    // Buscar posts do Instagram
    const { data: postsPendentes, error: postsError } = await supabase
      .from('instagram_posts')
      .select('id, bar_id')
      .eq('bar_id', bar_id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Última semana

    if (postsError) {
      console.error('Erro ao buscar posts Instagram:', postsError)
      // Retornar 0 em caso de erro
      return NextResponse.json({ 
        success: true,
        posts_pendentes: 0 
      })
    }

    // Simplificar contagem
    const totalPosts = postsPendentes?.length || 0

    // Buscar métricas de engajamento pendentes
    const { data: metricasPendentes, error: metricasError } = await supabase
      .from('meta_instagram_insights')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('processado', false)

    const totalPendentes = postsPendentes?.length || 0

    return NextResponse.json({
      success: true,
      posts_pendentes: totalPosts,
      detalhes: {
        total: totalPosts
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