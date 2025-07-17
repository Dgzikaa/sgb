// ========================================
// ðŸ“‹ DISCORD CHECKLIST NOTIFICATION SERVICE
// ========================================

interface ChecklistAlert {
  id: string
  checklistId: string
  titulo: string
  categoria: string
  nivel: 'baixo' | 'medio' | 'alto' | 'critico'
  tempoAtraso: number
  horaEsperada: string
  responsavel?: string
  setor?: string
  mensagem: string
}

interface ChecklistExecution {
  id: string
  checklist_id: string
  titulo: string
  responsavel: string
  setor: string
  tempo_execucao: number
  total_itens: number
  itens_ok: number
  itens_problema: number
  status: string
  observacoes_gerais?: string
  concluido_em: string
  pontuacao_final?: number
}

interface ChecklistStats {
  total_execucoes: number
  execucoes_concluidas: number
  execucoes_pendentes: number
  tempo_medio_execucao: number
  score_medio: number
  alertas_ativos: number
  alertas_criticos: number
}

export class DiscordChecklistService {
  private static readonly WEBHOOK_URL = 'https://discord.com/api/webhooks/1392957511912525926/s0TR7ba9jCJxnGXJNwbiQzHMpWTjmm1NcOnWtfijXvQiFk0L4ze9Q1oZJkatGV6UeIN3'
  
  // ========================================
  // ðŸš¨ NOTIFICAÃ‡Ã•ES DE ALERTAS
  // ========================================
  
  /**
   * Envia alerta crÃ­tico de checklist atrasado
   */
  static async sendCriticalAlert(alert: ChecklistAlert): Promise<boolean> {
    const embed = {
      title: "ðŸ”´ ALERTA CRÃTICO - Checklist Atrasado",
      description: `**${alert.titulo}** estÃ¡ criticamente atrasado!`,
      color: 0xFF0000, // Vermelho
      fields: [
        {
          name: "ðŸ“‹ Checklist",
          value: alert.titulo,
          inline: true
        },
        {
          name: "ðŸ·ï¸ Categoria", 
          value: alert.categoria,
          inline: true
        },
        {
          name: "â° Atraso",
          value: this.formatTempoAtraso(alert.tempoAtraso),
          inline: true
        },
        {
          name: "ðŸ• Hora Esperada",
          value: alert.horaEsperada,
          inline: true
        },
        {
          name: "ðŸ‘¤ ResponsÃ¡vel",
          value: alert.responsavel || "NÃ£o definido",
          inline: true
        },
        {
          name: "ðŸ“ Setor",
          value: alert.setor || "NÃ£o definido", 
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics â€¢ ${new Date().toLocaleString('pt-BR')}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ðŸš¨ **AÃ‡ÃƒO URGENTE NECESSÃRIA** ðŸš¨",
      embeds: [embed]
    })
  }

  /**
   * Envia alerta de checklist atrasado (nÃ£o crÃ­tico)
   */
  static async sendAlert(alert: ChecklistAlert): Promise<boolean> {
    const colors = {
      critico: 0xFF0000, // Vermelho
      alto: 0xFF8C00,    // Laranja
      medio: 0xFFD700,   // Amarelo
      baixo: 0x87CEEB    // Azul claro
    }

    const icons = {
      critico: "ðŸ”´",
      alto: "ðŸŸ ", 
      medio: "ðŸŸ¡",
      baixo: "ðŸ”µ"
    }

    const embed = {
      title: `${icons[alert.nivel]} Checklist Atrasado - ${alert.nivel.toUpperCase()}`,
      description: alert.mensagem,
      color: colors[alert.nivel],
      fields: [
        {
          name: "ðŸ“‹ Checklist",
          value: alert.titulo,
          inline: true
        },
        {
          name: "â° Atraso",
          value: this.formatTempoAtraso(alert.tempoAtraso),
          inline: true
        },
        {
          name: "ðŸ• Esperado",
          value: alert.horaEsperada,
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics â€¢ ${new Date().toLocaleString('pt-BR')}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      embeds: [embed]
    })
  }

  // ========================================
  // âœ… NOTIFICAÃ‡Ã•ES DE EXECUÃ‡ÃƒO
  // ========================================

  /**
   * Envia notificaÃ§Ã£o de checklist concluÃ­do
   */
  static async sendCompletion(execution: ChecklistExecution): Promise<boolean> {
    const scoreEmoji = this.getScoreEmoji(execution.pontuacao_final || 0)
    const timeEmoji = execution.tempo_execucao <= 30 ? "âš¡" : execution.tempo_execucao <= 60 ? "â±ï¸" : "ðŸŒ"
    
    const embed = {
      title: "âœ… Checklist ConcluÃ­do",
      description: `**${execution.titulo}** foi executado com sucesso!`,
      color: 0x00FF00, // Verde
      fields: [
        {
          name: "ðŸ‘¤ Executado por",
          value: execution.responsavel,
          inline: true
        },
        {
          name: "ðŸ“ Setor",
          value: execution.setor,
          inline: true
        },
        {
          name: `${timeEmoji} Tempo`,
          value: `${execution.tempo_execucao} min`,
          inline: true
        },
        {
          name: "ðŸ“Š Itens",
          value: `${execution.itens_ok}/${execution.total_itens} OK`,
          inline: true
        },
        {
          name: `${scoreEmoji} Score`,
          value: execution.pontuacao_final ? `${execution.pontuacao_final}%` : "N/A",
          inline: true
        },
        {
          name: "ðŸ—“ï¸ ConcluÃ­do",
          value: new Date(execution.concluido_em).toLocaleString('pt-BR'),
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics â€¢ Sistema de Checklists`
      },
      timestamp: new Date().toISOString()
    }

    if (execution.observacoes_gerais) {
      embed.fields.push({
        name: "ðŸ“ ObservaÃ§Ãµes",
        value: execution.observacoes_gerais.substring(0, 1000),
        inline: false
      })
    }

    return this.sendWebhook({
      embeds: [embed]
    })
  }

  // ========================================
  // ðŸ“Š RELATÃ“RIOS AUTOMÃTICOS
  // ========================================

  /**
   * Envia relatÃ³rio diÃ¡rio de checklists (8h da manhÃ£)
   */
  static async sendDailyReport(stats: ChecklistStats): Promise<boolean> {
    const taxa_conclusao = (stats.execucoes_concluidas / stats.total_execucoes) * 100
    const performance_emoji = taxa_conclusao >= 90 ? "ðŸ†" : taxa_conclusao >= 70 ? "ðŸ‘" : "âš ï¸"
    
    const embed = {
      title: "ðŸ“‹ RelatÃ³rio DiÃ¡rio - Checklists",
      description: `${performance_emoji} **Performance de Ontem**`,
      color: taxa_conclusao >= 90 ? 0x00FF00 : taxa_conclusao >= 70 ? 0xFFD700 : 0xFF8C00,
      fields: [
        {
          name: "ðŸ“Š ExecuÃ§Ãµes",
          value: `**${stats.execucoes_concluidas}** de **${stats.total_execucoes}** concluÃ­das\n(${taxa_conclusao.toFixed(1)}%)`,
          inline: true
        },
        {
          name: "â±ï¸ Tempo MÃ©dio",
          value: `${stats.tempo_medio_execucao.toFixed(0)} minutos`,
          inline: true
        },
        {
          name: "â­ Score MÃ©dio",
          value: `${stats.score_medio.toFixed(1)}%`,
          inline: true
        },
        {
          name: "ðŸš¨ Alertas Ativos",
          value: `${stats.alertas_ativos} alertas\n${stats.alertas_criticos} crÃ­ticos`,
          inline: true
        },
        {
          name: "ðŸ“ˆ Status Geral",
          value: this.getStatusGeral(taxa_conclusao, stats.alertas_criticos),
          inline: true
        },
        {
          name: "ðŸŽ¯ Meta",
          value: "85% conclusÃ£o\n90% score mÃ©dio",
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics â€¢ RelatÃ³rio AutomÃ¡tico ${new Date().toLocaleDateString('pt-BR')}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ðŸ“… **RELATÃ“RIO DIÃRIO - CHECKLISTS**",
      embeds: [embed]
    })
  }

  /**
   * Envia resumo semanal de checklists
   */
  static async sendWeeklyReport(weeklyStats: any): Promise<boolean> {
    const embed = {
      title: "ðŸ“Š Resumo Semanal - Checklists",
      description: "ðŸ“… **Performance da Semana**",
      color: 0x4169E1, // Azul royal
      fields: [
        {
          name: "ðŸ“ˆ TendÃªncia",
          value: weeklyStats.tendencia || "EstÃ¡vel",
          inline: true
        },
        {
          name: "ðŸ† Melhor Dia",
          value: weeklyStats.melhor_dia || "N/A",
          inline: true
        },
        {
          name: "âš ï¸ Pior Dia", 
          value: weeklyStats.pior_dia || "N/A",
          inline: true
        },
        {
          name: "ðŸ‘‘ Top FuncionÃ¡rio",
          value: weeklyStats.top_funcionario || "N/A",
          inline: true
        },
        {
          name: "ðŸ“‹ Top Checklist",
          value: weeklyStats.top_checklist || "N/A",
          inline: true
        },
        {
          name: "ðŸŽ¯ Meta Semanal",
          value: weeklyStats.meta_atingida ? "âœ… Atingida" : "âŒ NÃ£o atingida",
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics â€¢ Semana ${weeklyStats.semana || 'Atual'}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ðŸ“Š **RESUMO SEMANAL - CHECKLISTS**",
      embeds: [embed]
    })
  }

  // ========================================
  // ðŸŽ¯ NOTIFICAÃ‡Ã•ES DE ANOMALIAS
  // ========================================

  /**
   * Envia alerta de anomalia detectada pela IA
   */
  static async sendAnomalyAlert(anomalia: any): Promise<boolean> {
    const severityColors = {
      critica: 0xFF0000,
      alta: 0xFF8C00,
      media: 0xFFD700,
      baixa: 0x87CEEB
    }

    const embed = {
      title: "ðŸ” Anomalia Detectada - IA Analytics",
      description: `**${anomalia.titulo}**`,
      color: severityColors[anomalia.severidade as keyof typeof severityColors] || 0x808080,
      fields: [
        {
          name: "ðŸŽ¯ Tipo",
          value: anomalia.tipo_anomalia,
          inline: true
        },
        {
          name: "âš ï¸ Severidade",
          value: anomalia.severidade.toUpperCase(),
          inline: true
        },
        {
          name: "ðŸ“Š ConfianÃ§a",
          value: `${(anomalia.confianca_deteccao * 100).toFixed(1)}%`,
          inline: true
        },
        {
          name: "ðŸ“ˆ Valor Esperado",
          value: anomalia.valor_esperado?.toString() || "N/A",
          inline: true
        },
        {
          name: "ðŸ“‰ Valor Observado", 
          value: anomalia.valor_observado?.toString() || "N/A",
          inline: true
        },
        {
          name: "ðŸ“Š Desvio",
          value: `${anomalia.desvio_percentual?.toFixed(1) || 0}%`,
          inline: true
        },
        {
          name: "ðŸ’¡ PossÃ­vel Causa",
          value: anomalia.possivel_causa || "Investigar",
          inline: false
        },
        {
          name: "ðŸŽ¯ AÃ§Ãµes Sugeridas",
          value: anomalia.acoes_sugeridas?.join('\n') || "Monitorar situaÃ§Ã£o",
          inline: false
        }
      ],
      footer: {
        text: `SGB AI Analytics â€¢ DetecÃ§Ã£o AutomÃ¡tica`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ðŸ¤– **ANOMALIA DETECTADA PELA IA**",
      embeds: [embed]
    })
  }

  // ========================================
  // ðŸ”§ FUNÃ‡Ã•ES AUXILIARES
  // ========================================

  private static formatTempoAtraso(minutos: number): string {
    if (minutos < 60) {
      return `${minutos}min`
    }
    
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
  }

  private static getScoreEmoji(score: number): string {
    if (score >= 95) return "ðŸ†"
    if (score >= 90) return "â­"
    if (score >= 80) return "ðŸ‘"
    if (score >= 70) return "ðŸ‘Œ"
    if (score >= 60) return "ðŸ˜"
    return "ðŸ˜ž"
  }

  private static getStatusGeral(taxa_conclusao: number, alertas_criticos: number): string {
    if (alertas_criticos > 0) return "ðŸ”´ CrÃ­tico"
    if (taxa_conclusao >= 90) return "ðŸŸ¢ Excelente"
    if (taxa_conclusao >= 80) return "ðŸŸ¡ Bom"
    if (taxa_conclusao >= 70) return "ðŸŸ  Regular"
    return "ðŸ”´ Ruim"
  }

  /**
   * Envia webhook para Discord
   */
  private static async sendWebhook(payload: any): Promise<boolean> {
    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'SGB Checklist Bot',
          avatar_url: 'https://i.imgur.com/checklist-icon.png',
          ...payload
        })
      })

      if (response.ok) {
        console.log('âœ… NotificaÃ§Ã£o Discord enviada com sucesso')
        return true
      } else {
        console.error('âŒ Erro ao enviar Discord webhook:', response.status, await response.text())
        return false
      }
    } catch (error) {
      console.error('âŒ Erro ao enviar Discord webhook:', error)
      return false
    }
  }

  // ========================================
  // ðŸ§ª FUNÃ‡ÃƒO DE TESTE
  // ========================================

  /**
   * Testa conexÃ£o com webhook Discord
   */
  static async testConnection(): Promise<boolean> {
    const embed = {
      title: "ðŸ§ª Teste de ConexÃ£o",
      description: "Teste de integraÃ§Ã£o Discord + Checklists",
      color: 0x00FF00,
      fields: [
        {
          name: "âœ… Status",
          value: "Webhook funcionando!",
          inline: true
        },
        {
          name: "ðŸ• HorÃ¡rio",
          value: new Date().toLocaleString('pt-BR'),
          inline: true
        }
      ],
      footer: {
        text: "SGB Analytics â€¢ Teste de Sistema"
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ðŸ§ª **TESTE DE CONEXÃƒO - CHECKLIST BOT**",
      embeds: [embed]
    })
  }
}

// ========================================
// ðŸŽ¯ HOOK PARA USO EM COMPONENTES
// ========================================

export function useDiscordChecklist() {
  const sendAlert = async (alert: ChecklistAlert) => {
    return DiscordChecklistService.sendAlert(alert)
  }

  const sendCompletion = async (execution: ChecklistExecution) => {
    return DiscordChecklistService.sendCompletion(execution)
  }

  const sendDailyReport = async (stats: ChecklistStats) => {
    return DiscordChecklistService.sendDailyReport(stats)
  }

  const testConnection = async () => {
    return DiscordChecklistService.testConnection()
  }

  return {
    sendAlert,
    sendCompletion, 
    sendDailyReport,
    testConnection
  }
}

export default DiscordChecklistService 
