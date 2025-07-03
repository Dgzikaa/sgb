import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando dados da planilha de receitas...')

    // URL da aba com os dados de produto x insumo
    const PRODUTOS_INSUMOS_URL = 'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/export?format=csv&gid=468785442'

    const response = await fetch(PRODUTOS_INSUMOS_URL)
    if (!response.ok) {
      throw new Error('Erro ao baixar planilha: HTTP ' + response.status)
    }

    const data = await response.text()
    const lines = data.split('\n').filter(line => line.trim())

    console.log('📊 Total de linhas:', lines.length)
    console.log('🔍 Primeiras 10 linhas:')
    
    const receitasFrangoPassarinho = []
    
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i]?.trim()
      if (!line) continue

      // Parse CSV robusto
      let columns = []
      let currentField = ''
      let insideQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentField.trim())
          currentField = ''
        } else {
          currentField += char
        }
      }
      columns.push(currentField.trim())
      
      const codigoProduto = columns[0]?.trim() || ''
      const nomeProduto = columns[1]?.trim() || ''
      const codigoInsumo = columns[2]?.trim() || ''
      const nomeInsumo = columns[3]?.trim() || ''
      const quantidade = columns[4]?.trim() || ''

      console.log(`Linha ${i + 1}: "${codigoProduto}" | "${nomeProduto}" | "${codigoInsumo}" | "${nomeInsumo}" | "${quantidade}"`)
      
      // Buscar especificamente o Frango a Passarinho
      if (codigoProduto === 'pc0005' || nomeProduto?.toLowerCase().includes('frango') && nomeProduto?.toLowerCase().includes('passarinho')) {
        receitasFrangoPassarinho.push({
          linha: i + 1,
          codigoProduto,
          nomeProduto,
          codigoInsumo,
          nomeInsumo,
          quantidade
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalLinhas: lines.length,
      primeiras10Linhas: lines.slice(0, 10),
      receitasFrangoPassarinho,
      estruturaEsperada: {
        coluna_A: 'Código do Produto (ex: pc0005)',
        coluna_B: 'Nome do Produto (ex: Frango a Passarinho preparo)',
        coluna_C: 'Código do Insumo (ex: i0095)',
        coluna_D: 'Nome do Insumo (ex: Alho em pó)',
        coluna_E: 'Quantidade (ex: 50)'
      }
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao verificar planilha: ' + String(error) 
    }, { status: 500 })
  }
} 