// Sistema Inteligente de Mapeamento de Categorias - ContaAzul
// Analisa descriá§áµes e mapeia automaticamente para categorias apropriadas

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

// Regras baseadas na aná¡lise dos dados reais do bar
const REGRAS_MAPEAMENTO: RegraCategoria[] = [
  // RECEITAS - VENDAS
  {
    pattern: /crá©dito domicá­lio cartá£o.*stone.*d[eá©]bito/i,
    categoria: 'Stone Dá©bito',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Vendas com cartá£o de dá©bito via Stone'
  },
  {
    pattern: /crá©dito domicá­lio cartá£o.*stone/i,
    categoria: 'Stone Crá©dito',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Vendas com cartá£o de crá©dito via Stone'
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
    pattern: /transfer[áªe]ncia recebida/i,
    categoria: 'Pix Direto na Conta',
    tipo: 'RECEITA',
    confianca: 95,
    descricao: 'Transferáªncias recebidas direto na conta'
  },
  {
    pattern: /bilheteria|evento/i,
    categoria: 'Receita de Eventos',
    tipo: 'RECEITA',
    confianca: 90,
    descricao: 'Receita de eventos/bilheteria'
  },
  {
    pattern: /patroc[iá­]nio|ambev/i,
    categoria: 'Outras Receitas',
    tipo: 'RECEITA',
    confianca: 90,
    descricao: 'Receitas de patrocá­nio'
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
    pattern: /patrocá­nio/i,
    categoria: 'RECEITAS_PATROCINIO',
    tipo: 'RECEITA',
    confianca: 98,
    descricao: 'Receitas de patrocá­nio'
  },
  {
    pattern: /ambev/i,
    categoria: 'RECEITAS_PATROCINIO',
    tipo: 'RECEITA',
    confianca: 95,
    descricao: 'Patrocá­nio Ambev'
  },

  // DESPESAS - PESSOAL (PIX para pessoas fá­sicas)
  {
    pattern: /pix enviado.*(?:[A-Z][a-z]+ ){2,}/i,
    categoria: 'DESPESAS_PESSOAL',
    centro_custo: 'RECURSOS_HUMANOS',
    tipo: 'DESPESA',
    confianca: 85,
    descricao: 'Pagamentos a pessoas fá­sicas via PIX'
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

  // DESPESAS - MANUTENá‡áƒO E REPAROS
  {
    pattern: /reparos|construá§á£o|material.*construá§á£o|construcoes/i,
    categoria: 'DESPESAS_MANUTENCAO',
    centro_custo: 'MANUTENCAO',
    tipo: 'DESPESA',
    confianca: 95,
    descricao: 'Despesas de manutená§á£o e reparos'
  },

  // DESPESAS - UTILIDADES
  {
    pattern: /dá©bito automá¡tico.*caesb|energia|á¡gua|gá¡s/i,
    categoria: 'DESPESAS_UTILIDADES',
    centro_custo: 'OPERACIONAL',
    tipo: 'DESPESA',
    confianca: 98,
    descricao: 'Contas de utilidades (luz, á¡gua, gá¡s)'
  },

  // DESPESAS - ALUGUEL E CONDOMáNIO
  {
    pattern: /condomá­nio|condominio|aluguel/i,
    categoria: 'DESPESAS_ALUGUEL',
    centro_custo: 'ADMINISTRATIVO',
    tipo: 'DESPESA',
    confianca: 95,
    descricao: 'Despesas de aluguel e condomá­nio'
  },

  // DESPESAS - EQUIPAMENTOS E LOCAá‡áƒO
  {
    pattern: /locaá§á£o|loc\s|equipamentos|bomtempo/i,
    categoria: 'DESPESAS_EQUIPAMENTOS',
    centro_custo: 'OPERACIONAL',
    tipo: 'DESPESA',
    confianca: 90,
    descricao: 'Locaá§á£o de equipamentos'
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
      motivo: 'Descriá§á£o vazia'
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
      motivo: 'Receita ná£o classificada - revisar manualmente'
    };
  } else {
    // Aná¡lise bá¡sica para despesas ná£o classificadas
    if (valor > 50000) { // > R$ 500
      return {
        categoria_sugerida: 'DESPESAS_OPERACIONAIS',
        centro_custo_sugerido: 'OPERACIONAL',
        confianca: 40,
        motivo: 'Despesa alta ná£o classificada - revisar manualmente'
      };
    } else {
      return {
        categoria_sugerida: 'DESPESAS_PEQUENAS',
        centro_custo_sugerido: 'ADMINISTRATIVO',
        confianca: 30,
        motivo: 'Despesa pequena ná£o classificada'
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

    // Casos para revisá£o (baixa confianá§a)
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
  
  let relatorio = `ðŸ“Š RELATá“RIO DE CLASSIFICAá‡áƒO AUTOMáTICA\n\n`;
  relatorio += `œ… Total analisado: ${total_analisadas} parcelas\n`;
  relatorio += `ðŸŽ¯ Classificadas: ${total_classificadas} (${Math.round(total_classificadas/total_analisadas*100)}%)\n`;
  relatorio += `ðŸ“ˆ Confianá§a má©dia: ${Math.round(confianca_media)}%\n\n`;

  relatorio += `ðŸ“‚ CATEGORIAS ENCONTRADAS:\n`;
  const categoriasOrdenadas = Object.entries(categorias_encontradas)
    .sort(([,a], [,b]) => b - a);
    
  for (const [categoria, count] of categoriasOrdenadas) {
    relatorio += `€¢ ${categoria}: ${count} parcelas\n`;
  }

  relatorio += `\nš ï¸ CASOS PARA REVISáƒO (${casos_revisar.length}):\n`;
  for (const caso of casos_revisar.slice(0, 10)) { // Mostrar apenas 10 primeiros
    relatorio += `€¢ "${caso.descricao}" †’ ${caso.categoria_sugerida} (${caso.confianca}%)\n`;
  }

  if (casos_revisar.length > 10) {
    relatorio += `... e mais ${casos_revisar.length - 10} casos\n`;
  }

  return relatorio;
} 
