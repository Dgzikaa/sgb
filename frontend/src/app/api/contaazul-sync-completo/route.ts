import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

const CONTAAZUL_API_URL = 'https://api-v2.contaazul.com'

interface SyncResults {
  categorias: number
  contas_financeiras: number
  pessoas: number
  contas_receber: number
  contas_pagar: number
  errors: string[]
  total_time: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { bar_id } = await request.json()

    console.log('ðŸ”„ Iniciando sincronizaÃ§Ã£o COMPLETA para bar_id:', bar_id)

    // 1. Buscar configuraÃ§Ã£o e verificar token
    const { data: config, error: configError } = await supabase
      .from('contaazul_config')
      .select('*')
      .eq('bar_id', bar_id)
      .single()

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        error: 'ConfiguraÃ§Ã£o ContaAzul nÃ£o encontrada'
      })
    }

    // 2. Verificar se token estÃ¡ vÃ¡lido
    if (new Date(config.expires_at) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado. Use o endpoint de refresh primeiro.'
      })
    }

    const headers = {
      'Authorization': `Bearer ${config.access_token}`,
      'Accept': 'application/json'
    }

    const results: SyncResults = {
      categorias: 0,
      contas_financeiras: 0,
      pessoas: 0,
      contas_receber: 0,
      contas_pagar: 0,
      errors: [],
      total_time: ''
    }

    // 3. Sincronizar Categorias (72 centros de custo)
    try {
      console.log('ðŸ“‹ Sincronizando categorias...')
      const categoriasResponse = await fetch(`${CONTAAZUL_API_URL}/v1/categorias`, { headers })
      
      if (categoriasResponse.ok) {
        const categorias = await categoriasResponse.json()
        
        for (const categoria of categorias) {
          await supabase
            .from('contaazul_categorias')
            .upsert({
              id: categoria.id,
              bar_id: bar_id,
              nome: categoria.nome,
              descricao: categoria.descricao,
              ativo: categoria.ativo !== false,
              data_criacao: categoria.data_criacao,
              data_alteracao: categoria.data_alteracao,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
        
        results.categorias = categorias.length
        console.log(`âœ… ${results.categorias} categorias sincronizadas`)
      } else {
        results.errors.push(`Categorias: ${categoriasResponse.status}`)
      }
    } catch (error) {
      results.errors.push('Erro ao sincronizar categorias')
      console.error('âŒ Erro categorias:', error)
    }

    // 4. Sincronizar Contas Financeiras (6 contas bancÃ¡rias)
    try {
      console.log('ðŸ¦ Sincronizando contas financeiras...')
      const contasResponse = await fetch(`${CONTAAZUL_API_URL}/v1/conta-financeira`, { headers })
      
      if (contasResponse.ok) {
        const contas = await contasResponse.json()
        
        for (const conta of contas) {
          await supabase
            .from('contaazul_contas_financeiras')
            .upsert({
              id: conta.id,
              bar_id: bar_id,
              nome: conta.nome,
              tipo: conta.tipo,
              banco: conta.banco,
              agencia: conta.agencia,
              conta: conta.numero,
              saldo_atual: conta.saldo || 0,
              ativo: conta.ativo !== false,
              data_criacao: conta.data_criacao,
              data_alteracao: conta.data_alteracao,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
        
        results.contas_financeiras = contas.length
        console.log(`âœ… ${results.contas_financeiras} contas financeiras sincronizadas`)
      } else {
        results.errors.push(`Contas financeiras: ${contasResponse.status}`)
      }
    } catch (error) {
      results.errors.push('Erro ao sincronizar contas financeiras')
      console.error('âŒ Erro contas financeiras:', error)
    }

    // 5. Sincronizar Pessoas (clientes e fornecedores)
    try {
      console.log('ðŸ‘¥ Sincronizando pessoas...')
      const pessoasResponse = await fetch(`${CONTAAZUL_API_URL}/v1/pessoa`, { headers })
      
      if (pessoasResponse.ok) {
        const pessoas = await pessoasResponse.json()
        
        for (const pessoa of pessoas) {
          await supabase
            .from('contaazul_pessoas')
            .upsert({
              id: pessoa.id,
              bar_id: bar_id,
              nome: pessoa.nome,
              tipo: pessoa.tipo || 'CLIENTE',
              documento: pessoa.cpf || pessoa.cnpj,
              email: pessoa.email,
              telefone: pessoa.telefone,
              endereco: pessoa.endereco ? JSON.stringify(pessoa.endereco) : null,
              ativo: pessoa.ativo !== false,
              data_criacao: pessoa.data_criacao,
              data_alteracao: pessoa.data_alteracao,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
        
        results.pessoas = pessoas.length
        console.log(`âœ… ${results.pessoas} pessoas sincronizadas`)
      } else {
        results.errors.push(`Pessoas: ${pessoasResponse.status}`)
      }
    } catch (error) {
      results.errors.push('Erro ao sincronizar pessoas')
      console.error('âŒ Erro pessoas:', error)
    }

    // 6. Sincronizar Contas a Receber (2.656 registros - com paginaÃ§Ã£o)
    try {
      console.log('ðŸ“¥ Sincronizando contas a receber...')
      let paginaAtual = 1
      let totalReceber = 0
      
      while (true) {
        const url = `${CONTAAZUL_API_URL}/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?pagina=${paginaAtual}&tamanho_pagina=100&data_vencimento_de=2020-01-01&data_vencimento_ate=2030-12-31`
        
        const receberResponse = await fetch(url, { headers })
        
        if (!receberResponse.ok) {
          results.errors.push(`Contas a receber pÃ¡gina ${paginaAtual}: ${receberResponse.status}`)
          break
        }
        
        const receberData = await receberResponse.json()
        
        if (!receberData.itens || receberData.itens.length === 0) {
          break // NÃ£o hÃ¡ mais dados
        }
        
        // Inserir registros da pÃ¡gina atual
        for (const item of receberData.itens) {
          await supabase
            .from('contaazul_contas_receber')
            .upsert({
              id: item.id,
              bar_id: bar_id,
              status: item.status,
              total: item.total,
              descricao: item.descricao,
              data_vencimento: item.data_vencimento,
              nao_pago: item.nao_pago || 0,
              pago: item.pago || 0,
              data_criacao: item.data_criacao,
              data_alteracao: item.data_alteracao,
              cliente_id: item.cliente?.id || null,
              cliente_nome: item.cliente?.nome || null,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
        
        totalReceber += receberData.itens.length
        console.log(`ðŸ“¥ PÃ¡gina ${paginaAtual}: +${receberData.itens.length} registros (total: ${totalReceber})`)
        
        // Verificar se chegamos na Ãºltima pÃ¡gina
        if (receberData.itens.length < 100) {
          break
        }
        
        paginaAtual++
      }
      
      results.contas_receber = totalReceber
      console.log(`âœ… ${results.contas_receber} contas a receber sincronizadas`)
      
    } catch (error) {
      results.errors.push('Erro ao sincronizar contas a receber')
      console.error('âŒ Erro contas a receber:', error)
    }

    // 7. Sincronizar Contas a Pagar (3.877 registros - com paginaÃ§Ã£o)
    try {
      console.log('ðŸ“¤ Sincronizando contas a pagar...')
      let paginaAtual = 1
      let totalPagar = 0
      
      while (true) {
        const url = `${CONTAAZUL_API_URL}/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?pagina=${paginaAtual}&tamanho_pagina=100&data_vencimento_de=2020-01-01&data_vencimento_ate=2030-12-31`
        
        const pagarResponse = await fetch(url, { headers })
        
        if (!pagarResponse.ok) {
          results.errors.push(`Contas a pagar pÃ¡gina ${paginaAtual}: ${pagarResponse.status}`)
          break
        }
        
        const pagarData = await pagarResponse.json()
        
        if (!pagarData.itens || pagarData.itens.length === 0) {
          break // NÃ£o hÃ¡ mais dados
        }
        
        // Inserir registros da pÃ¡gina atual
        for (const item of pagarData.itens) {
          await supabase
            .from('contaazul_contas_pagar')
            .upsert({
              id: item.id,
              bar_id: bar_id,
              status: item.status,
              total: item.total,
              descricao: item.descricao,
              data_vencimento: item.data_vencimento,
              nao_pago: item.nao_pago || 0,
              pago: item.pago || 0,
              data_criacao: item.data_criacao,
              data_alteracao: item.data_alteracao,
              fornecedor_id: item.fornecedor?.id || null,
              fornecedor_nome: item.fornecedor?.nome || null,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
        
        totalPagar += pagarData.itens.length
        console.log(`ðŸ“¤ PÃ¡gina ${paginaAtual}: +${pagarData.itens.length} registros (total: ${totalPagar})`)
        
        // Verificar se chegamos na Ãºltima pÃ¡gina
        if (pagarData.itens.length < 100) {
          break
        }
        
        paginaAtual++
      }
      
      results.contas_pagar = totalPagar
      console.log(`âœ… ${results.contas_pagar} contas a pagar sincronizadas`)
      
    } catch (error) {
      results.errors.push('Erro ao sincronizar contas a pagar')
      console.error('âŒ Erro contas a pagar:', error)
    }

    // 8. Atualizar timestamp da Ãºltima sincronizaÃ§Ã£o
    await supabase
      .from('contaazul_config')
      .update({ ultima_sync: new Date().toISOString() })
      .eq('bar_id', bar_id)

    const endTime = Date.now()
    results.total_time = `${((endTime - startTime) / 1000).toFixed(2)}s`

    console.log('ðŸŽ‰ SincronizaÃ§Ã£o COMPLETA finalizada!', results)

    return NextResponse.json({
      success: true,
      message: 'SincronizaÃ§Ã£o completa realizada com sucesso!',
      results: results
    })

  } catch (error) {
    console.error('âŒ Erro na sincronizaÃ§Ã£o completa:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    })
  }
} 
