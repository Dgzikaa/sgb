// Sistema de categorização automática de transações

interface Categoria {
  id: string
  nome: string
  tipo: string
}

interface Regra {
  id: string
  categoria_id: string
  palavra_chave: string
  prioridade: number
  categoria?: Categoria
}

/**
 * Categoriza uma transação automaticamente baseado em regras
 */
export function categorizarTransacao(
  descricao: string,
  tipo: string,
  regras: Regra[],
  categorias: Categoria[]
): string | null {
  const descricaoLower = descricao.toLowerCase()

  // 1. Verificar regras customizadas do usuário (ordenadas por prioridade)
  for (const regra of regras) {
    const palavraChave = regra.palavra_chave.toLowerCase()
    
    if (descricaoLower.includes(palavraChave)) {
      // Verificar se a categoria da regra é do mesmo tipo da transação
      if (regra.categoria && regra.categoria.tipo === tipo) {
        return regra.categoria_id
      }
    }
  }

  // 2. Regras padrão inteligentes
  const categoriaId = aplicarRegrasPadrao(descricaoLower, tipo, categorias)
  if (categoriaId) {
    return categoriaId
  }

  // 3. Não conseguiu categorizar
  return null
}

/**
 * Regras padrão de categorização (fallback)
 */
function aplicarRegrasPadrao(descricao: string, tipo: string, categorias: Categoria[]): string | null {
  // Mapear palavras-chave para nomes de categorias
  const regras: { [key: string]: string[] } = {
    // Alimentação
    'Alimentação': ['restaurante', 'lanchonete', 'padaria', 'bar', 'cafe', 'pizza', 'burguer', 'ifood', 'rappi', 'uber eats'],
    'Supermercado': ['supermercado', 'mercado', 'hortifruti', 'açougue', 'mercadinho'],
    'Delivery': ['ifood', 'rappi', 'uber eats', 'delivery'],
    
    // Transporte
    'Combustível': ['posto', 'gasolina', 'etanol', 'combustivel', 'shell', 'ipiranga', 'br'],
    'Uber/Táxi': ['uber', 'taxi', '99', 'cabify'],
    'Transporte Público': ['metrô', 'metro', 'onibus', 'trem', 'brt', 'bilhete unico'],
    
    // Moradia
    'Aluguel': ['aluguel', 'locação', 'locacao'],
    'Energia': ['energia', 'luz', 'eletrica', 'celesc', 'copel', 'cemig'],
    'Água': ['agua', 'saneamento', 'sabesp'],
    'Internet': ['internet', 'vivo fibra', 'claro', 'tim', 'oi fibra'],
    'Condomínio': ['condominio', 'cond.'],
    
    // Saúde
    'Farmácia': ['farmacia', 'drogaria', 'droga', 'pague menos', 'drogasil'],
    'Plano de Saúde': ['plano', 'unimed', 'amil', 'sulamerica', 'bradesco saude'],
    
    // Lazer
    'Streaming': ['netflix', 'spotify', 'disney', 'prime video', 'hbo', 'youtube premium'],
    'Cinema/Teatro': ['cinema', 'cinemark', 'teatro', 'ingresso'],
    
    // Vestuário
    'Vestuário': ['renner', 'c&a', 'riachuelo', 'zara', 'nike', 'adidas', 'loja de roupa'],
    
    // Receitas
    'Salário': ['salario', 'salário', 'pagamento', 'pix recebido', 'transferencia recebida'],
  }

  // Buscar categoria correspondente
  for (const [nomeCategoria, palavrasChave] of Object.entries(regras)) {
    for (const palavra of palavrasChave) {
      if (descricao.includes(palavra)) {
        // Encontrar categoria pelo nome
        const categoria = categorias.find(c => 
          c.nome.toLowerCase() === nomeCategoria.toLowerCase() && 
          c.tipo === tipo
        )
        
        if (categoria) {
          return categoria.id
        }
      }
    }
  }

  return null
}

/**
 * Sugerir categorização para o usuário criar uma regra
 */
export function sugerirCategoria(
  descricao: string,
  tipo: string,
  categorias: Categoria[]
): { categoria: Categoria; palavraChave: string } | null {
  const descricaoLower = descricao.toLowerCase()
  
  // Extrair palavras-chave relevantes da descrição
  const palavras = descricaoLower
    .split(/\s+/)
    .filter(p => p.length > 3)
    .filter(p => !['ltda', 'eireli', 'me', 'epp', 'sa'].includes(p))

  if (palavras.length === 0) return null

  // Tentar aplicar regras padrão para sugerir
  const categoriaId = aplicarRegrasPadrao(descricaoLower, tipo, categorias)
  
  if (categoriaId) {
    const categoria = categorias.find(c => c.id === categoriaId)
    if (categoria) {
      return {
        categoria,
        palavraChave: palavras[0] // Primeira palavra relevante
      }
    }
  }

  return null
}
