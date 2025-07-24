import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// ====================================================
// CUSTOS EXTRAS - CRUD COMPLETO
// ====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')
    const tipo_custo_id = searchParams.get('tipo_custo_id')
    const action = searchParams.get('action')

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    // ====================================================
    // LISTAR TIPOS DE CUSTOS EXTRAS
    // ====================================================
    if (action === 'tipos') {
      const { data: tipos, error } = await supabase
        .from('tipos_custos_extras')
        .select('*')
        .eq('bar_id', bar_id)
        .eq('ativo', true)
        .order('nome')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        tipos: tipos || []
      })
    }

    // ====================================================
    // LISTAR CUSTOS EXTRAS COM FILTROS
    // ====================================================
    
    let query = supabase
      .from('custos_extras_competencia')
      .select(`
        *,
        tipo_custo:tipos_custos_extras(id, nome, cor, icone)
      `)
      .eq('bar_id', bar_id)

    // Aplicar filtros
    if (data_inicio) {
      query = query.gte('data_competencia', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_competencia', data_fim)
    }
    if (tipo_custo_id) {
      query = query.eq('tipo_custo_id', tipo_custo_id)
    }

    const { data: custos, error } = await query.order('data_competencia', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      custos: custos || [],
      total_custos: custos?.length || 0,
      total_valor: custos?.reduce((sum: number, custo: unknown) => sum + parseFloat(custo.valor || 0), 0) || 0
    })

  } catch (error) {
    console.error('Erro ao listar custos extras:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    const body = await request.json()
    const { action } = body

    // ====================================================
    // CRIAR NOVO TIPO DE CUSTO EXTRA
    // ====================================================
    if (action === 'criar_tipo') {
      const { bar_id, nome, descricao, cor, icone } = body

      if (!bar_id || !nome) {
        return NextResponse.json({ error: 'bar_id e nome são obrigatórios' }, { status: 400 })
      }

      const { data: tipoExistente } = await supabase
        .from('tipos_custos_extras')
        .select('id')
        .eq('bar_id', bar_id)
        .eq('nome', nome)
        .single()

      if (tipoExistente) {
        return NextResponse.json({ error: 'Tipo de custo já existe' }, { status: 409 })
      }

      const { data: novoTipo, error } = await supabase
        .from('tipos_custos_extras')
        .insert({
          bar_id,
          nome,
          descricao: descricao || '',
          cor: cor || '#6366f1',
          icone: icone || '💰'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Tipo de custo criado com sucesso',
        tipo: novoTipo
      })
    }

    // ====================================================
    // CRIAR NOVO CUSTO EXTRA
    // ====================================================
    
    const { 
      bar_id, 
      tipo_custo_id, 
      data_competencia, 
      valor, 
      descricao, 
      observacoes,
      responsavel,
      documento,
      pago,
      data_pagamento,
      forma_pagamento,
      criado_por
    } = body

    if (!bar_id || !tipo_custo_id || !data_competencia || !valor) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: bar_id, tipo_custo_id, data_competencia, valor' 
      }, { status: 400 })
    }

    const { data: novoCusto, error } = await supabase
      .from('custos_extras_competencia')
      .insert({
        bar_id,
        tipo_custo_id,
        data_competencia,
        valor: parseFloat(valor),
        descricao: descricao || '',
        observacoes: observacoes || '',
        responsavel: responsavel || '',
        documento: documento || '',
        pago: pago || false,
        data_pagamento: data_pagamento || null,
        forma_pagamento: forma_pagamento || '',
        criado_por: criado_por || 'Sistema',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select(`
        *,
        tipo_custo:tipos_custos_extras(id, nome, cor, icone)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Custo extra criado com sucesso',
      custo: novoCusto
    })

  } catch (error) {
    console.error('Erro ao criar custo extra:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    const body = await request.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // ====================================================
    // MARCAR COMO PAGO/NÃO PAGO
    // ====================================================
    if (action === 'toggle_pago') {
      const { pago, data_pagamento, forma_pagamento } = body

      const { data: custoAtualizado, error } = await supabase
        .from('custos_extras_competencia')
        .update({
          pago: pago || false,
          data_pagamento: pago ? (data_pagamento || new Date().toISOString().split('T')[0]) : null,
          forma_pagamento: pago ? (forma_pagamento || '') : '',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          tipo_custo:tipos_custos_extras(id, nome, cor, icone)
        `)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Custo ${pago ? 'marcado como pago' : 'marcado como não pago'}`,
        custo: custoAtualizado
      })
    }

    // ====================================================
    // ATUALIZAR CUSTO EXTRA
    // ====================================================
    
    const { 
      tipo_custo_id, 
      data_competencia, 
      valor, 
      descricao, 
      observacoes,
      responsavel,
      documento,
      pago,
      data_pagamento,
      forma_pagamento
    } = body

    const updateData: unknown = {
      atualizado_em: new Date().toISOString()
    }

    if (tipo_custo_id !== undefined) updateData.tipo_custo_id = tipo_custo_id
    if (data_competencia !== undefined) updateData.data_competencia = data_competencia
    if (valor !== undefined) updateData.valor = parseFloat(valor)
    if (descricao !== undefined) updateData.descricao = descricao
    if (observacoes !== undefined) updateData.observacoes = observacoes
    if (responsavel !== undefined) updateData.responsavel = responsavel
    if (documento !== undefined) updateData.documento = documento
    if (pago !== undefined) updateData.pago = pago
    if (data_pagamento !== undefined) updateData.data_pagamento = data_pagamento
    if (forma_pagamento !== undefined) updateData.forma_pagamento = forma_pagamento

    const { data: custoAtualizado, error } = await supabase
      .from('custos_extras_competencia')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        tipo_custo:tipos_custos_extras(id, nome, cor, icone)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Custo extra atualizado com sucesso',
      custo: custoAtualizado
    })

  } catch (error) {
    console.error('Erro ao atualizar custo extra:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('custos_extras_competencia')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Custo extra removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar custo extra:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
} 
