import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { webhook_url, webhook_type, bar_id } = await request.json();

    if (!webhook_url || !webhook_type || !bar_id) {
      return NextResponse.json(
        {
          error: 'webhook_url, webhook_type e bar_id são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Buscar configuração do webhook específico
    const { data: webhookConfig, error: configError } = await supabase
      .from('discord_webhooks')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('webhook_type', webhook_type)
      .eq('enabled', true)
      .single();

    if (configError || !webhookConfig) {
      return NextResponse.json(
        {
          error: 'Webhook não configurado ou desabilitado',
        },
        { status: 404 }
      );
    }

    // Criar mensagem de teste baseada no tipo
    let testMessage = '';
    let embedColor = 0x00d084; // Verde padrão

    switch (webhook_type) {
      case 'pix_recebido':
        testMessage =
          `💰 **TESTE - PIX RECEBIDO**\n\n` +
          `**Valor:** R$ 100,00\n` +
          `**Pagador:** João Silva\n` +
          `**TXID:** \`test_${Date.now()}\`\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0x00ff00; // Verde
        break;

      case 'pix_enviado':
        testMessage =
          `💸 **TESTE - PIX ENVIADO**\n\n` +
          `**Valor:** R$ 50,00\n` +
          `**Beneficiário:** Maria Santos\n` +
          `**TXID:** \`test_${Date.now()}\`\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0x0000ff; // Azul
        break;

      case 'boleto_vencido':
        testMessage =
          `📅 **TESTE - BOLETO VENCIDO**\n\n` +
          `**Nosso Número:** \`123456789\`\n` +
          `**Valor:** R$ 200,00\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0xffa500; // Laranja
        break;

      case 'boleto_pago':
        testMessage =
          `✅ **TESTE - BOLETO PAGO**\n\n` +
          `**Nosso Número:** \`123456789\`\n` +
          `**Valor Pago:** R$ 200,00\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0x00ff00; // Verde
        break;

      case 'checklist':
        testMessage =
          `✅ **TESTE - CHECKLIST**\n\n` +
          `**Tarefa:** Checklist de Abertura\n` +
          `**Status:** Concluído\n` +
          `**Responsável:** Funcionário Teste\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0x800080; // Roxo
        break;

      case 'contahub':
        testMessage =
          `🔄 **TESTE - CONTAHUB**\n\n` +
          `**Sincronização:** Dados contábeis\n` +
          `**Status:** Sucesso\n` +
          `**Registros:** 150 lançamentos\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0x008080; // Teal
        break;

      case 'erros':
        testMessage =
          `⚠️ **TESTE - ERRO DO SISTEMA**\n\n` +
          `**Erro:** Teste de notificação\n` +
          `**Módulo:** Sistema de Testes\n` +
          `**Severidade:** Baixa\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0xff0000; // Vermelho
        break;

      default:
        testMessage =
          `🔔 **TESTE - NOTIFICAÇÃO GERAL**\n\n` +
          `**Tipo:** ${webhook_type}\n` +
          `**Mensagem:** Teste de webhook\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
          `**Bar ID:** ${bar_id}`;
        embedColor = 0x00d084; // Verde padrão
    }

    // Criar embed para Discord
    const embed = {
      title: `Teste de Webhook - ${webhook_type.toUpperCase()}`,
      description: testMessage,
      color: embedColor,
      footer: {
        text: `SGB • Bar ${bar_id} • ${new Date().toLocaleDateString('pt-BR')}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Enviar para Discord
    const discordResponse = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `🧪 **TESTE DE WEBHOOK**\n\nEste é um teste do webhook \`${webhook_type}\` do SGB.`,
        embeds: [embed],
        username: 'SGB Test Bot',
        avatar_url:
          'https://cdn.discordapp.com/attachments/1234567890/1234567890/sgb-logo.png',
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error(
        '❌ Erro na resposta do Discord:',
        discordResponse.status,
        errorText
      );
      return NextResponse.json(
        {
          error: `Erro ao enviar para Discord: ${discordResponse.status}`,
        },
        { status: 500 }
      );
    }

    // Salvar log do teste
    await supabase.from('webhook_test_logs').insert({
      webhook_type,
      webhook_url: webhook_url.substring(0, 50) + '...',
      bar_id,
      status: 'success',
      response_status: discordResponse.status,
      test_data: {
        message: testMessage,
        embed: embed,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Webhook ${webhook_type} testado com sucesso!`,
      webhook_type,
      bar_id,
    });
  } catch (error) {
    console.error('❌ Erro ao testar webhook Discord:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
