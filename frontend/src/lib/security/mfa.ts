// import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configurações MFA
export interface MFAConfig {
  issuer: string;
  service: string;
  algorithm: string;
  digits: number;
  period: number;
}

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface MFAVerification {
  isValid: boolean;
  usedBackupCode?: string;
  remainingAttempts?: number;
}

// Configuração padrão
const DEFAULT_CONFIG: MFAConfig = {
  issuer: 'Zykor',
  service: 'Zykor - Gestão de Bares',
  algorithm: 'sha1',
  digits: 6,
  period: 30
};

export class MFAManager {
  private config: MFAConfig;

  constructor(config: Partial<MFAConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Configurar otplib
    authenticator.options = {
      algorithm: this.config.algorithm as any,
      digits: this.config.digits,
      period: this.config.period,
      window: 2 // Permite códigos de até 1 minuto antes/depois
    };
  }

  // Gerar configuração MFA para um usuário
  async generateMFASetup(userId: string, userEmail: string): Promise<MFASetup> {
    // Gerar secret único
    const secret = authenticator.generateSecret();
    
    // Criar URI para TOTP
    const otpAuthUrl = authenticator.keyuri(
      userEmail,
      this.config.service,
      secret
    );

    // Gerar QR Code
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    // Gerar códigos de backup
    const backupCodes = this.generateBackupCodes();

    // Formato manual para entrada (mais fácil de digitar)
    const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

    return {
      secret,
      qrCodeUrl,
      backupCodes,
      manualEntryKey
    };
  }

  // Verificar código TOTP
  verifyTOTPCode(token: string, secret: string): boolean {
    try {
      return authenticator.verify({
        token: token.replace(/\s/g, ''), // Remove espaços
        secret
      });
    } catch (error) {
      console.error('Erro ao verificar TOTP:', error);
      return false;
    }
  }

  // Verificar código de backup
  verifyBackupCode(
    inputCode: string, 
    storedBackupCodes: string[]
  ): MFAVerification {
    const cleanInput = inputCode.replace(/\s/g, '').toLowerCase();
    
    // Procurar código nos backups disponíveis
    const codeIndex = storedBackupCodes.findIndex(
      code => code.toLowerCase() === cleanInput
    );

    if (codeIndex === -1) {
      return { isValid: false };
    }

    // Código encontrado e válido
    const usedCode = storedBackupCodes[codeIndex];
    
    return {
      isValid: true,
      usedBackupCode: usedCode,
      remainingAttempts: storedBackupCodes.length - 1
    };
  }

  // Verificar qualquer tipo de código MFA
  async verifyMFACode(
    inputCode: string,
    secret: string,
    backupCodes: string[] = []
  ): Promise<MFAVerification> {
    const cleanInput = inputCode.replace(/\s/g, '');

    // Tentar primeiro como TOTP (6 dígitos numéricos)
    if (/^\d{6}$/.test(cleanInput)) {
      const isValidTOTP = this.verifyTOTPCode(cleanInput, secret);
      if (isValidTOTP) {
        return { isValid: true };
      }
    }

    // Se TOTP falhou, tentar como código de backup
    if (backupCodes.length > 0) {
      return this.verifyBackupCode(inputCode, backupCodes);
    }

    return { isValid: false };
  }

  // Gerar novos códigos de backup
  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 caracteres alfanuméricos
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  // Validar secret MFA
  isValidSecret(secret: string): boolean {
    try {
      // Tentar gerar um token com o secret
      authenticator.generate(secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Gerar código TOTP atual (para testes)
  generateCurrentTOTP(secret: string): string {
    return authenticator.generate(secret);
  }

  // Obter tempo restante do código atual
  getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    const period = this.config.period;
    return period - (now % period);
  }

  // Validar formato de entrada
  validateInputFormat(input: string): {
    isValid: boolean;
    type: 'totp' | 'backup' | 'invalid';
    formatted: string;
  } {
    const clean = input.replace(/\s/g, '');

    // TOTP: 6 dígitos
    if (/^\d{6}$/.test(clean)) {
      return {
        isValid: true,
        type: 'totp',
        formatted: clean
      };
    }

    // Backup code: 8 caracteres alfanuméricos
    if (/^[A-Za-z0-9]{8}$/.test(clean)) {
      return {
        isValid: true,
        type: 'backup',
        formatted: clean.toUpperCase()
      };
    }

    return {
      isValid: false,
      type: 'invalid',
      formatted: clean
    };
  }
}

// Instância global
export const mfaManager = new MFAManager();

// Hooks para React
export const useMFA = () => {
  return {
    generateMFASetup: mfaManager.generateMFASetup.bind(mfaManager),
    verifyMFACode: mfaManager.verifyMFACode.bind(mfaManager),
    verifyTOTPCode: mfaManager.verifyTOTPCode.bind(mfaManager),
    verifyBackupCode: mfaManager.verifyBackupCode.bind(mfaManager),
    generateBackupCodes: mfaManager.generateBackupCodes.bind(mfaManager),
    validateInputFormat: mfaManager.validateInputFormat.bind(mfaManager),
    getTimeRemaining: mfaManager.getTimeRemaining.bind(mfaManager),
    isValidSecret: mfaManager.isValidSecret.bind(mfaManager)
  };
};

// Rate limiting para tentativas MFA
export class MFARateLimit {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  private maxAttempts = 5;
  private windowMinutes = 15;

  // Verificar se usuário pode tentar MFA
  canAttempt(userId: string): boolean {
    const userAttempts = this.attempts.get(userId);
    
    if (!userAttempts) {
      return true;
    }

    // Se o tempo de reset passou, limpar tentativas
    if (Date.now() > userAttempts.resetTime) {
      this.attempts.delete(userId);
      return true;
    }

    return userAttempts.count < this.maxAttempts;
  }

  // Registrar tentativa
  recordAttempt(userId: string, success: boolean) {
    if (success) {
      // Sucesso limpa as tentativas
      this.attempts.delete(userId);
      return;
    }

    const now = Date.now();
    const resetTime = now + (this.windowMinutes * 60 * 1000);
    
    const current = this.attempts.get(userId);
    
    if (current && now < current.resetTime) {
      // Incrementar tentativas existentes
      current.count += 1;
    } else {
      // Nova janela de tentativas
      this.attempts.set(userId, {
        count: 1,
        resetTime
      });
    }
  }

  // Obter tentativas restantes
  getRemainingAttempts(userId: string): number {
    const userAttempts = this.attempts.get(userId);
    
    if (!userAttempts || Date.now() > userAttempts.resetTime) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - userAttempts.count);
  }

  // Obter tempo até reset
  getTimeUntilReset(userId: string): number {
    const userAttempts = this.attempts.get(userId);
    
    if (!userAttempts) {
      return 0;
    }

    return Math.max(0, userAttempts.resetTime - Date.now());
  }
}

// Instância global de rate limiting
export const mfaRateLimit = new MFARateLimit();
