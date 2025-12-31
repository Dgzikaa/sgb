import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser } from '@/middleware/auth'

/**
 * API para executar auditoria manualmente
 * POST /api/auditoria/executar
 * Body: { tipo: 'semanal' | 'mensal' }
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tipo } = body

    if (!tipo || !['semanal', 'mensal'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use "semanal" ou "mensal".' },
        { status: 400 }
      )
    }

    const supabase = await getAdminClient()

    let resultado: string = ''
    let mudancas: any[] = []

    if (tipo === 'semanal') {
      // Executar auditoria semanal
      const { data, error } = await supabase.rpc('auditoria_semanal_retroativa', {
        p_bar_id: 3
      })

      if (error) {
        console.error('Erro ao executar auditoria semanal:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      mudancas = data || []
      
      if (mudancas.length === 0) {
        resultado = '✅ Auditoria semanal concluída. Nenhuma alteração detectada nos últimos 7 dias.'
      } else {
        resultado = `🔍 Auditoria semanal concluída!\n\n`
        resultado += `📊 Resumo:\n`
        resultado += `- Dias com alterações: ${mudancas.length}\n`
        resultado += `- Total de mudanças: ${mudancas.reduce((acc, m) => acc + m.total_mudancas, 0)}\n`
        resultado += `- Diferença total: R$ ${mudancas.reduce((acc, m) => acc + parseFloat(m.valor_total_diferenca || 0), 0).toFixed(2)}\n\n`
        resultado += `📅 Detalhes por dia:\n`
        
        mudancas.forEach((m) => {
          resultado += `  ${m.data_evento}: ${m.total_mudancas} mudança(s), R$ ${parseFloat(m.valor_total_diferenca || 0).toFixed(2)}\n`
        })
      }
    } else {
      // Executar auditoria mensal
      const now = new Date()
      const ano = now.getFullYear()
      const mes = now.getMonth() + 1

      const { data, error } = await supabase.rpc('auditoria_mensal_retroativa', {
        p_ano: ano,
        p_mes: mes,
        p_bar_id: 3
      })

      if (error) {
        console.error('Erro ao executar auditoria mensal:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      mudancas = data || []
      
      if (mudancas.length === 0) {
        resultado = `✅ Auditoria mensal concluída (${mes.toString().padStart(2, '0')}/${ano}). Nenhuma alteração detectada.`
      } else {
        resultado = `🔍 Auditoria mensal concluída (${mes.toString().padStart(2, '0')}/${ano})!\n\n`
        resultado += `📊 Resumo:\n`
        resultado += `- Dias com alterações: ${mudancas.length}\n`
        resultado += `- Total de mudanças: ${mudancas.reduce((acc, m) => acc + m.total_mudancas, 0)}\n`
        resultado += `- Diferença total: R$ ${mudancas.reduce((acc, m) => acc + parseFloat(m.valor_total_diferenca || 0), 0).toFixed(2)}\n\n`
        resultado += `📅 Detalhes por dia:\n`
        
        mudancas.forEach((m) => {
          resultado += `  ${m.data_evento}: ${m.total_mudancas} mudança(s), R$ ${parseFloat(m.valor_total_diferenca || 0).toFixed(2)}\n`
        })
      }
    }

    return NextResponse.json({
      success: true,
      tipo,
      resultado,
      mudancas
    })

  } catch (error: any) {
    console.error('Erro na API de execução de auditoria:', error)
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
