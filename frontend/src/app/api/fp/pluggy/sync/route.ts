import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createPluggyClient } from '@/lib/pluggy/client'
import { categorizarTransacao } from '@/lib/fp/categorizacao'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const body = await request.json()
    const { pluggy_item_id } = body

    if (!pluggy_item_id) {
      return NextResponse.json({ error: 'pluggy_item_id é obrigatório' }, { status: 400 })
    }

    // Buscar conexão Pluggy no banco
    const { data: pluggyItem } = await supabase
      .from('fp_pluggy_items')
      .select('*')
      .eq('pluggy_item_id', pluggy_item_id)
      .single()

    if (!pluggyItem) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
    }

    // Atualizar status para UPDATING
    await supabase
      .from('fp_pluggy_items')
      .update({ status: 'UPDATING' })
      .eq('pluggy_item_id', pluggy_item_id)

    // Sincronizar via Pluggy
    const pluggy = createPluggyClient()

    // Atualizar item (forçar refresh)
    await pluggy.updateItem(pluggy_item_id)

    // Buscar transações dos últimos 90 dias
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 90)
    const dataFim = new Date()

    const transactions = await pluggy.getAllTransactions(pluggy_item_id, {
      from: dataInicio.toISOString().split('T')[0],
      to: dataFim.toISOString().split('T')[0]
    })

    // Buscar categorias e regras do usuário
    const { data: categorias } = await supabase
      .from('fp_categorias')
      .select('*')
      .eq('usuario_cpf', pluggyItem.usuario_cpf)
      .eq('ativa', true)

    const { data: regras } = await supabase
      .from('fp_regras_categoria')
      .select('*, categoria:fp_categorias(*)')
      .eq('usuario_cpf', pluggyItem.usuario_cpf)
      .eq('ativa', true)
      .order('prioridade', { ascending: false })

    // Processar transações
    const transacoesParaInserir = []
    let duplicadas = 0

    for (const t of transactions) {
      // Converter tipo Pluggy para nosso tipo
      const tipo = t.amount >= 0 ? 'receita' : 'despesa'
      const valor = Math.abs(t.amount)

      // Gerar hash único
      const hash = `pluggy_${t.id}_${t.date}_${valor}_${t.description}`.replace(/\s/g, '').toLowerCase()

      // Verificar duplicata
      const { data: existente } = await supabase
        .from('fp_transacoes')
        .select('id')
        .eq('hash_original', hash)
        .single()

      if (existente) {
        duplicadas++
        continue
      }

      // Categorizar automaticamente
      const categoriaId = categorizarTransacao(
        t.description,
        tipo,
        regras || [],
        categorias || []
      )

      transacoesParaInserir.push({
        usuario_cpf: pluggyItem.usuario_cpf,
        conta_id: pluggyItem.conta_id,
        categoria_id: categoriaId,
        tipo,
        descricao: t.description,
        valor,
        data: t.date,
        status: 'confirmada',
        origem_importacao: 'pluggy',
        hash_original: hash
      })
    }

    // Inserir transações
    let inseridas = 0
    if (transacoesParaInserir.length > 0) {
      const { data, error } = await supabase
        .from('fp_transacoes')
        .insert(transacoesParaInserir)
        .select()

      if (error) throw error
      inseridas = data?.length || 0

      // Recalcular saldo da conta
      const totalReceitas = transacoesParaInserir
        .filter(t => t.tipo === 'receita')
        .reduce((acc, t) => acc + t.valor, 0)
      
      const totalDespesas = transacoesParaInserir
        .filter(t => t.tipo === 'despesa')
        .reduce((acc, t) => acc + t.valor, 0)

      // Buscar conta
      const { data: conta } = await supabase
        .from('fp_contas')
        .select('saldo_atual')
        .eq('id', pluggyItem.conta_id)
        .single()

      if (conta) {
        const novoSaldo = parseFloat(conta.saldo_atual) + totalReceitas - totalDespesas

        await supabase
          .from('fp_contas')
          .update({ saldo_atual: novoSaldo })
          .eq('id', pluggyItem.conta_id)
      }
    }

    // Atualizar status da conexão
    await supabase
      .from('fp_pluggy_items')
      .update({
        status: 'ACTIVE',
        ultima_sincronizacao: new Date().toISOString(),
        erro_mensagem: null
      })
      .eq('pluggy_item_id', pluggy_item_id)

    // Log de sincronização
    await supabase
      .from('fp_pluggy_sync_log')
      .insert([{
        pluggy_item_id,
        status: 'SUCCESS',
        transacoes_importadas: inseridas,
        transacoes_duplicadas: duplicadas
      }])

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      data: {
        total: transactions.length,
        inseridas,
        duplicadas,
        categorizadasAuto: transacoesParaInserir.filter(t => t.categoria_id).length
      }
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar:', error)

    // Atualizar status de erro
    const { pluggy_item_id } = await request.json()
    if (pluggy_item_id) {
      const supabase = createServerClient()
      await supabase
        .from('fp_pluggy_items')
        .update({
          status: 'LOGIN_ERROR',
          erro_mensagem: error.message
        })
        .eq('pluggy_item_id', pluggy_item_id)

      // Log de erro
      await supabase
        .from('fp_pluggy_sync_log')
        .insert([{
          pluggy_item_id,
          status: 'ERROR',
          erro_mensagem: error.message
        }])
    }

    return NextResponse.json({ 
      error: error.message || 'Erro ao sincronizar' 
    }, { status: 500 })
  }
}
