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
    
    // Buscar checklists atribuídos ao funcionário atual
    const { data: checklists, error } = await supabase
      .from('checklist_funcionario')
      .select('id, titulo, status, prazo, created_at')
      .eq('bar_id', bar_id)
      .eq('funcionario_id', user_id)
      .in('status', ['pending', 'doing'])
      .order('prazo', { ascending: true })

    if (error) {
      console.error('Erro ao buscar checklists de funcionário:', error)
      return NextResponse.json({ meus_pendentes: 0 })
    }

    const meusPendentes = checklists?.length || 0

    // Separar por urgência baseado no prazo
    const agora = new Date()
    const urgentes = checklists?.filter((c: any) => {
      if (!c.prazo) return false
      const prazo = new Date(c.prazo)
      const horasRestantes = (prazo.getTime() - agora.getTime()) / (1000 * 60 * 60)
      return horasRestantes <= 2 && horasRestantes > 0
    }) || []

    const atrasados = checklists?.filter((c: any) => {
      if (!c.prazo) return false
      const prazo = new Date(c.prazo)
      return prazo < agora
    }) || []

    return NextResponse.json({
      meus_pendentes: meusPendentes,
      detalhes: {
        pending: checklists?.filter((c: any) => c.status === 'pending').length || 0,
        doing: checklists?.filter((c: any) => c.status === 'doing').length || 0,
        urgentes: urgentes.length,
        atrasados: atrasados.length,
        no_prazo: meusPendentes - urgentes.length - atrasados.length
      }
    })

  } catch (error) {
    console.error('Erro ao buscar checklists de funcionário pendentes:', error)
    return NextResponse.json({ meus_pendentes: 0 })
  }
} 
