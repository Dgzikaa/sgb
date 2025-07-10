import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =====================================================
// ⏰ API PARA ADIAR (SNOOZE) ALERTAS
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
    const { minutes } = await req.json()

    if (!alertId) {
      return NextResponse.json({ 
        error: 'ID do alerta não fornecido' 
      }, { status: 400 })
    }

    if (!minutes || minutes <= 0) {
      return NextResponse.json({ 
        error: 'Tempo de adiamento inválido' 
      }, { status: 400 })
    }

    // Calcular quando o alerta deve reaparecer
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000)

    // Log do adiamento do alerta
    const snoozeLog = {
      alert_id: alertId,
      user_id: user.id,
      action: 'snoozed',
      snoozed_at: new Date().toISOString(),
      snooze_until: snoozeUntil.toISOString(),
      snooze_minutes: minutes,
      notes: `Alerta adiado por ${minutes} minutos`
    }

    // Aqui você pode salvar o log de adiamento no banco se necessário
    // const { error: logError } = await supabase
    //   .from('alert_snoozes')
    //   .insert(snoozeLog)

    return NextResponse.json({
      success: true,
      message: `Alerta adiado por ${minutes} minutos`,
      alertId,
      snoozedAt: snoozeLog.snoozed_at,
      snoozeUntil: snoozeLog.snooze_until,
      snoozeMinutes: minutes
    })

  } catch (error) {
    console.error('Erro ao adiar alerta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 