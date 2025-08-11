import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Buscar todos os membros ativos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('fidelidade_membros')
      .select(`
        id,
        nome,
        email,
        telefone,
        status,
        plano,
        qr_code_token,
        data_adesao,
        proxima_cobranca,
        bar_id,
        bars!inner(id, nome)
      `)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filtrar por bar se especificado
    if (bar_id) {
      query = query.eq('bar_id', parseInt(bar_id))
    }

    const { data: membros, error, count } = await query

    if (error) {
      console.error('🚨 Erro ao buscar membros ativos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar membros ativos' },
        { status: 500 }
      )
    }

    // Buscar estatísticas dos membros
    const { data: stats } = await supabase
      .from('fidelidade_membros')
      .select('status, bar_id')
      .eq(bar_id ? 'bar_id' : 'id', bar_id ? parseInt(bar_id) : 'id')

    const estatisticas = {
      total_ativos: membros?.length || 0,
      total_geral: stats?.length || 0,
      por_status: stats?.reduce((acc: any, membro: any) => {
        acc[membro.status] = (acc[membro.status] || 0) + 1
        return acc
      }, {}) || {}
    }

    return NextResponse.json({
      success: true,
      membros: membros?.map(membro => ({
        id: membro.id,
        nome: membro.nome,
        email: membro.email,
        telefone: membro.telefone,
        status: membro.status,
        plano: membro.plano,
        qr_code_token: membro.qr_code_token,
        data_adesao: membro.data_adesao,
        proxima_cobranca: membro.proxima_cobranca,
        bar: membro.bars
      })) || [],
      estatisticas,
      pagination: {
        offset,
        limit,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('🚨 Erro geral ao buscar membros ativos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
