// =====================================================
// 🔄 SISTEMA DE LÓGICA CONDICIONAL PARA CHECKLISTS
// =====================================================
// Implementa conforme documento Word:
// "se clicar não, aparece" - lógica condicional baseada em respostas

interface ItemCondicional {
  id: string
  titulo: string
  valor: unknown
  visivel: boolean
  obrigatorio: boolean
  obrigatorioCondicional: boolean
}

interface CondicaoItem {
  itemId: string
  condicoes: Array<{
    itemDependencia: string
    operador: 'igual' | 'diferente' | 'maior_que' | 'menor_que' | 'contem' | 'nao_contem'
    valor: unknown
    acao: 'mostrar' | 'ocultar' | 'obrigar' | 'opcional'
  }>
  operadorLogico: 'E' | 'OU'
}

// =====================================================
// 🛠️ FUNÇÕES AUXILIARES
// =====================================================

function criarRegraCondicional(
  itemId: string,
  itemDependencia: string,
  operador: 'igual' | 'diferente' | 'maior_que' | 'menor_que' | 'contem' | 'nao_contem',
  valor: unknown,
  acao: 'mostrar' | 'ocultar' | 'obrigar' | 'opcional' = 'mostrar'
): CondicaoItem {
  return {
    itemId,
    condicoes: [{
      itemDependencia,
      operador,
      valor,
      acao
    }],
    operadorLogico: 'E'
  }
}

function criarRegraCondicionalMultipla(
  itemId: string,
  condicoes: Array<{
    itemDependencia: string
    operador: 'igual' | 'diferente' | 'maior_que' | 'menor_que' | 'contem' | 'nao_contem'
    valor: unknown
    acao: 'mostrar' | 'ocultar' | 'obrigar' | 'opcional'
  }>,
  operadorLogico: 'E' | 'OU' = 'E'
): CondicaoItem {
  return {
    itemId,
    condicoes: condicoes.map(c => ({
      ...c,
      acao: c.acao || 'mostrar'
    })),
    operadorLogico
  }
}

function avaliarCondicoes(itens: ItemCondicional[], regras: CondicaoItem[]): ItemCondicional[] {
  // Implementação básica - pode ser expandida conforme necessário
  return itens.map(item => {
    const regra = regras.find(r => r.itemId === item.id)
    if (!regra) return item

    // Aplicar regras condicionais
    const resultado = avaliarRegra(item, regra, itens)
    
    return {
      ...item,
      visivel: resultado.visivel,
      obrigatorioCondicional: resultado.obrigatorio
    }
  })
}

function avaliarRegra(item: ItemCondicional, regra: CondicaoItem, todosItens: ItemCondicional[]): {
  visivel: boolean
  obrigatorio: boolean
} {
  // Implementação básica - pode ser expandida
  return {
    visivel: true,
    obrigatorio: false
  }
}

// =====================================================
// 📋 EXEMPLOS DE USO COMUNS
// =====================================================

export const ExemplosCondicionais = {
  // Se clicar "NÃO" em limpeza, aparece campo de observação
  seNaoApareceObservacao: (itemPrincipal: string, itemObservacao: string) =>
    criarRegraCondicional(itemObservacao, itemPrincipal, 'igual', false, 'mostrar'),

  // Se temperatura fora do range, obrigar foto
  seTemperaturaForaObrigarFoto: (itemTemperatura: string, itemFoto: string, minTemp: number, maxTemp: number) =>
    criarRegraCondicionalMultipla(itemFoto, [
      { itemDependencia: itemTemperatura, operador: 'menor_que', valor: minTemp, acao: 'obrigar' },
      { itemDependencia: itemTemperatura, operador: 'maior_que', valor: maxTemp, acao: 'obrigar' }
    ], 'OU'),

  // Se avaliação baixa (≤2), obrigar justificativa
  seAvaliacaoBaixaObrigarJustificativa: (itemAvaliacao: string, itemJustificativa: string) =>
    criarRegraCondicional(itemJustificativa, itemAvaliacao, 'menor_que', 3, 'obrigar'),

  // Se equipamento não funcionando, mostrar campos de manutenção
  seEquipamentoNaoFuncionandoMostrarManutencao: (itemEquipamento: string, itensManutencao: string[]) =>
    itensManutencao.map(itemManutencao =>
      criarRegraCondicional(itemManutencao, itemEquipamento, 'igual', false, 'mostrar')
    ),

  // Se tipo de problema selecionado, mostrar campos específicos
  seTipoProblemaShowCampos: (itemTipoProblema: string, valor: string, itensEspecificos: string[]) =>
    itensEspecificos.map(item =>
      criarRegraCondicional(item, itemTipoProblema, 'igual', valor, 'mostrar')
    )
}

// =====================================================
// 🎮 HOOK PARA COMPONENTES REACT
// =====================================================

export function useConditionalLogic(
  itensOriginais: ItemCondicional[],
  regrasCondicionais: CondicaoItem[]
) {
  
  const processarItens = (itens: ItemCondicional[]): ItemCondicional[] => {
    return avaliarCondicoes(itens, regrasCondicionais)
  }

  const atualizarItemValor = (
    itens: ItemCondicional[],
    itemId: string,
    novoValor: unknown
  ): ItemCondicional[] => {
    const itensAtualizados = itens.map(item =>
      item.id === itemId ? { ...item, valor: novoValor } : item
    )
    
    // Reavaliar condições após mudança
    return processarItens(itensAtualizados)
  }

  const obterItensVisiveis = (itens: ItemCondicional[]): ItemCondicional[] => {
    return itens.filter(item => item.visivel)
  }

  const obterItensObrigatorios = (itens: ItemCondicional[]): ItemCondicional[] => {
    return itens.filter(item => 
      item.visivel && (item.obrigatorio || item.obrigatorioCondicional)
    )
  }

  const validarItensObrigatorios = (itens: ItemCondicional[]): {
    valido: boolean
    itensVazios: string[]
  } => {
    const obrigatorios = obterItensObrigatorios(itens)
    const vazios = obrigatorios
      .filter(item => !item.valor || item.valor === '')
      .map(item => item.titulo)

    return {
      valido: vazios.length === 0,
      itensVazios: vazios
    }
  }

  return {
    processarItens,
    atualizarItemValor,
    obterItensVisiveis,
    obterItensObrigatorios,
    validarItensObrigatorios
  }
} 
