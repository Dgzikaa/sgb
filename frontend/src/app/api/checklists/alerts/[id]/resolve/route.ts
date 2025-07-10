import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =====================================================
// ✅ API PARA RESOLVER ALERTAS
// =====================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const alertId = params.id

    if (!alertId) {
      return NextResponse.json({ 
        error: 'ID do alerta não fornecido' 
      }, { status: 400 })
    }

    // Log da resolução do alerta (se você quiser salvar no banco)
    const resolveLog = {
      alert_id: alertId,
      user_id: user.id,
      action: 'resolved',
      resolved_at: new Date().toISOString(),
      notes: 'Alerta resolvido pelo usuário'
    }

    // Aqui você pode salvar o log de resolução no banco se necessário
    // const { error: logError } = await supabase
    //   .from('alert_resolutions')
    //   .insert(resolveLog)

    return NextResponse.json({
      success: true,
      message: 'Alerta resolvido com sucesso',
      alertId,
      resolvedAt: resolveLog.resolved_at
    })

  } catch (error) {
    console.error('Erro ao resolver alerta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 