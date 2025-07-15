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
    
    let totalPendencias = 0

    // 1. Verificar se há backups falhando
    const { data: backupsFalhando, error: backupError } = await supabase
      .from('system_backups')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!backupError && backupsFalhando) {
      totalPendencias += backupsFalhando.length
    }

    // 2. Verificar eventos de segurança não resolvidos
    const { data: eventosSeguranca, error: secError } = await supabase
      .from('security_events')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('resolved', false)
      .gte('risk_score', 50)

    if (!secError && eventosSeguranca) {
      totalPendencias += eventosSeguranca.length
    }

    // 3. Verificar credenciais expirando (próximos 7 dias)
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('id, service, expires_at')
      .eq('bar_id', bar_id)
      .eq('active', true)
      .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!credError && credenciais) {
      totalPendencias += credenciais.length
    }

    // 4. Verificar configurações de templates não aplicadas
    const { data: templates, error: templateError } = await supabase
      .from('checklist_templates')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'draft')

    if (!templateError && templates) {
      totalPendencias += templates.length
    }

    // 5. Verificar integrações desconectadas
    const { data: integracoes, error: integError } = await supabase
      .from('api_credentials')
      .select('id, service')
      .eq('bar_id', bar_id)
      .eq('active', false)

    if (!integError && integracoes) {
      totalPendencias += integracoes.length
    }

    return NextResponse.json({
      total_configuracoes_pendentes: totalPendencias,
      detalhes: {
        backups_falhando: backupsFalhando?.length || 0,
        eventos_seguranca: eventosSeguranca?.length || 0,
        credenciais_expirando: credenciais?.length || 0,
        templates_draft: templates?.length || 0,
        integracoes_desconectadas: integracoes?.length || 0
      }
    })

  } catch (error) {
    console.error('Erro ao buscar configurações pendentes:', error)
    return NextResponse.json({ total_configuracoes_pendentes: 0 })
  }
} 