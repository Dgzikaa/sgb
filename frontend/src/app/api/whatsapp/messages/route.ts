import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Configuraá§á£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema de validaá§á£o para enviar mensagem
const SendMessageSchema = z.object({
  destinatario: z.string().min(1, 'Destinatá¡rio á© obrigatá³rio'),
  tipo_mensagem: z.enum(['text', 'template'], { 
    required_error: 'Tipo de mensagem á© obrigatá³rio' 
  }),
  conteudo: z.string().min(1, 'Conteáºdo á© obrigatá³rio'),
  template_name: z.string().optional(),
  template_parameters: z.array(z.string()).optional(),
  modulo: z.string().optional(),
  checklist_id: z.number().optional(),
  checklist_execucao_id: z.number().optional(),
  prioridade: z.enum(['baixa', 'normal', 'alta']).default('normal')
});

// Schema para filtros de listagem
const FilterSchema = z.object({
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).optional(),
  modulo: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  destinatario: z.string().optional(),
  template_name: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// ========================================
// ðŸ“± GET /api/whatsapp/messages
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para acessar mensagens' }, { status: 403 });
    }

    // Parse dos pará¢metros de query
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    // Converter tipos numá©ricos
    const processedParams: any = { ...rawParams };
    if (processedParams.page) processedParams.page = parseInt(processedParams.page);
    if (processedParams.limit) processedParams.limit = parseInt(processedParams.limit);

    const params = FilterSchema.parse(processedParams);

    // Construir query base
    let query = supabase
      .from('whatsapp_mensagens')
      .select(`
        id,
        whatsapp_message_id,
        tipo_mensagem,
        template_name,
        conteudo,
        status,
        error_message,
        tentativas,
        enviado_em,
        entregue_em,
        lido_em,
        modulo,
        checklist_id,
        checklist_execucao_id,
        created_at,
        whatsapp_contatos!inner(
          numero_whatsapp,
          nome_contato,
          usuarios_bar!inner(nome, cargo)
        )
      `)
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.modulo) {
      query = query.eq('modulo', params.modulo);
    }
    if (params.template_name) {
      query = query.eq('template_name', params.template_name);
    }
    if (params.data_inicio) {
      query = query.gte('created_at', params.data_inicio);
    }
    if (params.data_fim) {
      query = query.lte('created_at', params.data_fim);
    }
    if (params.destinatario) {
      query = query.ilike('whatsapp_contatos.numero_whatsapp', `%${params.destinatario}%`);
    }

    // Paginaá§á£o
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);

    const { data: mensagens, error } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
    }

    // Buscar estatá­sticas
    const { data: stats } = await supabase
      .from('whatsapp_mensagens')
      .select('status')
      .eq('bar_id', bar_id);

    const estatisticas = {
      total: stats?.length || 0,
      pending: stats?.filter((m: any) => m.status === 'pending').length || 0,
      sent: stats?.filter((m: any) => m.status === 'sent').length || 0,
      delivered: stats?.filter((m: any) => m.status === 'delivered').length || 0,
      read: stats?.filter((m: any) => m.status === 'read').length || 0,
      failed: stats?.filter((m: any) => m.status === 'failed').length || 0
    };

    return NextResponse.json({
      success: true,
      data: mensagens,
      estatisticas,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: mensagens?.length || 0,
        hasNext: mensagens?.length === params.limit
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Pará¢metros invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ“± POST /api/whatsapp/messages
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao, usuario_id } = JSON.parse(userData);

    // Verificar permissáµes
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para enviar mensagens' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = SendMessageSchema.parse(body);

    // Verificar se WhatsApp está¡ configurado
    const { data: config, error: configError } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'WhatsApp ná£o configurado ou inativo' 
      }, { status: 409 });
    }

    // Buscar ou criar contato
    let contato = await getOrCreateContact(bar_id, validatedData.destinatario, usuario_id);
    
    if (!contato) {
      return NextResponse.json({ 
        error: 'Ná£o foi possá­vel identificar o contato' 
      }, { status: 400 });
    }

    // Verificar se contato aceita notificaá§áµes
    if (!contato.aceita_notificacoes) {
      return NextResponse.json({ 
        error: 'Contato ná£o aceita notificaá§áµes WhatsApp' 
      }, { status: 409 });
    }

    // Verificar horá¡rio permitido
    if (!isWithinAllowedHours(contato)) {
      return NextResponse.json({ 
        error: 'Fora do horá¡rio permitido para envio' 
      }, { status: 409 });
    }

    // Preparar dados da mensagem
    const messageData = {
      bar_id,
      contato_id: contato.id,
      tipo_mensagem: validatedData.tipo_mensagem,
      template_name: validatedData.template_name,
      conteudo: validatedData.conteudo,
      template_parameters: validatedData.template_parameters || [],
      modulo: validatedData.modulo || 'manual',
      checklist_id: validatedData.checklist_id,
      checklist_execucao_id: validatedData.checklist_execucao_id,
      status: 'pending'
    };

    // Salvar mensagem no banco
    const { data: mensagem, error: saveError } = await supabase
      .from('whatsapp_mensagens')
      .insert(messageData)
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar mensagem:', saveError);
      return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 });
    }

    // Enviar mensagem via WhatsApp API
    const sendResult = await sendWhatsAppMessage(config, contato, mensagem);

    // Atualizar status da mensagem
    const updateData: any = {
      status: sendResult.success ? 'sent' : 'failed',
      whatsapp_message_id: sendResult.messageId,
      tentativas: 1,
      enviado_em: sendResult.success ? new Date().toISOString() : null,
      error_code: sendResult.errorCode,
      error_message: sendResult.errorMessage
    };

    await supabase
      .from('whatsapp_mensagens')
      .update(updateData)
      .eq('id', mensagem.id);

    // Atualizar estatá­sticas do contato
    if (sendResult.success) {
      await supabase
        .from('whatsapp_contatos')
        .update({
          total_mensagens_enviadas: contato.total_mensagens_enviadas + 1,
          ultima_interacao: new Date().toISOString()
        })
        .eq('id', contato.id);
    }

    return NextResponse.json({
      success: sendResult.success,
      data: { ...mensagem, ...updateData },
      message: sendResult.success ? 'Mensagem enviada com sucesso' : 'Falha no envio',
      details: sendResult.errorMessage
    }, { status: sendResult.success ? 201 : 400 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ”§ FUNá‡á•ES AUXILIARES
// ========================================

/**
 * Busca ou cria contato WhatsApp
 */
async function getOrCreateContact(barId: number, numeroWhatsapp: string, usuarioId?: number) {
  // Primeiro, tentar buscar contato existente
  let { data: contato } = await supabase
    .from('whatsapp_contatos')
    .select('*')
    .eq('bar_id', barId)
    .eq('numero_whatsapp', numeroWhatsapp)
    .single();

  if (contato) {
    return contato;
  }

  // Se ná£o encontrou e tem usuarioId, criar novo contato
  if (usuarioId) {
    // Buscar dados do usuá¡rio
    const { data: usuario } = await supabase
      .from('usuarios_bar')
      .select('nome')
      .eq('id', usuarioId)
      .single();

    if (usuario) {
      const { data: novoContato } = await supabase
        .from('whatsapp_contatos')
        .insert({
          bar_id: barId,
          usuario_id: usuarioId,
          numero_whatsapp: numeroWhatsapp,
          nome_contato: usuario.nome,
          verificado: false
        })
        .select()
        .single();

      return novoContato;
    }
  }

  return null;
}

/**
 * Verifica se está¡ dentro do horá¡rio permitido
 */
function isWithinAllowedHours(contato: any): boolean {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  const currentDay = now.getDay() + 1; // 1=Domingo

  // Verificar dia da semana
  if (!contato.dias_semana.includes(currentDay)) {
    return false;
  }

  // Verificar horá¡rio
  return currentTime >= contato.horario_inicio && currentTime <= contato.horario_fim;
}

/**
 * Envia mensagem via WhatsApp Business API
 */
async function sendWhatsAppMessage(config: any, contato: any, mensagem: any): Promise<{
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    const url = `https://graph.facebook.com/${config.api_version}/${config.phone_number_id}/messages`;
    
    let payload: any = {
      messaging_product: 'whatsapp',
      to: contato.numero_whatsapp
    };

    if (mensagem.tipo_mensagem === 'template') {
      payload.type = 'template';
      payload.template = {
        name: mensagem.template_name,
        language: { code: config.idioma },
        components: []
      };

      // Adicionar pará¢metros se existirem
      if (mensagem.template_parameters && mensagem.template_parameters.length > 0) {
        payload.template.components.push({
          type: 'body',
          parameters: mensagem.template_parameters.map((param: string) => ({
            type: 'text',
            text: param
          }))
        });
      }
    } else {
      payload.type = 'text';
      payload.text = { body: mensagem.conteudo };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: result.messages[0].id
      };
    } else {
      return {
        success: false,
        errorCode: result.error?.code?.toString(),
        errorMessage: result.error?.message || 'Erro desconhecido'
      };
    }

  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: 'Erro de conexá£o com WhatsApp API'
    };
  }
} 
