import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser } from '@/middleware/auth'

/**
 * API para executar verificação de saúde dos dados
 * POST /api/saude-dados/verificar
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const authResult = await authenticateUser(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Executar verificação diária
    const { data, error } = await supabase.rpc('verificacao_diaria_confiabilidade')

    if (error) {
      console.error('Erro ao executar verificação:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultado: data
    })

  } catch (error: any) {
    console.error('Erro na API de verificação:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
