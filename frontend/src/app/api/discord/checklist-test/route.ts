import { NextRequest, NextResponse } from 'next/server';
import DiscordChecklistService from '@/lib/discord-checklist-service';

// ========================================
// 🧪 API PARA TESTAR INTEGRAÇÃO DISCORD + CHECKLISTS
// ========================================

export async function GET() {
  try {
    console.log('🧪 Iniciando teste de conexão Discord Checklist...');

    // Testar conexão básica
    const connectionTest = await DiscordChecklistService.testConnection();

    if (!connectionTest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falha na conexão com Discord',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão Discord Checklist testada com sucesso!',
      webhook_status: 'funcionando',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao testar Discord Checklist:', error);
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

export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json();

    console.log(`🧪 Testando envio de ${type} para Discord...`);

    switch (type) {
      case 'alert': {
        const alertTest = await DiscordChecklistService.sendAlert({
          id: 'test-alert-001',
          checklistId: 'checklist-test',
          titulo: 'Teste de Alerta - Checklist Abertura',
          categoria: 'Cozinha',
          nivel: 'alto',
          tempoAtraso: 125, // 2h e 5min
          horaEsperada: '07:00',
          responsavel: 'João Silva (Teste)',
          setor: 'Cozinha',
          mensagem: '🚨 TESTE: Checklist de abertura está 2h e 5min atrasado!',
        });

        return NextResponse.json({
          success: alertTest,
          type: 'alert',
          message: alertTest
            ? 'Alerta de teste enviado!'
            : 'Falha ao enviar alerta',
        });
      }

      case 'critical_alert': {
        const criticalTest = await DiscordChecklistService.sendCriticalAlert({
          id: 'test-critical-001',
          checklistId: 'checklist-test-critical',
          titulo: 'Teste CRÍTICO - Segurança Noturna',
          categoria: 'Segurança',
          nivel: 'critico',
          tempoAtraso: 520, // 8h e 40min
          horaEsperada: '20:00',
          responsavel: 'Maria Santos (Teste)',
          setor: 'Segurança',
          mensagem:
            '🔴 TESTE CRÍTICO: Checklist de segurança não executado há mais de 8 horas!',
        });

        return NextResponse.json({
          success: criticalTest,
          type: 'critical_alert',
          message: criticalTest
            ? 'Alerta crítico de teste enviado!'
            : 'Falha ao enviar alerta crítico',
        });
      }

      case 'completion': {
        const completionTest = await DiscordChecklistService.sendCompletion({
          id: 'exec-test-001',
          checklist_id: 'checklist-test-completion',
          titulo: 'Teste - Checklist Limpeza Semanal',
          responsavel: 'Carlos Oliveira (Teste)',
          setor: 'Cozinha',
          tempo_execucao: 42,
          total_itens: 15,
          itens_ok: 14,
          itens_problema: 1,
          status: 'concluido',
          observacoes_gerais:
            'Teste de execução - tudo funcionando perfeitamente! 🎯',
          concluido_em: new Date().toISOString(),
          pontuacao_final: 93.3,
        });

        return NextResponse.json({
          success: completionTest,
          type: 'completion',
          message: completionTest
            ? 'Notificação de conclusão enviada!'
            : 'Falha ao enviar notificação',
        });
      }

      case 'daily_report': {
        const reportTest = await DiscordChecklistService.sendDailyReport({
          total_execucoes: 12,
          execucoes_concluidas: 10,
          execucoes_pendentes: 2,
          tempo_medio_execucao: 38.5,
          score_medio: 89.2,
          alertas_ativos: 3,
          alertas_criticos: 1,
        });

        return NextResponse.json({
          success: reportTest,
          type: 'daily_report',
          message: reportTest
            ? 'Relatório diário de teste enviado!'
            : 'Falha ao enviar relatório',
        });
      }

      case 'anomaly': {
        const anomalyTest = await DiscordChecklistService.sendAnomalyAlert({
          titulo: 'Queda na Taxa de Conclusão de Checklists',
          tipo_anomalia: 'performance_checklist',
          severidade: 'alta',
          confianca_deteccao: 0.87,
          valor_esperado: 85,
          valor_observado: 62,
          desvio_percentual: -27.1,
          possivel_causa:
            'Possível sobrecarga de funcionários ou problemas operacionais',
          acoes_sugeridas: [
            '• Verificar escala de funcionários',
            '• Revisar prioridade dos checklists',
            '• Investigar problemas operacionais',
          ],
        });

        return NextResponse.json({
          success: anomalyTest,
          type: 'anomaly',
          message: anomalyTest
            ? 'Alerta de anomalia enviado!'
            : 'Falha ao enviar anomalia',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Tipo de teste não reconhecido',
            available_types: [
              'alert',
              'critical_alert',
              'completion',
              'daily_report',
              'anomaly',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Erro ao executar teste:', error);
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
