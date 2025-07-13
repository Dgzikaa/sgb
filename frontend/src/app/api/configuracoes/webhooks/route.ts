import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.dGNZvl9_7-RZhFqD8GKIvSsqeAh0_GnWQdpNGQCfQ8g'
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    console.log('🔍 GET /api/configuracoes/webhooks - Bar ID:', barId)
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID é obrigatório' },
        { status: 400 }
      )
    }

    // Converter para integer para garantir compatibilidade
    const barIdInt = parseInt(barId, 10)
    console.log('🔍 Bar ID convertido para int:', barIdInt)

    // Buscar configurações usando service role (bypass RLS)
    console.log('🔍 Buscando configuração com service role...')
    const { data: configs, error } = await supabaseAdmin
      .from('api_credentials')
      .select('id, bar_id, sistema, configuracoes')
      .eq('bar_id', barIdInt)
      .eq('sistema', 'webhook')
      .maybeSingle()

    console.log('📊 Resultado da query:', { configs, error })

    if (error) {
      console.error('❌ Erro ao buscar configurações:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar configurações' },
        { status: 500 }
      )
    }

    // Se não encontrou nada, retornar configurações vazias
    if (!configs) {
      console.log('⚠️ Nenhuma configuração encontrada, retornando padrões vazios')
      return NextResponse.json({
        success: true,
        configuracoes: {
          sistema: '',
          contaazul: '',
          meta: '',
          checklists: '',
          contahub: '',
          vendas: '',
          reservas: ''
        }
      })
    }

    console.log('✅ Configurações encontradas:', configs.configuracoes)
    
    return NextResponse.json({
      success: true,
      configuracoes: configs.configuracoes || {
        sistema: '',
        contaazul: '',
        meta: '',
        checklists: '',
        contahub: '',
        vendas: '',
        reservas: ''
      }
    })

  } catch (error) {
    console.error('❌ Erro na API de configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bar_id, configuracoes } = await request.json()
    
    if (!bar_id || !configuracoes) {
      return NextResponse.json(
        { success: false, error: 'Bar ID e configurações são obrigatórios' },
        { status: 400 }
      )
    }

    // Salvar configurações no banco usando service role
    const { data, error } = await supabaseAdmin
      .from('api_credentials')
      .upsert({
        bar_id,
        sistema: 'webhook',
        configuracoes,
        ativo: true
      }, {
        onConflict: 'bar_id,sistema'
      })

    if (error) {
      console.error('❌ Erro ao salvar configurações:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar configurações' },
        { status: 500 }
      )
    }

    console.log('✅ Configurações de webhook salvas com sucesso:', { bar_id, configuracoes })
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro na API de configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 