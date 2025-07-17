import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ConfiguraÃ§Ã£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// ðŸ“± GET /api/whatsapp/webhook
// ========================================
// VerificaÃ§Ã£o de webhook do WhatsApp
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Verificar se Ã© uma requisiÃ§Ã£o de verificaÃ§Ã£o vÃ¡lida
    if (mode === 'subscribe') {
      // Buscar configuraÃ§Ã£o para validar token
      const { data: configs } = await supabase
        .from('whatsapp_configuracoes')
        .select('webhook_verify_token, bar_id')
        .eq('ativo', true);

      // Verificar se o token coincide com alguma configuraÃ§Ã£o
      const validConfig = configs?.find((config: any) => config.webhook_verify_token === token);

      if (validConfig) {
        console.log('Webhook verificado com sucesso para bar_id:', validConfig.bar_id);
        return new Response(challenge, { status: 200 });
      } else {
        console.error('Token de verificaÃ§Ã£o invÃ¡lido:', token);
        return new Response('Token invÃ¡lido', { status: 403 });
      }
    }

    return new Response('VerificaÃ§Ã£o invÃ¡lida', { status: 400 });

  } catch (error) {
    console.error('Erro na verificaÃ§Ã£o do webhook:', error);
    return new Response('Erro interno', { status: 500 });
  }
}

// ========================================
// ðŸ“± POST /api/whatsapp/webhook
// ========================================
// Recebimento de webhooks do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const userAgent = request.headers.get('user-agent');
    const ipOrigem = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Payload JSON invÃ¡lido:', error);
      return NextResponse.json({ error: 'JSON invÃ¡lido' }, { status: 400 });
    }

    // Identificar bar_id pela estrutura do webhook
    const barId = await identifyBarFromWebhook(payload);
    if (!barId) {
      console.error('NÃ£o foi possÃ­vel identificar o bar do webhook');
      return NextResponse.json({ error: 'Bar nÃ£o identificado' }, { status: 400 });
    }

    // Verificar assinatura do webhook (opcional em desenvolvimento)
    const isSignatureValid = await verifyWebhookSignature(body, signature, barId);
    
    // Log do webhook recebido
    const webhookLog = {
      bar_id: barId,
      webhook_type: payload.object || 'unknown',
      payload: payload,
      processado: false,
      ip_origem: ipOrigem,
      user_agent: userAgent,
      signature_verified: isSignatureValid,
      received_at: new Date().toISOString()
    };

    const { data: logEntry } = await supabase
      .from('whatsapp_webhooks')
      .insert(webhookLog)
      .select()
      .single();

    // Processar webhook se for vÃ¡lido
    if (payload.object === 'whatsapp_business_account') {
      await processWhatsAppWebhook(payload, barId, logEntry?.id);
    }

    return NextResponse.json({ success: true, processed: true });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ========================================
// ðŸ”§ FUNÃ‡Ã•ES AUXILIARES
// ========================================

/**
 * Identifica o bar_id atravÃ©s do payload do webhook
 */
async function identifyBarFromWebhook(payload: any): Promise<number | null> {
  try {
    // Extrair phone_number_id do webhook
    const phoneNumberId = payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    
    if (!phoneNumberId) {
      return null;
    }

    // Buscar configuraÃ§Ã£o correspondente
    const { data: config } = await supabase
      .from('whatsapp_configuracoes')
      .select('bar_id')
      .eq('phone_number_id', phoneNumberId)
      .single();

    return config?.bar_id || null;

  } catch (error) {
    console.error('Erro ao identificar bar do webhook:', error);
    return null;
  }
}

/**
 * Verifica assinatura do webhook WhatsApp
 */
async function verifyWebhookSignature(body: string, signature: string | null, barId: number): Promise<boolean> {
  try {
    if (!signature) {
      return false; // Em produÃ§Ã£o, deve ser obrigatÃ³rio
    }

    // Buscar app secret da configuraÃ§Ã£o
    const { data: config } = await supabase
      .from('whatsapp_configuracoes')
      .select('webhook_verify_token') // Em produÃ§Ã£o, usar app_secret
      .eq('bar_id', barId)
      .single();

    if (!config) {
      return false;
    }

    // Calcular hash esperado
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', config.webhook_verify_token) // Em produÃ§Ã£o, usar app_secret
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

  } catch (error) {
    console.error('Erro ao verificar assinatura do webhook:', error);
    return false;
  }
}

/**
 * Processa webhook do WhatsApp Business
 */
async function processWhatsAppWebhook(payload: any, barId: number, webhookLogId?: number): Promise<void> {
  try {
    const entries = payload.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        // Processar atualizaÃ§Ãµes de status de mensagem
        if (value.statuses) {
          await processMessageStatuses(value.statuses, barId);
        }

        // Processar mensagens recebidas
        if (value.messages) {
          await processReceivedMessages(value.messages, barId);
        }
      }
    }

    // Marcar webhook como processado
    if (webhookLogId) {
      await supabase
        .from('whatsapp_webhooks')
        .update({
          processado: true,
          processado_em: new Date().toISOString()
        })
        .eq('id', webhookLogId);
    }

  } catch (error: any) {
    console.error('Erro ao processar webhook WhatsApp:', error);
    
    // Marcar webhook com erro
    if (webhookLogId) {
      await supabase
        .from('whatsapp_webhooks')
        .update({
          processado: false,
          erro_processamento: error.message || String(error)
        })
        .eq('id', webhookLogId);
    }
  }
}

/**
 * Processa atualizaÃ§Ãµes de status de mensagens
 */
async function processMessageStatuses(statuses: any[], barId: number): Promise<void> {
  for (const status of statuses) {
    const messageId = status.id;
    const newStatus = status.status; // sent, delivered, read, failed
    const timestamp = status.timestamp;
    const errorCode = status.errors?.[0]?.code;
    const errorMessage = status.errors?.[0]?.message;

    // Atualizar status da mensagem no banco
    const updateData: any = {
      status: newStatus,
      status_updated_at: new Date(parseInt(timestamp) * 1000).toISOString()
    };

    // Campos especÃ­ficos por status
    switch (newStatus) {
      case 'sent':
        updateData.enviado_em = updateData.status_updated_at;
        break;
      case 'delivered':
        updateData.entregue_em = updateData.status_updated_at;
        break;
      case 'read':
        updateData.lido_em = updateData.status_updated_at;
        break;
      case 'failed':
        updateData.error_code = errorCode;
        updateData.error_message = errorMessage;
        break;
    }

    // Atualizar mensagem
    const { data: updatedMessage } = await supabase
      .from('whatsapp_mensagens')
      .update(updateData)
      .eq('whatsapp_message_id', messageId)
      .eq('bar_id', barId)
      .select('contato_id')
      .single();

    // Atualizar estatÃ­sticas do contato se necessÃ¡rio
    if (updatedMessage && ['delivered', 'read'].includes(newStatus)) {
      const incrementField = newStatus === 'delivered' 
        ? 'total_mensagens_entregues' 
        : 'total_mensagens_lidas';

      await supabase.rpc('increment_contact_stat', {
        contact_id: updatedMessage.contato_id,
        field_name: incrementField
      });
    }
  }
}

/**
 * Processa mensagens recebidas (respostas dos usuÃ¡rios)
 */
async function processReceivedMessages(messages: any[], barId: number): Promise<void> {
  for (const message of messages) {
    const fromNumber = message.from;
    const messageText = message.text?.body || message.type;
    const timestamp = message.timestamp;

    // Buscar contato
    const { data: contato } = await supabase
      .from('whatsapp_contatos')
      .select('id')
      .eq('bar_id', barId)
      .eq('numero_whatsapp', fromNumber)
      .single();

    if (contato) {
      // Atualizar Ãºltima interaÃ§Ã£o do contato
      await supabase
        .from('whatsapp_contatos')
        .update({
          ultima_interacao: new Date(parseInt(timestamp) * 1000).toISOString()
        })
        .eq('id', contato.id);

      // Log da mensagem recebida (opcional)
      await supabase
        .from('whatsapp_mensagens')
        .insert({
          bar_id: barId,
          contato_id: contato.id,
          tipo_mensagem: 'received',
          conteudo: messageText,
          status: 'read',
          whatsapp_message_id: message.id,
          recebido_em: new Date(parseInt(timestamp) * 1000).toISOString()
        });
    }
  }
}

// ========================================
// ðŸ“Š FUNÃ‡ÃƒO PARA CRIAR RPC NO BANCO
// ========================================
/*
-- Executar no Supabase para criar funÃ§Ã£o RPC
CREATE OR REPLACE FUNCTION increment_contact_stat(
  contact_id INTEGER,
  field_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF field_name = 'total_mensagens_entregues' THEN
    UPDATE whatsapp_contatos 
    SET total_mensagens_entregues = total_mensagens_entregues + 1 
    WHERE id = contact_id;
  ELSIF field_name = 'total_mensagens_lidas' THEN
    UPDATE whatsapp_contatos 
    SET total_mensagens_lidas = total_mensagens_lidas + 1 
    WHERE id = contact_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
*/ 
