// ========================================
// Ã°Å¸Å½Â® DISCORD WEBHOOK SERVICE - SGB
// ========================================
// Service completo para notificaÃ§Ãµes via Discord
// IntegraÃ§Ã£o com agente IA para relatÃ³rios automÃ¡ticos

export interface DiscordWebhookConfig {
  webhook_url: string;
  username?: string;
  avatar_url?: string;
  enabled: boolean;
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
}

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordNotificationData {
  title: string
  description: string
  color?: number
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
  footer?: {
    text: string
  }
  bar_id: string
  webhook_type?: 'sistema' | 'contaazul' | 'meta' | 'checklists' | 'contahub' | 'vendas' | 'reservas'
}

// ========================================
// Ã°Å¸Å½Â® DISCORD SERVICE CLASS
// ========================================
export class DiscordService {
  static async sendNotification(data: DiscordNotificationData) {
    try {
      const response = await fetch('/api/edge-functions/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar notificaÃ§Ã£o')
      }

      console.log('âœ… NotificaÃ§Ã£o Discord enviada:', result)
      return result
    } catch (error) {
      console.error('âŒ Erro ao enviar notificaÃ§Ã£o Discord:', error)
      throw error
    }
  }

  // MÃ©todo para testar conexÃ£o com Discord
  static async testarConexao(): Promise<boolean> {
    try {
      const testData: DiscordNotificationData = {
        bar_id: 'test',
        webhook_type: 'sistema',
        title: 'ðŸ§ª Teste de ConexÃ£o',
        description: 'Este Ã© um teste automÃ¡tico de conectividade com Discord',
        fields: [
          {
            name: 'âš¡ Status',
            value: 'ConexÃ£o funcionando corretamente',
            inline: true
          },
          {
            name: 'ðŸ• HorÃ¡rio',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00ff00 // Verde para sucesso
      }

      await this.sendNotification(testData)
      return true
    } catch (error) {
      console.error('âŒ Erro ao testar conexÃ£o Discord:', error)
      return false
    }
  }

  // MÃ©todo para enviar alertas de anomalia
  static async enviarAlertaAnomalia(anomalia: Record<string, unknown>): Promise<boolean> {
    try {
      const barId = typeof anomalia.bar_id === 'string' ? anomalia.bar_id : String(anomalia.bar_id ?? 'unknown');
      const titulo = typeof anomalia.titulo === 'string' ? anomalia.titulo : 'Anomalia Detectada';
      const descricao = typeof anomalia.descricao === 'string' ? anomalia.descricao : 'Anomalia crítica detectada pelo sistema de IA';
      const tipoAnomalia = typeof anomalia.tipo_anomalia === 'string' ? anomalia.tipo_anomalia : 'N/A';
      const severidade = typeof anomalia.severidade === 'string' ? anomalia.severidade : 'N/A';
      const valorEsperado = anomalia.valor_esperado !== undefined ? String(anomalia.valor_esperado) : 'N/A';
      const valorObservado = anomalia.valor_observado !== undefined ? String(anomalia.valor_observado) : 'N/A';
      const desvioPercentual = anomalia.desvio_percentual !== undefined ? String(anomalia.desvio_percentual) : '0';
      const confiancaDeteccao = anomalia.confianca_deteccao !== undefined ? String(anomalia.confianca_deteccao) : '0';
      const cor = severidade === 'critica' ? 0xff0000 : 0xff6600;
      const data: DiscordNotificationData = {
        bar_id: barId,
        webhook_type: 'sistema',
        title: `🚨 ${titulo}`,
        description: descricao,
        fields: [
          {
            name: '📊 Tipo',
            value: tipoAnomalia,
            inline: true
          },
          {
            name: '⚠️ Severidade',
            value: severidade,
            inline: true
          },
          {
            name: '📈 Valor Esperado',
            value: valorEsperado,
            inline: true
          },
          {
            name: '📉 Valor Observado',
            value: valorObservado,
            inline: true
          },
          {
            name: '📊 Desvio',
            value: `${desvioPercentual}%`,
            inline: true
          },
          {
            name: '🎯 Confiança',
            value: `${confiancaDeteccao}%`,
            inline: true
          }
        ],
        color: cor
      };
      await this.sendNotification(data);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar alerta de anomalia:', error);
      return false;
    }
  }

  // Método para enviar relatório matinal
  static async enviarRelatorioMatinal(dashboardData: Record<string, unknown>): Promise<boolean> {
    try {
      const barId = typeof dashboardData.bar_id === 'string' ? dashboardData.bar_id : String(dashboardData.bar_id ?? 'unknown');
      const metricasCount = dashboardData.metricas_count !== undefined ? String(dashboardData.metricas_count) : '0';
      const anomaliasCount = dashboardData.anomalias_count !== undefined ? String(dashboardData.anomalias_count) : '0';
      const insightsCount = dashboardData.insights_count !== undefined ? String(dashboardData.insights_count) : '0';
      const scoreGeral = dashboardData.score_geral !== undefined ? String(dashboardData.score_geral) : 'N/A';
      const horarioGeracao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const data: DiscordNotificationData = {
        bar_id: barId,
        webhook_type: 'sistema',
        title: '🌅 Relatório Matinal - SGB Analytics',
        description: 'Resumo das análises e métricas do dia anterior gerado pelo sistema de IA',
        fields: [
          {
            name: '📊 Métricas Calculadas',
            value: metricasCount,
            inline: true
          },
          {
            name: '🚨 Anomalias Detectadas',
            value: anomaliasCount,
            inline: true
          },
          {
            name: '💡 Insights Gerados',
            value: insightsCount,
            inline: true
          },
          {
            name: '📈 Score Geral',
            value: scoreGeral,
            inline: true
          },
          {
            name: '⏰ Horário de Geração',
            value: horarioGeracao,
            inline: true
          }
        ],
        color: 0x00ff00 // Verde para sucesso
      }
      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar relatório matinal:', error)
      return false
    }
  }

  // MÃ©todos de conveniÃªncia para tipos especÃ­ficos de webhook
  static async sendSystemNotification(barId: string, title: string, description: string, fields?: DiscordField[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'sistema',
      title,
      description,
      fields,
      color: 0xff0000 // Vermelho para sistema/segurança
    })
  }

  static async sendContaAzulNotification(barId: string, title: string, description: string, fields?: DiscordField[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'contaazul',
      title,
      description,
      fields,
      color: 0x0066cc // Azul para ContaAzul
    })
  }

  static async sendChecklistNotification(barId: string, title: string, description: string, fields?: DiscordField[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'checklists',
      title,
      description,
      fields,
      color: 0x00cc66 // Verde para checklists
    })
  }

  static async sendSalesNotification(barId: string, title: string, description: string, fields?: DiscordField[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'vendas',
      title,
      description,
      fields,
      color: 0x00ff00 // Verde para vendas
    })
  }

  static async sendReservationNotification(barId: string, title: string, description: string, fields?: DiscordField[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'reservas',
      title,
      description,
      fields,
      color: 0x6600cc // Roxo para reservas
    })
  }

  static async sendMetaNotification(barId: string, title: string, description: string, fields?: DiscordField[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'meta',
      title,
      description,
      fields,
      color: 0xff6600 // Laranja para Meta/Social
    })
  }

  // Método para enviar embed diretamente (compatibilidade com bot)
  static async sendEmbed(embed: DiscordEmbed): Promise<boolean> {
    try {
      const data: DiscordNotificationData = {
        bar_id: 'bot',
        webhook_type: 'sistema',
        title: embed.title || 'Mensagem do Bot',
        description: embed.description || '',
        fields: embed.fields || [],
        color: embed.color || 0x5865F2
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar embed Discord:', error)
      return false
    }
  }

  // Método para enviar mensagem de texto simples
  static async sendMessage(message: string): Promise<boolean> {
    try {
      const data: DiscordNotificationData = {
        bar_id: 'bot',
        webhook_type: 'sistema',
        title: '🤖 SGB Bot',
        description: message,
        color: 0x5865F2
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem Discord:', error)
      return false
    }
  }
}

// ========================================
// Ã°Å¸ÂÂ­ FACTORY E CONFIGURAÃ‡Ã•ES
// ========================================

/**
 * Discord Service para SGB (OrdinÃ¡rio)
 * Como a classe Ã¡Â© totalmente estÃ¡tica, exportamos diretamente
 */
export const sgbDiscordService = DiscordService;

// ========================================
// Ã°Å¸â€¢Â AGENDAMENTO PARA 8H DA MANHÃ¡Æ’
// ========================================

/**
 * Verifica se Ã¡Â© hora de enviar relatÃ³rio matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  
  // 8h da manhÃ¡Â£ (entre 8:00 e 8:05 para dar margem)
  return hora === 8 && minuto <= 5;
}

/**
 * Agendar prÃ¡ximo relatÃ³rio matinal
 */
export function calcularProximoRelatorioMatinal(): Date {
  const agora = new Date();
  const proximoRelatorio = new Date();
  
  // Configurar para 8h da manhÃ¡Â£
  proximoRelatorio.setHours(8, 0, 0, 0);
  
  // Se jÃ¡Â¡ passou das 8h hoje, agendar para amanhÃ¡Â£
  if (agora.getHours() >= 8) {
    proximoRelatorio.setDate(proximoRelatorio.getDate() + 1);
  }
  
  return proximoRelatorio;
}

/**
 * Minutos atÃ¡Â© o prÃ³ximo relatÃ³rio matinal
 */
export function minutosAteProximoRelatorio(): number {
  const agora = new Date();
  const proximo = calcularProximoRelatorioMatinal();
  return Math.ceil((proximo.getTime() - agora.getTime()) / (1000 * 60));
} 

