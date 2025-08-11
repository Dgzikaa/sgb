import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Registrar nova transação de desconto
export async function POST(request: NextRequest) {
  try {
    const { 
      membro_id, 
      tipo, 
      valor_original, 
      valor_desconto, 
      valor_final, 
      descricao,
      metadados = {}
    } = await request.json()

    // Validações básicas
    if (!membro_id || !tipo || !valor_original) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: membro_id, tipo e valor_original' },
        { status: 400 }
      )
    }

    // Verificar se o membro existe e está ativo
    const { data: membro, error: membroError } = await supabase
      .from('fidelidade_membros')
      .select('id, nome, status, bar_id')
      .eq('id', membro_id)
      .eq('status', 'ativo')
      .single()

    if (membroError || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Registrar a transação
    const { data: transacao, error: transacaoError } = await supabase
      .from('fidelidade_transacoes')
      .insert({
        membro_id,
        tipo,
        valor_original: parseFloat(valor_original.toString()),
        valor_desconto: parseFloat((valor_desconto || 0).toString()),
        valor_final: parseFloat((valor_final || valor_original).toString()),
        descricao,
        metadados,
        data_transacao: new Date().toISOString(),
        status: 'concluida',
        bar_id: membro.bar_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transacaoError) {
      console.error('🚨 Erro ao registrar transação:', transacaoError)
      return NextResponse.json(
        { error: 'Erro ao registrar transação' },
        { status: 500 }
      )
    }

    // Atualizar saldo do membro se necessário
    if (tipo === 'desconto' && valor_desconto > 0) {
      // Buscar saldo atual
      const { data: saldoAtual } = await supabase
        .from('fidelidade_saldos')
        .select('saldo_atual')
        .eq('membro_id', membro_id)
        .single()

      // Se não tem saldo, criar registro
      if (!saldoAtual) {
        await supabase
          .from('fidelidade_saldos')
          .insert({
            membro_id,
            saldo_atual: 0,
            ultimo_credito: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
      }

      // Opcional: Adicionar pontos por usar o desconto
      const pontosGanhos = Math.floor(valor_final / 10) // 1 ponto a cada R$ 10
      
      if (pontosGanhos > 0) {
        await supabase
          .from('fidelidade_saldos')
          .update({
            saldo_atual: (saldoAtual?.saldo_atual || 0) + pontosGanhos,
            ultimo_credito: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('membro_id', membro_id)

        // Registrar check-in automático
        await supabase
          .from('fidelidade_checkins')
          .insert({
            membro_id,
            pontos_ganhos: pontosGanhos,
            data_checkin: new Date().toISOString(),
            tipo: 'compra_com_desconto',
            valor_compra: valor_final,
            bar_id: membro.bar_id
          })
      }
    }

    return NextResponse.json({
      success: true,
      transacao: {
        id: transacao.id,
        tipo: transacao.tipo,
        valor_original: transacao.valor_original,
        valor_desconto: transacao.valor_desconto,
        valor_final: transacao.valor_final,
        descricao: transacao.descricao,
        data_transacao: transacao.data_transacao,
        status: transacao.status
      },
      membro: {
        nome: membro.nome
      },
      message: 'Transação registrada com sucesso'
    })

  } catch (error) {
    console.error('🚨 Erro ao processar transação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar transações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membro_id = searchParams.get('membro_id')
    const bar_id = searchParams.get('bar_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('fidelidade_transacoes')
      .select(`
        id,
        tipo,
        valor_original,
        valor_desconto,
        valor_final,
        descricao,
        data_transacao,
        status,
        metadados,
        fidelidade_membros!inner(nome, email)
      `)
      .order('data_transacao', { ascending: false })
      .range(offset, offset + limit - 1)

    if (membro_id) {
      query = query.eq('membro_id', membro_id)
    }

    if (bar_id) {
      query = query.eq('bar_id', parseInt(bar_id))
    }

    const { data: transacoes, error, count } = await query

    if (error) {
      console.error('🚨 Erro ao buscar transações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar transações' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transacoes: transacoes || [],
      pagination: {
        offset,
        limit,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('🚨 Erro geral ao buscar transações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
