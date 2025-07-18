'use client'

interface ChatGPTRequest {
  message: string
  context: {
    barName: string
    barId?: number
    currentData?: Record<string, string | number | boolean>
    conversation?: Array<Record<string, string | number | boolean>>
  }
}

interface ChatGPTResponse {
  response: string
  metadata?: Record<string, unknown>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class OpenAIClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/assistant' // API route que vamos criar
  }

  async chat(request: ChatGPTRequest): Promise<ChatGPTResponse> {
    try {
      console.log('🤖 Enviando para ChatGPT:', request)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Erro na API: ${response.status} - ${error}`)
      }

      const data: ChatGPTResponse = await response.json()
      console.log('✅ Resposta do ChatGPT:', data)
      
      return data
    } catch (error) {
      console.error('❌ Erro ao comunicar com ChatGPT:', error)
      throw error
    }
  }

  async analyzeData(data: unknown, question: string, context: { barName: string; barId?: number; conversation?: unknown[] }): Promise<string> {
    const request: ChatGPTRequest = {
      message: question,
      context: {
        ...context,
        currentData: this.sanitizeData(data) as Record<string, string | number | boolean>,
        conversation: context.conversation as Array<Record<string, string | number | boolean>> | undefined
      }
    }

    const response = await this.chat(request)
    return response.response
  }

  // Sanitizar dados sensíveis antes de enviar para OpenAI
  private sanitizeData(data: unknown): unknown {
    if (!data) return data

    // Criar cópia dos dados
    const sanitized = JSON.parse(JSON.stringify(data) as unknown)

    // Remover/anonimizar campos sensíveis
    const sensitiveFields = ['cpf', 'senha', 'token', 'password', 'secret']
    
    const sanitizeObject = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item))
      }
      if (obj && typeof obj === 'object') {
        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          // Remover campos sensíveis
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = '[REDACTED]'
          } else {
            result[key] = sanitizeObject(value)
          }
        }
        return result
      }
      return obj
    }

    return sanitizeObject(sanitized)
  }
}

// Instância singleton
export const openaiClient = new OpenAIClient() 

