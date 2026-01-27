import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getUserAuth } from '@/lib/auth-helper'

const SUPABASE_FUNCTIONS_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    // Autenticar usando o sistema de cookies/headers do projeto
    const user = await getUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado', help: 'Faça login para acessar o agente' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bar_id, mensagem } = body

    // Usar bar_id do usuário se não for informado
    const barIdFinal = bar_id || user.bar_id

    if (!barIdFinal) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!mensagem || !mensagem.trim()) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    console.log(`🤖 Agente Chat - User: ${user.nome}, Bar: ${barIdFinal}, Msg: ${mensagem.substring(0, 50)}...`)

    // Chamar Edge Function de chat usando service role key
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/agente-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        bar_id: barIdFinal,
        usuario_id: user.user_id || user.id.toString(),
        mensagem: mensagem.trim()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro Edge Function:', errorText)
      throw new Error(`Erro ao processar: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('❌ Erro na API /api/agente/chat:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao processar chat',
        resposta: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.'
      },
      { status: 500 }
    )
  }
}

// Buscar histórico de conversas
export async function GET(request: NextRequest) {
  try {
    // Autenticar usando o sistema de cookies/headers do projeto
    const user = await getUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id') || user.bar_id?.toString()
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!bar_id) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Buscar conversas
    const { data: conversas, error } = await supabase
      .from('agente_conversas')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Erro ao buscar conversas:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      conversas: conversas?.reverse() || []
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}
