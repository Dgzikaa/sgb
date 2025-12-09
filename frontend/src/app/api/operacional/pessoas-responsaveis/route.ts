import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const barId = searchParams.get('bar_id');
    
    if (!barId) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const { data: pessoas, error } = await (supabase as any)
      .from('pessoas_responsaveis')
      .select('*')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar pessoas responsáveis:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: pessoas || [] });
  } catch (error: any) {
    console.error('Erro ao buscar pessoas responsáveis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { bar_id, nome, cargo } = body;

    if (!bar_id || !nome) {
      return NextResponse.json(
        { error: 'bar_id e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: pessoa, error } = await (supabase as any)
      .from('pessoas_responsaveis')
      .insert({
        bar_id,
        nome,
        cargo,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pessoa responsável:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: pessoa });
  } catch (error: any) {
    console.error('Erro ao criar pessoa responsável:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, nome, cargo, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nome !== undefined) updateData.nome = nome;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data: pessoa, error } = await (supabase as any)
      .from('pessoas_responsaveis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pessoa responsável:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: pessoa });
  } catch (error: any) {
    console.error('Erro ao atualizar pessoa responsável:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await (supabase as any)
      .from('pessoas_responsaveis')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir pessoa responsável:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir pessoa responsável:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

