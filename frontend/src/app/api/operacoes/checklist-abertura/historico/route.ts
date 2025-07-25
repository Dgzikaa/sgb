import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

interface ChecklistAbertura {
  id: string;
  data: string;
  status: string;
  hora_inicio?: string;
  hora_conclusao?: string;
  responsavel_geral?: string;
  total_itens?: number;
  itens_concluidos?: number;
  itens_problemas?: number;
  percentual_conclusao?: number;
  created_at: string;
  updated_at: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!bar_id) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Buscar histórico de checklists de abertura
    const { data: historico, error } = await supabase
      .from('checklist_abertura')
      .select(
        `
        id,
        data,
        status,
        hora_inicio,
        hora_conclusao,
        responsavel_geral,
        total_itens,
        itens_concluidos,
        itens_problemas,
        percentual_conclusao,
        created_at,
        updated_at
      `
      )
      .eq('bar_id', bar_id)
      .order('data', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico' },
        { status: 500 }
      );
    }

    // Formatar dados para retorno
    const historicoFormatado = (historico || []).map(
      (item: ChecklistAbertura) => ({
        id: item.id,
        data: item.data,
        status: item.status,
        hora_inicio: item.hora_inicio,
        hora_conclusao: item.hora_conclusao,
        responsavel_geral: item.responsavel_geral,
        total_itens: item.total_itens || 0,
        itens_concluidos: item.itens_concluidos || 0,
        itens_problemas: item.itens_problemas || 0,
        percentual_conclusao: item.percentual_conclusao || 0,
        tempo_total:
          item.hora_inicio && item.hora_conclusao
            ? calcularTempoTotal(item.hora_inicio, item.hora_conclusao)
            : null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })
    );

    return NextResponse.json({
      historico: historicoFormatado,
      total: historicoFormatado.length,
    });
  } catch (error: unknown) {
    console.error('Erro na API de histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function calcularTempoTotal(inicio: string, fim: string): string {
  try {
    const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
    const [horaFim, minutoFim] = fim.split(':').map(Number);

    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const fimMinutos = horaFim * 60 + minutoFim;

    let diferencaMinutos = fimMinutos - inicioMinutos;

    // Se a diferença for negativa, significa que passou para o dia seguinte
    if (diferencaMinutos < 0) {
      diferencaMinutos += 24 * 60;
    }

    const horas = Math.floor(diferencaMinutos / 60);
    const minutos = diferencaMinutos % 60;

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  } catch (error) {
    return '00:00';
  }
}
