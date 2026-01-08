import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 🤖 API DE AGENTES - ORQUESTRADOR PRINCIPAL
 * 
 * Endpoint principal que recebe mensagens do usuário e roteia
 * para os agentes especializados no Supabase Edge Functions
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const AGENTES_DISPONIVEIS = [
  'agente-supervisor',      // Orquestrador principal
  'agente-sql-expert',      // Consultas ao banco
  'agente-auditor',         // Auditoria e qualidade
  'agente-mapeador-tabelas', // Schema do banco
  'agente-analise-periodos'  // Comparativos e tendências
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mensagem, bar_id, agente, contexto } = body

    if (!mensagem) {
      return NextResponse.json(
        { success: false, error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // Determinar qual agente usar
    const agenteAlvo = agente || 'agente-supervisor'
    
    if (!AGENTES_DISPONIVEIS.includes(agenteAlvo)) {
      return NextResponse.json(
        { success: false, error: `Agente "${agenteAlvo}" não disponível` },
        { status: 400 }
      )
    }

    console.log(`🤖 Chamando agente: ${agenteAlvo}`)
    console.log(`📝 Mensagem: ${mensagem}`)
    console.log(`🏪 Bar ID: ${bar_id}`)

    // Chamar Edge Function do agente
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${agenteAlvo}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          mensagem,
          bar_id,
          contexto: contexto || {}
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro no agente: ${response.status} - ${errorText}`)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro ao chamar agente: ${response.status}`,
          detalhes: errorText
        },
        { status: response.status }
      )
    }

    const resultado = await response.json()

    return NextResponse.json({
      success: true,
      agente: agenteAlvo,
      ...resultado
    })

  } catch (error) {
    console.error('❌ Erro na API de agentes:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de Agentes do Zykor',
    agentes_disponiveis: AGENTES_DISPONIVEIS.map(a => ({
      nome: a,
      descricao: getDescricaoAgente(a)
    })),
    como_usar: {
      metodo: 'POST',
      body: {
        mensagem: 'string - Pergunta do usuário',
        bar_id: 'number - ID do bar',
        agente: 'string (opcional) - Nome do agente específico',
        contexto: 'object (opcional) - Contexto adicional'
      }
    }
  })
}

function getDescricaoAgente(nome: string): string {
  const descricoes: Record<string, string> = {
    'agente-supervisor': 'Orquestrador principal - roteia para agentes especializados',
    'agente-sql-expert': 'Especialista em consultas ao banco de dados',
    'agente-auditor': 'Verifica qualidade e consistência dos dados',
    'agente-mapeador-tabelas': 'Documenta estrutura e relacionamentos do banco',
    'agente-analise-periodos': 'Análise comparativa e tendências temporais'
  }
  return descricoes[nome] || 'Agente sem descrição'
}

