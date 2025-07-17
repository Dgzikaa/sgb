import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'SGB-2024-WhatsApp-Evolution-API-Key'
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'sgb-principal'
const WHATSAPP_SIMULATION_MODE = process.env.WHATSAPP_SIMULATION_MODE === 'true' || !process.env.EVOLUTION_API_URL

interface WhatsAppMessage {
  number: string
  message: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  media?: {
    url?: string
    base64?: string
    filename?: string
    caption?: string
  }
}

interface ChecklistNotification {
  checklist_id: string
  checklist_nome: string
  bar_nome: string
  deadline: string
  responsavel: string
  status: 'agendado' | 'em_andamento' | 'vencido' | 'concluido'
  prioridade: 'baixa' | 'normal' | 'alta' | 'critica'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      numbers, 
      message, 
      type = 'text', 
      media,
      checklist_data 
    }: {
      numbers: string[]
      message?: string
      type?: 'text' | 'template' | 'checklist_notification'
      media?: any
      checklist_data?: ChecklistNotification
    } = body

    // Validar dados obrigat·≥rios
    if (!numbers || numbers.length === 0) {
      return NextResponse.json(
        { error: 'N·∫meros de telefone s·£o obrigat·≥rios' },
        { status: 400 }
      )
    }

    // Preparar mensagem baseada no tipo
    let finalMessage = message
    
    if (type === 'checklist_notification' && checklist_data) {
      finalMessage = formatChecklistMessage(checklist_data)
    }

    if (!finalMessage) {
      return NextResponse.json(
        { error: 'Mensagem ·© obrigat·≥ria' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Enviar para cada n·∫mero
    for (const number of numbers) {
      try {
        const cleanNumber = cleanPhoneNumber(number)
        const messageData: WhatsAppMessage = {
          number: cleanNumber,
          message: finalMessage,
          type: 'text',
          ...(media && { media })
        }

        const response = await sendToEvolutionAPI(messageData)
        
        if (response.success) {
          results.push({
            number: cleanNumber,
            status: 'sent',
            message_id: response.key?.id,
            timestamp: new Date().toISOString()
          })
        } else {
          errors.push({
            number: cleanNumber,
            error: response.error || 'Erro desconhecido'
          })
        }

      } catch (error) {
        errors.push({
          number,
          error: `Erro ao enviar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      total_sent: results.length,
      total_errors: errors.length,
      results,
      errors
    })

  } catch (error) {
    console.error('Erro na API WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Fun·ß·£o auxiliar para enviar para Evolution API
async function sendToEvolutionAPI(messageData: WhatsAppMessage) {
  // üß™ MODO SIMULA·á·ÉO - Para testes sem WhatsApp real
  if (WHATSAPP_SIMULATION_MODE) {
    console.log('üß™ MODO SIMULA·á·ÉO - WhatsApp:', {
      to: messageData.number,
      message: messageData.message.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      simulated: true
    })

    // Simular resposta bem-sucedida
    return {
      success: true,
      key: {
        id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      message: 'Simula·ß·£o: Mensagem enviada com sucesso',
      simulated: true
    }
  }

  // üì± MODO PRODU·á·ÉO - Envio real para Evolution API
  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`
  
  const payload = {
    number: messageData.number,
    options: {
      delay: 1200,
      presence: 'composing'
    },
    textMessage: {
      text: messageData.message
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    return {
      success: true,
      ...result
    }
  } catch (error) {
    console.error('ùå Erro Evolution API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Fun·ß·£o para limpar n·∫mero de telefone
function cleanPhoneNumber(number: string): string {
  // Remove todos os caracteres n·£o num·©ricos
  let cleaned = number.replace(/\D/g, '')
  
  // Adiciona c·≥digo do pa·≠s se n·£o tiver
  if (cleaned.length === 11 && cleaned.startsWith('11')) {
    cleaned = '55' + cleaned
  } else if (cleaned.length === 10) {
    cleaned = '5511' + cleaned
  } else if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  
  return cleaned
}

// Fun·ß·£o para formatar mensagem de checklist
function formatChecklistMessage(data: ChecklistNotification): string {
  const statusEmojis = {
    agendado: 'üìÖ',
    em_andamento: 'è≥',
    vencido: 'üö®',
    concluido: 'úÖ'
  }

  const prioridadeEmojis = {
    baixa: 'üîµ',
    normal: 'üü°',
    alta: 'üü†',
    critica: 'üî¥'
  }

  const deadline = new Date(data.deadline).toLocaleString('pt-BR')

  return `${statusEmojis[data.status]} *SGB - Checklist ${data.status.toUpperCase()}*

üìã *Checklist:* ${data.checklist_nome}
üè¢ *Bar:* ${data.bar_nome}
üë§ *Respons·°vel:* ${data.responsavel}
è∞ *Prazo:* ${deadline}
${prioridadeEmojis[data.prioridade]} *Prioridade:* ${data.prioridade.toUpperCase()}

${data.status === 'vencido' ? 'ö†Ô∏è *ATEN·á·ÉO: Checklist vencido!*' : ''}
${data.status === 'agendado' ? 'üëÜ *Acesse o sistema para executar*' : ''}

_Sistema de Gest·£o de Bares_`
}

// GET - Verificar status da conex·£o
export async function GET() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Falha ao verificar status')
    }

    const data = await response.json()
    
    return NextResponse.json({
      connected: data.instance?.state === 'open',
      status: data.instance?.state || 'unknown',
      instance: EVOLUTION_INSTANCE_NAME
    })

  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
