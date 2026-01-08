import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPluggyClient } from '@/lib/pluggy-client'

/**
 * POST /api/fp/pluggy/webhook
 * Endpoint para receber webhooks do Pluggy
 * Ref: https://docs.pluggy.ai/reference/webhooks-create
 * 
 * Eventos suportados:
 * - item/created
 * - item/updated (sync concluído)
 * - item/deleted
 * - item/error
 * - transactions/created
 * - transactions/updated
 * - transactions/deleted
 */
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const payload = await request.json()
    
    console.log('🔔 Webhook recebido do Pluggy:', {
      event: payload.event,
      itemId: payload.data?.id,
      timestamp: new Date().toISOString()
    })

    // Salvar webhook no log para auditoria
    const { error: logError } = await supabase
      .from('fp_pluggy_webhooks')
      .insert({
        event_type: payload.event,
        item_id: payload.data?.id,
        payload: payload,
        processed: false
      })

    if (logError) {
      console.error('❌ Erro ao salvar log de webhook:', logError)
    }

    // Processar evento baseado no tipo
    switch (payload.event) {
      case 'item/updated':
        await handleItemUpdated(payload.data, supabase)
        break
      
      case 'transactions/created':
      case 'transactions/updated':
        await handleTransactionsChanged(payload.data, supabase)
        break
      
      case 'item/error':
        await handleItemError(payload.data, supabase)
        break
      
      default:
        console.log(`ℹ️ Evento ${payload.event} não requer processamento`)
    }

    // Marcar webhook como processado
    await supabase
      .from('fp_pluggy_webhooks')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('item_id', payload.data?.id)
      .eq('event_type', payload.event)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    })
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error)

    // Salvar erro no log
    try {
      const payload = await request.json().catch(() => ({}))
      await supabase
        .from('fp_pluggy_webhooks')
        .update({ 
          error: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('item_id', payload.data?.id)
        .eq('event_type', payload.event)
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(1)
    } catch (e) {
      // Ignorar erros ao salvar log de erro
    }

    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * Handler para evento item/updated (sync concluído)
 */
async function handleItemUpdated(itemData: any, supabase: any) {
  console.log('✅ Item atualizado:', itemData.id)
  
  // Buscar o item no nosso banco
  const { data: pluggyItem } = await supabase
    .from('fp_pluggy_items')
    .select('usuario_cpf')
    .eq('item_id', itemData.id)
    .single()

  if (!pluggyItem) {
    console.log('⚠️ Item não encontrado no banco local')
    return
  }

  const pluggyClient = getPluggyClient()

  // Buscar contas do item
  const accounts = await pluggyClient.getAccounts(itemData.id)
  
  console.log(`📦 ${accounts.results?.length || 0} contas encontradas`)

  // Sincronizar transações de cada conta
  for (const account of accounts.results || []) {
    await syncAccountTransactions(account, pluggyItem.usuario_cpf, supabase, pluggyClient)
  }

  // Atualizar última sincronização
  await supabase
    .from('fp_pluggy_items')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('item_id', itemData.id)

  console.log('✅ Sincronização concluída via webhook')
}

/**
 * Handler para eventos de transações
 */
async function handleTransactionsChanged(data: any, supabase: any) {
  console.log('💰 Transações alteradas:', data)
  
  // Se tiver itemId no payload, forçar resync
  if (data.itemId) {
    const { data: pluggyItem } = await supabase
      .from('fp_pluggy_items')
      .select('usuario_cpf')
      .eq('item_id', data.itemId)
      .single()

    if (pluggyItem) {
      const pluggyClient = getPluggyClient()
      const accounts = await pluggyClient.getAccounts(data.itemId)
      
      for (const account of accounts.results || []) {
        await syncAccountTransactions(account, pluggyItem.usuario_cpf, supabase, pluggyClient)
      }
    }
  }
}

/**
 * Handler para erro no item
 */
async function handleItemError(itemData: any, supabase: any) {
  console.error('❌ Erro no item:', itemData)
  
  // Atualizar status do item
  await supabase
    .from('fp_pluggy_items')
    .update({ 
      status: 'ERROR',
      error_message: itemData.error?.message || 'Erro desconhecido'
    })
    .eq('item_id', itemData.id)
}

/**
 * Sincronizar transações de uma conta
 */
async function syncAccountTransactions(
  account: any, 
  usuario_cpf: string, 
  supabase: any, 
  pluggyClient: any
) {
  console.log(`💳 Sincronizando conta: ${account.name}`)

  // Verificar se a conta já existe
  let { data: contaExistente } = await supabase
    .from('fp_contas')
    .select('id')
    .eq('usuario_cpf', usuario_cpf)
    .eq('pluggy_account_id', account.id)
    .single()

  let contaId: string

  if (!contaExistente) {
    // Criar conta
    const { data: novaConta } = await supabase
      .from('fp_contas')
      .insert({
        usuario_cpf,
        nome: account.name,
        banco: account.institution?.name || 'Banco',
        tipo: account.type === 'CHECKING' ? 'corrente' : 'poupanca',
        saldo_inicial: 0,
        saldo_atual: account.balance || 0,
        cor: '#3B82F6',
        ativa: true,
        pluggy_account_id: account.id
      })
      .select('id')
      .single()

    contaId = novaConta.id
  } else {
    contaId = contaExistente.id

    // Atualizar saldo
    await supabase
      .from('fp_contas')
      .update({ saldo_atual: account.balance || 0 })
      .eq('id', contaId)
  }

  // Buscar transações dos últimos 90 dias
  const from = new Date()
  from.setDate(from.getDate() - 90)

  const transactions = await pluggyClient.getTransactions(
    account.id,
    from.toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  )

  console.log(`💸 ${transactions.results?.length || 0} transações encontradas`)

  // Importar transações
  for (const transaction of transactions.results || []) {
    // Verificar se já existe
    const { data: existente } = await supabase
      .from('fp_transacoes')
      .select('id')
      .eq('pluggy_transaction_id', transaction.id)
      .single()

    if (existente) continue // Já existe

    // Criar transação
    await supabase
      .from('fp_transacoes')
      .insert({
        usuario_cpf,
        conta_id: contaId,
        tipo: transaction.amount >= 0 ? 'receita' : 'despesa',
        descricao: transaction.description,
        valor: Math.abs(transaction.amount),
        data: transaction.date,
        categoria_id: null, // Será categorizada depois
        pluggy_transaction_id: transaction.id,
        pluggy_category_id: transaction.category?.id,
        pluggy_category_name: transaction.category?.description
      })
  }

  console.log(`✅ Conta ${account.name} sincronizada`)
}
