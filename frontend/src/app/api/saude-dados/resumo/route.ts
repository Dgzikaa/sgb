import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await getAdminClient()

    // Alertas críticos não resolvidos
    const { count: alertasCriticos } = await supabase
      .from('sistema_alertas')
      .select('*', { count: 'exact', head: true })
      .eq('resolvido', false)
      .in('severidade', ['error', 'critical'])

    // Total de alertas não resolvidos
    const { count: alertasTotal } = await supabase
      .from('sistema_alertas')
      .select('*', { count: 'exact', head: true })
      .eq('resolvido', false)

    // Validações dos últimos 7 dias
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    const { data: validacoes } = await supabase
      .from('validacoes_cruzadas')
      .select('status')
      .gte('data_referencia', seteDiasAtras.toISOString().split('T')[0])

    const validacoesOk = validacoes?.filter(v => v.status === 'OK').length || 0
    const validacoesTotal = validacoes?.length || 0

    // Syncs nas últimas 24h
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    const { data: syncs } = await supabase
      .from('nibo_logs_sincronizacao')
      .select('status')
      .gte('data_inicio', ontem.toISOString())

    const syncsOk = syncs?.filter(s => s.status !== 'erro').length || 0
    const syncsTotal = syncs?.length || 0

    // Dias bloqueados
    const { count: diasBloqueados } = await supabase
      .from('dados_bloqueados')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: {
        alertasCriticos: alertasCriticos || 0,
        alertasTotal: alertasTotal || 0,
        validacoesOk,
        validacoesTotal,
        syncsOk,
        syncsTotal,
        diasBloqueados: diasBloqueados || 0
      }
    })
  } catch (error: any) {
    console.error('Erro na API de resumo:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
