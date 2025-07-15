import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseClient()
    
    // Buscar pendências gerais do sistema
    let pendenciasGerais = 0

    // 1. Notificações não lidas
    const { data: notificacoes, error: notifError } = await supabase
      .from('notifications')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('user_id', user_id)
      .eq('lida', false)

    if (!notifError && notificacoes) {
      pendenciasGerais += notificacoes.length
    }

    // 2. Backups atrasados (se último backup > 7 dias)
    const { data: ultimoBackup, error: backupError } = await supabase
      .from('system_backups')
      .select('created_at')
      .eq('bar_id', bar_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!backupError && ultimoBackup && ultimoBackup.length > 0) {
      const ultimaData = new Date(ultimoBackup[0].created_at)
      const agora = new Date()
      const diasSemBackup = Math.floor((agora.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diasSemBackup > 7) {
        pendenciasGerais += 1
      }
    }

    // 3. Eventos de segurança críticos não resolvidos
    const { data: eventosSeguranca, error: secError } = await supabase
      .from('security_events')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('resolved', false)
      .gte('risk_score', 80)

    if (!secError && eventosSeguranca) {
      pendenciasGerais += eventosSeguranca.length
    }

    return NextResponse.json({
      pendencias_gerais: pendenciasGerais,
      detalhes: {
        notificacoes_nao_lidas: notificacoes?.length || 0,
        backup_atrasado: ultimoBackup?.length === 0 || 
          (ultimoBackup && ultimoBackup.length > 0 && 
           Math.floor((new Date().getTime() - new Date(ultimoBackup[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) > 7),
        eventos_seguranca_criticos: eventosSeguranca?.length || 0
      }
    })

  } catch (error) {
    console.error('Erro ao buscar resumo dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 