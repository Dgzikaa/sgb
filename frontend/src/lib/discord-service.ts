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
  webhook_type?: 'sistema' | 'contaazul' | 'meta' | 'checklists' | 'contahub' | 'vendas' | 'reservas'
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

  // Métodos de conveniência para tipos específicos de webhook
  static async sendSystemNotification(barId: string, title: string, description: string, fields?: any[]) {
    return this.sendNotification({
      bar_id: barId,
      webhook_type: 'sistema',
      title,
      description,
      fields,
      color: 0xff0000 // Vermelho para sistema/segurança
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
}

// ========================================
// 🏭 FACTORY E CONFIGURAÇÕES
// ========================================

/**
 * Criar instância do Discord Service
 */
export function createDiscordService(webhookUrl: string): DiscordService {
  return new DiscordService(
    webhookUrl,
    'SGB Analytics Bot',
    'https://cdn.discordapp.com/embed/avatars/5.png'
  );
}

/**
 * Discord Service para SGB (Ordinário)
 */
export const sgbDiscordService = createDiscordService(
  'https://discord.com/api/webhooks/1391182158252609586/YXrYYQJImCOSZj9ZeDoz_jOLcK2CW7rGc-q-xV8BkaegBNNLq0nksg7JaI1y_B0F8Okz'
);

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