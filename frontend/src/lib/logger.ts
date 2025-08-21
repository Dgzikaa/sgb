const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// ✅ Sistema de logs profissional para produção
export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // ✅ Erros sempre logados, mesmo em produção (para Sentry)
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
    } else if (isProduction) {
      // ✅ Warnings críticos em produção
      console.warn(`[PROD-WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    // ✅ Debug apenas em desenvolvimento
    if (isDevelopment) {
      console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
    }
  },
  performance: (label: string, startTime: number) => {
    const duration = Date.now() - startTime;
    if (isDevelopment || duration > 1000) { // Log performance issues em prod
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  }
};

// ✅ Substituições seguras para produção
export const devLog = isDevelopment ? console.log : () => {};
export const devError = isDevelopment ? console.error : logger.error;
export const devWarn = isDevelopment ? console.warn : () => {};
export const devInfo = isDevelopment ? console.info : () => {};
export const devDebug = isDevelopment ? console.debug : () => {};

// ✅ Logger para APIs (sempre ativo para auditoria)
export const apiLogger = {
  request: (method: string, url: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`[API-REQ] ${method} ${url}`, data);
    }
  },
  response: (method: string, url: string, status: number, duration: number) => {
    const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
    if (isDevelopment || status >= 400) {
      console.log(`[API-RES] ${level} ${method} ${url} - ${status} (${duration}ms)`);
    }
  },
  error: (method: string, url: string, error: unknown) => {
    console.error(`[API-ERR] ${method} ${url}`, error);
  }
};
