// Parser para extratos CSV de diferentes bancos

interface TransacaoParsed {
  data: string // YYYY-MM-DD
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
}

// ========================================
// NUBANK
// ========================================
export function parseNubankCSV(content: string): TransacaoParsed[] {
  const lines = content.split('\n').filter(line => line.trim())
  const transacoes: TransacaoParsed[] = []

  // Nubank formato: date,category,title,amount
  // Pular cabeçalho
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',').map(p => p.replace(/"/g, '').trim())
    if (parts.length < 4) continue

    const [data, categoria, descricao, valorStr] = parts
    const valor = Math.abs(parseFloat(valorStr))
    const tipo = parseFloat(valorStr) < 0 ? 'despesa' : 'receita'

    transacoes.push({
      data: formatDateToISO(data),
      descricao: descricao || categoria,
      valor,
      tipo
    })
  }

  return transacoes
}

// ========================================
// BRADESCO
// ========================================
export function parseBradescoCSV(content: string): TransacaoParsed[] {
  const lines = content.split('\n').filter(line => line.trim())
  const transacoes: TransacaoParsed[] = []

  // Bradesco formato: Data;Descrição;Valor
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(';').map(p => p.replace(/"/g, '').trim())
    if (parts.length < 3) continue

    const [data, descricao, valorStr] = parts
    const valor = Math.abs(parseFloat(valorStr.replace(/\./g, '').replace(',', '.')))
    const tipo = valorStr.includes('-') ? 'despesa' : 'receita'

    transacoes.push({
      data: formatDateToISO(data),
      descricao,
      valor,
      tipo
    })
  }

  return transacoes
}

// ========================================
// ITAÚ
// ========================================
export function parseItauCSV(content: string): TransacaoParsed[] {
  const lines = content.split('\n').filter(line => line.trim())
  const transacoes: TransacaoParsed[] = []

  // Itaú formato: data,lançamento,ag.origem,valor,saldo
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',').map(p => p.replace(/"/g, '').trim())
    if (parts.length < 4) continue

    const [data, descricao, , valorStr] = parts
    const valor = Math.abs(parseFloat(valorStr.replace(/\./g, '').replace(',', '.')))
    const tipo = valorStr.includes('-') ? 'despesa' : 'receita'

    transacoes.push({
      data: formatDateToISO(data),
      descricao,
      valor,
      tipo
    })
  }

  return transacoes
}

// ========================================
// BANCO DO BRASIL
// ========================================
export function parseBBCSV(content: string): TransacaoParsed[] {
  const lines = content.split('\n').filter(line => line.trim())
  const transacoes: TransacaoParsed[] = []

  // BB formato: Data;Histórico;Débito;Crédito;Saldo
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(';').map(p => p.replace(/"/g, '').trim())
    if (parts.length < 5) continue

    const [data, descricao, debito, credito] = parts
    
    let valor = 0
    let tipo: 'receita' | 'despesa' = 'despesa'
    
    if (debito && parseFloat(debito.replace(/\./g, '').replace(',', '.')) > 0) {
      valor = parseFloat(debito.replace(/\./g, '').replace(',', '.'))
      tipo = 'despesa'
    } else if (credito && parseFloat(credito.replace(/\./g, '').replace(',', '.')) > 0) {
      valor = parseFloat(credito.replace(/\./g, '').replace(',', '.'))
      tipo = 'receita'
    }

    if (valor > 0) {
      transacoes.push({
        data: formatDateToISO(data),
        descricao,
        valor,
        tipo
      })
    }
  }

  return transacoes
}

// ========================================
// CAIXA ECONÔMICA FEDERAL
// ========================================
export function parseCaixaCSV(content: string): TransacaoParsed[] {
  const lines = content.split('\n').filter(line => line.trim())
  const transacoes: TransacaoParsed[] = []

  // Caixa formato: Data;Descrição;Valor;Tipo
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(';').map(p => p.replace(/"/g, '').trim())
    if (parts.length < 3) continue

    const [data, descricao, valorStr] = parts
    const valor = Math.abs(parseFloat(valorStr.replace(/\./g, '').replace(',', '.')))
    const tipo = valorStr.includes('-') ? 'despesa' : 'receita'

    transacoes.push({
      data: formatDateToISO(data),
      descricao,
      valor,
      tipo
    })
  }

  return transacoes
}

// ========================================
// GENÉRICO (Tenta detectar automaticamente)
// ========================================
export function parseGenericCSV(content: string): TransacaoParsed[] {
  const lines = content.split('\n').filter(line => line.trim())
  const transacoes: TransacaoParsed[] = []

  // Detectar separador (vírgula ou ponto-e-vírgula)
  const separator = content.includes(';') ? ';' : ','

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(separator).map(p => p.replace(/"/g, '').trim())
    if (parts.length < 3) continue

    // Tentar encontrar data, descrição e valor
    let data = ''
    let descricao = ''
    let valor = 0
    let tipo: 'receita' | 'despesa' = 'despesa'

    // Buscar data (formato DD/MM/YYYY ou YYYY-MM-DD)
    for (const part of parts) {
      if (/\d{2}\/\d{2}\/\d{4}/.test(part) || /\d{4}-\d{2}-\d{2}/.test(part)) {
        data = part
        break
      }
    }

    // Buscar valor (número com vírgula ou ponto)
    for (const part of parts) {
      const cleanValue = part.replace(/[^\d,.-]/g, '')
      if (/^-?\d+[.,]\d+$/.test(cleanValue) || /^-?\d+$/.test(cleanValue)) {
        const parsedValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'))
        if (!isNaN(parsedValue) && parsedValue !== 0) {
          valor = Math.abs(parsedValue)
          tipo = parsedValue < 0 ? 'despesa' : 'receita'
          break
        }
      }
    }

    // Buscar descrição (primeira string que não é data nem valor)
    for (const part of parts) {
      if (part !== data && !/^-?\d+[.,]\d+$/.test(part.replace(/[^\d,.-]/g, '')) && part.length > 2) {
        descricao = part
        break
      }
    }

    if (data && descricao && valor > 0) {
      transacoes.push({
        data: formatDateToISO(data),
        descricao,
        valor,
        tipo
      })
    }
  }

  return transacoes
}

// ========================================
// UTILITÁRIOS
// ========================================
function formatDateToISO(dateStr: string): string {
  // Tentar diferentes formatos de data
  
  // DD/MM/YYYY
  if (/\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // YYYY-MM-DD (já é ISO)
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr
  }
  
  // DD-MM-YYYY
  if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // MM/DD/YYYY (formato americano)
  if (/\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const [month, day, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Se não conseguir parsear, retorna data atual
  return new Date().toISOString().split('T')[0]
}
