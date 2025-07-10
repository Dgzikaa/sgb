import { NextRequest, NextResponse } from 'next/server'

// Interfaces para tipagem
interface Rateio {
  id_categoria: string
  valor: number
  rateio_centro_custo?: CentroCusto[]
}

interface CentroCusto {
  id_centro_custo: string
  valor: number
}

export async function POST(request: NextRequest) {
  try {
    const { access_token, data_inicio, data_fim } = await request.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Token de acesso obrigatório' }, { status: 400 })
    }

    console.log('🔍 TESTE: Buscar parcelas com categoria - Estratégia 2 etapas')
    console.log('📅 Período:', data_inicio, 'até', data_fim)

    // ETAPA 1: Buscar lista básica de parcelas
    console.log('\n🔍 ETAPA 1: Buscando lista básica de parcelas...')
    
    const buscarUrl = `https://api.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar`
    const params = new URLSearchParams({
      pagina: '1',
      tamanho_pagina: '10', // Teste com poucas parcelas primeiro
      data_vencimento_de: data_inicio || '2024-01-01',
      data_vencimento_ate: data_fim || '2024-12-31'
    })

    const response1 = await fetch(`${buscarUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response1.ok) {
      const errorText = await response1.text()
      console.error('❌ Erro na busca básica:', response1.status, errorText)
      return NextResponse.json({ 
        error: 'Erro na busca básica de parcelas',
        details: errorText,
        status: response1.status 
      }, { status: 500 })
    }

    const dadosBasicos = await response1.json()
    console.log('✅ Parcelas básicas encontradas:', dadosBasicos.itens_totais)
    console.log('📋 Primeiras parcelas:', dadosBasicos.itens?.slice(0, 3))

    // ETAPA 2: Buscar detalhes de cada parcela
    console.log('\n🔍 ETAPA 2: Buscando detalhes com categoria...')
    
    const parcelasDetalhadas = []
    const erros = []

    for (let i = 0; i < Math.min(3, dadosBasicos.itens?.length || 0); i++) {
      const parcela = dadosBasicos.itens[i]
      console.log(`\n📝 Buscando detalhes da parcela ${i + 1}/${dadosBasicos.itens.length}:`, parcela.id)

      try {
        const detalheUrl = `https://api.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela.id}`
        
        const response2 = await fetch(detalheUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response2.ok) {
          const errorText = await response2.text()
          console.error(`❌ Erro ao buscar detalhes da parcela ${parcela.id}:`, response2.status, errorText)
          erros.push({
            parcela_id: parcela.id,
            erro: errorText,
            status: response2.status
          })
          continue
        }

        const detalhe = await response2.json()
        console.log('✅ Detalhes obtidos para parcela:', parcela.id)
        console.log('🎯 Evento:', detalhe.evento?.id)
        console.log('📊 Rateio presente:', !!detalhe.evento?.rateio)
        
        // Extrair informações de categoria
        const categoriaInfo = {
          parcela_id: parcela.id,
          descricao: parcela.descricao,
          valor: parcela.total,
          evento_id: detalhe.evento?.id,
          tem_rateio: !!detalhe.evento?.rateio,
          categorias: detalhe.evento?.rateio?.map((r: Rateio) => ({
            categoria_id: r.id_categoria,
            valor_categoria: r.valor,
            centros_custo: r.rateio_centro_custo?.map((cc: CentroCusto) => ({
              centro_custo_id: cc.id_centro_custo,
              valor_centro_custo: cc.valor
            })) || []
          })) || []
        }

        parcelasDetalhadas.push(categoriaInfo)
        console.log('📋 Categoria extraída:', categoriaInfo)

      } catch (error) {
        console.error(`❌ Erro ao processar parcela ${parcela.id}:`, error)
        erros.push({
          parcela_id: parcela.id,
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // Resultado final
    const resultado = {
      sucesso: true,
      etapa1: {
        total_parcelas: dadosBasicos.itens_totais,
        parcelas_processadas: dadosBasicos.itens?.length || 0
      },
      etapa2: {
        parcelas_detalhadas: parcelasDetalhadas.length,
        com_categoria: parcelasDetalhadas.filter(p => p.categorias.length > 0).length,
        sem_categoria: parcelasDetalhadas.filter(p => p.categorias.length === 0).length
      },
      dados: parcelasDetalhadas,
      erros: erros,
      timestamp: new Date().toISOString()
    }

    console.log('\n🎯 RESULTADO FINAL:')
    console.log('✅ Parcelas processadas:', resultado.etapa2.parcelas_detalhadas)
    console.log('🏷️ Com categoria:', resultado.etapa2.com_categoria)
    console.log('❌ Sem categoria:', resultado.etapa2.sem_categoria)
    console.log('⚠️ Erros:', resultado.erros.length)

    return NextResponse.json(resultado, { status: 200 })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 