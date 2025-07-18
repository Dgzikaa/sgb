// Utilitários para APIs

import { API_ENDPOINTS, ERROR_MESSAGES } from './constants';
import { handleApiError, createError, ErrorType } from '@/lib/error-handler';

// Tipos
export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// Função base para requisições
export async function apiRequest<T>(
  url: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
    retries = 3,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw createError(
        response.status === 401 ? ErrorType.AUTHENTICATION :
        response.status === 403 ? ErrorType.AUTHORIZATION :
        response.status === 404 ? ErrorType.NOT_FOUND :
        response.status >= 500 ? ErrorType.SERVER :
        ErrorType.VALIDATION,
        `HTTP ${response.status}: ${response.statusText}`,
        response.status.toString(),
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const appError = handleApiError(error);
    
    return {
      success: false,
      error: appError.message,
      status: appError.code ? parseInt(appError.code) : 500,
    };
  }
}

// Funções específicas para cada endpoint
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: credentials,
      }),

    logout: () =>
      apiRequest(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' }),

    forgotPassword: (email: string) =>
      apiRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: { email },
      }),

    resetPassword: (token: string, password: string) =>
      apiRequest(API_ENDPOINTS.AUTH.REDEFINIR_SENHA, {
        method: 'POST',
        body: { token, password },
      }),
  },

  // Usuários
  usuarios: {
    getAll: (params?: Record<string, unknown>) =>
      apiRequest(`${API_ENDPOINTS.USUARIOS.BASE}?${new URLSearchParams(params as Record<string, string>)}`),

    getById: (id: string) =>
      apiRequest(`${API_ENDPOINTS.USUARIOS.BASE}/${id}`),

    create: (data: unknown) =>
      apiRequest(API_ENDPOINTS.USUARIOS.BASE, {
        method: 'POST',
        body: data,
      }),

    update: (id: string, data: unknown) =>
      apiRequest(`${API_ENDPOINTS.USUARIOS.BASE}/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: string) =>
      apiRequest(`${API_ENDPOINTS.USUARIOS.BASE}/${id}`, {
        method: 'DELETE',
      }),

    bulk: (data: unknown) =>
      apiRequest(API_ENDPOINTS.USUARIOS.BULK, {
        method: 'POST',
        body: data,
      }),
  },

  // Checklists
  checklists: {
    getAll: (params?: Record<string, unknown>) =>
      apiRequest(`${API_ENDPOINTS.CHECKLISTS.BASE}?${new URLSearchParams(params as Record<string, string>)}`),

    getById: (id: string) =>
      apiRequest(`${API_ENDPOINTS.CHECKLISTS.BASE}/${id}`),

    create: (data: unknown) =>
      apiRequest(API_ENDPOINTS.CHECKLISTS.BASE, {
        method: 'POST',
        body: data,
      }),

    update: (id: string, data: unknown) =>
      apiRequest(`${API_ENDPOINTS.CHECKLISTS.BASE}/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: string) =>
      apiRequest(`${API_ENDPOINTS.CHECKLISTS.BASE}/${id}`, {
        method: 'DELETE',
      }),

    getBadgeData: () =>
      apiRequest(API_ENDPOINTS.CHECKLISTS.BADGE_DATA),

    getNotifications: () =>
      apiRequest(API_ENDPOINTS.CHECKLISTS.NOTIFICATIONS),
  },

  // Eventos
  eventos: {
    getAll: (params?: Record<string, unknown>) =>
      apiRequest(`${API_ENDPOINTS.EVENTOS.BASE}?${new URLSearchParams(params as Record<string, string>)}`),

    getById: (id: string) =>
      apiRequest(`${API_ENDPOINTS.EVENTOS.BASE}/${id}`),

    create: (data: unknown) =>
      apiRequest(API_ENDPOINTS.EVENTOS.BASE, {
        method: 'POST',
        body: data,
      }),

    update: (id: string, data: unknown) =>
      apiRequest(`${API_ENDPOINTS.EVENTOS.BASE}/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: string) =>
      apiRequest(`${API_ENDPOINTS.EVENTOS.BASE}/${id}`, {
        method: 'DELETE',
      }),

    getAnalytics: () =>
      apiRequest(API_ENDPOINTS.EVENTOS.ANALYTICS),
  },

  // Dashboard
  dashboard: {
    getResumo: () =>
      apiRequest(API_ENDPOINTS.DASHBOARD.RESUMO),

    getStats: () =>
      apiRequest(API_ENDPOINTS.DASHBOARD.STATS),

    getProdutividade: () =>
      apiRequest(API_ENDPOINTS.DASHBOARD.PRODUTIVIDADE),
  },
};

// Hook para usar APIs
export const useApi = () => {
  const request = async <T>(
    url: string,
    options?: ApiOptions,
  ): Promise<ApiResponse<T>> => {
    return apiRequest<T>(url, options);
  };

  return {
    request,
    auth: api.auth,
    usuarios: api.usuarios,
    checklists: api.checklists,
    eventos: api.eventos,
    dashboard: api.dashboard,
  };
};