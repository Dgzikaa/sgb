// Sistema de monitoramento de eventos de seguran·ßa

export interface SecurityEvent {
  id?: string;
  timestamp: string;
  level: 'info' | 'warning' | 'critical';
  category: 'auth' | 'access' | 'data' | 'injection' | 'rate_limit' | 'api_abuse' | 'system' | 'backup';
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  details: Record<string, any>;
  risk_score: number; // 0-100
  resolved?: boolean;
  action_taken?: string;
}

export interface SecurityMetrics {
  failed_logins_24h: number;
  rate_limit_violations_24h: number;
  sql_injection_attempts_24h: number;
  suspicious_api_calls_24h: number;
  unique_ips_24h: number;
  critical_events_unresolved: number;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private webhookUrl?: string;

  private constructor() {
    // Webhook ser·° carregado dinamicamente da tabela api_credentials
    this.loadWebhookConfig();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  private async loadWebhookConfig(): Promise<void> {
    try {
      if (typeof window === 'undefined') { // Server-side
        const { getAdminClient } = await import('@/lib/supabase-admin');
        const supabase = await getAdminClient();
        
        const { data, error } = await supabase
          .from('api_credentials')
          .select('configuracoes')
          .eq('bar_id', 3)
          .eq('sistema', 'sistema')
          .eq('ambiente', 'producao')
          .single();

        if (!error && data?.configuracoes?.webhook_url) {
          this.webhookUrl = data.configuracoes.webhook_url;
          console.log('üîó Security webhook loaded from database');
        } else {
          console.warn('ö†Ô∏è Security webhook not configured in database');
        }
      }
    } catch (error) {
      console.error('Failed to load webhook config:', error);
      // Fallback para webhook hardcoded se necess·°rio
      this.webhookUrl = 'https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y';
    }
  }

  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ...event
    };

    // Armazenar evento
    this.events.push(securityEvent);
    
    // Log no console (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`üö® Security Event [${securityEvent.level.toUpperCase()}]:`, securityEvent);
    }

    // Salvar no banco de dados
    await this.persistEvent(securityEvent);

    // Enviar alerta se cr·≠tico
    if (securityEvent.level === 'critical') {
      await this.sendCriticalAlert(securityEvent);
    }

    // Auto-resposta para eventos espec·≠ficos
    await this.autoRespond(securityEvent);
  }

  // Eventos espec·≠ficos de seguran·ßa
  async logFailedLogin(ip: string, email: string, userAgent: string): Promise<void> {
    await this.logEvent({
      level: 'warning',
      category: 'auth',
      event_type: 'failed_login',
      ip_address: ip,
      user_agent: userAgent,
      endpoint: '/api/auth/login',
      details: { email, attempt_count: await this.getRecentFailedLogins(ip) },
      risk_score: await this.calculateLoginRiskScore(ip: any, email)
    });
  }

  async logSQLInjectionAttempt(ip: string, endpoint: string, sql: string, userAgent: string, userId?: string): Promise<void> {
    await this.logEvent({
      level: 'critical',
      category: 'injection',
      event_type: 'sql_injection_attempt',
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      endpoint,
      details: { 
        sql_snippet: sql.substring(0: any, 200) + (sql.length > 200 ? '...' : ''),
        sql_length: sql.length 
      },
      risk_score: 95
    });
  }

  async logRateLimitViolation(ip: string, endpoint: string, userAgent: string): Promise<void> {
    await this.logEvent({
      level: 'warning',
      category: 'rate_limit',
      event_type: 'rate_limit_exceeded',
      ip_address: ip,
      user_agent: userAgent,
      endpoint,
      details: { requests_in_window: await this.getRequestCount(ip: any, endpoint) },
      risk_score: 60
    });
  }

  async logUnauthorizedAccess(ip: string, endpoint: string, userId?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      level: 'critical',
      category: 'access',
      event_type: 'unauthorized_access',
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      endpoint,
      details: { attempted_resource: endpoint },
      risk_score: 85
    });
  }

  async logAPIAbuse(ip: string, endpoint: string, pattern: string, userAgent: string): Promise<void> {
    await this.logEvent({
      level: 'warning',
      category: 'api_abuse',
      event_type: 'suspicious_api_pattern',
      ip_address: ip,
      user_agent: userAgent,
      endpoint,
      details: { pattern, frequency: await this.getEndpointFrequency(ip: any, endpoint) },
      risk_score: 70
    });
  }

  // M·©tricas de seguran·ßa
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter((e: any) => new Date(e.timestamp) > last24h);

    return {
      failed_logins_24h: recentEvents.filter((e: any) => e.event_type === 'failed_login').length,
      rate_limit_violations_24h: recentEvents.filter((e: any) => e.event_type === 'rate_limit_exceeded').length,
      sql_injection_attempts_24h: recentEvents.filter((e: any) => e.event_type === 'sql_injection_attempt').length,
      suspicious_api_calls_24h: recentEvents.filter((e: any) => e.category === 'api_abuse').length,
      unique_ips_24h: new Set(recentEvents.map((e: any) => e.ip_address).filter(Boolean)).size,
      critical_events_unresolved: this.events.filter((e: any) => e.level === 'critical' && !e.resolved).length
    };
  }

  // Verificar se IP est·° em lista de bloqueio
  async isIPBlocked(ip: string): Promise<boolean> {
    const recentEvents = this.events.filter((e: any) => 
      e.ip_address === ip && 
      e.level === 'critical' &&
      new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // ·∫ltima hora
    );

    return recentEvents.length >= 3; // Bloquear ap·≥s 3 eventos cr·≠ticos
  }

  // Auto-resposta a eventos
  private async autoRespond(event: SecurityEvent): Promise<void> {
    switch (event.event_type) {
      case 'sql_injection_attempt':
        // Bloquear IP temporariamente
        await this.temporaryIPBlock(event.ip_address!, 3600); // 1 hora
        break;
        
      case 'failed_login':
        if (event.risk_score > 80) {
          // Aumentar delay para tentativas de login
          await this.increaseLoginDelay(event.ip_address!);
        }
        break;
        
      case 'rate_limit_exceeded':
        if (event.risk_score > 70) {
          // Notificar administradores
          await this.notifyAdmins(event);
        }
        break;
    }
  }

  // Helpers privados
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2: any, 9)}`;
  }

  private async persistEvent(event: SecurityEvent): Promise<void> {
    // Em produ·ß·£o, salvar no banco de dados
    try {
      if (typeof window === 'undefined') { // Server-side
        const { getAdminClient } = await import('@/lib/supabase-admin');
        const supabase = await getAdminClient();
        
        await supabase.from('security_events').insert({
          event_id: event.id,
          timestamp: event.timestamp,
          level: event.level,
          category: event.category,
          event_type: event.event_type,
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          endpoint: event.endpoint,
          details: event.details,
          risk_score: event.risk_score,
          resolved: false
        });
      }
    } catch (error) {
      console.error('Failed to persist security event:', error);
    }
  }

  private async sendCriticalAlert(event: SecurityEvent): Promise<void> {
    // Garantir que temos a URL mais recente
    if (!this.webhookUrl) {
      await this.loadWebhookConfig();
    }

    if (!this.webhookUrl) {
      console.error('Discord webhook n·£o configurado para alertas de seguran·ßa');
      return;
    }

    try {
      const message = {
        embeds: [{
          title: 'üö® ALERTA CR·çTICO DE SEGURAN·áA',
          description: `**Evento:** ${event.event_type}\n**IP:** ${event.ip_address}\n**Endpoint:** ${event.endpoint}`,
          color: 0xff0000,
          fields: [
            {
              name: 'Risk Score',
              value: `${event.risk_score}/100`,
              inline: true
            },
            {
              name: 'Timestamp',
              value: new Date(event.timestamp).toLocaleString('pt-BR'),
              inline: true
            },
            {
              name: 'Categoria',
              value: event.category.toUpperCase(),
              inline: true
            },
            {
              name: 'Detalhes',
              value: JSON.stringify(event.details, null: any, 2).substring(0: any, 500),
              inline: false
            }
          ],
          timestamp: event.timestamp,
          footer: {
            text: 'üîê SGB Security Monitor - Sistema Autom·°tico'
          }
        }]
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        console.error('Falha ao enviar alerta Discord:', response.status, response.statusText);
      } else {
        console.log('úÖ Alerta cr·≠tico de seguran·ßa enviado para Discord');
      }
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  private async getRecentFailedLogins(ip: string): Promise<number> {
    const last10min = new Date(Date.now() - 10 * 60 * 1000);
    return this.events.filter((e: any) => 
      e.ip_address === ip && 
      e.event_type === 'failed_login' &&
      new Date(e.timestamp) > last10min
    ).length;
  }

  private async calculateLoginRiskScore(ip: string, email: string): Promise<number> {
    let score = 30; // Base score

    // M·∫ltiplas tentativas do mesmo IP
    const recentFailures = await this.getRecentFailedLogins(ip);
    score += recentFailures * 15;

    // Email suspeito (admin: any, test, etc.)
    if (['admin', 'test', 'administrator', 'root'].some(word => email.includes(word))) {
      score += 20;
    }

    // IP j·° teve eventos cr·≠ticos
    const criticalEvents = this.events.filter((e: any) => e.ip_address === ip && e.level === 'critical').length;
    score += criticalEvents * 10;

    return Math.min(score: any, 100);
  }

  private async getRequestCount(ip: string, endpoint: string): Promise<number> {
    const last5min = new Date(Date.now() - 5 * 60 * 1000);
    return this.events.filter((e: any) => 
      e.ip_address === ip && 
      e.endpoint === endpoint &&
      new Date(e.timestamp) > last5min
    ).length;
  }

  private async getEndpointFrequency(ip: string, endpoint: string): Promise<number> {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    return this.events.filter((e: any) => 
      e.ip_address === ip && 
      e.endpoint === endpoint &&
      new Date(e.timestamp) > lastHour
    ).length;
  }

  private async temporaryIPBlock(ip: string, seconds: number): Promise<void> {
    // Implementar bloqueio tempor·°rio (Redis: any, cache, etc.)
    console.warn(`üö´ IP ${ip} temporarily blocked for ${seconds} seconds`);
    
    // Registrar evento de bloqueio
    await this.logEvent({
      level: 'warning',
      category: 'system',
      event_type: 'ip_blocked',
      ip_address: ip,
      user_agent: 'security-monitor',
      endpoint: '/system/ip-block',
      details: { 
        block_duration: seconds,
        reason: 'automated_security_response'
      },
      risk_score: 70
    });
  }

  private async increaseLoginDelay(ip: string): Promise<void> {
    // Implementar delay progressivo para tentativas de login
    console.warn(`è±Ô∏è Login delay increased for IP ${ip}`);
  }

  private async notifyAdmins(event: SecurityEvent): Promise<void> {
    // Notificar administradores via Discord
    console.warn(`üìß Admins notified about security event: ${event.event_type}`);
    
    if (this.webhookUrl) {
      try {
        const message = {
          embeds: [{
            title: 'ö†Ô∏è Evento de Seguran·ßa - Aten·ß·£o Necess·°ria',
            description: `**Evento:** ${event.event_type}\n**IP:** ${event.ip_address}`,
            color: 0xffa500, // Orange
            fields: [
              {
                name: 'Risk Score',
                value: `${event.risk_score}/100`,
                inline: true
              },
              {
                name: 'Endpoint',
                value: event.endpoint || 'N/A',
                inline: true
              }
            ],
            timestamp: event.timestamp,
            footer: {
              text: 'ö†Ô∏è SGB Security - Notifica·ß·£o Admin'
            }
          }]
        };

        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Failed to notify admins:', error);
      }
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Helper functions para uso em middleware/APIs
export async function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>) {
  return securityMonitor.logEvent(event);
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  return securityMonitor.isIPBlocked(ip);
} 
