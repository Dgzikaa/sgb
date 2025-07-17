import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

// GET: /api/bars/metas?bar_id=1
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('UsuÃ¡rio nÃ£o autenticado');
    }
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id') || user.bar_id;
    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id obrigatÃ³rio' }, { status: 400 });
    }
    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', bar_id)
      .single();
    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 });
    }
    return NextResponse.json({ success: true, metas: data?.metas || {} });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT: /api/bars/metas?bar_id=1
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('UsuÃ¡rio nÃ£o autenticado');
    }
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id') || user.bar_id;
    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id obrigatÃ³rio' }, { status: 400 });
    }
    const body = await request.json();
    const { metas } = body;
    if (!metas || typeof metas !== 'object') {
      return NextResponse.json({ error: 'Campo metas obrigatÃ³rio' }, { status: 400 });
    }
    const supabase = await getAdminClient();
    const { error } = await supabase
      .from('bars')
      .update({ metas })
      .eq('id', bar_id);
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar metas' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
