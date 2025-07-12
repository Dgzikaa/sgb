import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Função para obter token válido do ContaAzul
async function getValidContaAzulToken(barId: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔍 Buscando credenciais para bar_id:', barId)
  
  const { data: credentials } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('bar_id', barId)
    .eq('sistema', 'contaazul')
    .eq('ativo', true)
    .single()

  if (!credentials?.access_token) {
    console.log('❌ Nenhuma credencial encontrada')
    return null
  }

  if (credentials.expires_at && new Date(credentials.expires_at) > new Date()) {
    console.log('✅ Token ainda válido')
    return credentials.access_token
  }

  console.log('❌ Token expirado')
  return null
}

async function buscarDadosAPI(url: string, headers: any) {
  console.log('🔗 Buscando:', url)
  
  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    console.error('❌ Erro na API:', response.status)
    const errorText = await response.text()
    console.error('❌ Detalhes:', errorText)
    throw new Error(`Erro API: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.itens || data.dados || data
}

export async function POST(request: NextRequest) {
  try {
    const { barId, force = false } = await request.json()
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    console.log('🔍 SYNC COMPLETO UNIFICADO - 7 PASSOS - Bar:', barId)

    const accessToken = await getValidContaAzulToken(barId)
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Token do ContaAzul não disponível ou expirado' 
      }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    const resultados = {
      passo1_categorias_api: [] as any[],
      passo2_categorias_upsert: [] as any[],
      passo3_eventos_receitas_api: [] as any[],
      passo4_eventos_despesas_api: [] as any[],
      passo5_eventos_upsert: [] as any[],
      passo6_parcelas_api: [] as any[],
      passo7_parcelas_upsert: [] as any[]
    }

    console.log('🏷️ PASSO 1: BUSCAR TODAS AS CATEGORIAS DA API...')
    
    // PASSO 1: Buscar categorias da API ContaAzul
    try {
      const urlCategorias = 'https://api-v2.contaazul.com/v1/categorias'
      let paginaCategoria = 1
      let temMaisCategorias = true
      
      while (temMaisCategorias) {
        const urlPagina = `${urlCategorias}?pagina=${paginaCategoria}&tamanho_pagina=100`
        try {
          const categoriasAPI: any[] = await buscarDadosAPI(urlPagina, headers)
          
          if (categoriasAPI.length === 0) {
            temMaisCategorias = false
            break
          }
          
          resultados.passo1_categorias_api.push(...categoriasAPI)
          console.log(`📊 PASSO 1 - Página ${paginaCategoria}: ${categoriasAPI.length} categorias`)
          
          if (categoriasAPI.length < 100) {
            temMaisCategorias = false
          } else {
            paginaCategoria++
          }
        } catch (error) {
          console.error(`❌ Erro na página ${paginaCategoria}:`, error)
          temMaisCategorias = false
        }
      }
      
      console.log(`📊 PASSO 1: ${resultados.passo1_categorias_api.length} categorias encontradas na API`)
      
    } catch (error) {
      console.error('❌ ERRO no PASSO 1:', error)
      return NextResponse.json({ error: 'Erro ao buscar categorias da API' }, { status: 500 })
    }

    console.log('💾 PASSO 2: UPSERT CATEGORIAS NO BANCO...')
    
    // PASSO 2: Upsert categorias no banco
    const mapaCategorias: { [uuid: string]: string } = {} // ✅ Mapa UUID -> UUID (mesmo valor)
    
    for (const categoria of resultados.passo1_categorias_api) {
      try {
        const dadosCategoria = {
          bar_id: barId,
          id: categoria.id, // ✅ UUID da categoria do ContaAzul
          nome: categoria.nome,
          descricao: categoria.descricao || null,
          tipo: categoria.tipo,
          codigo: categoria.codigo || null,
          permite_filhos: categoria.permite_filhos || false,
          categoria_pai_id: categoria.categoria_pai_id || null,
          entrada_dre: categoria.entrada_dre || null,
          ativo: true
        }

        const { data: categoriaInserida, error: erroCategoria } = await supabase
          .from('contaazul_categorias')
          .upsert(dadosCategoria, { 
            onConflict: 'bar_id,id',
            ignoreDuplicates: false 
          })
          .select()

        if (erroCategoria) {
          console.error(`❌ Erro ao inserir categoria ${categoria.nome}:`, erroCategoria)
        } else {
          console.log(`✅ Categoria ${categoria.nome} inserida`)
          resultados.passo2_categorias_upsert.push(categoriaInserida[0])
          // ✅ Mapear UUID -> UUID (mesmo valor, já que id é UUID)
          mapaCategorias[categoria.id] = categoria.id
        }
      } catch (error) {
        console.error(`❌ Erro no PASSO 2 categoria ${categoria.nome}:`, error)
      }
    }

    const dataInicio = '2024-01-01'
    const dataFim = '2027-01-01'

    console.log('📊 PASSO 3: BUSCAR EVENTOS FINANCEIROS (CONTAS-A-RECEBER) POR CATEGORIA...')
    
    // PASSO 3: Query contas-a-receber por categoria (tipo = receita)
    const categoriasReceita = resultados.passo1_categorias_api.filter(cat => cat.tipo === 'RECEITA')
    
    for (const categoria of categoriasReceita) {
      try {
        console.log(`\n🏷️ PASSO 3: Buscando contas-a-receber da categoria ${categoria.nome}`)
        
        let paginaReceita = 1
        let temMaisReceitas = true
        
        while (temMaisReceitas) {
          const urlReceitas = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?` +
            `ids_categorias=${categoria.id}&` +
            `data_vencimento_de=${dataInicio}&` +
            `data_vencimento_ate=${dataFim}&` +
            `pagina=${paginaReceita}&` +
            `tamanho_pagina=100`

          try {
            const receitas = await buscarDadosAPI(urlReceitas, headers)
            
            if (receitas.length === 0) {
              temMaisReceitas = false
              break
            }
            
            console.log(`📊 PASSO 3 - Página ${paginaReceita}: ${receitas.length} contas-a-receber encontradas`)
            
            // ✅ contas-a-receber = tipo 'receita'
            resultados.passo3_eventos_receitas_api.push(...receitas.map((r: any) => ({ 
              ...r, 
              categoria: categoria, 
              tipo: 'receita' 
            })))
            
            if (receitas.length < 100) {
              temMaisReceitas = false
            } else {
              paginaReceita++
            }
          } catch (error) {
            console.log(`⚠️ PASSO 3 erro página ${paginaReceita}:`, error instanceof Error ? error.message : String(error))
            temMaisReceitas = false
          }
        }
        
      } catch (error) {
        console.log(`⚠️ PASSO 3 erro categoria ${categoria.nome}:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log('📊 PASSO 4: BUSCAR EVENTOS FINANCEIROS (CONTAS-A-PAGAR) POR CATEGORIA...')
    
    // PASSO 4: Query contas-a-pagar por categoria (tipo = despesa)
    const categoriasDespesa = resultados.passo1_categorias_api.filter(cat => cat.tipo === 'DESPESA')
    
    for (const categoria of categoriasDespesa) {
      try {
        console.log(`\n🏷️ PASSO 4: Buscando contas-a-pagar da categoria ${categoria.nome}`)
        
        let paginaDespesa = 1
        let temMaisDespesas = true
        
        while (temMaisDespesas) {
          const urlDespesas = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?` +
            `ids_categorias=${categoria.id}&` +
            `data_vencimento_de=${dataInicio}&` +
            `data_vencimento_ate=${dataFim}&` +
            `pagina=${paginaDespesa}&` +
            `tamanho_pagina=100`

          try {
            const despesas = await buscarDadosAPI(urlDespesas, headers)
            
            if (despesas.length === 0) {
              temMaisDespesas = false
              break
            }
            
            console.log(`📊 PASSO 4 - Página ${paginaDespesa}: ${despesas.length} contas-a-pagar encontradas`)
            
            // ✅ contas-a-pagar = tipo 'despesa'
            resultados.passo4_eventos_despesas_api.push(...despesas.map((d: any) => ({ 
              ...d, 
              categoria: categoria, 
              tipo: 'despesa' 
            })))
            
            if (despesas.length < 100) {
              temMaisDespesas = false
            } else {
              paginaDespesa++
            }
          } catch (error) {
            console.log(`⚠️ PASSO 4 erro página ${paginaDespesa}:`, error instanceof Error ? error.message : String(error))
            temMaisDespesas = false
          }
        }
        
      } catch (error) {
        console.log(`⚠️ PASSO 4 erro categoria ${categoria.nome}:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log('💾 PASSO 5: INSERIR TODOS OS EVENTOS FINANCEIROS NO BANCO...')
    
    // PASSO 5: Inserir todos os eventos financeiros na tabela unificada
    const todosEventos = [
      ...resultados.passo3_eventos_receitas_api,
      ...resultados.passo4_eventos_despesas_api
    ]

    console.log(`📊 PASSO 5: ${todosEventos.length} eventos para inserir`)

    for (const evento of todosEventos) {
      try {
        console.log(`\n💾 PASSO 5: Inserindo evento ${evento.tipo} - ${evento.descricao}`)
        
        const dadosEvento = {
          bar_id: barId,
          evento_id: evento.evento_id || evento.id,
          tipo: evento.tipo, // ✅ 'receita' ou 'despesa'
          descricao: evento.descricao || `Evento ${evento.tipo}`,
          valor: parseFloat(evento.total || evento.valor || 0),
          data_vencimento: evento.data_vencimento,
          data_competencia: evento.data_competencia || evento.data_vencimento,
          data_pagamento: evento.data_pagamento,
          status: evento.status || 'pendente',
          categoria_id: mapaCategorias[evento.categoria.id] || null, // ✅ Usar mapa UUID -> UUID
          cliente_id: evento.cliente?.id,
          fornecedor_id: evento.fornecedor?.id,
          conta_financeira_id: evento.conta_financeira?.id,
          dados_originais: evento
        }

        const { data: eventoInserido, error: erroEvento } = await supabase
          .from('contaazul_eventos_financeiros')
          .upsert(dadosEvento, { 
            onConflict: 'bar_id,evento_id',
            ignoreDuplicates: false 
          })
          .select()

        if (erroEvento) {
          console.error(`❌ PASSO 5 erro evento ${evento.tipo}:`, erroEvento)
        } else {
          console.log(`✅ PASSO 5 evento ${evento.tipo} inserido`)
          resultados.passo5_eventos_upsert.push(eventoInserido[0])
        }
      } catch (error) {
        console.error('❌ PASSO 5 erro:', error)
      }
    }

    console.log('🔍 PASSO 6: BUSCAR PARCELAS POR EVENTO_ID...')
    
    // PASSO 6: Query parcelas usando a URL correta
    for (const evento of todosEventos) {
      try {
        console.log(`\n🔍 PASSO 6: Buscando parcelas do evento ${evento.tipo} - ${evento.id}`)
        
        // ✅ URL CORRETA fornecida pelo usuário
        const eventId = evento.evento_id || evento.id
        const urlParcelasCorreta = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${eventId}/parcelas`
        
        console.log(`📋 Usando URL correta: ${urlParcelasCorreta}`)
        
        try {
          const parcelas = await buscarDadosAPI(urlParcelasCorreta, headers)
          console.log(`✅ PASSO 6: ${parcelas.length} parcelas encontradas`)
          
          if (parcelas.length > 0) {
            console.log(`📋 MÚLTIPLAS PARCELAS: Evento ${evento.id} possui ${parcelas.length} parcela(s)`)
            if (parcelas.length > 1) {
              console.log('🔄 EXEMPLO: Compra parcelada (ex: 10x no cartão)')
            }
            resultados.passo6_parcelas_api.push(...parcelas.map((p: any) => ({ 
              ...p, 
              evento: evento 
            })))
          } else {
            console.log(`📋 SEM PARCELAS: Evento ${evento.id} é pagamento único`)
            console.log('🔄 APLICANDO REGRA: data_competencia = data_vencimento')
            
            // ✅ NOVA REGRA: Atualizar evento com data_competencia = data_vencimento
            try {
              const dataCompetencia = evento.data_vencimento
              const { error: erroUpdate } = await supabase
                .from('contaazul_eventos_financeiros')
                .update({ 
                  data_competencia: dataCompetencia,
                  updated_at: new Date().toISOString() 
                })
                .eq('bar_id', barId)
                .eq('evento_id', eventId)
              
              if (erroUpdate) {
                console.error('❌ ERRO ao atualizar data_competencia:', erroUpdate)
              } else {
                console.log(`✅ EVENTO ATUALIZADO: data_competencia = ${dataCompetencia}`)
                resultados.passo6_parcelas_api.push({
                  evento_id: eventId,
                  tipo: 'evento_sem_parcelas',
                  data_competencia: dataCompetencia,
                  atualizado: true
                })
              }
            } catch (error) {
              console.error('❌ ERRO ao atualizar evento:', error)
            }
          }
        } catch (error) {
          console.log(`⚠️ PASSO 6: Erro no endpoint de parcelas`)
          console.error('❌ Erro:', error)
        }
        
      } catch (error) {
        console.error('❌ PASSO 6 erro geral:', error)
      }
    }

    console.log('💾 PASSO 7: INSERIR PARCELAS NO BANCO...')
    
    // PASSO 7: Inserir apenas parcelas REAIS (não eventos sem parcelas)
    const parcelasReais = resultados.passo6_parcelas_api.filter(p => p.tipo !== 'evento_sem_parcelas')
    
    console.log(`📊 PASSO 7: ${parcelasReais.length} parcelas reais para inserir`)
    
    if (parcelasReais.length === 0) {
      console.log('📋 PASSO 7: Nenhuma parcela real encontrada - apenas eventos de pagamento único')
      console.log('✅ PASSO 7: Eventos já foram atualizados com data_competencia no PASSO 6')
    } else {
      for (const parcela of parcelasReais) {
        try {
          const eventoId = parcela.evento?.evento_id || parcela.evento?.id || parcela.evento_id || parcela.id
          const parcelaId = parcela.parcela_id || parcela.id
          
          console.log(`\n💾 PASSO 7: Inserindo parcela REAL ${parcelaId}`)
          console.log(`🔗 Referenciando evento_financeiro_id: ${eventoId}`)
          console.log(`💰 Valor: R$ ${parcela.total || parcela.valor || 0}`)
          console.log(`📅 Vencimento: ${parcela.data_vencimento}`)
          
          const dadosParcela = {
            bar_id: barId,
            parcela_id: parcelaId,
            evento_financeiro_id: eventoId,
            tipo: parcela.evento?.tipo || parcela.tipo,
            categoria_id: mapaCategorias[parcela.evento?.categoria?.id || parcela.categoria?.id] || null, // ✅ Usar mapa
            valor: parseFloat(parcela.total || parcela.valor || 0),
            data_vencimento: parcela.data_vencimento,
            data_competencia: parcela.data_competencia || parcela.data_vencimento,
            data_pagamento: parcela.data_pagamento,
            status: parcela.status || 'pendente'
          }

          const { data: parcelaInserida, error: erroParcela } = await supabase
            .from('contaazul_parcelas')
            .upsert(dadosParcela, { 
              onConflict: 'bar_id,parcela_id',
              ignoreDuplicates: false 
            })
            .select()

          if (erroParcela) {
            console.error('❌ PASSO 7 erro parcela:', erroParcela)
          } else {
            console.log('✅ PASSO 7 parcela REAL inserida')
            resultados.passo7_parcelas_upsert.push(parcelaInserida[0])
          }
        } catch (error) {
          console.error('❌ PASSO 7 erro:', error)
        }
      }
    }

    console.log('✅ SYNC COMPLETO UNIFICADO FINALIZADO!')

    // Estatísticas finais
    const estatisticas = {
      categorias_processadas: resultados.passo2_categorias_upsert.length,
      eventos_receitas: resultados.passo3_eventos_receitas_api.length,
      eventos_despesas: resultados.passo4_eventos_despesas_api.length,
      eventos_inseridos: resultados.passo5_eventos_upsert.length,
      parcelas_reais: parcelasReais.length,
      parcelas_inseridas: resultados.passo7_parcelas_upsert.length,
      eventos_sem_parcelas: resultados.passo6_parcelas_api.filter(p => p.tipo === 'evento_sem_parcelas').length
    }

    console.log('\n📊 ESTATÍSTICAS FINAIS:')
    console.log(`   • Categorias processadas: ${estatisticas.categorias_processadas}`)
    console.log(`   • Eventos receitas: ${estatisticas.eventos_receitas}`)
    console.log(`   • Eventos despesas: ${estatisticas.eventos_despesas}`)
    console.log(`   • Eventos inseridos: ${estatisticas.eventos_inseridos}`)
    console.log(`   • Parcelas reais: ${estatisticas.parcelas_reais}`)
    console.log(`   • Parcelas inseridas: ${estatisticas.parcelas_inseridas}`)
    console.log(`   • Eventos sem parcelas: ${estatisticas.eventos_sem_parcelas}`)

    return NextResponse.json({
      success: true,
      message: '✅ Sync completo unificado executado com sucesso!',
      estatisticas,
      regras_implementadas: [
        '✅ contas-a-receber = tipo "receita"',
        '✅ contas-a-pagar = tipo "despesa"',
        '✅ Tabela unificada contaazul_eventos_financeiros',
        '✅ Parcelas referenciam evento_financeiro_id',
        '✅ URL correta para parcelas: /eventos-financeiros/{id}/parcelas',
        '✅ MÚLTIPLAS PARCELAS: Compra 10x = 1 evento + 10 parcelas',
        '✅ SEM PARCELAS: data_competencia = data_vencimento (não salva na tabela parcelas)'
      ],
      fluxo_unificado: [
        '1. ✅ Buscar categorias da API (com paginação)',
        '2. ✅ Upsert categorias no banco', 
        '3. ✅ Buscar contas-a-receber por categoria (tipo=receita)',
        '4. ✅ Buscar contas-a-pagar por categoria (tipo=despesa)',
        '5. ✅ Inserir todos eventos na tabela unificada',
        '6. ✅ Buscar parcelas por evento_id (ou atualizar data_competencia)',
        '7. ✅ Inserir parcelas reais referenciando evento_financeiro_id'
      ],
      resultados: resultados,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro geral no sync completo:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro no sync completo unificado',
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 