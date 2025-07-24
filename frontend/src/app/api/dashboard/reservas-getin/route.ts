import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')

    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    // Buscar dados de reservas do GetIn
    const { data: reservas, error } = await supabase
      .from('getin_reservas')
      .select('*')
      .eq('bar_id', barId)
      .order('data_reserva', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar reservas GetIn:', error)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // Calcular estatísticas
    const hoje = new Date().toISOString().split('T')[0]
    const reservasHoje = reservas?.filter(r => r.data_reserva.startsWith(hoje)) || []
    const reservasPendentes = reservas?.filter(r => r.status === 'pendente') || []
    const reservasConfirmadas = reservas?.filter(r => r.status === 'confirmada') || []

    const estatisticas = {
      total_reservas: reservas?.length || 0,
      reservas_hoje: reservasHoje.length,
      reservas_pendentes: reservasPendentes.length,
      reservas_confirmadas: reservasConfirmadas.length,
      valor_total_hoje: reservasHoje.reduce((acc, r) => acc + (r.valor || 0), 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        reservas: reservas || [],
        estatisticas
      }
    })

  } catch (error) {
    console.error('Erro na API de reservas GetIn:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
