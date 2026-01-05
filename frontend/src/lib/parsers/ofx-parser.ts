// Parser básico para arquivos OFX (Open Financial Exchange)

interface TransacaoParsed {
  data: string // YYYY-MM-DD
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
}

export function parseOFX(content: string): TransacaoParsed[] {
  const transacoes: TransacaoParsed[] = []

  try {
    // OFX usa tags tipo <TAGNAME>valor
    const lines = content.split('\n').map(l => l.trim())

    let currentTransaction: any = {}
    let inTransaction = false

    for (const line of lines) {
      // Início de uma transação
      if (line.includes('<STMTTRN>')) {
        inTransaction = true
        currentTransaction = {}
      }

      // Fim de uma transação
      if (line.includes('</STMTTRN>')) {
        inTransaction = false
        
        if (currentTransaction.DTPOSTED && currentTransaction.TRNAMT && currentTransaction.MEMO) {
          const valor = Math.abs(parseFloat(currentTransaction.TRNAMT))
          const tipo = parseFloat(currentTransaction.TRNAMT) < 0 ? 'despesa' : 'receita'
          
          transacoes.push({
            data: formatOFXDate(currentTransaction.DTPOSTED),
            descricao: currentTransaction.MEMO || currentTransaction.NAME || 'Sem descrição',
            valor,
            tipo
          })
        }
        
        currentTransaction = {}
      }

      // Ler campos da transação
      if (inTransaction) {
        // Data da transação
        if (line.includes('<DTPOSTED>')) {
          currentTransaction.DTPOSTED = extractValue(line, 'DTPOSTED')
        }
        
        // Valor
        if (line.includes('<TRNAMT>')) {
          currentTransaction.TRNAMT = extractValue(line, 'TRNAMT')
        }
        
        // Descrição
        if (line.includes('<MEMO>')) {
          currentTransaction.MEMO = extractValue(line, 'MEMO')
        }
        
        // Nome alternativo
        if (line.includes('<NAME>')) {
          currentTransaction.NAME = extractValue(line, 'NAME')
        }
      }
    }
  } catch (error) {
    console.error('Erro ao parsear OFX:', error)
  }

  return transacoes
}

function extractValue(line: string, tagName: string): string {
  // Extrai valor entre <TAG> e próxima tag ou fim de linha
  const regex = new RegExp(`<${tagName}>([^<]+)`)
  const match = line.match(regex)
  return match ? match[1].trim() : ''
}

function formatOFXDate(dateStr: string): string {
  // OFX usa formato YYYYMMDDHHMMSS ou YYYYMMDD
  // Pegar apenas YYYYMMDD
  const dateOnly = dateStr.substring(0, 8)
  
  if (dateOnly.length === 8) {
    const year = dateOnly.substring(0, 4)
    const month = dateOnly.substring(4, 6)
    const day = dateOnly.substring(6, 8)
    return `${year}-${month}-${day}`
  }

  return new Date().toISOString().split('T')[0]
}
