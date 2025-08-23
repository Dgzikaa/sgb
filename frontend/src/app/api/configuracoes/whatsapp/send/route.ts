import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY =
  process.env.EVOLUTION_API_KEY || 'SGB-2024-WhatsApp-Evolution-API-Key';
const EVOLUTION_INSTANCE_NAME =
  process.env.EVOLUTION_INSTANCE_NAME || 'sgb-principal';
const WHATSAPP_SIMULATION_MODE =
  process.env.WHATSAPP_SIMULATION_MODE === 'true' ||
  !process.env.EVOLUTION_API_URL;

interface WhatsAppMessage {
  number: string;
  message: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  media?: {
    url?: string;
    base64?: string;
    filename?: string;
    caption?: string;
  };
}

interface ChecklistNotification {
  checklist_id: string;
  checklist_nome: string;
  bar_nome: string;
  deadline: string;
  responsavel: string;
  status: 'agendado' | 'em_andamento' | 'vencido' | 'concluido';
  prioridade: 'baixa' | 'normal' | 'alta' | 'critica';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      numbers,
      message,
      type = 'text',
      media,
      checklist_data,
    }: {
      numbers: string[];
      message?: string;
      type?: 'text' | 'template' | 'checklist_notification';
      media?: unknown;
      checklist_data?: ChecklistNotification;
    } = body;

    // Validar dados obrigatórios
    if (!numbers || numbers.length === 0) {
      return NextResponse.json(
        { error: 'Números de telefone são obrigatórios' },
        { status: 400 }
      );
    }

    // Preparar mensagem baseada no tipo
    let finalMessage = message;

    if (type === 'checklist_notification' && checklist_data) {
      finalMessage = formatChecklistMessage(checklist_data);
    }

    if (!finalMessage) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    const results: Array<{
      number: string;
      status: string;
      message_id: any;
      timestamp: string;
    }> = [];
    const errors: Array<{
      number: string;
      error: any;
    }> = [];

    // Enviar para cada número
    for (const number of numbers) {
      try {
        const cleanNumber = cleanPhoneNumber(number);
        const messageData: WhatsAppMessage = {
          number: cleanNumber,
          message: finalMessage,
          type: 'text',
          ...(media && typeof media === 'object' ? { media } : {}),
        };

        const response = await sendToEvolutionAPI(messageData);

        if (response.success) {
          results.push({
            number: cleanNumber,
            status: 'sent',
            message_id: response.key?.id,
            timestamp: new Date().toISOString(),
          });
        } else {
          errors.push({
            number: cleanNumber,
            error: response.error || 'Erro desconhecido',
          });
        }
      } catch (error) {
        errors.push({
          number,
          error: `Erro ao enviar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_sent: results.length,
      total_errors: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Erro na API WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para enviar para Evolution API
async function sendToEvolutionAPI(messageData: WhatsAppMessage) {
  // 🧪 MODO SIMULAÇÃO - Para testes sem WhatsApp real
  if (WHATSAPP_SIMULATION_MODE) {
    console.log('🧪 MODO SIMULAÇÃO - WhatsApp:', {
      to: messageData.number,
      message: messageData.message.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      simulated: true,
    });

    // Simular resposta bem-sucedida
    return {
      success: true,
      key: {
        id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
      message: 'Simulação: Mensagem enviada com sucesso',
      simulated: true,
    };
  }

  // 📱 MODO PRODUÇÃO - Envio real para Evolution API
  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

  const payload = {
    number: messageData.number,
    options: {
      delay: 1200,
      presence: 'composing',
    },
    textMessage: {
      text: messageData.message,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('❌ Erro Evolution API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para limpar número de telefone
function cleanPhoneNumber(number: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = number.replace(/\D/g, '');

  // Adiciona código do país se não tiver
  if (cleaned.length === 11 && cleaned.startsWith('11')) {
    cleaned = '55' + cleaned;
  } else if (cleaned.length === 10) {
    cleaned = '5511' + cleaned;
  } else if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

// Função para formatar mensagem de checklist
function formatChecklistMessage(data: ChecklistNotification): string {
  const statusEmojis = {
    agendado: '📅',
    em_andamento: '⏳',
    vencido: '🚨',
    concluido: '✅',
  };

  const prioridadeEmojis = {
    baixa: '🔵',
    normal: '🟡',
    alta: '🟠',
    critica: '🔴',
  };

  const deadline = new Date(data.deadline).toLocaleString('pt-BR');

  return `${statusEmojis[data.status]} *SGB - Checklist ${data.status.toUpperCase()}*

📋 *Checklist:* ${data.checklist_nome}
🏢 *Bar:* ${data.bar_nome}
👤 *Responsável:* ${data.responsavel}
⏰ *Prazo:* ${deadline}
${prioridadeEmojis[data.prioridade]} *Prioridade:* ${data.prioridade.toUpperCase()}

${data.status === 'vencido' ? '⚠️ *ATENÇÃO: Checklist vencido!*' : ''}
${data.status === 'agendado' ? '👆 *Acesse o sistema para executar*' : ''}

_Sistema de Gestão de Bares_`;
}

// GET - Verificar status da conexão
export async function GET() {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`,
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao verificar status');
    }

    const data = await response.json();

    return NextResponse.json({
      connected: data.instance?.state === 'open',
      status: data.instance?.state || 'unknown',
      instance: EVOLUTION_INSTANCE_NAME,
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
