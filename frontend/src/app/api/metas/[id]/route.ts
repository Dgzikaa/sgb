import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

// =====================================================
// GET - BUSCAR META ESPECÍFICA
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: metaId } = await params
    const supabase = await getAdminClient();

    const { data: meta, error } = await supabase
      .from('metas_negocio')
      .select('*')
      .eq('id', metaId)
      .eq('bar_id', user.bar_id)
      .single();

    if (error || !meta) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: meta
    });

  } catch (error) {
    console.error('❌ Erro ao buscar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// =====================================================
// PUT - ATUALIZAR META
// =====================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: metaId } = await params
    const body = await request.json();
    const supabase = await getAdminClient();

    // Atualizar meta
    const { data: metaAtualizada, error } = await supabase
      .from('metas_negocio')
      .update({
        ...body,
        atualizado_por: user.user_id
      })
      .eq('id', metaId)
      .eq('bar_id', user.bar_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar meta:', error);
      return NextResponse.json({ error: 'Erro ao atualizar meta' }, { status: 500 });
    }

    if (!metaAtualizada) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    console.log(`✅ Meta atualizada: ${metaAtualizada.nome_meta}`);
    return NextResponse.json({
      success: true,
      data: metaAtualizada,
      message: 'Meta atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// =====================================================
// DELETE - DELETAR META
// =====================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: metaId } = await params
    const supabase = await getAdminClient();

    // Deletar meta
    const { error } = await supabase
      .from('metas_negocio')
      .delete()
      .eq('id', metaId)
      .eq('bar_id', user.bar_id);

    if (error) {
      console.error('❌ Erro ao deletar meta:', error);
      return NextResponse.json({ error: 'Erro ao deletar meta' }, { status: 500 });
    }

    console.log(`✅ Meta deletada: ${metaId}`);
    return NextResponse.json({
      success: true,
      message: 'Meta deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 