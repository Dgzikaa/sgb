import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

// =====================================================
// ✅ API PARA RESOLVER ALERTAS
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: alertId } = await params

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