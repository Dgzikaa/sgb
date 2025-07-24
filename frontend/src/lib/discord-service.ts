// ========================================
// 🎮 DISCORD WEBHOOK SERVICE - SGB
// ========================================
// Service completo para notificações via Discord
// Integração com agente IA para relatórios automáticos

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
  webhook_type?: 'sistema' | 'windsor' | 'nibo' | 'checklists' | 'contahub' | 'vendas' | 'reservas'
}

interface AIAnomaly {
  tipo_anomalia: string
  subtipo: string
  severidade: string
  titulo: string
  descricao: string
  objeto_id?: number
  objeto_tipo?: string
  objeto_nome?: string
  valor_esperado: number
  valor_observado: number
  desvio_percentual: number
  confianca_deteccao: number
  possivel_causa: string
  impacto_estimado: string
  acoes_sugeridas: string[]
  metricas_anomalia: Record<string, unknown>
  periodo_deteccao: string
  status: string
}

// ========================================
// 🎮 DISCORD SERVICE CLASS
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
        throw new Error(result.error || 'Erro ao enviar notificação')
      }

      console.log('✅ Notificação Discord enviada:', result)
      return result
    } catch (error) {
      console.error('❌ Erro ao enviar notificação Discord:', error)
      throw error
    }
  }

  // Método para testar conexão com Discord
  static async testarConexao(): Promise<boolean> {
    try {
      const testData = {
        bar_id: 'test',
        webhook_type: 'sistema' as const,
        title: '🧪 Teste de Conexão',
        description: 'Este é um teste automático de conectividade com Discord',
        fields: [
          {
            name: '⚡ Status',
            value: 'Conexão funcionando corretamente',
            inline: true
          },
          {
            name: '🕐 Horário',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00ff00 // Verde para sucesso
      }

      await this.sendNotification(testData)
      return true
    } catch (error) {
      console.error('❌ Erro ao testar conexão Discord:', error)
      return false
    }
  }

  // Método para enviar alertas de anomalia
  static async enviarAlertaAnomalia(anomalia: AIAnomaly): Promise<boolean> {
    try {
      const data = {
        bar_id: anomalia.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: `🚨 ${anomalia.titulo || 'Anomalia Detectada'}`,
        description: anomalia.descricao || 'Anomalia crítica detectada pelo sistema de IA',
        fields: [
          {
            name: '📊 Tipo',
            value: anomalia.tipo_anomalia || 'N/A',
            inline: true
          },
          {
            name: '⚠️ Severidade',
            value: anomalia.severidade || 'N/A',
            inline: true
          },
          {
            name: '📈 Valor Esperado',
            value: anomalia.valor_esperado?.toString() || 'N/A',
            inline: true
          },
          {
            name: '📉 Valor Observado',
            value: anomalia.valor_observado?.toString() || 'N/A',
            inline: true
          },
          {
            name: '📊 Desvio',
            value: `${anomalia.desvio_percentual || 0}%`,
            inline: true
          },
          {
            name: '🎯 Confiança',
            value: `${anomalia.confianca_deteccao || 0}%`,
            inline: true
          }
        ],
        color: anomalia.severidade === 'critica' ? 0xff0000 : 0xff6600 // Vermelho para crítica, laranja para outras
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar alerta de anomalia:', error)
      return false
    }
  }

  // Método para enviar relatório matinal
  static async enviarRelatorioMatinal(dashboardData: unknown): Promise<boolean> {
    try {
      const data = {
        bar_id: dashboardData.bar_id || 'unknown',
        webhook_type: 'sistema' as const,
        title: '🌅 Relatório Matinal - SGB Analytics',
        description: `Resumo das análises e métricas do dia anterior gerado pelo sistema de IA`,
        fields: [
          {
            name: '📊 Métricas Calculadas',
            value: dashboardData.metricas_count?.toString() || '0',
            inline: true
          },
          {
            name: '🚨 Anomalias Detectadas',
            value: dashboardData.anomalias_count?.toString() || '0',
            inline: true
          },
          {
            name: '💡 Insights Gerados',
            value: dashboardData.insights_count?.toString() || '0',
            inline: true
          },
          {
            name: '📈 Score Geral',
            value: dashboardData.score_geral?.toString() || 'N/A',
            inline: true
          },
          {
            name: '⏰ Horário de Geração',
            value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            inline: true
          }
        ],
        color: 0x00aa55 // Verde para relatório matinal
      }

      await this.sendNotification(data)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar relatório matinal:', error)
      return false
    }
  }

  // Métodos de conveniência para tipos específicos de webhook
  static async sendSystemNotification(barId: string, title: string, description: string, fields?: unknown[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'sistema',
      title,
      description,
      fields,
      color: 0xff0000 // Vermelho para sistema/segurança
    })
  }

  static async sendWindsorNotification(barId: string, title: string, description: string, fields?: unknown[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'windsor',
      title,
      description,
      fields,
      color: 0x8b5cf6 // Roxo para Windsor.ai
    })
  }

  static async sendChecklistNotification(barId: string, title: string, description: string, fields?: unknown[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'checklists',
      title,
      description,
      fields,
      color: 0x00cc66 // Verde para checklists
    })
  }

  static async sendSalesNotification(barId: string, title: string, description: string, fields?: unknown[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'vendas',
      title,
      description,
      fields,
      color: 0x00ff00 // Verde para vendas
    })
  }

  static async sendReservationNotification(barId: string, title: string, description: string, fields?: unknown[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'reservas',
      title,
      description,
      fields,
      color: 0x6600cc // Roxo para reservas
    })
  }

  static async sendNiboNotification(barId: string, title: string, description: string, fields?: unknown[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'nibo',
      title,
      description,
      fields,
      color: 0xf97316 // Laranja para NIBO
    })
  }

  // Método para enviar embed diretamente (compatibilidade com bot)
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
      console.error('❌ Erro ao enviar embed Discord:', error)
      return false
    }
  }

  // Método para enviar mensagem de texto simples
  static async sendMessage(message: string): Promise<boolean> {
    try {
      const data = {
        bar_id: 'bot',
        webhook_type: 'sistema' as const,
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
// 🏭 FACTORY E CONFIGURAÇÕES
// ========================================

/**
 * Discord Service para SGB (Ordinário)
 * Como a classe é totalmente estática, exportamos diretamente
 */
export const sgbDiscordService = DiscordService;

// ========================================
// 🕐 AGENDAMENTO PARA 8H DA MANHÃ
// ========================================

/**
 * Verifica se é hora de enviar relatório matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  
  // 8h da manhã (entre 8:00 e 8:05 para dar margem)
  return hora === 8 && minuto <= 5;
}

/**
 * Agendar próximo relatório matinal
 */
export function calcularProximoRelatorioMatinal(): Date {
  const agora = new Date();
  const proximoRelatorio = new Date();
  
  // Configurar para 8h da manhã
  proximoRelatorio.setHours(8, 0, 0, 0);
  
  // Se já passou das 8h hoje, agendar para amanhã
  if (agora.getHours() >= 8) {
    proximoRelatorio.setDate(proximoRelatorio.getDate() + 1);
  }
  
  return proximoRelatorio;
}

/**
 * Minutos até o próximo relatório matinal
 */
export function minutosAteProximoRelatorio(): number {
  const agora = new Date();
  const proximo = calcularProximoRelatorioMatinal();
  return Math.ceil((proximo.getTime() - agora.getTime()) / (1000 * 60));
} 
