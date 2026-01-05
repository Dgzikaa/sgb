// Cliente Pluggy para integração com Open Finance

export interface PluggyConfig {
  clientId: string
  clientSecret: string
  baseUrl?: string
}

export interface PluggyConnector {
  id: string
  name: string
  institutionUrl: string
  imageUrl: string
  primaryColor: string
  type: string
  credentials: any[]
}

export interface PluggyItem {
  id: string
  connector: {
    id: string
    name: string
  }
  status: string
  executionStatus: string
  createdAt: string
  updatedAt: string
}

export interface PluggyAccount {
  id: string
  type: string
  subtype: string
  number: string
  name: string
  balance: number
  currencyCode: string
  itemId: string
}

export interface PluggyTransaction {
  id: string
  accountId: string
  date: string
  description: string
  amount: number
  balance: number
  currencyCode: string
  category: string
  type: string
}

export class PluggyClient {
  private config: PluggyConfig
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(config: PluggyConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.pluggy.ai'
    }
  }

  /**
   * Autenticar com Pluggy e obter access token
   */
  private async authenticate(): Promise<string> {
    // Se já tem token válido, retorna
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    const response = await fetch(`${this.config.baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret
      })
    })

    if (!response.ok) {
      throw new Error(`Erro na autenticação Pluggy: ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.apiKey
    // Token válido por 24 horas
    this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    return this.accessToken
  }

  /**
   * Fazer requisição autenticada
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.authenticate()

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-KEY': token,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `Erro na requisição: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Listar conectores disponíveis (bancos)
   */
  async getConnectors(): Promise<PluggyConnector[]> {
    const data = await this.request<{ results: PluggyConnector[] }>('/connectors')
    return data.results
  }

  /**
   * Buscar conector específico
   */
  async getConnector(connectorId: string): Promise<PluggyConnector> {
    return this.request<PluggyConnector>(`/connectors/${connectorId}`)
  }

  /**
   * Criar item (conectar banco)
   */
  async createItem(params: {
    connectorId: string
    credentials: Record<string, string>
  }): Promise<PluggyItem> {
    return this.request<PluggyItem>('/items', {
      method: 'POST',
      body: JSON.stringify({
        connectorId: params.connectorId,
        parameters: params.credentials
      })
    })
  }

  /**
   * Buscar item específico
   */
  async getItem(itemId: string): Promise<PluggyItem> {
    return this.request<PluggyItem>(`/items/${itemId}`)
  }

  /**
   * Atualizar item (forçar sincronização)
   */
  async updateItem(itemId: string): Promise<PluggyItem> {
    return this.request<PluggyItem>(`/items/${itemId}`, {
      method: 'PATCH'
    })
  }

  /**
   * Deletar item (desconectar banco)
   */
  async deleteItem(itemId: string): Promise<void> {
    await this.request(`/items/${itemId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Listar contas de um item
   */
  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    const data = await this.request<{ results: PluggyAccount[] }>(`/accounts?itemId=${itemId}`)
    return data.results
  }

  /**
   * Buscar transações de uma conta
   */
  async getTransactions(
    accountId: string,
    params?: {
      from?: string // YYYY-MM-DD
      to?: string   // YYYY-MM-DD
      pageSize?: number
      page?: number
    }
  ): Promise<PluggyTransaction[]> {
    const queryParams = new URLSearchParams()
    if (params?.from) queryParams.append('from', params.from)
    if (params?.to) queryParams.append('to', params.to)
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.page) queryParams.append('page', params.page.toString())

    const data = await this.request<{ results: PluggyTransaction[] }>(
      `/transactions?accountId=${accountId}&${queryParams.toString()}`
    )
    return data.results
  }

  /**
   * Buscar todas as transações de um item (todas as contas)
   */
  async getAllTransactions(
    itemId: string,
    params?: {
      from?: string
      to?: string
    }
  ): Promise<PluggyTransaction[]> {
    // Buscar contas do item
    const accounts = await this.getAccounts(itemId)
    
    // Buscar transações de todas as contas
    const allTransactions: PluggyTransaction[] = []
    
    for (const account of accounts) {
      try {
        const transactions = await this.getTransactions(account.id, params)
        allTransactions.push(...transactions)
      } catch (error) {
        console.error(`Erro ao buscar transações da conta ${account.id}:`, error)
      }
    }

    return allTransactions
  }
}

/**
 * Criar instância do cliente Pluggy
 */
export function createPluggyClient(): PluggyClient {
  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais Pluggy não configuradas. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no .env')
  }

  return new PluggyClient({
    clientId,
    clientSecret
  })
}
