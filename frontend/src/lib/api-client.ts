/**
 * Cliente API que adiciona automaticamente headers de autenticação
 */

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Fazer chamada API autenticada
 */
export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  try {
    // Headers padrão
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Pegar apenas dados essenciais do usuário
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('sgb_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // Enviar apenas ID e email (dados pequenos)
          if (user.id) headers['x-user-id'] = user.id;
          if (user.email) headers['x-user-email'] = user.email;
        } catch (e) {
          console.warn('Erro ao parsear dados do usuário:', e);
        }
      }
    }

    // Configuração da requisição
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    // Adicionar body se necessário
    if (options.body && options.method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    // Fazer a requisição
    const response = await fetch(endpoint, fetchOptions);

    // Verificar se a resposta é OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error ${response.status}:`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Retornar dados JSON
    const data = await response.json();
    console.log(`✅ API Response from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Erro na API ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Funções de conveniência para cada método HTTP
 */
export const api = {
  get: (endpoint: string, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'GET', headers }),

  post: (endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'POST', body, headers }),

  put: (endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'PUT', body, headers }),

  delete: (endpoint: string, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'DELETE', headers }),
};

/**
 * Cliente específico para checklists
 */
export const checklistsApi = {
  // Listar checklists
  list: (params?: {
    setor?: string;
    tipo?: string;
    status?: string;
    busca?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }

    const endpoint = `/api/checklists${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  // Criar checklist
  create: (checklist: unknown) => api.post('/api/checklists', checklist),

  // Atualizar checklist
  update: (id: string, checklist: unknown) =>
    api.put(`/api/checklists?id=${id}`, checklist),

  // Deletar checklist
  delete: (id: string) => api.delete(`/api/checklists?id=${id}`),
};

/**
 * Cliente específico para uploads
 */
export const uploadsApi = {
  // Fazer upload de arquivo (com FormData)
  upload: async (formData: FormData) => {
    try {
      const userData = localStorage.getItem('sgb_user');
      const headers: Record<string, string> = {};

      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData);
      }

      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  },

  // Listar uploads
  list: (params?: { folder?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }

    const endpoint = `/api/uploads${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  // Deletar arquivo
  delete: (fileId: string) => api.delete(`/api/uploads?id=${fileId}`),
};
