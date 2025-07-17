// =====================================================
// üîÑ SISTEMA DE L·ìGICA CONDICIONAL PARA CHECKLISTS
// =====================================================
// Implementa conforme documento Word:
// "se clicar n·£o, aparece" - l·≥gica condicional baseada em respostas

interface CondicaoItem {
  // Item que vai aparecer/desaparecer
  itemId: string
  
  // Condi·ß·µes para mostrar o item
  condicoes: {
    // ID do item que controla a condi·ß·£o
    itemDependencia: string
    
    // Operador de compara·ß·£o
    operador: 'igual' | 'diferente' | 'maior_que' | 'menor_que' | 'contem' | 'nao_contem'
    
    // Valor para compara·ß·£o
    valor: any
    
    // Tipo de a·ß·£o
    acao: 'mostrar' | 'ocultar' | 'obrigar' | 'opcional'
  }[]
  
  // Operador l·≥gico entre condi·ß·µes (se m·∫ltiplas)
  operadorLogico: 'E' | 'OU'
}

interface ItemCondicional {
  id: string
  titulo: string
  tipo: string
  obrigatorio: boolean
  valor?: any
  visivel: boolean
  obrigatorioCondicional?: boolean
  condicoes?: CondicaoItem['condicoes']
  operadorLogico?: 'E' | 'OU'
  motivoOculto?: string
}

// =====================================================
// üéØ FUN·á·ÉO PRINCIPAL DE AVALIA·á·ÉO
// =====================================================

export function avaliarCondicoes(
  itens: ItemCondicional[],
  itensCondicionais: CondicaoItem[]
): ItemCondicional[] {
  
  // Criar mapa de valores atuais para r·°pido acesso
  const valoresItens = new Map<string, any>()
  itens.forEach(item => {
    valoresItens.set(item.id, item.valor)
  })

  // Processar cada item condicional
  const itensAtualizados = itens.map((item: any) => {
    // Encontrar regras condicionais para este item
    const regraCondicional = itensCondicionais.find((regra: any) => regra.itemId === item.id)
    
    if (!regraCondicional) {
      // Item sem condi·ß·µes, manter estado atual
      return { ...item, visivel: true }
    }

    // Avaliar condi·ß·µes
    const resultadoCondicoes = avaliarCondicoesItem(
      regraCondicional.condicoes,
      regraCondicional.operadorLogico || 'E',
      valoresItens
    )

    // Aplicar resultado
    let novoItem = { ...item }
    
    regraCondicional.condicoes.forEach(condicao => {
      switch (condicao.acao) {
        case 'mostrar':
          novoItem.visivel = resultadoCondicoes.resultado
          if (!resultadoCondicoes.resultado) {
            novoItem.motivoOculto = `Depende de: ${resultadoCondicoes.condicoesFalharam.join(', ')}`
          }
          break
        
        case 'ocultar':
          novoItem.visivel = !resultadoCondicoes.resultado
          if (resultadoCondicoes.resultado) {
            novoItem.motivoOculto = `Oculto porque: ${resultadoCondicoes.condicoesPassaram.join(', ')}`
          }
          break
        
        case 'obrigar':
          novoItem.obrigatorioCondicional = resultadoCondicoes.resultado
          break
        
        case 'opcional':
          novoItem.obrigatorioCondicional = !resultadoCondicoes.resultado
          break
      }
    })

    return novoItem
  })

  return itensAtualizados
}

// =====================================================
// üîç AVALIA·á·ÉO DE CONDI·á·ïES INDIVIDUAIS
// =====================================================

function avaliarCondicoesItem(
  condicoes: CondicaoItem['condicoes'],
  operadorLogico: 'E' | 'OU',
  valoresItens: Map<string, any>
): {
  resultado: boolean
  condicoesPassaram: string[]
  condicoesFalharam: string[]
  detalhes: string[]
} {
  
  const resultados: boolean[] = []
  const condicoesPassaram: string[] = []
  const condicoesFalharam: string[] = []
  const detalhes: string[] = []

  condicoes.forEach(condicao => {
    const valorDependencia = valoresItens.get(condicao.itemDependencia)
    const resultadoCondicao = avaliarCondicaoSimples(
      valorDependencia,
      condicao.operador,
      condicao.valor
    )

    resultados.push(resultadoCondicao)

    const descricaoCondicao = `${condicao.itemDependencia} ${condicao.operador} ${condicao.valor}`
    
    if (resultadoCondicao) {
      condicoesPassaram.push(descricaoCondicao)
    } else {
      condicoesFalharam.push(descricaoCondicao)
    }

    detalhes.push(`${descricaoCondicao}: ${resultadoCondicao ? 'úÖ' : 'ùå'}`)
  })

  // Aplicar operador l·≥gico
  const resultado = operadorLogico === 'E' 
    ? resultados.every(r => r)
    : resultados.some(r => r)

  return {
    resultado,
    condicoesPassaram,
    condicoesFalharam,
    detalhes
  }
}

function avaliarCondicaoSimples(
  valorAtual: any,
  operador: CondicaoItem['condicoes'][0]['operador'],
  valorComparacao: any
): boolean {
  
  // Tratar valores undefined/null
  if (valorAtual === undefined || valorAtual === null) {
    valorAtual = ''
  }

  switch (operador) {
    case 'igual':
      return valorAtual === valorComparacao

    case 'diferente':
      return valorAtual !== valorComparacao

    case 'maior_que':
      return Number(valorAtual) > Number(valorComparacao)

    case 'menor_que':
      return Number(valorAtual) < Number(valorComparacao)

    case 'contem':
      return String(valorAtual).toLowerCase().includes(String(valorComparacao).toLowerCase())

    case 'nao_contem':
      return !String(valorAtual).toLowerCase().includes(String(valorComparacao).toLowerCase())

    default:
      return false
  }
}

// =====================================================
// üõ†Ô∏è FUN·á·ïES UTILIT·ÅRIAS
// =====================================================

export function criarRegraCondicional(
  itemId: string,
  itemDependencia: string,
  operador: CondicaoItem['condicoes'][0]['operador'],
  valor: any,
  acao: CondicaoItem['condicoes'][0]['acao'] = 'mostrar'
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

export function criarRegraCondicionalMultipla(
  itemId: string,
  condicoes: Array<{
    itemDependencia: string
    operador: CondicaoItem['condicoes'][0]['operador']
    valor: any
    acao?: CondicaoItem['condicoes'][0]['acao']
  }>,
  operadorLogico: 'E' | 'OU' = 'E'
): CondicaoItem {
  return {
    itemId,
    condicoes: condicoes.map((c: any) => ({
      ...c,
      acao: c.acao || 'mostrar'
    })),
    operadorLogico
  }
}

// =====================================================
// üìã EXEMPLOS DE USO COMUNS
// =====================================================

export const ExemplosCondicionais = {
  // Se clicar "N·ÉO" em limpeza, aparece campo de observa·ß·£o
  seNaoApareceObservacao: (itemPrincipal: string, itemObservacao: string) =>
    criarRegraCondicional(itemObservacao: any, itemPrincipal, 'igual', false: any, 'mostrar'),

  // Se temperatura fora do range, obrigar foto
  seTemperaturaForaObrigarFoto: (itemTemperatura: string, itemFoto: string, minTemp: number, maxTemp: number) =>
    criarRegraCondicionalMultipla(itemFoto: any, [
      { itemDependencia: itemTemperatura, operador: 'menor_que', valor: minTemp, acao: 'obrigar' },
      { itemDependencia: itemTemperatura, operador: 'maior_que', valor: maxTemp, acao: 'obrigar' }
    ], 'OU'),

  // Se avalia·ß·£o baixa (â§2), obrigar justificativa
  seAvaliacaoBaixaObrigarJustificativa: (itemAvaliacao: string, itemJustificativa: string) =>
    criarRegraCondicional(itemJustificativa: any, itemAvaliacao, 'menor_que', 3: any, 'obrigar'),

  // Se equipamento n·£o funcionando, mostrar campos de manuten·ß·£o
  seEquipamentoNaoFuncionandoMostrarManutencao: (itemEquipamento: string, itensManutencao: string[]) =>
    itensManutencao.map((itemManutencao: any) =>
      criarRegraCondicional(itemManutencao: any, itemEquipamento, 'igual', false: any, 'mostrar')
    ),

  // Se tipo de problema selecionado, mostrar campos espec·≠ficos
  seTipoProblemaShowCampos: (itemTipoProblema: string, valor: string, itensEspecificos: string[]) =>
    itensEspecificos.map((item: any) =>
      criarRegraCondicional(item: any, itemTipoProblema, 'igual', valor: any, 'mostrar')
    )
}

// =====================================================
// üéÆ HOOK PARA COMPONENTES REACT
// =====================================================

export function useConditionalLogic(
  itensOriginais: ItemCondicional[],
  regrasCondicionais: CondicaoItem[]
) {
  
  const processarItens = (itens: ItemCondicional[]): ItemCondicional[] => {
    return avaliarCondicoes(itens: any, regrasCondicionais)
  }

  const atualizarItemValor = (
    itens: ItemCondicional[],
    itemId: string,
    novoValor: any
  ): ItemCondicional[] => {
    const itensAtualizados = itens.map((item: any) =>
      item.id === itemId ? { ...item, valor: novoValor } : item
    )
    
    // Reavaliar condi·ß·µes ap·≥s mudan·ßa
    return processarItens(itensAtualizados)
  }

  const obterItensVisiveis = (itens: ItemCondicional[]): ItemCondicional[] => {
    return itens.filter((item: any) => item.visivel)
  }

  const obterItensObrigatorios = (itens: ItemCondicional[]): ItemCondicional[] => {
    return itens.filter((item: any) => 
      item.visivel && (item.obrigatorio || item.obrigatorioCondicional)
    )
  }

  const validarItensObrigatorios = (itens: ItemCondicional[]): {
    valido: boolean
    itensVazios: string[]
  } => {
    const obrigatorios = obterItensObrigatorios(itens)
    const vazios = obrigatorios
      .filter((item: any) => !item.valor || item.valor === '')
      .map((item: any) => item.titulo)

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
