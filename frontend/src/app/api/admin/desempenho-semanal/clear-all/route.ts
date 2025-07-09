import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth(request)

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem limpar dados' 
      }, { status: 403 })
    }

    const { bar_id } = user
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🗑️ LIMPANDO TODOS OS DADOS de desempenho_semanal para bar_id:', bar_id)

    // Excluir todos os registros da tabela para este bar
    const { data, error } = await supabase
      .from('desempenho_semanal')
      .delete()
      .eq('bar_id', bar_id)
      .select('id')

    if (error) {
      console.error('❌ Erro ao limpar dados:', error)
      return NextResponse.json({ 
        error: 'Erro ao limpar dados',
        details: error.message 
      }, { status: 500 })
    }

    const registrosExcluidos = data?.length || 0

    console.log(`✅ LIMPEZA CONCLUÍDA: ${registrosExcluidos} registros excluídos`)

    return NextResponse.json({
      success: true,
      message: `Todos os dados foram limpos com sucesso`,
      registros_excluidos: registrosExcluidos,
      bar_id
    })

  } catch (error: any) {
    console.error('❌ Erro na limpeza:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 