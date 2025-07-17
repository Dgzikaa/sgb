// ========================================
// üéÆ DISCORD WEBHOOK SERVICE - SGB
// ========================================
// Service completo para notifica·ß·µes via Discord
// Integra·ß·£o com agente IA para relat·≥rios autom·°ticos

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
// üéÆ DISCORD SERVICE CLASS
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
        throw new Error(result.error || 'Erro ao enviar notifica·ß·£o')
      }

      console.log('úÖ Notifica·ß·£o Discord enviada:', result)
      return result
    } catch (error) {
      console.error('ùå Erro ao enviar notifica·ß·£o Discord:', error)
      throw error
    }
  }

  // M·©todo para testar conex·£o com Discord
  static async testarConexao(): Promise<boolean> {
    try {
      const testData = {
        bar_id: 'test',
        webhook_type: 'sistema' as const,
        title: 'üß™ Teste de Conex·£o',
        description: 'Este ·© um teste autom·°tico de conectividade com Discord',
        fields: [
          {
            name: 'ö° Status',
            value: 'Conex·£o funcionando corretamente',
            inline: true
          },
          {
            name: 'üïê Hor·°rio',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00ff00 // Verde para sucesso
      }

      await this.sendNotification(testData)
      return true
    } catch (error) {
      console.error('ùå Erro ao testar conex·£o Discord:', error)
      return false
    }
  }

  // M·©todo para enviar alertas de anomalia
  static async enviarAlertaAnomalia(anomalia: any): Promise<boolean> {
    try {
      const data = {
        bar_id: anomalia.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: `üö® ${anomalia.titulo || 'Anomalia Detectada'}`,
        description: anomalia.descricao || 'Anomalia cr·≠tica detectada pelo sistema de IA',
        fields: [
          {
            name: 'üìä Tipo',
            value: anomalia.tipo_anomalia || 'N/A',
            inline: true
          },
          {
            name: 'ö†Ô∏è Severidade',
            value: anomalia.severidade || 'N/A',
            inline: true
          },
          {
            name: 'üìà Valor Esperado',
            value: anomalia.valor_esperado?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'üìâ Valor Observado',
            value: anomalia.valor_observado?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'üìä Desvio',
            value: `${anomalia.desvio_percentual || 0}%`,
            inline: true
          },
          {
            name: 'üéØ Confian·ßa',
            value: `${anomalia.confianca_deteccao || 0}%`,
            inline: true
          }
        ],
        color: anomalia.severidade === 'critica' ? 0xff0000 : 0xff6600 // Vermelho para cr·≠tica, laranja para outras
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('ùå Erro ao enviar alerta de anomalia:', error)
      return false
    }
  }

  // M·©todo para enviar relat·≥rio matinal
  static async enviarRelatorioMatinal(dashboardData: any): Promise<boolean> {
    try {
      const data = {
        bar_id: dashboardData.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: 'üåÖ Relat·≥rio Matinal - SGB Analytics',
        description: `Resumo das an·°lises e m·©tricas do dia anterior gerado pelo sistema de IA`,
        fields: [
          {
            name: 'üìä M·©tricas Calculadas',
            value: dashboardData.metricas_count?.toString() || '0',
            inline: true
          },
          {
            name: 'üö® Anomalias Detectadas',
            value: dashboardData.anomalias_count?.toString() || '0',
            inline: true
          },
          {
            name: 'üí° Insights Gerados',
            value: dashboardData.insights_count?.toString() || '0',
            inline: true
          },
          {
            name: 'üìà Score Geral',
            value: dashboardData.score_geral?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'è∞ Hor·°rio de Gera·ß·£o',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00aa55 // Verde para relat·≥rio matinal
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('ùå Erro ao enviar relat·≥rio matinal:', error)
      return false
    }
  }

  // M·©todos de conveni·™ncia para tipos espec·≠ficos de webhook
  static async sendSystemNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'sistema',
      title,
      description,
      fields,
      color: 0xff0000 // Vermelho para sistema/seguran·ßa
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

  // M·©todo para enviar embed diretamente (compatibilidade com bot)
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
      console.error('ùå Erro ao enviar embed Discord:', error)
      return false
    }
  }

  // M·©todo para enviar mensagem de texto simples
  static async sendMessage(message: string): Promise<boolean> {
    try {
      const data = {
        bar_id: 'bot',
        webhook_type: 'sistema' as const,
        title: 'ü§ñ SGB Bot',
        description: message,
        color: 0x5865F2
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('ùå Erro ao enviar mensagem Discord:', error)
      return false
    }
  }
}

// ========================================
// üè≠ FACTORY E CONFIGURA·á·ïES
// ========================================

/**
 * Discord Service para SGB (Ordin·°rio)
 * Como a classe ·© totalmente est·°tica, exportamos diretamente
 */
export const sgbDiscordService = DiscordService;

// ========================================
// üïê AGENDAMENTO PARA 8H DA MANH·É
// ========================================

/**
 * Verifica se ·© hora de enviar relat·≥rio matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  
  // 8h da manh·£ (entre 8:00 e 8:05 para dar margem)
  return hora === 8 && minuto <= 5;
}

/**
 * Agendar pr·≥ximo relat·≥rio matinal
 */
export function calcularProximoRelatorioMatinal(): Date {
  const agora = new Date();
  const proximoRelatorio = new Date();
  
  // Configurar para 8h da manh·£
  proximoRelatorio.setHours(8, 0, 0, 0);
  
  // Se j·° passou das 8h hoje, agendar para amanh·£
  if (agora.getHours() >= 8) {
    proximoRelatorio.setDate(proximoRelatorio.getDate() + 1);
  }
  
  return proximoRelatorio;
}

/**
 * Minutos at·© o pr·≥ximo relat·≥rio matinal
 */
export function minutosAteProximoRelatorio(): number {
  const agora = new Date();
  const proximo = calcularProximoRelatorioMatinal();
  return Math.ceil((proximo.getTime() - agora.getTime()) / (1000 * 60));
} 
