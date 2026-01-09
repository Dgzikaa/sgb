import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

export const dynamic = 'force-dynamic';

// GET - Buscar detalhes de uma notificação específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { id } = await params;
    const supabase = await getAdminClient();

    // Buscar notificação
    const { data: notificacao, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('id', id)
      .eq('bar_id', user.bar_id)
      .single();

    if (error || !notificacao) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }

    // Extrair dados do campo jsonb
    const dados = notificacao.dados || {};

    // Formatar resposta
    const response = {
      id: notificacao.id,
      tipo: notificacao.tipo || dados.tipo || 'info',
      categoria: dados.categoria || dados.modulo || 'sistema',
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      dados: dados.dados_extras || dados,
      acoes_sugeridas: dados.acoes_sugeridas || [],
      url: dados.acoes?.[0]?.url || null,
      created_at: notificacao.criada_em,
      lido: notificacao.status === 'lida',
      referencia_tipo: dados.referencia_tipo || null,
      referencia_id: dados.referencia_id || null,
      referencia_nome: dados.referencia_nome || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status da notificação (marcar como lida)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await getAdminClient();

    const updates: Record<string, unknown> = {};

    if (body.lido !== undefined) {
      updates.status = body.lido ? 'lida' : 'enviada';
      if (body.lido) {
        updates.lida_em = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('notificacoes')
      .update(updates)
      .eq('id', id)
      .eq('bar_id', user.bar_id);

    if (error) {
      console.error('Erro ao atualizar notificação:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir notificação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { id } = await params;
    const supabase = await getAdminClient();

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id)
      .eq('bar_id', user.bar_id);

    if (error) {
      console.error('Erro ao excluir notificação:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
