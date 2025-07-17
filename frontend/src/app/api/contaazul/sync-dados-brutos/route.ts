import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'API funcionando',
    timestamp: new Date().toISOString(),
    message: 'API de coleta de dados brutos ativa - Trigger automático habilitado'
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

    const { barId, source = 'manual' } = await request.json()
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    console.log('🗂️ COLETA DE DADOS BRUTOS - Bar:', barId, 'Source:', source)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const stats = {
      categorias_sincronizadas: 0,
      receitas_lotes_coletados: 0,
      despesas_lotes_coletados: 0,
      total_registros_brutos: 0,
      erros: 0,
      tempo_inicio: new Date()
    }

    // 1. Buscar credenciais
    console.log('🔍 Verificando credenciais ContaAzul...')
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (credError || !credentials) {
      throw new Error('Credenciais ContaAzul não encontradas')
    }

    // 2. Verificar token
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    
    if (expiraEm <= agora) {
      throw new Error('Token ContaAzul expirado. Renovação necessária.')
    }

    const headers = {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    }

    const baseUrl = 'https://api-v2.contaazul.com'

    // 3. Sync Categorias (processamento direto - pequeno volume)
    console.log('📁 Sincronizando categorias...')
    let paginaCategoria = 1
    const tamanhoPagina = 500

    while (true) {
      const urlCategorias = `${baseUrl}/v1/categorias?pagina=${paginaCategoria}&tamanho_pagina=${tamanhoPagina}`
      const respCategorias = await fetch(urlCategorias, { headers })
      
      if (!respCategorias.ok) {
        console.error(`❌ Erro na API categorias: ${respCategorias.status}`)
        break
      }
      
      const categoriasData = await respCategorias.json()
      const categorias = categoriasData.itens || categoriasData.dados || categoriasData
      
      if (!categorias || categorias.length === 0) break
      
      // Processar categorias diretamente (pequeno volume)
      for (const categoria of categorias) {
        await supabase
          .from('contaazul_categorias')
          .upsert({
            bar_id: parseInt(barId),
            id: categoria.id,
            nome: categoria.nome,
            descricao: categoria.descricao || null,
            tipo: categoria.tipo,
            codigo: categoria.codigo || null,
            permite_filhos: categoria.permite_filhos || false,
            categoria_pai_id: categoria.categoria_pai_id || null,
            entrada_dre: categoria.entrada_dre || null,
            ativo: true
          })
        
        stats.categorias_sincronizadas++
      }
      
      paginaCategoria++
      if (categorias.length < tamanhoPagina) break
    }

    // 4. Buscar categorias para filtrar receitas/despesas
    const { data: categoriasReceita } = await supabase
      .from('contaazul_categorias')
      .select('id')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'RECEITA')

    const { data: categoriasDespesa } = await supabase
      .from('contaazul_categorias')
      .select('id')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'DESPESA')

    // 5. Coletar RECEITAS como dados brutos (alto volume)
    console.log('💰 Coletando receitas como dados brutos...')
    if (categoriasReceita && categoriasReceita.length > 0) {
      for (const categoria of categoriasReceita) {
        let paginaReceita = 1
        const maxPaginas = 50 // Aumentado para coleta completa

        while (paginaReceita <= maxPaginas) {
          try {
            const urlReceitas = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?` +
              `ids_categorias=${categoria.id}&` +
              `data_vencimento_de=2024-01-01&` +
              `data_vencimento_ate=2027-01-01&` +
              `pagina=${paginaReceita}&` +
              `tamanho_pagina=${tamanhoPagina}`
            
            const respReceitas = await fetch(urlReceitas, { headers })
            
            if (!respReceitas.ok) {
              console.warn(`⚠️ Erro na API receitas - Cat: ${categoria.id}, Página: ${paginaReceita} - Status: ${respReceitas.status}`)
              break
            }
            
            const receitasData = await respReceitas.json()
            const receitas = receitasData.itens || receitasData.dados || receitasData
            
            if (!receitas || receitas.length === 0) break

            // 🔥 SALVAR DADOS BRUTOS - TRIGGER PROCESSARÁ AUTOMATICAMENTE
            const { error: insertError } = await supabase
              .from('contaazul_dados_brutos')
              .upsert({
                bar_id: parseInt(barId),
                tipo: 'receitas',
                categoria_id: categoria.id,
                pagina: paginaReceita,
                dados_json: receitas,
                total_registros: receitas.length,
                processado: false // Trigger irá processar
              }, {
                onConflict: 'bar_id,tipo,categoria_id,pagina'
              })

            if (insertError) {
              console.error('❌ Erro ao salvar dados brutos receitas:', insertError)
              stats.erros++
            } else {
              stats.receitas_lotes_coletados++
              stats.total_registros_brutos += receitas.length
              console.log(`✅ Receitas Cat: ${categoria.id}, Página: ${paginaReceita} - ${receitas.length} registros salvos`)
            }

            paginaReceita++
            if (receitas.length < tamanhoPagina) break

          } catch (error) {
            console.error(`❌ Erro ao coletar receitas - Cat: ${categoria.id}, Página: ${paginaReceita}:`, error)
            stats.erros++
            break
          }
        }
      }
    }

    // 6. Coletar DESPESAS como dados brutos (alto volume)
    console.log('💸 Coletando despesas como dados brutos...')
    if (categoriasDespesa && categoriasDespesa.length > 0) {
      for (const categoria of categoriasDespesa) {
        let paginaDespesa = 1
        const maxPaginas = 50 // Aumentado para coleta completa

        while (paginaDespesa <= maxPaginas) {
          try {
            const urlDespesas = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?` +
              `ids_categorias=${categoria.id}&` +
              `data_vencimento_de=2024-01-01&` +
              `data_vencimento_ate=2027-01-01&` +
              `pagina=${paginaDespesa}&` +
              `tamanho_pagina=${tamanhoPagina}`
            
            const respDespesas = await fetch(urlDespesas, { headers })
            
            if (!respDespesas.ok) {
              console.warn(`⚠️ Erro na API despesas - Cat: ${categoria.id}, Página: ${paginaDespesa} - Status: ${respDespesas.status}`)
              break
            }
            
            const despesasData = await respDespesas.json()
            const despesas = despesasData.itens || despesasData.dados || despesasData
            
            if (!despesas || despesas.length === 0) break

            // 🔥 SALVAR DADOS BRUTOS - TRIGGER PROCESSARÁ AUTOMATICAMENTE
            const { error: insertError } = await supabase
              .from('contaazul_dados_brutos')
              .upsert({
                bar_id: parseInt(barId),
                tipo: 'despesas',
                categoria_id: categoria.id,
                pagina: paginaDespesa,
                dados_json: despesas,
                total_registros: despesas.length,
                processado: false // Trigger irá processar
              }, {
                onConflict: 'bar_id,tipo,categoria_id,pagina'
              })

            if (insertError) {
              console.error('❌ Erro ao salvar dados brutos despesas:', insertError)
              stats.erros++
            } else {
              stats.despesas_lotes_coletados++
              stats.total_registros_brutos += despesas.length
              console.log(`✅ Despesas Cat: ${categoria.id}, Página: ${paginaDespesa} - ${despesas.length} registros salvos`)
            }

            paginaDespesa++
            if (despesas.length < tamanhoPagina) break

          } catch (error) {
            console.error(`❌ Erro ao coletar despesas - Cat: ${categoria.id}, Página: ${paginaDespesa}:`, error)
            stats.erros++
            break
          }
        }
      }
    }

    // 7. Calcular estatísticas finais
    const tempoExecucao = new Date().getTime() - stats.tempo_inicio.getTime()
    const duracaoSegundos = Math.round(tempoExecucao / 1000)

    console.log('\n📊 ESTATÍSTICAS FINAIS:')
    console.log(`   • Categorias sincronizadas: ${stats.categorias_sincronizadas}`)
    console.log(`   • Lotes de receitas coletados: ${stats.receitas_lotes_coletados}`)
    console.log(`   • Lotes de despesas coletados: ${stats.despesas_lotes_coletados}`)
    console.log(`   • Total de registros brutos: ${stats.total_registros_brutos}`)
    console.log(`   • Erros: ${stats.erros}`)
    console.log(`   • Duração: ${duracaoSegundos}s`)
    console.log(`   • Processamento: Trigger automático`)

    return NextResponse.json({
      success: true,
      message: 'Coleta de dados brutos concluída com sucesso',
      stats: {
        categorias_sincronizadas: stats.categorias_sincronizadas,
        receitas_lotes_coletados: stats.receitas_lotes_coletados,
        despesas_lotes_coletados: stats.despesas_lotes_coletados,
        total_registros_brutos: stats.total_registros_brutos,
        total_lotes: stats.receitas_lotes_coletados + stats.despesas_lotes_coletados,
        erros: stats.erros,
        duracao_segundos: duracaoSegundos,
        processamento: 'trigger_automatico',
        source
      },
      observacoes: [
        'Dados salvos na tabela contaazul_dados_brutos',
        'Trigger automático processará em background',
        'Eventos financeiros serão inseridos automaticamente',
        'Monitore tabela contaazul_eventos_financeiros para ver resultados'
      ]
    })

  } catch (error) {
    console.error('❌ Erro na coleta de dados brutos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Erro na coleta de dados brutos'
    }, { status: 500 })
  }
} 
