import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SEGURANÇA: Verificar assinatura do Mercado Pago
function verifyMercadoPagoSignature(body: string, signature: string): boolean {
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    console.warn('⚠️ MERCADO_PAGO_WEBHOOK_SECRET não configurado')
    return true // Em desenvolvimento, aceitar sem verificação
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature') || ''
    
    // SEGURANÇA: Verificar assinatura
    if (!verifyMercadoPagoSignature(body, signature)) {
      console.error('🚨 WEBHOOK: Assinatura inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const webhookData = JSON.parse(body)
    console.log('📨 WEBHOOK Mercado Pago recebido:', webhookData)

    // Extrair dados do webhook
    const { action, data, id: webhookId } = webhookData
    
    if (action !== 'payment.updated' && action !== 'payment.created') {
      console.log('📋 WEBHOOK ignorado - ação não relevante:', action)
      return NextResponse.json({ status: 'ignored' })
    }

    const paymentId = data?.id
    if (!paymentId) {
      console.error('🚨 WEBHOOK: Payment ID não encontrado')
      return NextResponse.json({ error: 'Payment ID missing' }, { status: 400 })
    }

    // Buscar dados do pagamento no nosso banco
    const { data: pagamento, error: errorPagamento } = await supabase
      .from('fidelidade_pagamentos')
      .select('*')
      .eq('gateway_transaction_id', paymentId)
      .single()

    if (errorPagamento || !pagamento) {
      console.error('🚨 WEBHOOK: Pagamento não encontrado no banco:', paymentId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Buscar dados do pagamento no Mercado Pago
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      console.error('🚨 WEBHOOK: MERCADO_PAGO_ACCESS_TOKEN não configurado')
      return NextResponse.json({ error: 'MP token missing' }, { status: 500 })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    })

    if (!mpResponse.ok) {
      console.error('🚨 WEBHOOK: Erro ao consultar Mercado Pago:', mpResponse.status)
      return NextResponse.json({ error: 'MP API error' }, { status: 500 })
    }

    const mpPayment = await mpResponse.json()
    console.log('💳 WEBHOOK: Dados do pagamento MP:', {
      id: mpPayment.id,
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      external_reference: mpPayment.external_reference
    })

    // Atualizar status do pagamento no banco
    const { error: errorUpdate } = await supabase
      .from('fidelidade_pagamentos')
      .update({
        status: mpPayment.status,
        gateway_response: mpPayment,
        data_confirmacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pagamento.id)

    if (errorUpdate) {
      console.error('🚨 WEBHOOK: Erro ao atualizar pagamento:', errorUpdate)
    }

    // CRÍTICO: Processar pagamento aprovado
    if (mpPayment.status === 'approved' && pagamento.status !== 'aprovado') {
      console.log('✅ WEBHOOK: Processando pagamento aprovado:', paymentId)
      await processApprovedPayment(pagamento.membro_id, mpPayment.transaction_amount)
      
      // Log de auditoria
      await supabase.from('fidelidade_pagamentos_logs').insert({
        pagamento_id: pagamento.id,
        acao: 'aprovado_via_webhook',
        dados_webhook: webhookData,
        dados_mp: mpPayment,
        ip_origem: request.headers.get('x-forwarded-for') || request.ip
      })
    }

    return NextResponse.json({ status: 'processed' })

  } catch (error) {
    console.error('🚨 WEBHOOK: Erro geral:', error)
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    )
  }
}

// FUNÇÃO SEGURA: Processar pagamento aprovado
async function processApprovedPayment(membroId: string, valor: number) {
  try {
    console.log(`🎯 WEBHOOK: Ativando membro ${membroId} com valor R$ ${valor}`)

    // SEGURANÇA: Usar transação para operações críticas
    const { data, error } = await supabase.rpc('processar_pagamento_aprovado', {
      p_membro_id: membroId,
      p_valor_pagamento: valor,
      p_credito_mensal: 150.00 // R$ 150 de crédito
    })

    if (error) {
      console.error('🚨 WEBHOOK: Erro na função RPC:', error)
      throw error
    }

    console.log('✅ WEBHOOK: Membro ativado com sucesso:', data)

    // Enviar email de confirmação
    await sendPaymentConfirmationEmail(membroId, valor)

  } catch (error) {
    console.error('🚨 WEBHOOK: Erro ao processar pagamento:', error)
    
    // Log crítico para monitoramento
    await supabase.from('fidelidade_pagamentos_erros').insert({
      membro_id: membroId,
      valor_pagamento: valor,
      erro: error instanceof Error ? error.message : 'Unknown error',
      stack_trace: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}

// FUNÇÃO: Enviar email de confirmação
async function sendPaymentConfirmationEmail(membroId: string, valor: number) {
  try {
    // Buscar dados do membro
    const { data: membro } = await supabase
      .from('fidelidade_membros')
      .select('nome, email, qr_token')
      .eq('id', membroId)
      .single()

    if (!membro) {
      console.error('🚨 EMAIL: Membro não encontrado:', membroId)
      return
    }

    // Gerar link do cartão
    const cartaoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${membro.qr_token}`

    // Enviar email via API
    await fetch('/api/emails/payment-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: membro.email,
        memberName: membro.nome,
        amount: valor,
        cardUrl: cartaoUrl
      })
    })

    console.log('📧 EMAIL: Confirmação enviada para:', membro.email)

  } catch (error) {
    console.error('🚨 EMAIL: Erro ao enviar confirmação:', error)
  }
}