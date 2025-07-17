// Sistema Inteligente de Mapeamento de Categorias - ContaAzul
// Analisa descrições e mapeia automaticamente para categorias apropriadas

export interface CategoriaMapping {
  categoria_sugerida: string;
  categoria_id?: string;
  centro_custo_sugerido?: string;
  centro_custo_id?: string;
  confianca: number; // 0-100
  motivo: string;
}

export interface RegraCategoria {
  pattern: RegExp | string;
  categoria: string;
  centro_custo?: string;
  tipo?: 'RECEITA' | 'DESPESA';
  confianca: number;
  descricao: string;
}

// Regras baseadas na análise dos dados reais do bar
const REGRAS_MAPEAMENTO: RegraCategoria[] = [
  // RECEITAS - VENDAS
  {
    pattern: /crédito domicílio cartão.*stone.*d[eé]bito/i,
    categoria: 'Stone Débito',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Vendas com cartão de débito via Stone'
  },
  {
    pattern: /crédito domicílio cartão.*stone/i,
    categoria: 'Stone Crédito',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Vendas com cartão de crédito via Stone'
  },
  {
    pattern: /pix recebido|pix \| maquininha|pix recebido -/i,
    categoria: 'Stone Pix',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Recebimentos via Pix (Stone ou Maquininha)'
  },
  {
    pattern: /dinheiro/i,
    categoria: 'Dinheiro',
    tipo: 'RECEITA',
    confianca: 95,
    descricao: 'Recebimentos em dinheiro'
  },
  {
    pattern: /transfer[êe]ncia recebida/i,
    categoria: 'Pix Direto na Conta',
    tipo: 'RECEITA',
    confianca: 95,
    descricao: 'Transferências recebidas direto na conta'
  },
  {
    pattern: /bilheteria|evento/i,
    categoria: 'Receita de Eventos',
    tipo: 'RECEITA',
    confianca: 90,
    descricao: 'Receita de eventos/bilheteria'
  },
  {
    pattern: /patroc[ií]nio|ambev/i,
    categoria: 'Outras Receitas',
    tipo: 'RECEITA',
    confianca: 90,
    descricao: 'Receitas de patrocínio'
  },
  {
    pattern: /receita/i,
    categoria: 'Outras Receitas',
    tipo: 'RECEITA',
    confianca: 80,
    descricao: 'Receitas diversas'
  },
  // RECEITAS - ESPECIAIS
  {
    pattern: /patrocínio/i,
    categoria: 'RECEITAS_PATROCINIO',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Receitas de patrocínio'
  },
  {
    pattern: /ambev/i,
    categoria: 'RECEITAS_PATROCINIO',
    tipo: 'RECEITA',
    confianca: 95,
    descricao: 'Patrocínio Ambev'
  },

  // DESPESAS - PESSOAL (PIX para pessoas físicas)
  {
    pattern: /pix enviado.*(?:[A-Z][a-z]+ ){2,}/i,
    categoria: 'DESPESAS_PESSOAL',
    centro_custo: 'RECURSOS_HUMANOS',
    tipo: 'DESPESA',
    confianca: 85,
    descricao: 'Pagamentos a pessoas físicas via PIX'
  },

  // DESPESAS - FORNECEDORES (empresas)
  {
    pattern: /pagamento efetuado.*ltda|pagamento efetuado.*sa\b/i,
    categoria: 'DESPESAS_FORNECEDORES',
    centro_custo: 'OPERACIONAL',
    tipo: 'DESPESA',
    confianca: 90,
    descricao: 'Pagamentos a fornecedores/empresas'
  },

  // DESPESAS - MANUTENÇÃO E REPAROS
  {
    pattern: /reparos|construção|material.*construção|construcoes/i,
    categoria: 'DESPESAS_MANUTENCAO',
    centro_custo: 'MANUTENCAO',
    tipo: 'DESPESA',
    confianca: 95,
    descricao: 'Despesas de manutenção e reparos'
  },

  // DESPESAS - UTILIDADES
  {
    pattern: /débito automático.*caesb|energia|água|gás/i,
    categoria: 'DESPESAS_UTILIDADES',
    centro_custo: 'OPERACIONAL',
    tipo: 'DESPESA',
    confianca: 98,
    descricao: 'Contas de utilidades (luz, água, gás)'
  },

  // DESPESAS - ALUGUEL E CONDOMÍNIO
  {
    pattern: /condomínio|condominio|aluguel/i,
    categoria: 'DESPESAS_ALUGUEL',
    centro_custo: 'ADMINISTRATIVO',
    tipo: 'DESPESA',
    confianca: 95,
    descricao: 'Despesas de aluguel e condomínio'
  },

  // DESPESAS - EQUIPAMENTOS E LOCAÇÃO
  {
    pattern: /locação|loc\s|equipamentos|bomtempo/i,
    categoria: 'DESPESAS_EQUIPAMENTOS',
    centro_custo: 'OPERACIONAL',
    tipo: 'DESPESA',
    confianca: 90,
    descricao: 'Locação de equipamentos'
  }
];

export function mapearCategoria(
  descricao: string, 
  tipo: 'RECEITA' | 'DESPESA',
  valor: number = 0
): CategoriaMapping {
  
  if (!descricao) {
    return {
      categoria_sugerida: 'NAO_CLASSIFICADO',
      confianca: 0,
      motivo: 'Descrição vazia'
    };
  }

  // Testar regras em ordem de prioridade
  for (const regra of REGRAS_MAPEAMENTO) {
    let match = false;

    // Verificar tipo se especificado
    if (regra.tipo && regra.tipo !== tipo) {
      continue;
    }

    // Verificar pattern
    if (regra.pattern instanceof RegExp) {
      match = regra.pattern.test(descricao);
    } else {
      match = descricao.toLowerCase().includes(regra.pattern.toLowerCase());
    }

    if (match) {
      return {
        categoria_sugerida: regra.categoria,
        centro_custo_sugerido: regra.centro_custo,
        confianca: regra.confianca,
        motivo: regra.descricao
      };
    }
  }

  // Regras gerais de fallback baseadas no tipo
  if (tipo === 'RECEITA') {
    return {
      categoria_sugerida: 'RECEITAS_DIVERSAS',
      confianca: 50,
      motivo: 'Receita não classificada - revisar manualmente'
    };
  } else {
    // Análise básica para despesas não classificadas
    if (valor > 50000) { // > R$ 500
      return {
        categoria_sugerida: 'DESPESAS_OPERACIONAIS',
        centro_custo_sugerido: 'OPERACIONAL',
        confianca: 40,
        motivo: 'Despesa alta não classificada - revisar manualmente'
      };
    } else {
      return {
        categoria_sugerida: 'DESPESAS_PEQUENAS',
        centro_custo_sugerido: 'ADMINISTRATIVO',
        confianca: 30,
        motivo: 'Despesa pequena não classificada'
      };
    }
  }
}

export function analisarLote(parcelas: any[]): {
  total_analisadas: number;
  total_classificadas: number;
  confianca_media: number;
  categorias_encontradas: Record<string, number>;
  casos_revisar: any[];
} {
  const resultado = {
    total_analisadas: parcelas.length,
    total_classificadas: 0,
    confianca_media: 0,
    categorias_encontradas: {} as Record<string, number>,
    casos_revisar: [] as any[]
  };

  let somaConfianca = 0;

  for (const parcela of parcelas) {
    const descricao = parcela.dados_completos?.item_original?.descricao || '';
    const tipo = parcela.dados_completos?.tipo || 'DESPESA';
    const valor = parseFloat(parcela.dados_completos?.item_original?.total || '0');

    const mapping = mapearCategoria(descricao, tipo, valor);
    
    somaConfianca += mapping.confianca;
    
    if (mapping.confianca > 0) {
      resultado.total_classificadas++;
    }

    // Contar categorias
    const categoria = mapping.categoria_sugerida;
    resultado.categorias_encontradas[categoria] = (resultado.categorias_encontradas[categoria] || 0) + 1;

    // Casos para revisão (baixa confiança)
    if (mapping.confianca < 70) {
      resultado.casos_revisar.push({
        descricao,
        tipo,
        valor,
        categoria_sugerida: mapping.categoria_sugerida,
        confianca: mapping.confianca,
        motivo: mapping.motivo
      });
    }
  }

  resultado.confianca_media = parcelas.length > 0 ? somaConfianca / parcelas.length : 0;

  return resultado;
}

export function gerarRelatorioClassificacao(analise: ReturnType<typeof analisarLote>): string {
  const { total_analisadas, total_classificadas, confianca_media, categorias_encontradas, casos_revisar } = analise;
  
  let relatorio = `📊 RELATÓRIO DE CLASSIFICAÇÃO AUTOMÁTICA\n\n`;
  relatorio += `✅ Total analisado: ${total_analisadas} parcelas\n`;
  relatorio += `🎯 Classificadas: ${total_classificadas} (${Math.round(total_classificadas/total_analisadas*100)}%)\n`;
  relatorio += `📈 Confiança média: ${Math.round(confianca_media)}%\n\n`;

  relatorio += `📂 CATEGORIAS ENCONTRADAS:\n`;
  const categoriasOrdenadas = Object.entries(categorias_encontradas)
    .sort(([,a], [,b]) => b - a);
    
  for (const [categoria, count] of categoriasOrdenadas) {
    relatorio += `• ${categoria}: ${count} parcelas\n`;
  }

  relatorio += `\n⚠️ CASOS PARA REVISÃO (${casos_revisar.length}):\n`;
  for (const caso of casos_revisar.slice(0, 10)) { // Mostrar apenas 10 primeiros
    relatorio += `• "${caso.descricao}" → ${caso.categoria_sugerida} (${caso.confianca}%)\n`;
  }

  if (casos_revisar.length > 10) {
    relatorio += `... e mais ${casos_revisar.length - 10} casos\n`;
  }

  return relatorio;
} 
