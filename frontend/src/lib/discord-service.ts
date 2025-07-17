// ========================================
// ðŸŽ® DISCORD WEBHOOK SERVICE - SGB
// ========================================
// Service completo para notificaá§áµes via Discord
// Integraá§á£o com agente IA para relatá³rios automá¡ticos

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
        throw new Error(result.error || 'Erro ao enviar notificaá§á£o')
      }

      console.log('œ… Notificaá§á£o Discord enviada:', result)
      return result
    } catch (error) {
      console.error('Œ Erro ao enviar notificaá§á£o Discord:', error)
      throw error
    }
  }

  // Má©todo para testar conexá£o com Discord
  static async testarConexao(): Promise<boolean> {
    try {
      const testData = {
        bar_id: 'test',
        webhook_type: 'sistema' as const,
        title: 'ðŸ§ª Teste de Conexá£o',
        description: 'Este á© um teste automá¡tico de conectividade com Discord',
        fields: [
          {
            name: 'š¡ Status',
            value: 'Conexá£o funcionando corretamente',
            inline: true
          },
          {
            name: 'ðŸ• Horá¡rio',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00ff00 // Verde para sucesso
      }

      await this.sendNotification(testData)
      return true
    } catch (error) {
      console.error('Œ Erro ao testar conexá£o Discord:', error)
      return false
    }
  }

  // Má©todo para enviar alertas de anomalia
  static async enviarAlertaAnomalia(anomalia: any): Promise<boolean> {
    try {
      const data = {
        bar_id: anomalia.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: `ðŸš¨ ${anomalia.titulo || 'Anomalia Detectada'}`,
        description: anomalia.descricao || 'Anomalia crá­tica detectada pelo sistema de IA',
        fields: [
          {
            name: 'ðŸ“Š Tipo',
            value: anomalia.tipo_anomalia || 'N/A',
            inline: true
          },
          {
            name: 'š ï¸ Severidade',
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
            name: 'ðŸŽ¯ Confianá§a',
            value: `${anomalia.confianca_deteccao || 0}%`,
            inline: true
          }
        ],
        color: anomalia.severidade === 'critica' ? 0xff0000 : 0xff6600 // Vermelho para crá­tica, laranja para outras
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('Œ Erro ao enviar alerta de anomalia:', error)
      return false
    }
  }

  // Má©todo para enviar relatá³rio matinal
  static async enviarRelatorioMatinal(dashboardData: any): Promise<boolean> {
    try {
      const data = {
        bar_id: dashboardData.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: 'ðŸŒ… Relatá³rio Matinal - SGB Analytics',
        description: `Resumo das aná¡lises e má©tricas do dia anterior gerado pelo sistema de IA`,
        fields: [
          {
            name: 'ðŸ“Š Má©tricas Calculadas',
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
            name: '° Horá¡rio de Geraá§á£o',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00aa55 // Verde para relatá³rio matinal
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('Œ Erro ao enviar relatá³rio matinal:', error)
      return false
    }
  }

  // Má©todos de conveniáªncia para tipos especá­ficos de webhook
  static async sendSystemNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'sistema',
      title,
      description,
      fields,
      color: 0xff0000 // Vermelho para sistema/seguraná§a
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

  // Má©todo para enviar embed diretamente (compatibilidade com bot)
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
      console.error('Œ Erro ao enviar embed Discord:', error)
      return false
    }
  }

  // Má©todo para enviar mensagem de texto simples
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
      console.error('Œ Erro ao enviar mensagem Discord:', error)
      return false
    }
  }
}

// ========================================
// ðŸ­ FACTORY E CONFIGURAá‡á•ES
// ========================================

/**
 * Discord Service para SGB (Ordiná¡rio)
 * Como a classe á© totalmente está¡tica, exportamos diretamente
 */
export const sgbDiscordService = DiscordService;

// ========================================
// ðŸ• AGENDAMENTO PARA 8H DA MANHáƒ
// ========================================

/**
 * Verifica se á© hora de enviar relatá³rio matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  
  // 8h da manhá£ (entre 8:00 e 8:05 para dar margem)
  return hora === 8 && minuto <= 5;
}

/**
 * Agendar prá³ximo relatá³rio matinal
 */
export function calcularProximoRelatorioMatinal(): Date {
  const agora = new Date();
  const proximoRelatorio = new Date();
  
  // Configurar para 8h da manhá£
  proximoRelatorio.setHours(8, 0, 0, 0);
  
  // Se já¡ passou das 8h hoje, agendar para amanhá£
  if (agora.getHours() >= 8) {
    proximoRelatorio.setDate(proximoRelatorio.getDate() + 1);
  }
  
  return proximoRelatorio;
}

/**
 * Minutos atá© o prá³ximo relatá³rio matinal
 */
export function minutosAteProximoRelatorio(): number {
  const agora = new Date();
  const proximo = calcularProximoRelatorioMatinal();
  return Math.ceil((proximo.getTime() - agora.getTime()) / (1000 * 60));
} 
