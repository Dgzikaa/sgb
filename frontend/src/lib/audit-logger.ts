// Sistema centralizado de logging para audit trail e eventos de segurança
import { getAdminClient } from '@/lib/supabase-admin';

export interface AuditLogParams {
  // Obrigatórios
  operation: string;
  description: string;
  
  // Contexto do usuário
  barId?: number;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  
  // Informações da requisição
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  
  // Dados da operação
  tableName?: string;
  recordId?: string;
  oldValues?: Record<string, (unknown)>;
  newValues?: Record<string, (unknown)>;
  
  // Classificação
  severity?: 'info' | 'warning' | 'critical';
  category?: 'auth' | 'data' | 'admin' | 'financial' | 'security' | 'system' | 'backup';
  
  // Contexto adicional
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, (unknown)>;
}

export interface SecurityEventParams {
  // Obrigatórios
  level: 'info' | 'warning' | 'critical';
  category: 'auth' | 'access' | 'data' | 'injection' | 'rate_limit' | 'api_abuse' | 'backup' | 'system';
  eventType: string;
  
  // Contexto
  barId?: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  
  // Detalhes
  details: Record<string, (unknown)>;
  riskScore?: number;
}

class AuditLogger {
  private static instance: AuditLogger;
  private discordWebhook = 'https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y';

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Logging de audit trail
  async logAuditEvent(params: AuditLogParams): Promise<void> {
    try {
      const supabase = await getAdminClient();
      
      const auditData = {
        bar_id: params.barId || null,
        operation: params.operation,
        table_name: params.tableName || null,
        record_id: params.recordId || null,
        user_id: params.userId || null,
        user_email: params.userEmail || null,
        user_role: params.userRole || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        description: params.description,
        old_values: params.oldValues || null,
        new_values: params.newValues || null,
        changes: this.calculateChanges(params.oldValues, params.newValues),
        session_id: params.sessionId || null,
        request_id: params.requestId || null,
        endpoint: params.endpoint || null,
        method: params.method || null,
        severity: params.severity || 'info',
        category: params.category || 'data',
        metadata: params.metadata || {}
      };

      const { error } = await supabase.from('audit_trail').insert(auditData);
      
      if (error) {
        console.error('❌ Erro ao salvar audit log:', error);
      }
      
      // Notificar Discord para eventos críticos
      if (params.severity === 'critical') {
        await this.notifyDiscordAudit(auditData);
      }
    } catch (error) {
      console.error('❌ Erro no audit logger:', error);
    }
  }

  // Logging de eventos de segurança
  async logSecurityEvent(params: SecurityEventParams): Promise<void> {
    try {
      const supabase = await getAdminClient();
      
      const eventData = {
        event_id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bar_id: params.barId || null,
        level: params.level,
        category: params.category,
        event_type: params.eventType,
        user_id: params.userId || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        endpoint: params.endpoint || null,
        details: params.details,
        risk_score: params.riskScore || 0,
        resolved: false
      };

      const { error } = await supabase.from('security_events').insert(eventData);
      
      if (error) {
        console.error('❌ Erro ao salvar security event:', error);
      }
      
      // Notificar Discord para eventos críticos
      if (params.level === 'critical') {
        await this.notifyDiscordSecurity(eventData);
      }
    } catch (error) {
      console.error('❌ Erro no security logger:', error);
    }
  }

  // Logs específicos para autenticação
  async logLoginSuccess(params: {
    userId: string;
    userEmail: string;
    userName: string;
    userRole: string;
    barId: number;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    // Log no audit trail
    await this.logAuditEvent({
      operation: 'LOGIN_SUCCESS',
      description: `Login bem-sucedido para ${params.userName}`,
      barId: params.barId,
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      endpoint: '/api/auth/login',
      method: 'POST',
      severity: 'info',
      category: 'auth',
      metadata: {
        login_type: 'password',
        timestamp: new Date().toISOString()
      }
    });

    // Log no security events
    await this.logSecurityEvent({
      level: 'info',
      category: 'auth',
      eventType: 'successful_login',
      barId: params.barId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      endpoint: '/api/auth/login',
      details: {
        user_email: params.userEmail,
        user_name: params.userName,
        user_role: params.userRole,
        login_method: 'password'
      },
      riskScore: 10 // Baixo risco para login normal
    });
  }

  async logLoginFailure(params: {
    email: string;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    // Log no audit trail
    await this.logAuditEvent({
      operation: 'LOGIN_FAILURE',
      description: `Tentativa de login falhou para ${params.email}: ${params.reason}`,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      endpoint: '/api/auth/login',
      method: 'POST',
      severity: 'warning',
      category: 'auth',
      metadata: {
        failure_reason: params.reason,
        timestamp: new Date().toISOString()
      }
    });

    // Log no security events
    await this.logSecurityEvent({
      level: 'warning',
      category: 'auth',
      eventType: 'failed_login',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      endpoint: '/api/auth/login',
      details: {
        email: params.email,
        failure_reason: params.reason,
        timestamp: new Date().toISOString()
      },
      riskScore: 40 // Risco médio para tentativas falhas
    });
  }

  async logLogout(params: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    barId?: number;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    await this.logAuditEvent({
      operation: 'LOGOUT',
      description: `Logout realizado${params.userName ? ` para ${params.userName}` : ''}`,
      barId: params.barId,
      userId: params.userId,
      userEmail: params.userEmail,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      endpoint: '/api/auth/logout',
      method: 'POST',
      severity: 'info',
      category: 'auth',
      metadata: {
        logout_timestamp: new Date().toISOString()
      }
    });
  }

  // Métodos auxiliares
  private calculateChanges(oldValues?: Record<string, (unknown)>, newValues?: Record<string, (unknown)>): Record<string, (unknown)> | null {
    if (!oldValues || !newValues) return null;
    
    const changes: Record<string, (unknown)> = {};
    
    for (const [key, newValue] of Object.entries(newValues)) {
      if (oldValues[key] !== newValue) {
        changes[key] = {
          old: oldValues[key],
          new: newValue
        };
      }
    }
    
    return Object.keys(changes).length > 0 ? changes : null;
  }

  private async notifyDiscordAudit(auditData: unknown): Promise<void> {
    try {
      const message = {
        embeds: [{
          title: '🔍 Critical Audit Event',
          description: auditData.description,
          color: 0xff9900,
          fields: [
            {
              name: 'User',
              value: auditData.user_email || 'System',
              inline: true
            },
            {
              name: 'Operation',
              value: auditData.operation,
              inline: true
            },
            {
              name: 'IP Address',
              value: auditData.ip_address || 'Unknown',
              inline: true
            },
            {
              name: 'Table',
              value: auditData.table_name || 'N/A',
              inline: true
            },
            {
              name: 'Record ID',
              value: auditData.record_id || 'N/A',
              inline: true
            },
            {
              name: 'Endpoint',
              value: auditData.endpoint || 'N/A',
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: '🏢 SGB - Audit System'
          }
        }]
      };

      await fetch(this.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('❌ Erro ao notificar Discord audit:', error);
    }
  }

  private async notifyDiscordSecurity(eventData: unknown): Promise<void> {
    try {
      const message = {
        embeds: [{
          title: '🚨 Critical Security Event',
          description: `${eventData.event_type} detected`,
          color: 0xff0000,
          fields: [
            {
              name: 'Event Type',
              value: eventData.event_type,
              inline: true
            },
            {
              name: 'Risk Score',
              value: `${eventData.risk_score}/100`,
              inline: true
            },
            {
              name: 'IP Address',
              value: eventData.ip_address || 'Unknown',
              inline: true
            },
            {
              name: 'Endpoint',
              value: eventData.endpoint || 'N/A',
              inline: true
            },
            {
              name: 'Details',
              value: JSON.stringify(eventData.details, null, 2).substring(0, 500),
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: '🏢 SGB - Security System'
          }
        }]
      };

      await fetch(this.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('❌ Erro ao notificar Discord security:', error);
    }
  }
}

// Export singleton
export const auditLogger = AuditLogger.getInstance();

// Helper functions
export async function logLoginSuccess(params: Parameters<typeof auditLogger.logLoginSuccess>[0]) {
  return auditLogger.logLoginSuccess(params);
}

export async function logLoginFailure(params: Parameters<typeof auditLogger.logLoginFailure>[0]) {
  return auditLogger.logLoginFailure(params);
}

export async function logLogout(params: Parameters<typeof auditLogger.logLogout>[0]) {
  return auditLogger.logLogout(params);
}

export async function logAuditEvent(params: AuditLogParams) {
  return auditLogger.logAuditEvent(params);
}

export async function logSecurityEvent(params: SecurityEventParams) {
  return auditLogger.logSecurityEvent(params);
} 
