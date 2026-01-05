import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPluggyClient } from '@/lib/pluggy-client'

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

// POST - Sincronizar transações de um item
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
    const { itemId, from, to } = body

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID é obrigatório' }, { status: 400 })
    }

    // Verificar que o item pertence ao usuário
    const { data: item } = await supabase
      .from('fp_pluggy_items')
      .select('*')
      .eq('id', itemId)
      .eq('usuario_cpf', cpf)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const pluggyClient = getPluggyClient()

    // Se forceUpdate = true, forçar atualização do item no Pluggy usando PATCH
    // Ref: https://docs.pluggy.ai/reference/items-update
    if (body.forceUpdate) {
      console.log('🔄 Forçando atualização do item no Pluggy...')
      try {
        await pluggyClient.updateItem(item.pluggy_item_id)
        console.log('✅ Item atualizado com sucesso no Pluggy')
      } catch (updateError: any) {
        console.warn('⚠️ Erro ao forçar update (pode ser normal):', updateError.message)
      }
    }

    // Buscar contas do item
    const accounts = await pluggyClient.getAccounts(item.pluggy_item_id)

    let transacoesImportadas = 0
    let contasCriadas = 0

    // Para cada conta, criar no sistema se não existir e importar transações
    for (const account of accounts.results || []) {
      // Verificar se a conta já existe
      let { data: contaExistente } = await supabase
        .from('fp_contas')
        .select('id, saldo_atual')
        .eq('usuario_cpf', cpf)
        .eq('pluggy_account_id', account.id)
        .single()

      // Criar conta se não existir
      if (!contaExistente) {
        const { data: novaConta } = await supabase
          .from('fp_contas')
          .insert([{
            usuario_cpf: cpf,
            nome: account.name || `${item.connector_name} - ${account.type}`,
            banco: item.connector_name,
            tipo: account.type === 'CREDIT' ? 'cartao' : 'corrente',
            saldo_inicial: account.balance || 0,
            saldo_atual: account.balance || 0,
            cor: '#3B82F6',
            ativa: true,
            pluggy_account_id: account.id,
          }])
          .select()
          .single()

        contaExistente = novaConta
        contasCriadas++
      }

      // Buscar transações
      const transactions = await pluggyClient.getTransactions(account.id, from, to)

      // Importar transações
      for (const transaction of transactions.results || []) {
        // Verificar se transação já existe
        const { data: existente } = await supabase
          .from('fp_transacoes')
          .select('id')
          .eq('pluggy_transaction_id', transaction.id)
          .single()

        if (existente) continue // Pular se já existe

        // Determinar tipo
        const tipo = transaction.amount > 0 ? 'receita' : 'despesa'

        // Tentar categorizar automaticamente
        let categoriaId = null
        let categoriaOrigem: string | null = null

        // Buscar categoria template baseado na descrição
        const { data: categoria } = await supabase
          .from('fp_categorias_template')
          .select('id')
          .eq('tipo', tipo)
          .ilike('nome', `%${transaction.category || 'Outros'}%`)
          .limit(1)
          .single()

        if (categoria) {
          categoriaId = categoria.id
          categoriaOrigem = 'template'
        }

        // Criar transação
        const transacaoData: any = {
          usuario_cpf: cpf,
          descricao: transaction.description || 'Transação importada',
          valor: Math.abs(transaction.amount),
          tipo,
          data: transaction.date.split('T')[0],
          conta_id: contaExistente!.id,
          pluggy_transaction_id: transaction.id,
          categorizada: !!categoriaId,
        }

        if (categoriaId && categoriaOrigem === 'template') {
          transacaoData.categoria_template_id = categoriaId
        }

        await supabase
          .from('fp_transacoes')
          .insert([transacaoData])

        // Atualizar saldo da conta
        const novoSaldo = tipo === 'receita'
          ? contaExistente!.saldo_atual + Math.abs(transaction.amount)
          : contaExistente!.saldo_atual - Math.abs(transaction.amount)

        await supabase
          .from('fp_contas')
          .update({ saldo_atual: novoSaldo })
          .eq('id', contaExistente!.id)

        contaExistente!.saldo_atual = novoSaldo
        transacoesImportadas++
      }
    }

    // Registrar sync
    await supabase
      .from('fp_pluggy_sync_log')
      .insert([{
        usuario_cpf: cpf,
        item_id: itemId,
        contas_sincronizadas: accounts.results?.length || 0,
        transacoes_importadas: transacoesImportadas,
        status: 'SUCCESS',
      }])

    return NextResponse.json({
      success: true,
      data: {
        contasCriadas,
        transacoesImportadas,
      },
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar:', error)

    // Registrar erro
    try {
      const supabase = createServerClient()
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          const cpf = await getUserCPF(supabase, user)
          const body = await request.json()
          
          await supabase
            .from('fp_pluggy_sync_log')
            .insert([{
              usuario_cpf: cpf,
              item_id: body.itemId,
              contas_sincronizadas: 0,
              transacoes_importadas: 0,
              status: 'ERROR',
              erro: error.message,
            }])
        }
      }
    } catch (e) {
      // Ignorar erro ao registrar log
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
