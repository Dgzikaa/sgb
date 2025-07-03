import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    const { bar_id, sync_type } = await request.json()

    console.log(`🔄 Iniciando sincronização ${sync_type} para bar_id: ${bar_id}`)

    // 1. Buscar configuração do ContaAzul
    const { data: config, error: configError } = await supabase
      .from('contaazul_config')
      .select('*')
      .eq('bar_id', bar_id)
      .single()

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        error: 'Configuração ContaAzul não encontrada'
      })
    }

    // 2. Verificar se token está válido
    if (new Date(config.expires_at) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado. Use o endpoint de refresh primeiro.'
      })
    }

    console.log('✅ Token válido, iniciando sincronização...')

    // 3. Realizar sincronização baseada no tipo
    let result: any

    switch (sync_type) {
      case 'all':
        // Sincronizar todos os dados
        const results = await Promise.all([
          syncCategories(supabase, config.access_token, bar_id),
          syncAccounts(supabase, config.access_token, bar_id),
          syncPeople(supabase, config.access_token, bar_id),
          syncProducts(supabase, config.access_token, bar_id),
          syncAccountsPayable(supabase, config.access_token, bar_id),
          syncAccountsReceivable(supabase, config.access_token, bar_id)
        ])
        
        result = {
          success: true,
          type: 'all',
          results,
          message: 'Sincronização completa realizada com sucesso'
        }
        break

      case 'categories':
        result = await syncCategories(supabase, config.access_token, bar_id)
        break

      case 'accounts':
        result = await syncAccounts(supabase, config.access_token, bar_id)
        break

      case 'people':
        result = await syncPeople(supabase, config.access_token, bar_id)
        break

      case 'products':
        result = await syncProducts(supabase, config.access_token, bar_id)
        break

      case 'bills':
      case 'accounts_payable':
        result = await syncAccountsPayable(supabase, config.access_token, bar_id)
        break

      case 'sales':
      case 'accounts_receivable':
        result = await syncAccountsReceivable(supabase, config.access_token, bar_id)
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Tipo de sincronização inválido: ${sync_type}`
        })
    }

    // 4. Atualizar timestamp da última sincronização
    await supabase
      .from('contaazul_config')
      .update({ ultima_sync: new Date().toISOString() })
      .eq('bar_id', bar_id)

    return NextResponse.json(result)

  } catch (error) {
    console.error('🔴 Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    })
  }
}

// Função para sincronizar categorias
async function syncCategories(supabase: any, accessToken: string, barId: number) {
  try {
    console.log('📊 Sincronizando categorias...')
    
    const response = await fetch('https://api-v2.contaazul.com/v1/categoria/busca', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro API ContaAzul Categories:', response.status, errorText)
      throw new Error(`Erro API ContaAzul Categories: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('📊 Resposta categorias:', data)
    
    const categories = data.itens || []
    console.log(`📊 ${categories.length} categorias encontradas`)

    // Salvar categorias no banco
    let categoriasInseridas = 0
    
    for (const category of categories) {
      const { error } = await supabase.from('contaazul_categorias').upsert({
        bar_id: barId,
        contaazul_id: category.id,
        nome: category.nome,
        tipo: category.tipo, // RECEITA ou DESPESA
        categoria_pai: category.categoria_pai,
        entrada_dre: category.entrada_dre,
        considera_custo_dre: category.considera_custo_dre,
        sincronizado_em: new Date().toISOString()
      }, { 
        onConflict: 'bar_id,contaazul_id'
      })
      
      if (!error) {
        categoriasInseridas++
      }
    }

    return {
      type: 'categories',
      success: true,
      count: categories.length,
      inserted: categoriasInseridas,
      message: `${categoriasInseridas} categorias sincronizadas`
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar categorias:', error)
    return {
      type: 'categories',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para sincronizar contas financeiras
async function syncAccounts(supabase: any, accessToken: string, barId: number) {
  try {
    console.log('🏦 Sincronizando contas financeiras...')
    
    const response = await fetch('https://api-v2.contaazul.com/v1/conta-financeira', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro API ContaAzul Accounts:', response.status, errorText)
      throw new Error(`Erro API ContaAzul Accounts: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('🏦 Resposta contas:', data)
    
    const accounts = data.itens || []
    console.log(`🏦 ${accounts.length} contas encontradas`)

    // Salvar contas no banco
    let contasInseridas = 0
    
    for (const account of accounts) {
      const { error } = await supabase.from('contaazul_contas').upsert({
        bar_id: barId,
        contaazul_id: account.id,
        nome: account.nome,
        banco: account.banco,
        codigo_banco: account.codigo_banco,
        tipo: account.tipo, // CONTA_CORRENTE, CAIXINHA, INVESTIMENTO
        ativo: account.ativo,
        conta_padrao: account.conta_padrao,
        agencia: account.agencia,
        numero: account.numero,
        sincronizado_em: new Date().toISOString()
      }, { 
        onConflict: 'bar_id,contaazul_id'
      })
      
      if (!error) {
        contasInseridas++
      }
    }

    return {
      type: 'accounts',
      success: true,
      count: accounts.length,
      inserted: contasInseridas,
      message: `${contasInseridas} contas sincronizadas`
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar contas:', error)
    return {
      type: 'accounts',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para sincronizar pessoas (fornecedores/clientes)
async function syncPeople(supabase: any, accessToken: string, barId: number) {
  try {
    console.log('👥 Sincronizando pessoas...')
    
    const response = await fetch('https://api-v2.contaazul.com/v1/pessoa', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro API ContaAzul People:', response.status, errorText)
      throw new Error(`Erro API ContaAzul People: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('👥 Resposta pessoas:', data)
    
    const people = data.itens || []
    console.log(`👥 ${people.length} pessoas encontradas`)

    // Salvar pessoas no banco
    let pessoasInseridas = 0
    
    for (const person of people) {
      const { error } = await supabase.from('contaazul_pessoas').upsert({
        bar_id: barId,
        contaazul_id: person.id,
        nome: person.nome,
        email: person.email,
        telefone: person.telefone,
        cpf_cnpj: person.cpf_cnpj,
        tipo: person.tipo, // CLIENTE, FORNECEDOR
        ativo: person.ativo,
        endereco: person.endereco,
        cidade: person.cidade,
        estado: person.estado,
        cep: person.cep,
        sincronizado_em: new Date().toISOString()
      }, { 
        onConflict: 'bar_id,contaazul_id'
      })
      
      if (!error) {
        pessoasInseridas++
      }
    }

    return {
      type: 'people',
      success: true,
      count: people.length,
      inserted: pessoasInseridas,
      message: `${pessoasInseridas} pessoas sincronizadas`
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar pessoas:', error)
    return {
      type: 'people',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para sincronizar produtos
async function syncProducts(supabase: any, accessToken: string, barId: number) {
  try {
    console.log('📦 Sincronizando produtos...')
    
    const params = new URLSearchParams({
      situacao: 'ATIVO'
    })
    
    const response = await fetch(`https://api-v2.contaazul.com/v1/produto/busca?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro API ContaAzul Products:', response.status, errorText)
      throw new Error(`Erro API ContaAzul Products: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('📦 Resposta completa da API:', data)
    
    const products = data.itens || []
    
    console.log(`📦 ${products.length || 0} produtos encontrados`)
    if (products.length > 0) {
      console.log('📦 Estrutura do primeiro produto:', products[0])
    }

    // Salvar produtos no banco de dados
    let produtosInseridos = 0
    
    for (const product of products) {
      const { error } = await supabase.from('produtos_contaazul').upsert({
        bar_id: barId,
        contaazul_id: product.id,
        nome: product.nome,
        preco: product.valor_venda || 0,
        categoria: product.codigo_sku || 'Sem categoria',
        descricao: `Tipo: ${product.tipo} | SKU: ${product.codigo_sku || 'N/A'} | Estoque: ${product.estoque || 0}`,
        ativo: product.status === 'ATIVO',
        sincronizado_em: new Date().toISOString()
      }, { 
        onConflict: 'bar_id,contaazul_id',
        count: 'exact'
      })
      
      if (!error) {
        produtosInseridos++
      }
    }

    return {
      type: 'products',
      success: true,
      count: products.length || 0,
      inserted: produtosInseridos,
      message: `${produtosInseridos} produtos sincronizados (${products.length} processados)`
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error)
    return {
      type: 'products',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para sincronizar contas a pagar
async function syncAccountsPayable(supabase: any, accessToken: string, barId: number) {
  try {
    console.log('💳 Sincronizando contas a pagar...')
    
    const dataInicio = '2025-01-31'
    const dataFim = new Date().toISOString().split('T')[0]
    
    const response = await fetch('https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataInicio,
        dataFim,
        situacao: 'PENDENTE'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro API ContaAzul Bills:', response.status, errorText)
      throw new Error(`Erro API ContaAzul Bills: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('💳 Resposta completa da API:', data)
    
    let bills = []
    if (Array.isArray(data)) {
      bills = data
    } else if (data.data && Array.isArray(data.data)) {
      bills = data.data
    } else if (data.content && Array.isArray(data.content)) {
      bills = data.content
    } else if (data.contasAPagar && Array.isArray(data.contasAPagar)) {
      bills = data.contasAPagar
    }
    
    console.log(`💳 ${bills.length || 0} contas a pagar encontradas`)

    let contasInseridas = 0
    
    for (const bill of bills) {
      const { error } = await supabase.from('contas_pagar_contaazul').upsert({
        bar_id: barId,
        contaazul_id: bill.id || bill.codigo,
        fornecedor_nome: bill.pessoa?.nome || bill.fornecedor || 'Fornecedor não informado',
        descricao: bill.descricao || bill.observacoes || '',
        valor: bill.valor || bill.valorOriginal || 0,
        vencimento: bill.dataVencimento || bill.vencimento,
        status: bill.status || bill.situacao,
        categoria: bill.categoria?.nome || bill.categoria || 'Sem categoria',
        observacoes: bill.observacoes || bill.descricao || '',
        sincronizado_em: new Date().toISOString()
      }, { 
        onConflict: 'bar_id,contaazul_id'
      })
      
      if (!error) {
        contasInseridas++
      }
    }

    return {
      type: 'accounts_payable',
      success: true,
      count: bills.length || 0,
      inserted: contasInseridas,
      message: `${contasInseridas} contas a pagar sincronizadas (${bills.length} processadas)`
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar contas a pagar:', error)
    return {
      type: 'accounts_payable',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para sincronizar contas a receber
async function syncAccountsReceivable(supabase: any, accessToken: string, barId: number) {
  try {
    console.log('💰 Sincronizando contas a receber...')
    
    const dataInicio = '2025-01-31'
    const dataFim = new Date().toISOString().split('T')[0]
    
    const params = new URLSearchParams({
      dataInicio,
      dataFim
    })
    
    console.log(`💰 Buscando vendas de ${dataInicio} até ${dataFim}`)
    
    const response = await fetch(`https://api-v2.contaazul.com/v1/venda/busca?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro API ContaAzul Sales:', response.status, errorText)
      throw new Error(`Erro API ContaAzul Sales: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('💰 Resposta completa da API:', data)
    
    const sales = data.itens || []
    
    console.log(`💰 ${sales.length || 0} vendas encontradas`)

    let vendasInseridas = 0
    
    for (const sale of sales) {
      const { error } = await supabase.from('vendas_contaazul').upsert({
        bar_id: barId,
        contaazul_id: sale.id,
        cliente_nome: sale.cliente?.nome || 'Cliente não informado',
        numero_venda: sale.numero,
        valor_total: sale.total || 0,
        data_venda: sale.data,
        status: sale.situacao?.status || 'N/A',
        forma_pagamento: sale.condicao_pagamento ? 'À prazo' : 'À vista',
        observacoes: `Tipo: ${sale.tipo} | Email: ${sale.cliente?.email || 'N/A'}`,
        sincronizado_em: new Date().toISOString()
      }, { 
        onConflict: 'bar_id,contaazul_id'
      })
      
      if (!error) {
        vendasInseridas++
      }
    }

    return {
      type: 'accounts_receivable',
      success: true,
      count: sales.length || 0,
      inserted: vendasInseridas,
      message: `${vendasInseridas} vendas sincronizadas (${sales.length} processadas)`
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar contas a receber:', error)
    return {
      type: 'accounts_receivable',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
} 
