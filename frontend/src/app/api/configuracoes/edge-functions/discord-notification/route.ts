import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('🔄 Discord Notification API - Dados recebidos:', {
      bar_id: body.bar_id,
      title: body.title,
      webhook_type: body.webhook_type,
      hasDescription: !!body.description,
      hasFields: !!body.fields,
    });

    // Validar se bar_id foi fornecido
    if (!body.bar_id || !body.title) {
      console.error('❌ Validação falhou:', {
        bar_id: body.bar_id,
        title: body.title,
      });
      return NextResponse.json(
        { success: false, error: 'bar_id e title são obrigatórios' },
        { status: 400 }
      );
    }

    // Usar service role para bypass RLS

    // Buscar webhook específico do sistema
    const webhookTypeMap: Record<string, string> = {
      sistema: 'sistema',
      meta: 'meta',
      checklists: 'checklists',
      contahub: 'contahub',
      vendas: 'vendas',
      reservas: 'reservas',
    };

    const webhookType = body.webhook_type || 'sistema';
    const sistema = webhookTypeMap[webhookType as keyof typeof webhookTypeMap];

    console.log('🎯 Buscando webhook:', { webhookType, sistema });

    if (!sistema) {
      console.error('❌ Tipo de webhook não mapeado:', webhookType);
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de webhook não suportado: ${webhookType}`,
        },
        { status: 400 }
      );
    }

    // Buscar webhook no sistema específico
    const { data: webhookData, error: webhookError } = await supabaseAdmin
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', body.bar_id)
      .eq('sistema', sistema)
      .eq('ambiente', 'producao')
      .maybeSingle();

    console.log('📊 Webhook do banco:', { webhookData, webhookError });

    let webhookUrl = '';
    if (
      !webhookError &&
      webhookData &&
      webhookData.configuracoes?.webhook_url
    ) {
      webhookUrl = webhookData.configuracoes.webhook_url;
      console.log(`✅ Webhook ${webhookType} encontrado no sistema ${sistema}`);
    } else {
      console.log(
        `⚠️ Webhook ${webhookType} não encontrado no sistema ${sistema}`
      );
    }

    console.log('🎯 Webhook selecionado:', {
      webhookType,
      webhookUrl: webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'VAZIO',
      hasUrl: !!webhookUrl,
    });

    if (!webhookUrl || webhookUrl === '') {
      console.error('❌ Webhook não configurado:', { webhookType, sistema });
      return NextResponse.json(
        { success: false, error: `Webhook ${webhookType} não configurado` },
        { status: 400 }
      );
    }

    // Criar o embed para Discord
    const embed = {
      title: body.title,
      description: body.description || '',
      color: body.color || 0x00d084,
      fields: body.fields || [],
      footer: {
        text: `SGB Analytics • Bar ${body.bar_id} • ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Enviar para Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: body.content || null,
        embeds: [embed],
        username: 'SGB Analytics',
        avatar_url:
          'https://cdn.discordapp.com/attachments/1234567890/1234567890/sgb-logo.png',
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('❌ Erro Discord:', {
        status: discordResponse.status,
        error: errorText,
        webhook_type: webhookType,
        webhook_url: webhookUrl.substring(0, 50) + '...',
      });
      return NextResponse.json(
        {
          success: false,
          error: `Erro Discord: ${discordResponse.status} - ${errorText}`,
        },
        { status: 400 }
      );
    }

    console.log(`✅ Webhook ${webhookType} enviado com sucesso para Discord`);
    return NextResponse.json({
      success: true,
      message: `Webhook ${webhookType} enviado com sucesso`,
      webhook_type: webhookType,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro no webhook Discord:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
