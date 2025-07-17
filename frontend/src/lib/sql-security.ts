// Sistema avançado de validação SQL para prevenir injection attacks

export interface SQLValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedSQL?: string;
}

// Discord webhook para notificações de segurança
const SECURITY_DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y';

// Função para notificar Discord sobre tentativas de SQL injection
async function notifyDiscordSQLThreat(sql: string, errors: string[], clientInfo?: { ip?: string; userAgent?: string; endpoint?: string }) {
  try {
    const message = {
      embeds: [{
        title: '🚨 SQL INJECTION ATTEMPT DETECTED',
        description: `Tentativa de SQL injection bloqueada`,
        color: 0xff0000, // Vermelho para crítico
        fields: [
          {
            name: 'IP Address',
            value: clientInfo?.ip || 'Unknown',
            inline: true
          },
          {
            name: 'Endpoint',
            value: clientInfo?.endpoint || 'Unknown',
            inline: true
          },
          {
            name: 'Violations',
            value: errors.join('\n'),
            inline: false
          },
          {
            name: 'SQL Query (truncated)',
            value: '```sql\n' + sql.substring(0, 200) + (sql.length > 200 ? '...' : '') + '\n```',
            inline: false
          },
          {
            name: 'User Agent',
            value: clientInfo?.userAgent?.substring(0, 100) + (clientInfo?.userAgent && clientInfo.userAgent.length > 100 ? '...' : '') || 'Unknown',
            inline: false
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: '🏢 SGB - SQL Security System'
        }
      }]
    };

    await fetch(SECURITY_DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
  }
}

export interface SQLSecurityConfig {
  allowedTables: string[];
  allowedFunctions: string[];
  requireBarIdFilter: boolean;
  maxQueryLength: number;
  allowSubqueries: boolean;
}

// Configuração padrão de segurança
const DEFAULT_CONFIG: SQLSecurityConfig = {
  allowedTables: [
    'usuarios_bar', 'checklists', 'checklist_execucoes', 'bars', 
    'receitas', 'producoes', 'vendas', 'eventos', 'reservas',
    'api_credentials', 'meta_social_data', 'contaazul_dados',
    'whatsapp_configuracoes', 'notifications'
  ],
  allowedFunctions: [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DATE', 'EXTRACT', 
    'UPPER', 'LOWER', 'TRIM', 'COALESCE', 'CASE', 'CAST',
    'TO_CHAR', 'DATE_TRUNC', 'AGE', 'NOW', 'CURRENT_DATE'
  ],
  requireBarIdFilter: true,
  maxQueryLength: 5000,
  allowSubqueries: false
};

export class SQLSecurityValidator {
  private config: SQLSecurityConfig;

  constructor(config: Partial<SQLSecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  validate(sql: string, barId?: number, clientInfo?: { ip?: string; userAgent?: string; endpoint?: string }): SQLValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validações básicas
      if (!sql || sql.trim().length === 0) {
        errors.push('SQL query is empty');
        return { isValid: false, errors, warnings };
      }

      if (sql.length > this.config.maxQueryLength) {
        errors.push(`Query exceeds maximum length of ${this.config.maxQueryLength} characters`);
        return { isValid: false, errors, warnings };
      }

      const sqlLower = sql.toLowerCase().trim();

      // 2. Verificar se é apenas SELECT
      if (!sqlLower.startsWith('select')) {
        errors.push('Only SELECT statements are allowed');
        return { isValid: false, errors, warnings };
      }

      // 3. Comandos perigosos (lista expandida)
      const dangerousCommands = [
        'drop', 'delete', 'update', 'insert', 'create', 'alter', 
        'truncate', 'grant', 'revoke', 'exec', 'execute', 'xp_',
        'sp_', 'into outfile', 'load_file', 'dumpfile', 'benchmark',
        'pg_sleep', 'waitfor', 'dbms_pipe'
      ];

      for (const command of dangerousCommands) {
        if (sqlLower.includes(command)) {
          errors.push(`Dangerous command detected: ${command.toUpperCase()}`);
        }
      }

      // 4. Verificar filtro bar_id obrigatório
      if (this.config.requireBarIdFilter && barId) {
        if (!this.hasBarIdFilter(sql, barId)) {
          errors.push('Query must include bar_id filter for security (multi-tenant isolation)');
        }
      }

      // 5. Validar tabelas permitidas
      const usedTables = this.extractTables(sql);
      for (const table of usedTables) {
        if (!this.config.allowedTables.includes(table)) {
          errors.push(`Access to table '${table}' is not allowed`);
        }
      }

      // 6. Validar funções utilizadas
      const usedFunctions = this.extractFunctions(sql);
      for (const func of usedFunctions) {
        if (!this.config.allowedFunctions.includes(func.toUpperCase())) {
          warnings.push(`Function '${func}' may not be allowed`);
        }
      }

      // 7. Verificar subqueries se não permitidas
      if (!this.config.allowSubqueries && this.hasSubqueries(sql)) {
        errors.push('Subqueries are not allowed in this context');
      }

      // 8. Detectar patterns de SQL injection
      const injectionPatterns = [
        /(\bunion\s+select)/i,
        /(\bor\s+1\s*=\s*1)/i,
        /(\bor\s+'1'\s*=\s*'1')/i,
        /(\band\s+1\s*=\s*1)/i,
        /(\bor\s+true)/i,
        /(\bor\s+false)/i,
        /(--)/,
        /(\bxor\b)/i,
        /(\bhaving\s+1\s*=\s*1)/i
      ];

      for (const pattern of injectionPatterns) {
        if (pattern.test(sql)) {
          errors.push(`Suspicious SQL pattern detected: ${pattern.source}`);
        }
      }

      // 9. Verificar comentários suspeitos
      if (sql.includes('/*') || sql.includes('--')) {
        warnings.push('SQL comments detected - review for suspicious content');
      }

      // 10. Notificar Discord sobre tentativas críticas de SQL injection
      if (errors.length > 0) {
        const criticalErrors = errors.filter((error: any) => 
          error.includes('Dangerous command') || 
          error.includes('Suspicious SQL pattern') ||
          error.includes('injection')
        );
        
        if (criticalErrors.length > 0) {
          // Notificar Discord de forma assíncrona (não bloquear validação)
          notifyDiscordSQLThreat(sql, criticalErrors, clientInfo).catch(console.error);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedSQL: errors.length === 0 ? this.sanitizeSQL(sql) : undefined
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  private hasBarIdFilter(sql: string, barId: number): boolean {
    const barIdPatterns = [
      new RegExp(`bar_id\\s*=\\s*${barId}`, 'i'),
      new RegExp(`bar_id\\s*=\\s*\\$bar_id`, 'i'),
      new RegExp(`bar_id\\s*=\\s*\\?`, 'i')
    ];

    return barIdPatterns.some(pattern => pattern.test(sql));
  }

  private extractTables(sql: string): string[] {
    const tables: string[] = [];
    const sqlLower = sql.toLowerCase();
    
    // Pattern para FROM e JOIN
    const tablePatterns = [
      /from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /join\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];

    for (const pattern of tablePatterns) {
      let match;
      while ((match = pattern.exec(sqlLower)) !== null) {
        tables.push(match[1]);
      }
    }

    return [...new Set(tables)]; // Remove duplicatas
  }

  private extractFunctions(sql: string): string[] {
    const functions: string[] = [];
    const functionPattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    
    let match;
    while ((match = functionPattern.exec(sql)) !== null) {
      functions.push(match[1]);
    }

    return [...new Set(functions)];
  }

  private hasSubqueries(sql: string): boolean {
    const subqueryPattern = /\(\s*select\s+/i;
    return subqueryPattern.test(sql);
  }

  private sanitizeSQL(sql: string): string {
    // Remover comentários
    let sanitized = sql.replace(/--.*$/gm, '');
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Normalizar espaços
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }
}

// Helper function para usar em APIs
export function validateSQL(sql: string, config?: Partial<SQLSecurityConfig>, barId?: number, clientInfo?: { ip?: string; userAgent?: string; endpoint?: string }): SQLValidationResult {
  const validator = new SQLSecurityValidator(config);
  return validator.validate(sql, barId, clientInfo);
}

// Middleware para APIs que executam SQL dinâmico
export function requireSQLValidation(config?: Partial<SQLSecurityConfig>) {
  return (sql: string, barId?: number) => {
    const result = validateSQL(sql, config, barId);
    
    if (!result.isValid) {
      throw new Error(`SQL Security Violation: ${result.errors.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      console.warn('SQL Security Warnings:', result.warnings.join(', '));
    }

    return result.sanitizedSQL || sql;
  };
} 
