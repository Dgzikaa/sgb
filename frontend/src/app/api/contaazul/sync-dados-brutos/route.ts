import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'API funcionando',
    timestamp: new Date().toISOString(),
    message: 'API de processamento de dados brutos ativa'
  })
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    if (token !== 'sgb-dados-brutos-processamento-2025') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { barId, force = false } = await request.json()
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    console.log('🗂️ PROCESSAMENTO DE DADOS BRUTOS - Bar:', barId)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const stats = {
      categorias_ja_processadas: 0,
      receitas_processadas: 0,
      despesas_processadas: 0,
      eventos_inseridos: 0,
      paginas_processadas: 0,
      erros: 0
    }

    // 1. Buscar dados brutos não processados
    console.log('🔍 Buscando dados brutos não processados...')
    
    const { data: dadosBrutos, error: erroBusca } = await supabase
      .from('contaazul_dados_brutos')
      .select('*')
      .eq('bar_id', barId)
      .eq('processado', false)
      .order('coletado_em', { ascending: true })

    if (erroBusca) {
      console.error('❌ Erro ao buscar dados brutos:', erroBusca)
      return NextResponse.json({ error: 'Erro ao buscar dados brutos' }, { status: 500 })
    }

    if (!dadosBrutos || dadosBrutos.length === 0) {
      console.log('ℹ️ Nenhum dado bruto pendente de processamento')
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado pendente para processar',
        estatisticas: stats
      })
    }

    console.log(`📊 Encontrados ${dadosBrutos.length} registros de dados brutos para processar`)

    // 2. Buscar mapa de categorias existentes
    const { data: categorias } = await supabase
      .from('contaazul_categorias')
      .select('id')
      .eq('bar_id', barId)

    const mapaCategorias: { [uuid: string]: string } = {}
    categorias?.forEach(cat => {
      mapaCategorias[cat.id] = cat.id
    })

    // 3. Processar cada registro de dados brutos
    for (const dadoBruto of dadosBrutos) {
      try {
        console.log(`\n🔄 Processando: ${dadoBruto.tipo} - Categoria: ${dadoBruto.categoria_id} - Página: ${dadoBruto.pagina}`)

        const dadosJson = dadoBruto.dados_json
        if (!Array.isArray(dadosJson)) {
          console.error('❌ Dados JSON inválidos')
          stats.erros++
          continue
        }

        // Processar cada item dos dados JSON
        for (const item of dadosJson) {
          try {
            if (dadoBruto.tipo === 'receitas') {
              // Processar receita - usando campos corretos dos dados coletados
              const dadosEvento = {
                bar_id: barId,
                evento_id: item.id, // Campo correto
                tipo: 'receita',
                descricao: item.descricao || `Receita ${item.id}`,
                valor: parseFloat(item.total || 0), // Campo correto
                data_vencimento: item.data_vencimento,
                data_competencia: item.data_competencia || item.data_vencimento,
                data_pagamento: item.status === 'ACQUITTED' ? item.data_vencimento : null,
                status: item.status_traduzido || item.status || 'pendente',
                categoria_id: dadoBruto.categoria_id,
                cliente_id: item.cliente?.id,
                conta_financeira_id: item.conta_financeira?.id,
                dados_originais: item
              }

              const { error: erroReceita } = await supabase
                .from('contaazul_eventos_financeiros')
                .upsert(dadosEvento, { 
                  onConflict: 'bar_id,evento_id',
                  ignoreDuplicates: false 
                })

              if (erroReceita) {
                console.error('❌ Erro ao inserir receita:', erroReceita)
                stats.erros++
              } else {
                stats.receitas_processadas++
                stats.eventos_inseridos++
              }

            } else if (dadoBruto.tipo === 'despesas') {
              // Processar despesa - usando campos corretos dos dados coletados
              const dadosEvento = {
                bar_id: barId,
                evento_id: item.id, // Campo correto
                tipo: 'despesa',
                descricao: item.descricao || `Despesa ${item.id}`,
                valor: parseFloat(item.total || 0), // Campo correto
                data_vencimento: item.data_vencimento,
                data_competencia: item.data_competencia || item.data_vencimento,
                data_pagamento: item.status === 'PAID' ? item.data_vencimento : null,
                status: item.status_traduzido || item.status || 'pendente',
                categoria_id: dadoBruto.categoria_id,
                fornecedor_id: item.fornecedor?.id,
                conta_financeira_id: item.conta_financeira?.id,
                dados_originais: item
              }

              const { error: erroDespesa } = await supabase
                .from('contaazul_eventos_financeiros')
                .upsert(dadosEvento, { 
                  onConflict: 'bar_id,evento_id',
                  ignoreDuplicates: false 
                })

              if (erroDespesa) {
                console.error('❌ Erro ao inserir despesa:', erroDespesa)
                stats.erros++
              } else {
                stats.despesas_processadas++
                stats.eventos_inseridos++
              }
            }

          } catch (error) {
            console.error('❌ Erro ao processar item:', error)
            stats.erros++
          }
        }

        // Marcar como processado
        const { error: erroUpdate } = await supabase
          .from('contaazul_dados_brutos')
          .update({ 
            processado: true,
            processado_em: new Date().toISOString()
          })
          .eq('id', dadoBruto.id)

        if (erroUpdate) {
          console.error('❌ Erro ao marcar como processado:', erroUpdate)
          stats.erros++
        } else {
          stats.paginas_processadas++
          console.log(`✅ Página processada: ${dadosJson.length} itens`)
        }

      } catch (error) {
        console.error('❌ Erro ao processar dado bruto:', error)
        stats.erros++
      }
    }

    console.log('\n📊 ESTATÍSTICAS FINAIS:')
    console.log(`   • Páginas processadas: ${stats.paginas_processadas}`)
    console.log(`   • Receitas processadas: ${stats.receitas_processadas}`)
    console.log(`   • Despesas processadas: ${stats.despesas_processadas}`)
    console.log(`   • Total eventos inseridos: ${stats.eventos_inseridos}`)
    console.log(`   • Erros: ${stats.erros}`)

    return NextResponse.json({
      success: true,
      message: '✅ Processamento de dados brutos concluído!',
      estatisticas: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro geral no processamento de dados brutos:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro no processamento de dados brutos',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 