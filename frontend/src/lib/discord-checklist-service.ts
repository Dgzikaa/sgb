// ========================================
// 📋 DISCORD CHECKLIST NOTIFICATION SERVICE
// ========================================

interface ChecklistAlert {
  id: string;
  checklistId: string;
  titulo: string;
  categoria: string;
  nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  tempoAtraso: number;
  horaEsperada: string;
  responsavel?: string;
  setor?: string;
  mensagem: string;
}

interface ChecklistExecution {
  id: string;
  checklist_id: string;
  titulo: string;
  responsavel: string;
  setor: string;
  tempo_execucao: number;
  total_itens: number;
  itens_ok: number;
  itens_problema: number;
  status: string;
  observacoes_gerais?: string;
  concluido_em: string;
  pontuacao_final?: number;
}

interface ChecklistStats {
  total_execucoes: number;
  execucoes_concluidas: number;
  execucoes_pendentes: number;
  tempo_medio_execucao: number;
  score_medio: number;
  alertas_ativos: number;
  alertas_criticos: number;
}

interface AIAnomaly {
  tipo_anomalia: string;
  subtipo: string;
  severidade: string;
  titulo: string;
  descricao: string;
  objeto_id?: number;
  objeto_tipo?: string;
  objeto_nome?: string;
  valor_esperado: number;
  valor_observado: number;
  desvio_percentual: number;
  confianca_deteccao: number;
  possivel_causa: string;
  impacto_estimado: string;
  acoes_sugeridas: string[];
  metricas_anomalia: Record<string, unknown>;
  periodo_deteccao: string;
  status: string;
}

interface WeeklyStats {
  tendencia?: string;
  melhor_dia?: string;
  pior_dia?: string;
  top_funcionario?: string;
  top_checklist?: string;
  meta_atingida?: boolean;
  semana?: string;
}

export class DiscordChecklistService {
  private static readonly WEBHOOK_URL =
    'https://discord.com/api/webhooks/1392957511912525926/s0TR7ba9jCJxnGXJNwbiQzHMpWTjmm1NcOnWtfijXvQiFk0L4ze9Q1oZJkatGV6UeIN3';

  // ========================================
  // 🚨 NOTIFICAÇÕES DE ALERTAS
  // ========================================

  /**
   * Envia alerta crítico de checklist atrasado
   */
  static async sendCriticalAlert(alert: ChecklistAlert): Promise<boolean> {
    const embed = {
      title: '🔴 ALERTA CRÍTICO - Checklist Atrasado',
      description: `**${alert.titulo}** está criticamente atrasado!`,
      color: 0xff0000, // Vermelho
      fields: [
        {
          name: '📋 Checklist',
          value: alert.titulo,
          inline: true,
        },
        {
          name: '🏷️ Categoria',
          value: alert.categoria,
          inline: true,
        },
        {
          name: '⏰ Atraso',
          value: this.formatTempoAtraso(alert.tempoAtraso),
          inline: true,
        },
        {
          name: '🕐 Hora Esperada',
          value: alert.horaEsperada,
          inline: true,
        },
        {
          name: '👤 Responsável',
          value: alert.responsavel || 'Não definido',
          inline: true,
        },
        {
          name: '📍 Setor',
          value: alert.setor || 'Não definido',
          inline: true,
        },
      ],
      footer: {
        text: `SGB Analytics • ${new Date().toLocaleString('pt-BR')}`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({
      content: '🚨 **AÇÃO URGENTE NECESSÁRIA** 🚨',
      embeds: [embed],
    });
  }

  /**
   * Envia alerta de checklist atrasado (não crítico)
   */
  static async sendAlert(alert: ChecklistAlert): Promise<boolean> {
    const colors = {
      critico: 0xff0000, // Vermelho
      alto: 0xff8c00, // Laranja
      medio: 0xffd700, // Amarelo
      baixo: 0x87ceeb, // Azul claro
    };

    const icons = {
      critico: '🔴',
      alto: '🟠',
      medio: '🟡',
      baixo: '🔵',
    };

    const embed = {
      title: `${icons[alert.nivel]} Checklist Atrasado - ${alert.nivel.toUpperCase()}`,
      description: alert.mensagem,
      color: colors[alert.nivel],
      fields: [
        {
          name: '📋 Checklist',
          value: alert.titulo,
          inline: true,
        },
        {
          name: '⏰ Atraso',
          value: this.formatTempoAtraso(alert.tempoAtraso),
          inline: true,
        },
        {
          name: '🕐 Esperado',
          value: alert.horaEsperada,
          inline: true,
        },
      ],
      footer: {
        text: `SGB Analytics • ${new Date().toLocaleString('pt-BR')}`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({
      embeds: [embed],
    });
  }

  // ========================================
  // ✅ NOTIFICAÇÕES DE EXECUÇÃO
  // ========================================

  /**
   * Envia notificação de checklist concluído
   */
  static async sendCompletion(execution: ChecklistExecution): Promise<boolean> {
    const scoreEmoji = this.getScoreEmoji(execution.pontuacao_final || 0);
    const timeEmoji =
      execution.tempo_execucao <= 30
        ? '⚡'
        : execution.tempo_execucao <= 60
          ? '⏱️'
          : '🐌';

    const embed = {
      title: '✅ Checklist Concluído',
      description: `**${execution.titulo}** foi executado com sucesso!`,
      color: 0x00ff00, // Verde
      fields: [
        {
          name: '👤 Executado por',
          value: execution.responsavel,
          inline: true,
        },
        {
          name: '📍 Setor',
          value: execution.setor,
          inline: true,
        },
        {
          name: `${timeEmoji} Tempo`,
          value: `${execution.tempo_execucao} min`,
          inline: true,
        },
        {
          name: '📊 Itens',
          value: `${execution.itens_ok}/${execution.total_itens} OK`,
          inline: true,
        },
        {
          name: `${scoreEmoji} Score`,
          value: execution.pontuacao_final
            ? `${execution.pontuacao_final}%`
            : 'N/A',
          inline: true,
        },
        {
          name: '🗓️ Concluído',
          value: new Date(execution.concluido_em).toLocaleString('pt-BR'),
          inline: true,
        },
      ],
      footer: {
        text: `SGB Analytics • Sistema de Checklists`,
      },
      timestamp: new Date().toISOString(),
    };

    if (execution.observacoes_gerais) {
      embed.fields.push({
        name: '📝 Observações',
        value: execution.observacoes_gerais.substring(0, 1000),
        inline: false,
      });
    }

    return this.sendWebhook({
      embeds: [embed],
    });
  }

  // ========================================
  // 📊 RELATÓRIOS AUTOMÁTICOS
  // ========================================

  /**
   * Envia relatório diário de checklists (8h da manhã)
   */
  static async sendDailyReport(stats: ChecklistStats): Promise<boolean> {
    const taxa_conclusao =
      (stats.execucoes_concluidas / stats.total_execucoes) * 100;
    const performance_emoji =
      taxa_conclusao >= 90 ? '🏆' : taxa_conclusao >= 70 ? '👍' : '⚠️';

    const embed = {
      title: '📋 Relatório Diário - Checklists',
      description: `${performance_emoji} **Performance de Ontem**`,
      color:
        taxa_conclusao >= 90
          ? 0x00ff00
          : taxa_conclusao >= 70
            ? 0xffd700
            : 0xff8c00,
      fields: [
        {
          name: '📊 Execuções',
          value: `**${stats.execucoes_concluidas}** de **${stats.total_execucoes}** concluídas\n(${taxa_conclusao.toFixed(1)}%)`,
          inline: true,
        },
        {
          name: '⏱️ Tempo Médio',
          value: `${stats.tempo_medio_execucao.toFixed(0)} minutos`,
          inline: true,
        },
        {
          name: '⭐ Score Médio',
          value: `${stats.score_medio.toFixed(1)}%`,
          inline: true,
        },
        {
          name: '🚨 Alertas Ativos',
          value: `${stats.alertas_ativos} alertas\n${stats.alertas_criticos} críticos`,
          inline: true,
        },
        {
          name: '📈 Status Geral',
          value: this.getStatusGeral(taxa_conclusao, stats.alertas_criticos),
          inline: true,
        },
        {
          name: '🎯 Meta',
          value: '85% conclusão\n90% score médio',
          inline: true,
        },
      ],
      footer: {
        text: `SGB Analytics • Relatório Automático ${new Date().toLocaleDateString('pt-BR')}`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({
      content: '📅 **RELATÓRIO DIÁRIO - CHECKLISTS**',
      embeds: [embed],
    });
  }

  /**
   * Envia resumo semanal de checklists
   */
  static async sendWeeklyReport(weeklyStats: WeeklyStats): Promise<boolean> {
    const embed = {
      title: '📊 Resumo Semanal - Checklists',
      description: '📅 **Performance da Semana**',
      color: 0x4169e1, // Azul royal
      fields: [
        {
          name: '📈 Tendência',
          value: weeklyStats.tendencia || 'Estável',
          inline: true,
        },
        {
          name: '🏆 Melhor Dia',
          value: weeklyStats.melhor_dia || 'N/A',
          inline: true,
        },
        {
          name: '⚠️ Pior Dia',
          value: weeklyStats.pior_dia || 'N/A',
          inline: true,
        },
        {
          name: '👑 Top Funcionário',
          value: weeklyStats.top_funcionario || 'N/A',
          inline: true,
        },
        {
          name: '📋 Top Checklist',
          value: weeklyStats.top_checklist || 'N/A',
          inline: true,
        },
        {
          name: '🎯 Meta Semanal',
          value: weeklyStats.meta_atingida ? '✅ Atingida' : '❌ Não atingida',
          inline: true,
        },
      ],
      footer: {
        text: `SGB Analytics • Semana ${weeklyStats.semana || 'Atual'}`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({
      content: '📊 **RESUMO SEMANAL - CHECKLISTS**',
      embeds: [embed],
    });
  }

  // ========================================
  // 🎯 NOTIFICAÇÕES DE ANOMALIAS
  // ========================================

  /**
   * Envia alerta de anomalia detectada pela IA
   */
  static async sendAnomalyAlert(anomalia: AIAnomaly): Promise<boolean> {
    const severityColors = {
      critica: 0xff0000,
      alta: 0xff8c00,
      media: 0xffd700,
      baixa: 0x87ceeb,
    };

    const embed = {
      title: '🔍 Anomalia Detectada - IA Analytics',
      description: `**${anomalia.titulo}**`,
      color:
        severityColors[anomalia.severidade as keyof typeof severityColors] ||
        0x808080,
      fields: [
        {
          name: '🎯 Tipo',
          value: anomalia.tipo_anomalia,
          inline: true,
        },
        {
          name: '⚠️ Severidade',
          value: anomalia.severidade.toUpperCase(),
          inline: true,
        },
        {
          name: '📊 Confiança',
          value: `${(anomalia.confianca_deteccao * 100).toFixed(1)}%`,
          inline: true,
        },
        {
          name: '📈 Valor Esperado',
          value: anomalia.valor_esperado?.toString() || 'N/A',
          inline: true,
        },
        {
          name: '📉 Valor Observado',
          value: anomalia.valor_observado?.toString() || 'N/A',
          inline: true,
        },
        {
          name: '📊 Desvio',
          value: `${anomalia.desvio_percentual?.toFixed(1) || 0}%`,
          inline: true,
        },
        {
          name: '💡 Possível Causa',
          value: anomalia.possivel_causa || 'Investigar',
          inline: false,
        },
        {
          name: '🎯 Ações Sugeridas',
          value: anomalia.acoes_sugeridas?.join('\n') || 'Monitorar situação',
          inline: false,
        },
      ],
      footer: {
        text: `SGB AI Analytics • Detecção Automática`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({
      content: '🤖 **ANOMALIA DETECTADA PELA IA**',
      embeds: [embed],
    });
  }

  // ========================================
  // 🔧 FUNÇÕES AUXILIARES
  // ========================================

  private static formatTempoAtraso(minutos: number): string {
    if (minutos < 60) {
      return `${minutos}min`;
    }

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }

  private static getScoreEmoji(score: number): string {
    if (score >= 95) return '🏆';
    if (score >= 90) return '⭐';
    if (score >= 80) return '👍';
    if (score >= 70) return '👌';
    if (score >= 60) return '😐';
    return '😞';
  }

  private static getStatusGeral(
    taxa_conclusao: number,
    alertas_criticos: number
  ): string {
    if (alertas_criticos > 0) return '🔴 Crítico';
    if (taxa_conclusao >= 90) return '🟢 Excelente';
    if (taxa_conclusao >= 80) return '🟡 Bom';
    if (taxa_conclusao >= 70) return '🟠 Regular';
    return '🔴 Ruim';
  }

  /**
   * Envia webhook para Discord
   */
  private static async sendWebhook(payload: unknown): Promise<boolean> {
    try {
      const bodyObj = typeof payload === 'object' && payload !== null ? payload : {};
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'SGB Checklist Bot',
          avatar_url: 'https://i.imgur.com/checklist-icon.png',
          ...bodyObj,
        }),
      });

      if (response.ok) {
        console.log('✅ Notificação Discord enviada com sucesso');
        return true;
      } else {
        console.error(
          '❌ Erro ao enviar Discord webhook:',
          response.status,
          await response.text()
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar Discord webhook:', error);
      return false;
    }
  }

  // ========================================
  // 🧪 FUNÇÃO DE TESTE
  // ========================================

  /**
   * Testa conexão com webhook Discord
   */
  static async testConnection(): Promise<boolean> {
    const embed = {
      title: '🧪 Teste de Conexão',
      description: 'Teste de integração Discord + Checklists',
      color: 0x00ff00,
      fields: [
        {
          name: '✅ Status',
          value: 'Webhook funcionando!',
          inline: true,
        },
        {
          name: '🕐 Horário',
          value: new Date().toLocaleString('pt-BR'),
          inline: true,
        },
      ],
      footer: {
        text: 'SGB Analytics • Teste de Sistema',
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({
      content: '🧪 **TESTE DE CONEXÃO - CHECKLIST BOT**',
      embeds: [embed],
    });
  }
}

// ========================================
// 🎯 HOOK PARA USO EM COMPONENTES
// ========================================

export function useDiscordChecklist() {
  const sendAlert = async (alert: ChecklistAlert) => {
    return DiscordChecklistService.sendAlert(alert);
  };

  const sendCompletion = async (execution: ChecklistExecution) => {
    return DiscordChecklistService.sendCompletion(execution);
  };

  const sendDailyReport = async (stats: ChecklistStats) => {
    return DiscordChecklistService.sendDailyReport(stats);
  };

  const testConnection = async () => {
    return DiscordChecklistService.testConnection();
  };

  return {
    sendAlert,
    sendCompletion,
    sendDailyReport,
    testConnection,
  };
}

export default DiscordChecklistService;
