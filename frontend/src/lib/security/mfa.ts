// MFA disabled for frontend build - otplib not available
// Original file moved to mfa.server.ts for server-side use

import QRCode from 'qrcode';

// Configurações MFA
export interface MFAConfig {
  issuer: string;
  accountName: string;
  secretLength?: number;
  algorithm?: 'sha1' | 'sha256' | 'sha512';
  digits?: number;
  period?: number;
  encoding?: 'ascii' | 'hex' | 'base32' | 'base64';
  window?: number;
  step?: number;
}

// Default configurations
const DEFAULT_CONFIG: Partial<MFAConfig> = {
  secretLength: 20,
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  encoding: 'base32'
};

export class MFAService {
  private config: MFAConfig;

  constructor(config: MFAConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Gera um novo secret para MFA
   */
  generateSecret(): string {
    console.warn('MFA disabled for frontend - generateSecret not available');
    return 'MFA_DISABLED_FRONTEND';
  }

  /**
   * Cria QR Code para configuração
   */
  async generateQRCode(secret: string): Promise<string> {
    try {
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(this.config.accountName)}?secret=${secret}&issuer=${encodeURIComponent(this.config.issuer)}`;
      return await QRCode.toDataURL(otpAuthUrl);
    } catch (error) {
      throw new Error(`Erro ao gerar QR Code: ${error}`);
    }
  }

  /**
   * Verifica um token TOTP
   */
  verifyToken(token: string, secret: string): boolean {
    console.warn('MFA disabled for frontend - token verification not available');
    return false;
  }

  /**
   * Gera um token TOTP para o momento atual
   */
  generateToken(secret: string): string {
    console.warn('MFA disabled for frontend - token generation not available');
    return '000000';
  }
}

// Instância global
let mfaService: MFAService | null = null;

/**
 * Inicializa o serviço MFA
 */
export function initializeMFA(config: MFAConfig): MFAService {
  mfaService = new MFAService(config);
  return mfaService;
}

/**
 * Obtém a instância do serviço MFA
 */
export function getMFAService(): MFAService | null {
  return mfaService;
}

/**
 * Utilitários de validação
 */
export const MFAUtils = {
  /**
   * Valida formato do token
   */
  isValidTokenFormat(token: string): boolean {
    return /^\d{6}$/.test(token);
  },

  /**
   * Valida formato do secret
   */
  isValidSecret(secret: string): boolean {
    return secret.length >= 16 && /^[A-Z2-7]+$/.test(secret);
  },

  /**
   * Gera backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
};

export default MFAService;