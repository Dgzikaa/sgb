import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'
    
    console.log('üß™ TESTANDO ENDPOINTS V2 CORRETOS COM DATA_COMPETENCIA...')

    const supabase = createSupabaseClient()

    // 1. Buscar credenciais (igual sync-dados-brutos)
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (credError || !credentials) {
      return NextResponse.json({ 
        error: 'Credenciais ContaAzul n·£o encontradas' 
      }, { status: 404 })
    }

    // 2. Verificar token
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    
    if (expiraEm <= agora) {
      return NextResponse.json({ 
        error: 'Token ContaAzul expirado. Renova·ß·£o necess·°ria.' 
      }, { status: 401 })
    }

    const headers = {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    }

    // 3. Base URL da v2
    const baseUrl = 'https://api-v2.contaazul.com'

    // 4. Buscar uma categoria de receita para teste
    const { data: categoriasReceita } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'RECEITA')
      .limit(1)

    // 5. Buscar uma categoria de despesa para teste
    const { data: categoriasDespesa } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'DESPESA')
      .limit(1)

    // 6. Buscar IDs de eventos financeiros para teste de parcelas
    const { data: eventosFinanceiros } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('evento_id')
      .eq('bar_id', parseInt(barId))
      .not('evento_id', 'is', null)
      .limit(10)

    const testes = []

    // TESTE 1: Receitas v2 com endpoint correto
    if (categoriasReceita && categoriasReceita.length > 0) {
      console.log('üß™ TESTE 1: Receitas v2 endpoint correto...')
      try {
        const categoria = categoriasReceita[0]
        const urlReceitas = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?` +
          `ids_categorias=${categoria.id}&` +
          `data_vencimento_de=2024-01-01&` +
          `data_vencimento_ate=2027-01-01&` +
          `pagina=1&` +
          `tamanho_pagina=5`
        
        const respReceitas = await fetch(urlReceitas, { headers })
        
        let receitasData = null
        if (respReceitas.ok) {
          receitasData = await respReceitas.json()
        }
        
        // Analisar estrutura dos dados
        const receitas = receitasData?.itens || receitasData?.dados || receitasData
        let analise = {
          total_itens: receitas ? receitas.length : 0,
          tem_data_competencia: false,
          campos_disponiveis: [] as string[],
          primeiro_item: null
        }

        if (receitas && receitas.length > 0) {
          const primeiroItem = receitas[0]
          analise.campos_disponiveis = Object.keys(primeiroItem)
          analise.tem_data_competencia = 'data_competencia' in primeiroItem
          analise.primeiro_item = primeiroItem
        }
        
        testes.push({
          nome: 'Receitas v2 endpoint correto',
          categoria_testada: categoria,
          url: urlReceitas,
          status: respReceitas.status,
          ok: respReceitas.ok,
          analise,
          erro: respReceitas.ok ? null : await respReceitas.text()
        })
      } catch (error) {
        testes.push({
          nome: 'Receitas v2 endpoint correto',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // TESTE 2: Despesas v2 com endpoint correto
    if (categoriasDespesa && categoriasDespesa.length > 0) {
      console.log('üß™ TESTE 2: Despesas v2 endpoint correto...')
      try {
        const categoria = categoriasDespesa[0]
        const urlDespesas = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?` +
          `ids_categorias=${categoria.id}&` +
          `data_vencimento_de=2024-01-01&` +
          `data_vencimento_ate=2027-01-01&` +
          `pagina=1&` +
          `tamanho_pagina=5`
        
        const respDespesas = await fetch(urlDespesas, { headers })
        
        let despesasData = null
        if (respDespesas.ok) {
          despesasData = await respDespesas.json()
        }
        
        // Analisar estrutura dos dados
        const despesas = despesasData?.itens || despesasData?.dados || despesasData
        let analise = {
          total_itens: despesas ? despesas.length : 0,
          tem_data_competencia: false,
          campos_disponiveis: [] as string[],
          primeiro_item: null
        }

        if (despesas && despesas.length > 0) {
          const primeiroItem = despesas[0]
          analise.campos_disponiveis = Object.keys(primeiroItem)
          analise.tem_data_competencia = 'data_competencia' in primeiroItem
          analise.primeiro_item = primeiroItem
        }
        
        testes.push({
          nome: 'Despesas v2 endpoint correto',
          categoria_testada: categoria,
          url: urlDespesas,
          status: respDespesas.status,
          ok: respDespesas.ok,
          analise,
          erro: respDespesas.ok ? null : await respDespesas.text()
        })
      } catch (error) {
        testes.push({
          nome: 'Despesas v2 endpoint correto',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // üÜï TESTE 3: Receitas v2 COM PAR·ÇMETROS DE COMPET·äNCIA
    if (categoriasReceita && categoriasReceita.length > 0) {
      console.log('üß™ TESTE 3: Receitas v2 COM data_competencia_de e data_competencia_ate...')
      try {
        const categoria = categoriasReceita[0]
        const urlReceitasCompetencia = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?` +
          `ids_categorias=${categoria.id}&` +
          `data_vencimento_de=2024-01-01&` +
          `data_vencimento_ate=2027-01-01&` +
          `data_competencia_de=2024-01-01&` +
          `data_competencia_ate=2027-01-01&` +
          `pagina=1&` +
          `tamanho_pagina=5`
        
        const respReceitasComp = await fetch(urlReceitasCompetencia, { headers })
        
        let receitasCompData = null
        if (respReceitasComp.ok) {
          receitasCompData = await respReceitasComp.json()
        }
        
        // Analisar estrutura dos dados
        const receitasComp = receitasCompData?.itens || receitasCompData?.dados || receitasCompData
        let analiseComp = {
          total_itens: receitasComp ? receitasComp.length : 0,
          tem_data_competencia: false,
          campos_disponiveis: [] as string[],
          primeiro_item: null
        }

        if (receitasComp && receitasComp.length > 0) {
          const primeiroItem = receitasComp[0]
          analiseComp.campos_disponiveis = Object.keys(primeiroItem)
          analiseComp.tem_data_competencia = 'data_competencia' in primeiroItem
          analiseComp.primeiro_item = primeiroItem
        }
        
        testes.push({
          nome: 'Receitas v2 COM data_competencia_de/ate',
          categoria_testada: categoria,
          url: urlReceitasCompetencia,
          status: respReceitasComp.status,
          ok: respReceitasComp.ok,
          analise: analiseComp,
          erro: respReceitasComp.ok ? null : await respReceitasComp.text()
        })
      } catch (error) {
        testes.push({
          nome: 'Receitas v2 COM data_competencia_de/ate',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // üÜï TESTE 4: Despesas v2 COM PAR·ÇMETROS DE COMPET·äNCIA
    if (categoriasDespesa && categoriasDespesa.length > 0) {
      console.log('üß™ TESTE 4: Despesas v2 COM data_competencia_de e data_competencia_ate...')
      try {
        const categoria = categoriasDespesa[0]
        const urlDespesasCompetencia = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?` +
          `ids_categorias=${categoria.id}&` +
          `data_vencimento_de=2024-01-01&` +
          `data_vencimento_ate=2027-01-01&` +
          `data_competencia_de=2024-01-01&` +
          `data_competencia_ate=2027-01-01&` +
          `pagina=1&` +
          `tamanho_pagina=5`
        
        const respDespesasComp = await fetch(urlDespesasCompetencia, { headers })
        
        let despesasCompData = null
        if (respDespesasComp.ok) {
          despesasCompData = await respDespesasComp.json()
        }
        
        // Analisar estrutura dos dados
        const despesasComp = despesasCompData?.itens || despesasCompData?.dados || despesasCompData
        let analiseComp = {
          total_itens: despesasComp ? despesasComp.length : 0,
          tem_data_competencia: false,
          campos_disponiveis: [] as string[],
          primeiro_item: null
        }

        if (despesasComp && despesasComp.length > 0) {
          const primeiroItem = despesasComp[0]
          analiseComp.campos_disponiveis = Object.keys(primeiroItem)
          analiseComp.tem_data_competencia = 'data_competencia' in primeiroItem
          analiseComp.primeiro_item = primeiroItem
        }
        
        testes.push({
          nome: 'Despesas v2 COM data_competencia_de/ate',
          categoria_testada: categoria,
          url: urlDespesasCompetencia,
          status: respDespesasComp.status,
          ok: respDespesasComp.ok,
          analise: analiseComp,
          erro: respDespesasComp.ok ? null : await respDespesasComp.text()
        })
      } catch (error) {
        testes.push({
          nome: 'Despesas v2 COM data_competencia_de/ate',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // üÜï TESTE 5: Endpoint de PARCELAS
    if (eventosFinanceiros && eventosFinanceiros.length > 0) {
      console.log('üß™ TESTE 5: Endpoint de parcelas...')
      
      const resultadosParcelas = []
      
      // Testar os primeiros 5 IDs de eventos
      const idsParaTestar = eventosFinanceiros.slice(0, 5)
      
      for (const evento of idsParaTestar) {
        try {
          const urlParcelas = `${baseUrl}/v1/financeiro/eventos-financeiros/${evento.evento_id}/parcelas`
          
          const respParcelas = await fetch(urlParcelas, { headers })
          
          let parcelasData = null
          if (respParcelas.ok) {
            parcelasData = await respParcelas.json()
          }
          
          // Analisar estrutura dos dados
          const parcelas = parcelasData?.itens || parcelasData?.dados || parcelasData || []
          let analiseParcelas = {
            evento_id: evento.evento_id,
            total_parcelas: Array.isArray(parcelas) ? parcelas.length : 0,
            tem_data_competencia: false,
            campos_disponiveis: [] as string[],
            primeira_parcela: null
          }

          if (Array.isArray(parcelas) && parcelas.length > 0) {
            const primeiraParcela = parcelas[0]
            analiseParcelas.campos_disponiveis = Object.keys(primeiraParcela)
            analiseParcelas.tem_data_competencia = 'data_competencia' in primeiraParcela
            analiseParcelas.primeira_parcela = primeiraParcela
          }
          
          resultadosParcelas.push({
            evento_id: evento.evento_id,
            url: urlParcelas,
            status: respParcelas.status,
            ok: respParcelas.ok,
            analise: analiseParcelas,
            erro: respParcelas.ok ? null : await respParcelas.text()
          })
          
        } catch (error) {
          resultadosParcelas.push({
            evento_id: evento.evento_id,
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }
      
      testes.push({
        nome: 'Endpoint de parcelas',
        total_eventos_testados: idsParaTestar.length,
        resultados: resultadosParcelas,
        parcelas_tem_competencia: resultadosParcelas.some(r => r.analise?.tem_data_competencia),
        eventos_com_sucesso: resultadosParcelas.filter((r) => r.ok).length
      })
    }

    return NextResponse.json({
      sucesso: true,
      message: 'Teste endpoints v2 corretos com data_competencia conclu·≠do',
      testes,
      conclusoes: {
        total_testes: testes.length,
        testes_ok: testes.filter((t) => t.ok || t.eventos_com_sucesso).length,
        receitas_tem_competencia: testes.find((t) => t.nome.includes('Receitas'))?.analise?.tem_data_competencia || false,
        despesas_tem_competencia: testes.find((t) => t.nome.includes('Despesas'))?.analise?.tem_data_competencia || false,
        receitas_comp_tem_competencia: testes.find((t) => t.nome.includes('COM data_competencia') && t.nome.includes('Receitas'))?.analise?.tem_data_competencia || false,
        despesas_comp_tem_competencia: testes.find((t) => t.nome.includes('COM data_competencia') && t.nome.includes('Despesas'))?.analise?.tem_data_competencia || false,
        parcelas_tem_competencia: testes.find((t) => t.nome.includes('parcelas'))?.parcelas_tem_competencia || false,
        viavel_para_dre: testes.some(t => t.analise?.tem_data_competencia || t.parcelas_tem_competencia)
      }
    })

  } catch (error) {
    console.error('ùå Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
