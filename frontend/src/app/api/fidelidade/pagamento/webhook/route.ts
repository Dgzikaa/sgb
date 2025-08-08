import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const MP_BASE_URL = 'https://api.mercadopago.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook Mercado Pago recebido:', body);

    // Validar se é uma notificação de pagamento
    if (body.type !== 'payment') {
      return NextResponse.json({ status: 'ignored' });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID not found' }, { status: 400 });
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const paymentResponse = await fetch(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    if (!paymentResponse.ok) {
      console.error('Erro ao buscar pagamento no MP:', await paymentResponse.text());
      return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
    }

    const paymentData = await paymentResponse.json();
    const membroId = paymentData.external_reference;
    const status = paymentData.status;

    console.log(`Pagamento ${paymentId} - Status: ${status} - Membro: ${membroId}`);

    // Atualizar status do pagamento no banco
    const { error: errorUpdate } = await supabase
      .from('fidelidade_pagamentos')
      .update({
        status: mapMercadoPagoStatus(status),
        gateway_response: paymentData,
        data_pagamento: status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_transaction_id', paymentId);

    if (errorUpdate) {
      console.error('Erro ao atualizar pagamento:', errorUpdate);
    }

    // Se pagamento aprovado, ativar membro e adicionar créditos
    if (status === 'approved' && membroId) {
      await processApprovedPayment(membroId, paymentData.transaction_amount);
    }

    return NextResponse.json({ status: 'processed' });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processApprovedPayment(membroId: string, valor: number) {
  try {
    // Ativar membro
    const { error: errorMembro } = await supabase
      .from('fidelidade_membros')
      .update({
        status: 'ativo',
        ultimo_pagamento: new Date().toISOString(),
        proxima_cobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 dias
        updated_at: new Date().toISOString()
      })
      .eq('id', membroId);

    if (errorMembro) {
      console.error('Erro ao ativar membro:', errorMembro);
      return;
    }

    // Adicionar créditos mensais (R$ 150)
    const { error: errorTransacao } = await supabase
      .from('fidelidade_transacoes')
      .insert({
        membro_id: membroId,
        tipo: 'credito',
        valor: 150.00,
        descricao: 'Crédito mensal - Pagamento aprovado'
      });

    if (errorTransacao) {
      console.error('Erro ao adicionar créditos:', errorTransacao);
      return;
    }

    console.log(`Membro ${membroId} ativado com sucesso! Créditos: R$ 150,00`);

    // Enviar notificação de boas-vindas (opcional)
    await sendWelcomeNotification(membroId);

  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error);
  }
}

async function sendWelcomeNotification(membroId: string) {
  try {
    // Buscar dados do membro para envio de notificação
    const { data: membro } = await supabase
      .from('fidelidade_membros')
      .select('nome, email')
      .eq('id', membroId)
      .single();

    if (membro) {
      // Aqui você pode integrar com serviços de e-mail/SMS
      console.log(`Notificação de boas-vindas para ${membro.nome} (${membro.email})`);
      
      // Exemplo de integração com Discord (se configurado)
      const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
      if (discordWebhook) {
        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎉 **Novo Membro VIP!**\n👑 ${membro.nome} acabou de se tornar membro VIP do Ordinário Bar!\n💳 R$ 150 em créditos liberados`
          })
        });
      }
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}

function mapMercadoPagoStatus(mpStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'pendente',
    'approved': 'pago',
    'authorized': 'pago',
    'in_process': 'pendente',
    'in_mediation': 'pendente',
    'rejected': 'falhado',
    'cancelled': 'cancelado',
    'refunded': 'cancelado',
    'charged_back': 'cancelado'
  };

  return statusMap[mpStatus] || 'pendente';
}

// Endpoint GET para verificar status de pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const membroId = searchParams.get('membro_id');

    if (!paymentId && !membroId) {
      return NextResponse.json(
        { error: 'Payment ID ou Membro ID é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase.from('fidelidade_pagamentos').select('*');
    
    if (paymentId) {
      query = query.eq('gateway_transaction_id', paymentId);
    } else if (membroId) {
      query = query.eq('membro_id', membroId).order('created_at', { ascending: false }).limit(1);
    }

    const { data: pagamento, error } = await query.single();

    if (error || !pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: pagamento.id,
      status: pagamento.status,
      valor: pagamento.valor,
      metodo_pagamento: pagamento.metodo_pagamento,
      data_pagamento: pagamento.data_pagamento,
      gateway_transaction_id: pagamento.gateway_transaction_id
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
