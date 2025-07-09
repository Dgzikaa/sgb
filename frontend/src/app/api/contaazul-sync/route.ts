import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🔄 FORÇAR SINCRONIZAÇÃO DO CONTAAZUL V5
// ========================================
export async function POST(request: NextRequest) {
  try {
    // Usar autenticação real (sem mock)
    const user = await getUserAuth(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não autenticado' 
      }, { status: 401 })
    }
    
    if (!isAdmin(user)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem forçar sincronização' 
      }, { status: 403 })
    }

    console.log('🔄 Redirecionando para API V5 do ContaAzul (Selenium Original)...')

    // Chamar a nova API V5 internamente
    const response = await fetch(`${request.nextUrl.origin}/api/admin/contaazul-v5-selenium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-data': request.headers.get('x-user-data') || ''
      },
      body: JSON.stringify({ headless: true })
    })

    const resultado = await response.json()

    if (response.ok && resultado.success) {
      return NextResponse.json({
        success: true,
        message: 'Sincronização V5 concluída com sucesso',
        resultados: {
          sucesso: true,
          registros_processados: resultado.registros || 0,
          versao: 'ContaAzul V5 - Selenium Original',
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Erro na sincronização V5',
        details: resultado.error || 'Erro desconhecido'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 📊 VERIFICAR STATUS DA SINCRONIZAÇÃO
// ========================================
export async function GET(request: NextRequest) {
  try {
    // Usar autenticação real (sem mock)
    const user = await getUserAuth(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não autenticado' 
      }, { status: 401 })
    }
    
    const { bar_id } = user

    // Buscar estatísticas simples dos dados do ContaAzul
    const { data: stats, error } = await supabase
      .from('contaazul')
      .select('id, sincronizado_em')
      .eq('bar_id', bar_id)
      .order('sincronizado_em', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Erro ao buscar stats:', error)
      return NextResponse.json({ 
        error: 'Erro ao verificar dados do ContaAzul' 
      }, { status: 500 })
    }

    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('contaazul')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', bar_id)

    return NextResponse.json({
      success: true,
      status: stats?.length > 0 ? 'dados_disponiveis' : 'sem_dados',
      total_registros: count || 0,
      ultima_atualizacao: stats?.[0]?.sincronizado_em || null,
      versao: 'ContaAzul V5 - Selenium Original'
    })

  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 