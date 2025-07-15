import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getAdminClient()
    
    // Buscar checklists que precisam ser configurados
    const { data: checklistsConfig, error: configError } = await supabase
      .from('checklists')
      .select('id, nome, ativo')
      .eq('bar_id', bar_id)
      .eq('ativo', false) // Checklists inativos precisam configuração

    if (configError) {
      console.error('Erro ao buscar checklists configuração:', configError)
      return NextResponse.json({ 
        success: true,
        config_pendentes: 0 
      })
    }

    const totalConfig = checklistsConfig?.length || 0

    return NextResponse.json({
      success: true,
      config_pendentes: totalConfig,
      detalhes: {
        total: totalConfig
      }
    })

  } catch (error) {
    console.error('Erro na API checklists/configuracao/pendentes:', error)
    return NextResponse.json({ 
      success: true,
      config_pendentes: 0 
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 