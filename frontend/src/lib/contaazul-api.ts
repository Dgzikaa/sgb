import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CONTAAZUL_API_BASE_URL = 'https://api.contaazul.com';

export interface ContaAzulApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface ContaAzulCredentials {
  access_token: string;
  expires_at: string | null;
  bar_id: number;
  sistema: string;
}

export class ContaAzulApi {
  private barId: number;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(barId: number) {
    this.barId = barId;
  }

  /**
   * Carrega as credenciais do banco de dados
   */
  private async loadCredentials(): Promise<ContaAzulCredentials> {
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', this.barId)
      .eq('sistema', 'contaazul')
      .single();

    if (error || !credentials) {
      throw new Error('Credenciais não encontradas para este bar');
    }

    const typedCredentials = credentials as ContaAzulCredentials;

    if (!typedCredentials.access_token) {
      throw new Error('Token de acesso não disponível. Autorize a integração primeiro.');
    }

    this.accessToken = typedCredentials.access_token;
    this.tokenExpiresAt = typedCredentials.expires_at ? new Date(typedCredentials.expires_at) : null;

    return typedCredentials;
  }

  /**
   * Verifica se o token precisa ser renovado
   */
  private needsTokenRefresh(): boolean {
    if (!this.tokenExpiresAt) return true;
    
    // Renovar se o token expira em menos de 5 minutos
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this.tokenExpiresAt <= fiveMinutesFromNow;
  }

  /**
   * Renova o token de acesso
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`/api/contaazul/auth?action=refresh&barId=${this.barId}`);
      const data = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao renovar token');
      }

      // Recarregar credenciais com o novo token
      await this.loadCredentials();
      
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  }

  /**
   * Prepara os headers para a requisição
   */
  private async prepareHeaders(): Promise<HeadersInit> {
    await this.loadCredentials();

    if (this.needsTokenRefresh()) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        throw new Error('Não foi possível renovar o token. Autorize a integração novamente.');
      }
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Faz uma requisição GET autenticada
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      const url = new URL(`${CONTAAZUL_API_BASE_URL}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      });
      const data = await response.json() as unknown;
      if (!response.ok) {
        const errorMsg = typeof data === 'object' && data !== null && 'message' in data ? String((data as Record<string, unknown>).message) : undefined;
        const errorField = typeof data === 'object' && data !== null && 'error' in data ? String((data as Record<string, unknown>).error) : undefined;
        return {
          success: false,
          error: errorMsg || errorField || 'Erro na requisição',
          status: response.status
        };
      }
      return {
        success: true,
        data: data as T,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Faz uma requisição POST autenticada
   */
  async post<T>(endpoint: string, body?: Record<string, unknown>): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      
      const response = await fetch(`${CONTAAZUL_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json() as unknown;
      if (!response.ok) {
        const errorMsg = (typeof data === 'object' && data !== null && 'message' in data) ? String((data as Record<string, unknown>).message) : undefined;
        const errorField = (typeof data === 'object' && data !== null && 'error' in data) ? String((data as Record<string, unknown>).error) : undefined;
        return {
          success: false,
          error: errorMsg || errorField || 'Erro na requisição',
          status: response.status
        };
      }
      return {
        success: true,
        data: data as T,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Faz uma requisição PUT autenticada
   */
  async put<T>(endpoint: string, body?: Record<string, unknown>): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      
      const response = await fetch(`${CONTAAZUL_API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json() as unknown;
      if (!response.ok) {
        const errorMsg = (typeof data === 'object' && data !== null && 'message' in data) ? String((data as Record<string, unknown>).message) : undefined;
        const errorField = (typeof data === 'object' && data !== null && 'error' in data) ? String((data as Record<string, unknown>).error) : undefined;
        return {
          success: false,
          error: errorMsg || errorField || 'Erro na requisição',
          status: response.status
        };
      }
      return {
        success: true,
        data: data as T,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Faz uma requisição DELETE autenticada
   */
  async delete<T>(endpoint: string): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      
      const response = await fetch(`${CONTAAZUL_API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json() as unknown;
      if (!response.ok) {
        const errorMsg = (typeof data === 'object' && data !== null && 'message' in data) ? String((data as Record<string, unknown>).message) : undefined;
        const errorField = (typeof data === 'object' && data !== null && 'error' in data) ? String((data as Record<string, unknown>).error) : undefined;
        return {
          success: false,
          error: errorMsg || errorField || 'Erro na requisição',
          status: response.status
        };
      }
      return {
        success: true,
        data: data as T,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Testa a conexão com a API
   */
  async testConnection(): Promise<ContaAzulApiResponse<unknown>> {
    return this.get<unknown>('/v1/company');
  }
}

/**
 * Cria uma instância da API do ContaAzul
 */
export function createContaAzulApi(barId: number): ContaAzulApi {
  return new ContaAzulApi(barId);
}

/**
 * Verifica se o ContaAzul está conectado para um bar
 */
export async function isContaAzulConnected(barId: number): Promise<boolean> {
  try {
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('ativo, access_token, expires_at')
      .eq('bar_id', barId)
      .eq('sistema', 'contaazul')
      .single();

    if (error || !credentials) {
      return false;
    }

    const typedCredentials = credentials as { ativo: boolean; access_token: string | null; expires_at: string | null };

    if (!typedCredentials.ativo || !typedCredentials.access_token) {
      return false;
    }

    // Verificar se o token não expirou
    const expiresAt = typedCredentials.expires_at ? new Date(typedCredentials.expires_at) : null;
    if (expiresAt && expiresAt <= new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão ContaAzul:', error);
    return false;
  }
}

/**
 * Tipos de dados comuns da API ContaAzul
 */
export interface ContaAzulCompany {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface ContaAzulSale {
  id: string;
  number: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  customer: {
    id: string;
    name: string;
    document: string;
  };
  total: number;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
    };
    quantity: number;
    value: number;
    total: number;
  }>;
}

export interface ContaAzulProduct {
  id: string;
  name: string;
  code: string;
  category: {
    id: string;
    name: string;
  };
  price: number;
  cost: number;
  active: boolean;
  stock: {
    current: number;
    minimum: number;
  };
} 

