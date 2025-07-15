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
    
    // Verificar último sync ContaAzul
    const { data: ultimoSync, error: syncError } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('sincronizado_em')
      .eq('bar_id', bar_id)
      .order('sincronizado_em', { ascending: false })
      .limit(1)

    let syncPendentes = 0
    
    if (!syncError && ultimoSync && ultimoSync.length > 0) {
      const ultimaData = new Date(ultimoSync[0].sincronizado_em)
      const agora = new Date()
      const horasSemSync = Math.floor((agora.getTime() - ultimaData.getTime()) / (1000 * 60 * 60))
      
      // Se último sync foi há mais de 6 horas, considerar pendente
      if (horasSemSync > 6) {
        syncPendentes = 1
      }
    } else {
      // Nunca sincronizou
      syncPendentes = 1
    }

    // Verificar credenciais ContaAzul
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('expires_at, active')
      .eq('bar_id', bar_id)
      .eq('service', 'contaazul')
      .eq('active', true)

    let credenciaisExpiradas = 0
    
    if (!credError && credenciais && credenciais.length > 0) {
      const expiresAt = new Date(credenciais[0].expires_at)
      const agora = new Date()
      
      if (expiresAt <= agora) {
        credenciaisExpiradas = 1
      }
    } else {
      credenciaisExpiradas = 1
    }

    const totalPendentes = syncPendentes + credenciaisExpiradas

    return NextResponse.json({
      sync_pendentes: totalPendentes,
      detalhes: {
        sync_atrasado: syncPendentes > 0,
        credenciais_expiradas: credenciaisExpiradas > 0,
        ultimo_sync: ultimoSync?.[0]?.sincronizado_em || null,
        status_credenciais: credenciais?.[0]?.active || false
      }
    })

  } catch (error) {
    console.error('Erro ao buscar status ContaAzul:', error)
    return NextResponse.json({ sync_pendentes: 0 })
  }
} 