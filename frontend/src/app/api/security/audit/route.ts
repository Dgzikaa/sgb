import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    // Buscar logs de auditoria mais recentes
    const { data: logs, error } = await supabase
      .from('audit_trail')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Erro ao buscar logs de auditoria:', error)
    }

    return NextResponse.json({
      success: true,
      logs: logs || []
    })

  } catch (error) {
    console.error('❌ Erro na API de logs de auditoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 