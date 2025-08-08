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
    if (!nome) {
      return NextResponse.json(
        { 
          error: 'Nome obrigatório',
          message: 'Por favor, preencha seu nome completo.',
          type: 'missing_name'
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { 
          error: 'Email obrigatório',
          message: 'Por favor, preencha um email válido.',
          type: 'missing_email'
        },
        { status: 400 }
      );
    }

    if (!cpf) {
      return NextResponse.json(
        { 
          error: 'CPF obrigatório',
          message: 'Por favor, preencha seu CPF.',
          type: 'missing_cpf'
        },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Email inválido',
          message: 'Por favor, digite um email válido.',
          type: 'invalid_email'
        },
        { status: 400 }
      );
    }

    // Validar CPF (formato básico)
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return NextResponse.json(
        { 
          error: 'CPF inválido',
          message: 'Por favor, digite um CPF válido com 11 dígitos.',
          type: 'invalid_cpf'
        },
        { status: 400 }
      );
    }

    // Verificar se já existe membro com mesmo email
    const { data: membroEmail } = await supabase
      .from('fidelidade_membros')
      .select('id, email')
      .eq('email', email)
      .single();

    if (membroEmail) {
      return NextResponse.json(
        { 
          error: 'Email já cadastrado',
          message: 'Este email já está sendo usado por outro membro. Tente fazer login ou use outro email.',
          type: 'email_exists'
        },
        { status: 409 }
      );
    }

    // Verificar se já existe membro com mesmo CPF
    if (cpf) {
      const { data: membroCpf } = await supabase
        .from('fidelidade_membros')
        .select('id, cpf')
        .eq('cpf', cpf.replace(/\D/g, ''))
        .single();

      if (membroCpf) {
        return NextResponse.json(
          { 
            error: 'CPF já cadastrado',
            message: 'Este CPF já está sendo usado por outro membro. Verifique seus dados ou entre em contato conosco.',
            type: 'cpf_exists'
          },
          { status: 409 }
        );
      }
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
        { 
          error: 'Erro no servidor',
          message: 'Não foi possível processar seu cadastro. Tente novamente em alguns minutos.',
          type: 'server_error'
        },
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
      { 
        error: 'Erro inesperado',
        message: 'Ocorreu um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para resolver.',
        type: 'unexpected_error'
      },
      { status: 500 }
    );
  }
}