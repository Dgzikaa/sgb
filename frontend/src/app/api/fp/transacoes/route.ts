import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// Helper para pegar CPF do usuário autenticado
async function getUserCPF(supabase: any, user: any) {
  const { data: userData } = await supabase
    .from('usuarios_bar')
    .select('cpf')
    .eq('user_id', user.id)
    .limit(1)

  if (!userData || userData.length === 0 || !userData[0].cpf) {
    const { data: userDataByEmail } = await supabase
      .from('usuarios_bar')
      .select('cpf')
      .eq('email', user.email)
      .limit(1)
    
    if (userDataByEmail && userDataByEmail.length > 0) {
      return userDataByEmail[0].cpf.replace(/[^\d]/g, '')
    }
  }

  if (userData && userData.length > 0 && userData[0].cpf) {
    return userData[0].cpf.replace(/[^\d]/g, '')
  }

  throw new Error('CPF não encontrado')
}

// GET - Listar transações
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)

    // Query params para filtros
    const { searchParams } = new URL(request.url)
    const contaId = searchParams.get('conta_id')
    const categoriaId = searchParams.get('categoria_id')
    const tipo = searchParams.get('tipo')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    // Buscar transações
    let query = supabase
      .from('fp_transacoes')
      .select(`
        *,
        conta:fp_contas(id, nome, banco, cor),
        categoria_customizada:fp_categorias(id, nome, icone, cor, tipo),
        categoria_template:fp_categorias_template(id, nome, icone, cor, tipo)
      `)
      .eq('usuario_cpf', cpf)

    // Aplicar filtros
    if (contaId) query = query.eq('conta_id', contaId)
    if (categoriaId) {
      query = query.or(`categoria_customizada_id.eq.${categoriaId},categoria_template_id.eq.${categoriaId}`)
    }
    if (tipo) query = query.eq('tipo', tipo)
    if (dataInicio) query = query.gte('data', dataInicio)
    if (dataFim) query = query.lte('data', dataFim)

    const { data: transacoes, error } = await query.order('data', { ascending: false })

    if (error) throw error

    // Combinar categorias em um único campo
    const transacoesFormatadas = transacoes?.map((t: any) => ({
      ...t,
      categoria: t.categoria_customizada || t.categoria_template,
    }))

    return NextResponse.json({ success: true, data: transacoesFormatadas })
  } catch (error: any) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar transação
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)
    const body = await request.json()
    const { 
      descricao, 
      valor, 
      tipo, 
      data, 
      conta_id, 
      categoria_id, 
      categoria_origem,
      observacoes,
      tags 
    } = body

    if (!descricao || !valor || !tipo || !data || !conta_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Validar que a conta pertence ao usuário
    const { data: conta } = await supabase
      .from('fp_contas')
      .select('id, saldo_atual')
      .eq('id', conta_id)
      .eq('usuario_cpf', cpf)
      .single()

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    // Criar transação
    const transacaoData: any = {
      usuario_cpf: cpf,
      descricao,
      valor: parseFloat(valor),
      tipo,
      data,
      conta_id,
      observacoes,
      tags,
      categorizada: !!categoria_id,
    }

    // Adicionar categoria (customizada ou template)
    if (categoria_id && categoria_origem === 'customizada') {
      transacaoData.categoria_customizada_id = categoria_id
    } else if (categoria_id && categoria_origem === 'template') {
      transacaoData.categoria_template_id = categoria_id
    }

    const { data: transacao, error } = await supabase
      .from('fp_transacoes')
      .insert([transacaoData])
      .select()
      .single()

    if (error) throw error

    // Atualizar saldo da conta
    const novoSaldo = tipo === 'receita' 
      ? conta.saldo_atual + parseFloat(valor)
      : conta.saldo_atual - parseFloat(valor)

    await supabase
      .from('fp_contas')
      .update({ saldo_atual: novoSaldo })
      .eq('id', conta_id)

    return NextResponse.json({ success: true, data: transacao })
  } catch (error: any) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Atualizar transação
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)
    const body = await request.json()
    const { 
      id, 
      descricao, 
      valor, 
      tipo, 
      data, 
      categoria_id, 
      categoria_origem,
      observacoes,
      tags 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Buscar transação atual
    const { data: transacaoAtual } = await supabase
      .from('fp_transacoes')
      .select('*, conta:fp_contas(saldo_atual)')
      .eq('id', id)
      .eq('usuario_cpf', cpf)
      .single()

    if (!transacaoAtual) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Preparar dados de atualização
    const updateData: any = {
      descricao,
      valor: valor ? parseFloat(valor) : undefined,
      tipo,
      data,
      observacoes,
      tags,
      categorizada: !!categoria_id,
    }

    // Atualizar categoria
    if (categoria_id && categoria_origem === 'customizada') {
      updateData.categoria_customizada_id = categoria_id
      updateData.categoria_template_id = null
    } else if (categoria_id && categoria_origem === 'template') {
      updateData.categoria_template_id = categoria_id
      updateData.categoria_customizada_id = null
    }

    // Se valor ou tipo mudou, atualizar saldo
    if (valor || tipo) {
      const valorAntigo = transacaoAtual.valor
      const tipoAntigo = transacaoAtual.tipo
      const valorNovo = valor ? parseFloat(valor) : valorAntigo
      const tipoNovo = tipo || tipoAntigo

      // Reverter transação antiga
      let novoSaldo = transacaoAtual.conta.saldo_atual
      if (tipoAntigo === 'receita') {
        novoSaldo -= valorAntigo
      } else {
        novoSaldo += valorAntigo
      }

      // Aplicar transação nova
      if (tipoNovo === 'receita') {
        novoSaldo += valorNovo
      } else {
        novoSaldo -= valorNovo
      }

      await supabase
        .from('fp_contas')
        .update({ saldo_atual: novoSaldo })
        .eq('id', transacaoAtual.conta_id)
    }

    // Atualizar transação
    const { data: transacao, error } = await supabase
      .from('fp_transacoes')
      .update(updateData)
      .eq('id', id)
      .eq('usuario_cpf', cpf)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: transacao })
  } catch (error: any) {
    console.error('Erro ao atualizar transação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Excluir transação
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Buscar transação
    const { data: transacao } = await supabase
      .from('fp_transacoes')
      .select('*, conta:fp_contas(saldo_atual)')
      .eq('id', id)
      .eq('usuario_cpf', cpf)
      .single()

    if (!transacao) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Reverter no saldo da conta
    const novoSaldo = transacao.tipo === 'receita'
      ? transacao.conta.saldo_atual - transacao.valor
      : transacao.conta.saldo_atual + transacao.valor

    await supabase
      .from('fp_contas')
      .update({ saldo_atual: novoSaldo })
      .eq('id', transacao.conta_id)

    // Deletar transação
    const { error } = await supabase
      .from('fp_transacoes')
      .delete()
      .eq('id', id)
      .eq('usuario_cpf', cpf)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Transação excluída' })
  } catch (error: any) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
