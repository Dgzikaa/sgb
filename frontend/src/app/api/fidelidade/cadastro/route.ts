import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      endereco,
      aceitaTermos,
      aceitaLgpd,
      aceitaMarketing
    } = body;

    // Validações básicas
    if (!nome || !email || !telefone || !cpf || !dataNascimento) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    if (!aceitaTermos || !aceitaLgpd) {
      return NextResponse.json(
        { error: 'É necessário aceitar os termos e a LGPD' },
        { status: 400 }
      );
    }

    // Verifica se já existe um membro com este email ou CPF
    const { data: existingMember } = await supabase
      .from('fidelidade_membros')
      .select('id')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'E-mail ou CPF já cadastrado' },
        { status: 409 }
      );
    }

    // Criar o membro
    const { data: novoMembro, error: errorMembro } = await supabase
      .from('fidelidade_membros')
      .insert({
        nome,
        email,
        telefone,
        cpf,
        data_nascimento: dataNascimento,
        endereco,
        status: 'pendente', // Aguardando pagamento
        bar_id: 3 // Ordinário Bar
      })
      .select()
      .single();

    if (errorMembro) {
      console.error('Erro ao criar membro:', errorMembro);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    // Criar registro de pagamento pendente
    const proximaCobranca = new Date();
    proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);

    const { error: errorPagamento } = await supabase
      .from('fidelidade_pagamentos')
      .insert({
        membro_id: novoMembro.id,
        valor: 100.00,
        status: 'pendente',
        data_vencimento: proximaCobranca.toISOString().split('T')[0]
      });

    if (errorPagamento) {
      console.error('Erro ao criar pagamento:', errorPagamento);
      // Não retorna erro pois o membro já foi criado
    }

    // Log de auditoria
    console.log(`Novo membro cadastrado: ${nome} (${email}) - ID: ${novoMembro.id}`);

    return NextResponse.json({
      success: true,
      membro: {
        id: novoMembro.id,
        nome: novoMembro.nome,
        email: novoMembro.email,
        qr_code_token: novoMembro.qr_code_token
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar membro por email
    const { data: membro, error } = await supabase
      .from('fidelidade_membros')
      .select(`
        id,
        nome,
        email,
        status,
        qr_code_token,
        data_adesao,
        proxima_cobranca,
        fidelidade_saldos (
          saldo_atual,
          saldo_mes_atual
        )
      `)
      .eq('email', email)
      .single();

    if (error || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ membro });

  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
