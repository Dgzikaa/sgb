// Sistema de Alertas Inteligentes para Zykor
import { businessMonitor, errorMonitor } from './monitoring';

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (data: any) => boolean;
  severity: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
  cooldown: number; // minutos
  channels: ('discord' | 'slack' | 'email' | 'sms')[];
  lastTriggered?: number;
}

export interface NotificationChannel {
  type: 'discord' | 'slack' | 'email' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

class AlertManager {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private channels: NotificationChannel[] = [];
  private listeners: ((alert: Alert) => void)[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.initializeChannels();
  }

  // Regras padrão do sistema
  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'high_error_rate',
        name: 'Taxa de Erro Elevada',
        description: 'Mais de 10 erros em 5 minutos',
        condition: (data) => {
          const recentErrors = this.alerts.filter(
            alert => alert.type === 'error' && 
            Date.now() - alert.timestamp < 5 * 60 * 1000
          );
          return recentErrors.length > 10;
        },
        severity: 4,
        enabled: true,
        cooldown: 15,
        channels: ['discord', 'slack']
      },
      {
        id: 'database_connection_failure',
        name: 'Falha de Conexão com Database',
        description: 'Erro de conexão com Supabase',
        condition: (data) => {
          return data.error?.message?.includes('connection') || 
                 data.error?.message?.includes('database');
        },
        severity: 5,
        enabled: true,
        cooldown: 5,
        channels: ['discord', 'slack', 'email']
      },
      {
        id: 'slow_api_response',
        name: 'API Lenta',
        description: 'Tempo de resposta > 5 segundos',
        condition: (data) => {
          return data.responseTime && data.responseTime > 5000;
        },
        severity: 3,
        enabled: true,
        cooldown: 30,
        channels: ['discord']
      },
      {
        id: 'payment_failure',
        name: 'Falha no Pagamento',
        description: 'Erro no processamento de pagamento',
        condition: (data) => {
          return data.event === 'payment_failed' || 
                 data.error?.message?.includes('payment');
        },
        severity: 4,
        enabled: true,
        cooldown: 0, // Sem cooldown para pagamentos
        channels: ['discord', 'slack', 'email']
      },
      {
        id: 'memory_usage_high',
        name: 'Uso de Memória Alto',
        description: 'Uso de memória acima de 80%',
        condition: (data) => {
          return data.memory && data.memory > 80;
        },
        severity: 3,
        enabled: true,
        cooldown: 60,
        channels: ['discord']
      }
    ];
  }

  // Configurar canais de notificação
  private initializeChannels() {
    this.channels = [
      {
        type: 'discord',
        config: {
          webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
          channel: '#zykor-alerts',
          username: 'Zykor Monitor',
          avatar: 'https://zykor.com.br/logos/zykor-logo.png'
        },
        enabled: !!process.env.DISCORD_WEBHOOK_URL
      },
      {
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: '#zykor-alerts',
          username: 'Zykor Monitor'
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL
      },
      {
        type: 'email',
        config: {
          to: process.env.ALERT_EMAIL || 'rodrigo.zykor@gmail.com.br',
          from: 'alerts@zykor.com.br',
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        enabled: !!process.env.ALERT_EMAIL
      }
    ];
  }

  // Criar alerta
  createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    source: string,
    severity: Alert['severity'] = 3,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      source,
      severity,
      metadata: metadata || {},
      resolved: false
    };

    this.alerts.push(alert);
    
    // Verificar regras e enviar notificações
    this.processAlert(alert);
    
    // Notificar listeners
    this.listeners.forEach(listener => listener(alert));
    
    // Limitar histórico de alertas
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    return alert;
  }

  // Processar alerta contra regras
  private async processAlert(alert: Alert) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Verificar cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered < rule.cooldown * 60 * 1000) {
        continue;
      }

      // Verificar condição
      try {
        if (rule.condition({ alert, ...alert.metadata })) {
          await this.sendNotification(alert, rule);
          this.rules.find(r => r.id === rule.id)!.lastTriggered = Date.now();
        }
      } catch (error) {
        console.error(`Erro ao processar regra ${rule.id}:`, error);
      }
    }
  }

  // Enviar notificação
  private async sendNotification(alert: Alert, rule: AlertRule) {
    const enabledChannels = this.channels.filter(
      channel => channel.enabled && rule.channels.includes(channel.type)
    );

    for (const channel of enabledChannels) {
      try {
        await this.sendToChannel(alert, rule, channel);
      } catch (error) {
        console.error(`Erro ao enviar para ${channel.type}:`, error);
      }
    }
  }

  // Enviar para canal específico
  private async sendToChannel(alert: Alert, rule: AlertRule, channel: NotificationChannel) {
    const message = this.formatMessage(alert, rule);

    switch (channel.type) {
      case 'discord':
        await this.sendToDiscord(message, channel.config);
        break;
      case 'slack':
        await this.sendToSlack(message, channel.config);
        break;
      case 'email':
        await this.sendEmail(alert, rule, channel.config);
        break;
      case 'sms':
        await this.sendSMS(message, channel.config);
        break;
    }
  }

  // Formatar mensagem
  private formatMessage(alert: Alert, rule: AlertRule): string {
    const emoji = this.getSeverityEmoji(alert.severity);
    const timestamp = new Date(alert.timestamp).toLocaleString('pt-BR');
    
    return `${emoji} **${rule.name}**\n` +
           `📋 **Descrição:** ${alert.title}\n` +
           `📝 **Detalhes:** ${alert.message}\n` +
           `🔍 **Fonte:** ${alert.source}\n` +
           `⚠️ **Severidade:** ${alert.severity}/5\n` +
           `🕒 **Hora:** ${timestamp}\n` +
           `🆔 **ID:** ${alert.id}`;
  }

  // Enviar para Discord
  private async sendToDiscord(message: string, config: any) {
    if (!config.webhookUrl) return;

    const payload = {
      username: config.username || 'Zykor Monitor',
      avatar_url: config.avatar,
      content: message,
      embeds: [{
        color: 0xff0000, // Vermelho para alertas
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Zykor Monitoring System'
        }
      }]
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // Enviar para Slack
  private async sendToSlack(message: string, config: any) {
    if (!config.webhookUrl) return;

    const payload = {
      username: config.username || 'Zykor Monitor',
      channel: config.channel,
      text: message,
      attachments: [{
        color: 'danger',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // Enviar email
  private async sendEmail(alert: Alert, rule: AlertRule, config: any) {
    // Implementar envio de email (usar serviço como SendGrid, SES, etc.)
    console.log('📧 Email alert:', { alert, rule, config });
  }

  // Enviar SMS
  private async sendSMS(message: string, config: any) {
    // Implementar envio de SMS (usar serviço como Twilio, etc.)
    console.log('📱 SMS alert:', { message, config });
  }

  // Obter emoji de severidade
  private getSeverityEmoji(severity: number): string {
    switch (severity) {
      case 1: return '🔵'; // Info
      case 2: return '🟡'; // Warning
      case 3: return '🟠'; // Medium
      case 4: return '🔴'; // High
      case 5: return '🚨'; // Critical
      default: return '⚪';
    }
  }

  // Métodos públicos
  getAlerts(limit = 100): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getUnresolvedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  addListener(callback: (alert: Alert) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (alert: Alert) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Métodos específicos do Zykor
  alertError(error: Error, source: string, metadata?: Record<string, any>) {
    return this.createAlert(
      'error',
      `Erro no ${source}`,
      error.message,
      source,
      4,
      { error: error.message, stack: error.stack, ...metadata }
    );
  }

  alertSlowResponse(endpoint: string, responseTime: number, threshold = 5000) {
    if (responseTime > threshold) {
      return this.createAlert(
        'warning',
        'API Lenta Detectada',
        `Endpoint ${endpoint} respondeu em ${responseTime}ms (limite: ${threshold}ms)`,
        'api_monitor',
        3,
        { endpoint, responseTime, threshold }
      );
    }
  }

  alertHighMemoryUsage(usage: number, threshold = 80) {
    if (usage > threshold) {
      return this.createAlert(
        'warning',
        'Uso de Memória Alto',
        `Uso de memória em ${usage}% (limite: ${threshold}%)`,
        'system_monitor',
        3,
        { memory: usage, threshold }
      );
    }
  }

  alertPaymentFailure(orderId: string, error: string) {
    return this.createAlert(
      'critical',
      'Falha no Pagamento',
      `Falha no processamento do pagamento para pedido ${orderId}: ${error}`,
      'payment_system',
      5,
      { orderId, paymentError: error }
    );
  }

  alertDatabaseConnection(error: string) {
    return this.createAlert(
      'critical',
      'Falha de Conexão com Database',
      `Erro de conexão com Supabase: ${error}`,
      'database',
      5,
      { databaseError: error }
    );
  }
}

// Instância global
export const alertManager = new AlertManager();

// Hooks para React
export const useAlerts = () => {
  return {
    createAlert: alertManager.createAlert.bind(alertManager),
    getAlerts: alertManager.getAlerts.bind(alertManager),
    getUnresolvedAlerts: alertManager.getUnresolvedAlerts.bind(alertManager),
    resolveAlert: alertManager.resolveAlert.bind(alertManager),
    addListener: alertManager.addListener.bind(alertManager),
    removeListener: alertManager.removeListener.bind(alertManager),
    
    // Métodos específicos
    alertError: alertManager.alertError.bind(alertManager),
    alertSlowResponse: alertManager.alertSlowResponse.bind(alertManager),
    alertHighMemoryUsage: alertManager.alertHighMemoryUsage.bind(alertManager),
    alertPaymentFailure: alertManager.alertPaymentFailure.bind(alertManager),
    alertDatabaseConnection: alertManager.alertDatabaseConnection.bind(alertManager),
  };
};
