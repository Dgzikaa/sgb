/**
 * Cliente Pluggy para integração com Open Finance
 * Docs: https://docs.pluggy.ai/
 */

export class PluggyClient {
  private clientId: string
  private clientSecret: string
  private baseUrl = 'https://api.pluggy.ai'
  private token: string | null = null
  private tokenExpiry: number = 0

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  /**
   * Autenticar e obter API Key
   * Ref: https://docs.pluggy.ai/docs/authentication
   */
  private async authenticate() {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    const response = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Erro na autenticação Pluggy: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    this.token = data.apiKey
    this.tokenExpiry = Date.now() + (2 * 60 * 60 * 1000) // 2 horas (conforme docs)

    return this.token
  }

  /**
   * Fazer request autenticado
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.authenticate()

    if (!token) {
      throw new Error('Erro na autenticação: token não disponível')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-KEY': token,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * Criar Connect Token para widget
   */
  async createConnectToken(userId: string) {
    return this.request('/connect_token', {
      method: 'POST',
      body: JSON.stringify({ clientUserId: userId }),
    })
  }

  /**
   * Listar conectores disponíveis
   */
  async listConnectors() {
    return this.request('/connectors')
  }

  /**
   * Buscar item conectado
   */
  async getItem(itemId: string) {
    return this.request(`/items/${itemId}`)
  }

  /**
   * Listar contas de um item
   */
  async getAccounts(itemId: string) {
    return this.request(`/accounts?itemId=${itemId}`)
  }

  /**
   * Buscar transações de uma conta
   */
  async getTransactions(accountId: string, from?: string, to?: string) {
    let url = `/transactions?accountId=${accountId}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`
    
    return this.request(url)
  }

  /**
   * Deletar item (desconectar banco)
   */
  async deleteItem(itemId: string) {
    return this.request(`/items/${itemId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Atualizar item (forçar sync)
   */
  async updateItem(itemId: string) {
    return this.request(`/items/${itemId}/refresh`, {
      method: 'PATCH',
    })
  }
}

// Singleton client
let pluggyClient: PluggyClient | null = null

export function getPluggyClient() {
  if (!pluggyClient) {
    const clientId = process.env.PLUGGY_CLIENT_ID
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Pluggy credentials not configured')
    }

    pluggyClient = new PluggyClient(clientId, clientSecret)
  }

  return pluggyClient
}
