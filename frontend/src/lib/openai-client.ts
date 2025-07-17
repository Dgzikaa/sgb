'use client'

interface ChatGPTRequest {
  message: string
  context: {
    barName: string
    barId?: number
    currentData?: any
    conversation?: any[]
  }
}

interface ChatGPTResponse {
  response: string
  metadata?: any
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
      console.log('ü§ñ Enviando para ChatGPT:', request)

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
      console.log('úÖ Resposta do ChatGPT:', data)
      
      return data
    } catch (error) {
      console.error('ùå Erro ao comunicar com ChatGPT:', error)
      throw error
    }
  }

  async analyzeData(data, question: string, context): Promise<string> {
    const request: ChatGPTRequest = {
      message: question,
      context: {
        ...context,
        currentData: this.sanitizeData(data)
      }
    }

    const response = await this.chat(request)
    return response.response
  }

  // Sanitizar dados sens·≠veis antes de enviar para OpenAI
  private sanitizeData(data): any {
    if (!data) return data

    // Criar c·≥pia dos dados
    const sanitized = JSON.parse(JSON.stringify(data))

    // Remover/anonimizar campos sens·≠veis
    const sensitiveFields = ['cpf', 'senha', 'token', 'password', 'secret']
    
    const sanitizeObject = (obj): any => {
      if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item))
      }
      
      if (obj && typeof obj === 'object') {
        const result = {}
        for (const [key, value] of Object.entries(obj)) {
          // Remover campos sens·≠veis
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

// Inst·¢ncia singleton
export const openaiClient = new OpenAIClient() 
