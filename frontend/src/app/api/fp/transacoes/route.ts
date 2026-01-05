import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')
    const contaId = searchParams.get('conta_id')
    const categoriaId = searchParams.get('categoria_id')
    const tipo = searchParams.get('tipo')

    // Buscar CPF do usuário
    const { data: userData } = await supabase
      .from('usuarios')
      .select('cpf')
      .eq('id', session.user.id)
      .single()

    if (!userData?.cpf) {
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 })
    }

    // Construir query
    let query = supabase
      .from('fp_transacoes')
      .select(`
        *,
        conta:fp_contas(id, nome, banco),
        categoria:fp_categorias(id, nome, cor, icone)
      `)
      .eq('usuario_cpf', userData.cpf)
      .order('data', { ascending: false })

    // Filtros opcionais
    if (dataInicio) {
      query = query.gte('data', dataInicio)
    }
    if (dataFim) {
      query = query.lte('data', dataFim)
    }
    if (contaId) {
      query = query.eq('conta_id', contaId)
    }
    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data: transacoes, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: transacoes })
  } catch (error: any) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('cpf')
      .eq('id', session.user.id)
      .single()

    if (!userData?.cpf) {
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 })
    }

    const body = await request.json()
    const { conta_id, categoria_id, tipo, descricao, valor, data, observacoes, tags } = body

    if (!conta_id || !tipo || !descricao || !valor || !data) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Criar transação
    const { data: transacao, error: insertError } = await supabase
      .from('fp_transacoes')
      .insert([{
        usuario_cpf: userData.cpf,
        conta_id,
        categoria_id,
        tipo,
        descricao,
        valor: parseFloat(valor),
        data,
        observacoes,
        tags,
        status: 'confirmada'
      }])
      .select()
      .single()

    if (insertError) throw insertError

    // Atualizar saldo da conta
    const { data: conta } = await supabase
      .from('fp_contas')
      .select('saldo_atual')
      .eq('id', conta_id)
      .single()

    if (conta) {
      const novoSaldo = tipo === 'receita' 
        ? parseFloat(conta.saldo_atual) + parseFloat(valor)
        : parseFloat(conta.saldo_atual) - parseFloat(valor)

      await supabase
        .from('fp_contas')
        .update({ saldo_atual: novoSaldo })
        .eq('id', conta_id)
    }

    return NextResponse.json({ success: true, data: transacao })
  } catch (error: any) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, categoria_id, descricao, valor, data, observacoes, tags, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da transação é obrigatório' }, { status: 400 })
    }

    // Buscar transação original para recalcular saldo se necessário
    const { data: transacaoOriginal } = await supabase
      .from('fp_transacoes')
      .select('*')
      .eq('id', id)
      .single()

    // Atualizar transação
    const { data: transacao, error } = await supabase
      .from('fp_transacoes')
      .update({
        categoria_id,
        descricao,
        valor: valor ? parseFloat(valor) : undefined,
        data,
        observacoes,
        tags,
        status
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Se o valor mudou, recalcular saldo da conta
    if (transacaoOriginal && valor && parseFloat(valor) !== parseFloat(transacaoOriginal.valor)) {
      const { data: conta } = await supabase
        .from('fp_contas')
        .select('saldo_atual')
        .eq('id', transacaoOriginal.conta_id)
        .single()

      if (conta) {
        // Reverter valor antigo
        let novoSaldo = transacaoOriginal.tipo === 'receita'
          ? parseFloat(conta.saldo_atual) - parseFloat(transacaoOriginal.valor)
          : parseFloat(conta.saldo_atual) + parseFloat(transacaoOriginal.valor)

        // Aplicar novo valor
        novoSaldo = transacaoOriginal.tipo === 'receita'
          ? novoSaldo + parseFloat(valor)
          : novoSaldo - parseFloat(valor)

        await supabase
          .from('fp_contas')
          .update({ saldo_atual: novoSaldo })
          .eq('id', transacaoOriginal.conta_id)
      }
    }

    return NextResponse.json({ success: true, data: transacao })
  } catch (error: any) {
    console.error('Erro ao atualizar transação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da transação é obrigatório' }, { status: 400 })
    }

    // Buscar transação para reverter saldo
    const { data: transacao } = await supabase
      .from('fp_transacoes')
      .select('*')
      .eq('id', id)
      .single()

    if (transacao) {
      // Reverter saldo da conta
      const { data: conta } = await supabase
        .from('fp_contas')
        .select('saldo_atual')
        .eq('id', transacao.conta_id)
        .single()

      if (conta) {
        const novoSaldo = transacao.tipo === 'receita'
          ? parseFloat(conta.saldo_atual) - parseFloat(transacao.valor)
          : parseFloat(conta.saldo_atual) + parseFloat(transacao.valor)

        await supabase
          .from('fp_contas')
          .update({ saldo_atual: novoSaldo })
          .eq('id', transacao.conta_id)
      }

      // Deletar transação
      const { error } = await supabase
        .from('fp_transacoes')
        .delete()
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json({ success: true, message: 'Transação excluída com sucesso' })
  } catch (error: any) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
