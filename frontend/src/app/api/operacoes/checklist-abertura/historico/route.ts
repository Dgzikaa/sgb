import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const limite = parseInt(searchParams.get('limite') || '30')

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    const supabase = await getAdminClient()

    // Buscar histórico dos checklists
    const { data: historico, error } = await supabase
      .from('checklist_abertura')
      .select(`
        data,
        hora_inicio,
        hora_conclusao,
        responsavel_geral,
        observacoes_gerais,
        total_itens,
        itens_concluidos,
        itens_problemas,
        percentual_conclusao,
        status
      `)
      .eq('bar_id', bar_id)
      .order('data', { ascending: false })
      .limit(limite)

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
    }

    // Formatar dados para resposta
    const historicoFormatado = historico?.map((item: any) => ({
      data: item.data,
      hora_inicio: item.hora_inicio,
      hora_conclusao: item.hora_conclusao,
      responsavel_geral: item.responsavel_geral,
      observacoes_gerais: item.observacoes_gerais,
      areas_completas: item.itens_concluidos,
      total_areas: item.total_itens,
      itens_problemas: item.itens_problemas,
      percentual_conclusao: item.percentual_conclusao,
      status: item.status,
      tempo_total: calcularTempoTotal(item.hora_inicio, item.hora_conclusao)
    })) || []

    return NextResponse.json({ 
      historico: historicoFormatado,
      total_registros: historico?.length || 0
    })
  } catch (error) {
    console.error('Erro na API de histórico:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function calcularTempoTotal(horaInicio?: string, horaConclusao?: string): number {
  if (!horaInicio || !horaConclusao) return 0
  
  try {
    // Converter horários para minutos
    const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number)
    const [conclusaoHoras, conclusaoMinutos] = horaConclusao.split(':').map(Number)
    
    const inicioTotalMinutos = inicioHoras * 60 + inicioMinutos
    let conclusaoTotalMinutos = conclusaoHoras * 60 + conclusaoMinutos
    
    // Se conclusão for menor que início, assumir que passou para o próximo dia
    if (conclusaoTotalMinutos < inicioTotalMinutos) {
      conclusaoTotalMinutos += 24 * 60
    }
    
    return conclusaoTotalMinutos - inicioTotalMinutos
  } catch {
    return 0
  }
} 