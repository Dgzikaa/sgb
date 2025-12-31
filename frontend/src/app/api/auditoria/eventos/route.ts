import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser } from '@/middleware/auth'

/**
 * API para consultar auditoria de eventos
 * GET /api/auditoria/eventos?evento_id=123
 * GET /api/auditoria/eventos?data_evento=2025-12-30
 * GET /api/auditoria/eventos?campo=real_r&limit=100
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar usuário
    const authResult = await authenticateUser(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const evento_id = searchParams.get('evento_id')
    const data_evento = searchParams.get('data_evento')
    const campo = searchParams.get('campo')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = await createClient()

    // CONSULTA 1: Auditoria de um evento específico
    if (evento_id) {
      const { data, error } = await supabase.rpc('consultar_auditoria_evento', {
        p_evento_id: parseInt(evento_id)
      })

      if (error) {
        console.error('❌ Erro ao consultar auditoria do evento:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          evento_id: parseInt(evento_id),
          historico: data || [],
          total_mudancas: data?.length || 0
        }
      })
    }

    // CONSULTA 2: Auditoria por data
    if (data_evento) {
      const { data, error } = await supabase.rpc('consultar_auditoria_por_data', {
        p_data_evento: data_evento
      })

      if (error) {
        console.error('❌ Erro ao consultar auditoria por data:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      // Agrupar por evento
      const eventosMudancas = (data || []).reduce((acc: any, mudanca: any) => {
        if (!acc[mudanca.evento_id]) {
          acc[mudanca.evento_id] = {
            evento_id: mudanca.evento_id,
            nome: mudanca.nome,
            mudancas: []
          }
        }
        acc[mudanca.evento_id].mudancas.push(mudanca)
        return acc
      }, {})

      return NextResponse.json({
        success: true,
        data: {
          data_evento,
          eventos: Object.values(eventosMudancas),
          total_eventos_alterados: Object.keys(eventosMudancas).length,
          total_mudancas: data?.length || 0
        }
      })
    }

    // CONSULTA 3: Últimas mudanças gerais (com filtros opcionais)
    let query = supabase
      .from('eventos_base_auditoria')
      .select(`
        id,
        evento_id,
        data_evento,
        nome,
        campo_alterado,
        valor_anterior,
        valor_novo,
        funcao_origem,
        data_alteracao,
        metadata
      `)
      .order('data_alteracao', { ascending: false })
      .limit(limit)

    if (campo) {
      query = query.eq('campo_alterado', campo)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao consultar auditoria:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Calcular diferenças numéricas
    const mudancasComDiferenca = (data || []).map((mudanca: any) => {
      const camposNumericos = ['real_r', 'cl_real', 'te_real', 'tb_real', 't_medio', 'sympla_liquido', 'yuzer_liquido', 'c_art', 'c_prod']
      
      if (camposNumericos.includes(mudanca.campo_alterado)) {
        const anterior = parseFloat(mudanca.valor_anterior || '0')
        const novo = parseFloat(mudanca.valor_novo || '0')
        return {
          ...mudanca,
          diferenca: novo - anterior,
          percentual_mudanca: anterior > 0 ? ((novo - anterior) / anterior) * 100 : null
        }
      }

      return mudanca
    })

    return NextResponse.json({
      success: true,
      data: {
        mudancas: mudancasComDiferenca,
        total: mudancasComDiferenca.length,
        filtros: {
          campo: campo || 'todos',
          limit
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na API de auditoria:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Limpar auditoria antiga
 * DELETE /api/auditoria/eventos?dias_manter=90
 */
export async function DELETE(request: NextRequest) {
  try {
    // Autenticar usuário (só admin pode deletar)
    const authResult = await authenticateUser(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    if (authResult.user.tipo_usuario !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem limpar auditoria' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dias_manter = parseInt(searchParams.get('dias_manter') || '90')

    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('limpar_auditoria_antiga', {
      dias_manter
    })

    if (error) {
      console.error('❌ Erro ao limpar auditoria:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensagem: data
    })

  } catch (error: any) {
    console.error('❌ Erro ao limpar auditoria:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
