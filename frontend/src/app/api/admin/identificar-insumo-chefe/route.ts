import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando identificação de insumos chefe - NOVA ESTRUTURA (sem produtos)...')

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao conectar com banco'
      }, { status: 500 })
    }

    // 1. Zerar todos os insumo_chefe_id
    console.log('🧹 Zerando todos os insumo_chefe_id...')
    const { error: clearError } = await supabase
      .from('receitas')
      .update({ 
        insumo_chefe_id: null,
        rendimento_esperado: null 
      })
      .eq('bar_id', 3)

    if (clearError) {
      console.error('❌ Erro ao limpar dados:', clearError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao limpar dados: ' + clearError.message
      }, { status: 500 })
    }

    // 2. Buscar receitas e insumos
    const { data: insumos } = await supabase
      .from('insumos')
      .select('id, codigo, nome')
      .eq('bar_id', 3)

    const { data: receitas } = await supabase
      .from('receitas')
      .select('id, receita_codigo, receita_nome, insumo_id, quantidade_necessaria')
      .eq('bar_id', 3)
      .not('receita_codigo', 'is', null)

    if (!receitas || !insumos) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar dados do banco'
      }, { status: 500 })
    }

    // 3. Agrupar receitas por código
    const receitasAgrupadas = new Map()
    receitas.forEach((receita: any) => {
      const codigo = receita.receita_codigo
      if (!receitasAgrupadas.has(codigo)) {
        receitasAgrupadas.set(codigo, {
          receita_codigo: codigo,
          receita_nome: receita.receita_nome,
          ingredientes: []
        })
      }
      
      const insumo = insumos.find((i: any) => i.id === receita.insumo_id)
      if (insumo) {
        receitasAgrupadas.get(codigo).ingredientes.push({
          receita_id: receita.id,
          insumo_id: insumo.id,
          insumo_codigo: insumo.codigo,
          insumo_nome: insumo.nome,
          quantidade: receita.quantidade_necessaria
        })
      }
    })

    // 4. Para cada receita, identificar o insumo chefe
    let totalProcessados = 0
    let insumosChefe = []
    let receitasAtualizadas = 0

    for (const [receitaCodigo, dadosReceita] of receitasAgrupadas) {
      totalProcessados++
      
      console.log(`\n🔍 Analisando receita: ${dadosReceita.receita_nome} (${receitaCodigo})`)
      
      let insumoChefe = null
      let melhorScore = 0

      for (const ingrediente of dadosReceita.ingredientes) {
        let score = 0
        const nomeInsumo = (ingrediente.insumo_nome || '').toLowerCase()
        const nomeReceita = (dadosReceita.receita_nome || '').toLowerCase()
        const quantidade = ingrediente.quantidade || 0

                 // DETECTAR SE É RECEITA DE DRINK
         const isDrink = (
           receitaCodigo.startsWith('pd') || 
           ['drink', 'suco', 'bebida', 'cocktail', 'caipirinha', 'batida', 'smoothie'].some(termo => 
             nomeReceita.includes(termo)
           )
         )

         // BLACKLIST: Nunca podem ser insumo chefe
         let blacklist = [
           'molho shoyu', 'ketchup', 'mostarda', 'vinagre', 'tempero pronto',
           'refrigerante', 'cerveja', 'vinho'
         ]

         // BLACKLIST ESPECÍFICA PARA DRINKS
         if (isDrink) {
           blacklist = blacklist.concat([
             'água', 'açúcar', 'gelo', 'refrigerante', 'soda', 'tônica', 'sprite', 'coca'
           ])
         }
         
         let isBlacklisted = blacklist.some(item => nomeInsumo.includes(item))
         
         // EXCEÇÃO: Xarope simples (só água + açúcar) - permitir proporcionalidade
         const isXaropeSimples = (
           nomeReceita.includes('xarope simples') || 
           nomeReceita.includes('xarope de açúcar')
         )
         
         if (isBlacklisted && !isXaropeSimples) {
           console.log(`  ❌ ${ingrediente.insumo_nome} está na blacklist${isDrink ? ' (DRINK)' : ''}`)
           continue
         }

                 // LÓGICA ESPECÍFICA PARA DRINKS
         if (isDrink) {
           // 🍹 SUPER PRIORIDADE DRINKS - INGREDIENTES PRINCIPAIS (+120 pontos)
           const ingredientesPrincipaisDrinks = [
             'polpa', 'mel', 'melado', 'xarope de', 'calda de', 'licor', 'rum', 'vodka', 
             'whisky', 'gin', 'tequila', 'cachaça', 'pisco', 'brandy', 'destilado'
           ]
           
           // 🍓 FRUTAS NATURAIS (+110 pontos)  
           const frutasNaturais = [
             'morango', 'limão', 'laranja', 'maracujá', 'manga', 'abacaxi', 'kiwi',
             'uva', 'pêssego', 'banana', 'coco', 'açaí', 'cupuaçu', 'pitanga'
           ]

           if (ingredientesPrincipaisDrinks.some(palavra => nomeInsumo.includes(palavra))) {
             score += 120
             console.log(`  🍹 ${ingrediente.insumo_nome}: INGREDIENTE PRINCIPAL DRINK (+120)`)
           }
           else if (frutasNaturais.some(palavra => nomeInsumo.includes(palavra))) {
             score += 110  
             console.log(`  🍓 ${ingrediente.insumo_nome}: FRUTA NATURAL DRINK (+110)`)
           }
           // Especial: Xarope simples - permitir água e açúcar com scores iguais
           else if (isXaropeSimples && (nomeInsumo.includes('água') || nomeInsumo.includes('açúcar'))) {
             score += 50
             console.log(`  🍯 ${ingrediente.insumo_nome}: XAROPE SIMPLES - proporcional (+50)`)
           }
           else {
             score += 10
             console.log(`  🧂 ${ingrediente.insumo_nome}: OUTROS DRINK (+10)`)
           }
         }
         // LÓGICA PARA COMIDAS (NÃO DRINKS)
         else {
           // 🔥 SUPER PRIORIDADE - PROTEÍNAS (+100 pontos)
           const proteinas = [
             'frango', 'carne', 'boi', 'porco', 'peixe', 'tilápia', 'salmão', 'atum',
             'camarão', 'bacon', 'linguiça', 'costela', 'picanha', 'filé', 'coração',
             'carne seca', 'carne de sol', 'carne moída'
           ]
           if (proteinas.some(palavra => nomeInsumo.includes(palavra))) {
             score += 100
             console.log(`  🔥 ${ingrediente.insumo_nome}: PROTEÍNA - SUPER prioridade (+100)`)
           }

           // 🌾 ALTA PRIORIDADE - BASES/CONTROLADORES (+80 pontos)
           else if (['tapioca', 'farinha', 'massa', 'polvilho', 'batata', 'mandioca'].some(palavra => nomeInsumo.includes(palavra))) {
             score += 80
             console.log(`  🌾 ${ingrediente.insumo_nome}: BASE/CONTROLADOR - ALTA prioridade (+80)`)
           }

           // 🥛 MÉDIA PRIORIDADE - BASES LÍQUIDAS (+60 pontos)
           else if (['creme de leite', 'leite condensado'].some(palavra => nomeInsumo.includes(palavra))) {
             score += 60
             console.log(`  🥛 ${ingrediente.insumo_nome}: BASE LÍQUIDA - MÉDIA prioridade (+60)`)
           }

           // 🍫 CHOCOLATES (+50 pontos)
           else if (['chocolate'].some(palavra => nomeInsumo.includes(palavra))) {
             score += 50
             console.log(`  🍫 ${ingrediente.insumo_nome}: CHOCOLATE (+50)`)
           }

           // 🧀 QUEIJOS (+40 pontos)
           else if (['queijo'].some(palavra => nomeInsumo.includes(palavra))) {
             score += 40
             console.log(`  🧀 ${ingrediente.insumo_nome}: QUEIJO (+40)`)
           }

           // 🥛 LEITE NORMAL (+20 pontos)
           else if (['leite'].some(palavra => nomeInsumo.includes(palavra))) {
             score += 20
             console.log(`  🥛 ${ingrediente.insumo_nome}: LEITE (+20)`)
           }

           else {
             score += 10
             console.log(`  🧂 ${ingrediente.insumo_nome}: OUTROS (+10)`)
           }
         }

        console.log(`  📊 ${ingrediente.insumo_nome}: ${quantidade}g, score final: ${score}`)

        // Escolher o melhor candidato
        if (score > melhorScore) {
          insumoChefe = ingrediente
          melhorScore = score
        }
      }

      // 5. Atualizar receita se encontrou insumo chefe válido
      if (insumoChefe && melhorScore >= 20) {
        console.log(`  🎯 CHEFE: ${insumoChefe.insumo_nome} (score: ${melhorScore})`)
        
        insumosChefe.push({
          receita_codigo: receitaCodigo,
          receita_nome: dadosReceita.receita_nome,
          insumo_chefe_codigo: insumoChefe.insumo_codigo,
          insumo_chefe_nome: insumoChefe.insumo_nome,
          score: melhorScore
        })

        // Atualizar todas as receitas desta receita_codigo
        for (const ingrediente of dadosReceita.ingredientes) {
          if (ingrediente.insumo_id === insumoChefe.insumo_id) {
            const { error: updateError } = await supabase
              .from('receitas')
              .update({ 
                insumo_chefe_id: insumoChefe.insumo_id
              })
              .eq('id', ingrediente.receita_id)

            if (updateError) {
              console.error(`❌ Erro ao atualizar receita ${ingrediente.receita_id}:`, updateError.message)
            } else {
              receitasAtualizadas++
              console.log(`✅ Receita ${ingrediente.receita_id} atualizada`)
            }
          }
        }
      } else {
        console.log(`  ⚠️ Nenhum insumo chefe identificado (melhor score: ${melhorScore})`)
      }
    }

    console.log(`\n📊 Resumo final:`)
    console.log(`- Receitas processadas: ${totalProcessados}`)
    console.log(`- Insumos chefe identificados: ${insumosChefe.length}`)
    console.log(`- Receitas atualizadas: ${receitasAtualizadas}`)

    return NextResponse.json({
      success: true,
      message: `✅ Processamento completo! ${receitasAtualizadas} receitas atualizadas com insumos chefe usando NOVA ESTRUTURA (sem produtos).`,
      data: {
        total_receitas_processadas: totalProcessados,
        insumos_chefe_identificados: insumosChefe.length,
        receitas_atualizadas: receitasAtualizadas,
        insumos_chefe_detalhes: insumosChefe,
        nova_estrutura: true,
                 criterios_aplicados: [
           '🧹 1. Limpeza: Todos insumo_chefe_id zerados',
           '🚫 2. Estrutura nova: SEM tabela produtos',
           '🍹 3. Detecção automática: DRINKS vs COMIDAS',
           '❌ 4. Blacklist comidas: temperos, molhos industriais',
           '❌ 4b. Blacklist drinks: água, açúcar, gelo, refrigerante',
           '🍯 5. Exceção: Xarope simples (água + açúcar proporcional)',
           '🍹 6. Super prioridade drinks: polpa, mel, destilados (+120)',
           '🍓 7. Frutas naturais drinks: morango, limão, etc (+110)',
           '🔥 8. Super prioridade comidas: proteínas (+100)',
           '🌾 9. Alta prioridade comidas: bases/controladores (+80)',
           '🥛 10. Média prioridade comidas: bases líquidas (+60)',
           '🍫 11. Chocolates (+50), 🧀 Queijos (+40), 🥛 Leite (+20)',
           '🛡️ 12. Score mínimo: ≥20 pontos',
           '💾 13. Estrutura: receitas → insumos direto'
         ]
      }
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar: ' + String(error) 
    }, { status: 500 })
  }
} 