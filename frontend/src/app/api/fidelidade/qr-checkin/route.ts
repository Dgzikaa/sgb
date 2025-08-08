import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qr_code_token } = body;

    if (!qr_code_token) {
      return NextResponse.json(
        { error: 'QR Code é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar membro pelo QR Code
    const { data: membro, error: errorMembro } = await supabase
      .from('fidelidade_membros')
      .select(`
        id,
        nome,
        email,
        status,
        fidelidade_saldos (
          saldo_atual
        )
      `)
      .eq('qr_code_token', qr_code_token)
      .single();

    if (errorMembro || !membro) {
      return NextResponse.json(
        { error: 'QR Code inválido ou membro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o membro está ativo
    if (membro.status !== 'ativo') {
      return NextResponse.json(
        { 
          error: 'Membro com status inativo',
          status: membro.status,
          message: membro.status === 'pendente' 
            ? 'Pagamento pendente. Entre em contato com o suporte.'
            : 'Conta suspensa. Entre em contato com o suporte.'
        },
        { status: 403 }
      );
    }

    // Verificar último check-in (evitar check-ins duplicados muito próximos)
    const agora = new Date();
    const umMinutoAtras = new Date(agora.getTime() - 60000); // 1 minuto atrás

    const { data: ultimoCheckin } = await supabase
      .from('fidelidade_checkins')
      .select('data_checkin')
      .eq('membro_id', membro.id)
      .gte('data_checkin', umMinutoAtras.toISOString())
      .order('data_checkin', { ascending: false })
      .limit(1)
      .single();

    if (ultimoCheckin) {
      return NextResponse.json(
        { 
          error: 'Check-in muito recente',
          message: 'Aguarde pelo menos 1 minuto entre check-ins'
        },
        { status: 429 }
      );
    }

    // Registrar check-in
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { error: errorCheckin } = await supabase
      .from('fidelidade_checkins')
      .insert({
        membro_id: membro.id,
        qr_code_usado: qr_code_token,
        ip_address: clientIP,
        user_agent: userAgent
      });

    if (errorCheckin) {
      console.error('Erro ao registrar check-in:', errorCheckin);
      return NextResponse.json(
        { error: 'Erro ao registrar entrada' },
        { status: 500 }
      );
    }

    const saldoAtual = membro.fidelidade_saldos?.[0]?.saldo_atual || 0;

    // Log de sucesso
    console.log(`Check-in realizado: ${membro.nome} (${membro.email}) - Saldo: R$ ${saldoAtual}`);

    return NextResponse.json({
      success: true,
      membro: {
        id: membro.id,
        nome: membro.nome,
        email: membro.email,
        saldo_atual: saldoAtual
      },
      checkin: {
        data: agora.toISOString(),
        localizacao: 'Entrada Principal'
      },
      message: `Bem-vindo(a), ${membro.nome}! Saldo disponível: R$ ${saldoAtual.toFixed(2)}`
    });

  } catch (error) {
    console.error('Erro no check-in:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para listar check-ins de um membro (histórico)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const membro_id = searchParams.get('membro_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!membro_id) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      );
    }

    const { data: checkins, error } = await supabase
      .from('fidelidade_checkins')
      .select('id, data_checkin, localizacao_checkin')
      .eq('membro_id', membro_id)
      .order('data_checkin', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar check-ins:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      checkins: checkins || [],
      total: checkins?.length || 0
    });

  } catch (error) {
    console.error('Erro ao buscar check-ins:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
