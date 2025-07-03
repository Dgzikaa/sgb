import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { bar_id } = await request.json()

    console.log('ðŸŽ¯ Iniciando busca de contas categorizadas para bar:', bar_id)

    // Buscar configuraÃ§Ã£o do ContaAzul
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

    const baseUrl = 'https://api-v2.contaazul.com'
    const headers = {
      'Authorization': `Bearer ${config.access_token}`,
      'Accept': 'application/json'
    }

    console.log('ðŸ“‹ 1. Buscando todas as categorias...')

    // 1. BUSCAR TODAS AS CATEGORIAS
    const categoriasResponse = await fetch(`${baseUrl}/v1/categorias`, {
      method: 'GET',
      headers
    })

    if (!categoriasResponse.ok) {
      throw new Error(`Erro ao buscar categorias: ${categoriasResponse.status}`)
    }

    const categorias = await categoriasResponse.json()
    console.log('ðŸ“Š Categorias encontradas:', categorias.length || 0)

    // 2. PARA CADA CATEGORIA, BUSCAR CONTAS A PAGAR
    const contasPorCategoria: any = {}
    const resultados: any[] = []

    for (const categoria of categorias) {
      console.log(`ðŸ’³ Buscando contas para categoria: ${categoria.nome} (${categoria.id})`)
      
      try {
        // Buscar contas a pagar desta categoria especÃ­fica
        const contasUrl = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?pagina=1&tamanho_pagina=50&data_vencimento_de=2025-01-01&data_vencimento_ate=2025-12-31&ids_categorias=${categoria.id}`
        
        const contasResponse = await fetch(contasUrl, {
          method: 'GET',
          headers
        })

        if (contasResponse.ok) {
          const contasData = await contasResponse.json()
          const contas = contasData.elements || []
          
          if (contas.length > 0) {
            contasPorCategoria[categoria.id] = {
              categoria: categoria,
              contas: contas,
              total: contas.reduce((sum: number, conta: any) => sum + parseFloat(conta.total || 0), 0)
            }
            
            resultados.push({
              categoria_id: categoria.id,
              categoria_nome: categoria.nome,
              categoria_descricao: categoria.descricao,
              quantidade_contas: contas.length,
              valor_total: contas.reduce((sum: number, conta: any) => sum + parseFloat(conta.total || 0), 0),
              contas: contas.slice(0, 3) // Primeiras 3 para exemplo
            })
          }
        } else {
          console.log(`âš ï¸ Erro categoria ${categoria.nome}:`, contasResponse.status)
        }
      } catch (error) {
        console.error(`âŒ Erro na categoria ${categoria.nome}:`, error)
      }
    }

    console.log('ðŸŽ¯ Processamento concluÃ­do!')

    return NextResponse.json({
      success: true,
      total_categorias: categorias.length,
      categorias_com_movimentos: Object.keys(contasPorCategoria).length,
      resultados: resultados,
      total_geral: resultados.reduce((sum, r) => sum + r.valor_total, 0),
      resumo: contasPorCategoria
    })

  } catch (error) {
    console.error('âŒ Erro:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
} 
