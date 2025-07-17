// ========================================
// ðŸŽ® DISCORD WEBHOOK SERVICE - SGB
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
// ðŸŽ® DISCORD SERVICE CLASS
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
      const testData = {
        bar_id: 'test',
        webhook_type: 'sistema' as const,
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
  static async enviarAlertaAnomalia(anomalia: any): Promise<boolean> {
    try {
      const data = {
        bar_id: anomalia.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: `ðŸš¨ ${anomalia.titulo || 'Anomalia Detectada'}`,
        description: anomalia.descricao || 'Anomalia crÃ­tica detectada pelo sistema de IA',
        fields: [
          {
            name: 'ðŸ“Š Tipo',
            value: anomalia.tipo_anomalia || 'N/A',
            inline: true
          },
          {
            name: 'âš ï¸ Severidade',
            value: anomalia.severidade || 'N/A',
            inline: true
          },
          {
            name: 'ðŸ“ˆ Valor Esperado',
            value: anomalia.valor_esperado?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'ðŸ“‰ Valor Observado',
            value: anomalia.valor_observado?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'ðŸ“Š Desvio',
            value: `${anomalia.desvio_percentual || 0}%`,
            inline: true
          },
          {
            name: 'ðŸŽ¯ ConfianÃ§a',
            value: `${anomalia.confianca_deteccao || 0}%`,
            inline: true
          }
        ],
        color: anomalia.severidade === 'critica' ? 0xff0000 : 0xff6600 // Vermelho para crÃ­tica, laranja para outras
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('âŒ Erro ao enviar alerta de anomalia:', error)
      return false
    }
  }

  // MÃ©todo para enviar relatÃ³rio matinal
  static async enviarRelatorioMatinal(dashboardData: any): Promise<boolean> {
    try {
      const data = {
        bar_id: dashboardData.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: 'ðŸŒ… RelatÃ³rio Matinal - SGB Analytics',
        description: `Resumo das anÃ¡lises e mÃ©tricas do dia anterior gerado pelo sistema de IA`,
        fields: [
          {
            name: 'ðŸ“Š MÃ©tricas Calculadas',
            value: dashboardData.metricas_count?.toString() || '0',
            inline: true
          },
          {
            name: 'ðŸš¨ Anomalias Detectadas',
            value: dashboardData.anomalias_count?.toString() || '0',
            inline: true
          },
          {
            name: 'ðŸ’¡ Insights Gerados',
            value: dashboardData.insights_count?.toString() || '0',
            inline: true
          },
          {
            name: 'ðŸ“ˆ Score Geral',
            value: dashboardData.score_geral?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'â° HorÃ¡rio de GeraÃ§Ã£o',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00aa55 // Verde para relatÃ³rio matinal
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('âŒ Erro ao enviar relatÃ³rio matinal:', error)
      return false
    }
  }

  // MÃ©todos de conveniÃªncia para tipos especÃ­ficos de webhook
  static async sendSystemNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'sistema',
      title,
      description,
      fields,
      color: 0xff0000 // Vermelho para sistema/seguranÃ§a
    })
  }

  static async sendContaAzulNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'contaazul',
      title,
      description,
      fields,
      color: 0x0066cc // Azul para ContaAzul
    })
  }

  static async sendChecklistNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'checklists',
      title,
      description,
      fields,
      color: 0x00cc66 // Verde para checklists
    })
  }

  static async sendSalesNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'vendas',
      title,
      description,
      fields,
      color: 0x00ff00 // Verde para vendas
    })
  }

  static async sendReservationNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'reservas',
      title,
      description,
      fields,
      color: 0x6600cc // Roxo para reservas
    })
  }

  static async sendMetaNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'meta',
      title,
      description,
      fields,
      color: 0xff6600 // Laranja para Meta/Social
    })
  }

  // MÃ©todo para enviar embed diretamente (compatibilidade com bot)
  static async sendEmbed(embed: DiscordEmbed): Promise<boolean> {
    try {
      const data = {
        bar_id: 'bot',
        webhook_type: 'sistema' as const,
        title: embed.title || 'Mensagem do Bot',
        description: embed.description || '',
        fields: embed.fields || [],
        color: embed.color || 0x5865F2
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('âŒ Erro ao enviar embed Discord:', error)
      return false
    }
  }

  // MÃ©todo para enviar mensagem de texto simples
  static async sendMessage(message: string): Promise<boolean> {
    try {
      const data = {
        bar_id: 'bot',
        webhook_type: 'sistema' as const,
        title: 'ðŸ¤– SGB Bot',
        description: message,
        color: 0x5865F2
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('âŒ Erro ao enviar mensagem Discord:', error)
      return false
    }
  }
}

// ========================================
// ðŸ­ FACTORY E CONFIGURAÃ‡Ã•ES
// ========================================

/**
 * Discord Service para SGB (OrdinÃ¡rio)
 * Como a classe Ã© totalmente estÃ¡tica, exportamos diretamente
 */
export const sgbDiscordService = DiscordService;

// ========================================
// ðŸ• AGENDAMENTO PARA 8H DA MANHÃƒ
// ========================================

/**
 * Verifica se Ã© hora de enviar relatÃ³rio matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  
  // 8h da manhÃ£ (entre 8:00 e 8:05 para dar margem)
  return hora === 8 && minuto <= 5;
}

/**
 * Agendar prÃ³ximo relatÃ³rio matinal
 */
export function calcularProximoRelatorioMatinal(): Date {
  const agora = new Date();
  const proximoRelatorio = new Date();
  
  // Configurar para 8h da manhÃ£
  proximoRelatorio.setHours(8, 0, 0, 0);
  
  // Se jÃ¡ passou das 8h hoje, agendar para amanhÃ£
  if (agora.getHours() >= 8) {
    proximoRelatorio.setDate(proximoRelatorio.getDate() + 1);
  }
  
  return proximoRelatorio;
}

/**
 * Minutos atÃ© o prÃ³ximo relatÃ³rio matinal
 */
export function minutosAteProximoRelatorio(): number {
  const agora = new Date();
  const proximo = calcularProximoRelatorioMatinal();
  return Math.ceil((proximo.getTime() - agora.getTime()) / (1000 * 60));
} 
