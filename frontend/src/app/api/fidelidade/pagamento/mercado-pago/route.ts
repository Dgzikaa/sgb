import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const MP_BASE_URL = 'https://api.mercadopago.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { membro_id, payment_method, valor = 100.00 } = body;

    if (!MP_ACCESS_TOKEN) {
      // Modo demonstração/desenvolvimento
      console.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado. Usando modo demonstração.');
      
      // Simular resposta para demonstração
      return NextResponse.json({
        success: true,
        preference_id: `demo_${Date.now()}`,
        init_point: '#', 
        sandbox_init_point: '#',
        qr_code: payment_method === 'pix' ? 'DEMO_PIX_CODE_12345' : null,
        qr_code_base64: payment_method === 'pix' ? 'data:image/png;base64,demo' : null,
        demo_mode: true,
        message: 'Modo demonstração - Mercado Pago não configurado'
      });
    }

    // Buscar dados do membro
    const { data: membro, error: errorMembro } = await supabase
      .from('fidelidade_membros')
      .select('id, nome, email, cpf, telefone')
      .eq('id', membro_id)
      .single();

    if (errorMembro || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Criar preferência de pagamento no Mercado Pago
    const preference = {
      items: [
        {
          title: 'Fidelidade VIP - Ordinário Bar',
          description: 'Assinatura mensal do programa de fidelidade VIP',
          quantity: 1,
          unit_price: valor,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: membro.nome,
        email: membro.email,
        identification: {
          type: 'CPF',
          number: membro.cpf?.replace(/\D/g, '') || ''
        },
        phone: {
          number: membro.telefone?.replace(/\D/g, '') || ''
        }
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: payment_method === 'card' ? 12 : 1
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/fidelidade/pagamento/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/fidelidade/pagamento/erro`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/fidelidade/pagamento/pendente`
      },
      auto_return: 'approved',
      external_reference: membro_id,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/pagamento/webhook`,
      metadata: {
        membro_id,
        tipo: 'fidelidade_mensal'
      }
    };

    // Se for PIX, configurar pagamento específico
    if (payment_method === 'pix') {
      preference.payment_methods = {
        excluded_payment_methods: [],
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ],
        installments: 1
      };
    }

    // Criar preferência no Mercado Pago
    const mpResponse = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const error = await mpResponse.text();
      console.error('Erro Mercado Pago:', error);
      return NextResponse.json(
        { error: 'Erro ao criar preferência de pagamento' },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    // Salvar registro de pagamento pendente
    const { error: errorPagamento } = await supabase
      .from('fidelidade_pagamentos')
      .insert({
        membro_id,
        valor,
        status: 'pendente',
        metodo_pagamento: payment_method,
        gateway_transaction_id: mpData.id,
        gateway_response: mpData,
        data_vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 24h
      });

    if (errorPagamento) {
      console.error('Erro ao salvar pagamento:', errorPagamento);
    }

    return NextResponse.json({
      success: true,
      preference_id: mpData.id,
      init_point: mpData.init_point, // URL para redirecionar
      sandbox_init_point: mpData.sandbox_init_point, // URL de teste
      qr_code: payment_method === 'pix' ? mpData.qr_code : null,
      qr_code_base64: payment_method === 'pix' ? mpData.qr_code_base64 : null
    });

  } catch (error) {
    console.error('Erro no pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para pagamento PIX direto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { membro_id, valor = 100.00 } = body;

    if (!MP_ACCESS_TOKEN) {
      // Modo demonstração/desenvolvimento para PIX
      console.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado. Usando modo demonstração PIX.');
      
      // Simular resposta PIX para demonstração
      return NextResponse.json({
        success: true,
        payment_id: `demo_pix_${Date.now()}`,
        status: 'pending',
        qr_code: '00020101021243650016COM.MERCADOLIBRE0201306360014br.gov.bcb.pix0114+5561999999999527400005303986540510.005802BR5925Ordinario Bar Demonstracao6009Brasilia61081234567062070503***6304DEMO',
        qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        demo_mode: true,
        message: 'Modo demonstração PIX - Mercado Pago não configurado'
      });
    }

    // Buscar dados do membro
    const { data: membro, error: errorMembro } = await supabase
      .from('fidelidade_membros')
      .select('id, nome, email, cpf')
      .eq('id', membro_id)
      .single();

    if (errorMembro || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Criar pagamento PIX direto com chave CNPJ
    const pixPayment = {
      transaction_amount: valor,
      description: 'Fidelidade VIP - Ordinário Bar',
      payment_method_id: 'pix',
      payer: {
        email: membro.email || 'test@test.com',
        first_name: membro.nome?.split(' ')[0] || 'Test',
        last_name: membro.nome?.split(' ').slice(1).join(' ') || 'User'
      },
      // Configuração simplificada para teste
      additional_info: {
        items: [
          {
            id: 'fidelidade_vip',
            title: 'Fidelidade VIP - Ordinário Bar',
            quantity: 1,
            unit_price: valor
          }
        ]
      },
      // Dados do recebedor (Ordinário Bar)
      collector: {
        id: process.env.MERCADO_PAGO_COLLECTOR_ID
      },
      external_reference: membro_id,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/pagamento/webhook`,
      metadata: {
        pix_key: '57.960.083/0001-88', // CNPJ PIX
        business_name: 'Ordinário Bar',
        member_id: membro_id
      }
    };

    const pixResponse = await fetch(`${MP_BASE_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixPayment)
    });

    if (!pixResponse.ok) {
      const error = await pixResponse.text();
      console.error('Erro PIX Mercado Pago:', error);
      return NextResponse.json(
        { error: 'Erro ao criar pagamento PIX' },
        { status: 500 }
      );
    }

    const pixData = await pixResponse.json();

    // Salvar registro de pagamento
    const { error: errorPagamento } = await supabase
      .from('fidelidade_pagamentos')
      .insert({
        membro_id,
        valor,
        status: 'pendente',
        metodo_pagamento: 'pix',
        gateway_transaction_id: pixData.id,
        gateway_response: pixData,
        data_vencimento: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
      });

    if (errorPagamento) {
      console.error('Erro ao salvar pagamento PIX:', errorPagamento);
    }

    return NextResponse.json({
      success: true,
      payment_id: pixData.id,
      status: pixData.status,
      qr_code: pixData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: pixData.point_of_interaction?.transaction_data?.qr_code_base64,
      expiration_date: pixData.date_of_expiration
    });

  } catch (error) {
    console.error('Erro no pagamento PIX:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
