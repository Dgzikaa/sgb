import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONTAAZUL_API_BASE_URL = 'https://api.contaazul.com';

export interface ContaAzulApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
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
  private async loadCredentials() {
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', this.barId)
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials) {
      throw new Error('Credenciais ná£o encontradas para este bar');
    }

    if (!credentials.access_token) {
      throw new Error('Token de acesso ná£o disponá­vel. Autorize a integraá§á£o primeiro.');
    }

    this.accessToken = credentials.access_token;
    this.tokenExpiresAt = credentials.expires_at ? new Date(credentials.expires_at) : null;

    return credentials;
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
  private async refreshToken() {
    try {
      const response = await fetch(`/api/contaazul/auth?action=refresh&barId=${this.barId}`);
      const data = await response.json();

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
   * Prepara os headers para a requisiá§á£o
   */
  private async prepareHeaders(): Promise<HeadersInit> {
    await this.loadCredentials();

    if (this.needsTokenRefresh()) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        throw new Error('Ná£o foi possá­vel renovar o token. Autorize a integraá§á£o novamente.');
      }
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Faz uma requisiá§á£o GET autenticada
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ContaAzulApiResponse<T>> {
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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Erro na requisiá§á£o',
          status: response.status
        };
      }

      return {
        success: true,
        data,
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
   * Faz uma requisiá§á£o POST autenticada
   */
  async post<T = any>(endpoint: string, body?: any): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      
      const response = await fetch(`${CONTAAZUL_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Erro na requisiá§á£o',
          status: response.status
        };
      }

      return {
        success: true,
        data,
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
   * Faz uma requisiá§á£o PUT autenticada
   */
  async put<T = any>(endpoint: string, body?: any): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      
      const response = await fetch(`${CONTAAZUL_API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Erro na requisiá§á£o',
          status: response.status
        };
      }

      return {
        success: true,
        data,
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
   * Faz uma requisiá§á£o DELETE autenticada
   */
  async delete<T = any>(endpoint: string): Promise<ContaAzulApiResponse<T>> {
    try {
      const headers = await this.prepareHeaders();
      
      const response = await fetch(`${CONTAAZUL_API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });

      // DELETE pode retornar 204 (No Content)
      if (response.status === 204) {
        return {
          success: true,
          status: response.status
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Erro na requisiá§á£o',
          status: response.status
        };
      }

      return {
        success: true,
        data,
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
   * Testa a conexá£o com a API
   */
  async testConnection(): Promise<ContaAzulApiResponse> {
    try {
      // Tentar buscar informaá§áµes da empresa
      const response = await this.get('/v1/company');
      
      if (response.success) {
        // Salvar informaá§áµes da empresa no banco
        await supabase
          .from('api_credentials')
          .update({
            empresa_id: response.data.id,
            empresa_nome: response.data.name,
            empresa_cnpj: response.data.document
          })
          .eq('bar_id', this.barId)
          .eq('sistema', 'contaazul');
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao testar conexá£o'
      };
    }
  }
}

/**
 * Funá§á£o utilitá¡ria para criar uma instá¢ncia da API
 */
export function createContaAzulApi(barId: number): ContaAzulApi {
  return new ContaAzulApi(barId);
}

/**
 * Funá§á£o para verificar se a integraá§á£o está¡ configurada e ativa
 */
export async function isContaAzulConnected(barId: number): Promise<boolean> {
  try {
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('access_token, expires_at, ativo')
      .eq('bar_id', barId)
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.ativo || !credentials.access_token) {
      return false;
    }

    // Verificar se o token ná£o está¡ expirado
    if (credentials.expires_at) {
      const expiresAt = new Date(credentials.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar conexá£o ContaAzul:', error);
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
