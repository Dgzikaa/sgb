import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

interface AssistantRequest {
  message: string
  context: {
    barName: string
    barId?: number
    currentData?: any
    conversation?: any[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AssistantRequest = await request.json()
    console.log('🔥 Requisição recebida:', { 
      message: body.message, 
      barName: body.context.barName 
    })

    // Verificar se tem API Key da OpenAI
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY não configurada')
      return NextResponse.json({
        response: `❌ **Erro de Configuração**\n\nA API Key do OpenAI não está configurada.\n\nConfigure a OPENAI_API_KEY no arquivo .env.local`,
        metadata: { 
          type: 'configuration_error',
          tokens: 0
        }
      }, { status: 500 })
    }

    // Preparar contexto para o ChatGPT
    const systemPrompt = createSystemPrompt(body.context)
    const userMessage = body.message

    // Chamada para OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('❌ Erro na API OpenAI:', error)
      
      return NextResponse.json({
        response: `❌ **Erro na API OpenAI**\n\n${error}`,
        metadata: { 
          type: 'openai_error',
          error: error
        }
      }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    const response = openaiData.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.'

    console.log('✅ Resposta do ChatGPT gerada')

    return NextResponse.json({
      response: `🤖 **ChatGPT**\n\n${response}`,
      metadata: {
        type: 'openai',
        model: openaiData.model,
        tokens: openaiData.usage?.total_tokens || 0
      },
      usage: openaiData.usage
    })

  } catch (error) {
    console.error('❌ Erro no assistant API:', error)
    
    return NextResponse.json({
      response: '❌ Erro interno no assistant. Tente novamente em alguns instantes.',
      metadata: { 
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}

// Criar prompt do sistema baseado no contexto
function createSystemPrompt(context: any): string {
  return `Você é o SGB Assistant, um assistente inteligente especializado em análise de dados para bares e restaurantes.

**Contexto:**
- Bar: ${context.barName}
- ID do Bar: ${context.barId || 'N/A'}
- Data atual: ${new Date().toLocaleDateString('pt-BR')}

**Suas especialidades:**
- Análise de vendas e faturamento
- Detecção de padrões e anomalias
- Sugestões para melhorar resultados
- Interpretação de dados financeiros
- Comparações e tendências

**Instruções:**
1. Seja sempre útil e objetivo
2. Use emojis para deixar as respostas mais visuais
3. Forneça insights práticos e acionáveis
4. Se não souber algo, seja honesto
5. Responda sempre em português brasileiro
6. Mantenha o tom profissional mas amigável
7. Estruture respostas longas com tópicos
8. Use markdown para formatação quando apropriado

**Formato de resposta:**
- Use **negrito** para destacar pontos importantes
- Use • para listas
- Use números para sequências
- Inclua emojis relevantes (📊 📈 💰 🎯 etc.)
- Termine com uma pergunta ou sugestão de próximo passo quando relevante`
}

// Permitir requisições GET para teste
export async function GET() {
  return NextResponse.json({
    message: 'SGB Assistant API está funcionando!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
} 