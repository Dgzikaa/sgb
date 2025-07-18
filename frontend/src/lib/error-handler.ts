// Sistema centralizado de tratamento de erros

import { ERROR_MESSAGES } from '@/utils/constants';

// Tipos de erro
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Interface para erros da aplicação
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  userFriendly?: boolean;
}

// Classe para erros customizados
export class CustomError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly userFriendly: boolean;

  constructor(
    type: ErrorType,
    message: string,
    code?: string,
    details?: unknown,
    userFriendly = true,
  ) {
    super(message);
    this.name = 'CustomError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.userFriendly = userFriendly;
  }
}

// Função para criar erros padronizados
export const createError = (
  type: ErrorType,
  message?: string,
  code?: string,
  details?: unknown,
): AppError => {
  const defaultMessages = {
    [ErrorType.NETWORK]: ERROR_MESSAGES.NETWORK,
    [ErrorType.VALIDATION]: ERROR_MESSAGES.VALIDATION,
    [ErrorType.AUTHENTICATION]: 'Sessão expirada. Faça login novamente.',
    [ErrorType.AUTHORIZATION]: ERROR_MESSAGES.UNAUTHORIZED,
    [ErrorType.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
    [ErrorType.SERVER]: ERROR_MESSAGES.SERVER,
    [ErrorType.UNKNOWN]: ERROR_MESSAGES.GENERIC,
  };

  return {
    type,
    message: message || defaultMessages[type],
    code,
    details,
    timestamp: new Date().toISOString(),
    userFriendly: true,
  };
};

// Função para tratar erros de API
export const handleApiError = (error: unknown): AppError => {
  // Se já é um AppError, retorna
  if (error && typeof error === 'object' && 'type' in error) {
    return error as AppError;
  }

  // Se é um CustomError, converte
  if (error instanceof CustomError) {
    return {
      type: error.type,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      userFriendly: error.userFriendly,
    };
  }

  // Se é um erro de fetch/network
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createError(ErrorType.NETWORK);
  }

  // Se é um erro de resposta HTTP
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    
    switch (status) {
      case 400:
        return createError(ErrorType.VALIDATION, 'Dados inválidos enviados');
      case 401:
        return createError(ErrorType.AUTHENTICATION);
      case 403:
        return createError(ErrorType.AUTHORIZATION);
      case 404:
        return createError(ErrorType.NOT_FOUND);
      case 500:
        return createError(ErrorType.SERVER);
      default:
        return createError(ErrorType.UNKNOWN);
    }
  }

  // Se é uma string, trata como mensagem de erro
  if (typeof error === 'string') {
    return createError(ErrorType.UNKNOWN, error);
  }

  // Se é um objeto com mensagem
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;
    return createError(ErrorType.UNKNOWN, message);
  }

  // Erro desconhecido
  return createError(ErrorType.UNKNOWN);
};

// Função para log de erros
export const logError = (error: AppError, context?: string): void => {
  const logData = {
    ...error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };

  // Em desenvolvimento, mostra no console
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', logData);
  }

  // Em produção, envia para serviço de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // Aqui você pode integrar com Sentry, LogRocket, etc.
    console.error('Production Error:', logData);
  }
};

// Função para validar se um erro é recuperável
export const isRecoverableError = (error: AppError): boolean => {
  const nonRecoverableTypes = [
    ErrorType.AUTHENTICATION,
    ErrorType.AUTHORIZATION,
    ErrorType.NETWORK,
  ];
  
  return !nonRecoverableTypes.includes(error.type);
};

// Hook para tratamento de erros em componentes
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string): AppError => {
    const appError = handleApiError(error);
    logError(appError, context);
    return appError;
  };

  const handleAsyncError = async <T>(
    promise: Promise<T>,
    context?: string,
  ): Promise<{ data: T | null; error: AppError | null }> => {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      const appError = handleError(error, context);
      return { data: null, error: appError };
    }
  };

  return {
    handleError,
    handleAsyncError,
  };
};

// Função para retry automático
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Espera antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

// Função para debounce de erros
export const createErrorDebouncer = (delay = 5000) => {
  const errorCache = new Map<string, number>();

  return (error: AppError): boolean => {
    const key = `${error.type}-${error.message}`;
    const now = Date.now();
    const lastOccurrence = errorCache.get(key);

    if (lastOccurrence && now - lastOccurrence < delay) {
      return false; // Erro ignorado (muito recente)
    }

    errorCache.set(key, now);
    return true; // Erro deve ser processado
  };
}; 