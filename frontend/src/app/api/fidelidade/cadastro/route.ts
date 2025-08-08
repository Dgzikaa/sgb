import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, cpf, telefone, data_nascimento } = body;

    // Validações básicas
    if (!nome || !email || !cpf) {
      return NextResponse.json(
        { error: 'Nome, email e CPF são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe membro com mesmo email ou CPF
    const { data: membroExistente } = await supabase
      .from('fidelidade_membros')
      .select('id, email, cpf')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .single();

    if (membroExistente) {
      return NextResponse.json(
        { error: 'Já existe um membro cadastrado com este email ou CPF' },
        { status: 409 }
      );
    }

    // Criar novo membro
    const { data: novoMembro, error } = await supabase
      .from('fidelidade_membros')
      .insert({
        nome,
        email,
        cpf: cpf.replace(/\D/g, ''), // Remove formatação
        telefone: telefone?.replace(/\D/g, ''), // Remove formatação
        data_nascimento,
        status: 'ativo',
        bar_id: 3 // Ordinário Bar
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar membro:', error);
      return NextResponse.json(
        { error: 'Erro ao criar cadastro' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      membro: novoMembro,
      message: 'Cadastro realizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}