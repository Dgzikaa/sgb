// ========================================
// ğŸ“‹ DISCORD CHECKLIST NOTIFICATION SERVICE
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
  // ğŸš¨ NOTIFICAá‡á•ES DE ALERTAS
  // ========================================
  
  /**
   * Envia alerta crá­tico de checklist atrasado
   */
  static async sendCriticalAlert(alert: ChecklistAlert): Promise<boolean> {
    const embed = {
      title: "ğŸ”´ ALERTA CRáTICO - Checklist Atrasado",
      description: `**${alert.titulo}** está¡ criticamente atrasado!`,
      color: 0xFF0000, // Vermelho
      fields: [
        {
          name: "ğŸ“‹ Checklist",
          value: alert.titulo,
          inline: true
        },
        {
          name: "ğŸ·ï¸ Categoria", 
          value: alert.categoria,
          inline: true
        },
        {
          name: "° Atraso",
          value: this.formatTempoAtraso(alert.tempoAtraso),
          inline: true
        },
        {
          name: "ğŸ• Hora Esperada",
          value: alert.horaEsperada,
          inline: true
        },
        {
          name: "ğŸ‘¤ Responsá¡vel",
          value: alert.responsavel || "Ná£o definido",
          inline: true
        },
        {
          name: "ğŸ“ Setor",
          value: alert.setor || "Ná£o definido", 
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics €¢ ${new Date().toLocaleString('pt-BR')}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ğŸš¨ **Aá‡áƒO URGENTE NECESSáRIA** ğŸš¨",
      embeds: [embed]
    })
  }

  /**
   * Envia alerta de checklist atrasado (ná£o crá­tico)
   */
  static async sendAlert(alert: ChecklistAlert): Promise<boolean> {
    const colors = {
      critico: 0xFF0000, // Vermelho
      alto: 0xFF8C00,    // Laranja
      medio: 0xFFD700,   // Amarelo
      baixo: 0x87CEEB    // Azul claro
    }

    const icons = {
      critico: "ğŸ”´",
      alto: "ğŸŸ ", 
      medio: "ğŸŸ¡",
      baixo: "ğŸ”µ"
    }

    const embed = {
      title: `${icons[alert.nivel]} Checklist Atrasado - ${alert.nivel.toUpperCase()}`,
      description: alert.mensagem,
      color: colors[alert.nivel],
      fields: [
        {
          name: "ğŸ“‹ Checklist",
          value: alert.titulo,
          inline: true
        },
        {
          name: "° Atraso",
          value: this.formatTempoAtraso(alert.tempoAtraso),
          inline: true
        },
        {
          name: "ğŸ• Esperado",
          value: alert.horaEsperada,
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics €¢ ${new Date().toLocaleString('pt-BR')}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      embeds: [embed]
    })
  }

  // ========================================
  // œ… NOTIFICAá‡á•ES DE EXECUá‡áƒO
  // ========================================

  /**
   * Envia notificaá§á£o de checklist concluá­do
   */
  static async sendCompletion(execution: ChecklistExecution): Promise<boolean> {
    const scoreEmoji = this.getScoreEmoji(execution.pontuacao_final || 0)
    const timeEmoji = execution.tempo_execucao <= 30 ? "š¡" : execution.tempo_execucao <= 60 ? "±ï¸" : "ğŸŒ"
    
    const embed = {
      title: "œ… Checklist Concluá­do",
      description: `**${execution.titulo}** foi executado com sucesso!`,
      color: 0x00FF00, // Verde
      fields: [
        {
          name: "ğŸ‘¤ Executado por",
          value: execution.responsavel,
          inline: true
        },
        {
          name: "ğŸ“ Setor",
          value: execution.setor,
          inline: true
        },
        {
          name: `${timeEmoji} Tempo`,
          value: `${execution.tempo_execucao} min`,
          inline: true
        },
        {
          name: "ğŸ“Š Itens",
          value: `${execution.itens_ok}/${execution.total_itens} OK`,
          inline: true
        },
        {
          name: `${scoreEmoji} Score`,
          value: execution.pontuacao_final ? `${execution.pontuacao_final}%` : "N/A",
          inline: true
        },
        {
          name: "ğŸ—“ï¸ Concluá­do",
          value: new Date(execution.concluido_em).toLocaleString('pt-BR'),
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics €¢ Sistema de Checklists`
      },
      timestamp: new Date().toISOString()
    }

    if (execution.observacoes_gerais) {
      embed.fields.push({
        name: "ğŸ“ Observaá§áµes",
        value: execution.observacoes_gerais.substring(0, 1000),
        inline: false
      })
    }

    return this.sendWebhook({
      embeds: [embed]
    })
  }

  // ========================================
  // ğŸ“Š RELATá“RIOS AUTOMáTICOS
  // ========================================

  /**
   * Envia relatá³rio diá¡rio de checklists (8h da manhá£)
   */
  static async sendDailyReport(stats: ChecklistStats): Promise<boolean> {
    const taxa_conclusao = (stats.execucoes_concluidas / stats.total_execucoes) * 100
    const performance_emoji = taxa_conclusao >= 90 ? "ğŸ†" : taxa_conclusao >= 70 ? "ğŸ‘" : "š ï¸"
    
    const embed = {
      title: "ğŸ“‹ Relatá³rio Diá¡rio - Checklists",
      description: `${performance_emoji} **Performance de Ontem**`,
      color: taxa_conclusao >= 90 ? 0x00FF00 : taxa_conclusao >= 70 ? 0xFFD700 : 0xFF8C00,
      fields: [
        {
          name: "ğŸ“Š Execuá§áµes",
          value: `**${stats.execucoes_concluidas}** de **${stats.total_execucoes}** concluá­das\n(${taxa_conclusao.toFixed(1)}%)`,
          inline: true
        },
        {
          name: "±ï¸ Tempo Má©dio",
          value: `${stats.tempo_medio_execucao.toFixed(0)} minutos`,
          inline: true
        },
        {
          name: "­ Score Má©dio",
          value: `${stats.score_medio.toFixed(1)}%`,
          inline: true
        },
        {
          name: "ğŸš¨ Alertas Ativos",
          value: `${stats.alertas_ativos} alertas\n${stats.alertas_criticos} crá­ticos`,
          inline: true
        },
        {
          name: "ğŸ“ˆ Status Geral",
          value: this.getStatusGeral(taxa_conclusao, stats.alertas_criticos),
          inline: true
        },
        {
          name: "ğŸ¯ Meta",
          value: "85% conclusá£o\n90% score má©dio",
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics €¢ Relatá³rio Automá¡tico ${new Date().toLocaleDateString('pt-BR')}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ğŸ“… **RELATá“RIO DIáRIO - CHECKLISTS**",
      embeds: [embed]
    })
  }

  /**
   * Envia resumo semanal de checklists
   */
  static async sendWeeklyReport(weeklyStats: any): Promise<boolean> {
    const embed = {
      title: "ğŸ“Š Resumo Semanal - Checklists",
      description: "ğŸ“… **Performance da Semana**",
      color: 0x4169E1, // Azul royal
      fields: [
        {
          name: "ğŸ“ˆ Tendáªncia",
          value: weeklyStats.tendencia || "Está¡vel",
          inline: true
        },
        {
          name: "ğŸ† Melhor Dia",
          value: weeklyStats.melhor_dia || "N/A",
          inline: true
        },
        {
          name: "š ï¸ Pior Dia", 
          value: weeklyStats.pior_dia || "N/A",
          inline: true
        },
        {
          name: "ğŸ‘‘ Top Funcioná¡rio",
          value: weeklyStats.top_funcionario || "N/A",
          inline: true
        },
        {
          name: "ğŸ“‹ Top Checklist",
          value: weeklyStats.top_checklist || "N/A",
          inline: true
        },
        {
          name: "ğŸ¯ Meta Semanal",
          value: weeklyStats.meta_atingida ? "œ… Atingida" : "Œ Ná£o atingida",
          inline: true
        }
      ],
      footer: {
        text: `SGB Analytics €¢ Semana ${weeklyStats.semana || 'Atual'}`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ğŸ“Š **RESUMO SEMANAL - CHECKLISTS**",
      embeds: [embed]
    })
  }

  // ========================================
  // ğŸ¯ NOTIFICAá‡á•ES DE ANOMALIAS
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
      title: "ğŸ” Anomalia Detectada - IA Analytics",
      description: `**${anomalia.titulo}**`,
      color: severityColors[anomalia.severidade as keyof typeof severityColors] || 0x808080,
      fields: [
        {
          name: "ğŸ¯ Tipo",
          value: anomalia.tipo_anomalia,
          inline: true
        },
        {
          name: "š ï¸ Severidade",
          value: anomalia.severidade.toUpperCase(),
          inline: true
        },
        {
          name: "ğŸ“Š Confianá§a",
          value: `${(anomalia.confianca_deteccao * 100).toFixed(1)}%`,
          inline: true
        },
        {
          name: "ğŸ“ˆ Valor Esperado",
          value: anomalia.valor_esperado?.toString() || "N/A",
          inline: true
        },
        {
          name: "ğŸ“‰ Valor Observado", 
          value: anomalia.valor_observado?.toString() || "N/A",
          inline: true
        },
        {
          name: "ğŸ“Š Desvio",
          value: `${anomalia.desvio_percentual?.toFixed(1) || 0}%`,
          inline: true
        },
        {
          name: "ğŸ’¡ Possá­vel Causa",
          value: anomalia.possivel_causa || "Investigar",
          inline: false
        },
        {
          name: "ğŸ¯ Aá§áµes Sugeridas",
          value: anomalia.acoes_sugeridas?.join('\n') || "Monitorar situaá§á£o",
          inline: false
        }
      ],
      footer: {
        text: `SGB AI Analytics €¢ Detecá§á£o Automá¡tica`
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ğŸ¤– **ANOMALIA DETECTADA PELA IA**",
      embeds: [embed]
    })
  }

  // ========================================
  // ğŸ”§ FUNá‡á•ES AUXILIARES
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
    if (score >= 95) return "ğŸ†"
    if (score >= 90) return "­"
    if (score >= 80) return "ğŸ‘"
    if (score >= 70) return "ğŸ‘Œ"
    if (score >= 60) return "ğŸ˜"
    return "ğŸ˜"
  }

  private static getStatusGeral(taxa_conclusao: number, alertas_criticos: number): string {
    if (alertas_criticos > 0) return "ğŸ”´ Crá­tico"
    if (taxa_conclusao >= 90) return "ğŸŸ¢ Excelente"
    if (taxa_conclusao >= 80) return "ğŸŸ¡ Bom"
    if (taxa_conclusao >= 70) return "ğŸŸ  Regular"
    return "ğŸ”´ Ruim"
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
        console.log('œ… Notificaá§á£o Discord enviada com sucesso')
        return true
      } else {
        console.error('Œ Erro ao enviar Discord webhook:', response.status, await response.text())
        return false
      }
    } catch (error) {
      console.error('Œ Erro ao enviar Discord webhook:', error)
      return false
    }
  }

  // ========================================
  // ğŸ§ª FUNá‡áƒO DE TESTE
  // ========================================

  /**
   * Testa conexá£o com webhook Discord
   */
  static async testConnection(): Promise<boolean> {
    const embed = {
      title: "ğŸ§ª Teste de Conexá£o",
      description: "Teste de integraá§á£o Discord + Checklists",
      color: 0x00FF00,
      fields: [
        {
          name: "œ… Status",
          value: "Webhook funcionando!",
          inline: true
        },
        {
          name: "ğŸ• Horá¡rio",
          value: new Date().toLocaleString('pt-BR'),
          inline: true
        }
      ],
      footer: {
        text: "SGB Analytics €¢ Teste de Sistema"
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWebhook({
      content: "ğŸ§ª **TESTE DE CONEXáƒO - CHECKLIST BOT**",
      embeds: [embed]
    })
  }
}

// ========================================
// ğŸ¯ HOOK PARA USO EM COMPONENTES
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
