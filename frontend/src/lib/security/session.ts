import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Tipos para session management
export interface SessionToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: number;
  sessionId: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
}

export interface SessionConfig {
  accessTokenTTL: number; // minutos
  refreshTokenTTL: number; // dias
  maxConcurrentSessions: number;
  requireMFAForAdmin: boolean;
  sessionTimeoutMinutes: number;
  jwtSecret: string;
  jwtRefreshSecret: string;
}

// Configuração padrão
const DEFAULT_CONFIG: SessionConfig = {
  accessTokenTTL: 15, // 15 minutos
  refreshTokenTTL: 7, // 7 dias
  maxConcurrentSessions: 3,
  requireMFAForAdmin: true,
  sessionTimeoutMinutes: 60, // 1 hora de inatividade
  jwtSecret: process.env.JWT_SECRET || 'zykor-jwt-secret-2024',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'zykor-refresh-secret-2024'
};

export class SessionManager {
  private config: SessionConfig;
  private activeSessions = new Map<string, SessionUser>();
  private refreshTokens = new Map<string, { userId: string; expiresAt: number; sessionId: string }>();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Criar nova sessão
  async createSession(
    userId: string, 
    email: string, 
    role: string, 
    permissions: string[] = [],
    mfaVerified = false
  ): Promise<SessionToken> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    // Verificar limite de sessões concorrentes
    await this.enforceConcurrentSessionLimit(userId);

    // Criar dados da sessão
    const sessionUser: SessionUser = {
      id: userId,
      email,
      role,
      permissions,
      lastActivity: now,
      sessionId,
      mfaEnabled: await this.checkMFAEnabled(userId),
      mfaVerified
    };

    // Verificar se MFA é obrigatório para admin
    if (this.config.requireMFAForAdmin && role === 'admin' && !mfaVerified) {
      throw new Error('MFA_REQUIRED_FOR_ADMIN');
    }

    // Gerar tokens
    const accessToken = this.generateAccessToken(sessionUser);
    const refreshToken = this.generateRefreshToken(userId, sessionId);
    
    const expiresAt = now + (this.config.accessTokenTTL * 60 * 1000);
    const refreshExpiresAt = now + (this.config.refreshTokenTTL * 24 * 60 * 60 * 1000);

    // Armazenar sessão
    this.activeSessions.set(sessionId, sessionUser);
    this.refreshTokens.set(refreshToken, {
      userId,
      expiresAt: refreshExpiresAt,
      sessionId
    });

    // Log de segurança
    console.log(`🔐 Nova sessão criada: ${email} (${role}) - Session: ${sessionId}`);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer'
    };
  }

  // Validar access token
  validateAccessToken(token: string): SessionUser | null {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;
      const sessionUser = this.activeSessions.get(decoded.sessionId);

      if (!sessionUser) {
        return null;
      }

      // Verificar timeout de inatividade
      const inactiveMinutes = (Date.now() - sessionUser.lastActivity) / (1000 * 60);
      if (inactiveMinutes > this.config.sessionTimeoutMinutes) {
        this.invalidateSession(decoded.sessionId);
        return null;
      }

      // Atualizar última atividade
      sessionUser.lastActivity = Date.now();
      this.activeSessions.set(decoded.sessionId, sessionUser);

      return sessionUser;
    } catch (error) {
      return null;
    }
  }

  // Refresh token
  async refreshAccessToken(refreshToken: string): Promise<SessionToken | null> {
    const refreshData = this.refreshTokens.get(refreshToken);
    
    if (!refreshData || Date.now() > refreshData.expiresAt) {
      // Token expirado ou inválido
      if (refreshData) {
        this.refreshTokens.delete(refreshToken);
        this.invalidateSession(refreshData.sessionId);
      }
      return null;
    }

    const sessionUser = this.activeSessions.get(refreshData.sessionId);
    if (!sessionUser) {
      this.refreshTokens.delete(refreshToken);
      return null;
    }

    // Verificar se MFA ainda é válido (se aplicável)
    if (this.config.requireMFAForAdmin && sessionUser.role === 'admin' && !sessionUser.mfaVerified) {
      throw new Error('MFA_VERIFICATION_EXPIRED');
    }

    // Gerar novo access token
    const newAccessToken = this.generateAccessToken(sessionUser);
    const expiresAt = Date.now() + (this.config.accessTokenTTL * 60 * 1000);

    // Log de refresh
    console.log(`🔄 Token refreshed: ${sessionUser.email} - Session: ${sessionUser.sessionId}`);

    return {
      accessToken: newAccessToken,
      refreshToken, // Manter o mesmo refresh token
      expiresAt,
      tokenType: 'Bearer'
    };
  }

  // Invalidar sessão específica
  invalidateSession(sessionId: string): void {
    const sessionUser = this.activeSessions.get(sessionId);
    
    if (sessionUser) {
      // Remover refresh tokens associados
      for (const [token, data] of this.refreshTokens.entries()) {
        if (data.sessionId === sessionId) {
          this.refreshTokens.delete(token);
        }
      }
      
      this.activeSessions.delete(sessionId);
      console.log(`🚪 Sessão invalidada: ${sessionUser.email} - Session: ${sessionId}`);
    }
  }

  // Invalidar todas as sessões de um usuário
  invalidateAllUserSessions(userId: string): void {
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.id === userId);

    userSessions.forEach(([sessionId, _]) => {
      this.invalidateSession(sessionId);
    });

    console.log(`🚪 Todas as sessões invalidadas para usuário: ${userId}`);
  }

  // Listar sessões ativas de um usuário
  getUserActiveSessions(userId: string): SessionUser[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.id === userId);
  }

  // Verificar se usuário tem MFA habilitado
  private async checkMFAEnabled(userId: string): Promise<boolean> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      const { data, error } = await supabase
        .from('usuarios_bar')
        .select('mfa_enabled')
        .eq('user_id', userId)
        .single();

      return data?.mfa_enabled || false;
    } catch (error) {
      console.error('Erro ao verificar MFA:', error);
      return false;
    }
  }

  // Limitar sessões concorrentes
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const userSessions = this.getUserActiveSessions(userId);
    
    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Remover as sessões mais antigas
      const sortedSessions = userSessions
        .sort((a, b) => a.lastActivity - b.lastActivity);
      
      const sessionsToRemove = sortedSessions.slice(0, 
        sortedSessions.length - this.config.maxConcurrentSessions + 1
      );

      sessionsToRemove.forEach(session => {
        this.invalidateSession(session.sessionId);
      });
    }
  }

  // Gerar ID de sessão único
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  // Gerar access token JWT
  private generateAccessToken(sessionUser: SessionUser): string {
    const payload = {
      userId: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
      permissions: sessionUser.permissions,
      sessionId: sessionUser.sessionId,
      mfaVerified: sessionUser.mfaVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.config.accessTokenTTL * 60)
    };

    return jwt.sign(payload, this.config.jwtSecret, { algorithm: 'HS256' });
  }

  // Gerar refresh token JWT
  private generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      userId,
      sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.config.refreshTokenTTL * 24 * 60 * 60)
    };

    return jwt.sign(payload, this.config.jwtRefreshSecret, { algorithm: 'HS256' });
  }

  // Limpar sessões expiradas (cleanup job)
  cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedSessions = 0;
    let cleanedTokens = 0;

    // Limpar refresh tokens expirados
    for (const [token, data] of this.refreshTokens.entries()) {
      if (now > data.expiresAt) {
        this.refreshTokens.delete(token);
        cleanedTokens++;
      }
    }

    // Limpar sessões inativas
    for (const [sessionId, session] of this.activeSessions.entries()) {
      const inactiveMinutes = (now - session.lastActivity) / (1000 * 60);
      if (inactiveMinutes > this.config.sessionTimeoutMinutes) {
        this.invalidateSession(sessionId);
        cleanedSessions++;
      }
    }

    if (cleanedSessions > 0 || cleanedTokens > 0) {
      console.log(`🧹 Cleanup: ${cleanedSessions} sessões e ${cleanedTokens} tokens removidos`);
    }
  }

  // Estatísticas de sessão
  getSessionStats(): {
    activeSessions: number;
    activeRefreshTokens: number;
    usersSessions: Record<string, number>;
    oldestSession: number;
  } {
    const usersSessions: Record<string, number> = {};
    let oldestActivity = Date.now();

    for (const session of this.activeSessions.values()) {
      usersSessions[session.id] = (usersSessions[session.id] || 0) + 1;
      oldestActivity = Math.min(oldestActivity, session.lastActivity);
    }

    return {
      activeSessions: this.activeSessions.size,
      activeRefreshTokens: this.refreshTokens.size,
      usersSessions,
      oldestSession: oldestActivity
    };
  }

  // Atualizar permissões de usuário em todas as sessões
  updateUserPermissions(userId: string, newPermissions: string[]): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.id === userId) {
        session.permissions = newPermissions;
        this.activeSessions.set(sessionId, session);
      }
    }
  }

  // Marcar MFA como verificado
  setMFAVerified(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.mfaVerified = true;
      this.activeSessions.set(sessionId, session);
    }
  }
}

// Instância global
export const sessionManager = new SessionManager();

// Iniciar cleanup automático
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sessionManager.cleanupExpiredSessions();
  }, 5 * 60 * 1000); // A cada 5 minutos
}

// Hooks para React
export const useSession = () => {
  return {
    createSession: sessionManager.createSession.bind(sessionManager),
    validateAccessToken: sessionManager.validateAccessToken.bind(sessionManager),
    refreshAccessToken: sessionManager.refreshAccessToken.bind(sessionManager),
    invalidateSession: sessionManager.invalidateSession.bind(sessionManager),
    invalidateAllUserSessions: sessionManager.invalidateAllUserSessions.bind(sessionManager),
    getUserActiveSessions: sessionManager.getUserActiveSessions.bind(sessionManager),
    getSessionStats: sessionManager.getSessionStats.bind(sessionManager),
    updateUserPermissions: sessionManager.updateUserPermissions.bind(sessionManager),
    setMFAVerified: sessionManager.setMFAVerified.bind(sessionManager)
  };
};
