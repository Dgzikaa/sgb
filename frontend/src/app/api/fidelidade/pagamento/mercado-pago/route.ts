import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// Inicializar SDK do Mercado Pago
let mercadoPagoClient: MercadoPagoConfig | null = null;
if (MP_ACCESS_TOKEN) {
  mercadoPagoClient = new MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { membro_id, payment_method, valor = 100.00, recurring = false } = body;

    console.log('🔍 DEBUG - Variáveis ENV:', {
      hasAccessToken: !!MP_ACCESS_TOKEN,
      hasCollectorId: !!process.env.MERCADO_PAGO_COLLECTOR_ID,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      collectorId: process.env.MERCADO_PAGO_COLLECTOR_ID,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

    if (!MP_ACCESS_TOKEN) {
      // Modo demonstração para cartão de crédito
      console.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado. Usando modo demonstração.');
      
      // Simular resposta de cartão de crédito para demonstração
      return NextResponse.json({
        success: true,
        payment_id: `demo_card_${Date.now()}`,
        status: 'approved',
        status_detail: 'accredited',
        external_reference: `demo_${membro_id}`,
        amount: valor,
        demo_mode: true,
        message: 'Modo demonstração - Mercado Pago não configurado'
      });
    }

    // Buscar dados do membro
    const { data: membro, error: errorMembro } = await supabase
      .from('fidelidade_membros')
      .select('id, nome, email, cpf')
      .eq('id', membro_id)
      .single();

    if (errorMembro || !membro) {
      console.error('🚨 DEBUG - Erro ao buscar membro:', errorMembro);
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    console.log('🔍 DEBUG - Dados do membro:', {
      membro_id,
      valor,
      recurring,
      payment_method,
      hasMembroCpf: !!membro?.cpf,
      membroCpfLength: membro?.cpf?.replace(/\D/g, '').length,
      membroEmail: membro?.email,
      membroNome: membro?.nome
    });

    // Processar pagamento com cartão de crédito
    if (payment_method === 'credit_card') {
      const { 
        card_token, 
        installments = 1,
        card_holder_name,
        card_holder_email 
      } = body;

      if (!card_token) {
        return NextResponse.json(
          { error: 'Token do cartão é obrigatório' },
          { status: 400 }
        );
      }

      // Usar SDK oficial para criar pagamento com cartão
      if (!mercadoPagoClient) {
        throw new Error('Mercado Pago client não inicializado');
      }

      const payment = new Payment(mercadoPagoClient);
      
      const creditCardPaymentData = {
        transaction_amount: Number(valor),
        description: 'Fidelidade VIP - Ordinário Bar',
        payment_method_id: 'visa', // ou detectar automaticamente
        token: card_token,
        installments: Number(installments),
        payer: {
          email: card_holder_email || membro.email,
          first_name: card_holder_name?.split(' ')[0] || membro.nome?.split(' ')[0] || 'Cliente',
          last_name: card_holder_name?.split(' ').slice(1).join(' ') || membro.nome?.split(' ').slice(1).join(' ') || 'VIP',
          identification: {
            type: 'CPF',
            number: (membro.cpf || '').replace(/\D/g, '')
          }
        },
        external_reference: `fidelidade_${membro_id}_${Date.now()}`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/pagamento/webhook`,
        additional_info: {
          items: [
            {
              id: 'fidelidade_vip',
              title: 'Fidelidade VIP - Ordinário Bar',
              description: 'Assinatura mensal do programa de fidelidade VIP',
              quantity: 1,
              unit_price: Number(valor)
            }
          ]
        }
      };

      console.log('🚀 DEBUG CARTÃO - SDK payload enviado:', JSON.stringify(creditCardPaymentData, null, 2));

      const cardResult = await payment.create({
        body: creditCardPaymentData
      });

      console.log('✅ DEBUG CARTÃO - Resposta do SDK:', JSON.stringify(cardResult, null, 2));

      // Salvar registro de pagamento
      const { error: errorPagamento } = await supabase
        .from('fidelidade_pagamentos')
        .insert({
          membro_id,
          valor,
          status: cardResult.status,
          metodo_pagamento: 'credit_card',
          gateway_transaction_id: cardResult.id,
          gateway_response: cardResult,
          data_vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (errorPagamento) {
        console.error('Erro ao salvar pagamento cartão:', errorPagamento);
      }

      return NextResponse.json({
        success: true,
        payment_id: cardResult.id,
        status: cardResult.status,
        status_detail: cardResult.status_detail,
        amount: cardResult.transaction_amount,
        installments: cardResult.installments,
        payment_method: cardResult.payment_method_id
      });
    }

    return NextResponse.json(
      { error: 'Método de pagamento não especificado' },
      { status: 400 }
    );

  } catch (error) {
    console.error('🚨 ERRO GERAL:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('🚀 PUT API INICIADA - /api/fidelidade/pagamento/mercado-pago');
  try {
    const body = await request.json();
    console.log('📦 BODY RECEBIDO:', body);
    const { membro_id, valor = 100.00, recurring = false } = body;

    console.log('🔍 DEBUG PIX - Variáveis ENV:', {
      hasAccessToken: !!MP_ACCESS_TOKEN,
      hasCollectorId: !!process.env.MERCADO_PAGO_COLLECTOR_ID,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      collectorId: process.env.MERCADO_PAGO_COLLECTOR_ID,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

    // Buscar dados do membro primeiro (mesmo em modo demo para testes)
    let membro: any = null;
    if (membro_id && membro_id !== 'test' && membro_id !== 'debug_test') {
      const { data: membroData, error: errorMembro } = await supabase
        .from('fidelidade_membros')
        .select('id, nome, email, cpf')
        .eq('id', membro_id)
        .single();

      if (errorMembro || !membroData) {
        console.error('🚨 DEBUG PIX - Erro ao buscar membro:', errorMembro);
        return NextResponse.json(
          { error: 'Membro não encontrado', details: errorMembro?.message },
          { status: 404 }
        );
      }
      membro = membroData;
    }

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
        message: 'Modo demonstração PIX - Mercado Pago não configurado',
        membro_encontrado: !!membro
      });
    }

    console.log('🔍 DEBUG PIX - Dados do membro:', {
      membro_id,
      valor,
      recurring,
      hasMembroCpf: !!membro?.cpf,
      membroCpfLength: membro?.cpf?.replace(/\D/g, '').length,
      membroEmail: membro?.email,
      membroNome: membro?.nome
    });

    // Validar se membro existe (obrigatório para Mercado Pago real)
    if (!membro && membro_id !== 'test' && membro_id !== 'debug_test') {
      throw new Error('Dados do membro são obrigatórios para pagamento via Mercado Pago');
    }

    // Para testes, usar dados fictícios
    if (membro_id === 'test' || membro_id === 'debug_test') {
      membro = {
        id: membro_id,
        nome: 'Usuário Teste',
        email: 'teste@teste.com',
        cpf: '12345678900'
      };
    }

    // Usar SDK oficial para criar pagamento PIX
    if (!mercadoPagoClient) {
      throw new Error('Mercado Pago client não inicializado');
    }

    const payment = new Payment(mercadoPagoClient);
    
    const pixPaymentData = {
      transaction_amount: Number(valor),
      description: 'Fidelidade VIP - Ordinário Bar',
      payment_method_id: 'pix',
      payer: {
        email: membro.email,
        first_name: membro.nome?.split(' ')[0] || 'Cliente',
        last_name: membro.nome?.split(' ').slice(1).join(' ') || 'VIP',
        identification: {
          type: 'CPF',
          number: (membro.cpf || '').replace(/\D/g, '')
        }
      },
      external_reference: `fidelidade_${membro_id}_${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/pagamento/webhook`,
      additional_info: {
        items: [
          {
            id: 'fidelidade_vip',
            title: 'Fidelidade VIP - Ordinário Bar',
            description: 'Assinatura mensal do programa de fidelidade VIP',
            quantity: 1,
            unit_price: Number(valor)
          }
        ]
      }
    };

    console.log('🚀 DEBUG PIX - SDK payload enviado:', JSON.stringify(pixPaymentData, null, 2));

    const pixResult = await payment.create({
      body: pixPaymentData
    });

    console.log('✅ DEBUG PIX - Resposta do SDK:', JSON.stringify(pixResult, null, 2));

    // Salvar registro de pagamento
    const { error: errorPagamento } = await supabase
      .from('fidelidade_pagamentos')
      .insert({
        membro_id,
        valor,
        status: 'pendente',
        metodo_pagamento: 'pix',
        gateway_transaction_id: pixResult.id,
        gateway_response: pixResult,
        data_vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      });

    if (errorPagamento) {
      console.error('Erro ao salvar pagamento PIX:', errorPagamento);
    }

    return NextResponse.json({
      success: true,
      payment_id: pixResult.id,
      status: pixResult.status,
      qr_code: pixResult.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: pixResult.point_of_interaction?.transaction_data?.qr_code_base64,
      expiration_date: pixResult.date_of_expiration
    });

  } catch (error) {
    console.error('🚨 ERRO GERAL PIX:', error);
    
    // Detectar erro de credenciais e usar modo demo
    if (error && typeof error === 'object' && 'error' in error && error.error === 'unauthorized') {
      console.warn('🔧 CREDENCIAIS INVÁLIDAS - Usando modo demonstração');
      
      return NextResponse.json({
        success: true,
        payment_id: `demo_pix_credentials_${Date.now()}`,
        status: 'pending',
        qr_code: '00020101021243650016COM.MERCADOLIBRE0201306360014br.gov.bcb.pix0114+5561999999999527400005303986540510.005802BR5925Ordinario Bar Demonstracao6009Brasilia61081234567062070503***6304DEMO',
        qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        demo_mode: true,
        message: 'Credenciais inválidas - Usando modo demonstração. Configure credenciais de teste (TEST-xxx) para desenvolvimento.'
      });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}