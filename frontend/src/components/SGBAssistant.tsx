'use client'

import { useState, useRef, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { openaiClient } from '@/lib/openai-client'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    command?: string
    data?: any
    feedback?: 'positive' | 'negative'
  }
}

interface SGBAssistantProps {
  isOpen: boolean
  onToggle: () => void
  barInfo: {
    nome: string
    id?: number
  } | null
}

export default function SGBAssistant({ isOpen, onToggle, barInfo }: SGBAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Olá¡! Sou o SGB Assistant ðŸ¤–\n\nSou seu assistente inteligente para aná¡lise de dados do ${barInfo?.nome || 'bar'}. Posso te ajudar com:\n\n€¢ ðŸ“Š Aná¡lises de vendas e faturamento\n€¢ ðŸ” Detecá§á£o de padráµes e anomalias\n€¢ ðŸ’¡ Sugestáµes de melhorias\n€¢ “ Respostas sobre o negá³cio\n\nO que vocáª gostaria de saber?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('Œ Erro ao conectar com banco');
      return;
    }

    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    console.log('ðŸ¤– Enviando mensagem:', userInput)

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    }

    // Adicionar mensagem do usuá¡rio imediatamente
    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      console.log('ðŸ“ Mensagens atualizadas:', newMessages)
      return newMessages
    })
    
    // Limpar input
    setInput('')
    setIsLoading(true)

    try {
      // Processar comando do usuá¡rio
      const response = await processUserInput(userInput, barInfo)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
      console.log('ðŸ¤– Resposta enviada:', response.content)
    } catch (error) {
      console.error('Œ Erro no assistant:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitaá§á£o. Tente novamente.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('Œ Erro ao conectar com banco');
      return;
    }

    setMessages(prev => prev.map((msg: any) => 
      msg.id === messageId 
        ? { ...msg, metadata: { ...msg.metadata, feedback } }
        : msg
    ))

    // TODO: Salvar feedback no banco para aprendizado
    console.log(`Feedback ${feedback} para mensagem ${messageId}`)
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: `Chat limpo! ðŸ§¹\n\nSou o SGB Assistant do ${barInfo?.nome || 'bar'}. Como posso te ajudar agora?`,
        timestamp: new Date()
      }
    ])
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-4 bottom-4 top-4 w-96 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white">ðŸ¤–</span>
            </div>
            <div>
              <h3 className="font-bold text-white">SGB Assistant</h3>
              <p className="text-white/80 text-xs">Assistente Inteligente</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Limpar chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onToggle}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 message-enter ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>
              
              {/* Feedback buttons para mensagens do assistant */}
              {message.type === 'assistant' && message.id !== '1' && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleFeedback(message.id, 'positive')}
                      className={`p-1 rounded-md transition-colors ${
                        message.metadata?.feedback === 'positive'
                          ? 'bg-green-100 text-green-600'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title="Resposta áºtil"
                    >
                      ðŸ‘
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'negative')}
                      className={`p-1 rounded-md transition-colors ${
                        message.metadata?.feedback === 'negative'
                          ? 'bg-red-100 text-red-600'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Resposta ná£o áºtil"
                    >
                      ðŸ‘Ž
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta..."
            className="assistant-input flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            disabled={isLoading}
            style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Quick Commands */}
        <div className="mt-2 flex flex-wrap gap-1">
          {['ðŸ’° Vendas hoje', 'ðŸ“Š Aná¡lise semana', 'ðŸ” Anomalias', 'ðŸ’¡ Sugestáµes'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => setInput(cmd)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}

// Funá§á£o para processar input do usuá¡rio
async function processUserInput(input: string, barInfo: any): Promise<{ content: string; metadata?: any }> {
  const lowercaseInput = input.toLowerCase()

  // Comandos especá­ficos que usam aná¡lise local
  if (lowercaseInput.includes('vendas hoje') || lowercaseInput.includes('ðŸ’° vendas hoje')) {
    return await analyzeToday(barInfo)
  }
  
  // Para outros comandos e perguntas livres, usar ChatGPT
  try {
    console.log('ðŸ¤– Processando com ChatGPT:', input)
    
    // Buscar dados contextuais se necessá¡rio
    let contextData = null
    if (lowercaseInput.includes('vendas') || lowercaseInput.includes('faturamento')) {
      // Buscar dados bá¡sicos de vendas para contexto
      contextData = await getBasicSalesData(barInfo)
    }

    const response = await openaiClient.chat({
      message: input,
      context: {
        barName: barInfo?.nome || 'Bar',
        barId: barInfo?.id,
        currentData: contextData
      }
    })

    return {
      content: response.response,
      metadata: { 
        command: 'chatgpt',
        type: response.metadata?.type || 'openai',
        tokens: response.metadata?.tokens || 0
      }
    }
  } catch (error) {
    console.error('Œ Erro ao processar com ChatGPT:', error)
    
    // Fallback para comandos especá­ficos em caso de erro
    if (lowercaseInput.includes('aná¡lise semana') || lowercaseInput.includes('ðŸ“Š aná¡lise semana')) {
      return await analyzeWeek(barInfo)
    }
    
    if (lowercaseInput.includes('anomalias') || lowercaseInput.includes('ðŸ” anomalias')) {
      return await detectAnomalies(barInfo)
    }
    
    if (lowercaseInput.includes('sugestáµes') || lowercaseInput.includes('ðŸ’¡ sugestáµes')) {
      return await generateSuggestions(barInfo)
    }

    // Resposta de erro amigá¡vel
    return {
      content: `Œ **Erro de Conexá£o**\n\nNá£o consegui processar sua pergunta: "${input}"\n\nðŸ”§ **Possá­veis soluá§áµes:**\n€¢ Verifique sua conexá£o com a internet\n€¢ Tente novamente em alguns segundos\n€¢ Use comandos bá¡sicos como "vendas hoje"\n\nðŸ’¡ **Comandos disponá­veis offline:**\n€¢ ðŸ’° Vendas hoje\n€¢ ðŸ“Š Aná¡lise semana\n€¢ ðŸ” Anomalias\n€¢ ðŸ’¡ Sugestáµes`,
      metadata: { command: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Funá§á£o para buscar dados bá¡sicos de vendas para contexto
async function getBasicSalesData(barInfo: any) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const supabase = await getSupabaseClient();
    if (!supabase) return 0;
    const { data: vendas } = await supabase
      .from('pagamentos')
      .select('liquido, meio, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .eq('bar_id', barInfo?.id || 1)
      .limit(10) // Limitar para ná£o sobrecarregar

    const total = vendas?.reduce((sum: number, venda: any) => sum + parseFloat(venda.liquido || '0'), 0) || 0
    const quantidade = vendas?.length || 0

    return {
      vendasHoje: {
        total,
        quantidade,
        ticketMedio: quantidade > 0 ? total / quantidade : 0
      },
      ultimasVendas: vendas?.slice(0, 5) // ášltimas 5 vendas como contexto
    }
  } catch (error) {
    console.warn('š ï¸ Erro ao buscar dados de contexto:', error)
    return null
  }
}

// Funá§áµes de aná¡lise (comeá§ando simples, vá£o evoluir)
async function analyzeToday(barInfo: any) {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    // Buscar dados do dia atual
    const supabase = await getSupabaseClient();
    if (!supabase) return {
      content: 'Œ Erro ao conectar com banco de dados.'
    };
    const { data: vendas, error } = await supabase
      .from('pagamentos')
      .select('liquido, meio, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .eq('bar_id', barInfo?.id || 1)

    if (error) throw error

    const total = vendas?.reduce((sum: number, venda: any) => sum + parseFloat(venda.liquido || '0'), 0) || 0
    const quantidade = vendas?.length || 0

    return {
      content: `ðŸ“Š **Vendas de Hoje (${new Date().toLocaleDateString()}):**\n\nðŸ’° **Faturamento:** R$ ${total.toFixed(2)}\nðŸŽ« **Transaá§áµes:** ${quantidade}\nðŸ’³ **Ticket Má©dio:** R$ ${quantidade > 0 ? (total / quantidade).toFixed(2) : '0.00'}\n\n${total > 1000 ? 'ðŸŽ‰ á“timo dia de vendas!' : total > 500 ? 'ðŸ‘ Dia normal de vendas' : 'ðŸ“ˆ Ainda há¡ tempo para melhorar!'}`,
      metadata: { command: 'vendas_hoje', data: { total, quantidade } }
    }
  } catch (error) {
    return {
      content: 'Œ Erro ao buscar dados de vendas de hoje. Verifique a conexá£o com o banco de dados.'
    }
  }
}

async function analyzeWeek(barInfo: any) {
  return {
    content: `ðŸ“Š **Aná¡lise Semanal:**\n\nðŸš§ Esta funcionalidade está¡ sendo desenvolvida...\n\nEm breve vocáª terá¡:\n€¢ Comparativo com semana anterior\n€¢ Tendáªncias de crescimento\n€¢ Melhores dias da semana\n€¢ Projeá§áµes para prá³xima semana\n\n³ Aguarde as prá³ximas atualizaá§áµes!`,
    metadata: { command: 'analise_semana' }
  }
}

async function detectAnomalies(barInfo: any) {
  return {
    content: `ðŸ” **Detecá§á£o de Anomalias:**\n\nðŸš§ Sistema de detecá§á£o em desenvolvimento...\n\nFuturas funcionalidades:\n€¢ Vendas muito baixas/altas\n€¢ Padráµes estranhos nos pagamentos\n€¢ Horá¡rios de pico diferentes\n€¢ Alertas automá¡ticos\n\nðŸ¤– O sistema está¡ aprendendo os padráµes do seu negá³cio!`,
    metadata: { command: 'anomalias' }
  }
}

async function generateSuggestions(barInfo: any) {
  return {
    content: `ðŸ’¡ **Sugestáµes de Melhoria:**\n\nðŸš§ Sistema de sugestáµes em treinamento...\n\nEm breve vocáª receberá¡:\n€¢ Recomendaá§áµes baseadas em dados\n€¢ Melhores horá¡rios para promoá§áµes\n€¢ Estratá©gias para aumentar vendas\n€¢ Otimizaá§áµes operacionais\n\nðŸ“ˆ Quanto mais vocáª usar, melhores será£o as sugestáµes!`,
    metadata: { command: 'sugestoes' }
  }
} 
