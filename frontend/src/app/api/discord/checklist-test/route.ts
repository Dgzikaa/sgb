import { NextRequest, NextResponse } from 'next/server'
import DiscordChecklistService from '@/lib/discord-checklist-service'

// ========================================
// ðŸ§ª API PARA TESTAR INTEGRAÃ‡ÃƒO DISCORD + CHECKLISTS
// ========================================

export async function GET(req: NextRequest) {
  try {
    console.log('ðŸ§ª Iniciando teste de conexÃ£o Discord Checklist...')
    
    // Testar conexÃ£o bÃ¡sica
    const connectionTest = await DiscordChecklistService.testConnection()
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Falha na conexÃ£o com Discord'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'ConexÃ£o Discord Checklist testada com sucesso!',
      webhook_status: 'funcionando',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('âŒ Erro ao testar Discord Checklist:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json()

    console.log(`ðŸ§ª Testando envio de ${type} para Discord...`)

    switch (type) {
      case 'alert':
        const alertTest = await DiscordChecklistService.sendAlert({
          id: 'test-alert-001',
          checklistId: 'checklist-test',
          titulo: 'Teste de Alerta - Checklist Abertura',
          categoria: 'Cozinha',
          nivel: 'alto',
          tempoAtraso: 125, // 2h e 5min
          horaEsperada: '07:00',
          responsavel: 'JoÃ£o Silva (Teste)',
          setor: 'Cozinha',
          mensagem: 'ðŸš¨ TESTE: Checklist de abertura estÃ¡ 2h e 5min atrasado!'
        })
        
        return NextResponse.json({
          success: alertTest,
          type: 'alert',
          message: alertTest ? 'Alerta de teste enviado!' : 'Falha ao enviar alerta'
        })

      case 'critical_alert':
        const criticalTest = await DiscordChecklistService.sendCriticalAlert({
          id: 'test-critical-001',
          checklistId: 'checklist-test-critical',
          titulo: 'Teste CRÃTICO - SeguranÃ§a Noturna',
          categoria: 'SeguranÃ§a',
          nivel: 'critico',
          tempoAtraso: 520, // 8h e 40min
          horaEsperada: '20:00',
          responsavel: 'Maria Santos (Teste)',
          setor: 'SeguranÃ§a',
          mensagem: 'ðŸ”´ TESTE CRÃTICO: Checklist de seguranÃ§a nÃ£o executado hÃ¡ mais de 8 horas!'
        })
        
        return NextResponse.json({
          success: criticalTest,
          type: 'critical_alert',
          message: criticalTest ? 'Alerta crÃ­tico de teste enviado!' : 'Falha ao enviar alerta crÃ­tico'
        })

      case 'completion':
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
          observacoes_gerais: 'Teste de execuÃ§Ã£o - tudo funcionando perfeitamente! ðŸŽ¯',
          concluido_em: new Date().toISOString(),
          pontuacao_final: 93.3
        })
        
        return NextResponse.json({
          success: completionTest,
          type: 'completion',
          message: completionTest ? 'NotificaÃ§Ã£o de conclusÃ£o enviada!' : 'Falha ao enviar notificaÃ§Ã£o'
        })

      case 'daily_report':
        const reportTest = await DiscordChecklistService.sendDailyReport({
          total_execucoes: 12,
          execucoes_concluidas: 10,
          execucoes_pendentes: 2,
          tempo_medio_execucao: 38.5,
          score_medio: 89.2,
          alertas_ativos: 3,
          alertas_criticos: 1
        })
        
        return NextResponse.json({
          success: reportTest,
          type: 'daily_report',
          message: reportTest ? 'RelatÃ³rio diÃ¡rio de teste enviado!' : 'Falha ao enviar relatÃ³rio'
        })

      case 'anomaly':
        const anomalyTest = await DiscordChecklistService.sendAnomalyAlert({
          titulo: 'Queda na Taxa de ConclusÃ£o de Checklists',
          tipo_anomalia: 'performance_checklist',
          severidade: 'alta',
          confianca_deteccao: 0.87,
          valor_esperado: 85,
          valor_observado: 62,
          desvio_percentual: -27.1,
          possivel_causa: 'PossÃ­vel sobrecarga de funcionÃ¡rios ou problemas operacionais',
          acoes_sugeridas: [
            'â€¢ Verificar escala de funcionÃ¡rios',
            'â€¢ Revisar prioridade dos checklists',
            'â€¢ Investigar problemas operacionais'
          ]
        })
        
        return NextResponse.json({
          success: anomalyTest,
          type: 'anomaly',
          message: anomalyTest ? 'Alerta de anomalia enviado!' : 'Falha ao enviar anomalia'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de teste nÃ£o reconhecido',
          available_types: ['alert', 'critical_alert', 'completion', 'daily_report', 'anomaly']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('âŒ Erro ao executar teste:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
