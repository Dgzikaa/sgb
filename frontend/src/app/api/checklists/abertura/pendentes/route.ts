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
    
    // Buscar checklists de abertura pendentes de hoje
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data: checklists, error } = await supabase
      .from('checklist_abertura')
      .select('id, area, item, status, created_at')
      .eq('bar_id', bar_id)
      .gte('data_checklist', hoje)
      .in('status', ['pending', 'doing'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar checklists de abertura:', error)
      return NextResponse.json({ pendentes: 0 })
    }

    const pendentes = checklists?.length || 0

    return NextResponse.json({
      pendentes: pendentes,
      detalhes: {
        pending: checklists?.filter((c: any) => c.status === 'pending').length || 0,
        doing: checklists?.filter((c: any) => c.status === 'doing').length || 0,
        areas: {
          cozinha: checklists?.filter((c: any) => c.area === 'cozinha').length || 0,
          bar: checklists?.filter((c: any) => c.area === 'bar').length || 0,
          salao: checklists?.filter((c: any) => c.area === 'salao').length || 0,
          recebimento: checklists?.filter((c: any) => c.area === 'recebimento').length || 0,
          seguranca: checklists?.filter((c: any) => c.area === 'seguranca').length || 0,
          administrativo: checklists?.filter((c: any) => c.area === 'administrativo').length || 0
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar checklists de abertura pendentes:', error)
    return NextResponse.json({ pendentes: 0 })
  }
} 