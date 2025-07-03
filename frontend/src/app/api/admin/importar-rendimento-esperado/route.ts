import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { bar_id = 3 } = await request.json()
    
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    console.log('📊 Iniciando importação de rendimentos esperados para RECEITAS (nova estrutura)...')

    // URL da aba 'cópia de lista - preparos' (gid=690549737) - Coluna C = REND
    const urlRendimentos = 'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/export?format=csv&gid=690549737'

    console.log('🔗 Baixando dados de rendimento da planilha Google Sheets...')
    const response = await fetch(urlRendimentos)
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar planilha: ${response.status}`)
    }

    const csvData = await response.text()
    const linhas = csvData.split('\n').filter(linha => linha.trim())
    
    console.log(`📄 ${linhas.length} linhas baixadas`)

    // Parse do CSV
    const receitasRendimento = []
    let cabecalho = null

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]
      
      // Parse da linha CSV considerando vírgulas dentro de aspas
      const campos = []
      let campoAtual = ''
      let dentroAspas = false
      
      for (let j = 0; j < linha.length; j++) {
        const char = linha[j]
        
        if (char === '"') {
          dentroAspas = !dentroAspas
        } else if (char === ',' && !dentroAspas) {
          campos.push(campoAtual.trim())
          campoAtual = ''
        } else {
          campoAtual += char
        }
      }
      campos.push(campoAtual.trim()) // Último campo
      
      if (i === 0) {
        cabecalho = campos
        console.log('📋 Cabeçalhos encontrados:', cabecalho)
        continue
      }

      // Verificar se tem dados válidos (A=Código, B=Nome, C=Rendimento)
      if (campos.length >= 3 && campos[0] && campos[1] && campos[2]) {
        const receitaCodigo = campos[0].trim()
        const receitaNome = campos[1].trim()
        const rendimentoEsperado = parseFloat(campos[2]) || 0

        if (rendimentoEsperado > 0) {
          receitasRendimento.push({
            receita_codigo: receitaCodigo,
            receita_nome: receitaNome,
            rendimento_esperado: rendimentoEsperado
          })
        }
      }
    }

    console.log(`✅ ${receitasRendimento.length} receitas com rendimento processadas`)

    // Atualizar APENAS o insumo chefe de cada receita com o rendimento esperado
    let receitasAtualizadas = 0
    let erros = []
    let detalhes = []

    for (const receita of receitasRendimento) {
      try {
        // Buscar o insumo chefe da receita primeiro
        const { data: receitaData, error: findError } = await supabase
          .from('receitas')
          .select('insumo_chefe_id')
          .eq('bar_id', bar_id)
          .eq('receita_codigo', receita.receita_codigo)
          .limit(1)
          .single()

        if (findError || !receitaData?.insumo_chefe_id) {
          erros.push(`⚠️ ${receita.receita_codigo}: Insumo chefe não encontrado`)
          continue
        }

        // Atualizar apenas o insumo chefe da receita
        const { data, error } = await supabase
          .from('receitas')
          .update({ rendimento_esperado: receita.rendimento_esperado })
          .eq('bar_id', bar_id)
          .eq('receita_codigo', receita.receita_codigo)
          .eq('insumo_id', receitaData.insumo_chefe_id) // Apenas o insumo chefe recebe o rendimento
          .select('id, receita_codigo, receita_nome, rendimento_esperado')

        if (error) {
          erros.push(`❌ ${receita.receita_codigo}: ${error.message}`)
        } else if (data && data.length > 0) {
          receitasAtualizadas++
          detalhes.push({
            codigo: receita.receita_codigo,
            nome: receita.receita_nome,
            rendimento: receita.rendimento_esperado
          })
          console.log(`✅ ${receita.receita_codigo} (${receita.receita_nome}): ${receita.rendimento_esperado}g aplicado ao insumo chefe`)
        } else {
          console.log(`⚠️ Receita ${receita.receita_codigo} não encontrada ou sem insumo chefe definido`)
        }
      } catch (error) {
        erros.push(`❌ Erro ao processar ${receita.receita_codigo}: ${(error as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Rendimentos esperados aplicados aos insumos chefe! ${receitasAtualizadas} receitas atualizadas.`,
      data: {
        linhas_processadas: linhas.length - 1,
        receitas_com_rendimento: receitasRendimento.length,
        receitas_atualizadas: receitasAtualizadas,
        erros_count: erros.length,
        estrutura_aplicada: 'NOVA: receitas → insumos chefe com rendimento',
        logica: 'Apenas insumos chefe recebem rendimento_esperado da planilha',
        detalhes_atualizacao: detalhes.slice(0, 10),
        erros_detalhados: erros.slice(0, 5)
      }
    })

  } catch (error) {
    console.error('❌ Erro na importação de rendimentos:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno na importação: ' + (error as Error).message
    }, { status: 500 })
  }
} 