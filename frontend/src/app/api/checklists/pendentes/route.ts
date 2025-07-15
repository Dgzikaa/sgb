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
    
    // Buscar checklists pendentes de hoje
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data: checklists, error } = await supabase
      .from('checklist_abertura')
      .select('id, area, item, status')
      .eq('bar_id', bar_id)
      .gte('data_checklist', hoje)
      .in('status', ['pending', 'doing'])

    if (error) {
      console.error('Erro ao buscar checklists:', error)
      return NextResponse.json({ total_pendentes: 0 })
    }

    const totalPendentes = checklists?.length || 0

    return NextResponse.json({
      total_pendentes: totalPendentes,
      detalhes: {
        pending: checklists?.filter((c: any) => c.status === 'pending').length || 0,
        doing: checklists?.filter((c: any) => c.status === 'doing').length || 0,
        por_area: checklists?.reduce((acc: any, item: any) => {
          acc[item.area] = (acc[item.area] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      }
    })

  } catch (error) {
    console.error('Erro ao buscar checklists pendentes:', error)
    return NextResponse.json({ total_pendentes: 0 })
  }
} 