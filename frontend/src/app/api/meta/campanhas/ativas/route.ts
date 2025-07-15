import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseClient()
    
    // Buscar posts do Instagram/Facebook pendentes de análise
    const { data: posts, error: postsError } = await supabase
      .from('meta_posts')
      .select('id, platform, status, created_at')
      .eq('bar_id', bar_id)
      .in('status', ['pending_analysis', 'needs_review'])
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Erro ao buscar posts Meta:', postsError)
      return NextResponse.json({ campanhas_ativas: 0 })
    }

    // Buscar campanhas ativas (se existir tabela)
    const { data: campanhas, error: campError } = await supabase
      .from('meta_campaigns')
      .select('id, name, status, budget_remaining')
      .eq('bar_id', bar_id)
      .eq('status', 'active')
      .gt('budget_remaining', 0)

    // Se não existir tabela de campanhas, ignorar erro
    const campanhasAtivas = campError ? [] : (campanhas || [])

    const totalPendentes = (posts?.length || 0) + (campanhasAtivas?.length || 0)

    return NextResponse.json({
      campanhas_ativas: totalPendentes,
      detalhes: {
        posts_pendentes: posts?.length || 0,
        campanhas_ativas: campanhasAtivas?.length || 0,
        plataformas: {
          instagram: posts?.filter((p: any) => p.platform === 'instagram').length || 0,
          facebook: posts?.filter((p: any) => p.platform === 'facebook').length || 0
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar campanhas Meta:', error)
    return NextResponse.json({ campanhas_ativas: 0 })
  }
} 