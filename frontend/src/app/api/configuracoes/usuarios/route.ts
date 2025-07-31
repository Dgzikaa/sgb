import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar todos os usuários
export async function GET() {
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios_bar')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nome, role, modulos_permitidos, ativo = true } = body;

    if (!email || !nome || !role) {
      return NextResponse.json(
        { error: 'Email, nome e role são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .insert({
        email,
        nome,
        role,
        modulos_permitidos: modulos_permitidos || [],
        ativo,
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, nome, role, modulos_permitidos, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .update({
        email,
        nome,
        role,
        modulos_permitidos,
        ativo,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário (desativar)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('usuarios_bar')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}