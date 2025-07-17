import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { aiAgentManager, startAIAgent, stopAIAgent } from '@/lib/ai-agent-service';

// Configuraá§á£o do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema para configuraá§á£o do agente
const AgentConfigSchema = z.object({
  agente_ativo: z.boolean().optional(),
  frequencia_analise_minutos: z.number().int().min(5).max(1440).optional(), // 5min a 24h
  horario_analise_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  horario_analise_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  gerar_insights: z.boolean().optional(),
  detectar_anomalias: z.boolean().optional(),
  gerar_predicoes: z.boolean().optional(),
  gerar_recomendacoes: z.boolean().optional(),
  confianca_minima_insights: z.number().min(0).max(100).optional(),
  dias_historico_insights: z.number().int().min(7).max(365).optional(),
  max_insights_por_execucao: z.number().int().min(5).max(50).optional(),
  sensibilidade_anomalias: z.number().min(1).max(5).optional(),
  window_anomalias_horas: z.number().int().min(1).max(168).optional(),
  horizonte_predicao_dias: z.number().int().min(1).max(30).optional(),
  confianca_minima_predicoes: z.number().min(0).max(100).optional(),
  roi_minimo_recomendacoes: z.number().min(0).max(100).optional(),
  max_recomendacoes_ativas: z.number().int().min(5).max(50).optional(),
  notificar_insights: z.boolean().optional(),
  notificar_anomalias: z.boolean().optional(),
  notificar_predicoes_criticas: z.boolean().optional(),
  canais_notificacao: z.object({
    browser: z.boolean(),
    whatsapp: z.boolean(),
    email: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional(),
  retreinar_modelos_automaticamente: z.boolean().optional(),
  frequencia_retreino_dias: z.number().int().min(7).max(180).optional(),
  accuracy_minima_producao: z.number().min(0).max(100).optional(),
  timeout_processamento_minutos: z.number().int().min(5).max(120).optional(),
  max_memoria_mb: z.number().int().min(512).max(8192).optional(),
  log_debug: z.boolean().optional()
});

// ========================================
// ðŸ¤– GET /api/ai/agent (Status e configuraá§á£o)
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Apenas admins podem ver configuraá§áµes do agente
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem acessar configuraá§áµes do agente' }, { status: 403 });
    }

    // Buscar configuraá§á£o atual
    const { data: config, error: configError } = await supabase
      .from('ai_agent_config')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configuraá§á£o do agente:', configError);
      return NextResponse.json({ error: 'Erro ao buscar configuraá§á£o' }, { status: 500 });
    }

    // Status do agente no manager
    const agentsStatus = aiAgentManager.getAgentsStatus();
    const agentRunning = agentsStatus.some(a => a.barId === bar_id && a.running);

    // Buscar logs recentes
    const { data: logs } = await supabase
      .from('ai_agent_logs')
      .select(`
        id,
        tipo_processamento,
        nome_processo,
        status,
        data_inicio,
        data_fim,
        duracao_segundos,
        total_insights_gerados,
        total_anomalias_detectadas,
        total_predicoes_feitas,
        total_recomendacoes_criadas,
        erro_detalhes,
        executado_por
      `)
      .eq('bar_id', bar_id)
      .order('data_inicio', { ascending: false })
      .limit(10);

    // Calcular estatá­sticas das execuá§áµes
    const { data: execStats } = await supabase
      .from('ai_agent_logs')
      .select('status, duracao_segundos, data_inicio')
      .eq('bar_id', bar_id)
      .gte('data_inicio', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const estatisticas = {
      execucoes_ultima_semana: execStats?.length || 0,
      execucoes_sucesso: execStats?.filter((e) => e.status === 'concluido').length || 0,
      execucoes_erro: execStats?.filter((e) => e.status === 'erro').length || 0,
      tempo_medio_execucao: execStats?.length ? 
        execStats.filter((e) => e.duracao_segundos).reduce((acc: number, e) => acc + e.duracao_segundos, 0) / execStats.filter((e) => e.duracao_segundos).length : 0,
      ultima_execucao: logs?.[0]?.data_inicio || null,
      uptime_percentual: execStats?.length ? 
        ((execStats.filter((e) => e.status === 'concluido').length / execStats.length) * 100) : 0
    };

    // Prá³xima execuá§á£o estimada
    let proximaExecucao = null;
    if (config && config.agente_ativo && agentRunning) {
      const ultimaExec = logs?.find((l) => l.status === 'concluido');
      if (ultimaExec) {
        const ultima = new Date(ultimaExec.data_inicio);
        proximaExecucao = new Date(ultima.getTime() + config.frequencia_analise_minutos * 60 * 1000);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        configuracao: config,
        status: {
          agente_rodando: agentRunning,
          agente_configurado: !!config,
          proxima_execucao: proximaExecucao,
          dentro_horario_funcionamento: config ? isWithinWorkingHours(config) : false
        },
        logs_recentes: logs || [],
        estatisticas
      }
    });

  } catch (error) {
    console.error('Erro na API do agente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ¤– PUT /api/ai/agent (Atualizar configuraá§á£o)
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem configurar o agente' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AgentConfigSchema.parse(body);

    // Verificar se configuraá§á£o existe
    const { data: existing } = await supabase
      .from('ai_agent_config')
      .select('id, agente_ativo')
      .eq('bar_id', bar_id)
      .single();

    let result;
    if (existing) {
      // Atualizar configuraá§á£o existente
      const { data, error } = await supabase
        .from('ai_agent_config')
        .update(validatedData)
        .eq('bar_id', bar_id)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar configuraá§á£o:', error);
        return NextResponse.json({ error: 'Erro ao atualizar configuraá§á£o' }, { status: 500 });
      }
      result = data;
    } else {
      // Criar nova configuraá§á£o
      const { data, error } = await supabase
        .from('ai_agent_config')
        .insert({ bar_id, ...validatedData })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar configuraá§á£o:', error);
        return NextResponse.json({ error: 'Erro ao criar configuraá§á£o' }, { status: 500 });
      }
      result = data;
    }

    // Gerenciar agente baseado na configuraá§á£o
    if (result.agente_ativo) {
      // Se ativou o agente, iniciar
      await startAIAgent(bar_id);
    } else {
      // Se desativou, parar
      stopAIAgent(bar_id);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Configuraá§á£o atualizada com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API do agente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ¤– POST /api/ai/agent (Aá§áµes de controle)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem controlar o agente' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Aá§á£o á© obrigatá³ria' }, { status: 400 });
    }

    let message = '';
    let success = false;

    switch (action) {
      case 'start':
        success = await startAIAgent(bar_id);
        message = success ? 'Agente iniciado com sucesso' : 'Erro ao iniciar agente';
        break;

      case 'stop':
        stopAIAgent(bar_id);
        success = true;
        message = 'Agente parado com sucesso';
        break;

      case 'restart':
        stopAIAgent(bar_id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
        success = await startAIAgent(bar_id);
        message = success ? 'Agente reiniciado com sucesso' : 'Erro ao reiniciar agente';
        break;

      case 'run_analysis':
        // Forá§ar execuá§á£o manual de aná¡lise
        const agentsStatus = aiAgentManager.getAgentsStatus();
        const agentRunning = agentsStatus.some(a => a.barId === bar_id && a.running);
        
        if (!agentRunning) {
          return NextResponse.json({ error: 'Agente ná£o está¡ rodando' }, { status: 400 });
        }

        // Registrar execuá§á£o manual
        await supabase
          .from('ai_agent_logs')
          .insert({
            bar_id,
            tipo_processamento: 'analise_manual',
            nome_processo: 'Aná¡lise Manual Solicitada',
            status: 'iniciado',
            executado_por: 'usuario_manual'
          });

        success = true;
        message = 'Aná¡lise manual iniciada';
        break;

      case 'clear_logs':
        // Limpar logs antigos (manter áºltimos 30 dias)
        const { error: clearError } = await supabase
          .from('ai_agent_logs')
          .delete()
          .eq('bar_id', bar_id)
          .lt('data_inicio', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (clearError) {
          console.error('Erro ao limpar logs:', clearError);
          return NextResponse.json({ error: 'Erro ao limpar logs' }, { status: 500 });
        }

        success = true;
        message = 'Logs antigos removidos com sucesso';
        break;

      case 'reset_config':
        // Resetar configuraá§á£o para padráµes
        const defaultConfig = {
          agente_ativo: false,
          frequencia_analise_minutos: 60,
          horario_analise_inicio: '06:00',
          horario_analise_fim: '23:00',
          gerar_insights: true,
          detectar_anomalias: true,
          gerar_predicoes: true,
          gerar_recomendacoes: true,
          confianca_minima_insights: 70,
          sensibilidade_anomalias: 2.0,
          notificar_insights: true,
          notificar_anomalias: true,
          notificar_predicoes_criticas: true
        };

        const { error: resetError } = await supabase
          .from('ai_agent_config')
          .upsert({ bar_id, ...defaultConfig })
          .select();

        if (resetError) {
          console.error('Erro ao resetar configuraá§á£o:', resetError);
          return NextResponse.json({ error: 'Erro ao resetar configuraá§á£o' }, { status: 500 });
        }

        // Parar agente se estiver rodando
        stopAIAgent(bar_id);

        success = true;
        message = 'Configuraá§á£o resetada para padráµes';
        break;

      default:
        return NextResponse.json({ error: 'Aá§á£o invá¡lida' }, { status: 400 });
    }

    return NextResponse.json({
      success,
      message,
      data: {
        action_executed: action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na API do agente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ› ï¸ FUNá‡á•ES AUXILIARES
// ========================================

/**
 * Verifica se está¡ dentro do horá¡rio de funcionamento
 */
function isWithinWorkingHours(config): boolean {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  return currentTime >= config.horario_analise_inicio && 
         currentTime <= config.horario_analise_fim;
} 
