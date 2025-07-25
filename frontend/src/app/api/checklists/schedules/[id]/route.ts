import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

// =====================================================
// 🗑️ API PARA EXCLUIR AGENDAMENTO ESPECÍFICO
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { id: scheduleId } = await params;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'ID do agendamento não fornecido' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Verificar se o agendamento existe e pertence ao bar do usuário
    const { data: schedule, error: scheduleError } = await supabase
      .from('checklist_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('bar_id', user.bar_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o agendamento
    const { error: deleteError } = await supabase
      .from('checklist_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('bar_id', user.bar_id);

    if (deleteError) {
      console.error('Erro ao excluir agendamento:', deleteError);
      return NextResponse.json(
        {
          error: 'Erro ao excluir agendamento',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Agendamento "${schedule.titulo}" excluído com sucesso`,
    });
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
