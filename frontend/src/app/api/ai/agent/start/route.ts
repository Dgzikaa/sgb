import { NextRequest, NextResponse } from 'next/server';
import { AIIntelligentAgent } from '@/lib/ai-agent-service';

// ========================================
// Ã°Å¸Å¡â‚¬ API PARA INICIAR AGENTE IA
// ========================================

const agentesAtivos: Map<number, AIIntelligentAgent> = new Map();

// ========================================
// Ã°Å¸Å¡â‚¬ POST /api/ai/agent/start
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id } = body;

    if (!bar_id) {
      return NextResponse.json({
        success: false,
        error: 'bar_id Ã¡Â© obrigatÃ¡Â³rio'
      }, { status: 400 });
    }

    // Verificar se agente jÃ¡Â¡ estÃ¡Â¡ rodando
    if (agentesAtivos.has(bar_id)) {
      return NextResponse.json({
        success: true,
        message: 'Agente IA jÃ¡Â¡ estÃ¡Â¡ ativo',
        bar_id,
        status: 'running'
      });
    }

    // Criar e inicializar novo agente
    const agent = new AIIntelligentAgent(bar_id);
    const initialized = await agent.initialize();

    if (!initialized) {
      return NextResponse.json({
        success: false,
        error: 'Falha ao inicializar agente - verifique configuraÃ¡Â§Ã¡Â£o na tabela ai_agent_config'
      }, { status: 400 });
    }

    // Iniciar agente
    await agent.startAgent();
    agentesAtivos.set(bar_id, agent);

    console.log(`Ã°Å¸Â¤â€“ Agente IA iniciado para bar ${bar_id}`);

    return NextResponse.json({
      success: true,
      message: 'Agente IA iniciado com sucesso',
      bar_id,
      status: 'started',
      funcionalidades: [
        'AnÃ¡Â¡lise automÃ¡Â¡tica a cada 30 minutos',
        'DetecÃ¡Â§Ã¡Â£o de anomalias em tempo real',
        'GeraÃ¡Â§Ã¡Â£o de insights estratÃ¡Â©gicos',
        'RelatÃ¡Â³rio matinal Ã¡Â s 8h no Discord',
        'NotificaÃ¡Â§Ã¡Âµes de eventos crÃ¡Â­ticos',
        'RecomendaÃ¡Â§Ã¡Âµes baseadas em IA'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao iniciar agente IA:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€œÅ  GET /api/ai/agent/start (Status)
// ========================================
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const bar_id = parseInt(url.searchParams.get('bar_id') || '3');

    const status = {
      bar_id,
      agente_ativo: agentesAtivos.has(bar_id),
      total_agentes_ativos: agentesAtivos.size,
      agentes_rodando: Array.from(agentesAtivos.keys()),
      configuracao: {
        analise_frequencia: '30 minutos',
        horario_funcionamento: '06:00 - 23:59',
        relatorio_matinal: '08:00',
        canais_notificacao: ['Discord', 'WhatsApp'],
        funcionalidades_ativas: {
          gerar_insights: true,
          detectar_anomalias: true,
          fazer_predicoes: true,
          gerar_recomendacoes: true,
          notificacoes_automaticas: true
        }
      },
      instrucoes: [
        'Ã°Å¸â€œÂ¡ Para iniciar: POST /api/ai/agent/start com {"bar_id": 3}',
        'Ã°Å¸â€ºâ€˜ Para parar: POST /api/ai/agent/stop com {"bar_id": 3}',
        'Ã°Å¸â€œÅ  Para status: GET /api/ai/agent/start?bar_id=3',
        'Ã°Å¸Å½Â® Discord Bot: Pergunte qualquer coisa no canal Discord'
      ]
    };

    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€ºâ€˜ DELETE /api/ai/agent/start (Parar)
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id } = body;

    if (!bar_id) {
      return NextResponse.json({
        success: false,
        error: 'bar_id Ã¡Â© obrigatÃ¡Â³rio'
      }, { status: 400 });
    }

    const agent = agentesAtivos.get(bar_id);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agente nÃ¡Â£o estÃ¡Â¡ rodando'
      }, { status: 400 });
    }

    // Parar agente
    agent.stopAgent();
    agentesAtivos.delete(bar_id);

    console.log(`Ã°Å¸â€ºâ€˜ Agente IA parado para bar ${bar_id}`);

    return NextResponse.json({
      success: true,
      message: 'Agente IA parado com sucesso',
      bar_id,
      status: 'stopped',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao parar agente IA:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 

